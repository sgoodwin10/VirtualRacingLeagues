



# install claude code
`npm install -g @anthropic-ai/claude-code`

`claude --dangerously-skip-permissions`


# install context 7
`claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"` ctx7sk-4a173fe9-ebc5-492a-8cc4-35a3692ed62c


# CC Usage
`npx ccstatusline@latest`

# Playwright
claude mcp add playwright npx @playwright/mcp@latest

## need to login as root
sudo npx playwright install-deps 

## need to login as normal - probably from local machine
npx playwright install
npm run test:e2e

### PHP Application Container as Root
```bash
docker exec -it -u root virtualracingleagues-app bash
```

## Enable zsh
zsh -v


## Force Rebuild
`docker compose up --build --force-recreate -d`
`docker-compose build --no-cache`

# Access the docker container
```bash
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed    # Optional: creates default admin user
npm install
npm run build
```

`docker exec -it -u root virtualracingleagues-app bash`


# Or run only the driver seeder
  php artisan db:seed --class=DriverSeeder
  

# URLS
http://virtualracingleagues.localhost
http://app.virtualracingleagues.localhost
http://adminvirtualracingleagues.localhost

# Mailpit
http://virtualracingleagues.localhost:8025 


 docker compose down
  docker compose up -d



# Remove all stopped containers
docker container prune

# Remove all unused images (not just dangling ones)
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune