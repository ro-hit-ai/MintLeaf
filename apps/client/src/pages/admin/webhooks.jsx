// src/pages/admin/webhooks/index.jsx
import React,{ useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Switch from "@radix-ui/react-switch";
import classNames from "classnames";
import { useUser } from "../../store/session";

const getHooks = async (fetchWithAuth) => {
  const response = await fetchWithAuth("/v1/webhook/all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
  const data = await response.json();
  if (data.success === false) {
    throw new Error(data.message || "Failed to fetch webhooks");
  }
  return data;
};

const Webhooks = () => {
  const [show, setShow] = useState("main");
  const [enabled, setEnabled] = useState(true);
  const [url, setUrl] = useState("");
  const [type, setType] = useState("ticket_created");
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();

  const { data, status, refetch } = useQuery({
    queryKey: ["getHooks"],
    queryFn: () => getHooks(fetchWithAuth),
    onError: (error) => {
      toast.error(`Error fetching webhooks: ${error.message}`, {
        toastId: "fetch-webhooks-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    },
  });

  const addHook = async () => {
    try {
      const response = await fetchWithAuth("/v1/webhook/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          active: enabled,
          url,
          type,
          secret,
        }),
      });
      if (!response.ok) throw new Error(`Failed to add webhook: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        toast.success("Webhook added successfully");
        refetch();
        setShow("main");
        setName("");
        setUrl("");
        setType("ticket_created");
        setSecret("");
        setEnabled(true);
      } else {
        throw new Error(data.message || "Failed to add webhook");
      }
    } catch (error) {
      toast.error(`Error adding webhook: ${error.message}`, {
        toastId: "add-webhook-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  const deleteHook = async (id) => {
    try {
      const response = await fetchWithAuth(`/v1/webhooks/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to delete webhook: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        toast.success("Webhook deleted successfully");
        refetch();
      } else {
        throw new Error(data.error || "Failed to delete webhook");
      }
    } catch (error) {
      toast.error(`Error deleting webhook: ${error.message}`, {
        toastId: "delete-webhook-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-gray-900">
                Webhook Settings
              </h1>
            </div>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="py-6">
              <div className="mt-4">
                <div className={show === "main" ? "" : "hidden"}>
                  {status === "pending" && (
                    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                      <h2>Loading data...</h2>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                      <h2 className="text-2xl font-bold">Error fetching data...</h2>
                    </div>
                  )}
                  {status === "success" && (
                    <>
                      <div className="px-4 sm:px-6 md:px-0">
                        <div className="sm:flex sm:items-center mt-4">
                          <div className="sm:flex-auto">
                            <p className="mt-2 text-sm text-gray-700">
                              Webhooks allow external services to be notified when certain
                              events happen. When the specified events happen, we'll send
                              a POST request to each of the URLs you provide.
                            </p>
                          </div>
                          <div className="sm:ml-16 sm:flex-none">
                            <button
                              onClick={() => setShow("create")}
                              type="button"
                              className={
                                show === "main"
                                  ? "rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                  : "hidden"
                              }
                            >
                              Add Webhook
                            </button>
                            <button
                              onClick={() => setShow("main")}
                              type="button"
                              className={
                                show === "main"
                                  ? "hidden"
                                  : "rounded bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        {data?.webhooks?.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {data.webhooks.map((hook) => (
                              <div
                                key={hook.id}
                                className="rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {hook.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {hook.url} | {hook.type}
                                  </p>
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => deleteHook(hook.id)}
                                    type="button"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700">
                            You currently have no webhooks added
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className={show === "create" ? "" : "hidden"}>
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Webhook Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className="shadow-sm bg-transparent text-gray-900 border focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <label
                        htmlFor="url"
                        className="block text-sm font-medium text-gray-900 pt-4"
                      >
                        Payload URL
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="url"
                          id="url"
                          className="shadow-sm bg-transparent text-gray-900 border focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>

                      <div className="w-3/4">
                        <label
                          htmlFor="type"
                          className="mt-4 block text-sm font-medium text-gray-900"
                        >
                          Type
                        </label>
                        <select
                          id="type"
                          name="type"
                          className="mt-1 block w-full pl-3 pr-10 bg-transparent border py-2 text-gray-900 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                        >
                          <option value="ticket_created">Ticket created</option>
                          <option value="ticket_status_changed">
                            Ticket Status Change
                          </option>
                        </select>
                      </div>

                      <label
                        htmlFor="secret"
                        className="block text-sm font-medium text-gray-900 pt-4"
                      >
                        Secret (optional)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="secret"
                          id="secret"
                          className="shadow-sm bg-transparent text-gray-900 border focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                        />
                      </div>

                      <div className="pt-8">
                        <div className="flex items-center justify-between">
                          <span className="flex-grow flex flex-row">
                            <label
                              htmlFor="active"
                              className="text-sm font-medium text-gray-900 w-1/6"
                            >
                              Active
                            </label>
                            <Switch.Root
                              id="active"
                              checked={enabled}
                              onCheckedChange={setEnabled}
                              className={classNames(
                                enabled ? "bg-green-600" : "bg-gray-200",
                                "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              )}
                            >
                              <Switch.Thumb
                                className={classNames(
                                  enabled ? "translate-x-5" : "translate-x-0",
                                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                                )}
                              />
                            </Switch.Root>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={addHook}
                        type="button"
                        disabled={!name || !url}
                        className="mt-8 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add Webhook
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Webhooks;