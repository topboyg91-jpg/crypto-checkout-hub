#!/usr/bin/env bash
# One-command production deployment for Kali/Debian Linux.
#   sudo ./deploy.sh
# Builds the static site, serves it with nginx on localhost + LAN,
# and publishes it as a Tor v3 hidden service. No Node runtime afterwards.
set -Eeuo pipefail

BOLD=$'\033[1m'; RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; OFF=$'\033[0m'
log()  { echo "${BOLD}==>${OFF} $*"; }
ok()   { echo "  ${GRN}ok${OFF}  $*"; }
warn() { echo "  ${YLW}warn${OFF} $*"; }
die()  { echo "${RED}error:${OFF} $*" >&2; exit 1; }
trap 'die "failed at line $LINENO"' ERR

[ "$(id -u)" -eq 0 ] || die "run with sudo: sudo ./deploy.sh"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# The user who invoked sudo — the build must not run as root (npm scripts, cache perms).
BUILD_USER="${SUDO_USER:-root}"

# ---------------------------------------------------------------- config
[ -f .env ] || { [ -f .env.example ] && cp .env.example .env && warn "created .env from .env.example — edit it if the backend URL is wrong"; }
[ -f .env ] || die ".env not found and no .env.example to copy"
set -a; . ./.env; set +a

SITE_NAME="${SITE_NAME:-gramory}"
WEB_ROOT="${WEB_ROOT:-/var/www/$SITE_NAME}"
HTTP_PORT="${HTTP_PORT:-80}"
TOR_PORT="${TOR_PORT:-8080}"
HS_DIR="${HS_DIR:-/var/lib/tor/$SITE_NAME}"

[ -n "${VITE_SUPABASE_URL:-}" ] || die "VITE_SUPABASE_URL missing from .env"
[ -n "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ] || die "VITE_SUPABASE_PUBLISHABLE_KEY missing from .env"

# ---------------------------------------------------------------- packages
export DEBIAN_FRONTEND=noninteractive
APT_UPDATED=0
apt_install() {
  [ "$APT_UPDATED" -eq 1 ] || { log "Refreshing package lists"; apt-get update -qq || warn "apt-get update failed, continuing"; APT_UPDATED=1; }
  apt-get install -y -qq "$@" >/dev/null
}

log "Checking dependencies"
command -v curl >/dev/null || apt_install curl ca-certificates
command -v nginx >/dev/null || { apt_install nginx && ok "installed nginx"; }
command -v tor   >/dev/null || { apt_install tor && ok "installed tor"; }

node_ok() { command -v node >/dev/null && [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 20 ]; }
if ! node_ok; then
  log "Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1 || warn "nodesource setup failed, falling back to distro nodejs"
  apt-get install -y -qq nodejs >/dev/null
  node_ok || die "Node.js >= 20 is required but could not be installed"
fi
ok "node $(node -v), npm $(npm -v), nginx, tor"

# ---------------------------------------------------------------- build
run_as_builder() {
  if [ "$BUILD_USER" != "root" ]; then sudo -u "$BUILD_USER" -H env PATH="$PATH" "$@"; else "$@"; fi
}

log "Installing project dependencies"
if ! run_as_builder npm ci --no-audit --no-fund; then
  warn "npm ci failed — clearing cache and retrying with npm install"
  rm -rf node_modules
  run_as_builder npm cache clean --force >/dev/null 2>&1 || true
  run_as_builder npm install --no-audit --no-fund ||
    run_as_builder npm install --no-audit --no-fund --legacy-peer-deps ||
    die "dependency installation failed"
fi

log "Building static site"
if ! run_as_builder npm run build:static; then
  warn "build failed — retrying from a clean dependency tree"
  rm -rf node_modules dist .tanstack .nitro
  run_as_builder npm install --no-audit --no-fund --legacy-peer-deps
  run_as_builder npm run build:static || die "static build failed — see the output above"
fi
[ -f dist/client/index.html ] || die "build produced no dist/client/index.html"
ok "static bundle ready ($(du -sh dist/client | cut -f1))"

# ---------------------------------------------------------------- publish files
log "Publishing to $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}/"*
cp -r dist/client/. "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 755 {} + ; find "$WEB_ROOT" -type f -exec chmod 644 {} +
ok "$(find "$WEB_ROOT" -type f | wc -l) files published"

# ---------------------------------------------------------------- port conflicts
port_busy() { ss -ltnH "sport = :$1" 2>/dev/null | grep -q . ; }
port_owner() { ss -ltnpH "sport = :$1" 2>/dev/null | grep -o 'users:((\"[^\"]*' | head -1 | sed 's/.*((\"//' ; }

free_port() { # $1 = wanted port, $2 = label -> echoes a usable port
  local port="$1" label="$2" owner
  while port_busy "$port"; do
    owner="$(port_owner "$port")"
    if [ "$owner" = "nginx" ]; then break; fi   # our own server, will be reloaded
    if [ "$owner" = "apache2" ] || [ "$owner" = "lighttpd" ]; then
      warn "$owner holds port $port — stopping it"
      systemctl disable --now "$owner" >/dev/null 2>&1 || true
      continue
    fi
    warn "port $port ($label) is used by ${owner:-another process} — trying $((port + 1))"
    port=$((port + 1))
  done
  echo "$port"
}

HTTP_PORT="$(free_port "$HTTP_PORT" clearnet)"
TOR_PORT="$(free_port "$TOR_PORT" tor)"
[ "$HTTP_PORT" = "$TOR_PORT" ] && TOR_PORT=$((TOR_PORT + 1))

# ---------------------------------------------------------------- nginx
log "Configuring nginx (http:$HTTP_PORT, tor:127.0.0.1:$TOR_PORT)"
# Default site would grab port 80 first.
rm -f /etc/nginx/sites-enabled/default
sed -e "s|__WEB_ROOT__|$WEB_ROOT|g" \
    -e "s|__HTTP_PORT__|$HTTP_PORT|g" \
    -e "s|__TOR_PORT__|$TOR_PORT|g" \
    deploy/nginx.conf.template > "/etc/nginx/sites-available/$SITE_NAME"
ln -sf "/etc/nginx/sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/$SITE_NAME"
nginx -t >/dev/null 2>&1 || { nginx -t; die "generated nginx config is invalid"; }
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
ok "nginx running"

# ---------------------------------------------------------------- tor
log "Configuring Tor hidden service"
mkdir -p "$HS_DIR"
chown -R debian-tor:debian-tor "$HS_DIR" 2>/dev/null || chown -R tor:tor "$HS_DIR"
chmod 700 "$HS_DIR"

TORRC=/etc/tor/torrc
MARK_BEGIN="# >>> $SITE_NAME hidden service (managed by deploy.sh)"
MARK_END="# <<< $SITE_NAME hidden service"
touch "$TORRC"
cp "$TORRC" "$TORRC.bak.$(date +%s)"
# Replace any previous managed block instead of appending duplicates.
sed -i "/^${MARK_BEGIN//\//\\/}$/,/^${MARK_END//\//\\/}$/d" "$TORRC"
{
  echo "$MARK_BEGIN"
  echo "HiddenServiceDir $HS_DIR"
  echo "HiddenServicePort 80 127.0.0.1:$TOR_PORT"
  echo "HiddenServiceVersion 3"
  echo "$MARK_END"
} >> "$TORRC"

systemctl enable tor >/dev/null 2>&1 || true
systemctl restart tor
ok "tor restarted"

log "Waiting for the onion address"
ONION=""
for _ in $(seq 1 30); do
  if [ -f "$HS_DIR/hostname" ]; then ONION="$(cat "$HS_DIR/hostname")"; break; fi
  sleep 1
done
[ -n "$ONION" ] || warn "hostname not generated yet — check: journalctl -u tor -n 50"

# ---------------------------------------------------------------- verify
log "Verifying"
curl -fsS -o /dev/null "http://127.0.0.1:$HTTP_PORT/" && ok "clearnet responds" || warn "http://127.0.0.1:$HTTP_PORT did not respond"
curl -fsS -o /dev/null "http://127.0.0.1:$TOR_PORT/" && ok "tor backend responds" || warn "127.0.0.1:$TOR_PORT did not respond"

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
echo "${BOLD}${GRN}Deployment complete.${OFF}"
echo "  Local     : http://localhost${HTTP_PORT:+$([ "$HTTP_PORT" = 80 ] && echo "" || echo ":$HTTP_PORT")}"
[ -n "$LAN_IP" ] && echo "  Network   : http://$LAN_IP$([ "$HTTP_PORT" = 80 ] && echo "" || echo ":$HTTP_PORT")"
[ -n "$ONION" ] && echo "  Tor       : http://$ONION"
echo "  Files     : $WEB_ROOT"
echo
echo "Re-run ${BOLD}sudo ./deploy.sh${OFF} after any change to rebuild and republish."
