import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';
import ScheduleFolder from '../models/ScheduleFolder.js';
import ScheduleDocument from '../models/ScheduleDocument.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/schedule-documents';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a supported document type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
      'application/vnd.ms-excel', // Excel (old format)
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
      'application/msword', // Word (old format)
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
      'application/vnd.ms-powerpoint', // PowerPoint (old format)
      'application/pdf' // PDF
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel, Word, PowerPoint, and PDF files are allowed!'), false);
    }
  }
});

// Helper function to determine file type
const getFileType = (mimeType) => {
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('wordprocessing') || mimeType.includes('word')) return 'word';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'powerpoint';
  if (mimeType.includes('pdf')) return 'pdf';
  return 'other';
};

// ==================== SCHEDULE FOLDERS ====================

// Get all schedule folders (public access for students)
router.get('/folders', async (req, res) => {
  try {
    const folders = await ScheduleFolder.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching schedule folders:', error);
    res.status(500).json({ message: 'Server error while fetching schedule folders' });
  }
});

// Create new schedule folder (admin only)
router.post('/folders', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, description } = req.body;

    // Check if folder name already exists
    const existingFolder = await ScheduleFolder.findOne({ name: name.trim() });
    if (existingFolder) {
      return res.status(400).json({ message: 'A folder with this name already exists' });
    }

    const folder = new ScheduleFolder({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user.id
    });

    await folder.save();
    await folder.populate('createdBy', 'name');

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating schedule folder:', error);
    res.status(500).json({ message: 'Server error while creating schedule folder' });
  }
});

// Delete schedule folder (admin only)
router.delete('/folders/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const folder = await ScheduleFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Schedule folder not found' });
    }

    // Delete all documents in this folder
    const documents = await ScheduleDocument.find({ folderId: req.params.id });
    for (const document of documents) {
      // Delete document file from filesystem
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      await ScheduleDocument.findByIdAndDelete(document._id);
    }

    // Delete the folder
    await ScheduleFolder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Schedule folder and all its documents deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule folder:', error);
    res.status(500).json({ message: 'Server error while deleting schedule folder' });
  }
});

// ==================== SCHEDULE DOCUMENTS ====================

// Get documents in a specific folder (public access for students)
router.get('/documents/:folderId', async (req, res) => {
  try {
    const documents = await ScheduleDocument.find({ 
      folderId: req.params.folderId,
      isActive: true 
    })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching schedule documents:', error);
    res.status(500).json({ message: 'Server error while fetching schedule documents' });
  }
});

// Upload schedule document (admin only)
router.post('/documents/upload', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No document file uploaded' });
    }

    const { title, description, folderId } = req.body;

    // Validate required fields
    if (!title || !folderId) {
      return res.status(400).json({ message: 'Title and folder ID are required' });
    }

    // Check if folder exists
    const folder = await ScheduleFolder.findById(folderId);
    if (!folder) {
      // Delete uploaded file if folder doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Schedule folder not found' });
    }

    // Create document record
    const document = new ScheduleDocument({
      title: title.trim(),
      description: description?.trim(),
      folderId: folderId,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: getFileType(req.file.mimetype),
      uploadedBy: req.user.id
    });

    await document.save();
    await document.populate('uploadedBy', 'name');

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading schedule document:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error while uploading schedule document' });
  }
});

// Download schedule document
router.get('/documents/download/:documentId', async (req, res) => {
  try {
    const document = await ScheduleDocument.findById(req.params.documentId);
    if (!document || !document.isActive) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'Document file not found on server' });
    }

    // Increment download count
    await ScheduleDocument.findByIdAndUpdate(req.params.documentId, { $inc: { downloads: 1 } });

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading schedule document:', error);
    res.status(500).json({ message: 'Server error while downloading schedule document' });
  }
});

// Delete schedule document (admin only)
router.delete('/documents/:documentId', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const document = await ScheduleDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete document file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document record
    await ScheduleDocument.findByIdAndDelete(req.params.documentId);

    res.json({ message: 'Schedule document deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule document:', error);
    res.status(500).json({ message: 'Server error while deleting schedule document' });
  }
});

// Get document details (public access)
router.get('/documents/details/:documentId', async (req, res) => {
  try {
    const document = await ScheduleDocument.findById(req.params.documentId)
      .populate('uploadedBy', 'name')
      .populate('folderId', 'name');
    
    if (!document || !document.isActive) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching schedule document details:', error);
    res.status(500).json({ message: 'Server error while fetching schedule document details' });
  }
});

export default router;
