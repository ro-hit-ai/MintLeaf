import React, { useState, useEffect } from "react";
import fileDownload from "js-file-download";
import axios from "axios";
import { TrashIcon, DocumentDownloadIcon } from "@heroicons/react/solid";

export default function ListUserFiles({ uploaded, setUploaded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Using environment variable for API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

  async function getFiles() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/file/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const res = await response.json();
      setFiles(res.files || []);
      if (setUploaded) setUploaded(false);
    } catch (error) {
      setError("Failed to fetch files");
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteFile(file) {
    if (!window.confirm(`Are you sure you want to delete ${file.filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/file/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: file.id,
          path: file.path,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        getFiles(); // Refresh the file list
      } else {
        alert(result.error || "Failed to delete file");
      }
    } catch (error) {
      alert("An error occurred while deleting the file.");
      console.error("Error deleting file:", error);
    }
  }

  async function download(file) {
    try {
      const url = `${API_BASE_URL}/api/v1/users/file/download?id=${file.id}`;
      const response = await axios.get(url, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      fileDownload(response.data, file.filename);
    } catch (error) {
      alert("An error occurred while downloading the file.");
      console.error("Error downloading file:", error);
    }
  }

  useEffect(() => {
    getFiles();
  }, [uploaded]);

  if (loading) {
    return (
      <div className="flow-root p-5 mx-auto -mt-5 ml-1">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flow-root p-5 mx-auto -mt-5 ml-1">
        <div className="text-red-500 text-center py-4">
          {error}
          <button
            onClick={getFiles}
            className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flow-root p-5 mx-auto -mt-5 ml-1">
        {files && files.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </span>
                    {file.size && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => download(file)}
                      type="button"
                      className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      title="Download file"
                    >
                      <DocumentDownloadIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => deleteFile(file)}
                      type="button"
                      className="p-1 text-red-600 hover:text-white hover:bg-red-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Delete file"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No files found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}