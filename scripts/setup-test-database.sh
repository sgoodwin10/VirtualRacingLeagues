#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up test database...${NC}"

# Determine which Docker Compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    # We're likely inside the container, try direct connection
    echo -e "${YELLOW}Docker Compose not found, attempting direct database connection...${NC}"

    # Create database and grant permissions using PHP
    php -r "
    try {
        \$pdo = new PDO('mysql:host=mariadb;port=3306', 'root', 'secret');
        \$pdo->exec('CREATE DATABASE IF NOT EXISTS virtualracingleagues_test');
        \$pdo->exec('GRANT ALL PRIVILEGES ON virtualracingleagues_test.* TO \'laravel\'@\'%\'');
        \$pdo->exec('FLUSH PRIVILEGES');
        echo 'Test database created and permissions granted' . PHP_EOL;
    } catch (PDOException \$e) {
        echo 'Failed to create database: ' . \$e->getMessage() . PHP_EOL;
        exit(1);
    }
    " 2>&1

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to create test database${NC}"
        echo -e "${YELLOW}Note: Database creation requires manual setup or running from host${NC}"
        echo -e "${YELLOW}Please run this from the host machine or create the database manually${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Test database created${NC}"

    # Try to run migrations anyway (database might already exist)
    echo -e "${YELLOW}Running migrations on test database...${NC}"
    DB_CONNECTION=testing php artisan migrate:fresh --force

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations completed${NC}"
        echo -e "${GREEN}✓ Test database setup complete!${NC}"
        echo -e "Database: ${YELLOW}virtualracingleagues_test${NC}"
        echo -e "Connection: ${YELLOW}testing${NC}"
        exit 0
    else
        echo -e "${RED}✗ Failed to run migrations${NC}"
        echo -e "${YELLOW}Make sure the test database exists first${NC}"
        exit 1
    fi
fi

# Create test database and grant permissions using Docker Compose
$DOCKER_COMPOSE exec -T mariadb mysql -u root -psecret -e "CREATE DATABASE IF NOT EXISTS virtualracingleagues_test; GRANT ALL PRIVILEGES ON virtualracingleagues_test.* TO 'laravel'@'%'; FLUSH PRIVILEGES;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database created and permissions granted${NC}"
else
    echo -e "${RED}✗ Failed to create test database${NC}"
    exit 1
fi

# Run migrations on test database
echo -e "${YELLOW}Running migrations on test database...${NC}"
DB_CONNECTION=testing php artisan migrate:fresh --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}✗ Failed to run migrations${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test database setup complete!${NC}"
echo -e "Database: ${YELLOW}virtualracingleagues_test${NC}"
echo -e "Connection: ${YELLOW}testing${NC}"
