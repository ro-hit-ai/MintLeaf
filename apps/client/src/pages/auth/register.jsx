import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function RegisterExternal() {
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("idle");

  async function postData() {
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match", {
        toastId: "password-mismatch",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Invalid email address", {
        toastId: "invalid-email",
      });
      return;
    }

    if (!name) {
      toast.error("Name is required", {
        toastId: "missing-name",
      });
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/v1/auth/user/register/external", {
        // Adjust to your backend API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          passwordConfirm,
          language,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus("idle");
        toast.success("Account created successfully", {
          toastId: "register-success",
        });
        navigate("/auth/login");
      } else {
        setStatus("idle");
        toast.error(data.message || "Error creating account", {
          toastId: "register-error",
        });
      }
    } catch (error) {
      setStatus("idle");
      toast.error(`Error: ${error.message}`, {
        toastId: "register-error",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
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
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <select
                    id="language"
                    name="language"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="se">Swedish</option>
                    <option value="es">Spanish</option>
                    <option value="no">Norwegian</option>
                    <option value="fr">French</option>
                    <option value="tl">Tagalog</option>
                    <option value="da">Danish</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italian</option>
                    <option value="he">Hebrew</option>
                    <option value="tr">Turkish</option>
                    <option value="hu">Hungarian</option>
                    <option value="th">Thai (ภาษาไทย)</option>
                    <option value="zh-CN">Simplified Chinese (简体中文)</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  onClick={postData}
                  disabled={!name || !email || !password || !passwordConfirm}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Account
                </button>

                <p className="mt-2 text-xs text-gray-600 text-center">
                  Note this form is for external users only
                </p>
              </div>
            </div>
          </div>
        )}

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