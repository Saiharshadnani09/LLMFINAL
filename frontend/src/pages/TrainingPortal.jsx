import React, { useEffect, useState } from "react";

function TrainingPortal() {
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadVideo, setShowUploadVideo] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch folders and videos
  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchVideos(selectedFolder);
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/training/folders");
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      setError("Failed to fetch training folders");
    }
  };

  const fetchVideos = async (folderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/training/videos/${folderId}`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setError("Failed to fetch training videos");
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to create folders");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/training/folders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Training folder created successfully");
        setNewFolderName("");
        setShowCreateFolder(false);
        fetchFolders();
      } else {
        setError(data.message || "Failed to create folder");
      }
    } catch (err) {
      setError("Server error while creating folder");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim() || !selectedFolder) {
      setError("Please fill all fields and select a folder");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to upload videos");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("video", uploadFile);
    formData.append("title", uploadTitle.trim());
    formData.append("description", uploadDescription.trim());
    formData.append("folderId", selectedFolder);

    try {
      const res = await fetch("http://localhost:5000/api/training/videos/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Training video uploaded successfully");
        setUploadFile(null);
        setUploadTitle("");
        setUploadDescription("");
        setShowUploadVideo(false);
        fetchVideos(selectedFolder);
      } else {
        setError(data.message || "Failed to upload video");
      }
    } catch (err) {
      setError("Server error while uploading video");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm("Are you sure you want to delete this folder and all its videos? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to delete folders");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/training/folders/${folderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Training folder deleted successfully");
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
          setVideos([]);
        }
        fetchFolders();
      } else {
        setError(data.message || "Failed to delete folder");
      }
    } catch (err) {
      setError("Server error while deleting folder");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to delete videos");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/training/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Training video deleted successfully");
        fetchVideos(selectedFolder);
      } else {
        setError(data.message || "Failed to delete video");
      }
    } catch (err) {
      setError("Server error while deleting video");
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">🎓 Training Portal</h1>
            <p className="text-zinc-600 mt-2">Manage training content for interns and employees</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition"
            >
              📁 Create Folder
            </button>
            <button
              onClick={() => setShowUploadVideo(true)}
              disabled={!selectedFolder}
              className={`px-4 py-2 font-medium rounded transition ${
                selectedFolder
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              }`}
            >
              📹 Upload Video
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-2 text-red-600 hover:underline text-sm"
            >
              Dismiss
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="mt-2 text-green-600 hover:underline text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-300 rounded-lg shadow-sm">
              <div className="p-4 border-b border-zinc-300">
                <h3 className="text-lg font-semibold text-zinc-900">Training Folders</h3>
              </div>
              <div className="p-4">
                {folders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-zinc-600">No training folders yet</p>
                    <p className="text-sm text-zinc-500 mt-1">Create your first folder to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div
                        key={folder._id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedFolder === folder._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                        onClick={() => setSelectedFolder(folder._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">📁</span>
                            <div>
                              <p className="font-medium text-zinc-900">{folder.name}</p>
                              <p className="text-sm text-zinc-500">
                                {folder.videoCount || 0} video(s)
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder._id);
                            }}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete folder"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Videos Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-300 rounded-lg shadow-sm">
              <div className="p-4 border-b border-zinc-300">
                <h3 className="text-lg font-semibold text-zinc-900">
                  {selectedFolder ? `Videos in "${folders.find(f => f._id === selectedFolder)?.name}"` : "Select a folder to view videos"}
                </h3>
              </div>
              <div className="p-4">
                {!selectedFolder ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-zinc-600 text-lg">Select a folder to view training videos</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-zinc-600 text-lg">No videos in this folder yet</p>
                    <p className="text-sm text-zinc-500 mt-2">Upload your first training video</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div key={video._id} className="border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-zinc-100 rounded-lg mb-3 flex items-center justify-center">
                          <video
                            controls
                            className="w-full h-full rounded-lg"
                            preload="metadata"
                          >
                            <source src={video.filePath} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-zinc-900">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-zinc-600 line-clamp-2">{video.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeleteVideo(video._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete video"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Training Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., JavaScript Fundamentals"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Folder"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Training Video</h3>
            <form onSubmit={handleUploadVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Introduction to React"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the video content..."
                  rows={3}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !uploadFile || !uploadTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Uploading..." : "Upload Video"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadVideo(false);
                    setUploadFile(null);
                    setUploadTitle("");
                    setUploadDescription("");
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingPortal;
