# Static deployment (Tor hidden service)

Build a fully static site — no Node runtime, no SSR server:

```bash
STATIC_BUILD=1 bun run build     # or: npm run build:static
```

Output: `dist/client/` — plain HTML, CSS, JS, self-hosted fonts. Every page is
prerendered at build time, so the first paint needs zero JavaScript round-trips,
which matters a lot on Tor.

Serve it:

```bash
sudo cp -r dist/client/* /var/www/gramory/
sudo cp deploy/nginx.conf /etc/nginx/sites-available/gramory
sudo ln -sf /etc/nginx/sites-available/gramory /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`/etc/tor/torrc`:

```
HiddenServiceDir /var/lib/tor/gramory/
HiddenServicePort 80 127.0.0.1:8080
```

Then `sudo systemctl restart tor` and read the address from
`/var/lib/tor/gramory/hostname`.

## Notes

- Product pages with URL-safe slugs are prerendered to their own HTML file.
  Anything else (and products added after the build) is served by the SPA
  fallback in `nginx.conf` and rendered client-side.
- Re-run the build whenever the catalog changes to refresh the prerendered HTML.
- Product images uploaded in admin are downscaled to max 1000px WebP in the
  browser before upload, so pages stay light over Tor.
