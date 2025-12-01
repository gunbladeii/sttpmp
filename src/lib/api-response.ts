// Standardized API Error Handling
// Provides consistent error responses across all API routes

import { NextResponse } from 'next/server'

export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  ACCOUNT_NOT_APPROVED = 'ACCOUNT_NOT_APPROVED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SYOR_NOT_FOUND = 'SYOR_NOT_FOUND',
  
  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface ApiError {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    timestamp: string
  }
}

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: unknown
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccess<T>> {
  const successResponse: ApiSuccess<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(successResponse, { status: statusCode })
}

/**
 * Pre-configured error responses for common cases
 */
export const ApiErrors = {
  // 401 Unauthorized
  unauthorized: (message = 'Authentication diperlukan') =>
    createErrorResponse(ErrorCode.UNAUTHORIZED, message, 401),
  
  invalidCredentials: (message = 'Email atau password tidak betul') =>
    createErrorResponse(ErrorCode.INVALID_CREDENTIALS, message, 401),
  
  accountInactive: (message = 'Akaun telah dinyahaktifkan. Sila hubungi admin.') =>
    createErrorResponse(ErrorCode.ACCOUNT_INACTIVE, message, 401),
  
  accountNotApproved: (message = 'Akaun belum diluluskan oleh admin. Sila tunggu kelulusan.') =>
    createErrorResponse(ErrorCode.ACCOUNT_NOT_APPROVED, message, 401),
  
  // 403 Forbidden
  forbidden: (message = 'Akses ditolak') =>
    createErrorResponse(ErrorCode.FORBIDDEN, message, 403),
  
  insufficientPermissions: (message = 'Anda tidak mempunyai kebenaran untuk tindakan ini') =>
    createErrorResponse(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403),
  
  // 400 Bad Request
  validationError: (message = 'Data tidak sah', details?: unknown) =>
    createErrorResponse(ErrorCode.VALIDATION_ERROR, message, 400, details),
  
  missingField: (field: string) =>
    createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Field diperlukan: ${field}`,
      400
    ),
  
  invalidInput: (message = 'Input tidak sah') =>
    createErrorResponse(ErrorCode.INVALID_INPUT, message, 400),
  
  // 404 Not Found
  notFound: (resource = 'Resource', message?: string) =>
    createErrorResponse(
      ErrorCode.NOT_FOUND,
      message || `${resource} tidak dijumpai`,
      404
    ),
  
  userNotFound: (message = 'Pengguna tidak dijumpai') =>
    createErrorResponse(ErrorCode.USER_NOT_FOUND, message, 404),
  
  syorNotFound: (message = 'Syor tidak dijumpai') =>
    createErrorResponse(ErrorCode.SYOR_NOT_FOUND, message, 404),
  
  // 409 Conflict
  alreadyExists: (resource = 'Resource', message?: string) =>
    createErrorResponse(
      ErrorCode.ALREADY_EXISTS,
      message || `${resource} sudah wujud`,
      409
    ),
  
  emailAlreadyRegistered: (message = 'Email ini telah berdaftar. Sila gunakan email lain.') =>
    createErrorResponse(ErrorCode.EMAIL_ALREADY_REGISTERED, message, 409),
  
  // 500 Internal Server Error
  internal: (message = 'Ralat dalaman server', details?: unknown) =>
    createErrorResponse(ErrorCode.INTERNAL_ERROR, message, 500, details),
  
  databaseError: (message = 'Ralat pangkalan data', details?: unknown) =>
    createErrorResponse(ErrorCode.DATABASE_ERROR, message, 500, details),
  
  externalServiceError: (service: string, details?: unknown) =>
    createErrorResponse(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `Ralat perkhidmatan luaran: ${service}`,
      500,
      details
    ),
}

/**
 * Wrap async API handlers with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch((error) => {
    console.error('API Error:', error)
    
    // Handle specific error types
    if (error.code === 'PGRST116') {
      return ApiErrors.notFound('Resource')
    }
    
    if (error.message?.includes('duplicate key')) {
      return ApiErrors.alreadyExists('Record')
    }
    
    // Default to internal error
    return ApiErrors.internal(
      error.message || 'Ralat tidak dijangka berlaku',
      error
    )
  })
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): { isValid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })
  
  return {
    isValid: missing.length === 0,
    missing,
  }
}
