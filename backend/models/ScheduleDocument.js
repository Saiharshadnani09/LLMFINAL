import mongoose from 'mongoose';

const scheduleDocumentSchema = new mongoose.Schema({
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
    ref: 'ScheduleFolder',
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
  fileType: {
    type: String,
    enum: ['excel', 'word', 'powerpoint', 'pdf', 'other'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloads: {
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
scheduleDocumentSchema.index({ folderId: 1, createdAt: -1 });
scheduleDocumentSchema.index({ uploadedBy: 1 });
scheduleDocumentSchema.index({ isActive: 1 });
scheduleDocumentSchema.index({ fileType: 1 });

// Update folder document count when document is saved
scheduleDocumentSchema.post('save', async function() {
  const ScheduleFolder = mongoose.model('ScheduleFolder');
  const folder = await ScheduleFolder.findById(this.folderId);
  if (folder) {
    await folder.updateDocumentCount();
  }
});

// Update folder document count when document is deleted
scheduleDocumentSchema.post('deleteOne', { document: true, query: false }, async function() {
  const ScheduleFolder = mongoose.model('ScheduleFolder');
  const folder = await ScheduleFolder.findById(this.folderId);
  if (folder) {
    await folder.updateDocumentCount();
  }
});

export default mongoose.model('ScheduleDocument', scheduleDocumentSchema);
