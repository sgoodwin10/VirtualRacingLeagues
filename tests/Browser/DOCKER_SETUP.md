# Running Playwright Tests Inside Docker

Yes, you can absolutely run Playwright tests inside Docker containers! Here are the proper approaches:

## Approach 1: Add Extra Hosts to App Container (Current Setup - Needs Fix)

Our `docker-compose.yml` already has `extra_hosts` configured, but it points to `host-gateway` which doesn't work for our setup. We need to point to the nginx service instead.

### Fix the docker-compose.yml

```yaml
services:
  app:
    extra_hosts:
      - "virtualracingleagues.localhost:nginx"
      - "app.virtualracingleagues.localhost:nginx"
      - "admin.virtualracingleagues.localhost:nginx"
```

However, this approach has a limitation: `extra_hosts` only accepts IP addresses, not service names.

## Approach 2: Modify /etc/hosts Inside Container at Runtime (Recommended)

Add a script that modifies `/etc/hosts` when the container starts:

### 1. Create an entrypoint script

```bash
# docker/app/docker-entrypoint.sh
#!/bin/bash

# Get nginx container IP
NGINX_IP=$(getent hosts nginx | awk '{ print $1 }')

# Add subdomain entries to /etc/hosts
echo "${NGINX_IP} virtualracingleagues.localhost" >> /etc/hosts
echo "${NGINX_IP} app.virtualracingleagues.localhost" >> /etc/hosts
echo "${NGINX_IP} admin.virtualracingleagues.localhost" >> /etc/hosts

# Execute the main command
exec "$@"
```

### 2. Update Dockerfile

```dockerfile
# Copy entrypoint script
COPY docker/app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
```

### 3. Update docker-compose.yml

```yaml
services:
  app:
    # ... existing config ...
    # Remove or comment out extra_hosts since we're using /etc/hosts modification
    # extra_hosts:
    #   - "virtualracingleagues.localhost:host-gateway"
```

### 4. Run tests inside container

```bash
docker compose exec app npm run test:e2e
```

## Approach 3: Dedicated Playwright Service (Best for CI/CD)

Create a separate service specifically for running Playwright tests:

### 1. Add to docker-compose.yml

```yaml
services:
  # ... existing services ...

  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    container_name: virtualracingleagues-playwright
    working_dir: /var/www
    volumes:
      - ./:/var/www
      - /var/www/node_modules  # Use container's node_modules
    networks:
      - virtualracingleagues
    depends_on:
      - app
      - nginx
    environment:
      - CI=true
    command: tail -f /dev/null  # Keep container running
```

### 2. Create Dockerfile.playwright

```dockerfile
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

WORKDIR /var/www

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Modify /etc/hosts to point subdomains to nginx
RUN echo "# Playwright subdomain routing" >> /etc/hosts && \
    echo "nginx virtualracingleagues.localhost" >> /etc/hosts && \
    echo "nginx app.virtualracingleagues.localhost" >> /etc/hosts && \
    echo "nginx admin.virtualracingleagues.localhost" >> /etc/hosts
```

### 3. Run tests

```bash
# Start the playwright service
docker compose up -d playwright

# Run tests
docker compose exec playwright npm run test:e2e

# Or run in one command
docker compose run --rm playwright npm run test:e2e
```

## Approach 4: Use Docker's Internal DNS with Custom Resolver

Configure Playwright to use a custom DNS resolver that understands Docker's internal DNS:

### 1. Create a custom hosts configuration

```typescript
// playwright.config.ts
export default defineConfig({
  // ... other config ...
  use: {
    baseURL: 'http://nginx',  // Use nginx service directly
    extraHTTPHeaders: {
      // Set Host header for all requests
      'Host': 'admin.virtualracingleagues.localhost',
    },
  },
});
```

But this requires different configs for each subdomain, so not ideal for our multi-subdomain setup.

## Approach 5: Use a DNS Proxy Container (Advanced)

Set up a DNS proxy like `dnsmasq` that resolves `*.localhost` to nginx:

### 1. Add dnsmasq service

```yaml
services:
  dnsmasq:
    image: jpillora/dnsmasq
    container_name: virtualracingleagues-dnsmasq
    ports:
      - "53:53/udp"
    environment:
      - "HTTP_USER=admin"
      - "HTTP_PASS=admin"
    volumes:
      - ./docker/dnsmasq/dnsmasq.conf:/etc/dnsmasq.conf
    networks:
      - virtualracingleagues
```

### 2. Configure DNS

```conf
# docker/dnsmasq/dnsmasq.conf
address=/localhost/nginx
```

This is overkill for our use case.

## Recommended Solution for This Project

**Approach 2** (Modify /etc/hosts at runtime) is the best balance of simplicity and reliability:

1. ✅ Works consistently inside the container
2. ✅ No need for separate Playwright container
3. ✅ Developers can run tests with `docker compose exec app npm run test:e2e`
4. ✅ Works well for CI/CD pipelines
5. ✅ No changes needed to test code

## Why Original Approach Failed

The original setup used `extra_hosts` pointing to `host-gateway`, which tries to route to the host machine. This fails because:

1. **From inside container → host-gateway**: Tries to connect to host machine's port 80
2. **Problem**: The host machine needs `/etc/hosts` entries to route back to Docker
3. **Result**: Connection refused or routing errors

## Summary

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Host Machine** | Simple, no setup | Requires /etc/hosts on dev machine | Local development |
| **Runtime /etc/hosts** | Clean, automatic | Requires entrypoint script | Docker-based dev & CI |
| **Dedicated Playwright Service** | Isolated, reproducible | Extra container overhead | CI/CD pipelines |
| **Official Playwright Image** | Pre-installed browsers | Larger image size | CI/CD with matrix testing |

Would you like me to implement Approach 2 (runtime /etc/hosts modification) so tests can run inside Docker?
