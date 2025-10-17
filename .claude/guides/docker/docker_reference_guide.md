# Docker Reference Guide

This document provides exact commands for working with the Laravel Docker environment. All commands are to be executed from the project root directory: `/Users/samuelgoodwin/Sites/GenericTemplate`

## Container Overview

| Service | Container Name | Internal Port | External Port | Image |
|---------|---------------|---------------|---------------|-------|
| PHP-FPM | `laravel-app` | 9000 | - | Custom (PHP 8.2) |
| Nginx | `laravel-nginx` | 80 | 8000 | nginx:alpine |
| MariaDB | `laravel-mariadb` | 3306 | 3307 | mariadb:10.11 |
| Redis | `laravel-redis` | 6379 | 6379 | redis:7-alpine |
| Elasticsearch | `laravel-elasticsearch` | 9200, 9300 | 9200, 9300 | elasticsearch:8.11.0 |
| Mailpit | `laravel-mailpit` | 1025, 8025 | 1025, 8025 | axllent/mailpit |

## Container Management

### Start All Containers
```bash
docker-compose up -d
```

### Stop All Containers
```bash
docker-compose down
```

### Restart Specific Container
```bash
docker-compose restart laravel-app
docker-compose restart laravel-nginx
docker-compose restart laravel-mariadb
docker-compose restart laravel-redis
docker-compose restart laravel-elasticsearch
docker-compose restart laravel-mailpit
```

### View Container Status
```bash
docker-compose ps
```

### View Container Logs (Real-time)
```bash
docker-compose logs -f
docker-compose logs -f laravel-app
docker-compose logs -f laravel-nginx
docker-compose logs -f laravel-mariadb
docker-compose logs -f laravel-redis
docker-compose logs -f laravel-elasticsearch
```

## Accessing Containers (Bash)

### PHP Application Container (Primary Development Container)
```bash
docker exec -it laravel-app bash
```
**User Context:** `laravel` (uid 1000)
**Working Directory:** `/var/www`
**Use Case:** Run Composer, Artisan commands, PHPUnit, PHPStan

### PHP Application Container as Root
```bash
docker exec -it -u root laravel-app bash
```
**User Context:** `root`
**Use Case:** Install system packages, modify PHP configuration

### Nginx Container
```bash
docker exec -it laravel-nginx sh
```
**Note:** Uses `sh` (Alpine Linux - no bash)
**Use Case:** Check nginx configuration, access logs

### MariaDB Container
```bash
docker exec -it laravel-mariadb bash
```
**Use Case:** Database administration, manual SQL operations

### Redis Container
```bash
docker exec -it laravel-redis sh
```
**Note:** Uses `sh` (Alpine Linux - no bash)
**Use Case:** Redis CLI operations, cache inspection

### Elasticsearch Container
```bash
docker exec -it laravel-elasticsearch bash
```
**Use Case:** Elasticsearch administration, index management

## Database (MariaDB) Access

### Credentials
- **Host (from host machine):** `localhost` or `127.0.0.1`
- **Host (from app container):** `mariadb`
- **Port (from host machine):** `3307`
- **Port (from app container):** `3306`
- **Database:** `laravel`
- **Username:** `laravel`
- **Password:** `secret`
- **Root Password:** `secret`

### Connect to MariaDB CLI from Host Machine
```bash
mysql -h 127.0.0.1 -P 3307 -u laravel -psecret laravel
```
**Note:** No space between `-p` and password

### Connect to MariaDB CLI from App Container
```bash
docker exec -it laravel-app bash
mysql -h mariadb -u laravel -psecret laravel
```

### Connect to MariaDB CLI Directly (One Command)
```bash
docker exec -it laravel-mariadb mysql -u laravel -psecret laravel
```

### Connect as Root User
```bash
docker exec -it laravel-mariadb mysql -u root -psecret
```

### Common MariaDB Operations
```bash
# Show all databases
docker exec -it laravel-mariadb mysql -u laravel -psecret -e "SHOW DATABASES;"

# Show tables in laravel database
docker exec -it laravel-mariadb mysql -u laravel -psecret laravel -e "SHOW TABLES;"

# Execute SQL file
docker exec -i laravel-mariadb mysql -u laravel -psecret laravel < /path/to/file.sql

# Dump database
docker exec laravel-mariadb mysqldump -u laravel -psecret laravel > backup.sql

# Import database dump
docker exec -i laravel-mariadb mysql -u laravel -psecret laravel < backup.sql
```

### MariaDB GUI Connection (TablePlus, Sequel Pro, etc.)
- **Host:** `127.0.0.1`
- **Port:** `3307`
- **User:** `laravel`
- **Password:** `secret`
- **Database:** `laravel`

## Redis Access

### Credentials
- **Host (from host machine):** `localhost` or `127.0.0.1`
- **Host (from app container):** `redis`
- **Port:** `6379`
- **Password:** None (no password configured)

### Connect to Redis CLI from Host Machine
```bash
redis-cli -h 127.0.0.1 -p 6379
```

### Connect to Redis CLI from Container
```bash
docker exec -it laravel-redis redis-cli
```

### Common Redis Operations
```bash
# Check if Redis is running
docker exec -it laravel-redis redis-cli ping
# Expected output: PONG

# List all keys
docker exec -it laravel-redis redis-cli KEYS '*'

# Get specific key value
docker exec -it laravel-redis redis-cli GET key_name

# Flush all Redis data (clear cache)
docker exec -it laravel-redis redis-cli FLUSHALL

# Get Redis info
docker exec -it laravel-redis redis-cli INFO

# Monitor Redis commands in real-time
docker exec -it laravel-redis redis-cli MONITOR
```

### Redis GUI Connection (RedisInsight, Medis, etc.)
- **Host:** `127.0.0.1`
- **Port:** `6379`
- **Password:** (leave empty)

## Elasticsearch Access

### Connection Details
- **Host (from host machine):** `http://localhost:9200`
- **Host (from app container):** `http://elasticsearch:9200`
- **HTTP Port:** `9200`
- **Transport Port:** `9300`
- **Security:** Disabled (xpack.security.enabled=false)
- **Mode:** Single-node cluster

### Check Elasticsearch Status from Host Machine
```bash
curl http://localhost:9200
curl http://localhost:9200/_cluster/health?pretty
```

### Check Elasticsearch Status from App Container
```bash
docker exec -it laravel-app curl http://elasticsearch:9200
docker exec -it laravel-app curl http://elasticsearch:9200/_cluster/health?pretty
```

### Common Elasticsearch Operations
```bash
# List all indices
curl http://localhost:9200/_cat/indices?v

# Get index mapping
curl http://localhost:9200/index_name/_mapping?pretty

# Search all documents in index
curl http://localhost:9200/index_name/_search?pretty

# Delete an index
curl -X DELETE http://localhost:9200/index_name

# Get cluster stats
curl http://localhost:9200/_cluster/stats?pretty

# Get node info
curl http://localhost:9200/_nodes?pretty
```

### Elasticsearch from App Container
```bash
# Access Elasticsearch container bash
docker exec -it laravel-elasticsearch bash

# Then use curl inside container
curl http://localhost:9200
```

## Running Tests (PHPUnit)

### PHPUnit Configuration
- **Config File:** `/var/www/phpunit.xml`
- **Test Directory:** `/var/www/tests`
- **Test Suites:** Unit, Feature
- **Test Database:** SQLite in-memory (`:memory:`)

### Run All Tests
```bash
docker exec -it laravel-app vendor/bin/phpunit
```

### Run All Tests with Coverage (Text)
```bash
docker exec -it laravel-app vendor/bin/phpunit --coverage-text
```

### Run All Tests with Coverage (HTML)
```bash
docker exec -it laravel-app vendor/bin/phpunit --coverage-html coverage
```
**Output Location:** `/var/www/coverage/index.html`

### Run Specific Test Suite
```bash
# Run only Unit tests
docker exec -it laravel-app vendor/bin/phpunit --testsuite=Unit

# Run only Feature tests
docker exec -it laravel-app vendor/bin/phpunit --testsuite=Feature
```

### Run Specific Test File
```bash
docker exec -it laravel-app vendor/bin/phpunit tests/Unit/ExampleTest.php
docker exec -it laravel-app vendor/bin/phpunit tests/Feature/ExampleTest.php
```

### Run Specific Test Method
```bash
docker exec -it laravel-app vendor/bin/phpunit --filter test_method_name
docker exec -it laravel-app vendor/bin/phpunit tests/Unit/ExampleTest.php --filter test_example
```

### Run Tests with Verbose Output
```bash
docker exec -it laravel-app vendor/bin/phpunit --verbose
docker exec -it laravel-app vendor/bin/phpunit -v
```

### Run Tests and Stop on Failure
```bash
docker exec -it laravel-app vendor/bin/phpunit --stop-on-failure
```

### Interactive Testing (Inside Container)
```bash
docker exec -it laravel-app bash
cd /var/www
vendor/bin/phpunit
vendor/bin/phpunit --testsuite=Unit
vendor/bin/phpunit --filter test_name
```

## Running PHPStan (Static Analysis)

### PHPStan Configuration
- **Config File:** `/var/www/phpstan.neon`
- **Level:** 8 (strictest)
- **Analyzed Paths:** app, config, database, routes
- **Excluded Paths:** bootstrap/cache, storage, vendor

### Run PHPStan Analysis
```bash
docker exec -it laravel-app vendor/bin/phpstan analyse
```

### Run PHPStan with Verbose Output
```bash
docker exec -it laravel-app vendor/bin/phpstan analyse --verbose
docker exec -it laravel-app vendor/bin/phpstan analyse -v
```

### Run PHPStan on Specific Path
```bash
docker exec -it laravel-app vendor/bin/phpstan analyse app
docker exec -it laravel-app vendor/bin/phpstan analyse app/Models
docker exec -it laravel-app vendor/bin/phpstan analyse app/Http/Controllers
```

### Run PHPStan with Different Level
```bash
# Level 0 (least strict) to 9 (max)
docker exec -it laravel-app vendor/bin/phpstan analyse --level 0
docker exec -it laravel-app vendor/bin/phpstan analyse --level 5
docker exec -it laravel-app vendor/bin/phpstan analyse --level max
```

### Run PHPStan with Memory Limit
```bash
docker exec -it laravel-app vendor/bin/phpstan analyse --memory-limit=2G
```

### Generate PHPStan Baseline (Ignore Existing Errors)
```bash
docker exec -it laravel-app vendor/bin/phpstan analyse --generate-baseline
```

### Interactive PHPStan (Inside Container)
```bash
docker exec -it laravel-app bash
cd /var/www
vendor/bin/phpstan analyse
vendor/bin/phpstan analyse app
vendor/bin/phpstan analyse --verbose
```

## Accessing Logs

### Laravel Application Logs

#### View Laravel Log (Last 100 Lines)
```bash
docker exec -it laravel-app tail -n 100 /var/www/storage/logs/laravel.log
```

#### Follow Laravel Log (Real-time)
```bash
docker exec -it laravel-app tail -f /var/www/storage/logs/laravel.log
```

#### View Laravel Log from Host Machine
```bash
tail -f /Users/samuelgoodwin/Sites/GenericTemplate/storage/logs/laravel.log
tail -n 100 /Users/samuelgoodwin/Sites/GenericTemplate/storage/logs/laravel.log
```

#### Clear Laravel Log
```bash
docker exec -it laravel-app bash -c "truncate -s 0 /var/www/storage/logs/laravel.log"
```

#### View Laravel Log with Grep Filter
```bash
# Show only ERROR level logs
docker exec -it laravel-app grep "ERROR" /var/www/storage/logs/laravel.log

# Show logs from specific date
docker exec -it laravel-app grep "2025-10-13" /var/www/storage/logs/laravel.log
```

### Container Logs (Docker Logs)

#### View All Container Logs
```bash
docker-compose logs
```

#### View Specific Container Logs
```bash
docker-compose logs laravel-app
docker-compose logs laravel-nginx
docker-compose logs laravel-mariadb
docker-compose logs laravel-redis
docker-compose logs laravel-elasticsearch
docker-compose logs laravel-mailpit
```

#### Follow Container Logs (Real-time)
```bash
docker-compose logs -f laravel-app
docker-compose logs -f laravel-nginx
docker-compose logs -f laravel-mariadb
```

#### View Last N Lines of Container Logs
```bash
docker-compose logs --tail=100 laravel-app
docker-compose logs --tail=50 laravel-nginx
```

#### View Container Logs Since Specific Time
```bash
docker-compose logs --since 1h laravel-app
docker-compose logs --since 30m laravel-nginx
docker-compose logs --since "2025-10-13T10:00:00" laravel-app
```

### Nginx Logs

#### Nginx Access Log
```bash
docker exec -it laravel-nginx tail -f /var/log/nginx/access.log
docker exec -it laravel-nginx tail -n 100 /var/log/nginx/access.log
```

#### Nginx Error Log
```bash
docker exec -it laravel-nginx tail -f /var/log/nginx/error.log
docker exec -it laravel-nginx tail -n 100 /var/log/nginx/error.log
```

### MariaDB Logs
```bash
docker-compose logs laravel-mariadb
docker-compose logs -f laravel-mariadb
docker exec -it laravel-mariadb tail -f /var/log/mysql/error.log
```

### Redis Logs
```bash
docker-compose logs laravel-redis
docker-compose logs -f laravel-redis
```

### Elasticsearch Logs
```bash
docker-compose logs laravel-elasticsearch
docker-compose logs -f laravel-elasticsearch
docker exec -it laravel-elasticsearch tail -f /usr/share/elasticsearch/logs/docker-cluster.log
```

## Common Laravel Commands in Docker

### Artisan Commands
```bash
# Run any artisan command
docker exec -it laravel-app php artisan [command]

# Examples:
docker exec -it laravel-app php artisan migrate
docker exec -it laravel-app php artisan migrate:fresh --seed
docker exec -it laravel-app php artisan db:seed
docker exec -it laravel-app php artisan cache:clear
docker exec -it laravel-app php artisan config:clear
docker exec -it laravel-app php artisan route:clear
docker exec -it laravel-app php artisan view:clear
docker exec -it laravel-app php artisan optimize:clear
docker exec -it laravel-app php artisan queue:work
docker exec -it laravel-app php artisan tinker
```

### Composer Commands
```bash
# Run composer commands
docker exec -it laravel-app composer [command]

# Examples:
docker exec -it laravel-app composer install
docker exec -it laravel-app composer update
docker exec -it laravel-app composer require package/name
docker exec -it laravel-app composer dump-autoload
docker exec -it laravel-app composer show
```

### NPM/Node Commands
```bash
# Run npm commands
docker exec -it laravel-app npm [command]

# Examples:
docker exec -it laravel-app npm install
docker exec -it laravel-app npm run dev
docker exec -it laravel-app npm run build
docker exec -it laravel-app npm run prod
```

## File Permissions Issues

### Fix Storage and Cache Permissions
```bash
docker exec -it -u root laravel-app chown -R laravel:laravel /var/www/storage
docker exec -it -u root laravel-app chown -R laravel:laravel /var/www/bootstrap/cache
docker exec -it -u root laravel-app chmod -R 775 /var/www/storage
docker exec -it -u root laravel-app chmod -R 775 /var/www/bootstrap/cache
```

### Fix All Application Permissions
```bash
docker exec -it -u root laravel-app chown -R laravel:laravel /var/www
docker exec -it -u root laravel-app find /var/www -type f -exec chmod 664 {} \;
docker exec -it -u root laravel-app find /var/www -type d -exec chmod 775 {} \;
```

## Rebuilding Containers

### Rebuild Specific Container
```bash
docker-compose build laravel-app
docker-compose up -d --no-deps --build laravel-app
```

### Rebuild All Containers
```bash
docker-compose build
docker-compose up -d --build
```

### Rebuild from Scratch (No Cache)
```bash
docker-compose build --no-cache
docker-compose up -d --build
```

### Remove All Containers and Rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Volume Management

### List Volumes
```bash
docker volume ls
```

### Inspect Volume
```bash
docker volume inspect generictemplate_mariadb_data
docker volume inspect generictemplate_redis_data
docker volume inspect generictemplate_elasticsearch_data
```

### Remove All Volumes (WARNING: DATA LOSS)
```bash
docker-compose down -v
```

### Backup MariaDB Volume
```bash
docker exec laravel-mariadb mysqldump -u laravel -psecret laravel > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Mailpit (Email Testing)

Mailpit is a local email testing tool that captures all emails sent by your Laravel application during development. No emails are actually sent to real recipients - they're all caught by Mailpit and displayed in a web interface.

### Access Mailpit Web UI
```
http://localhost:8025
```

### SMTP Configuration (Already in .env)
- **Host:** `mailpit`
- **Port:** `1025`
- **Encryption:** None
- **Username:** None
- **Password:** None

### Testing Email Sending

#### Test with Artisan Tinker
```bash
docker exec -it laravel-app php artisan tinker
```
Then run:
```php
Mail::raw('This is a test email', function($message) {
    $message->to('test@example.com')
            ->subject('Test Email from Laravel');
});
```

#### Test with a Mailable Class
```bash
# Create a new mailable
docker exec -it laravel-app php artisan make:mail TestMail

# Send it via tinker
docker exec -it laravel-app php artisan tinker
```
```php
Mail::to('user@example.com')->send(new App\Mail\TestMail());
```

#### Test Password Reset Email
```bash
docker exec -it laravel-app php artisan tinker
```
```php
$user = User::first();
Password::sendResetLink(['email' => $user->email]);
```

### Using Mailpit Web Interface

#### View All Emails
Navigate to http://localhost:8025 to see all captured emails in a Gmail-like interface.

#### Features Available in UI
- View email HTML and plain text versions
- Check email headers
- Download email as .eml file
- View raw email source
- Search emails
- Mark emails as read/unread
- Delete individual emails or all emails

#### Clear All Emails via UI
Click the "Delete all messages" button in the web interface, or use the API command below.

### Mailpit API Commands

#### Clear All Emails via API
```bash
curl -X DELETE http://localhost:8025/api/v1/messages
```

#### List All Messages
```bash
curl http://localhost:8025/api/v1/messages | jq
```

#### Get Specific Message
```bash
# Replace {ID} with the message ID from the list
curl http://localhost:8025/api/v1/message/{ID} | jq
```

#### Search Messages
```bash
curl "http://localhost:8025/api/v1/messages?query=test@example.com" | jq
```

### View Mailpit Logs
```bash
docker-compose logs -f laravel-mailpit
```

### Restart Mailpit Container
```bash
docker-compose restart laravel-mailpit
```

### Common Use Cases

#### Verify User Registration Emails
1. Register a new user in your application
2. Open http://localhost:8025
3. Check if the verification email was sent correctly
4. Click links in the email to test verification flow

#### Test Notification Emails
```php
// In tinker or a controller
$user = User::first();
$user->notify(new \App\Notifications\WelcomeNotification());
```
Then check Mailpit UI to see the notification email.

#### Test Queue Jobs with Emails
```bash
# Run the queue worker
docker exec -it laravel-app php artisan queue:work

# Dispatch a job that sends email
docker exec -it laravel-app php artisan tinker
```
```php
dispatch(new \App\Jobs\SendWelcomeEmail($user));
```

#### Verify Email Templates
Use Mailpit to preview your email templates during development:
1. Send test emails with different data
2. Check HTML rendering in Mailpit UI
3. Test responsive design
4. Verify image loading and links

### Troubleshooting

#### Emails Not Appearing in Mailpit
```bash
# 1. Check Mailpit is running
docker-compose ps laravel-mailpit

# 2. Verify mail configuration in .env
docker exec -it laravel-app cat /var/www/.env | grep MAIL

# 3. Check Mailpit logs for errors
docker-compose logs laravel-mailpit

# 4. Test connection from app container
docker exec -it laravel-app telnet mailpit 1025

# 5. Clear Laravel config cache
docker exec -it laravel-app php artisan config:clear
```

#### Connection Refused Errors
```bash
# Restart Mailpit container
docker-compose restart laravel-mailpit

# Verify container is on the same network
docker network inspect generictemplate_laravel | grep mailpit
```

## Network Inspection

### List Networks
```bash
docker network ls
```

### Inspect Laravel Network
```bash
docker network inspect generictemplate_laravel
```

### Check Container IP Addresses
```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' laravel-app
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' laravel-mariadb
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' laravel-redis
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' laravel-elasticsearch
```

## Troubleshooting

### Container Won't Start
```bash
# View detailed logs
docker-compose logs laravel-app

# Check container status
docker-compose ps

# Try rebuilding
docker-compose build --no-cache laravel-app
docker-compose up -d --force-recreate laravel-app
```

### Port Already in Use
```bash
# Check what's using the port (macOS/Linux)
lsof -i :8000
lsof -i :3307
lsof -i :6379
lsof -i :9200
lsof -i :8025

# Kill the process
kill -9 [PID]

# Or change ports in docker-compose.yml
```

### Cannot Connect to Database
```bash
# Verify MariaDB is running
docker-compose ps laravel-mariadb

# Check MariaDB logs
docker-compose logs laravel-mariadb

# Verify credentials in .env match docker-compose.yml
# Test connection from app container
docker exec -it laravel-app php artisan tinker
# Then run: DB::connection()->getPdo();
```

### Elasticsearch Memory Issues
```bash
# Increase memory in docker-compose.yml:
# ES_JAVA_OPTS=-Xms1g -Xmx1g

# Or check Docker Desktop settings to increase memory allocation
```

### Clear Everything and Start Fresh
```bash
# WARNING: This will delete all data in volumes
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker exec -it laravel-app composer install
docker exec -it laravel-app php artisan migrate:fresh --seed
docker exec -it laravel-app npm install
docker exec -it laravel-app npm run build
```

## Quick Reference: Most Common Commands

```bash
# Start environment
docker-compose up -d

# Access PHP container
docker exec -it laravel-app bash

# Run migrations
docker exec -it laravel-app php artisan migrate

# Run tests
docker exec -it laravel-app vendor/bin/phpunit

# Run PHPStan
docker exec -it laravel-app vendor/bin/phpstan analyse

# View Laravel logs
docker exec -it laravel-app tail -f /var/www/storage/logs/laravel.log

# Connect to MariaDB
docker exec -it laravel-mariadb mysql -u laravel -psecret laravel

# Connect to Redis
docker exec -it laravel-redis redis-cli

# Clear Laravel caches
docker exec -it laravel-app php artisan optimize:clear

# Stop environment
docker-compose down
```

## Environment URLs

- **Application:** http://localhost:8000
- **Mailpit UI:** http://localhost:8025
- **Elasticsearch:** http://localhost:9200
- **MariaDB:** localhost:3307
- **Redis:** localhost:6379
