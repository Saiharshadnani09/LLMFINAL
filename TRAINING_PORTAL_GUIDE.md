# 🎓 Training Portal Guide

## Overview
The Training Portal is a comprehensive system for managing and delivering training content to interns and employees. It allows administrators to organize training videos into folders and provides students with easy access to view training materials.

## Features

### 🔐 Admin Features (Full Access)
- **Create Training Folders**: Organize training content by topics
- **Upload Videos**: Upload recorded training sessions from Teams/Zoom
- **Manage Content**: Edit, delete folders and videos
- **Monitor Usage**: Track video views and engagement

### 👥 Student Features (Read-Only Access)
- **Browse Training Topics**: View available training folders
- **Watch Videos**: Stream training videos with built-in player
- **Search Content**: Find specific training materials
- **Progress Tracking**: Keep track of viewed content

## How to Use

### For Administrators

#### 1. Access Training Portal
- Login as admin
- Navigate to "Training Portal" from the admin dashboard

#### 2. Create Training Folders
- Click "Create Folder" button
- Enter folder name (e.g., "JavaScript Fundamentals", "React Training", "Team Collaboration")
- Click "Create Folder"

#### 3. Upload Training Videos
- Select a folder from the sidebar
- Click "Upload Video" button
- Fill in video details:
  - **Title**: Descriptive name for the video
  - **Description**: Brief overview of content (optional)
  - **Video File**: Select the recorded training video
- Click "Upload Video"

#### 4. Manage Content
- **Delete Folders**: Click trash icon next to folder name
- **Delete Videos**: Click trash icon on individual videos
- **Organize**: Create multiple folders for different training topics

### For Students

#### 1. Access Training Videos
- Login as student
- Click "Training Videos" from the navigation menu

#### 2. Browse Training Content
- Select a training topic from the sidebar
- View available videos in the main area
- Click on any video to start watching

#### 3. Watch Videos
- Use built-in video player controls
- Navigate back to video list anytime
- Track your viewing progress

## Technical Details

### File Upload Specifications
- **Supported Formats**: MP4, AVI, MOV, WebM
- **Maximum File Size**: 500MB per video
- **Storage**: Videos stored in `uploads/training-videos/` directory

### Security Features
- **Role-Based Access**: Only admins can upload/manage content
- **File Validation**: Only video files are accepted
- **Secure Streaming**: Videos served through secure API endpoints

### Database Structure
- **TrainingFolder**: Stores folder information and metadata
- **TrainingVideo**: Stores video details, file paths, and view counts

## API Endpoints

### Folders
- `GET /api/training/folders` - Get all training folders
- `POST /api/training/folders` - Create new folder (admin only)
- `DELETE /api/training/folders/:id` - Delete folder (admin only)

### Videos
- `GET /api/training/videos/:folderId` - Get videos in folder
- `POST /api/training/videos/upload` - Upload video (admin only)
- `GET /api/training/videos/stream/:videoId` - Stream video file
- `DELETE /api/training/videos/:videoId` - Delete video (admin only)

## Best Practices

### For Administrators
1. **Organize Content**: Create clear, descriptive folder names
2. **Video Titles**: Use descriptive titles that explain the content
3. **File Management**: Keep video files reasonably sized for better streaming
4. **Regular Cleanup**: Remove outdated or irrelevant content

### For Content Creation
1. **Recording Quality**: Ensure good audio and video quality
2. **Content Structure**: Break long sessions into shorter, focused videos
3. **Naming Convention**: Use consistent naming for easy organization

## Troubleshooting

### Common Issues
1. **Upload Fails**: Check file size (max 500MB) and format
2. **Video Won't Play**: Ensure browser supports video format
3. **Access Denied**: Verify user role and permissions

### Support
For technical issues or questions, contact the development team.

---

**Note**: This training portal is designed to complement the existing exam system and provide a comprehensive learning management experience for interns and employees.
