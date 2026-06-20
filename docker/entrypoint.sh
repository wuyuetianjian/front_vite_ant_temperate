#!/bin/sh
set -e

NGINX_CONF=/etc/nginx/conf.d/default.conf
CONFIG_JS=/usr/share/nginx/html/config.js

# ── 1. Generate runtime config.js ─────────────────────────────────────────────
# Values are read from environment variables at container start time so that
# the same image can be deployed to different environments without rebuilding.
cat > "$CONFIG_JS" <<EOF
window.__APP_CONFIG__ = {
  apiBaseUrl: "${API_BASE_URL:-}",
  appName: "${APP_NAME:-Temperate}"
};
EOF

# ── 2. Render Nginx config from template ───────────────────────────────────────
# Only BACKEND_URL is substituted; all Nginx \$variables are left untouched.
BACKEND_URL="${BACKEND_URL:-http://backend:8000}" \
  envsubst '${BACKEND_URL}' \
  < /etc/nginx/nginx.conf.template \
  > "$NGINX_CONF"

# ── 3. Validate and start Nginx ────────────────────────────────────────────────
nginx -t
exec nginx -g 'daemon off;'
