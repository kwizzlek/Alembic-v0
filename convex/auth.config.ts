export default {
  providers: [
    {
      // The domain is the URL of your Supabase project
      // It should look like: https://<YOUR-PROJECT-REF>.supabase.co
      domain: process.env.SUPABASE_URL!,
      applicationID: "authenticated",
    },
  ],
};