# Database Documentation

## Overview
This document describes the database schema, security policies, and access patterns for the Alembic application. The application uses Supabase as the backend database with a multi-tenant architecture.

## Schema

### Tenants Table
Stores information about each organization in the system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Display name of the organization |
| settings | JSONB | Organization-specific settings |
| created_at | TIMESTAMPTZ | When the organization was created |
| updated_at | TIMESTAMPTZ | When the organization was last updated |

### Tenant Members Table
Manages user memberships in organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | References tenants.id |
| user_id | UUID | References auth.users.id |
| role | TEXT | Member role (owner, admin, member) |
| created_at | TIMESTAMPTZ | When the membership was created |
| updated_at | TIMESTAMPTZ | When the membership was last updated |

### Profiles Table
Extends the Supabase auth.users table with application-specific user information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | References auth.users.id |
| full_name | TEXT | User's full name |
| avatar_url | TEXT | URL to user's avatar |
| created_at | TIMESTAMPTZ | When the profile was created |
| updated_at | TIMESTAMPTZ | When the profile was last updated |

### Documents Table
Stores metadata for uploaded files with multi-tenant support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | References tenants.id |
| user_id | UUID | References auth.users.id (uploader) |
| filename | TEXT | Original file name |
| file_path | TEXT | Path in storage bucket (format: `tenant_id/filename`) |
| metadata | JSONB | Additional file metadata (size, mime_type, etc.) |
| created_at | TIMESTAMPTZ | When the document was uploaded |
| updated_at | TIMESTAMPTZ | When the document was last updated |

### Storage Bucket: documents
Stores the actual file content with secure, tenant-isolated access.

| Setting | Value | Description |
|---------|-------|-------------|
| Name | documents | Bucket identifier |
| Public | false | Access controlled by RLS policies |
| File Structure | `{tenant_id}/{filename}` | Tenant-isolated file paths |

## Indexes

```sql
-- Tenant members lookups
CREATE INDEX idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON public.tenant_members(user_id);

-- Documents table indexes
CREATE INDEX idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at);
CREATE INDEX idx_documents_metadata_gin ON public.documents USING GIN (metadata);

-- Ensure unique membership per tenant
ALTER TABLE public.tenant_members ADD CONSTRAINT unique_tenant_member 
  UNIQUE (tenant_id, user_id);
```

## Security

### Row Level Security (RLS)

1. **Tenants Table**
   - Users can view tenants they are members of
   - Only organization owners can update tenant information

2. **Tenant Members Table**
   - Users can see members of organizations they belong to
   - Users can view their own memberships
   - Only organization owners can add/remove members

3. **Documents Table**
   - Users can view documents from their tenant
   - Users can upload documents to their tenant's folder
   - Users can update/delete documents they uploaded
   - Tenant admins can update/delete any document in their tenant

### Storage Security

1. **Documents Bucket**
   - Private bucket with RLS enabled
   - Files stored in tenant-specific paths
   - Access controlled by tenant membership

2. **Access Rules**
   - Users can only access files within their tenant's folder
   - File paths must start with the user's tenant ID
   - All operations are audited in the documents table

### Helper Functions

```sql
-- Check if a user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if a user is an owner of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
    AND tenant_members.role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Update document's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Indexes

```sql
-- Tenant members lookups
CREATE INDEX idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON public.tenant_members(user_id);

-- Ensure unique membership per tenant
ALTER TABLE public.tenant_members ADD CONSTRAINT unique_tenant_member 
  UNIQUE (tenant_id, user_id);
```

## Security

### Row Level Security (RLS)

1. **Tenants Table**
   - Users can view tenants they are members of
   - Only organization owners can update tenant information

2. **Tenant Members Table**
   - Users can see members of organizations they belong to
   - Users can view their own memberships
   - Only organization owners can add/remove members

### Helper Functions

```sql
-- Check if a user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if a user is an owner of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
    AND tenant_members.role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

## API Endpoints

### Create Organization
```
POST /api/orgs
{
  "name": "Organization Name"
}
```

### Update Organization
```
PATCH /api/orgs/:id
{
  "name": "New Organization Name"
}
```

### Delete Organization
```
DELETE /api/orgs/:id
```

## Best Practices

1. **Data Access**
   - Always use the helper functions for permission checks
   - Use the organization context to get the current organization
   - Validate user permissions before performing sensitive operations

2. **Security**
   - Never expose sensitive data in API responses
   - Always validate input data
   - Use RLS as the primary security mechanism

3. **Performance**
   - Ensure proper indexes are in place for common query patterns
   - Monitor query performance using Supabase's query analysis tools
   - Consider denormalizing data for frequently accessed information

## Changelog

### 2024-06-21
- Removed subdomain functionality
- Simplified organization management
- Added proper RLS policies
- Updated documentation to reflect current schema
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | References tenants.id |
| name | TEXT | Workflow name |
| status | TEXT | Workflow status (draft, pending, approved, rejected) |
| definition | JSONB | Workflow definition |
| created_by | UUID | References profiles.id (creator) |
| created_at | TIMESTAMPTZ | When the workflow was created |
| updated_at | TIMESTAMPTZ | When the workflow was last updated |

## Row Level Security (RLS) Policies

### Tenants
- **View**: All authenticated users can view all tenants
- **Create**: Authenticated users can create new tenants

### Profiles
- **View**: Users can view their own profile or if they have service role
- **Create**: Automatic profile creation via trigger when new user signs up

### Documents
- **View**: Users can view documents from their tenant
- **Create**: Users can create documents for their tenant
- **Update/Delete**: Currently restricted (add specific policies as needed)

### Workflows
- **View**: Users can view workflows from their tenant
- **Create**: Users can create workflows for their tenant
- **Update/Delete**: Currently restricted (add specific policies as needed)

## Triggers

1. **update_modified_column**
   - Updates the `updated_at` timestamp on any table update
   - Applies to: tenants, profiles, documents, workflows

2. **handle_new_user**
   - Creates a profile when a new user signs up via Supabase Auth
   - Sets default role to 'user'

## Indexes

- `idx_profiles_tenant_id` - Speeds up tenant-based queries on profiles
- `idx_documents_tenant_id` - Speeds up tenant-based queries on documents
- `idx_documents_user_id` - Speeds up user-based document queries
- `idx_workflows_tenant_id` - Speeds up tenant-based workflow queries
- `idx_workflows_created_by` - Speeds up creator-based workflow queries

## Best Practices

1. **Multi-tenancy**: Always include `tenant_id` in queries to ensure data isolation
2. **RLS**: All tables have RLS enabled - ensure proper policies are in place
3. **Timestamps**: Use `created_at` and `updated_at` for auditing
4. **Soft Deletes**: Consider adding `deleted_at` for soft delete functionality

## Example Queries

### Get all documents for current user's tenant
```sql
SELECT * FROM public.documents 
WHERE tenant_id = (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
);
```

### Get all workflows created by current user
```sql
SELECT * FROM public.workflows 
WHERE created_by = auth.uid()
AND tenant_id = (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
);
```

### Get user's tenant information
```sql
SELECT t.* FROM public.tenants t
JOIN public.profiles p ON p.tenant_id = t.id
WHERE p.id = auth.uid();
```

## Troubleshooting

### Common Issues

1. **RLS Violations**
   - Ensure the user is authenticated
   - Verify the user has the correct tenant association
   - Check the JWT claims for the correct user ID and role

2. **Missing Permissions**
   - Verify the authenticated role has necessary permissions
   - Check if the user is associated with a tenant

3. **Performance Issues**
   - Ensure proper indexes are in place for common query patterns
   - Monitor query performance using Supabase's query analysis tools
