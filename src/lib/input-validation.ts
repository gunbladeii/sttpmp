/**
 * Input Validation & Sanitization Utilities
 * Security hardening for React 19.1.2 & Next.js 15.5.7
 * Protects against CVE-2025-55182 by validating all user inputs
 */

import { z } from 'zod';

// Allowed email domains
const ALLOWED_DOMAINS = ['@moe.gov.my', '@ipgm.edu.my']

// Email validation schema
export const emailSchema = z
  .string()
  .email('Format email tidak sah')
  .refine((email) => ALLOWED_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain)), {
    message: 'Hanya email dengan domain @moe.gov.my atau @ipgm.edu.my yang dibenarkan',
  });

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password mesti sekurang-kurangnya 8 aksara')
  .regex(/[A-Z]/, 'Password mesti mengandungi sekurang-kurangnya satu huruf besar')
  .regex(/[a-z]/, 'Password mesti mengandungi sekurang-kurangnya satu huruf kecil')
  .regex(/[0-9]/, 'Password mesti mengandungi sekurang-kurangnya satu nombor');

// Name validation schema
export const nameSchema = z
  .string()
  .min(3, 'Nama mesti sekurang-kurangnya 3 aksara')
  .max(100, 'Nama terlalu panjang')
  .regex(/^[a-zA-Z\s.@'-]+$/, 'Nama mengandungi aksara tidak sah');

// Role validation
export const roleSchema = z.enum([
  'admin',
  'penyelaras_bahagian',
  'penyelaras_jpn',
  'penyelaras_jnn',
  'peneraju_pemeriksaan',
]);

// UUID validation
export const uuidSchema = z.string().uuid('ID tidak sah');

// File validation
export const fileSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(10 * 1024 * 1024, 'Saiz fail maksimum adalah 10MB'),
  type: z.string().refine((type) => type === 'application/pdf', {
    message: 'Hanya fail PDF dibenarkan',
  }),
});

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize FormData
 */
export async function validateFormData(formData: FormData): Promise<{
  isValid: boolean;
  error?: string;
  data?: Record<string, string | File>;
}> {
  try {
    const data: Record<string, string | File> = {};
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        data[key] = sanitizeString(value);
      } else if (value instanceof File) {
        // Validate file
        const fileValidation = fileSchema.safeParse({
          name: value.name,
          size: value.size,
          type: value.type,
        });
        
        if (!fileValidation.success) {
          return {
            isValid: false,
            error: fileValidation.error.issues[0]?.message || 'Fail tidak sah',
          };
        }
        
        data[key] = value;
      }
    }
    
    return { isValid: true, data };
  } catch (err) {
    console.error('FormData validation error:', err);
    return {
      isValid: false,
      error: 'Ralat semasa validasi data',
    };
  }
}

/**
 * Validate JSON request body
 */
export async function validateJsonRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{
  isValid: boolean;
  error?: string;
  data?: T;
}> {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validation = schema.safeParse(sanitized);
    
    if (!validation.success) {
      return {
        isValid: false,
        error: validation.error.issues[0]?.message || 'Data tidak sah',
      };
    }
    
    return {
      isValid: true,
      data: validation.data,
    };
  } catch (err) {
    console.error('JSON request validation error:', err);
    return {
      isValid: false,
      error: 'Ralat semasa membaca request',
    };
  }
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Clean up expired rate limit records
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
