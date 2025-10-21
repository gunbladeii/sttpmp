import fs from 'fs';
import path from 'path';

// Local storage configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface UploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

export async function uploadFileToLocalStorage(
  file: File,
  fileName: string,
  syorId: string
): Promise<UploadResult> {
  try {
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create unique filename with timestamp and syor ID
    const timestamp = new Date().getTime();
    const uniqueFileName = `${syorId}_${timestamp}_${fileName}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
    
    // Write file to local storage
    fs.writeFileSync(filePath, buffer);
    
    // Create URLs for accessing the file
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      : 'http://localhost:3000';
    
    const fileUrl = `${baseUrl}/uploads/${uniqueFileName}`;
    
    return {
      id: uniqueFileName, // Use filename as ID for local storage
      name: fileName,
      webViewLink: fileUrl,
      webContentLink: fileUrl,
    };
  } catch (error) {
    console.error('Error uploading file to local storage:', error);
    throw new Error('Failed to upload file to local storage');
  }
}

export async function deleteFileFromLocalStorage(fileName: string): Promise<void> {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file from local storage:', error);
    throw new Error('Failed to delete file from local storage');
  }
}

// Helper function to validate PDF files
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf'];

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Hanya fail PDF dibenarkan' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'Saiz fail mesti kurang dari 10MB' };
  }

  return { isValid: true };
}