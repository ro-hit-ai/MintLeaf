import { useState } from "react";
import { useQuery } from "react-query";
import { Switch } from "@headlessui/react";

async function getHooks() {
  const res = await fetch("/api/v1/admin/webhooks/all-hooks"); // Adjust to your backend API endpoint
  return res.json();
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Webhooks({ onUpdate }) {
  const [show, setShow] = useState("main");
  const [enabled, setEnabled] = useState(true);
  const [url, setUrl] = useState("");
  const [type, setType] = useState("ticket_created");
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");

  const { data, status, error, refetch } = useQuery("gethooks", getHooks, {
    onError: (err) => {
      console.error("Error fetching hooks:", err);
      alert(`Error fetching webhooks: ${err.message}`); // Replace with toast in production
    },
  });

  async function addHook() {
    try {
      const res = await fetch("/api/v1/admin/webhooks/create", {
        // Adjust to your backend API endpoint
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
      const result = await res.json();
      if (result.success !== false) {
        refetch();
        if (onUpdate) onUpdate(); // Notify parent of update
        alert("Webhook added successfully"); // Replace with toast in production
      } else {
        alert(`Error adding webhook: ${result.error}`); // Replace with toast
      }
    } catch (err) {
      alert(`Error adding webhook: ${err.message}`); // Replace with toast
    }
  }

  async function deleteHook(id) {
    try {
      const res = await fetch(`/api/v1/admin/webhooks/${id}/delete`, {
        // Adjust to your backend API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      refetch();
      if (result.error) {
        alert(`Error deleting webhook: ${result.error}`); // Replace with toast
      } else {
        if (onUpdate) onUpdate(); // Notify parent of update
        alert("Webhook deleted successfully"); // Replace with toast
      }
    } catch (err) {
      alert(`Error deleting webhook: ${err.message}`); // Replace with toast
    }
  }

  return (
    <div>
      <div className="">
        <button
          onClick={() => setShow("create")}
          type="button"
          className={
            show === "main"
              ? "inline-flex float-right -mt-8 items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              : "inline-flex float-right -mt-8 items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          }
        >
          Cancel
        </button>
      </div>
      <div className={show === "main" ? "pt-8 sm:pt-4" : ""}>
        <p>
          Webhooks allow external services to be notified when certain events
          happen. When the specified events happen, we'll send a POST request to
          each of the URLs you provide.
        </p>
      </div>

      <div className={show === "main" ? "" : "hidden"}>
        {status === "success" && (
          <div>
            {data.hooks.length > 0 ? (
              <div>
                {data.hooks.map((hook) => (
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
              <p>You currently have no webhooks added</p>
            )}
          </div>
        )}
        {status === "error" && (
          <p className="text-red-600">Error: {error.message}</p>
        )}
        {status === "loading" && <p>Loading webhooks...</p>}
      </div>

      <div className={show === "create" ? "" : "hidden"}>
        <div className="flex flex-col">
          <div className="">
            <div className="space-y-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Webhook Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 pt-4"
              >
                Payload URL
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="url"
                  id="url"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              {/* Uncomment if secret field is needed */}
              {/* <label
                htmlFor="secret"
                className="block text-sm font-medium text-gray-700 mt-2"
              >
                Secret
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="secret"
                  id="secret"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:w-1/2 md:w-3/4 sm:text-sm border-gray-300 rounded-md"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div> */}

              <div className="w-3/4">
                <label
                  htmlFor="type"
                  className="mt-4 block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="ticket_created">Ticket created</option>
                  <option value="ticket_status_changed">
                    Ticket Status Change
                  </option>
                </select>
              </div>

              <div className="pt-8">
                <Switch.Group
                  as="div"
                  className="flex items-center justify-between"
                >
                  <span className="flex-grow flex flex-row">
                    <Switch.Label
                      as="span"
                      className="text-sm font-medium text-gray-900 w-1/6"
                      passive
                    >
                      Active
                    </Switch.Label>
                    <Switch
                      checked={enabled}
                      onChange={setEnabled}
                      className={classNames(
                        enabled ? "bg-green-600" : "bg-gray-200",
                        "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          enabled ? "translate-x-5" : "translate-x-0",
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                        )}
                      />
                    </Switch>
                  </span>
                </Switch.Group>
              </div>

              <button
                onClick={() => {
                  addHook();
                  setShow("main");
                }}
                type="button"
                className="mt-8 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Webhooks;