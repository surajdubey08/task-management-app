# Using Database Improvements in TaskFlow

## Overview

This document explains how to use the database improvements implemented in the TaskFlow application, including migrations, multi-environment support, and backup/recovery procedures.

## Database Migration System

### Running Migrations

The TaskFlow application now includes an automated migration system that runs when the application starts. Migrations are automatically applied based on the database provider configured.

To manually run migrations, use the following commands from the `backend/TaskManagement.API` directory:

```bash
# Apply all pending migrations
dotnet ef database update

# Create a new migration after making model changes
dotnet ef migrations add MigrationName

# Remove the last migration
dotnet ef migrations remove

# Generate SQL script for migration
dotnet ef migrations script
```

### Adding New Database Changes

1. Modify the entity models in the `Models` directory
2. Create a new migration:
   ```bash
   dotnet ef migrations add DescriptionOfChanges
   ```
3. Review the generated migration file in the `Migrations` directory
4. Test the migration in development environment
5. The migration will automatically run in other environments

## Multi-Environment Database Configuration

### Setting Database Provider

The database provider can be configured using the `DatabaseProvider` setting:

#### In appsettings.json:
```json
{
  "DatabaseProvider": "SQLite"
}
```

#### As Environment Variable:
```bash
DatabaseProvider=PostgreSQL
```

#### In Docker Compose:
```yaml
environment:
  - DatabaseProvider=SQLServer
```

### Supported Database Providers

1. **SQLite** (Default for Development)
   - Connection String Key: `DefaultConnection`
   - Best for: Development, testing, small deployments

2. **PostgreSQL** (Recommended for Production)
   - Connection String Key: `PostgreSQLConnection`
   - Best for: Production, scalability, advanced features

3. **SQL Server** (Enterprise Option)
   - Connection String Key: `SQLServerConnection`
   - Best for: Enterprise environments, existing Microsoft ecosystem

### Environment-Specific Configuration

#### Development (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=taskmanagement.db"
  },
  "DatabaseProvider": "SQLite"
}
```

#### Staging (appsettings.Staging.json)
```json
{
  "ConnectionStrings": {
    "PostgreSQLConnection": "Host=staging-db.taskflow.com;Database=taskmanagement;Username=taskflow_user;Password=*****"
  },
  "DatabaseProvider": "PostgreSQL"
}
```

#### Production (appsettings.Production.json)
```json
{
  "ConnectionStrings": {
    "PostgreSQLConnection": "Host=prod-db.taskflow.com;Database=taskmanagement;Username=taskflow_user;Password=*****"
  },
  "DatabaseProvider": "PostgreSQL",
  "BackupSettings": {
    "Enabled": true,
    "Schedule": "0 2 * * *",
    "RetentionDays": 30
  }
}
```

## Backup and Recovery Procedures

### Automated Backups

Backups are automatically configured based on the environment:

1. **Development**: Simple file copy of SQLite database
2. **Staging**: Daily PostgreSQL dumps
3. **Production**: Daily full backups, hourly incrementals, 15-minute transaction logs

### Manual Backup

To manually trigger a backup:

```bash
# Using the backup script
./scripts/backup.sh

# For Docker environments
docker-compose exec api ./scripts/backup.sh
```

### Recovery Process

To recover from a backup:

1. Identify the appropriate backup file
2. Stop the application services
3. Run the recovery script:
   ```bash
   ./scripts/restore.sh backup_filename.db
   ```
4. Start the application services
5. Verify data integrity

## Docker Configuration

### Development Environment

The default docker-compose.yml is configured for SQLite development:

```yaml
services:
  api:
    environment:
      - DatabaseProvider=SQLite
      - ConnectionStrings__DefaultConnection=Data Source=/app/data/taskmanagement.db
    volumes:
      - taskmanagement_data:/app/data
```

### Production Environment

For production deployments, modify the docker-compose.yml:

```yaml
services:
  api:
    environment:
      - DatabaseProvider=PostgreSQL
      - ConnectionStrings__PostgreSQLConnection=Host=prod-db;Database=taskmanagement;Username=user;Password=pass
```

## Monitoring and Health Checks

### Database Health Endpoint

The application includes a health check endpoint at `/health` that verifies:

1. Database connectivity
2. Migration status
3. Query performance

### Monitoring Metrics

Key database metrics are logged and can be monitored:

1. Query execution times
2. Connection pool usage
3. Migration success/failure rates
4. Backup success/failure rates

## Troubleshooting

### Common Issues

#### Migration Failures
- Check migration file syntax
- Verify database connectivity
- Ensure sufficient permissions
- Review migration execution logs

#### Connection Issues
- Verify connection string format
- Check database server availability
- Confirm firewall settings
- Validate credentials

#### Backup Failures
- Check available disk space
- Verify backup directory permissions
- Review backup script logs
- Test backup manually

### Logs and Diagnostics

Database-related logs can be found in:

1. **Application logs**: `logs/taskmanagement-*.txt`
2. **Docker logs**: `docker-compose logs api`
3. **Database logs**: Provider-specific locations

## Best Practices

### Development
1. Always test migrations in development first
2. Use SQLite for local development
3. Keep migrations small and focused
4. Never modify existing migration files

### Production
1. Always backup before applying migrations
2. Test migrations in staging environment
3. Monitor application during migration
4. Have rollback plan ready

### Security
1. Store connection strings securely
2. Use encrypted backups
3. Rotate database credentials regularly
4. Limit database user permissions

## Future Enhancements

### Planned Improvements
1. Automated backup verification
2. Point-in-time recovery
3. Cross-region backup replication
4. Advanced monitoring dashboards
5. Automated failover procedures

### Contributing
To contribute to database improvements:
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

## Support

For issues with database configuration or migrations:
1. Check the documentation
2. Review application logs
3. Open an issue on GitHub
4. Contact the development team