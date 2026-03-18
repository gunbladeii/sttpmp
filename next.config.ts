import type { NextConfig } from "next";

// Fix SSL certificate issues in localhost development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🔧 Development mode: SSL verification disabled for Supabase API');
}

const nextConfig: NextConfig = {
  // ↩️ REDIRECT: sttpmp.vercel.app → VPS (http://45.127.7.201/)
  // Only activates on Vercel deployment, not on VPS itself.
  async redirects() {
    if (process.env.VERCEL) {
      return [
        {
          source: '/:path*',
          destination: 'http://45.127.7.201/:path*',
          permanent: false, // 307 — senang nak tukar balik kalau perlu
        },
      ]
    }
    return []
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'enazir.moe.gov.my',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
    ],
    unoptimized: false,
  },
  
  // ⚡ INCREASE BODY SIZE LIMIT FOR ANNOUNCEMENTS WITH MULTIPLE IMAGES
  // Default Next.js limit is 4.5MB which is too small for TipTap content with base64 images
  // This allows announcements with multiple screenshots/images
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increased from default 1mb to 10mb
    },
  },
  
  // Security headers to mitigate CVE-2025-55182
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              process.env.NODE_ENV === 'development' 
                ? "img-src 'self' data: https: http: blob:" 
                : "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.brevo.com",
              "frame-src 'self' https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
            ].filter(Boolean).join('; ')
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ],
      },
    ]
  },
  
  // Additional security configurations
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
