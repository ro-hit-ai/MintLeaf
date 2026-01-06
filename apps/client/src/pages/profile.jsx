// apps/client/src/pages/profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../shadcn/ui/card.jsx";
import { useUser } from "../store/session.jsx";
import { toast } from "react-toastify";
import { apiUrl } from "../utils/api"; // ✅ centralized API helper

function UserProfile() {
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useUser();
  const [token, setToken] = useState(null);
  const { t, i18n } = useTranslation("peppermint");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setLanguage(user.language || "en");
    }
    setToken(Cookies.get("session"));
  }, [user]);

  function changeLanguage(locale) {
    setLanguage(locale);
    i18n.changeLanguage(locale);
  }

  async function updateProfile() {
    if (!token) {
      setError("No authentication token found");
      toast.error("No authentication token found");
      return null;
    }

    try {
      const res = await fetch(apiUrl("/v1/auth/profile"), {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user?._id,
          name: name || user?.name,
          email: email || user?.email,
          language: language || user?.language,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data?.success) {
        await fetchUserProfile();
        toast.success("Profile updated successfully");
        setError(null);
        return data;
      } else {
        throw new Error(data?.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return null;
    }
  }

  const handleSave = async () => {
    await updateProfile();
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Card>
          <CardContent>
            <div className="mt-6">Loading...</div>
          </CardContent>
        </Card>
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
              updateProfile();
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("profile_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-6 flex flex-col lg:flex-row">
            <div className="flex-grow space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  {t("name")}
                </label>
                <input
                  type="text"
                  name="name"
                  className="text-foreground bg-background flex-grow block w-full rounded-md sm:text-sm border-gray-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  {t("email")}
                </label>
                <input
                  type="email"
                  name="email"
                  className="text-foreground bg-background flex-grow block w-full rounded-md sm:text-sm border-gray-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  {t("language")}
                </label>
                <select
                  id="language"
                  name="language"
                  className="text-foreground bg-background flex-grow block w-full rounded-md sm:text-sm border-gray-300"
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
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
                  <option value="it">Italiano</option>
                  <option value="he">Hebrew</option>
                  <option value="tr">Turkish</option>
                  <option value="hu">Hungarian</option>
                  <option value="th">Thai</option>
                  <option value="zh-CN">Simplified Chinese</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-end">
            <button
              onClick={handleSave}
              type="button"
              className="inline-flex items-center px-4 py-2 border font-semibold border-gray-300 shadow-sm text-xs rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              {t("save_and_reload")}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default UserProfile;
