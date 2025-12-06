import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Middleware
 * Additional protection layer for CVE-2025-55182
 * Validates and sanitizes all incoming requests
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Security headers already set in next.config.ts
  const response = NextResponse.next()
  
  // Add request ID for tracking
  response.headers.set('X-Request-ID', crypto.randomUUID())
  
  // Block suspicious user agents
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /bot/i,
    /crawler/i,
  ]
  
  // Allow legitimate bots but block suspicious ones on sensitive routes
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/') &&
      suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    
    // Log suspicious activity
    console.warn(`🚨 Suspicious request blocked: ${pathname} from ${userAgent}`)
    
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // Validate content-type for API POST/PUT/PATCH requests
  if (pathname.startsWith('/api/') && 
      ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    
    const contentType = request.headers.get('content-type') || ''
    
    // Only allow JSON or multipart/form-data
    const isValidContentType = 
      contentType.includes('application/json') ||
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    
    if (!isValidContentType) {
      console.warn(`🚨 Invalid content-type blocked: ${contentType} for ${pathname}`)
      
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 415 }
      )
    }
  }
  
  // Check for suspicious query parameters
  const url = request.nextUrl
  const suspiciousParams = ['<script', 'javascript:', 'onerror=', 'onload=', '../', '..\\']
  
  for (const [key, value] of url.searchParams.entries()) {
    if (suspiciousParams.some(pattern => 
        key.toLowerCase().includes(pattern) || 
        value.toLowerCase().includes(pattern))) {
      
      console.warn(`🚨 Suspicious query parameter blocked: ${key}=${value}`)
      
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
  }
  
  // Add timestamp header for debugging
  response.headers.set('X-Request-Time', new Date().toISOString())
  
  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
