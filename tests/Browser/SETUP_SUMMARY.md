# Playwright E2E Tests - Setup Summary

## Quick Answer

**Yes, Playwright CAN run inside Docker containers!** You have 3 options:

1. ✅ **Run from Host** (currently configured) - Simplest for local dev
2. ⚙️ **Run Inside Container** (requires entrypoint script) - Best for CI/CD
3. 🚀 **Dedicated Playwright Container** (see DOCKER_SETUP.md) - Advanced CI/CD

## Option 1: Run from Host Machine (Current Setup)

**Recommended for**: Local development

```bash
# One-time setup
echo "127.0.0.1 virtualracingleagues.localhost" | sudo tee -a /etc/hosts
echo "127.0.0.1 app.virtualracingleagues.localhost" | sudo tee -a /etc/hosts
echo "127.0.0.1 admin.virtualracingleagues.localhost" | sudo tee -a /etc/hosts
npx playwright install

# Run tests
docker compose up -d
npm run test:e2e
```

## Option 2: Run Inside Docker Container

**Recommended for**: CI/CD pipelines

The entrypoint script is already created at `docker/app/docker-entrypoint.sh`. 

**To enable**:

1. Update your `Dockerfile` to use the entrypoint:
```dockerfile
COPY docker/app/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
```

2. Rebuild and run:
```bash
docker compose build app
docker compose up -d
docker compose exec app npm run test:e2e
```

The script automatically configures `/etc/hosts` to point subdomain URLs to the nginx service.

## Why the Original Error Occurred

The error `ERR_CONNECTION_REFUSED` happened because:
1. Tests tried to connect to `http://admin.virtualracingleagues.localhost`
2. Inside Docker, this URL wasn't resolved (no `/etc/hosts` entry)
3. Connection failed

## See Also

- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Full guide with 5 different approaches
- [README.md](./README.md) - Main documentation and usage guide
