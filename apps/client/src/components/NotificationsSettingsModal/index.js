import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import {
  CheckIcon,
  CircleCheck,
  CircleDotDashed,
  Ellipsis,
  Eye,
  EyeOff,
  LifeBuoy,
  LoaderCircle,
  Lock,
  PanelTopClose,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
  Unlock,
} from "lucide-react";

// Mock user context
const mockUser = { id: "1", isAdmin: true, name: "Admin User" };

// Mock translation function
const t = (key) => {
  const translations = {
    open_issue: "Open",
    closed_issue: "Closed",
    comment: "Comment",
    reopen_issue: "Re-open Issue",
    close_issue: "Close Issue",
    details: "Details",
  };
  return translations[key] || key;
};

// Mock API functions
const mockFetchTicket = async (id) => {
  console.log(`Fetching ticket with ID: ${id}`);
  return {
    ticket: {
      id,
      Number: `TICKET-${id}`,
      title: "Sample Ticket",
      detail: "<p>Sample ticket content</p>",
      priority: "medium",
      status: "in_progress",
      isComplete: false,
      hidden: false,
      locked: false,
      client: { name: "Sample Client" },
      assignedTo: { id: "1", name: "Admin User" },
      createdBy: { id: "1", name: "Admin User" },
      createdAt: new Date().toISOString(),
      comments: [],
      following: ["1"],
      type: "Bug",
      fromImap: false,
    },
  };
};

const mockFetchUsers = async () => {
  console.log("Fetching users");
  return { success: true, users: [{ id: "1", name: "Admin User" }, { id: "2", name: "User 2" }] };
};

const mockFetchClients = async () => {
  console.log("Fetching clients");
  return { success: true, clients: [{ id: "1", name: "Sample Client" }, { id: "2", name: "Client 2" }] };
};

const mockUpdateTicket = async (data) => {
  console.log("Updating ticket:", data);
  return { success: true };
};

const mockUpdateStatus = async (data) => {
  console.log("Updating status:", data);
  return { success: true };
};

const mockHideTicket = async (data) => {
  console.log("Updating visibility:", data);
  return { success: true };
};

const mockLockTicket = async (data) => {
  console.log("Updating lock status:", data);
  return { success: true };
};

const mockDeleteTicket = async (data) => {
  console.log("Deleting ticket:", data);
  return { success: true };
};

const mockAddComment = async (data) => {
  console.log("Adding comment:", data);
  return { success: true };
};

const mockDeleteComment = async (id) => {
  console.log("Deleting comment:", id);
  return { success: true };
};

const mockAddTime = async (data) => {
  console.log("Adding time:", data);
  return { success: true };
};

const mockSubscribe = async (action, id) => {
  console.log(`${action} to ticket ${id}`);
  return { success: true };
};

const mockTransferTicket = async (data) => {
  console.log("Transferring ticket:", data);
  return { success: true };
};

const mockTransferClient = async (data) => {
  console.log("Transferring client:", data);
  return { success: true };
};

const mockUploadFile = async (formData) => {
  console.log("Uploading file:", formData);
  return { success: true };
};

// Ticket status and priority options
const ticketStatusMap = [
  { id: 0, value: "hold", name: "Hold", icon: CircleDotDashed },
  { id: 1, value: "needs_support", name: "Needs Support", icon: LifeBuoy },
  { id: 2, value: "in_progress", name: "In Progress", icon: CircleDotDashed },
  { id: 3, value: "in_review", name: "In Review", icon: LoaderCircle },
  { id: 4, value: "done", name: "Done", icon: CircleCheck },
];

const priorityOptions = [
  { id: "1", name: "Low", value: "low", icon: SignalLow },
  { id: "2", name: "Medium", value: "medium", icon: SignalMedium },
  { id: "3", name: "High", value: "high", icon: SignalHigh },
];

function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = mockUser;

  const [ticketData, setTicketData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [comment, setComment] = useState("");
  const [publicComment, setPublicComment] = useState(false);
  const [timeSpent, setTimeSpent] = useState("");
  const [timeReason, setTimeReason] = useState("");
  const [file, setFile] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [assignedClient, setAssignedClient] = useState(null);
  const fileInputRef = useRef(null);

  // Simple debounce implementation
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedUpdate = debounce(() => {
    if (ticketData?.ticket?.locked) return;
    mockUpdateTicket({
      id,
      detail: issue,
      title,
      priority: priority?.value,
      status: ticketStatus?.value,
    }).then((res) => {
      if (!res.success) {
        alert("Failed to update ticket");
      }
    });
  }, 500);

  useEffect(() => {
    mockFetchTicket(id)
      .then((data) => {
        setTicketData(data);
        setTitle(data.ticket.title);
        setIssue(data.ticket.detail);
        setPriority(
          priorityOptions.find((p) => p.value === data.ticket.priority) || null
        );
        setTicketStatus(
          ticketStatusMap.find((s) => s.value === data.ticket.status) || null
        );
        setStatus("success");
      })
      .catch(() => setStatus("error"));
    mockFetchUsers().then((res) => setUsers(res.users || []));
    mockFetchClients().then((res) => setClients(res.clients || []));
  }, [id]);

  useEffect(() => {
    if (issue || title || priority || ticketStatus) {
      debouncedUpdate();
    }
  }, [issue, title, priority, ticketStatus]);

  useEffect(() => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", user.id);
      mockUploadFile(formData).then((res) => {
        if (res.success) {
          setFile(null);
          mockFetchTicket(id).then((data) => setTicketData(data));
        }
      });
    }
  }, [file, id]);

  useEffect(() => {
    if (assignedUser) {
      mockTransferTicket({ user: assignedUser.id, id }).then((res) => {
        if (res.success) {
          mockFetchTicket(id).then((data) => setTicketData(data));
        } else {
          alert("Failed to transfer ticket");
        }
      });
    }
  }, [assignedUser, id]);

  useEffect(() => {
    if (assignedClient) {
      mockTransferClient({ client: assignedClient.id, id }).then((res) => {
        if (res.success) {
          mockFetchTicket(id).then((data) => setTicketData(data));
        } else {
          alert("Failed to transfer client");
        }
      });
    }
  }, [assignedClient, id]);

  const updateStatus = () => {
    if (ticketData?.ticket?.locked) return;
    mockUpdateStatus({ status: !ticketData.ticket.isComplete, id }).then((res) => {
      if (res.success) {
        alert(ticketData.ticket.isComplete ? "Issue re-opened" : "Issue closed");
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to update status");
      }
    });
  };

  const hide = (hidden) => {
    if (ticketData?.ticket?.locked) return;
    mockHideTicket({ hidden, id }).then((res) => {
      if (res.success) {
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to update visibility");
      }
    });
  };

  const lock = (locked) => {
    mockLockTicket({ locked, id }).then((res) => {
      if (res.success) {
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to update lock status");
      }
    });
  };

  const deleteIssue = () => {
    mockDeleteTicket({ id }).then((res) => {
      if (res.success) {
        alert("Issue Deleted");
        navigate("/issues");
      } else {
        alert("Failed to delete issue");
      }
    });
  };

  const addComment = () => {
    if (ticketData?.ticket?.locked) return;
    mockAddComment({ text: comment, id, public: publicComment }).then((res) => {
      if (res.success) {
        setComment("");
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to add comment");
      }
    });
  };

  const deleteComment = (commentId) => {
    mockDeleteComment(commentId).then((res) => {
      if (res.success) {
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to delete comment");
      }
    });
  };

  const addTime = () => {
    if (ticketData?.ticket?.locked) return;
    mockAddTime({ time: timeSpent, ticket: id, title: timeReason, user: user.id }).then((res) => {
      if (res.success) {
        alert("Time Added");
        setTimeSpent("");
        setTimeReason("");
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert("Failed to add time");
      }
    });
  };

  const subscribe = () => {
    if (ticketData?.ticket?.locked) return;
    const isFollowing = ticketData.ticket.following?.includes(user.id);
    const action = isFollowing ? "unsubscribe" : "subscribe";
    mockSubscribe(action, id).then((res) => {
      if (res.success) {
        alert(isFollowing ? "Unsubscribed" : "Subscribed");
        mockFetchTicket(id).then((data) => setTicketData(data));
      } else {
        alert(`Failed to ${action} to issue`);
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <h2>Loading data ...</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold">Error fetching data ...</h2>
      </div>
    );
  }

  return (
    <div>
      {status === "success" && (
        <main className="flex-1 min-h-[90vh] py-8">
          <div className="mx-auto max-w-7xl w-full px-4 flex flex-col lg:flex-row justify-center">
            <div className="lg:border-r lg:pr-8 lg:w-2/3">
              <div className="md:flex md:justify-between md:space-x-4 lg:border-b lg:pb-4">
                <div className="w-full">
                  <div className="flex flex-row space-x-1">
                    <h1 className="text-2xl mt-[5px] font-bold text-foreground">
                      #{ticketData.ticket.Number} -
                    </h1>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      style={{ fontSize: "1.5rem" }}
                      className="border-none -mt-[1px] px-0 pl-0.5 w-3/4 truncate m block text-foreground bg-transparent font-bold focus:outline-none focus:ring-0 placeholder:text-primary sm:text-sm sm:leading-6"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={ticketData.ticket.locked}
                    />
                  </div>
                  <div className="mt-2 text-xs flex flex-row justify-between items-center space-x-1">
                    {ticketData.ticket.client && (
                      <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        {ticketData.ticket.client.name}
                      </span>
                    )}
                    <div>
                      {!ticketData.ticket.isComplete ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          {t("open_issue")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          {t("closed_issue")}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                      {ticketData.ticket.type}
                    </span>
                    {ticketData.ticket.hidden && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Hidden
                      </span>
                    )}
                    {ticketData.ticket.locked && (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Locked
                      </span>
                    )}
                    {user.isAdmin && (
                      <div className="relative inline-flex items-center">
                        <button className="px-2 py-1 text-xs font-medium text-foreground">
                          <Ellipsis className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg hidden group-hover:block">
                          <div className="px-2 py-1 text-xs font-medium">Issue Actions</div>
                          <hr />
                          <button
                            className="w-full text-left px-2 py-1 text-sm flex items-center space-x-2"
                            onClick={() => hide(!ticketData.ticket.hidden)}
                          >
                            {ticketData.ticket.hidden ? (
                              <>
                                <Eye className="h-4 w-4" />
                                <span>Show Issue</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4" />
                                <span>Hide Issue</span>
                              </>
                            )}
                          </button>
                          <button
                            className="w-full text-left px-2 py-1 text-sm flex items-center space-x-2"
                            onClick={() => lock(!ticketData.ticket.locked)}
                          >
                            {ticketData.ticket.locked ? (
                              <>
                                <Unlock className="h-4 w-4" />
                                <span>Unlock Issue</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4" />
                                <span>Lock Issue</span>
                              </>
                            )}
                          </button>
                          <hr />
                          <button
                            className="w-full text-left px-2 py-1 text-sm flex items-center space-x-2 text-red-600"
                            onClick={() => deleteIssue()}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Issue</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <aside className="mt-4 lg:hidden">
                <div className="border-b pb-1">
                  <div className="border-t pt-1">
                    <div className="flex flex-col sm:flex-row space-x-2">
                      <select
                        value={assignedUser?.id || ""}
                        onChange={(e) =>
                          setAssignedUser(users.find((u) => u.id === e.target.value) || null)
                        }
                        disabled={ticketData.ticket.locked}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Assign User...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={priority?.value || ""}
                        onChange={(e) =>
                          setPriority(priorityOptions.find((p) => p.value === e.target.value) || null)
                        }
                        disabled={ticketData.ticket.locked}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Select Priority...</option>
                        {priorityOptions.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ticketStatus?.value || ""}
                        onChange={(e) =>
                          setTicketStatus(ticketStatusMap.find((s) => s.value === e.target.value) || null)
                        }
                        disabled={ticketData.ticket.locked}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Select Status...</option>
                        {ticketStatusMap.map((status) => (
                          <option key={status.id} value={status.value}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </aside>
              <div className="py-3 xl:pb-0 xl:pt-2">
                <div className="prose max-w-none mt-2">
                  <textarea
                    className="block w-full bg-transparent rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-0 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    disabled={ticketData.ticket.locked}
                  />
                </div>
              </div>
              <section className="border-t mt-4">
                <div className="p-2 flex flex-col space-y-1">
                  <div className="flex flex-row items-center justify-between">
                    <span className="text-base font-medium">Activity</span>
                    <div className="flex flex-row items-center space-x-2">
                      <button
                        onClick={subscribe}
                        className={`flex items-center gap-1 text-xs font-semibold ${ticketData.ticket.following?.includes(user.id) ? "text-gray-500" : "text-gray-900"} hover:text-gray-700`}
                      >
                        {ticketData.ticket.following?.includes(user.id) ? (
                          <>
                            <span className="group-hover:hidden">following</span>
                            <span className="hidden group-hover:inline text-red-600">unsubscribe</span>
                          </>
                        ) : (
                          <span>follow</span>
                        )}
                      </button>
                      {ticketData.ticket.following?.length > 0 && (
                        <div className="relative">
                          <button>
                            <PanelTopClose className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg hidden group-hover:block">
                            <div className="flex flex-col space-y-1 p-2">
                              <span className="text-xs">Followers</span>
                              {ticketData.ticket.following.map((follower) => {
                                const userMatch = users.find(
                                  (u) => u.id === follower && u.id !== ticketData.ticket.assignedTo.id
                                );
                                return userMatch ? (
                                  <span key={follower}>{userMatch.name}</span>
                                ) : null;
                              })}
                              {ticketData.ticket.following.filter(
                                (f) => f !== ticketData.ticket.assignedTo.id
                              ).length === 0 && (
                                <span className="text-xs">This issue has no followers</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-center text-sm space-x-1">
                    <span>
                      Created by <strong>{ticketData.ticket.createdBy.name}</strong> at{" "}
                      {new Date(ticketData.ticket.createdAt).toLocaleString()}
                    </span>
                    {ticketData.ticket.client && (
                      <span>
                        for <strong>{ticketData.ticket.client.name}</strong>
                      </span>
                    )}
                  </div>
                  <div>
                    <ul className="space-y-2">
                      {ticketData.ticket.comments.map((comment) => (
                        <li
                          key={comment.id}
                          className="group flex flex-col space-y-1 text-sm bg-gray-100 px-4 py-2 rounded-lg relative"
                        >
                          <div className="flex flex-row space-x-2 items-center">
                            <span className="font-bold">{comment.user?.name || "Anonymous"}</span>
                            <span className="text-xs lowercase">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {(user.isAdmin || (comment.user && comment.userId === user.id)) && (
                              <Trash2
                                className="h-4 w-4 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-500 hover:text-red-600"
                                onClick={() => deleteComment(comment.id)}
                              />
                            )}
                          </div>
                          <span className="ml-1">{comment.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <div className="flex space-x-3">
                      <div className="min-w-0 flex-1">
                        <textarea
                          id="comment"
                          name="comment"
                          rows={3}
                          className="block w-full bg-gray-100 rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-0 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6"
                          placeholder={ticketData.ticket.locked ? "This ticket is locked" : "Leave a comment"}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={ticketData.ticket.locked}
                        />
                        <div className="mt-4 flex justify-end">
                          <div className="flex flex-row items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={publicComment}
                              onChange={(e) => setPublicComment(e.target.checked)}
                            />
                            <span>Public Reply</span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end space-x-4">
                          <button
                            onClick={updateStatus}
                            disabled={ticketData.ticket.locked}
                            className={`inline-flex justify-center items-center gap-x-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 ${ticketData.ticket.locked ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-gray-50"}`}
                          >
                            <CheckCircleIcon
                              className={`-ml-0.5 h-5 w-5 ${ticketData.ticket.isComplete ? "text-red-500" : "text-green-500"}`}
                              aria-hidden="true"
                            />
                            {ticketData.ticket.isComplete ? t("reopen_issue") : t("close_issue")}
                          </button>
                          <button
                            onClick={addComment}
                            disabled={ticketData.ticket.locked}
                            className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm ${ticketData.ticket.locked ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700"}`}
                          >
                            {t("comment")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="hidden lg:block lg:pl-8 lg:order-2 order-1">
              <h2 className="sr-only">{t("details")}</h2>
              <div className="space-y-1 py-2">
                <select
                  value={assignedUser?.id || ""}
                  onChange={(e) =>
                    setAssignedUser(users.find((u) => u.id === e.target.value) || null)
                  }
                  disabled={ticketData.ticket.locked}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Change User...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select
                  value={priority?.value || ""}
                  onChange={(e) =>
                    setPriority(priorityOptions.find((p) => p.value === e.target.value) || null)
                  }
                  disabled={ticketData.ticket.locked}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Priority...</option>
                  {priorityOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <select
                  value={ticketStatus?.value || ""}
                  onChange={(e) =>
                    setTicketStatus(ticketStatusMap.find((s) => s.value === e.target.value) || null)
                  }
                  disabled={ticketData.ticket.locked}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Status...</option>
                  {ticketStatusMap.map((status) => (
                    <option key={status.id} value={status.value}>
                      {status.name}
                    </option>
                  ))}
                </select>
                <select
                  value={assignedClient?.id || ""}
                  onChange={(e) =>
                    setAssignedClient(clients.find((c) => c.id === e.target.value) || null)
                  }
                  disabled={ticketData.ticket.locked}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Change Client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default Ticket;