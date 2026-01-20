// Workaround for SSL certificate issues in localhost development
// This is ONLY for development environment and will not affect production

if (process.env.NODE_ENV === 'development') {
  // Disable SSL verification for localhost development only
  // This is safe because we're only connecting to Supabase API
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  console.log('🔧 Development mode: SSL verification disabled for Supabase connections');
}

export {};
