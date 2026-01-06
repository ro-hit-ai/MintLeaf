import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export default function PasswordResetConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("code");

  async function sendCode() {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (!code || !token) {
      toast.error("Code and token are required", {
        toastId: "code-missing",
      });
      return;
    }

    try {
      const res = await fetch(`/api/v1/auth/password-reset/code`, {
        // Adjust to your backend API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, uuid: token }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("A password reset email is on its way.", {
          toastId: "code-success",
        });
        setView("password");
      } else {
        toast.error(
          data.message ||
            "There was an error with this request, please try again. If this issue persists, please contact support via Discord.",
          {
            toastId: "code-error",
          }
        );
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        toastId: "code-error",
      });
    }
  }

  async function updatePassword() {
    if (password.length < 1) {
      toast.error("Password cannot be empty", {
        toastId: "password-empty",
      });
      return;
    }

    try {
      const res = await fetch(`/api/v1/auth/password-reset/password`, {
        // Adjust to your backend API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated successfully", {
          toastId: "password-success",
        });
        navigate("/auth/login");
      } else {
        toast.error(
          data.message ||
            "There was an error with this request, please try again. If this issue persists, please contact support via Discord.",
          {
            toastId: "password-error",
          }
        );
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        toastId: "password-error",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {view === "code" ? (
              <>
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      autoComplete="off"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    onClick={sendCode}
                    disabled={!code}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Check Code
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    onClick={updatePassword}
                    disabled={!password}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Change Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 text-center flex flex-col space-y-2">
          <span className="font-bold">Built with 💚 by Peppermint Labs</span>
          <a
            href="https://docs.peppermint.sh/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}