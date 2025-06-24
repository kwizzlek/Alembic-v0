# Database Migrations

This directory contains SQL migration files for the Supabase database. Each migration file is prefixed with a timestamp to ensure they are applied in the correct order.

## Naming Conventions

Migration files should be named in the following format:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

## Applying Migrations

### Local Development
1. Open the Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of the migration file
4. Run the SQL in the editor

### Production
1. Use the Supabase CLI to apply migrations:
   ```bash
   supabase db push
   ```

## Best Practices

1. Always test migrations in a development environment first
2. Never modify migration files after they've been applied to production
3. Each migration should be idempotent (can be run multiple times without issues)
4. Include comments explaining complex operations
5. Consider data migration steps separately from schema changes
