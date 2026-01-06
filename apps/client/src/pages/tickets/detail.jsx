// src/pages/tickets/detail.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, Send, ArrowLeft, Copy, RefreshCw, Loader2, Mail, User, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../store/session";
import { useSocket } from "../../store/socket";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchWithAuth, user } = useUser();
  const socket = useSocket();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  
  const chatRef = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      setHasError(false);
      console.log("📡 Fetching ticket:", id);
      
      const response = await fetchWithAuth(`/v1/ticket/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch ticket: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("✅ Ticket API Response:", {
        success: result.success,
        ticketId: result.ticket?._id,
        ticketNumber: result.ticket?.number,
        hasTicket: !!result.ticket,
        commentsCount: result.comments?.length || 0,
        hasTimeTracking: !!result.timeTracking
      });
      
      if (result.success && result.ticket) {
        setTicket(result.ticket);
        
        // Sort comments by date to ensure proper order
        const sortedComments = (result.comments || []).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // Log comments summary
        console.log("📝 Comments loaded:", sortedComments.length);
        if (sortedComments.length > 0) {
          console.log("📋 Comments summary:");
          sortedComments.forEach((comment, i) => {
            console.log(`   ${i + 1}. ID: ${comment._id?.substring(0, 8)}...`);
            console.log(`      Text: ${comment.text?.substring(0, 60)}...`);
            console.log(`      User: ${comment.userId ? (typeof comment.userId === 'object' ? comment.userId.name : comment.userId) : 'No user'}`);
            console.log(`      Reply: ${comment.reply}, ReplyEmail: ${comment.replyEmail}`);
            console.log(`      FromAgent: ${comment.fromAgent}, Public: ${comment.public}`);
            console.log(`      Date: ${new Date(comment.createdAt).toLocaleString()}`);
            console.log(`   ---`);
          });
        }
        
        setComments(sortedComments);
      } else {
        throw new Error(result.message || "Failed to load ticket data");
      }
    } catch (err) {
      console.error("❌ Fetch Ticket Error:", err);
      setHasError(true);
      toast.error(`Error loading ticket: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, id]);

  // Initial fetch
  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Socket integration for real-time comments
  useEffect(() => {
    if (!socket || !id) {
      console.log("❌ Socket not available or no ticket ID");
      return;
    }

    console.log("🔌 Setting up socket listeners for ticket:", id);

    // Join ticket room - Use hyphen to match backend
    socket.emit("join-ticket", id);
    console.log("🎯 Emitted join-ticket for:", id);

    const handleNewComment = (comment) => {
      console.log("📨 New comment via socket:", {
        id: comment._id?.substring(0, 8),
        text: comment.text?.substring(0, 60),
        userId: comment.userId,
        userObj: typeof comment.userId === 'object' ? comment.userId : null,
        reply: comment.reply,
        replyEmail: comment.replyEmail,
        fromAgent: comment.fromAgent,
        createdAt: comment.createdAt
      });

      setComments(prev => {
        // Check if comment already exists
        const exists = prev.some(c => c._id === comment._id);
        if (exists) {
          console.log("⚠️ Comment already exists:", comment._id?.substring(0, 8));
          return prev;
        }
        
        console.log("➕ Adding new comment to state:", comment._id?.substring(0, 8));
        
        // Add new comment and sort by date
        const newComments = [...prev, comment].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        return newComments;
      });
    };

    const handleTicketUpdate = (updatedTicket) => {
      console.log("📝 Ticket update via socket:", {
        id: updatedTicket._id,
        status: updatedTicket.isComplete ? "Closed" : "Open",
        assignedTo: updatedTicket.assignedTo?.name
      });
      
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    };

    const handleTicketStatus = (statusTicket) => {
      console.log("🔄 Ticket status update via socket:", {
        id: statusTicket._id,
        isComplete: statusTicket.isComplete
      });
      
      if (statusTicket._id === id) {
        setTicket(statusTicket);
        toast.info(`Ticket ${statusTicket.isComplete ? "closed" : "reopened"}`);
      }
    };

    // Listen for socket events
    socket.on("ticket:comment", handleNewComment);
    socket.on("ticket:update", handleTicketUpdate);
    socket.on("ticket:status", handleTicketStatus);
    
    // Room join acknowledgement
    socket.on("ticket:joined", (data) => {
      console.log("✅ Successfully joined ticket room:", data);
    });

    // Debug socket connection
    const testSocket = () => {
      if (socket.connected) {
        console.log("🧪 Testing socket connection...");
        socket.emit("ping", { 
          ticketId: id,
          userId: user?._id,
          timestamp: Date.now() 
        });
      }
    };

    // Test after a short delay
    const testTimeout = setTimeout(testSocket, 1000);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket listeners for ticket:", id);
      clearTimeout(testTimeout);
      socket.off("ticket:comment", handleNewComment);
      socket.off("ticket:update", handleTicketUpdate);
      socket.off("ticket:status", handleTicketStatus);
      socket.off("ticket:joined");
      socket.emit("leave-ticket", id);
    };
  }, [socket, id, user?._id]);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [comments]);

  // Remove duplicate comments
  useEffect(() => {
    if (comments.length < 2) return;
    
    const uniqueComments = [];
    const seenIds = new Set();
    let duplicates = 0;
    
    for (const comment of comments) {
      if (!comment._id) continue;
      
      if (seenIds.has(comment._id)) {
        duplicates++;
        console.log("🔄 Found duplicate comment:", comment._id?.substring(0, 8));
        continue;
      }
      
      seenIds.add(comment._id);
      uniqueComments.push(comment);
    }
    
    if (duplicates > 0 && uniqueComments.length !== comments.length) {
      console.log(`🧹 Removed ${duplicates} duplicate comments`);
      setComments(uniqueComments);
    }
  }, [comments]);

  const handleStatusUpdate = async () => {
    if (updating || !ticket) return;
    setUpdating(true);

    try {
      console.log("🔄 Updating status for ticket:", ticket._id);
      const res = await fetchWithAuth("/v1/ticket/status/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ticket._id,
          status: !ticket.isComplete,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log("✅ Status update response:", {
        success: result.success,
        newStatus: result.ticket?.isComplete ? "Closed" : "Open",
        ticketId: result.ticket?._id
      });
      
      if (result.success) {
        setTicket(result.ticket);
        toast.success(`Ticket marked as ${result.ticket.isComplete ? "Closed" : "Open"}`);
      } else {
        throw new Error(result.message || "Status update failed");
      }
    } catch (err) {
      console.error("❌ Status Update Error:", err);
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning("Please enter a comment");
      return;
    }
    
    const commentText = newComment.trim();
    
    // Optimistic update - create temporary comment
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text: commentText,
      userId: { 
        _id: user._id, 
        name: user.name || user.email,
        email: user.email,
        avatar: user.avatar 
      },
      createdAt: new Date().toISOString(),
      reply: false,
      public: true,
      fromAgent: true,
      isOptimistic: true
    };

    console.log("➕ Adding optimistic comment:", {
      tempId,
      textLength: commentText.length,
      user: user.email
    });

    // Add optimistic comment
    setComments(prev => [...prev, optimisticComment]);
    setNewComment("");
    setPostingComment(true);

    try {
      console.log("📤 Sending comment to API...");
      const response = await fetchWithAuth("/v1/ticket/comment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: commentText, 
          id: id, 
          public: true 
        }),
      });

      console.log("📥 Comment API Response:", {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Comment API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Comment API Success:", {
        success: result.success,
        hasComment: !!result.comment,
        commentId: result.comment?._id,
        commentText: result.comment?.text?.substring(0, 50)
      });
      
      if (result.success && result.comment) {
        // Remove optimistic comment (socket will add the real one)
        setComments(prev => prev.filter(c => c._id !== tempId));
        toast.success("Reply sent & customer notified");
      } else {
        throw new Error(result.message || "Failed to add comment");
      }
    } catch (err) {
      console.error("❌ Add Comment Error:", err);
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c._id !== tempId));
      setNewComment(commentText); // Restore the text
      toast.error(`Error: ${err.message}`);
    } finally {
      setPostingComment(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleRefresh = () => {
    console.log("🔃 Manually refreshing ticket...");
    fetchTicket();
    toast.info("Refreshing ticket...");
  };

  // Enhanced function to detect email replies
  const isEmailReply = (comment) => {
    // If it's explicitly a reply from email
    if (comment.reply === true && comment.replyEmail) {
      return true;
    }
    
    // If it has fromAgent flag, it's from an agent
    if (comment.fromAgent === true) {
      return false;
    }
    
    // If it has no userId but has text (likely email)
    if (!comment.userId && comment.text && comment._id && !comment._id.startsWith('temp-')) {
      return true;
    }
    
    // If userId is a string (not populated), could be email
    if (typeof comment.userId === 'string' && comment.replyEmail) {
      return true;
    }
    
    // Default: not an email reply
    return false;
  };

  // Get the sender email for email replies
  const getEmailSender = (comment) => {
    if (comment.replyEmail) return comment.replyEmail;
    if (comment.email) return comment.email;
    return ticket?.email || "Customer";
  };

  // Get display name for comment
  const getSenderName = (comment) => {
    if (isEmailReply(comment)) {
      const email = getEmailSender(comment);
      return email?.split('@')[0] || "Customer";
    }
    
    if (comment.userId) {
      if (typeof comment.userId === 'object') {
        return comment.userId.name || comment.userId.email || "Agent";
      }
      return "Agent";
    }
    
    if (comment.isOptimistic) {
      return user.name || user.email || "You";
    }
    
    return "System";
  };

  // Get role badge for comment
  const getCommentRole = (comment) => {
    if (comment.isOptimistic) {
      return "You (Sending...)";
    }
    
    if (isEmailReply(comment)) {
      return "Customer (Email)";
    }
    
    if (comment.userId) {
      if (typeof comment.userId === 'object' && comment.userId._id === user?._id) {
        return "You (Agent)";
      }
      return "Agent";
    }
    
    return "System";
  };

  // Get avatar background color
  const getAvatarColor = (comment) => {
    if (comment.isOptimistic) return "bg-gray-100 text-gray-800";
    if (isEmailReply(comment)) return "bg-purple-100 text-purple-800";
    if (comment.userId?._id === user?._id) return "bg-green-100 text-green-800";
    if (comment.userId) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get message background color
  const getMessageColor = (comment) => {
    if (comment.isOptimistic) return "bg-gray-50 border-l-4 border-gray-300 opacity-80";
    if (isEmailReply(comment)) return "bg-purple-50 border-l-4 border-purple-300";
    if (comment.userId?._id === user?._id) return "bg-green-50 border-l-4 border-green-300";
    if (comment.userId) return "bg-blue-50 border-l-4 border-blue-300";
    return "bg-gray-50 border-l-4 border-gray-300";
  };

  // Get initials for avatar
  const getInitials = (comment) => {
    if (comment.isOptimistic) {
      return user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "Y";
    }
    
    if (isEmailReply(comment)) {
      const email = getEmailSender(comment);
      return email?.[0]?.toUpperCase() || "C";
    }
    
    if (comment.userId) {
      if (typeof comment.userId === 'object') {
        return comment.userId.name?.[0]?.toUpperCase() || 
               comment.userId.email?.[0]?.toUpperCase() || 
               "A";
      }
      return "A";
    }
    
    return "S";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (hasError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="text-red-500 text-lg mb-2">Failed to load ticket</div>
        <p className="text-gray-600 mb-4 text-center">
          The ticket could not be found or you don't have permission to view it.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
          <button
            onClick={fetchTicket}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </button>
          <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
            #{ticket.number}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ticket Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
            {ticket.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              ticket.isComplete 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            }`}>
              {ticket.isComplete ? "Closed" : "Open"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              ticket.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
              ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {ticket.priority?.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Assigned To:</span>
            <span className="text-gray-900">{ticket.assignedTo?.name || "Unassigned"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Customer Email:</span>
            <span className="text-gray-900 truncate">{ticket.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Created:</span>
            <span className="text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Client:</span>
            <span className="text-gray-900">{ticket.client?.name || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Description
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.detail}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleStatusUpdate}
          disabled={updating}
          className={`px-4 py-2 rounded-md text-white flex items-center transition-colors ${
            ticket.isComplete
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-green-600 hover:bg-green-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {ticket.isComplete ? "Reopen Ticket" : "Complete Ticket"}
            </>
          )}
        </button>
        
        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
          {ticket.isComplete && " (Closed)"}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Conversation
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Customer email replies appear with purple background. Your messages appear in green.
          </p>
        </div>
        
        <div
          ref={chatRef}
          className="h-[500px] overflow-y-auto p-4 sm:p-6 space-y-6"
        >
          {/* Original Ticket Description as first comment */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-800">
                  {ticket.email?.[0]?.toUpperCase() || "C"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-sm text-gray-900">
                  {ticket.email?.split('@')[0] || "Customer"}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Ticket Creator (Email)
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.detail}</p>
              </div>
            </div>
          </div>
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet.</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isEmail = isEmailReply(comment);
              const isOptimistic = comment.isOptimistic;
              const senderName = getSenderName(comment);
              const role = getCommentRole(comment);
              const avatarClass = getAvatarColor(comment);
              const messageClass = getMessageColor(comment);
              const initials = getInitials(comment);
              const commentKey = `${comment._id}-${comment.createdAt}`;

              return (
                <div key={commentKey} className="flex gap-3 animate-fadeIn">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarClass}`}>
                      <span className="text-sm font-medium">
                        {initials}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {senderName}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                        isOptimistic
                          ? "bg-gray-100 text-gray-700"
                          : isEmail 
                            ? "bg-purple-100 text-purple-700" 
                            : comment.userId?._id === user?._id 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                      }`}>
                        {isOptimistic ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isEmail ? (
                          <Mail className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`mt-2 p-4 rounded-r-lg ${messageClass}`}>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                        {isOptimistic && (
                          <span className="inline-block ml-2">
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Add Comment Form */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <div className="text-sm text-gray-600">
              Your reply will be emailed to: <strong className="text-indigo-700 font-semibold">{ticket.email}</strong>
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your reply... (Customer will receive this via email)"
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows="4"
            disabled={postingComment || ticket.isComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!postingComment && !ticket.isComplete) {
                  handleAddComment();
                }
              }
            }}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Shift + Enter for new line</span>
              {ticket.isComplete && (
                <span className="text-amber-600 font-medium">
                  (Ticket is closed - cannot add new comments)
                </span>
              )}
            </div>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || postingComment || ticket.isComplete}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
            >
              {postingComment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;