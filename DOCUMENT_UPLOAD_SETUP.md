# Document Upload Setup Instructions

## Database Setup

1. **Run the migration** to add the `syor_documents` table:
   - Go to Supabase Dashboard SQL Editor
   - Run the SQL from `database/migrations/006_add_syor_documents.sql`

## Google Drive API Setup

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Drive API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create Service Account:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create

4. **Generate Key:**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key" > "JSON"
   - Download the JSON file

5. **Setup Environment Variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in the Google Drive configuration from the JSON file:
     ```
     GOOGLE_DRIVE_FOLDER_ID=your-folder-id
     GOOGLE_SERVICE_ACCOUNT_EMAIL=email-from-json
     GOOGLE_PRIVATE_KEY="private-key-from-json"
     ```

6. **Create Google Drive Folder:**
   - Create a folder in Google Drive for storing documents
   - Copy the folder ID from the URL (e.g., `1ABC123xyz` from `https://drive.google.com/drive/folders/1ABC123xyz`)
   - Share the folder with the service account email (give Editor access)

## Features Added

### For Penyelaras Bahagian/JPN:
- ✅ **Upload PDF documents** in the syor details page
- ✅ **View uploaded documents** with links to Google Drive
- ✅ **File validation** (PDF only, max 10MB)

### For Admin:
- ✅ **Delete any documents** uploaded by users
- ✅ **View all documents** from all syor

### For Others:
- ✅ **View documents** for syor they have access to
- ❌ **Cannot upload or delete** documents

## File Structure

```
src/
├── components/
│   ├── DocumentUpload.tsx    # File upload component
│   └── DocumentList.tsx      # Document display component
├── lib/
│   └── googleDrive.ts        # Google Drive API integration
└── app/
    └── api/
        └── upload-document/
            └── route.ts      # Upload/delete API endpoints
```

## Database Schema

The `syor_documents` table stores:
- File metadata (name, size, type)
- Google Drive links and IDs
- Upload tracking (who uploaded, when)
- Linked to specific syor

## Usage

1. Navigate to any syor details page
2. If you're a penyelaras assigned to that syor, you'll see the document upload section
3. Click "Pilih Fail PDF" to upload PDF documents
4. View uploaded documents with direct links to Google Drive
5. Admin users can delete any documents

## Security

- ✅ **Role-based access control** - only authorized users can upload
- ✅ **File type validation** - only PDF files allowed
- ✅ **File size limits** - maximum 10MB per file
- ✅ **Google Drive security** - files stored securely in Google Drive
- ✅ **Database permissions** - RLS policies protect document access