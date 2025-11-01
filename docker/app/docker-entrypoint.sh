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

# Wait for database to be ready
log_info "Waiting for database..."
until php artisan migrate:status &> /dev/null
do
    log_warning "Database not ready, waiting..."
    sleep 2
done
log_success "Database is ready"

# Install dependencies if vendor doesn't exist
if [ ! -d "vendor" ]; then
    log_info "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist
    log_success "Composer dependencies installed"
else
    log_success "Composer dependencies already installed"
fi

# Install npm dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing npm dependencies..."
    npm install
    log_success "npm dependencies installed"
else
    log_success "npm dependencies already installed"
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

if [ -n "$NGINX_IP" ]; then
    # Check if entries already exist to avoid duplicates
    if ! grep -q "virtualracingleagues.localhost" /etc/hosts 2>/dev/null; then
        log_info "Adding subdomain entries to /etc/hosts..."
        # Use a temporary file for atomic update
        {
            echo "# Playwright E2E Testing - Added by docker-entrypoint.sh"
            echo "${NGINX_IP} virtualracingleagues.localhost"
            echo "${NGINX_IP} app.virtualracingleagues.localhost"
            echo "${NGINX_IP} admin.virtualracingleagues.localhost"
        } >> /etc/hosts
        log_success "Added subdomain entries to /etc/hosts pointing to nginx (${NGINX_IP})"
    else
        log_success "Subdomain entries already exist in /etc/hosts"
    fi
else
    log_warning "Could not resolve nginx container IP, skipping /etc/hosts setup"
fi

# Configure CCStatusline for Claude Code
log_info "Configuring CCStatusline..."
if [ -f "docker/ccstatusline/settings.json" ]; then
    mkdir -p ~/.config/ccstatusline
    mkdir -p ~/.claude

    # Copy ccstatusline settings to config directory
    cp docker/ccstatusline/settings.json ~/.config/ccstatusline/settings.json
    log_success "CCStatusline configuration copied"

    # Merge ccstatusline settings into Claude Code settings
    if [ -f ~/.claude/settings.json ]; then
        # Merge with existing settings
        TEMP_FILE=$(mktemp)
        jq -s '.[0] * .[1]' ~/.claude/settings.json docker/ccstatusline/settings.json > "$TEMP_FILE" && mv "$TEMP_FILE" ~/.claude/settings.json
        log_success "CCStatusline settings merged into Claude Code"
    else
        # Create new settings file
        cp docker/ccstatusline/settings.json ~/.claude/settings.json
        log_success "CCStatusline settings created in Claude Code"
    fi
else
    log_warning "CCStatusline settings file not found at docker/ccstatusline/settings.json"
fi

# Add Context7 MCP server to Claude Code if API key is present
CLAUDE_CONTEXT7_MCP_API_KEY="${CLAUDE_CONTEXT7_MCP_API_KEY:-}"
if [ -n "${CLAUDE_CONTEXT7_MCP_API_KEY}" ]; then
    log_info "Configuring Context7 MCP server..."

    # Remove if context7 is already present to avoid duplicates
    if claude mcp list 2>/dev/null | grep -q "context7"; then
        log_info "Removing existing Context7 MCP configuration..."
        claude mcp remove "context7" || true
    fi

    # Add Context7 MCP server
    if claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key "${CLAUDE_CONTEXT7_MCP_API_KEY}"; then
        log_success "Context7 MCP server configured"
    else
        log_warning "Failed to configure Context7 MCP server"
    fi
else
    log_info "CLAUDE_CONTEXT7_MCP_API_KEY not set, skipping Context7 MCP configuration"
fi

log_success "Container initialization complete!"
log_info "Starting application..."

# Switch to laravel user and execute the main command
# This ensures PHP-FPM and other processes run as the laravel user, not root
exec gosu laravel "$@"
