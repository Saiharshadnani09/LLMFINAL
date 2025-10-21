import React, { useEffect, useState } from "react";

function StudentScheduleView() {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch folders and documents
  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchDocuments(selectedFolder);
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/schedule/folders");
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      setError("Failed to fetch schedule folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (folderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/schedule/documents/${folderId}`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError("Failed to fetch schedule documents");
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/schedule/documents/download/${documentId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download document");
      }
    } catch (err) {
      setError("Server error while downloading document");
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'excel': return '📊';
      case 'word': return '📝';
      case 'powerpoint': return '📋';
      case 'pdf': return '📄';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📅 Training Schedules</h1>
          <p className="text-gray-300">Access your training schedules and documents</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-2 text-red-400 hover:underline text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders Panel */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
              <div className="p-4 border-b border-zinc-700">
                <h3 className="text-lg font-semibold text-white">Schedule Folders</h3>
              </div>
              <div className="p-4">
                {folders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-400">No schedule folders available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div
                        key={folder._id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedFolder === folder._id
                            ? "border-blue-500 bg-blue-900/20"
                            : "border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800"
                        }`}
                        onClick={() => setSelectedFolder(folder._id)}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-2">📁</span>
                          <div>
                            <p className="font-medium text-white">{folder.name}</p>
                            <p className="text-sm text-gray-400">
                              {folder.documentCount || 0} document(s)
                            </p>
                            {folder.description && (
                              <p className="text-xs text-gray-500 mt-1">{folder.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents Panel */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
              <div className="p-4 border-b border-zinc-700">
                <h3 className="text-lg font-semibold text-white">
                  {selectedFolder ? `Documents in "${folders.find(f => f._id === selectedFolder)?.name}"` : "Select a folder to view documents"}
                </h3>
              </div>
              <div className="p-4">
                {!selectedFolder ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-gray-400 text-lg">Select a folder to view schedule documents</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-gray-400 text-lg">No documents in this folder</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((document) => (
                      <div key={document._id} className="border border-zinc-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-zinc-800">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getFileIcon(document.fileType)}</span>
                            <div>
                              <h4 className="font-semibold text-white">{document.title}</h4>
                              <p className="text-sm text-gray-400">{document.fileName}</p>
                            </div>
                          </div>
                        </div>
                        {document.description && (
                          <p className="text-sm text-gray-300 mb-3 line-clamp-2">{document.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>Downloads: {document.downloads || 0}</span>
                          <span>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(document._id, document.fileName)}
                          className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                        >
                          📥 Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentScheduleView;
