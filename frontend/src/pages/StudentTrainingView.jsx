import React, { useEffect, useState } from "react";

function StudentTrainingView() {
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/training/folders");
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      setError("Failed to load training folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (folderId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/training/videos/${folderId}`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setError("Failed to load training videos");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleBackToList = () => {
    setSelectedVideo(null);
  };

  if (loading && folders.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="ml-3 text-gray-300">Loading training content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={fetchFolders}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎓 Training Portal
            </span>
          </h1>
          <p className="text-gray-300 text-center text-lg">
            Access training videos and learning materials
          </p>
        </div>

        {selectedVideo ? (
          /* Video Player View */
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center"
              >
                <span className="mr-2">←</span>
                Back to Videos
              </button>
              <div className="text-sm text-gray-400">
                {folders.find(f => f._id === selectedFolder)?.name}
              </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <video
                controls
                className="w-full h-auto"
                poster="/api/placeholder/800/450"
              >
                <source src={selectedVideo.filePath} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-3">{selectedVideo.title}</h2>
              {selectedVideo.description && (
                <p className="text-gray-300 mb-4">{selectedVideo.description}</p>
              )}
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-4">📅 Uploaded: {new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
                <span>⏱️ Duration: {selectedVideo.duration || 'Unknown'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Folders Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-xl border border-gray-700 sticky top-6">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="mr-2">📁</span>
                    Training Topics
                  </h3>
                </div>
                <div className="p-4">
                  {folders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-gray-400">No training topics available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {folders.map((folder) => (
                        <button
                          key={folder._id}
                          onClick={() => setSelectedFolder(folder._id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                            selectedFolder === folder._id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-3">📁</span>
                            <div>
                              <p className="font-medium">{folder.name}</p>
                              <p className="text-sm opacity-75">
                                {folder.videoCount || 0} video(s)
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Videos Grid */}
            <div className="lg:col-span-3">
              <div className="bg-gray-900 rounded-xl border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-white">
                    {selectedFolder ? (
                      <>
                        <span className="mr-2">📹</span>
                        {folders.find(f => f._id === selectedFolder)?.name}
                      </>
                    ) : (
                      "Select a training topic to view videos"
                    )}
                  </h3>
                </div>
                <div className="p-6">
                  {!selectedFolder ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-gray-400 text-lg">Choose a training topic from the sidebar</p>
                      <p className="text-gray-500 mt-2">Browse through available training materials</p>
                    </div>
                  ) : loading ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <p className="ml-3 text-gray-300">Loading videos...</p>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-gray-400 text-lg">No videos available in this topic</p>
                      <p className="text-gray-500 mt-2">Check back later for new content</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {videos.map((video) => (
                        <div
                          key={video._id}
                          className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105"
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="aspect-video bg-gray-700 relative">
                            <video
                              className="w-full h-full object-cover"
                              preload="metadata"
                            >
                              <source src={video.filePath} type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <span className="text-white text-2xl">▶️</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-white mb-2 line-clamp-2">
                              {video.title}
                            </h4>
                            {video.description && (
                              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                {video.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
                              <span className="bg-blue-600 text-white px-2 py-1 rounded">
                                Watch Now
                              </span>
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
        )}
      </div>
    </div>
  );
}

export default StudentTrainingView;
