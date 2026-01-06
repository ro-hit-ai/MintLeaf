// src/pages/admin/email-queues/oauth.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWithAuth } = useUser();

  const check = async () => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const mailboxId = params.get("state");

    if (code && mailboxId) {
      try {
        const response = await fetchWithAuth(`/v1/email-queue/oauth/gmail?code=${code}&mailboxId=${mailboxId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`Failed to complete OAuth: ${response.statusText}`);
        const result = await response.json();
        if (result.success) {
          toast.success("Gmail OAuth completed successfully");
          navigate("/admin/email-queues");
        } else {
          throw new Error(result.error || "Failed to complete OAuth");
        }
      } catch (err) {
        toast.error(`OAuth error: ${err.message}`, {
          toastId: "oauth-error",
          autoClose: 5000,
        });
        navigate("/auth/login");
      }
    } else {
      toast.error("Missing OAuth code or mailbox ID", {
        toastId: "oauth-missing-params",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  useEffect(() => {
    check();
  }, [fetchWithAuth, location]);

  return <div></div>;
};

export default OAuthCallback;
