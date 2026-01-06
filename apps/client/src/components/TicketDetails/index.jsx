import moment from "moment";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useDebounce } from "use-debounce";
import { BlockNoteView } from "@blocknote/mantine";
import Frame from "react-frame-component";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import {
  CheckIcon,
  CircleCheck,
  CircleDotDashed,
  Ellipsis,
  Eye,
  EyeOff,
  LifeBuoy,
  Loader,
  LoaderCircle,
  Lock,
  PanelTopClose,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
  Unlock,
} from "lucide-react";
import { useParams } from "react-router-dom"; // Optional: for React Router
// Import UserCombo, IconCombo, ClientCombo (adjust paths as needed)
import { UserCombo, IconCombo, ClientCombo } from "./Combo";

// Placeholder for toast notifications (replace with react-toastify or similar)
const toast = ({ title, description, variant, duration }) => {
  alert(`${title}: ${description}`);
};

// Placeholder for hasAccess (replace with your auth logic)
const hasAccess = (res) => {
  if (!res.ok) throw new Error("Unauthorized");
};

// Placeholder for translation (replace with i18n library if needed)
const t = (key) => key;

// Placeholder user object (replace with your auth context or prop)
const user = { id: "user1", isAdmin: true, name: "Admin User" }; // Example

const ticketStatusMap = [
  { id: 0, value: "hold", name: "Hold", icon: CircleDotDashed },
  { id: 1, value: "needs_support", name: "Needs Support", icon: LifeBuoy },
  { id: 2, value: "in_progress", name: "In Progress", icon: CircleDotDashed },
  { id: 3, value: "in_review", name: "In Review", icon: Loader },
  { id: 4, value: "done", name: "Done", icon: CircleCheck },
];

const priorityOptions = [
  { id: "1", name: "Low", value: "low", icon: SignalLow },
  { id: "2", name: "Medium", value: "medium", icon: SignalMedium },
  { id: "3", name: "High", value: "high", icon: SignalHigh },
];

// Fetch ticket by ID
const fetchTicketById = async (id) => {
  const token = localStorage.getItem("session") || ""; // Replace with your token logic
  const res = await fetch(`https://your-api-endpoint/ticket/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  hasAccess(res);
  return res.json();
};

export default function Ticket({ ticketId }) {
  // Use ticketId from props or useParams (if using React Router)
  const params = useParams();
  const id = ticketId || params.id; // Fallback to props or URL param

  const { data, status, refetch } = useQuery(
    ["fetchTickets", id],
    () => fetchTicketById(id),
    { enabled: !!id }
  );

  const [initialContent, setInitialContent] = useState("loading");
  const [edit, setEdit] = useState(false);
  const [editTime, setTimeEdit] = useState(false);
  const [assignedEdit, setAssignedEdit] = useState(false);
  const [labelEdit, setLabelEdit] = useState(false);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [n, setN] = useState();
  const [note, setNote] = useState();
  const [issue, setIssue] = useState();
  const [title, setTitle] = useState();
  const [priority, setPriority] = useState();
  const [ticketStatus, setTicketStatus] = useState();
  const [comment, setComment] = useState();
  const [timeSpent, setTimeSpent] = useState();
  const [publicComment, setPublicComment] = useState(false);
  const [timeReason, setTimeReason] = useState("");
  const [file, setFile] = useState(null);
  const [assignedClient, setAssignedClient] = useState();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const editor = useMemo(() => {
    if (initialContent === "loading") return undefined;
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  const [debouncedValue] = useDebounce(issue, 500);
  const [debounceTitle] = useDebounce(title, 500);

  const fileInputRef = useRef(null);

  // Fetch users
  const fetchUsers = async () => {
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/users/all", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    if (res.success) setUsers(res.users || []);
    else toast({ title: "Error", description: res.message || "Failed to fetch users", variant: "destructive" });
  };

  // Fetch clients
  const fetchClients = async () => {
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/clients/all", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
    if (res.success) setClients(res.clients || []);
    else toast({ title: "Error", description: res.message || "Failed to fetch clients", variant: "destructive" });
  };

  // Update ticket
  const update = async () => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        detail: JSON.stringify(debouncedValue),
        note,
        title: debounceTitle,
        priority: priority?.value,
        status: ticketStatus?.value,
      }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to update ticket", variant: "destructive" });
      return;
    }
    setEdit(false);
  };

  // Update ticket status
  const updateStatus = async () => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/status/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: !data.ticket.isComplete, id }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to update status", variant: "destructive" });
      return;
    }
    refetch();
  };

  // Hide/show ticket
  const hide = async (hidden) => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/status/hide", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hidden, id }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to update visibility", variant: "destructive" });
      return;
    }
    refetch();
  };

  // Lock/unlock ticket
  const lock = async (locked) => {
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/status/lock", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ locked, id }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to update lock status", variant: "destructive" });
      return;
    }
    refetch();
  };

  // Delete ticket
  const deleteIssue = async () => {
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    }).then((res) => res.json());
    if (res.success) {
      toast({ title: "Issue Deleted", description: "The issue has been deleted" });
      window.location.href = "/issues"; // Replace with React Router or prop navigation
    }
  };

  // Add comment
  const addComment = async () => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: comment, id, public: publicComment }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to add comment", variant: "destructive" });
      return;
    }
    refetch();
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/comment/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: commentId }),
    }).then((res) => res.json());
    if (res.success) refetch();
    else toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
  };

  // Add time entry
  const addTime = async () => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/time/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        time: timeSpent,
        ticket: id,
        title: timeReason,
        user: user.id,
      }),
    }).then((res) => res.json());
    if (res.success) {
      setTimeEdit(false);
      refetch();
      toast({ title: "Time Added", description: "Time has been added to the ticket" });
    }
  };

  // Subscribe/unsubscribe
  const subscribe = async () => {
    if (data?.ticket?.locked) return;
    const isFollowing = data.ticket.following?.includes(user.id);
    const action = isFollowing ? "unsubscribe" : "subscribe";
    const token = localStorage.getItem("session") || "";
    const res = await fetch(`https://your-api-endpoint/ticket/${action}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || `Failed to ${action} to issue`, variant: "destructive" });
      return;
    }
    toast({
      title: isFollowing ? "Unsubscribed" : "Subscribed",
      description: isFollowing ? "You will no longer receive updates" : "You will now receive updates",
      duration: 3000,
    });
    refetch();
  };

  // Transfer ticket
  const transferTicket = async () => {
    if (data?.ticket?.locked || !n) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user: n.id, id }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to transfer ticket", variant: "destructive" });
      return;
    }
    setAssignedEdit(false);
    refetch();
  };

  // Transfer client
  const transferClient = async () => {
    if (data?.ticket?.locked || !assignedClient) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/transfer/client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client: assignedClient.id, id }),
    }).then((res) => res.json());
    if (!res.success) {
      toast({ title: "Error", description: res.message || "Failed to transfer client", variant: "destructive" });
      return;
    }
    setAssignedEdit(false);
    refetch();
  };

  // File upload
  const handleFileChange = (e) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const token = localStorage.getItem("session") || "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", user.id);
    try {
      const res = await fetch(`https://your-api-endpoint/storage/ticket/${id}/upload/single`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then((res) => res.json());
      if (res.success) {
        setFile(null);
        refetch();
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  };

  // Update ticket status (context menu)
  const updateTicketStatus = async () => {
    if (data?.ticket?.locked) return;
    const token = localStorage.getItem("session") || "";
    const res = await fetch("https://your-api-endpoint/ticket/status/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status: !data.ticket.isComplete }),
    }).then((res) => res.json());
    if (res.success) {
      toast({
        title: data.ticket.isComplete ? "Issue re-opened" : "Issue closed",
        description: "The status of the issue has been updated.",
        duration: 3000,
      });
      refetch();
    }
  };

  // Update ticket assignee (context menu)
  const updateTicketAssignee = async (ticketId, selectedUser) => {
    const token = localStorage.getItem("session") || "";
    try {
      const res = await fetch("https://your-api-endpoint/ticket/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user: selectedUser?.id, id: ticketId }),
      }).then((res) => res.json());
      if (!res.success) throw new Error("Failed to update assignee");
      toast({ title: "Assignee updated", description: "Transferred issue successfully", duration: 3000 });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update assignee", variant: "destructive", duration: 3000 });
    }
  };

  // Update ticket priority (context menu)
  const updateTicketPriority = async (ticket, priority) => {
    const token = localStorage.getItem("session") || "";
    try {
      const res = await fetch("https://your-api-endpoint/ticket/update", {
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
          priority,
          status: ticket.status,
        }),
      }).then((res) => res.json());
      if (!res.success) throw new Error("Failed to update priority");
      toast({ title: "Priority updated", description: `Ticket priority set to ${priority}`, duration: 3000 });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update priority", variant: "destructive", duration: 3000 });
    }
  };

  // Context menu handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  // Load editor content
  const loadFromStorage = async () => {
    if (!data?.ticket?.detail) return;
    try {
      const content = JSON.parse(data.ticket.detail);
      return content;
    } catch {
      return undefined;
    }
  };

  const convertHTML = async () => {
    if (editor && data?.ticket?.detail) {
      const blocks = await editor.tryParseHTMLToBlocks(data.ticket.detail);
      editor.replaceBlocks(editor.document, blocks);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  useEffect(() => {
    if (status === "success" && data?.ticket) {
      loadFromStorage().then((content) => {
        setInitialContent(content || undefined);
        setTitle(data.ticket.title);
        setPriority(priorityOptions.find((p) => p.value === data.ticket.priority));
        setTicketStatus(ticketStatusMap.find((s) => s.value === data.ticket.status));
      });
    }
  }, [status, data]);

  useEffect(() => {
    if (initialContent === undefined) convertHTML();
  }, [initialContent]);

  useEffect(() => {
    handleUpload();
  }, [file]);

  useEffect(() => {
    transferTicket();
  }, [n]);

  useEffect(() => {
    transferClient();
  }, [assignedClient]);

  useEffect(() => {
    update();
  }, [priority, ticketStatus, debounceTitle, debouncedValue]);

  if (editor === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  const handleInputChange = (editor) => {
    if (data?.ticket?.locked) return;
    setIssue(editor.document);
  };

  const priorities = ["low", "medium", "high"];

  return (
    <div onContextMenu={handleContextMenu} onClick={closeContextMenu}>
      {status === "loading" && (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
          <h2>Loading data...</h2>
        </div>
      )}

      {status === "error" && (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Error fetching data...</h2>
        </div>
      )}

      {status === "success" && (
        <>
          <main className="flex-1 min-h-[90vh] py-8">
            <div className="mx-auto max-w-7xl w-full px-4 flex flex-col lg:flex-row justify-center">
              <div className="lg:border-r lg:pr-8 lg:w-2/3">
                <div className="md:flex md:justify-between md:space-x-4 lg:border-b lg:pb-4">
                  <div className="w-full">
                    <div className="flex flex-row space-x-1">
                      <h1 className="text-2xl mt-[5px] font-bold text-foreground">
                        #{data.ticket.Number} -
                      </h1>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        style={{ fontSize: "1.5rem" }}
                        className="border-none -mt-[1px] px-0 pl-0.5 w-3/4 truncate block text-foreground bg-transparent font-bold focus:outline-none focus:ring-0 placeholder:text-primary sm:text-sm sm:leading-6"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={data.ticket.locked}
                      />
                    </div>
                    <div className="mt-2 text-xs flex flex-row justify-between items-center space-x-1">
                      <div className="flex flex-row space-x-1 items-center">
                        {data.ticket.client && (
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                            {data.ticket.client.name}
                          </span>
                        )}
                        <div>
                          {!data.ticket.isComplete ? (
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
                          {data.ticket.type}
                        </span>
                        {data.ticket.hidden && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            Hidden
                          </span>
                        )}
                        {data.ticket.locked && (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            Locked
                          </span>
                        )}
                      </div>
                      {user.isAdmin && (
                        <div className="relative">
                          <button
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-foreground"
                            onClick={() => setContextMenu({ visible: true, x: 0, y: 0 })}
                          >
                            <Ellipsis className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <aside className="mt-4 lg:hidden">
                  <div className="border-b pb-1">
                    <div className="border-t pt-1">
                      <div className="flex flex-col sm:flex-row space-x-2">
                        <div className="ml-2">
                          {users && (
                            <UserCombo
                              value={users}
                              update={setN}
                              defaultName={data.ticket.assignedTo?.name || ""}
                              disabled={data.ticket.locked}
                              placeholder="Assign User..."
                              hideInitial={false}
                              showIcon={true}
                            />
                          )}
                        </div>
                        <IconCombo
                          value={priorityOptions}
                          update={setPriority}
                          defaultName={data.ticket.priority || ""}
                          disabled={data.ticket.locked}
                          hideInitial={false}
                        />
                        <UserCombo
                          value={ticketStatusMap}
                          update={setTicketStatus}
                          defaultName={data.ticket.status || ""}
                          disabled={data.ticket.locked}
                          showIcon={true}
                          placeholder="Change Status..."
                          hideInitial={false}
                        />
                      </div>
                    </div>
                  </div>
                </aside>
                <div className="py-3 xl:pb-0 xl:pt-2">
                  <div className="prose max-w-none mt-2">
                    {!data.ticket.fromImap ? (
                      <BlockNoteView
                        editor={editor}
                        sideMenu={false}
                        className="m-0 p-0 bg-transparent dark:text-white"
                        onChange={handleInputChange}
                        editable={!data.ticket.locked}
                      />
                    ) : (
                      <div className="break-words bg-white rounded-md text-black">
                        <Frame
                          className="min-h-[60vh] h-full max-h-[80vh] overflow-y-auto w-full"
                          initialContent={data.ticket.detail}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <section aria-labelledby="activity-title" className="border-t mt-4">
                  <div className="p-2 flex flex-col space-y-1">
                    <div className="flex flex-row items-center justify-between">
                      <span id="activity-title" className="text-base font-medium">
                        Activity
                      </span>
                      <div className="flex flex-row items-center space-x-2">
                        <button
                          onClick={subscribe}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
                            data.ticket.following?.includes(user.id)
                              ? "text-gray-500 hover:text-red-500"
                              : "text-gray-900 hover:text-gray-700"
                          }`}
                        >
                          {data.ticket.following?.includes(user.id) ? (
                            <>
                              <span className="group-hover:hidden">following</span>
                              <span className="hidden group-hover:inline text-red-500">unsubscribe</span>
                            </>
                          ) : (
                            <span>follow</span>
                          )}
                        </button>
                        {data.ticket.following?.length > 0 && (
                          <div className="relative">
                            <button>
                              <PanelTopClose className="h-4 w-4" />
                            </button>
                            {contextMenu.visible && (
                              <div
                                className="absolute z-10 bg-white border rounded-md shadow-lg p-2"
                                style={{ top: contextMenu.y, left: contextMenu.x }}
                              >
                                <span className="text-xs">Followers</span>
                                {data.ticket.following.map((follower) => {
                                  const userMatch = users.find(
                                    (u) => u.id === follower && u.id !== data.ticket.assignedTo?.id
                                  );
                                  return userMatch ? <div key={follower}>{userMatch.name}</div> : null;
                                })}
                                {data.ticket.following.filter((f) => f !== data.ticket.assignedTo?.id).length === 0 && (
                                  <span className="text-xs">This issue has no followers</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-row items-center text-sm space-x-1">
                        {data.ticket.fromImap ? (
                          <>
                            <span className="font-bold">{data.ticket.email}</span>
                            <span>created via email at</span>
                            <span className="font-bold">{moment(data.ticket.createdAt).format("DD/MM/YYYY")}</span>
                          </>
                        ) : (
                          <>
                            {data.ticket.createdBy ? (
                              <div className="flex flex-row space-x-1">
                                <span>
                                  Created by <strong>{data.ticket.createdBy.name}</strong> at
                                </span>
                                <span>{moment(data.ticket.createdAt).format("LLL")}</span>
                                {data.ticket.name && (
                                  <span>
                                    for <strong>{data.ticket.name}</strong>
                                  </span>
                                )}
                                {data.ticket.email && (
                                  <span>
                                    (<strong>{data.ticket.email}</strong>)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-row space-x-1">
                                <span>Created at</span>
                                <span>
                                  <strong>{moment(data.ticket.createdAt).format("LLL")}</strong>
                                  {data.ticket.client && (
                                    <span>
                                      for <strong>{data.ticket.client.name}</strong>
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <ul role="list" className="space-y-2">
                        {data.ticket.comments?.map((comment) => (
                          <li
                            key={comment.id}
                            className="group flex flex-col space-y-1 text-sm bg-gray-100 px-4 py-2 rounded-lg relative"
                          >
                            <div className="flex flex-row space-x-2 items-center">
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                {comment.user ? comment.user.name.slice(0, 1) : comment.replyEmail.slice(0, 1)}
                              </div>
                              <span className="font-bold">{comment.user ? comment.user.name : comment.replyEmail}</span>
                              <span className="text-xs lowercase">{moment(comment.createdAt).format("LLL")}</span>
                              {(user.isAdmin || (comment.user && comment.userId === user.id)) && (
                                <Trash2
                                  className="h-4 w-4 absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-500 hover:text-red-500"
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
                            className="block w-full bg-gray-100 rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6"
                            placeholder={data.ticket.locked ? "This ticket is locked" : "Leave a comment"}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={data.ticket.locked}
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
                              disabled={data.ticket.locked}
                              className={`inline-flex justify-center items-center gap-x-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 ${
                                data.ticket.locked ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <CheckCircleIcon
                                className={`-ml-0.5 h-5 w-5 ${data.ticket.isComplete ? "text-red-500" : "text-green-500"}`}
                                aria-hidden="true"
                              />
                              {data.ticket.isComplete ? t("reopen_issue") : t("close_issue")}
                            </button>
                            <button
                              onClick={addComment}
                              disabled={data.ticket.locked}
                              className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm ${
                                data.ticket.locked ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700"
                              }`}
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
                  {users && (
                    <UserCombo
                      value={users}
                      update={setN}
                      defaultName={data.ticket.assignedTo?.name || ""}
                      disabled={data.ticket.locked}
                      showIcon={true}
                      placeholder="Change User..."
                      hideInitial={false}
                    />
                  )}
                  <IconCombo
                    value={priorityOptions}
                    update={setPriority}
                    defaultName={data.ticket.priority || ""}
                    disabled={data.ticket.locked}
                    hideInitial={false}
                  />
                  <IconCombo
                    value={ticketStatusMap}
                    update={setTicketStatus}
                    defaultName={data.ticket.status || ""}
                    disabled={data.ticket.locked}
                    hideInitial={false}
                  />
                  {clients && (
                    <ClientCombo
                      value={clients}
                      update={setAssignedClient}
                      defaultName={data.ticket.client?.name || "No Client Assigned"}
                      disabled={data.ticket.locked}
                      showIcon={true}
                      hideInitial={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Context Menu */}
          {contextMenu.visible && (
            <div
              className="absolute z-10 bg-white border rounded-md shadow-lg p-2 w-52"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <div
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={updateTicketStatus}
              >
                {data.ticket.isComplete ? "Re-open Issue" : "Close Issue"}
              </div>
              <hr className="my-1" />
              <div className="px-2 py-1">
                <span>Assign To</span>
                <div className="ml-2">
                  <div
                    className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center ${
                      !data.ticket.assignedTo ? "bg-gray-200" : ""
                    }`}
                    onClick={() => updateTicketAssignee(data.ticket.id, undefined)}
                  >
                    <CheckIcon className={`h-4 w-4 mr-2 ${!data.ticket.assignedTo ? "" : "invisible"}`} />
                    Unassigned
                  </div>
                  {users?.map((u) => (
                    <div
                      key={u.id}
                      className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center ${
                        data.ticket.assignedTo?.name === u.name ? "bg-gray-200" : ""
                      }`}
                      onClick={() => updateTicketAssignee(data.ticket.id, u)}
                    >
                      <CheckIcon
                        className={`h-4 w-4 mr-2 ${data.ticket.assignedTo?.name === u.name ? "" : "invisible"}`}
                      />
                      {u.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-2 py-1">
                <span>Change Priority</span>
                <div className="ml-2">
                  {priorities.map((p) => (
                    <div
                      key={p}
                      className={`px-2 py-1 hover:bg-gray-100 cursor-pointer flex items-center ${
                        data.ticket.priority.toLowerCase() === p ? "bg-gray-200" : ""
                      }`}
                      onClick={() => updateTicketPriority(data.ticket, p)}
                    >
                      <CheckIcon
                        className={`h-4 w-4 mr-2 ${data.ticket.priority.toLowerCase() === p ? "" : "invisible"}`}
                      />
                      <span className="capitalize">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="my-1" />
              <div
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  toast({ title: "Link copied to clipboard", description: "You can now share the link with others." });
                  navigator.clipboard.writeText(`${window.location.origin}/issue/${data.ticket.id}`);
                }}
              >
                Share Link
              </div>
              {user.isAdmin && (
                <>
                  <hr className="my-1" />
                  <div
                    className="px-2 py-1 hover:bg-red-500 hover:text-white cursor-pointer text-red-600"
                    onClick={deleteIssue}
                  >
                    Delete Ticket
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden />
    </div>
  );
}