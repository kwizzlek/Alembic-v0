# Supabase Setup

This directory contains the configuration and migration files for the Supabase backend.

## Directory Structure

```
supabase/
├── config.toml          # Supabase configuration
├── init.sql             # Database initialization script
├── kong.yml             # Kong API gateway configuration
├── migrations/          # Database migration files
│   └── *.sql           # Migration files (ordered by timestamp)
└── README.md            # This file
```

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js and npm

### Getting Started

1. **Start the Supabase stack**:
   ```bash
   docker-compose up -d
   ```

2. **Apply migrations**:
   ```bash
   # Apply all migrations
   ./supabase/reset-db.sh
   ```

3. **Access the services**:
   - Supabase Studio: http://localhost:3000
   - REST API: http://localhost:3001/rest/v1/
   - Auth API: http://localhost:3001/auth/v1/
   - Storage API: http://localhost:3001/storage/v1/

## Database Migrations

### Creating a New Migration

1. Create a new SQL file in the `migrations` directory with the following naming convention:
   ```
   YYYYMMDDHHMMSS_descriptive_name.sql
   ```

2. Write your SQL statements in the file. Make sure they are idempotent.

3. Test the migration locally before committing.

### Applying Migrations

Migrations are automatically applied when the database container starts. You can also apply them manually:

```bash
# Apply a specific migration
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (must match the one in docker-compose.yml)
JWT_SECRET=your-super-secret-jwt-token
```

## Troubleshooting

### Reset the Database

To completely reset the database and start fresh:

```bash
# Stop and remove all containers
docker-compose down -v

# Remove all Docker volumes
docker volume prune

# Start the stack again
docker-compose up -d
```

### View Logs

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f db
```

## Production Deployment

For production deployment, consider using Supabase's managed service or deploying to your own infrastructure with proper security measures in place.

### Required Changes for Production

1. Update all passwords and secrets
2. Enable SSL/TLS
3. Set up proper CORS policies
4. Configure backup and monitoring
5. Set up rate limiting and other security measures

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
