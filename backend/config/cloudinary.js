import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadFile = async (file, metadata) => {
  try {
    const { classroomName, postTitle, postType } = metadata;
    
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${timestamp}_${randomNum}`;
    const fullPublicId = `skillverse/${fileName}`;

    console.log('Uploading to Cloudinary:');
    console.log(`  Folder: skillverse`);
    console.log(`  File: ${fileName}.${fileExtension}`);
    console.log(`  Original: ${file.originalname}`);
    console.log(`  MIME Type: ${file.mimetype}`);

    // Determine resource type based on file type
    let resourceType = 'auto';
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'text/plain' ||
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-rar-compressed') {
      resourceType = 'raw';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    }

    console.log(`  Resource Type: ${resourceType}`);

    const uploadOptions = {
      public_id: fullPublicId,
      resource_type: resourceType,
      overwrite: false
    };

    console.log('Upload options:', JSON.stringify(uploadOptions, null, 2));

    const result = await cloudinary.uploader.upload(file.path, uploadOptions);

    console.log(`✓ Upload successful!`);
    console.log(`  Public ID: ${result.public_id}`);
    console.log(`  URL: ${result.secure_url}`);
    console.log(`  Access Type: ${result.access_mode || 'public'}`);

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`✓ File deleted: ${publicId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return { success: false, error };
  }
};

export default cloudinary;
