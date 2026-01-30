# Production Documentation

This directory contains comprehensive guides for deploying and managing the application in production environments.

## Available Guides

### Infrastructure & Services

- **[Laravel Horizon Deployment Guide](./horizon-deployment.md)** - Complete guide for deploying Laravel Horizon queue manager in production
  - Prerequisites and server requirements
  - Environment and Redis configuration
  - Supervisor setup and management
  - Deployment workflows
  - Security considerations
  - Monitoring and alerting
  - Scaling strategies
  - Troubleshooting

### Coming Soon

Additional production guides that will be added:

- **Database Deployment** - MariaDB configuration, replication, backups
- **Elasticsearch Deployment** - Production setup, indexing strategies, monitoring
- **Nginx Configuration** - SSL/TLS, load balancing, caching
- **Docker Production Setup** - Production Docker configurations, orchestration
- **Monitoring & Logging** - Centralized logging, metrics, alerting
- **Backup & Disaster Recovery** - Automated backups, restoration procedures
- **Performance Optimization** - Caching strategies, query optimization, CDN
- **Security Hardening** - Firewall rules, intrusion detection, vulnerability scanning

## Quick Links

### Horizon Management

```bash
# Start Horizon
php artisan horizon

# Gracefully terminate (during deployments)
php artisan horizon:terminate

# Check status
php artisan horizon:status

# View dashboard
https://your-domain.com/admin/horizon
```

### Supervisor Management

```bash
# Check Horizon status
sudo supervisorctl status horizon

# Restart Horizon
sudo supervisorctl restart horizon

# View logs
sudo supervisorctl tail -f horizon
```

### Common Deployment Steps

1. Pull latest code
2. Install dependencies: `composer install --no-dev --optimize-autoloader`
3. Run migrations: `php artisan migrate --force`
4. Clear caches: `php artisan config:clear && php artisan cache:clear`
5. Rebuild caches: `php artisan config:cache && php artisan route:cache`
6. Terminate Horizon: `php artisan horizon:terminate`
7. Restart services: `sudo supervisorctl restart horizon`

## Environment-Specific Notes

### Staging Environment

- Use for testing deployments before production
- Mirror production configuration as closely as possible
- Use separate Redis and database instances
- Enable more verbose logging for debugging

### Production Environment

- Always use HTTPS/SSL
- Enable Redis password authentication
- Secure Horizon dashboard with IP whitelist or VPN
- Set up monitoring and alerting
- Configure automated backups
- Use environment-specific `.env` files
- Never commit `.env` to version control

## Support & Resources

### Laravel Documentation

- [Laravel Documentation](https://laravel.com/docs/12.x)
- [Laravel Horizon](https://laravel.com/docs/12.x/horizon)
- [Laravel Queues](https://laravel.com/docs/12.x/queues)

### Infrastructure Documentation

- [Redis Documentation](https://redis.io/docs/)
- [Supervisor Documentation](http://supervisord.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MariaDB Documentation](https://mariadb.org/documentation/)

### Monitoring & Tools

- [Laravel Telescope](https://laravel.com/docs/12.x/telescope) - Debugging assistant
- [Laravel Pulse](https://laravel.com/docs/12.x/pulse) - Application monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [New Relic](https://newrelic.com/) - APM monitoring

## Contributing

When adding new production guides:

1. Follow the same structure and format as existing guides
2. Include practical, copy-paste ready configurations
3. Provide troubleshooting sections for common issues
4. Add examples with real-world scenarios
5. Update this README with links to new guides

## Questions?

If you encounter issues not covered in these guides:

1. Check the troubleshooting sections in each guide
2. Review application logs: `storage/logs/laravel.log`
3. Check service-specific logs (Horizon, Supervisor, Redis, etc.)
4. Consult the official Laravel and service documentation
