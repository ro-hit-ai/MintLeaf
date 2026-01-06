import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XMarkIcon, FunnelIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import moment from "moment";

// Mock cookie utility (replace with js-cookie or similar)
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Mock user context (replace with your actual user context or state management)
const UserContext = React.createContext({
  user: { isAdmin: false, name: "" },
});
const useUser = () => useContext(UserContext);

// Mock translation function (replace with i18next if needed)
const t = (key) => key;

// Fetch tickets from API
async function getUserTickets(token) {
  try {
    const res = await fetch("http://your-api.com/api/v1/tickets/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    return res;
  } catch (error) {
    toast.error("Error fetching tickets.");
    return { tickets: [] };
  }
}

// Fetch users from API
async function fetchUsers(token) {
  try {
    const res = await fetch("http://your-api.com/api/v1/users/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    return res.users || [];
  } catch (error) {
    toast.error("Error fetching users.");
    return [];
  }
}

// Custom hook for ticket filters
function useTicketFilters(tickets = []) {
  const [selectedPriorities, setSelectedPriorities] = useState(() => {
    const saved = localStorage.getItem("all_selectedPriorities");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const saved = localStorage.getItem("all_selectedStatuses");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAssignees, setSelectedAssignees] = useState(() => {
    const saved = localStorage.getItem("all_selectedAssignees");
    return saved ? JSON.parse(saved) : [];
  });

  const handlePriorityToggle = (priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const handleStatusToggle = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleAssigneeToggle = (assignee) => {
    setSelectedAssignees((prev) =>
      prev.includes(assignee) ? prev.filter((a) => a !== assignee) : [...prev, assignee]
    );
  };

  const clearFilters = () => {
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setSelectedAssignees([]);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const priorityMatch =
        selectedPriorities.length === 0 ||
        selectedPriorities.includes(ticket.priority.toLowerCase());
      const statusMatch =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(ticket.isComplete ? "closed" : "open");
      const assigneeMatch =
        selectedAssignees.length === 0 ||
        selectedAssignees.includes(ticket.assignedTo?.name || "Unassigned");
      return priorityMatch && statusMatch && assigneeMatch;
    });
  }, [tickets, selectedPriorities, selectedStatuses, selectedAssignees]);

  return {
    selectedPriorities,
    selectedStatuses,
    selectedAssignees,
    handlePriorityToggle,
    handleStatusToggle,
    handleAssigneeToggle,
    clearFilters,
    filteredTickets,
  };
}

// Custom hook for ticket view
function useTicketView(tickets = []) {
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("preferred_view_mode") || "list");
  const [kanbanGrouping, setKanbanGrouping] = useState(() => localStorage.getItem("preferred_kanban_grouping") || "status");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("preferred_sort_by") || "createdAt");
  const [uiSettings, setUISettings] = useState({
    showPriority: true,
    showStatus: true,
    showAssignee: true,
    showDate: true,
  });

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a[sortBy]);
      const dateB = new Date(b[sortBy]);
      return dateB - dateA;
    });
  }, [tickets, sortBy]);

  const kanbanColumns = useMemo(() => {
    if (kanbanGrouping === "status") {
      return {
        open: sortedTickets.filter((t) => !t.isComplete),
        closed: sortedTickets.filter((t) => t.isComplete),
      };
    } else if (kanbanGrouping === "priority") {
      return {
        low: sortedTickets.filter((t) => t.priority.toLowerCase() === "low"),
        medium: sortedTickets.filter((t) => t.priority.toLowerCase() === "medium"),
        high: sortedTickets.filter((t) => t.priority.toLowerCase() === "high"),
      };
    } else if (kanbanGrouping === "assignee") {
      const assignees = [...new Set(tickets.map((t) => t.assignedTo?.name || "Unassigned"))];
      return assignees.reduce((acc, assignee) => {
        acc[assignee] = sortedTickets.filter((t) => (t.assignedTo?.name || "Unassigned") === assignee);
        return acc;
      }, {});
    }
    return {};
  }, [sortedTickets, kanbanGrouping]);

  const handleUISettingChange = (setting, value) => {
    setUISettings((prev) => ({ ...prev, [setting]: value }));
  };

  return {
    viewMode,
    kanbanGrouping,
    sortBy,
    setViewMode,
    setKanbanGrouping,
    setSortBy,
    sortedTickets,
    kanbanColumns,
    uiSettings,
    handleUISettingChange,
  };
}

// Custom hook for ticket actions
function useTicketActions(token, refetch) {
  const updateTicketStatus = async (e, ticket) => {
    e.preventDefault();
    try {
      const response = await fetch("http://your-api.com/api/v1/ticket/status/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ticket.id, status: !ticket.isComplete }),
      }).then((res) => res.json());
      toast.success(ticket.isComplete ? "Issue re-opened" : "Issue closed");
      refetch();
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const updateTicketAssignee = async (ticketId, user) => {
    try {
      const response = await fetch("http://your-api.com/api/v1/ticket/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: user ? user.id : undefined,
          id: ticketId,
        }),
      });
      if (!response.ok) throw new Error("Failed to update assignee");
      toast.success("Assignee updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update assignee");
    }
  };

  const updateTicketPriority = async (ticket, priority) => {
    try {
      const response = await fetch("http://your-api.com/api/v1/ticket/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: ticket.id,
          detail: ticket.detail,
          note: ticket.note,
          title: ticket.title,
          priority: priority,
          status: ticket.status,
        }),
      }).then((res) => res.json());
      if (!response.success) throw new Error("Failed to update priority");
      toast.success(`Ticket priority set to ${priority}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const deleteTicket = async (e, ticketId) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await fetch("http://your-api.com/api/v1/ticket/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ticketId }),
      });
      toast.success("Ticket deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  };

  return { updateTicketStatus, updateTicketAssignee, updateTicketPriority, deleteTicket };
}

// FilterBadge component
const FilterBadge = ({ text, onRemove }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      background: "#f3f4f6",
      borderRadius: "0.25rem",
      padding: "0.25rem 0.5rem",
      fontSize: "0.75rem",
    }}
  >
    <span>{text}</span>
    <button
      onClick={onRemove}
      style={{
        padding: "0.25rem",
        borderRadius: "50%",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <XMarkIcon style={{ width: "0.75rem", height: "0.75rem" }} />
    </button>
  </div>
);

// TicketFilters component
const TicketFilters = ({
  selectedPriorities,
  selectedStatuses,
  selectedAssignees,
  users,
  onPriorityToggle,
  onStatusToggle,
  onAssigneeToggle,
  onClearFilters,
}) => {
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");

  const filteredPriorities = useMemo(() => {
    const priorities = ["low", "medium", "high"];
    return priorities.filter((priority) =>
      priority.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [filterSearch]);

  const filteredStatuses = useMemo(() => {
    const statuses = ["open", "closed"];
    return statuses.filter((status) =>
      status.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [filterSearch]);

  const filteredAssignees = useMemo(() => {
    const assignees = users.map((u) => u.name).concat("Unassigned");
    return assignees.filter((assignee) =>
      assignee.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [users, filterSearch]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ position: "relative" }}>
        <button
          style={{ padding: "0.25rem 0.5rem", background: "transparent", border: "none", display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => setActiveFilter(activeFilter ? null : "main")}
        >
          <FunnelIcon style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
          <span>Filters</span>
        </button>
        {activeFilter && (
          <div style={{ position: "absolute", top: "2rem", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", width: "300px", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            {activeFilter === "main" ? (
              <div style={{ padding: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search filters..."
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setActiveFilter("priority")}>
                    Priority
                  </button>
                  <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setActiveFilter("status")}>
                    Status
                  </button>
                  <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setActiveFilter("assignee")}>
                    Assigned To
                  </button>
                </div>
              </div>
            ) : activeFilter === "priority" ? (
              <div style={{ padding: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search priority..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  {filteredPriorities.length ? (
                    filteredPriorities.map((priority) => (
                      <button
                        key={priority}
                        style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                        onClick={() => onPriorityToggle(priority)}
                      >
                        <div
                          style={{
                            width: "1rem",
                            height: "1rem",
                            border: "1px solid #3b82f6",
                            borderRadius: "0.125rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "0.5rem",
                            background: selectedPriorities.includes(priority) ? "#3b82f6" : "transparent",
                            opacity: selectedPriorities.includes(priority) ? 1 : 0.5,
                          }}
                        >
                          {selectedPriorities.includes(priority) && (
                            <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />
                          )}
                        </div>
                        <span style={{ textTransform: "capitalize" }}>{priority}</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "0.5rem", textAlign: "center" }}>No priorities found.</div>
                  )}
                </div>
                <hr style={{ margin: "0.5rem 0" }} />
                <button
                  style={{ width: "100%", textAlign: "center", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                  onClick={() => {
                    setActiveFilter(null);
                    setFilterSearch("");
                  }}
                >
                  Back to filters
                </button>
              </div>
            ) : activeFilter === "status" ? (
              <div style={{ padding: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search status..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  {filteredStatuses.length ? (
                    filteredStatuses.map((status) => (
                      <button
                        key={status}
                        style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                        onClick={() => onStatusToggle(status)}
                      >
                        <div
                          style={{
                            width: "1rem",
                            height: "1rem",
                            border: "1px solid #3b82f6",
                            borderRadius: "0.125rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "0.5rem",
                            background: selectedStatuses.includes(status) ? "#3b82f6" : "transparent",
                            opacity: selectedStatuses.includes(status) ? 1 : 0.5,
                          }}
                        >
                          {selectedStatuses.includes(status) && (
                            <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />
                          )}
                        </div>
                        <span style={{ textTransform: "capitalize" }}>{status}</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "0.5rem", textAlign: "center" }}>No statuses found.</div>
                  )}
                </div>
                <hr style={{ margin: "0.5rem 0" }} />
                <button
                  style={{ width: "100%", textAlign: "center", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                  onClick={() => {
                    setActiveFilter(null);
                    setFilterSearch("");
                  }}
                >
                  Back to filters
                </button>
              </div>
            ) : activeFilter === "assignee" ? (
              <div style={{ padding: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search assignee..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  {filteredAssignees.length ? (
                    filteredAssignees.map((name) => (
                      <button
                        key={name}
                        style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                        onClick={() => onAssigneeToggle(name)}
                      >
                        <div
                          style={{
                            width: "1rem",
                            height: "1rem",
                            border: "1px solid #3b82f6",
                            borderRadius: "0.125rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "0.5rem",
                            background: selectedAssignees.includes(name) ? "#3b82f6" : "transparent",
                            opacity: selectedAssignees.includes(name) ? 1 : 0.5,
                          }}
                        >
                          {selectedAssignees.includes(name) && (
                            <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />
                          )}
                        </div>
                        <span>{name}</span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "0.5rem", textAlign: "center" }}>No assignees found.</div>
                  )}
                </div>
                <hr style={{ margin: "0.5rem 0" }} />
                <button
                  style={{ width: "100%", textAlign: "center", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                  onClick={() => {
                    setActiveFilter(null);
                    setFilterSearch("");
                  }}
                >
                  Back to filters
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {selectedPriorities.map((priority) => (
          <FilterBadge
            key={`priority-${priority}`}
            text={`Priority: ${priority}`}
            onRemove={() => onPriorityToggle(priority)}
          />
        ))}
        {selectedStatuses.map((status) => (
          <FilterBadge
            key={`status-${status}`}
            text={`Status: ${status}`}
            onRemove={() => onStatusToggle(status)}
          />
        ))}
        {selectedAssignees.map((assignee) => (
          <FilterBadge
            key={`assignee-${assignee}`}
            text={`Assignee: ${assignee}`}
            onRemove={() => onAssigneeToggle(assignee)}
          />
        ))}
        {(selectedPriorities.length > 0 || selectedStatuses.length > 0 || selectedAssignees.length > 0) && (
          <button
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", background: "transparent", border: "none", cursor: "pointer" }}
            onClick={onClearFilters}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

// ViewSettings component
const ViewSettings = ({ viewMode, kanbanGrouping, sortBy, uiSettings, onViewModeChange, onKanbanGroupingChange, onSortChange, onUISettingChange }) => (
  <div style={{ display: "flex", gap: "0.5rem" }}>
    <select
      value={viewMode}
      onChange={(e) => onViewModeChange(e.target.value)}
      style={{ padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
    >
      <option value="list">List</option>
      <option value="kanban">Kanban</option>
    </select>
    {viewMode === "kanban" && (
      <select
        value={kanbanGrouping}
        onChange={(e) => onKanbanGroupingChange(e.target.value)}
        style={{ padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
      >
        <option value="status">By Status</option>
        <option value="priority">By Priority</option>
        <option value="assignee">By Assignee</option>
      </select>
    )}
    <select
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value)}
      style={{ padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem" }}
    >
      <option value="createdAt">Created Date</option>
      <option value="updatedAt">Last Updated</option>
    </select>
    <div style={{ position: "relative" }}>
      <button style={{ padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.25rem", background: "transparent", cursor: "pointer" }}>
        UI Settings
      </button>
      <div style={{ position: "absolute", top: "2rem", right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", width: "200px", zIndex: 10, padding: "0.5rem" }}>
        {Object.keys(uiSettings).map((setting) => (
          <label key={setting} style={{ display: "flex", alignItems: "center", padding: "0.25rem" }}>
            <input
              type="checkbox"
              checked={uiSettings[setting]}
              onChange={(e) => onUISettingChange(setting, e.target.checked)}
              style={{ marginRight: "0.5rem" }}
            />
            {`Show ${setting.replace("show", "")}`}
          </label>
        ))}
      </div>
    </div>
  </div>
);

// TicketList component
const TicketList = ({ tickets, onStatusChange, onAssigneeChange, onPriorityChange, onDelete, users, currentUser, uiSettings }) => {
  const getBadgeStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case "low":
        return { background: "#dbeafe", color: "#1e40af" };
      case "normal":
      case "medium":
        return { background: "#d1fae5", color: "#065f46" };
      case "high":
        return { background: "#fee2e2", color: "#991b1b" };
      default:
        return { background: "#e5e7eb", color: "#374151" };
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ position: "relative" }}>
          <Link to={`/issue/${ticket.id}`}>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.375rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {uiSettings.showNumber && <span style={{ fontSize: "0.75rem", fontWeight: 600 }}># {ticket.Number}</span>}
                {uiSettings.showTitle && <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{ticket.title}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {uiSettings.showDate && <span style={{ fontSize: "0.75rem" }}>{moment(ticket.createdAt).format("DD/MM/yyyy")}</span>}
                {uiSettings.showType && (
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #e5e7eb", background: "#fb923c", color: "#fff" }}>
                    {ticket.type}
                  </span>
                )}
                {uiSettings.showStatus && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      border: "1px solid #e5e7eb",
                      background: ticket.isComplete ? "#fee2e2" : "#d1fae5",
                      color: ticket.isComplete ? "#991b1b" : "#065f46",
                      width: "80px",
                      justifyContent: "center",
                    }}
                  >
                    <svg style={{ width: "0.375rem", height: "0.375rem", fill: ticket.isComplete ? "#ef4444" : "#10b981" }} viewBox="0 0 6 6">
                      <circle cx={3} cy={3} r={3} />
                    </svg>
                    {ticket.isComplete ? t("closed") : t("open")}
                  </span>
                )}
                {uiSettings.showPriority && (
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #e5e7eb", width: "80px", justifyContent: "center", ...getBadgeStyle(ticket.priority) }}>
                    {ticket.priority}
                  </span>
                )}
                {uiSettings.showAssignee && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "#6b7280", color: "#fff", fontSize: "0.625rem", fontWeight: 500, textTransform: "uppercase" }}>
                    {ticket.assignedTo ? ticket.assignedTo.name[0] : ""}
                  </span>
                )}
              </div>
            </div>
          </Link>
          <div style={{ position: "absolute", top: "0", right: "0", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", width: "200px", zIndex: 10, display: "none" }} className="context-menu">
            <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={(e) => onStatusChange(e, ticket)}>
              {ticket.isComplete ? "Re-open Issue" : "Close Issue"}
            </button>
            <hr style={{ margin: "0.25rem 0" }} />
            <div style={{ position: "relative" }}>
              <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setActiveFilter(activeFilter === `assign-${ticket.id}` ? null : `assign-${ticket.id}`)}>
                Assign To
              </button>
              {activeFilter === `assign-${ticket.id}` && (
                <div style={{ position: "absolute", top: 0, left: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", width: "200px", zIndex: 10 }}>
                  <button
                    style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                    onClick={() => onAssigneeChange(ticket.id, undefined)}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "1rem",
                          height: "1rem",
                          border: "1px solid #3b82f6",
                          borderRadius: "0.125rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "0.5rem",
                          background: !ticket.assignedTo ? "#3b82f6" : "transparent",
                          opacity: !ticket.assignedTo ? 1 : 0.5,
                        }}
                      >
                        {!ticket.assignedTo && <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />}
                      </div>
                      Unassigned
                    </div>
                  </button>
                  {users?.map((user) => (
                    <button
                      key={user.id}
                      style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                      onClick={() => onAssigneeChange(ticket.id, user)}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: "1rem",
                            height: "1rem",
                            border: "1px solid #3b82f6",
                            borderRadius: "0.125rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "0.5rem",
                            background: ticket.assignedTo?.name === user.name ? "#3b82f6" : "transparent",
                            opacity: ticket.assignedTo?.name === user.name ? 1 : 0.5,
                          }}
                        >
                          {ticket.assignedTo?.name === user.name && <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />}
                        </div>
                        {user.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setActiveFilter(activeFilter === `priority-${ticket.id}` ? null : `priority-${ticket.id}`)}>
                Change Priority
              </button>
              {activeFilter === `priority-${ticket.id}` && (
                <div style={{ position: "absolute", top: 0, left: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", width: "200px", zIndex: 10 }}>
                  {["low", "medium", "high"].map((priority) => (
                    <button
                      key={priority}
                      style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
                      onClick={() => onPriorityChange(ticket, priority)}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: "1rem",
                            height: "1rem",
                            border: "1px solid #3b82f6",
                            borderRadius: "0.125rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "0.5rem",
                            background: ticket.priority.toLowerCase() === priority ? "#3b82f6" : "transparent",
                            opacity: ticket.priority.toLowerCase() === priority ? 1 : 0.5,
                          }}
                        >
                          {ticket.priority.toLowerCase() === priority && <CheckIcon style={{ width: "1rem", height: "1rem", color: "#fff" }} />}
                        </div>
                        <span style={{ textTransform: "capitalize" }}>{priority}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <hr style={{ margin: "0.25rem 0" }} />
            <button
              style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer" }}
              onClick={() => {
                toast.success("Link copied to clipboard");
                navigator.clipboard.writeText(`${window.location.origin}/issue/${ticket.id}`);
              }}
            >
              Share Link
            </button>
            {currentUser.isAdmin && (
              <>
                <hr style={{ margin: "0.25rem 0" }} />
                <button
                  style={{ width: "100%", textAlign: "left", padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer", color: "#dc2626" }}
                  onClick={(e) => onDelete(e, ticket.id)}
                >
                  Delete Ticket
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// TicketKanban component
const TicketKanban = ({ columns, uiSettings }) => {
  const getBadgeStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case "low":
        return { background: "#dbeafe", color: "#1e40af" };
      case "normal":
      case "medium":
        return { background: "#d1fae5", color: "#065f46" };
      case "high":
        return { background: "#fee2e2", color: "#991b1b" };
      default:
        return { background: "#e5e7eb", color: "#374151" };
    }
  };

  return (
    <div style={{ display: "flex", gap: "1rem", overflowX: "auto", padding: "1rem" }}>
      {Object.entries(columns).map(([key, tickets]) => (
        <div key={key} style={{ flex: "0 0 300px", background: "#f9fafb", borderRadius: "0.25rem", padding: "0.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, textTransform: "capitalize", marginBottom: "0.5rem" }}>{key}</h3>
          {tickets.map((ticket) => (
            <Link key={ticket.id} to={`/issue/${ticket.id}`}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.25rem", padding: "0.5rem", marginBottom: "0.5rem" }}>
                {uiSettings.showNumber && <div style={{ fontSize: "0.75rem", fontWeight: 600 }}># {ticket.Number}</div>}
                {uiSettings.showTitle && <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ticket.title}</div>}
                {uiSettings.showDate && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{moment(ticket.createdAt).format("DD/MM/yyyy")}</div>}
                {uiSettings.showType && (
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #e5e7eb", background: "#fb923c", color: "#fff", marginTop: "0.25rem" }}>
                    {ticket.type}
                  </div>
                )}
                {uiSettings.showStatus && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      border: "1px solid #e5e7eb",
                      background: ticket.isComplete ? "#fee2e2" : "#d1fae5",
                      color: ticket.isComplete ? "#991b1b" : "#065f46",
                      marginTop: "0.25rem",
                    }}
                  >
                    <svg style={{ width: "0.375rem", height: "0.375rem", fill: ticket.isComplete ? "#ef4444" : "#10b981" }} viewBox="0 0 6 6">
                      <circle cx={3} cy={3} r={3} />
                    </svg>
                    {ticket.isComplete ? t("closed") : t("open")}
                  </div>
                )}
                {uiSettings.showPriority && (
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #e5e7eb", marginTop: "0.25rem", ...getBadgeStyle(ticket.priority) }}>
                    {ticket.priority}
                  </div>
                )}
                {uiSettings.showAssignee && (
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "#6b7280", color: "#fff", fontSize: "0.625rem", fontWeight: 500, textTransform: "uppercase", marginTop: "0.25rem" }}>
                    {ticket.assignedTo ? ticket.assignedTo.name[0] : ""}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
};

export default function Tickets() {
  const token = getCookie("session");
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("idle");
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);

  const { selectedPriorities, selectedStatuses, selectedAssignees, handlePriorityToggle, handleStatusToggle, handleAssigneeToggle, clearFilters, filteredTickets } = useTicketFilters(tickets);
  const { viewMode, kanbanGrouping, sortBy, setViewMode, setKanbanGrouping, setSortBy, sortedTickets, kanbanColumns, uiSettings, handleUISettingChange } = useTicketView(filteredTickets);
  const { updateTicketStatus, updateTicketAssignee, updateTicketPriority, deleteTicket } = useTicketActions(token, () => getUserTickets(token).then((data) => setTickets(data.tickets || [])));

  useEffect(() => {
    setStatus("loading");
    Promise.all([getUserTickets(token), fetchUsers(token)]).then(([ticketData, userData]) => {
      setTickets(ticketData.tickets || []);
      setUsers(userData);
      setStatus("success");
    }).catch(() => {
      setStatus("error");
    });

    const interval = setInterval(() => {
      getUserTickets(token).then((data) => {
        setTickets(data.tickets || []);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    localStorage.setItem("all_selectedPriorities", JSON.stringify(selectedPriorities));
    localStorage.setItem("all_selectedStatuses", JSON.stringify(selectedStatuses));
    localStorage.setItem("all_selectedAssignees", JSON.stringify(selectedAssignees));
  }, [selectedPriorities, selectedStatuses, selectedAssignees]);

  useEffect(() => {
    localStorage.setItem("preferred_view_mode", viewMode);
    localStorage.setItem("preferred_kanban_grouping", kanbanGrouping);
    localStorage.setItem("preferred_sort_by", sortBy);
  }, [viewMode, kanbanGrouping, sortBy]);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ border: "4px solid #10b981", borderTop: "4px solid transparent", borderRadius: "50%", width: "100px", height: "100px", animation: "spin 1s linear infinite" }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ToastContainer />
      <div style={{ padding: "0.5rem 0.75rem", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TicketFilters
          selectedPriorities={selectedPriorities}
          selectedStatuses={selectedStatuses}
          selectedAssignees={selectedAssignees}
          users={users}
          onPriorityToggle={handlePriorityToggle}
          onStatusToggle={handleStatusToggle}
          onAssigneeToggle={handleAssigneeToggle}
          onClearFilters={clearFilters}
        />
        <ViewSettings
          viewMode={viewMode}
          kanbanGrouping={kanbanGrouping}
          sortBy={sortBy}
          uiSettings={uiSettings}
          onViewModeChange={setViewMode}
          onKanbanGroupingChange={setKanbanGrouping}
          onSortChange={setSortBy}
          onUISettingChange={handleUISettingChange}
        />
      </div>
      {viewMode === "list" ? (
        <TicketList
          tickets={sortedTickets}
          onStatusChange={updateTicketStatus}
          onAssigneeChange={updateTicketAssignee}
          onPriorityChange={updateTicketPriority}
          onDelete={user.isAdmin ? deleteTicket : undefined}
          users={users}
          currentUser={user}
          uiSettings={uiSettings}
        />
      ) : (
        <TicketKanban columns={kanbanColumns} uiSettings={uiSettings} />
      )}
    </div>
  );
}

// Wrap the app with UserContext for demonstration
function App() {
  return (
    <UserContext.Provider value={{ user: { isAdmin: false, name: "John Doe" } }}>
      <Tickets />
    </UserContext.Provider>
  );
}