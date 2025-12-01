// Supabase Storage Configuration for Document Uploads
// Replaces local file storage with cloud storage

import { createServerSupabaseClient } from './supabase'

const BUCKET_NAME = 'syor-documents'

export interface UploadResult {
  id: string
  name: string
  path: string
  publicUrl: string
  size: number
}

/**
 * Initialize storage bucket (run this once during setup)
 */
export async function initializeStorage() {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
  
  if (!bucketExists) {
    // Create bucket
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false, // Private bucket, requires auth to access
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf'],
    })
    
    if (error) {
      console.error('Error creating storage bucket:', error)
      throw error
    }
    
    console.log(`✅ Created storage bucket: ${BUCKET_NAME}`)
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  syorId: string,
  uploadedBy: string
): Promise<UploadResult> {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // Validate file
  const validation = validatePDFFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }
  
  // Create unique file path
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${syorId}/${timestamp}_${sanitizedFileName}`
  
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })
  
  if (error) {
    console.error('Error uploading file:', error)
    throw new Error(`Gagal memuat naik fail: ${error.message}`)
  }
  
  // Get public URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600 * 24 * 365) // 1 year expiry
  
  if (!urlData) {
    throw new Error('Gagal mendapatkan URL fail')
  }
  
  return {
    id: data.path,
    name: file.name,
    path: filePath,
    publicUrl: urlData.signedUrl,
    size: file.size,
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])
  
  if (error) {
    console.error('Error deleting file:', error)
    throw new Error(`Gagal memadam fail: ${error.message}`)
  }
}

/**
 * Get signed URL for file (for downloading)
 */
export async function getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn)
  
  if (error || !data) {
    console.error('Error getting signed URL:', error)
    throw new Error('Gagal mendapatkan URL fail')
  }
  
  return data.signedUrl
}

/**
 * List all files for a syor
 */
export async function listSyorFiles(syorId: string): Promise<UploadResult[]> {
  const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(syorId)
  
  if (error) {
    console.error('Error listing files:', error)
    return []
  }
  
  if (!files || files.length === 0) {
    return []
  }
  
  // Get signed URLs for all files
  const results = await Promise.all(
    files.map(async (file) => {
      const filePath = `${syorId}/${file.name}`
      const signedUrl = await getSignedUrl(filePath, 3600 * 24) // 24 hour expiry
      
      return {
        id: file.id || filePath,
        name: file.name,
        path: filePath,
        publicUrl: signedUrl,
        size: file.metadata?.size || 0,
      }
    })
  )
  
  return results
}

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['application/pdf']
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Hanya fail PDF dibenarkan' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Saiz fail mesti kurang dari 10MB' }
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'Fail kosong tidak dibenarkan' }
  }
  
  return { isValid: true }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
