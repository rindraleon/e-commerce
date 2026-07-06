#!/bin/sh
set -eu

cat > /usr/share/nginx/html/app-config.js <<EOF
window.__APP_CONFIG__ = {
  apiBaseUrl: '${VITE_API_BASE_URL:-/api}',
  apiPrefix: '${VITE_API_PREFIX:-}',
  siteUrl: '${VITE_SITE_URL:-http://localhost:8080}'
};
EOF
