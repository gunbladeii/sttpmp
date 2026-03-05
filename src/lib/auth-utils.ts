import bcrypt from 'bcryptjs'

export class PasswordUtils {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Generate random password
  static generateRandomPassword(length: number = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password mesti sekurang-kurangnya 8 aksara')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password mesti mengandungi sekurang-kurangnya satu huruf kecil')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password mesti mengandungi sekurang-kurangnya satu huruf besar')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password mesti mengandungi sekurang-kurangnya satu nombor')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password mesti mengandungi sekurang-kurangnya satu simbol khas (@$!%*?&)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Allowed email domains
const ALLOWED_DOMAINS = ['@moe.gov.my', '@ipgm.edu.my']

// MOE/IPGM domain validation
export const validateMOEDomain = (email: string): boolean => {
  return ALLOWED_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain))
}

// Generate verification token
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}