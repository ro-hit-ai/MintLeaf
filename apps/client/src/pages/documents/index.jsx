import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Mock cookie utility (replace with your preferred cookie library, e.g., js-cookie)
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Group documents by date
function groupDocumentsByDate(notebooks) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return notebooks.reduce(
    (groups, notebook) => {
      const updatedAt = new Date(notebook.updatedAt);

      if (updatedAt.toDateString() === today.toDateString()) {
        groups.today.push(notebook);
      } else if (updatedAt.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(notebook);
      } else if (isThisWeek(updatedAt, today)) {
        groups.thisWeek.push(notebook);
      } else if (isThisMonth(updatedAt, today)) {
        groups.thisMonth.push(notebook);
      } else {
        groups.older.push(notebook);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    }
  );
}

function isThisWeek(date, today) {
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  return date >= weekStart;
}

function isThisMonth(date, today) {
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Fetch notebooks from API
async function fetchNotebooks(token) {
  try {
    const res = await fetch("http://your-api.com/api/v1/notebooks/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());

    if (res.status) {
      toast.error("You do not have permission to view this resource.");
      return { notebooks: [] };
    }

    return res;
  } catch (error) {
    toast.error("Error fetching notebooks.");
    return { notebooks: [] };
  }
}

export default function NoteBooksIndex() {
  const [sortBy, setSortBy] = useState("updatedAt");
  const [searchQuery, setSearchQuery] = useState("");
  const [notebooks, setNotebooks] = useState([]);
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();

  // Mock translation function (replace with i18next or similar if needed)
  const t = (key) => key; // Returns key as-is for simplicity

  // Fetch notebooks on mount
  useEffect(() => {
    const token = getCookie("session");
    setStatus("loading");
    fetchNotebooks(token)
      .then((data) => {
        setNotebooks(data.notebooks || []);
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  // Create new notebook
  async function createNew() {
    const token = getCookie("session");
    try {
      const res = await fetch("http://your-api.com/api/v1/notebook/note/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Untitled",
          content: "",
        }),
      }).then((res) => res.json());

      if (res.success && res.id) {
        navigate(`/documents/${res.id}`);
      } else {
        toast.error("Failed to create new document.");
      }
    } catch (error) {
      toast.error("Error creating document.");
    }
  }

  // Sort and filter notebooks
  const sortedAndFilteredNotebooks = (notebooks) => {
    if (!notebooks) return [];

    let filtered = notebooks.filter((notebook) =>
      notebook.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = new Date(a[sortBy]);
      const dateB = new Date(b[sortBy]);
      return dateB - dateA;
    });
  };

  return (
    <div style={{ padding: "1rem 1.5rem" }}>
      <ToastContainer />
      <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111" }}>
            Documents
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                maxWidth: "200px",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                width: "180px",
              }}
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {status === "loading" && <p>Loading...</p>}
        {status === "error" && <p>Error loading documents.</p>}
        {status === "success" && notebooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              No documents found.
            </p>
            <button
              onClick={createNew}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              New Document
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "672px",
              width: "100%",
              gap: "1rem",
            }}
          >
            {status === "success" && notebooks.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={createNew}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  New Document
                </button>
              </div>
            )}
            {notebooks &&
              Object.entries(
                groupDocumentsByDate(sortedAndFilteredNotebooks(notebooks))
              ).map(
                ([period, docs]) =>
                  Array.isArray(docs) &&
                  docs.length > 0 && (
                    <div key={period} style={{ marginBottom: "0.5rem" }}>
                      <h3
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#6b7280",
                          textTransform: "capitalize",
                        }}
                      >
                        {period.replace(/([A-Z])/g, " $1").trim()}
                      </h3>
                      <div style={{ marginTop: "0.25rem" }}>
                        {docs.map((item) => (
                          <button
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%",
                              padding: "0.5rem",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => navigate(`/documents/${item.id}`)}
                          >
                            <h2
                              style={{
                                fontSize: "1rem",
                                fontWeight: 600,
                                color: "#111",
                              }}
                            >
                              {item.title}
                            </h2>
                            <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                              {new Date(item.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
              )}
          </div>
        )}
      </div>
    </div>
  );
}