// Environment validation utility
// Ensures all required environment variables are present before app starts

interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Brevo Email
  BREVO_API_KEY: string
  BREVO_FROM_EMAIL: string
  
  // App Config
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: string
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BREVO_API_KEY',
  'BREVO_FROM_EMAIL',
  'NEXT_PUBLIC_APP_URL',
]

const optionalEnvVars = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'RECAPTCHA_SECRET_KEY',
]

export function validateEnv(): EnvConfig {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key)
    }
  })

  // Check optional variables
  optionalEnvVars.forEach((key) => {
    if (!process.env[key]) {
      warnings.push(key)
    }
  })

  // Report missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach((key) => console.error(`   - ${key}`))
    console.error('\n💡 Please check your .env.local file')
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Report missing optional variables
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:')
    warnings.forEach((key) => console.warn(`   - ${key}`))
    console.warn('   Some features may not work properly.\n')
  }

  // Validate format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with https://')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_APP_URL must start with http:// or https://')
  }

  console.log('✅ Environment validation passed')

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    BREVO_API_KEY: process.env.BREVO_API_KEY!,
    BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
    NODE_ENV: process.env.NODE_ENV || 'development',
  }
}

// Get validated env config
export const env = validateEnv()
