import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  async function check() {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");

    if (code) {
      try {
        const res = await fetch(`/api/v1/auth/oauth/callback?code=${code}`, {
          // Adjust to your backend API endpoint
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const sso = await res.json();
        if (!sso.success) {
          toast.error(
            "OAuth authentication failed. Account not found. Please try again or contact your admin.",
            {
              toastId: "oauth-error",
            }
          );
          navigate("/auth/login?error=account_not_found");
        } else {
          setAndRedirect(sso.token);
        }
      } catch (error) {
        toast.error(`OAuth authentication failed: ${error.message}`, {
          toastId: "oauth-error",
        });
        navigate("/auth/login?error=account_not_found");
      }
    }
  }

  function setAndRedirect(token) {
    Cookies.set("session", token, { secure: true, sameSite: "strict", expires: 6 * 24 * 60 * 60 });
    navigate("/onboarding");
  }

  useEffect(() => {
    check();
  }, [location]);

  return <div>Loading...</div>;
}
