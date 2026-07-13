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

### User Theme Presets

Profile includes an appearance panel with nine presets, each a faithful port of an
official Ant Design theme: Default, Dark, MUI-like, shadcn-like, Cartoon,
Illustration, Bootstrap tactile, Glass, and Geek. Every preset is an `antd-style`
hook under `src/theme/antd/` returning a full `ConfigProviderProps` — design tokens,
per-component overrides, and component-level `classNames` effects (e.g. Geek's neon
glow, MUI's uppercase + ripple buttons, Bootstrap's gradient buttons, Illustration's
hard drop-shadows). Glass is the only preset that keeps the wallpaper / translucency
/ blur material (`liquid-glass.css`, scoped to the glass preset); all other presets
are styled entirely by their official antd theme. See `docs/theme-system.md`.

Users can additionally customize core tokens (primary / background / surface / text
/ border colors, radius, density, and light/dark/system mode). Official values are
the defaults; overrides apply only to tokens the user actually changed. Token-driven
presets reflect every override; a few deeply-customized presets (MUI, shadcn) hard-
code button color/radius in their effect classes, so those specific elements keep the
official look. Preset and tokens are stored through `/v1/auth/me/theme` and restored
from `/v1/auth/me` on the next login.

Administrators can set the global fallback preset, color mode, and core-token JSON
in **System Settings → Appearance**. It is stored in `system_settings` and applies
only to users without a saved personal theme preference. The system default theme
can be restored to the built-in default from the same settings panel.

### Authentication and User Management

The login page uses one username/password form for both local and LDAP users. The
backend checks the local user first, then falls back to LDAP if the local user is
missing or the password check fails. LDAP providers are not shown as separate
login buttons. OIDC and SAML providers are shown as redirect login buttons.

The SSO provider page supports LDAP configuration testing before saving. The test
uses the values currently entered in the form plus the supplied test account; the
provider is saved only after a successful test. Administrators can also choose to
save without testing.

The Users page shows each user's auth source as `SSO name (PROTOCOL)`, for
example `Keycloak (OIDC)`, `Corporate LDAP (LDAP)`, or `Local (LOCAL)`. Admins
can delete one auth source from a multi-source user directly from the source tag;
the backend rejects deleting the user's last remaining source. Admins can reset
local users' passwords; the server generates a random password and the frontend
displays it once in a copyable dialog. LDAP users' passwords are managed by LDAP
and are not reset from this page.

The Online Sessions page shows each session's login source with the same
`SSO name (PROTOCOL)` format. Existing sessions created before this field was
added may show an empty value until the user logs in again.

Disabled users and authenticated users without enough permissions are sent to the
Forbidden page. Disabled accounts show a specific disabled-account message; other
authorization failures show a permission-denied message.

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

## Two-Factor Authentication (2FA)

The platform supports TOTP-based 2FA (Google Authenticator, Microsoft Authenticator, Authy, etc.).

**Admin controls:**
- Enable/disable the 2FA feature system-wide in **System Settings → Two-Factor Authentication**.
- When the global switch is ON, users with a bound authenticator will be prompted for a verification code on login.
- Admins can force-reset a user's 2FA from the Users page (no TOTP code required).

**User controls:**
- Users can enable 2FA from **Profile → Two-Factor Authentication** when the global switch is on.
- Disabling their own 2FA requires entering the current TOTP code.

**Login flow with 2FA enabled:**
1. Username + password → server returns `requires_2fa: true` + `pre_auth_token`.
2. Frontend shows a 6-digit TOTP input.
3. User submits the code → `/v1/auth/verify-totp` → receives the session token.

LDAP uses the same username/password form as local login. The frontend submits
to `/v1/auth/login`; the backend checks the local user first, then falls back to
the enabled LDAP provider if the local user is missing or the local password
check fails. LDAP providers are not rendered as separate SSO login buttons.

OIDC and SAML providers render as redirect login buttons and open
`/v1/sso/login/{id}`. The SSO admin page (`/admin/sso`) renders per-type config
fields; for SAML 2.0 these include IdP Entity ID, IdP SSO URL, IdP Certificate,
SP Entity ID, and the optional SP key/certificate used when the IdP requires
signed requests. A *Generate SP Certificate* button creates a self-signed SP key
pair (via `POST /v1/sso/saml/keypair`) and fills the key/certificate fields.
Config field labels mirror the Keycloak field names. Provider setup and IdP
(Keycloak) configuration are documented in the backend `docs/sso-saml-design.md`.

Logout of an SSO session also terminates the IdP session: the logout call
returns an `sso_logout_url` and the app redirects the browser there (OIDC
end-session / SAML single logout) before returning to the login page. The users
table shows the SSO-captured **email** column.

---

## Scripts

```bash
npm run dev      # Start dev server with HMR
npm run build    # Type-check + Vite production build (output in dist/)
npm run preview  # Locally preview the production build
npm run lint     # Run ESLint
```
