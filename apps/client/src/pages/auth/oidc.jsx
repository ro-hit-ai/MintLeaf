import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export default function OIDCCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  async function check() {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const state = query.get("state");
    const session_state = query.get("session_state");
    const iss = query.get("iss");

    if (code) {
      try {
        const res = await fetch(
          `/api/v1/auth/oidc/callback?state=${state}&code=${code}&session_state=${session_state}&iss=${iss}`,
          {
            // Adjust to your backend API endpoint
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const sso = await res.json();
        if (!sso.success) {
          toast.error(
            "OIDC authentication failed. Account not found. Please try again or contact your admin.",
            {
              toastId: "oidc-error",
            }
          );
          navigate("/auth/login?error=account_not_found");
        } else {
          setAndRedirect(sso.token, sso.onboarding);
        }
      } catch (error) {
        toast.error(`OIDC authentication failed: ${error.message}`, {
          toastId: "oidc-error",
        });
        navigate("/auth/login?error=account_not_found");
      }
    }
  }

  function setAndRedirect(token, onboarding) {
    Cookies.set("session", token, {
      secure: true,
      sameSite: "strict",
      expires: 6 * 24 * 60 * 60, // 6 days in seconds
    });
    navigate(onboarding ? "/onboarding" : "/");
  }

  useEffect(() => {
    check();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>
  );
}