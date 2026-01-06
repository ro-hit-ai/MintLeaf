import React,{ useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BellRing, Check } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

// Mock cn utility (replace with classnames or direct Tailwind classes)
const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Authentication({ token }) {
  const [isLoading, setIsLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [issuer, setIssuer] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [providerType, setProviderType] = useState("");
  const [jwtSecret, setJwtSecret] = useState("");
  const navigate = useNavigate();

  async function postData() {
    if (!token) {
      toast.error("Authentication token is missing", { toastId: "token-missing" });
      navigate("/auth/login");
      return;
    }

    const endpoint =
      providerType === "oidc"
        ? "/api/v1/config/authentication/oidc/update"
        : "/api/v1/config/auth/oauth";

    const payload =
      providerType === "oidc"
        ? { issuer, redirectUri, clientId }
        : { name: provider, redirectUri, clientId, clientSecret };

    try {
      const response = await fetch(endpoint, {
        // Adjust to your backend API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Authentication settings saved successfully");
        window.location.reload(); // Mimics router.reload()
      } else {
        toast.error(`Error saving settings: ${data.error || "Unknown error"}`, {
          toastId: "post-data-error",
        });
      }
    } catch (error) {
      toast.error(`Error saving settings: ${error.message}`, {
        toastId: "post-data-error",
      });
    }
  }

  async function deleteData() {
    if (!token) {
      toast.error("Authentication token is missing", { toastId: "token-missing" });
      navigate("/auth/login");
      return;
    }

    try {
      const response = await fetch(`/api/v1/config/authentication`, {
        // Adjust to your backend API endpoint
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Authentication settings deleted successfully");
        window.location.reload(); // Mimics router.reload()
      } else {
        toast.error(`Error deleting settings: ${data.error || "Unknown error"}`, {
          toastId: "delete-data-error",
        });
      }
    } catch (error) {
      toast.error(`Error deleting settings: ${error.message}`, {
        toastId: "delete-data-error",
      });
    }
  }

  async function checkState() {
    if (!token) {
      toast.error("Authentication token is missing", { toastId: "token-missing" });
      navigate("/auth/login");
      return;
    }

    try {
      const response = await fetch(`/api/v1/config/authentication/check`, {
        // Adjust to your backend API endpoint
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.sso) {
        setEnabled(data.sso);
        setProvider(data.provider || "");
      } else {
        setEnabled(false);
        setProvider("");
      }
    } catch (error) {
      toast.error(`Error checking authentication state: ${error.message}`, {
        toastId: "check-state-error",
      });
    }
    setIsLoading(false);
  }

  async function setUri() {
    if (providerType === "oidc") {
      setRedirectUri(`${window.location.origin}/auth/oidc`);
    } else {
      setRedirectUri(`${window.location.origin}/auth/oauth`);
    }
  }

  useEffect(() => {
    checkState();
  }, [token]);

  useEffect(() => {
    setUri();
  }, [providerType]);

  const isEnabled =
    providerType === "oidc"
      ? issuer && clientId && redirectUri
      : clientId && clientSecret && redirectUri;

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-foreground">Authentication Settings</h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0 my-4">
            {isLoading ? (
              <div className="p-4">Loading...</div>
            ) : enabled ? (
              <div className="flex justify-center mt-16">
                <div className={cn("w-[380px] rounded-lg border bg-white shadow-sm")}>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold capitalize">{provider} Settings</h2>
                    <p className="text-sm text-gray-500">Manage your {provider} config</p>
                  </div>
                  <div className="p-4 border-t">
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <button className="w-full bg-red-500 text-white px-4 py-2 rounded-md flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
                          <Check className="mr-2 h-4 w-4" /> Delete
                        </button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                        <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
                          <AlertDialog.Title className="text-lg font-semibold">
                            Are you absolutely sure?
                          </AlertDialog.Title>
                          <AlertDialog.Description className="text-sm text-gray-500">
                            This action cannot be undone. This will permanently delete your
                            authentication settings and remove your data from our servers.
                          </AlertDialog.Description>
                          <div className="mt-4 flex justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                Cancel
                              </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button
                                onClick={deleteData}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                Continue
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <select
                    id="providerType"
                    name="providerType"
                    onChange={(e) => setProviderType(e.target.value)}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={providerType || ""}
                  >
                    <option value="" disabled>
                      Please select a provider type
                    </option>
                    <option value="oidc">OIDC</option>
                    <option value="oauth" disabled>
                      OAuth
                    </option>
                    <option value="saml" disabled>
                      SAML - coming soon
                    </option>
                  </select>
                </div>
                {providerType && (
                  <div className="space-y-4 mt-4">
                    <h2 className="text-base font-semibold leading-7 text-gray-900">
                      {providerType.toUpperCase()} Settings
                    </h2>
                    {providerType === "oidc" && (
                      <>
                        <div>
                          <label
                            htmlFor="issuer"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Issuer
                          </label>
                          <input
                            type="text"
                            id="issuer"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            onChange={(e) => setIssuer(e.target.value)}
                            value={issuer}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="clientId"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Client ID
                          </label>
                          <input
                            type="text"
                            id="clientId"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            onChange={(e) => setClientId(e.target.value)}
                            value={clientId}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="redirectUri"
                            className="block text-sm font-medium leading-6 text-gray-900"
                          >
                            Redirect URI
                          </label>
                          <input
                            type="text"
                            id="redirectUri"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            onChange={(e) => setRedirectUri(e.target.value)}
                            value={redirectUri}
                          />
                        </div>
                      </>
                    )}
                    {providerType === "oauth" && (
                      <>
                        <div className="space-y-4 mt-2">
                          <div>
                            <label
                              htmlFor="clientId"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              Client ID
                            </label>
                            <input
                              type="text"
                              id="clientId"
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              onChange={(e) => setClientId(e.target.value)}
                              value={clientId}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="clientSecret"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              Client Secret
                            </label>
                            <input
                              type="text"
                              id="clientSecret"
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              onChange={(e) => setClientSecret(e.target.value)}
                              value={clientSecret}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="redirectUri"
                              className="block text-sm font-medium leading-6 text-gray-900"
                            >
                              Redirect URI
                            </label>
                            <input
                              type="text"
                              id="redirectUri"
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              onChange={(e) => setRedirectUri(e.target.value)}
                              value={redirectUri}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="mt-6 flex items-center justify-end gap-x-6">
                      <button
                        type="submit"
                        onClick={postData}
                        disabled={!isEnabled}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}