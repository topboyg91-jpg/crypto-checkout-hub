# Deployment (Kali / Debian Linux + Tor hidden service)

The site is a **pure static build** — plain HTML, CSS, JS and self-hosted fonts.
There is no Node process, no SSR, no Nitro, no API routes and no backend service
to keep running after the build. Nginx serves files; that is the whole runtime.

## One command

```bash
sudo ./deploy.sh
```

That script does everything:

1. installs anything missing (Node.js 22, nginx, tor, curl)
2. installs project dependencies (with automatic clean-and-retry on failure)
3. runs `npm run build:static` → `dist/client/`
4. publishes the files to `WEB_ROOT` (default `/var/www/gramory`)
5. writes and enables the nginx site from `deploy/nginx.conf.template`
6. writes a managed `HiddenServiceDir` block into `/etc/tor/torrc` (backing up
   the original first) and restarts Tor
7. verifies both ports respond and prints the local, LAN and `.onion` URLs

Ports in use are detected automatically: a rival `apache2`/`lighttpd` is stopped,
anything else causes the script to shift to the next free port.

Re-run the same command after any change — it is idempotent.

## Configuration

Everything comes from a single `.env` (copied from `.env.example` on first run):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | backend URL baked into the bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key (safe in a static bundle) |
| `SITE_NAME` | nginx site + hidden service name |
| `WEB_ROOT` | where the built files are served from |
| `HTTP_PORT` | clearnet / LAN port (default 80) |
| `TOR_PORT` | loopback port the hidden service points at (default 8080) |
| `HS_DIR` | Tor hidden service directory |

## Notes

- Product pages with URL-safe slugs are prerendered to their own HTML file.
  Anything else, and products added after the build, is served by the SPA
  fallback and rendered client-side.
- Product images uploaded in admin are downscaled to max 1000px WebP in the
  browser, so pages stay light over Tor.
- Fonts are self-hosted in `public/fonts/`; the build makes no clearnet
  requests other than to your configured backend.
- Onion address: `sudo cat /var/lib/tor/gramory/hostname`.
