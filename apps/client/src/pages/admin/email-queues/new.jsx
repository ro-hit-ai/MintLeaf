// src/pages/admin/email-queues/new.jsx
import React,{ useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useUser } from "../../../store/session";

const NewEmailQueue = () => {
  const [provider, setProvider] = useState("");
  const [step, setStep] = useState(0);
  const { fetchWithAuth } = useUser();

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-6">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-foreground">
                New Email Queue
              </h1>
            </div>
            <div className="px-4 sm:px-6 md:px-0">
              <div className="sm:flex sm:items-center mt-4">
                <div className="sm:flex-auto">
                  <p className="mt-2 text-sm text-gray-500">
                    Configure a new email queue for sending outbound emails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-4 mt-8 justify-center items-center">
          {step === 0 && (
            <div className="w-[480px] rounded-lg border bg-white shadow-sm">
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
          {step === 1 && provider === "microsoft" && <MicrosoftSettings setStep={setStep} />}
          {step === 1 && provider === "gmail" && <GmailSettings setStep={setStep} fetchWithAuth={fetchWithAuth} />}
          {step === 1 && provider === "other" && <PasswordProvider setStep={setStep} fetchWithAuth={fetchWithAuth} />}
        </div>
      </div>
    </main>
  );
};

const MicrosoftSettings = ({ setStep }) => {
  return (
    <div className="w-[480px] rounded-lg border bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Microsoft Settings</h2>
        <p className="text-sm text-gray-500">Configure your Microsoft OAuth2 settings.</p>
        <p className="text-sm text-gray-500">Not implemented yet.</p>
      </div>
      <div className="flex justify-between p-4 border-t">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => setStep(0)}
        >
          Back
        </button>
      </div>
    </div>
  );
};

const PasswordProvider = ({ setStep, fetchWithAuth }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hostname, setHostname] = useState("");
  const [tls, setTls] = useState("");
  const isEnabled = name && username && password && hostname && tls;

  const newQueue = async () => {
    try {
      const response = await fetchWithAuth("/v1/email-queue/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          password,
          hostname,
          tls: tls === "true",
          serviceType: "other",
        }),
      });
      if (!response.ok) throw new Error(`Failed to create queue: ${response.statusText}`);
      const result = await response.json();
      if (result.success !== false) {
        toast.success("Email queue created successfully");
        navigate("/admin/email-queues");
      } else {
        throw new Error(result.error || "Failed to create queue");
      }
    } catch (err) {
      toast.error(`Error creating queue: ${err.message}`, {
        toastId: "create-queue-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  return (
    <div className="w-[480px] rounded-lg border bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Email Queue Settings</h2>
        <p className="text-sm text-gray-500">Configure your email queue settings.</p>
        <div className="grid w-full items-center gap-4 mt-4">
          <div className="flex flex-col space-y-4">
            <div>
              <Label.Root htmlFor="name" className="block text-sm font-medium text-foreground">
                Queue Name
              </Label.Root>
              <input
                id="name"
                placeholder="Enter the queue name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <Label.Root htmlFor="username" className="block text-sm font-medium text-foreground">
                Username (email)
              </Label.Root>
              <input
                id="username"
                type="email"
                placeholder="Enter the email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <Label.Root htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </Label.Root>
              <input
                id="password"
                type="password"
                placeholder="Enter the password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <Label.Root htmlFor="hostname" className="block text-sm font-medium text-foreground">
                Hostname
              </Label.Root>
              <input
                id="hostname"
                placeholder="Enter the hostname"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <Label.Root htmlFor="tls" className="block text-sm font-medium text-foreground">
                TLS
              </Label.Root>
              <Select.Root onValueChange={(value) => setTls(value)}>
                <Select.Trigger
                  id="tls"
                  className="inline-flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Select.Value placeholder="Select TLS setting" />
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
                        value="true"
                        className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        <Select.ItemText>True</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="false"
                        className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        <Select.ItemText>False</Select.ItemText>
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
          onClick={newQueue}
          disabled={!isEnabled}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

const GmailSettings = ({ setStep, fetchWithAuth }) => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    typeof window !== "undefined" ? `${window.location.origin}/admin/email-queues/oauth` : ""
  );
  const [user, setUser] = useState("");
  const isEnabled = clientId && clientSecret && user;

  const submitGmailConfig = async () => {
    try {
      const response = await fetchWithAuth("/v1/email-queue/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user,
          hostname: "imap.gmail.com",
          port: "993",
          clientId,
          clientSecret,
          username: user,
          reply: user,
          serviceType: "gmail",
          redirectUri,
        }),
      });
      if (!response.ok) throw new Error(`Failed to configure Gmail: ${response.statusText}`);
      const result = await response.json();
      if (result.success && result.authorizeUrl) {
        navigate(result.authorizeUrl);
      } else {
        throw new Error(result.error || "Failed to configure Gmail");
      }
    } catch (err) {
      toast.error(`Error configuring Gmail: ${err.message}`, {
        toastId: "gmail-config-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  return (
    <div className="w-[480px] rounded-lg border bg-white shadow-sm">
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
};

export default NewEmailQueue;
