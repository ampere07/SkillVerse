# Quick Installation Commands

## Backend Package Installation

Run these commands in your terminal:

### Navigate to backend directory
```bash
cd C:\Users\raven\Documents\GitHub\SkillVerse\backend
```

### Install Cloudinary packages
```bash
npm install cloudinary multer multer-storage-cloudinary
```

## Update .env File

Open `backend/.env` and add these lines at the end:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Test the Setup

### Start Backend
```bash
cd C:\Users\raven\Documents\GitHub\SkillVerse\backend
npm start
```

### Start Frontend (in new terminal)
```bash
cd C:\Users\raven\Documents\GitHub\SkillVerse\frontend
npm run dev
```

## What to Replace

In your `.env` file, replace:

- `your_cloud_name_here` → Your Cloudinary Cloud Name (from dashboard)
- `your_api_key_here` → Your Cloudinary API Key (from dashboard)
- `your_api_secret_here` → Your Cloudinary API Secret (from dashboard)

Example:
```env
CLOUDINARY_CLOUD_NAME=skillverse-demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Verification

After setup, you should be able to:
1. Login as teacher
2. Create a new post (Activity/Module)
3. Upload files
4. See files in Cloudinary Dashboard

If you see "Uploading files..." when clicking Create, it's working!
