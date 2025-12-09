import express from 'express';
import multer from 'multer';
import { uploadFile, deleteFile } from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

router.post('/single', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { classroomName, postTitle, postType } = req.body;

    const result = await uploadFile(req.file, {
      classroomName,
      postTitle,
      postType
    });

    fs.unlinkSync(req.file.path);

    console.log(`File uploaded to: ${result.folder}/${result.public_id}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fileName: req.file.originalname,
        fileUrl: result.secure_url,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        publicId: result.public_id,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    console.log('[Upload] Multiple file upload request received');
    console.log('[Upload] Files count:', req.files?.length || 0);
    console.log('[Upload] Body:', req.body);
    
    if (!req.files || req.files.length === 0) {
      console.log('[Upload] No files in request');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { classroomName, postTitle, postType } = req.body;
    
    if (!classroomName || !postTitle || !postType) {
      console.error('[Upload] Missing required metadata:', { classroomName, postTitle, postType });
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required metadata: classroomName, postTitle, and postType are required'
      });
    }

    console.log(`[Upload] Uploading ${req.files.length} files to: skillverse/${classroomName}/${postTitle}`);

    const uploadPromises = req.files.map(async (file) => {
      try {
        console.log(`[Upload] Processing file: ${file.originalname}`);
        const result = await uploadFile(file, {
          classroomName,
          postTitle,
          postType
        });

        fs.unlinkSync(file.path);

        console.log(`[Upload] Successfully uploaded: ${result.public_id}`);

        return {
          fileName: file.originalname,
          fileUrl: result.secure_url,
          fileType: file.mimetype,
          fileSize: file.size,
          publicId: result.public_id,
          uploadedAt: new Date()
        };
      } catch (error) {
        console.error(`[Upload] Error uploading ${file.originalname}:`, error.message);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw error;
      }
    });

    const files = await Promise.all(uploadPromises);

    console.log(`[Upload] All files uploaded successfully`);
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('[Upload] Multiple file upload error:', error.message);
    console.error('[Upload] Error stack:', error.stack);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await deleteFile(decodedPublicId);

    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
