#!/bin/bash
set -e

# Only modify /etc/hosts if running tests (detect by npm/node processes)
# This way we don't interfere with normal PHP-FPM operation

# Get nginx container IP address
NGINX_IP=$(getent hosts nginx | awk '{ print $1 }')

if [ -n "$NGINX_IP" ]; then
    # Check if entries already exist to avoid duplicates
    if ! grep -q "virtualracingleagues.localhost" /etc/hosts; then
        echo "# Playwright E2E Testing - Added by docker-entrypoint.sh" >> /etc/hosts
        echo "${NGINX_IP} virtualracingleagues.localhost" >> /etc/hosts
        echo "${NGINX_IP} app.virtualracingleagues.localhost" >> /etc/hosts
        echo "${NGINX_IP} admin.virtualracingleagues.localhost" >> /etc/hosts
        echo "✓ Added subdomain entries to /etc/hosts pointing to nginx (${NGINX_IP})"
    fi
fi

# Execute the main command
exec "$@"
