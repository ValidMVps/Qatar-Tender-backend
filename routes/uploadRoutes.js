import express from 'express';
import upload from '../utils/fileUpload.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    url: req.file.path,
    publicId: req.file.filename
  });
});

export default router;