# Cloudinary File Upload Setup Guide

## Prerequisites
- Cloudinary account (free tier available)
- Node.js installed
- SkillVerse project cloned

## Step 1: Cloudinary Account Setup

### 1.1 Create Account
1. Go to https://cloudinary.com/
2. Click "Sign Up Free"
3. Fill in your details
4. Verify your email

### 1.2 Get Credentials
1. Login to Cloudinary Dashboard
2. Find "Account Details" section
3. Copy these values:
   - Cloud Name (e.g., `dxxxxx123`)
   - API Key (e.g., `123456789012345`)
   - API Secret (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 1.3 Configure Upload Preset (Optional but Recommended)
1. Click Settings (gear icon)
2. Go to Upload tab
3. Scroll to "Upload presets"
4. Click "Add upload preset"
5. Configure:
   - Preset name: `skillverse_uploads`
   - Signing Mode: **Signed** (more secure)
   - Folder: `skillverse/attachments`
   - Access Mode: Public
   - Resource Type: Auto
6. Click Save

## Step 2: Backend Setup

### 2.1 Install Required Packages

Open terminal in backend directory:

```bash
cd backend
npm install cloudinary multer multer-storage-cloudinary
```

### 2.2 Update Environment Variables

Add these lines to `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Replace** `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with your actual Cloudinary credentials.

### 2.3 Files Created

The following files have been created:
- `backend/config/cloudinary.js` - Cloudinary configuration
- `backend/routes/upload.js` - File upload routes
- Updated `backend/server.js` - Registered upload routes
- Updated models (Activity, Module, Assignment) - Added file metadata fields

## Step 3: Testing the Setup

### 3.1 Start Backend Server

```bash
cd backend
npm start
```

Check console for:
- "Server is running on port 5000"
- No Cloudinary errors

### 3.2 Start Frontend

```bash
cd frontend
npm run dev
```

### 3.3 Test File Upload

1. Login as a teacher
2. Go to a classroom
3. Click "New Post"
4. Select "Activity" or "Module"
5. Fill in required fields
6. Click "Click to upload files"
7. Select one or more files
8. Click "Create Activity" or "Create Module"
9. Watch for "Uploading files..." status

### 3.4 Verify Upload

1. Check Cloudinary Dashboard
2. Go to Media Library
3. Look for folder: `skillverse/attachments`
4. Your uploaded files should be there

## Supported File Types

- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX
- **Spreadsheets**: XLS, XLSX
- **Presentations**: PPT, PPTX
- **Text**: TXT
- **Archives**: ZIP, RAR

**Max File Size**: 10 MB per file
**Max Files**: 10 files per upload

## Features

### Teacher Features
- Upload multiple files when creating activities/modules
- Files automatically uploaded to Cloudinary
- Files stored with unique identifiers
- File deletion support (when implemented)

### Student Features
- View and download uploaded files
- Upload submission files (when implemented)

## Troubleshooting

### Error: "Invalid file type"
- Only supported file types are allowed
- Check the supported file types list above

### Error: "Failed to upload files"
- Check your Cloudinary credentials in `.env`
- Verify Cloudinary account is active
- Check file size limits (10 MB)

### Error: "File size too large"
- Maximum file size is 10 MB
- Compress or split large files

### Files not appearing in Cloudinary
- Check Cloud Name, API Key, and API Secret
- Verify upload preset configuration
- Check backend console for errors

### CORS errors
- Cloudinary should handle CORS automatically
- If issues persist, check Cloudinary settings

## Security Notes

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use signed uploads** - More secure than unsigned
3. **Implement file validation** - Already included in backend
4. **Monitor usage** - Cloudinary free tier has limits
5. **Regular cleanup** - Delete unused files to save space

## Cloudinary Free Tier Limits

- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month
- More than enough for development and small deployments

## Next Steps

Once setup is complete:
1. Test with different file types
2. Implement file deletion functionality
3. Add file preview features
4. Implement student submission uploads
5. Add progress bars for large files
6. Consider adding file size preview before upload

## Support

If you encounter issues:
1. Check Cloudinary Dashboard for error logs
2. Check browser console for errors
3. Check backend console for errors
4. Verify all environment variables are set correctly
5. Restart both frontend and backend servers after changes
