#!/bin/bash
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Install dependencies if vendor doesn't exist (MUST happen before any artisan commands)
if [ ! -d "vendor" ]; then
    log_info "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist
    log_success "Composer dependencies installed"
else
    log_success "Composer dependencies already installed"
fi

# Wait for database to be ready
log_info "Waiting for database..."
until php artisan migrate:status &> /dev/null
do
    log_warning "Database not ready, waiting..."
    sleep 2
done
log_success "Database is ready"

# Check npm dependencies (fallback - should be installed during build)
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    log_warning "node_modules missing or empty, installing..."
    npm install
    log_success "npm dependencies installed"
else
    log_success "npm dependencies available"
fi

# Ensure Playwright Chromium is installed (fallback safety check)
log_info "Checking Playwright Chromium browser..."

# Check if Chromium browser is installed by listing the cache directory
CHROMIUM_DIRS=$(gosu laravel sh -c 'ls -d /home/laravel/.cache/ms-playwright/chromium-* 2>/dev/null || true')

if [ -z "$CHROMIUM_DIRS" ]; then
    log_warning "Playwright Chromium browser missing, installing..."
    # Install chromium browser only (system deps already installed in Dockerfile)
    gosu laravel npx playwright@1.56.0 install chromium
    log_success "Playwright Chromium browser installed"
else
    log_success "Playwright Chromium browser available"
fi

# Run migrations with error handling
log_info "Running migrations..."
if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
    log_warning "Skipping migrations (SKIP_MIGRATIONS=true)"
else
    if php artisan migrate --force; then
        log_success "Migrations completed successfully"
    else
        log_error "Migrations failed!"
        if [ "${FAIL_ON_MIGRATION_ERROR:-true}" = "true" ]; then
            log_error "Exiting due to migration failure (set FAIL_ON_MIGRATION_ERROR=false to ignore)"
            exit 1
        else
            log_warning "Continuing despite migration failure"
        fi
    fi
fi

# Generate app key if not set (improved validation)
if [ -f ".env" ]; then
    APP_KEY=$(grep "^APP_KEY=" .env | cut -d '=' -f2)
    if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
        log_info "Generating application key..."
        php artisan key:generate
        log_success "Application key generated"
    else
        log_success "Application key already set"
    fi
else
    log_warning ".env file not found, skipping APP_KEY generation"
fi

# Clear caches
log_info "Clearing caches..."
php artisan config:clear
php artisan cache:clear
log_success "Caches cleared"

# Get nginx container IP address for E2E testing
log_info "Setting up E2E testing subdomain resolution..."
NGINX_IP=$(getent hosts nginx | awk '{ print $1 }')

# Extract domain from .env file
if [ -f ".env" ]; then
    # First try APP_ROOT_DOMAIN (preferred), fall back to APP_URL
    BASE_DOMAIN=$(grep "^APP_ROOT_DOMAIN=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

    if [ -z "$BASE_DOMAIN" ]; then
        # Fall back to APP_URL if APP_ROOT_DOMAIN not found
        APP_URL=$(grep "^APP_URL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        # Remove http:// or https://, port numbers, and any trailing slashes
        BASE_DOMAIN=$(echo "$APP_URL" | sed -E 's#^https?://##' | sed -E 's#:[0-9]+##' | sed 's#/$##')
    fi

    if [ -n "$BASE_DOMAIN" ]; then
        log_info "Detected domain from .env: ${BASE_DOMAIN}"
    else
        log_warning "Could not extract domain from .env, using default"
        BASE_DOMAIN="localhost"
    fi
else
    log_warning ".env file not found, using default domain"
    BASE_DOMAIN="localhost"
fi

if [ -n "$NGINX_IP" ] && [ -n "$BASE_DOMAIN" ]; then
    log_info "Detected nginx container at ${NGINX_IP}"

    # Escape domain for use in regex (replace dots with \.)
    ESCAPED_DOMAIN=$(echo "$BASE_DOMAIN" | sed 's/\./\\./g')

    # Remove any existing entries (including those from extra_hosts)
    if grep -q "$BASE_DOMAIN" /etc/hosts 2>/dev/null; then
        log_info "Removing existing ${BASE_DOMAIN} entries..."
        sed -i "/${ESCAPED_DOMAIN}/d" /etc/hosts
    fi

    # Add subdomain entries with correct nginx IP
    log_info "Adding subdomain entries to /etc/hosts..."
    {
        echo "# Playwright E2E Testing - Added by docker-entrypoint.sh"
        echo "${NGINX_IP} ${BASE_DOMAIN}"
        echo "${NGINX_IP} app.${BASE_DOMAIN}"
        echo "${NGINX_IP} admin.${BASE_DOMAIN}"
    } >> /etc/hosts

    log_success "Added subdomain entries to /etc/hosts pointing to nginx (${NGINX_IP})"

    # Verify the entries
    if grep "^${NGINX_IP}.*${BASE_DOMAIN}" /etc/hosts > /dev/null; then
        log_success "/etc/hosts configuration verified"
    else
        log_error "Failed to verify /etc/hosts configuration"
    fi
else
    log_warning "Could not resolve nginx container IP or domain, skipping /etc/hosts setup"
fi

# Configure CCStatusline for Claude Code (as laravel user)
log_info "Configuring CCStatusline..."
if [ -f "docker/ccstatusline/settings.json" ]; then
    # Run as laravel user using gosu
    gosu laravel mkdir -p /home/laravel/.config/ccstatusline
    gosu laravel mkdir -p /home/laravel/.claude

    # Copy ccstatusline settings to config directory
    gosu laravel cp docker/ccstatusline/settings.json /home/laravel/.config/ccstatusline/settings.json
    log_success "CCStatusline configuration copied"

    # Merge ccstatusline settings into Claude Code settings
    if [ -f /home/laravel/.claude/settings.json ] && [ -s /home/laravel/.claude/settings.json ]; then
        # Merge with existing settings (only if file is not empty)
        TEMP_FILE=$(mktemp)
        jq -s '.[0] * .[1]' /home/laravel/.claude/settings.json docker/ccstatusline/settings.json > "$TEMP_FILE" && \
        gosu laravel cp "$TEMP_FILE" /home/laravel/.claude/settings.json && \
        rm "$TEMP_FILE"
        log_success "CCStatusline settings merged into Claude Code"
    else
        # Create new settings file
        gosu laravel cp docker/ccstatusline/settings.json /home/laravel/.claude/settings.json
        log_success "CCStatusline settings created in Claude Code"
    fi
else
    log_warning "CCStatusline settings file not found at docker/ccstatusline/settings.json"
fi

# Add Context7 MCP server to Claude Code if API key is present (as laravel user)
CLAUDE_CONTEXT7_MCP_API_KEY="${CLAUDE_CONTEXT7_MCP_API_KEY:-}"
if [ -n "${CLAUDE_CONTEXT7_MCP_API_KEY}" ]; then
    log_info "Configuring Context7 MCP server..."

    # Remove if context7 is already present to avoid duplicates
    if gosu laravel claude mcp list 2>/dev/null | grep -q "context7"; then
        log_info "Removing existing Context7 MCP configuration..."
        gosu laravel claude mcp remove "context7" || true
    fi

    # Add Context7 MCP server
    if gosu laravel claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key "${CLAUDE_CONTEXT7_MCP_API_KEY}"; then
        log_success "Context7 MCP server configured"
    else
        log_warning "Failed to configure Context7 MCP server"
    fi
else
    log_info "CLAUDE_CONTEXT7_MCP_API_KEY not set, skipping Context7 MCP configuration"
fi

log_success "Container initialization complete!"
log_info "Starting application..."

# Determine the command to execute
if [ $# -eq 0 ]; then
    COMMAND="php-fpm"
else
    COMMAND="$1"
fi

# PHP-FPM needs to run as root and will drop privileges itself
# All other commands run as laravel user
if [ "$COMMAND" = "php-fpm" ]; then
    log_info "Starting PHP-FPM (as root, will drop to www-data)..."
    exec php-fpm
else
    log_info "Executing command as laravel user..."
    exec gosu laravel "$@"
fi
