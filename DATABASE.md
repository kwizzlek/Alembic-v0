# Database Documentation

## Overview
This document describes the database schema, security policies, and access patterns for the Alembic application. The application uses Supabase as the backend database with a multi-tenant architecture.

## Database Migrations

Database schema changes are managed through SQL migration files in the `supabase/migrations` directory. Each migration file is prefixed with a timestamp to ensure they are applied in the correct order.

### Creating a New Migration

1. Create a new SQL file in `supabase/migrations` with the following naming convention:
   ```
   YYYYMMDDHHMMSS_descriptive_name.sql
   ```

2. Write your SQL statements in the file. Make sure they are idempotent (can be run multiple times without issues).

3. Test the migration in your development environment before applying to production.

### Applying Migrations

#### Local Development
1. Open the Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of the migration file
4. Run the SQL in the editor

#### Production
1. Use the Supabase CLI to apply migrations:
   ```bash
   supabase db push
   ```

### Best Practices

- Always test migrations in a development environment first
- Never modify migration files after they've been applied to production
- Each migration should be idempotent (can be run multiple times without issues)
- Include comments explaining complex operations
- Consider data migration steps separately from schema changes

## Supabase Configuration

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Authentication
Supabase Auth is used for user authentication. The following tables are provided by Supabase:

#### auth.users
Stores user authentication information (managed by Supabase).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | User's email address |
| email_confirmed_at | TIMESTAMPTZ | When email was confirmed |
| created_at | TIMESTAMPTZ | When the user was created |
| updated_at | TIMESTAMPTZ | When the user was last updated |

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

## Storage

### Storage Bucket: documents
Stores the actual file content with secure, tenant-isolated access.

| Setting | Value | Description |
|---------|-------|-------------|
| Name | documents | Bucket identifier |
| Public | false | Access controlled by RLS policies |
| File Structure | `{tenant_id}/{filename}` | Tenant-isolated file paths |

#### Storage Policies
- Users can only access files within their tenant's directory
- File uploads are restricted to the user's tenant directory
- File deletions are restricted to file owners and tenant admins

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

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in a user
- `POST /api/auth/signout` - Sign out the current user
- `GET /api/auth/session` - Get the current session

### Organizations
- `GET /api/organizations` - List organizations for current user
- `POST /api/organizations` - Create a new organization
- `GET /api/organizations/[id]` - Get organization details
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Delete organization
- `GET /api/organizations/[id]/members` - List organization members
- `POST /api/organizations/[id]/invite` - Invite member to organization
- `DELETE /api/organizations/[id]/members/[userId]` - Remove member from organization

### Documents
- `GET /api/documents` - List documents for current tenant
- `POST /api/documents` - Upload a new document
- `GET /api/documents/[id]` - Get document details
- `PUT /api/documents/[id]` - Update document metadata
- `DELETE /api/documents/[id]` - Delete a document
- `GET /api/documents/[id]/download` - Download document content
