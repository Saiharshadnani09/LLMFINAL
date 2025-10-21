import mongoose from 'mongoose';

const trainingFolderSchema = new mongoose.Schema({
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
  videoCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update video count when videos are added/removed
trainingFolderSchema.methods.updateVideoCount = async function() {
  const TrainingVideo = mongoose.model('TrainingVideo');
  const count = await TrainingVideo.countDocuments({ folderId: this._id });
  this.videoCount = count;
  await this.save();
};

export default mongoose.model('TrainingFolder', trainingFolderSchema);
