// src/pages/admin/notifications/index.jsx
import React,{ useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useUser } from "../../../store/session";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();

  async function deleteEmailConfig() {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/v1/config/email", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to delete configuration: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("Email configuration deleted successfully");
        fetchEmailConfig();
      } else {
        throw new Error(data.error || "Failed to delete configuration");
      }
    } catch (error) {
      toast.error(`Error deleting configuration: ${error.message}`, {
        toastId: "delete-config-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
    setLoading(false);
  }

  async function fetchTemplates() {
    try {
      const response = await fetchWithAuth("/v1/ticket/templates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch templates: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        throw new Error(data.error || "Failed to fetch templates");
      }
    } catch (error) {
      toast.error(`Error fetching templates: ${error.message}`, {
        toastId: "fetch-templates-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  }

  async function resetSMTP() {
    try {
      const response = await fetchWithAuth("/v1/config/email", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to reset SMTP: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("SMTP configuration reset successfully");
        fetchEmailConfig();
      } else {
        throw new Error(data.error || "Failed to reset SMTP");
      }
    } catch (error) {
      toast.error(`Error resetting SMTP: ${error.message}`, {
        toastId: "reset-smtp-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  }

  async function fetchEmailConfig() {
    try {
      const response = await fetchWithAuth("/v1/config/email", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch email config: ${response.statusText}`);
      const data = await response.json();
      if (data.success && data.active) {
        setEnabled(data.email.active);
        setConfig(data.email);
        if (data.verification !== true) {
          setError(data.verification);
        } else {
          fetchTemplates();
        }
      } else {
        setEnabled(false);
        setConfig(null);
        setError(null);
      }
    } catch (error) {
      toast.error(`Error fetching email config: ${error.message}`, {
        toastId: "fetch-config-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEmailConfig();
  }, [fetchWithAuth]);

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-6">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0 flex flex-row justify-between">
              <h1 className="text-3xl font-extrabold text-foreground">SMTP Email Settings</h1>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={resetSMTP}
              >
                Reset SMTP
              </button>
            </div>
            <div className="px-4 sm:px-6 md:px-0">
              <div className="sm:flex sm:items-center mt-4">
                <div className="sm:flex-auto">
                  <p className="mt-2 text-sm text-gray-500">
                    Manage your SMTP email settings. These settings will be used to send all outbound emails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!loading ? (
          <div className="px-4 sm:px-6 md:px-0">
            <div className="mb-6">
              {enabled ? (
                <div>
                  {!error ? (
                    <div>
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <AlertTriangle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                SMTP Config Found & Working
                              </h3>
                              <div className="mt-2 text-sm text-green-700">
                                <p>The config you supplied is working as intended.</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={deleteEmailConfig}
                            className="rounded bg-red-500 text-white px-4 py-2 text-sm font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete Settings
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h1 className="text-lg font-semibold">Email Templates</h1>
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="bg-white divide-y divide-gray-200">
                            {templates.map((template) => (
                              <tr key={template.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{template.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{template.subject}</td>
                                <td className="px-6 py-4">{template.html}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => navigate(`/admin/smtp/templates/${template.id}`)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Authentication Error
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{error?.message || "An unknown error occurred."}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={deleteEmailConfig}
                            className="rounded bg-red-500 text-white px-4 py-2 text-sm font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete Settings
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 ml-0.5 flex flex-col">
                        <span className="text-sm font-semibold">Verification Status</span>
                        <span className="text-xs font-semibold">Code: {error?.code || "N/A"}</span>
                        <span className="text-xs font-semibold">Response: {error?.response || "N/A"}</span>
                        <span className="text-xs font-semibold">Response Code: {error?.responseCode || "N/A"}</span>
                        <span className="text-xs font-semibold">Command: {error?.command || "N/A"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-y-4 mt-8 justify-center items-center">
                  {step === 0 && (
                    <div className="w-[350px] rounded-lg border bg-white shadow-sm">
                      <div className="p-6">
                        <h2 className="text-lg font-semibold">Email Provider</h2>
                        <p className="text-sm text-gray-500">
                          Certain providers require different settings.
                        </p>
                        <div className="mt-4">
                          <Label.Root htmlFor="framework" className="block text-sm font-medium text-foreground">
                            Provider
                          </Label.Root>
                          <Select.Root onValueChange={(value) => setProvider(value)}>
                            <Select.Trigger
                              id="framework"
                              className="inline-flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <Select.Value placeholder="Select" />
                              <Select.Icon>
                                <ChevronDownIcon />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content className="bg-white border rounded-md shadow-lg">
                                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white">
                                  <ChevronUpIcon />
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-2">
                                  <Select.Item
                                    value="microsoft"
                                    disabled
                                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                                  >
                                    <Select.ItemText>Microsoft</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item
                                    value="gmail"
                                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                                  >
                                    <Select.ItemText>Google</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item
                                    value="other"
                                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                                  >
                                    <Select.ItemText>Other</Select.ItemText>
                                  </Select.Item>
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white">
                                  <ChevronDownIcon />
                                </Select.ScrollDownButton>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>
                      </div>
                      <div className="flex justify-between p-4 border-t">
                        <button
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={provider === ""}
                          onClick={() => setStep(1)}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 1 && provider === "microsoft" && <MicrosoftSettings />}
                  {step === 1 && provider === "gmail" && <GmailSettings setStep={setStep} />}
                  {step === 1 && provider === "other" && <SMTP setStep={setStep} />}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">Loading...</div>
        )}
      </div>
    </main>
  );
};

function MicrosoftSettings() {
  return <div className="p-4">Microsoft Settings (Not Implemented)</div>;
}

function GmailSettings({ setStep }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    typeof window !== "undefined" ? `${window.location.origin}/admin/smtp/oauth` : ""
  );
  const [user, setUser] = useState("");
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();
  const isEnabled = clientId && clientSecret && user;

  async function submitGmailConfig() {
    try {
      const response = await fetchWithAuth("/v1/config/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: "smtp.gmail.com",
          port: "465",
          clientId,
          clientSecret,
          username: user,
          reply: user,
          serviceType: "gmail",
          redirectUri: redirectUri,
        }),
      });
      if (!response.ok) throw new Error(`Failed to configure Gmail: ${response.statusText}`);
      const data = await response.json();
      if (data.success && data.authorizeUrl) {
        navigate(data.authorizeUrl);
      } else {
        throw new Error(data.error || "Failed to configure Gmail");
      }
    } catch (error) {
      toast.error(`Error configuring Gmail: ${error.message}`, {
        toastId: "gmail-config-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  }

  return (
    <div className="w-[350px] rounded-lg border bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Gmail Settings</h2>
        <p className="text-sm text-gray-500">Configure your Gmail OAuth2 settings.</p>
        <div className="grid w-full items-center gap-4 mt-4">
          <div className="flex flex-col space-y-4">
            <div>
              <Label.Root htmlFor="client_id" className="block text-sm font-medium text-foreground">
                Client ID
              </Label.Root>
              <input
                type="text"
                name="client_id"
                id="client_id"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="client_secret" className="block text-sm font-medium text-foreground">
                Client Secret
              </Label.Root>
              <input
                type="text"
                name="client_secret"
                id="client_secret"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="user_email" className="block text-sm font-medium text-foreground">
                User Email
              </Label.Root>
              <input
                type="email"
                name="user_email"
                id="user_email"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your Email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="redirect_uri" className="block text-sm font-medium text-foreground">
                Redirect URI
              </Label.Root>
              <input
                type="text"
                name="redirect_uri"
                id="redirect_uri"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your Redirect URI"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between p-4 border-t">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => setStep(0)}
        >
          Back
        </button>
        <button
          disabled={!isEnabled}
          onClick={submitGmailConfig}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function SMTP({ setStep }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [reply, setReply] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();
  const isEnabled = host && port && username && password && reply;

  async function submitConfig() {
    try {
      const response = await fetchWithAuth("/v1/config/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host,
          active: true,
          port,
          reply,
          username,
          password,
        }),
      });
      if (!response.ok) throw new Error(`Failed to save configuration: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("SMTP configuration saved successfully");
        window.location.reload(); // Mimics router.reload()
      } else {
        throw new Error(data.error || "Failed to save configuration");
      }
    } catch (error) {
      toast.error(`Error saving configuration: ${error.message}`, {
        toastId: "smtp-config-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  }

  return (
    <div className="w-[350px] rounded-lg border bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold">SMTP Settings</h2>
        <p className="text-sm text-gray-500"></p>
        <div className="grid w-full items-center gap-4 mt-4">
          <div className="flex flex-col space-y-4">
            <div>
              <Label.Root htmlFor="company_website" className="block text-sm font-medium text-foreground">
                SMTP Host
              </Label.Root>
              <input
                type="text"
                name="company_website"
                id="company_website"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="smtp.gmail.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </Label.Root>
              <input
                type="email"
                name="username"
                id="username"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </Label.Root>
              <input
                type="password"
                name="password"
                id="password"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="port" className="block text-sm font-medium text-foreground">
                Port
              </Label.Root>
              <input
                type="number"
                name="port"
                id="port"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="465"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <div>
              <Label.Root htmlFor="reply" className="block text-sm font-medium text-foreground">
                Reply Address
              </Label.Root>
              <input
                type="email"
                name="reply"
                id="reply"
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
                placeholder="reply@example.com"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between p-4 border-t">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => setStep(0)}
        >
          Back
        </button>
        <button
          disabled={!isEnabled}
          onClick={submitConfig}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default Notifications;