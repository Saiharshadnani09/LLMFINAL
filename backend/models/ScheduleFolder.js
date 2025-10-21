import mongoose from 'mongoose';

const scheduleFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update document count when documents are added/removed
scheduleFolderSchema.methods.updateDocumentCount = async function() {
  const ScheduleDocument = mongoose.model('ScheduleDocument');
  const count = await ScheduleDocument.countDocuments({ folderId: this._id });
  this.documentCount = count;
  await this.save();
};

export default mongoose.model('ScheduleFolder', scheduleFolderSchema);
