# Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Project Settings > API
3. Find your Project URL and anon/public key
4. For the service role key, go to Project Settings > API > Project API keys

## Security Notes

- Never commit your `.env.local` file to version control
- The service role key has full access to your database, so keep it secure
- For production, set up proper environment variables in your hosting provider
