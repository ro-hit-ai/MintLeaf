import React, { useState, useEffect, Fragment, lazy, Suspense } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useNavigate } from "react-router-dom";
import { useUser } from "../store/session";
import { toast } from "react-toastify";
import { apiUrl } from "../utils/api";  // 👈 import helper

const Editor = lazy(() => import("../components/BlockEditor"));

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const types = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user, fetchWithAuth } = useUser();
  const [name, setName] = useState("");
  const [company, setCompany] = useState();
  const [engineer, setEngineer] = useState();
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [options, setOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(types[3]);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    const data = await fetchWithAuth(`${apiUrl}/api/v1/clients/all`);
    if (data?.clients) {
      setOptions(data.clients);
    } else {
      setError('Failed to fetch clients. Please try again.');
    }
  };


  const fetchUsers = async () => {
    const data = await fetchWithAuth(apiUrl("/v1/users/all"));
    if (data?.users) {
      setUsers(data.users);
    } else {
      setError('Failed to fetch users. Please try again.');
    }
  };

  const createTicket = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const data = await fetchWithAuth(apiUrl("/v1/ticket/create"), {
  method: "POST",
  body: JSON.stringify({
    name,
    title,
    company,
    email,
    detail: issue,
    priority,
    engineer,
    type: selected.name,
    createdBy: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
    },
  }),
});


    if (data?.success) {
      toast.success("Ticket created successfully");
      navigate("/tickets");
    } else {
      setError(data?.error || "Failed to create ticket");
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchClients();
    fetchUsers();
  }, [user]);

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
              fetchClients();
              fetchUsers();
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
    <div className="h-full bg-white dark:bg-[#0A090C]">
      <div className="w-full border-b-[1px] p-2 flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-4">
          <Listbox value={company} onChange={setCompany}>
            {({ open }) => (
              <div className="relative">
                <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                  <span className="block truncate">{company?.name || "Select a client"}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <Listbox.Option value={undefined} className={({ active }) => classNames(active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-white", "relative cursor-default select-none py-2 pl-3 pr-9")}>
                      {({ selected, active }) => (
                        <>
                          <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>Unassigned</span>
                          {selected && (
                            <span className={classNames(active ? "text-white" : "text-indigo-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                    {options.map(client => (
                      <Listbox.Option key={client.id} value={client} className={({ active }) => classNames(active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-white", "relative cursor-default select-none py-2 pl-3 pr-9")}>
                        {({ selected, active }) => (
                          <>
                            <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>{client.name}</span>
                            {selected && (
                              <span className={classNames(active ? "text-white" : "text-indigo-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>

          <Listbox value={engineer} onChange={setEngineer}>
            {({ open }) => (
              <div className="relative">
                <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                  <span className="block truncate">{engineer?.name || "Select an engineer"}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <Listbox.Option value={undefined} className={({ active }) => classNames(active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-white", "relative cursor-default select-none py-2 pl-3 pr-9")}>
                      {({ selected, active }) => (
                        <>
                          <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>Unassigned</span>
                          {selected && (
                            <span className={classNames(active ? "text-white" : "text-indigo-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                    {users.map(user => (
                      <Listbox.Option key={user.id} value={user} className={({ active }) => classNames(active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-white", "relative cursor-default select-none py-2 pl-3 pr-9")}>
                        {({ selected, active }) => (
                          <>
                            <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>{user.name}</span>
                            {selected && (
                              <span className={classNames(active ? "text-white" : "text-indigo-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>

          <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
              <div className="relative">
                <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                  <span className="block truncate">{selected.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {types.map((t) => (
                      <Listbox.Option key={t.id} value={t} className={({ active }) => classNames(active ? "bg-gray-400 text-white" : "text-gray-900 dark:text-white", "relative cursor-default select-none py-2 pl-3 pr-9")}>
                        {({ selected, active }) => (
                          <>
                            <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>{t.name}</span>
                            {selected && (
                              <span className={classNames(active ? "text-white" : "text-indigo-600", "absolute inset-y-0 right-0 flex items-center pr-4")}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>
        </div>

        <div>
          <button
            type="button"
            onClick={createTicket}
            className="rounded bg-green-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
          >
            Create Ticket
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row h-full w-full">
        <div className="w-full order-2 xl:order-2">
          <div className="px-4 border-b border-gray-700">
            <input
              type="text"
              name="title"
              placeholder="Ticket details"
              maxLength={64}
              autoComplete="off"
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-0 pr-0 sm:text-xl border-none dark:bg-[#0A090C] dark:text-white focus:outline-none"
            />
          </div>
          <Suspense fallback={<div>Loading editor...</div>}>
            <Editor setIssue={setIssue} />
          </Suspense>
        </div>

        <div className="w-full xl:w-1/6 p-3 flex flex-col dark:bg-[#0A090C] dark:text-white border-b-[1px] xl:border-b-0 xl:border-r-[1px] order-1 xl:order-1">
          <div className="flex flex-col gap-2">
            <div>
              <label>
                <span className="block text-sm font-medium text-gray-700 dark:text-white">Contact Name</span>
              </label>
              <input
                type="text"
                placeholder="Ticket name here"
                autoComplete="off"
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-0 pr-0 sm:text-sm border-none focus:outline-none dark:bg-[#0A090C] dark:text-white"
              />
            </div>

            <div>
              <label>
                <span className="block text-sm font-medium text-gray-700 dark:text-white">Contact Email</span>
              </label>
              <input
                type="email"
                placeholder="Ticket email here"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-0 pr-0 sm:text-sm border-none focus:outline-none dark:bg-[#0A090C] dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}