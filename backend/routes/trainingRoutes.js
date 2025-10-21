import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';
import TrainingFolder from '../models/TrainingFolder.js';
import TrainingVideo from '../models/TrainingVideo.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/training-videos';
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
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// ==================== TRAINING FOLDERS ====================

// Get all training folders (public access for students)
router.get('/folders', async (req, res) => {
  try {
    const folders = await TrainingFolder.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Server error while fetching folders' });
  }
});

// Create new training folder (admin only)
router.post('/folders', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, description } = req.body;

    // Check if folder name already exists
    const existingFolder = await TrainingFolder.findOne({ name: name.trim() });
    if (existingFolder) {
      return res.status(400).json({ message: 'A folder with this name already exists' });
    }

    const folder = new TrainingFolder({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user.id
    });

    await folder.save();
    await folder.populate('createdBy', 'name');

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Server error while creating folder' });
  }
});

// Delete training folder (admin only)
router.delete('/folders/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const folder = await TrainingFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Delete all videos in this folder
    const videos = await TrainingVideo.find({ folderId: req.params.id });
    for (const video of videos) {
      // Delete video file from filesystem
      if (fs.existsSync(video.filePath)) {
        fs.unlinkSync(video.filePath);
      }
      await TrainingVideo.findByIdAndDelete(video._id);
    }

    // Delete the folder
    await TrainingFolder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Folder and all its videos deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Server error while deleting folder' });
  }
});

// ==================== TRAINING VIDEOS ====================

// Get videos in a specific folder (public access for students)
router.get('/videos/:folderId', async (req, res) => {
  try {
    const videos = await TrainingVideo.find({ 
      folderId: req.params.folderId,
      isActive: true 
    })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Server error while fetching videos' });
  }
});

// Upload training video (admin only)
router.post('/videos/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, description, folderId } = req.body;

    // Validate required fields
    if (!title || !folderId) {
      return res.status(400).json({ message: 'Title and folder ID are required' });
    }

    // Check if folder exists
    const folder = await TrainingFolder.findById(folderId);
    if (!folder) {
      // Delete uploaded file if folder doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Training folder not found' });
    }

    // Create video record
    const video = new TrainingVideo({
      title: title.trim(),
      description: description?.trim(),
      folderId: folderId,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id
    });

    await video.save();
    await video.populate('uploadedBy', 'name');

    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error while uploading video' });
  }
});

// Get video file for streaming
router.get('/videos/stream/:videoId', async (req, res) => {
  try {
    const video = await TrainingVideo.findById(req.params.videoId);
    if (!video || !video.isActive) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if file exists
    if (!fs.existsSync(video.filePath)) {
      return res.status(404).json({ message: 'Video file not found on server' });
    }

    const stat = fs.statSync(video.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(video.filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(video.filePath).pipe(res);
    }

    // Increment view count
    await TrainingVideo.findByIdAndUpdate(req.params.videoId, { $inc: { views: 1 } });
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ message: 'Server error while streaming video' });
  }
});

// Delete training video (admin only)
router.delete('/videos/:videoId', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const video = await TrainingVideo.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete video file from filesystem
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    // Delete video record
    await TrainingVideo.findByIdAndDelete(req.params.videoId);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Server error while deleting video' });
  }
});

// Get video details (public access)
router.get('/videos/details/:videoId', async (req, res) => {
  try {
    const video = await TrainingVideo.findById(req.params.videoId)
      .populate('uploadedBy', 'name')
      .populate('folderId', 'name');
    
    if (!video || !video.isActive) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ message: 'Server error while fetching video details' });
  }
});

export default router;
