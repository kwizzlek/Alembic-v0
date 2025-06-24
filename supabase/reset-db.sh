#!/bin/bash

# Stop any running Supabase containers
echo "Stopping any running Supabase containers..."
docker-compose -f docker-compose.yml down

# Remove the Supabase Docker volumes to clear all data
echo "Removing Supabase volumes..."
docker volume rm $(docker volume ls -q | grep supabase) 2>/dev/null || true

# Start Supabase
echo "Starting Supabase..."
docker-compose -f docker-compose.yml up -d

# Wait for Supabase to be ready
echo "Waiting for Supabase to be ready..."
until curl -s -f -o /dev/null http://localhost:54321/rest/v1/; do
  sleep 1
done

# Apply migrations
echo "Applying migrations..."
for file in supabase/migrations/*.sql; do
  echo "Applying migration: $file"
  psql -h localhost -p 54322 -U postgres -d postgres -f "$file"
done

echo "Database reset complete!"
