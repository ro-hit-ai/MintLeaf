// apps/client/src/pages/onboarding.jsx
import React, { useState, useRef } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useUser} from "../store/session.jsx";
import { apiUrl } from "../utils/api";  // 👈 import helper

export default function Onboarding() {
  const { user, loading, fetchUserProfile } = useUser();

  const [status, setStatus] = useState("idle");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");

  const isSubmitting = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading" || isSubmitting.current) return;

    isSubmitting.current = true;
    setStatus("loading");

    try {
      const token = Cookies.get("session");
      if (!token) throw new Error("No session found");

const res = await fetch(apiUrl("/v1/auth/onboarding"), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ name, language }),
});


      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Onboarding failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Onboarding complete!");
        await fetchUserProfile(true); // refresh user in store
      } else {
        toast.error(data.message || "Onboarding failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatus("idle");
      isSubmitting.current = false;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Welcome, {user.email}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let’s finish setting up your account
        </p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-4 shadow rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-900"
              >
                Preferred Language
              </label>
              <select
                id="language"
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !name}
              className="w-full flex justify-center py-2 px-4 bg-green-600 text-white rounded-md"
            >
              {status === "loading" ? "Submitting..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
