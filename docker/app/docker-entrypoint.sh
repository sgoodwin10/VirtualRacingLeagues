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


# add ccstatusline to Claude Code
if [[ "$(id -u)" != "0" ]]; then
    mkdir -p ~/.claude
    # add the ccstatusline settings to .claude/settings.json
    jq -s add ~/.claude/settings.json ~/docker/ccstatusline/settings.json > ~/.claude/settings.json
fi




# add context7 mcp server to Claude Code, when the context7 api key is present
CLAUDE_CONTEXT7_MCP_API_KEY="${CLAUDE_CONTEXT7_MCP_API_KEY:-}"
if [ -n "${CLAUDE_CONTEXT7_MCP_API_KEY}" ]; then

    # remove if context7 is already present
    if claude mcp list | grep -q "context7"; then
        claude mcp remove "context7" || true
    fi

    claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key "${CLAUDE_CONTEXT7_MCP_API_KEY}"
fi

# Execute the main command
exec "$@"
