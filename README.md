# Temperate — Frontend

React 19 + TypeScript + Vite frontend for the Temperate platform, built with Ant Design.

**Backend repository:** [kratos-template-for-all](https://github.com/wuyuetianjian/kratos-template-for-all.git)

> 中文文档请见 [README.zh.md](./README.zh.md)

---

## Table of Contents

- [Local Development](#local-development)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Configuration Reference](#configuration-reference)

---

## Local Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. All `/v1` and `/health` requests are proxied to the backend by Vite (see `vite.config.ts`).

**Dev environment variables** (`.env` file, never commit):

```env
# Backend address used by the Vite dev proxy
BACKEND_URL=http://localhost:8000

# Override the API base URL if not using the Vite proxy (optional)
# VITE_API_BASE_URL=http://localhost:8000
```

---

## Configuration

All runtime configuration is read through `src/config.ts`. Priority from highest to lowest:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | `window.__APP_CONFIG__` | Injected into `/config.js` at container startup by `docker/entrypoint.sh` |
| 2 | `VITE_*` build vars | Baked into the bundle at build time; used for local dev |
| 3 | Code defaults | Fallback values |

Fields exposed by `src/config.ts`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiBaseUrl` | `string` | `''` | Axios base URL; leave empty to let Nginx proxy handle routing |
| `appName` | `string` | `'Temperate'` | Application name shown in the UI |
| `defaultPageSize` | `number` | `20` | Default page size for list views (code constant) |

> **Recommendation:** Keep `apiBaseUrl` empty in production and let Nginx proxy `/v1` to the backend to avoid CORS issues.

---

## Admin Pages

| Page | Path | Permission Required |
|------|------|---------------------|
| Dashboard | `/admin` | (any authenticated user) |
| Users | `/admin/users` | `ListUsers` |
| Roles | `/admin/roles` | `ListRoles` |
| Permissions | `/admin/permissions` | `ListPermissions` |
| SSO Providers | `/admin/sso` | `ListSSOProviders` |
| Online Sessions | `/admin/sessions` | `ListSessions` |
| Audit Logs | `/admin/audit-logs` | `ListAuditLogs` |
| System Settings | `/admin/settings` | `GetSystemSettings` |
| **Service Accounts** | `/admin/service-accounts` | `ListServiceAccounts` |
| Profile | `/admin/profile` | (any authenticated user) |

### Service Accounts Page

The Service Accounts page lets administrators create and manage machine/service
identities that can call the backend API directly using long-lived tokens.

**Key features:**

- **Create** — Enter a name, optional description, validity period (days, 0 =
  never expires), and assigned roles. The generated token is displayed once in a
  modal dialog with copy support.
- **Token display modal** — Shows the full token and ready-to-use code snippets
  for Java, Go, Rust, and Python.
- **Edit** — Update description, enable/disable the account, and change role
  assignments.
- **Regenerate token** — Rotate the token immediately (old token is invalidated).
  The new token is displayed in the same modal with code templates.
- **Delete** — Permanently removes the service account and invalidates its token.

All create, regenerate, and delete actions are recorded in the audit log.

---

## Docker Deployment

### Build the image

```bash
docker build -t temperate-web .
```

Build stages:
1. **Node 22 Alpine** — installs dependencies and runs `npm run build`
2. **Nginx 1.27 Alpine** — serves the static output; `docker/entrypoint.sh` generates `/config.js` and the Nginx config from environment variables at container startup

### Run the container

```bash
docker run -d \
  -p 80:80 \
  -e BACKEND_URL=http://backend:8000 \
  -e APP_NAME=Temperate \
  temperate-web
```

### Docker Compose

```yaml
services:
  web:
    image: temperate-web
    ports:
      - "80:80"
    environment:
      BACKEND_URL: http://backend:8000
      APP_NAME: Temperate
      # API_BASE_URL: ""   # leave empty to use Nginx proxy (recommended)
    depends_on:
      - backend

  backend:
    image: temperate-backend   # see backend repo
    ports:
      - "8000:8000"
```

---

## Configuration Reference

### Container environment variables

All configuration is injected via environment variables — no image rebuild needed.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | Yes | `http://backend:8000` | Backend service URL; used by Nginx to proxy `/v1` and `/health` |
| `APP_NAME` | No | `Temperate` | Application name displayed in the UI |
| `API_BASE_URL` | No | `''` (empty) | Axios `baseURL`; leave empty to route through Nginx proxy |

### Local dev environment variables (`.env`)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Backend address for the Vite dev proxy |
| `VITE_API_BASE_URL` | API base URL when not using the Vite proxy (optional) |
| `VITE_APP_NAME` | App name override for local development (optional) |

### Related files

| File | Description |
|------|-------------|
| `src/config.ts` | Central config entry point — all modules read configuration from here |
| `docker/entrypoint.sh` | Container startup script: generates `config.js` and renders the Nginx template |
| `docker/nginx.conf.template` | Nginx config template; `${BACKEND_URL}` is substituted at startup |
| `vite.config.ts` | Vite config including dev proxy rules |
| `.env` | Local dev environment variables (not committed) |

---

## Scripts

```bash
npm run dev      # Start dev server with HMR
npm run build    # Type-check + Vite production build (output in dist/)
npm run preview  # Locally preview the production build
npm run lint     # Run ESLint
```
