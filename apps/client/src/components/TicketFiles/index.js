import React, { useState, useEffect } from "react";
import fileDownload from "js-file-download";
import axios from "axios";
import { TrashIcon, DocumentDownloadIcon } from "@heroicons/react/solid";

// Mock API functions
const mockGetFiles = async (id) => {
  console.log(`Fetching files for ticket ID: ${id}`);
  // Simulate API response with mock file data
  return {
    files: [
      { id: "1", filename: "document1.pdf", path: "/files/document1.pdf" },
      { id: "2", filename: "image1.jpg", path: "/files/image1.jpg" },
    ],
  };
};

const mockDeleteFile = async ({ id, path }) => {
  console.log(`Deleting file with ID: ${id} and path: ${path}`);
  // Simulate successful deletion
  return { success: true };
};

const mockDownloadFile = async ({ id, path, filename }) => {
  console.log(`Downloading file with ID: ${id}, path: ${path}`);
  // Simulate a blob response (e.g., a small text file)
  const blob = new Blob(["Sample file content"], { type: "text/plain" });
  return { data: blob };
};

function TicketFiles({ id, uploaded, setUploaded }) {
  const [files, setFiles] = useState([]);

  async function getFiles() {
    try {
      const res = await mockGetFiles(id);
      setFiles(res.files || []);
      setUploaded(false);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

  async function deleteFile(file) {
    try {
      await mockDeleteFile({ id: file.id, path: file.path });
      await getFiles(); // Refetch files after deletion
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  function download(file) {
    const url = `/api/v1/ticket/${id}/file/download?filepath=${file.path}`;
    mockDownloadFile({ id: file.id, path: file.path, filename: file.filename })
      .then((res) => {
        fileDownload(res.data, file.filename);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  }

  useEffect(() => {
    getFiles();
  }, [id, uploaded]);

  return (
    <div>
      <h3 className="text-xl">Ticket Files</h3>
      <div className="flow-root py-4 mx-auto -mt-5">
        {files.length >= 1 ? (
          files.map((file) => (
            <div className="w-full" key={file.id}>
              <ul>
                <li>
                  <span>{file.filename}</span>
                  <button
                    onClick={() => download(file)}
                    type="button"
                    className="float-right border border-transparent rounded-full shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <DocumentDownloadIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    onClick={() => deleteFile(file)}
                    type="button"
                    className="mr-1 float-right border border-transparent rounded-full shadow-sm text-red-600 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </div>
          ))
        ) : (
          <p>No files attached to the job ... </p>
        )}
      </div>
    </div>
  );
}

export default TicketFiles;