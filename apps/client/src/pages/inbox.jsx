// src/pages/portal/Inbox.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import {
  Mail,
  Reply,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Filter,
  Paperclip,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../store/session.jsx";

const FOLDERS = ["inbox", "sent", "processed", "trash", "drafts", "resolved"];

const Inbox = () => {
  const { user, fetchWithAuth, imap_enabled, loading: sessionLoading } =
    useUser();

  // 1) Session loading
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        <p className="ml-2">Loading session...</p>
      </div>
    );
  }

  // 2) IMAP disabled → redirect
  if (!imap_enabled) {
    return <Navigate to="/portal" replace />;
  }

  const [searchParams, setSearchParams] = useSearchParams();

  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState(null);

  const [folder, setFolder] = useState(searchParams.get("folder") || "inbox");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page"), 10) || 1
  );
  const [limit] = useState(20);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);

  // Stats (still fetched but not visually shown)
  const [stats, setStats] = useState({ unseen: 0, pending: 0 });
  const [statsError, setStatsError] = useState(false);

  const searchTimeoutRef = useRef(null);

  /* ------------------------------------------------------------------
   * FETCH EMAILS (unchanged API logic)
   * ------------------------------------------------------------------ */
  const fetchEmails = useCallback(
    async (
      currFolder = folder,
      currPage = page,
      currSearch = searchTerm,
      currUnread = unreadOnly
    ) => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: currPage.toString(),
          limit: limit.toString(),
        });

        if (currSearch) params.append("q", currSearch);
        if (currUnread) params.append("unreadOnly", "true");

        const url = `/v1/imap/emails?${params}`;
        console.log("🔍 Fetching emails from:", url);

        const res = await fetchWithAuth(url);
        console.log("📡 Response status:", res.status);

        const result = await res.json();
        console.log("📨 Response data:", result);

        if (res.ok && result.success) {
          setEmails(result.emails || []);
          setTotal(result.total || 0);
        } else {
          toast.error(result.message || "Failed to fetch emails", {
            toastId: "fetch-emails-error",
          });
          setEmails([]);
          setTotal(0);
        }
      } catch (err) {
        console.error("❌ IMAP fetch failed:", err);
        toast.error("Inbox temporarily unavailable", {
          toastId: "fetch-emails-error",
        });
        setEmails([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, folder, page, searchTerm, unreadOnly, limit]
  );

  /* ------------------------------------------------------------------
   * DEBOUNCED SEARCH
   * ------------------------------------------------------------------ */
  const debouncedSearch = useCallback((term) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(term);
      setPage(1);
    }, 300);
  }, []);

  /* ------------------------------------------------------------------
   * FETCH STATS (unchanged API logic, UI hidden)
   * ------------------------------------------------------------------ */
  const fetchStats = useCallback(async () => {
    try {
      setStatsError(false);

      const unseenRes = await fetchWithAuth("/v1/imap/emails?limit=1");
      if (unseenRes.ok) {
        const unseenResult = await unseenRes.json();
        if (unseenResult.success) {
          setStats((prev) => ({ ...prev, unseen: unseenResult.total || 0 }));
        }
      }

      const prioRes = await fetchWithAuth("/v1/imap/priority-stats");
      if (prioRes.ok) {
        const prioResult = await prioRes.json();
        if (prioResult.success) {
          setStats((prev) => ({
            ...prev,
            pending: prioResult.data?.pendingAnalysis || 0,
          }));
        }
      }
    } catch (err) {
      console.warn("IMAP stats failed:", err.message);
      setStatsError(true);
      setStats({ unseen: 0, pending: 0 });
    }
  }, [fetchWithAuth]);

  /* ------------------------------------------------------------------
   * REFRESH IMAP (unchanged API logic)
   * ------------------------------------------------------------------ */
  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/v1/imap/fetch-emails", {
        method: "POST",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.info("Fetching new emails...", { toastId: "fetch-started" });
        setTimeout(() => fetchEmails(), 2000);
      } else {
        toast.error(result.message || "Failed to start fetch");
      }
    } catch (err) {
      toast.error("Refresh failed");
    }
  }, [fetchWithAuth, fetchEmails]);

  /* ------------------------------------------------------------------
   * PLACEHOLDER ACTIONS (no API yet)
   * ------------------------------------------------------------------ */
  const handleMove = useCallback(async (emailId, newFolder) => {
    toast.info("Move functionality coming soon");
  }, []);

  const handleMarkRead = useCallback(async (emailId) => {
    toast.info("Mark read functionality coming soon");
  }, []);

  const handleBulkMove = useCallback(
    async (newFolder) => {
      if (!selectedEmails.length) return;
      toast.info("Bulk move functionality coming soon");
    },
    [selectedEmails]
  );

  const handleReply = useCallback(async (emailId) => {
    toast.info("Reply functionality coming soon");
  }, []);

  /* ------------------------------------------------------------------
   * EFFECTS
   * ------------------------------------------------------------------ */
  useEffect(() => {
    console.log("🔍 Inbox Component Mounted:");
    console.log("  - User:", user);
    console.log("  - IMAP Enabled:", imap_enabled);

    fetchEmails();
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchEmails, fetchStats, user, imap_enabled]);

  useEffect(() => {
    setSearchParams(
      {
        page: page.toString(),
        ...(searchTerm && { q: searchTerm }),
      },
      { replace: true }
    );
  }, [page, searchTerm, setSearchParams]);

  // When emails change, ensure something is selected (Gmail-style)
  useEffect(() => {
    if (emails.length > 0) {
      // If currently selected email not in new list, select first
      const stillExists = selectedEmail
        ? emails.find((e) => e._id === selectedEmail._id)
        : null;
      if (!stillExists) {
        setSelectedEmail(emails[0]);
      }
    } else {
      setSelectedEmail(null);
    }
  }, [emails, selectedEmail]);

  const pages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const handleSelectAll = () => {
    setSelectedEmails((prev) =>
      prev.length === emails.length ? [] : emails.map((e) => e._id)
    );
  };

  const handleSelectOne = (id) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const isSelected = (id) => selectedEmails.includes(id);

  const priorityColor = (priority) => {
    const p = (priority || "pending").toLowerCase();
    if (p === "high") return "bg-red-100 text-red-800 border-red-200";
    if (p === "medium") return "bg-amber-100 text-amber-800 border-amber-200";
    if (p === "low") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full min-h-[70vh]">
      {/* Top controls (Gmail/Freshdesk style) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">
              Inbox
            </span>
            <span className="text-xs text-slate-500">
              {startItem}-{endItem} of {total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${
                loading ? "animate-spin text-emerald-600" : "text-slate-500"
              }`}
            />
            Refresh
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search mail"
              defaultValue={searchTerm}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 w-56"
            />
          </div>

          {/* Unread filter */}
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
              unreadOnly
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Unread only
          </button>

          {/* Bulk actions */}
          {selectedEmails.length > 0 && (
            <button
              onClick={() => handleBulkMove("processed")}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              Move {selectedEmails.length}
            </button>
          )}
        </div>
      </div>

      {/* Main layout: list (left) + preview (right) */}
      <div className="flex-1 min-h-0 mt-1">
        <div className="flex h-full min-h-[480px] rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* LEFT: Email list */}
          <div className="w-full md:w-2/5 border-r border-slate-200 flex flex-col">
            {/* List header row (checkbox + pagination) */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs text-slate-500">
                  {selectedEmails.length > 0
                    ? `${selectedEmails.length} selected`
                    : "All conversations"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[11px] px-1">
                  {page} / {Math.max(pages, 1)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages || pages === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Email list body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
                  <p className="mt-2 text-xs">Loading emails…</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                  <Mail className="h-10 w-10 mb-3 text-slate-300" />
                  <p className="text-xs mb-1">No emails found.</p>
                  <button
                    onClick={handleRefresh}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Fetch now?
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {emails.map((email) => {
                    const isActive =
                      selectedEmail && selectedEmail._id === email._id;

                    return (
                      <li
                        key={email._id}
                        onClick={() => setSelectedEmail(email)}
                        className={`cursor-pointer px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-50/80"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${
                                  email.isRead
                                    ? "text-slate-500"
                                    : "text-slate-900"
                                }`}
                              >
                                {email.from || "Unknown sender"}
                              </span>

                              {/* Read/Unread pill */}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  email.isRead
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                              >
                                {email.isRead ? "READ" : "UNREAD"}
                              </span>

                              {/* Priority pill */}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${priorityColor(
                                  email.priority
                                )}`}
                              >
                                {email.priority
                                  ? email.priority.toUpperCase()
                                  : "PENDING"}
                              </span>
                            </div>

                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                              <span className="truncate max-w-[230px] font-medium">
                                {email.subject || "(no subject)"}
                              </span>
                            </div>

                            <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                              {email.preview ||
                                (email.body
                                  ? email.body.replace(/<[^>]+>/g, "").slice(0, 80) +
                                    "…"
                                  : "")}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[11px] text-slate-400">
                              {email.date
                                ? new Date(email.date).toLocaleDateString()
                                : ""}
                            </span>
                            {email.attachments &&
                              email.attachments.length > 0 && (
                                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                              )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: Email preview (desktop only) */}
          <div className="hidden md:flex md:w-3/5 flex-col bg-slate-50">
            {!selectedEmail ? (
              <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
                Select an email to preview
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-200 bg-white/90 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 truncate">
                        {selectedEmail.subject || "(no subject)"}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">
                          From:{" "}
                          <span className="font-medium text-slate-700">
                            {selectedEmail.from || "Unknown sender"}
                          </span>
                        </span>
                        <span className="text-xs text-slate-400">
                          •{" "}
                          {selectedEmail.date
                            ? new Date(
                                selectedEmail.date
                              ).toLocaleString()
                            : ""}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {/* Read/Unread chip */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            selectedEmail.isRead
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {selectedEmail.isRead ? "READ" : "UNREAD"}
                        </span>

                        {/* Priority chip */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityColor(
                            selectedEmail.priority
                          )}`}
                        >
                          Priority:{" "}
                          {selectedEmail.priority
                            ? selectedEmail.priority.toUpperCase()
                            : "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleReply(selectedEmail._id)}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      >
                        <Reply className="h-3.5 w-3.5 mr-1" />
                        Reply
                      </button>
                      <button
                        onClick={() => handleMarkRead(selectedEmail._id)}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      >
                        {selectedEmail.isRead ? (
                          <>
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Mark unread
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            Mark read
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="prose prose-sm max-w-none text-slate-800">
                      <div
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedEmail.body || "<p>No content</p>",
                        }}
                      />
                    </div>

                    {/* Attachments */}
                    {selectedEmail.attachments &&
                      selectedEmail.attachments.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-3">
                          <h3 className="text-xs font-semibold text-slate-500 mb-2">
                            Attachments
                          </h3>
                          <ul className="space-y-1.5">
                            {selectedEmail.attachments.map((att, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-md px-2 py-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="truncate max-w-[180px]">
                                    {att.filename}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {att.size} bytes
                                  </span>
                                </div>
                                <a
                                  href={`/api/attachments/${selectedEmail._id}/${att.filename}`}
                                  download
                                  className="inline-flex items-center text-[11px] text-emerald-600 hover:text-emerald-700"
                                >
                                  <Download className="h-3.5 w-3.5 mr-0.5" />
                                  Download
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
