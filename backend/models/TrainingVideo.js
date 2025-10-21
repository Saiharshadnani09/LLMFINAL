import mongoose from 'mongoose';

const trainingVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingFolder',
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
trainingVideoSchema.index({ folderId: 1, createdAt: -1 });
trainingVideoSchema.index({ uploadedBy: 1 });
trainingVideoSchema.index({ isActive: 1 });

// Update folder video count when video is saved
trainingVideoSchema.post('save', async function() {
  const TrainingFolder = mongoose.model('TrainingFolder');
  const folder = await TrainingFolder.findById(this.folderId);
  if (folder) {
    await folder.updateVideoCount();
  }
});

// Update folder video count when video is deleted
trainingVideoSchema.post('deleteOne', { document: true, query: false }, async function() {
  const TrainingFolder = mongoose.model('TrainingFolder');
  const folder = await TrainingFolder.findById(this.folderId);
  if (folder) {
    await folder.updateVideoCount();
  }
});

export default mongoose.model('TrainingVideo', trainingVideoSchema);
