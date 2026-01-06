import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useUser } from "../store/session";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { apiUrl } from "../utils/api"; // helper to build backend URL

function Notifications() {
  const [token, setToken] = useState(null);
  const { user, fetchWithAuth, fetchUserProfile } = useUser();
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionToken = Cookies.get("session");
    setToken(sessionToken);
  }, []);

  async function markAsRead(id) {
    if (!token) {
      toast.error("No session token. Please log in again.");
      return;
    }

    const data = await fetchWithAuth(
      apiUrl(`/api/v1/notifications/${id}/read`),
      { method: "PATCH" }
    );

    if (data?.success) {
      await fetchUserProfile();
    } else {
      setError(data?.message || "Failed to mark notification as read");
    }
  }

  if (!user || !user.notifications) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="block text-sm font-semibold text-foreground">
          Loading...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col p-8 justify-center w-full">
        <div className="w-full max-w-5xl text-red-500 p-4 bg-red-50 rounded-md">
          <p>{error}</p>
          <p className="mt-2 text-sm">
            This may be due to insufficient permissions. Please check the backend configuration or contact your administrator.
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchUserProfile();
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const unreadNotifications = user.notifications.filter((e) => !e.read);
  const hasUnreadNotifications = unreadNotifications.length > 0;

  return (
    <div>
      <div className="flex flex-col">
        <div className="py-2 px-6 flex flex-row items-center justify-between bg-gray-200 dark:bg-[#0A090C] border-b-[1px]">
          <span className="text-sm font-bold">
            You have {unreadNotifications.length} unread
            notification{unreadNotifications.length !== 1 ? "s" : ""}
          </span>
        </div>

        {hasUnreadNotifications ? (
          unreadNotifications.map((item) => (
            <Link to={`/issue/${item.ticketId}`} key={item._id}>
              <div className="flex flex-row w-full bg-white dark:bg-[#0A090C] dark:hover:bg-green-600 border-b-[1px] p-2 justify-between px-6 hover:bg-gray-100 cursor-pointer">
                <div className="flex flex-row space-x-2 items-center">
                  <span className="text-xs font-semibold">{item.text}</span>
                </div>
                <div className="flex flex-row space-x-3 items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAsRead(item._id);
                    }}
                    className="inline-flex z-10 items-center px-2.5 py-1.5 border font-semibold border-gray-300 shadow-sm text-xs rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    mark as read
                  </button>
                  <span className="text-xs">
                    {moment(item.createdAt).format("DD/MM/yyyy")}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <span className="block text-sm font-semibold text-foreground">
              You have no notifications
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
