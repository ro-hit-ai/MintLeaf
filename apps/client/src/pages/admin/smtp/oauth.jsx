// src/pages/admin/email-queues/oauth.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWithAuth } = useUser();

  async function check() {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      toast.error("Missing OAuth code", {
        toastId: "oauth-missing-code",
        autoClose: 5000,
      });
      navigate("/auth/login");
      return;
    }

    try {
      const response = await fetchWithAuth(`/v1/config/email/oauth/gmail?code=${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`OAuth error: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        toast.success("Gmail OAuth completed successfully");
        navigate("/admin/smtp");
      } else {
        throw new Error(data.error || "OAuth error");
      }
    } catch (error) {
      toast.error(`OAuth error: ${error.message}`, {
        toastId: "oauth-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  }

  useEffect(() => {
    check();
  }, [location, fetchWithAuth]);

  return <div />;
};

export default OAuthCallback;