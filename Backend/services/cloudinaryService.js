import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config();
console.log('Cloudinary configured with cloud_name:', cloudinary.config().cloud_name);

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'article-summarizer',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
    public_id: (req, file) => {
      console.log('Uploading file to Cloudinary:', file.originalname);
      const timestamp = Date.now();
      const originalName = file.originalname.replace('.pdf', '');
      return `article_${timestamp}_${originalName}`;
    },
  },
});

// Create and export the upload middleware
export const uploadMiddleware = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter checking:', file.originalname, file.mimetype);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      console.log('Invalid file type:', file.mimetype);
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
}).single('file');

// Test Cloudinary connection
export const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test successful:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
};

// Utility function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

export default cloudinary;