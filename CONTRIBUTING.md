## Development Workflow
The miniflare 3 dev server [only supports HTTP](https://github.com/cloudflare/workers-sdk/issues/3353). I found ran into issues using the dev server with the WebAuthn flow. So I piped it through a [Cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/). I created a tunnel called "dev" and ran in one terminal:
```
cloudflared tunnel run dev
```
while running
```
npm run preview
```
in another. I hooked up the tunnel to a subdomain for name stability. [Here's how to do that](https://blog.cloudflare.com/argo-tunnels-that-live-forever/).

## Environment Variables
They can be set in a `.env` file in the root of the repo.

## Develop "Logged In" Experience
You can set the `LOCAL_TEST_USER` environment variable to a username of your choosing. The middleware will check for it and assume you're logged in if it's set. **Do not set this variable in production.**

## Core Commands

Set up the local database:
```
npx wrangler d1 execute SITE_DB --local --file=./schema.sql
```
Set up the remote (production) database:
```
npx wrangler d1 execute SITE_DB --file=./schema.sql
```

Preview the site locally:
```
npm run preview
```

## Files

| File              | Purpose                                   |
| :---------------- | :---------------------------------------- |
| `src/pages/*`     | Individual website pages                  |
| `src/pages/api/*` | API endpoints used for POSTs              |
| `src/layouts/*`   | Boilerplate layout template               |
| `src/pages/api/*` | API endpoints used for POSTs              |
| `db.ts`           | Functions that interact with the database |
| `env.d.ts`        | TypeScript definitions for Astro "locals" |
| `middleware.ts`   | Middleware that runs on each request      |

## Testing
Astro supports [testing via Playwright or Cypress](https://docs.astro.build/en/guides/testing/). This repo could benefit from unit tests but I think most of the value is in testing the WebAuthn flow.  
Neither [Playwright](https://github.com/microsoft/playwright/issues/7276) nor [Cypress](https://github.com/cypress-io/cypress/issues/6991) officially supports WebAuthn.  
A PR testing the webauthn flow in this repo would be welcome.

## Misc Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |