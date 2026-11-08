# Deploying to Fly.io

Production runs `vite build` + `vite preview` (see `Dockerfile.fly`), which
serves the built client and the same `/api/*` proxy middleware as the dev
server. Config lives in `fly.toml`.

## One-time setup

1. Create a Fly.io account and install `flyctl` (https://fly.io/docs/flyctl/install/).
2. If `raco-falcon-g-e-v` is taken, change `app` and `GEV_ALLOWED_HOSTS` in `fly.toml`.
3. Create a deploy token: `fly tokens create org` (or `fly auth token`).
4. In GitHub → Settings → Secrets and variables → Actions, add:
   - `FLY_API_TOKEN` (required)
   - `GOOGLE_MAPS_API_KEY`, `CESIUM_ION_TOKEN` (optional browser keys, baked
     into the public bundle; restrict them by HTTP referrer)
   - Variable `FLY_DEPLOY_ENABLED=true` to deploy on every push to `main`.
5. Set server-side keys on Fly (never as build args):

   ```bash
   fly secrets set OPENAI_API_KEY=... GEMINI_API_KEY=... OPENSKY_CLIENT_ID=... OPENSKY_CLIENT_SECRET=... AISSTREAM_API_KEY=...
   ```

## Deploy

Run the **Deploy to Fly.io** workflow (Actions tab → Run workflow), or locally:

```bash
fly deploy --build-arg GOOGLE_MAPS_API_KEY=... --build-arg CESIUM_ION_TOKEN=...
```

## Before sharing the URL

The server proxies your paid API keys to anyone who can reach it. Put
authentication in front (see SECURITY.md) and set provider-side quotas and
billing caps first. Provider Settings (the in-app key panel) stays disabled for
remote visitors; manage keys with `fly secrets`.
