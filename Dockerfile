# Base stage - Production-ready PHP without Node.js
FROM php:8.2-fpm AS base

# Set working directory
WORKDIR /var/www

ENV HOMEDIR="/home/laravel"

ARG CLAUDE_CODE_VERSION=latest

# Install system dependencies (without Node.js)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libwebp-dev \
    libmagickwand-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    procps \
    zsh \
    default-mysql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions with enhanced GD support
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install ImageMagick extension
RUN pecl install imagick \
    && docker-php-ext-enable imagick

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user to run Composer and Artisan Commands
RUN useradd -G www-data,root -u 1000 -d /home/laravel laravel -s /bin/zsh
RUN mkdir -p /home/laravel/.composer && \
    chown -R laravel:laravel /home/laravel

# Install oh-my-zsh for laravel user (FIXED)
RUN su - laravel -c 'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended'

# Change the default shell to zsh
RUN chsh -s $(which zsh)

# Set user
USER laravel

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]


# Development stage - Extends base with Node.js for local development
FROM base AS development

# Switch to root to install Node.js
USER root

# Install Node.js 22.x from NodeSource
RUN apt-get update && \
    apt-get install -y ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies
# This installs the required system libraries for running browsers
RUN npx -y playwright@latest install-deps

# Configure npm to use user-writable directory for global packages
RUN mkdir -p /home/laravel/.npm-global && \
    chown -R laravel:laravel /home/laravel/.npm-global

# Switch back to laravel user
USER laravel

# Set npm global directory to user-writable location
ENV NPM_CONFIG_PREFIX=/home/laravel/.npm-global
ENV PATH=/home/laravel/.npm-global/bin:$PATH

# Install Playwright browsers
# This downloads and installs chromium, firefox, and webkit browsers
RUN npx -y playwright@latest install

# Install Claude
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Create Claude settings file
RUN touch $HOMEDIR/.claude/settings.json

# Install CCStatusline
RUN npm install -g ccstatusline@latest \
    && mkdir -p $HOMEDIR/.config/ccstatusline \
    && cp /var/www/docker/ccstatusline/settings.json $HOMEDIR/.config/ccstatusline/settings.json


# Install Context7
RUN npm install -g @upstash/context7-mcp@latest

# Install Playwright MCP
RUN claude mcp add playwright npx '@playwright/mcp@latest'
