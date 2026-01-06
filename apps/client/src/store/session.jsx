// src/store/session.jsx
import React, { useState, useEffect, useCallback, useContext, createContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { apiUrl } from "../utils/api";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const refreshInProgress = useRef(false);

  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------------------
  const logout = useCallback(
    (force = false) => {
      Cookies.remove("session", { path: "/" });
      localStorage.removeItem("user");
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      if (force || location.pathname !== "/auth/login") {
        navigate("/auth/login", { replace: true });
      }
    },
    [navigate, location]
  );

  // -----------------------------------------------------------------
  // HANDLE PROFILE RESPONSE
  // -----------------------------------------------------------------
  const handleProfileResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        logout(true);
        return null;
      }
      throw new Error(`Profile fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.user) {
      const normalizedUser = {
        ...data.user,
        _id: data.user.id || data.user._id, // ← CRITICAL
        id: data.user.id,
        isAdmin: data.user.isAdmin === true,
        isAgent: data.user.isAgent === true,
        imap_enabled: data.user.imap_enabled === true,
      };

      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setStatus("authenticated");

      if (data.token) {
        Cookies.set("session", data.token, { sameSite: "lax" });
      }

      console.log("SESSION AUTHENTICATED", normalizedUser);
      return normalizedUser;
    } else {
      throw new Error(data.message || "Invalid profile data");
    }
  };

  // -----------------------------------------------------------------
  // REFRESH SESSION
  // -----------------------------------------------------------------
  const refreshSession = useCallback(async () => {
    if (refreshInProgress.current) return null;
    refreshInProgress.current = true;

    const token = Cookies.get("session");
    if (!token) {
      setStatus("unauthenticated");
      refreshInProgress.current = false;
      return null;
    }

    try {
      setStatus("loading");
      const response = await fetch(apiUrl("/v1/auth/profile"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await handleProfileResponse(response);
      refreshInProgress.current = false;
      return result;
    } catch (err) {
      console.error("refreshSession failed:", err);
      logout(true);
      refreshInProgress.current = false;
      return null;
    }
  }, [logout]);

  // -----------------------------------------------------------------
  // SINGLE useEffect: INIT SESSION ONCE
  // -----------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const token = Cookies.get("session");

      if (!token) {
        if (isMounted) {
          setStatus("unauthenticated");
          navigate("/auth/login", { replace: true });
        }
        return;
      }

      try {
        setStatus("loading");
        const response = await fetch(apiUrl("/v1/auth/profile"), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!isMounted) return;

        if (!response.ok) {
          Cookies.remove("session", { path: "/" });
          localStorage.removeItem("user");
          setStatus("unauthenticated");
          navigate("/auth/login", { replace: true });
          return;
        }

        await handleProfileResponse(response);
      } catch (err) {
        if (isMounted) {
          console.error("Session init failed:", err);
          Cookies.remove("session", { path: "/" });
          localStorage.removeItem("user");
          setStatus("unauthenticated");
          navigate("/auth/login", { replace: true });
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]); // ← ONLY ONCE

  // -----------------------------------------------------------------
  // FETCH WITH AUTH
  // -----------------------------------------------------------------
  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      let token = Cookies.get("session");
      if (!token) throw new Error("No session");

      const doFetch = async (authToken) => {
        return fetch(apiUrl(url), {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            ...(options.headers || {}),
          },
          credentials: "include",
        });
      };

      let res = await doFetch(token);

      if (res.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Session expired");
        token = Cookies.get("session");
        res = await doFetch(token);
      }

      return res;
    },
    [refreshSession]
  );

  // -----------------------------------------------------------------
  // CONTEXT VALUE
  // -----------------------------------------------------------------
  const loading = status === "loading";
  const contextValue = {
    user,
    setUser,
    status,
    loading,
    error,
    isAdmin: user?.isAdmin || false,
    isAgent: user?.isAgent || false,
    imap_enabled: loading ? false : !!user?.imap_enabled,
    refreshSession,
    logout,
    fetchWithAuth,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// -----------------------------------------------------------------
// useUser: BLOCK UNTIL READY
// -----------------------------------------------------------------
export const useUser = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useUser must be used within SessionProvider");

  if (ctx.loading) {
    return {
      user: null,
      loading: true,
      error: null,
      isAdmin: false,
      isAgent: false,
      imap_enabled: false,
      fetchWithAuth: () => Promise.reject(new Error("Session loading")),
      refreshSession: () => Promise.reject(new Error("Session loading")),
      logout: () => {},
    };
  }

  return ctx;
};