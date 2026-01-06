// src/components/CreateTicketModal/index.jsx
import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Cookies from "js-cookie"; // ✅ instead of cookies-next
import { useNavigate } from "react-router-dom"; // ✅ instead of next/router

import { toast } from "../../shadcn/hooks/use-toast"; // ✅ fix alias
import { useSidebar } from "../../shadcn/ui/sidebar"; // ✅ fix alias

import Editor from "../BlockEditor"; // ✅ no dynamic import

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const type = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

export default function CreateTicketModal({ keypress, setKeyPressDown }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = Cookies.get("session"); // ✅ cookie handling

  // Dummy translation (replace with react-i18next later if needed)
  const t = (key) => key;

  const { state } = useSidebar();

  const [name, setName] = useState("");
  const [company, setCompany] = useState();
  const [engineer, setEngineer] = useState();
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [options, setOptions] = useState();
  const [users, setUsers] = useState();
  const [selected, setSelected] = useState(type[3]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`/api/v1/clients/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.clients) setOptions(data.clients);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/v1/users/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const createTicket = async () => {
    try {
      const res = await fetch(`/api/v1/ticket/create`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
            id: "123", // 🔧 Replace with your logged-in user
            name: "John Doe",
            role: "admin",
            email: "john@example.com",
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          variant: "default",
          title: "Success",
          description: "Ticket created successfully",
        });
        navigate("/issues"); // ✅ instead of router.push
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Something went wrong",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (keypress) {
      setOpen(true);
      setKeyPressDown(false);
    }
  }, [keypress]);

  const [hideKeyboardShortcuts, setHideKeyboardShortcuts] = useState(false);
  const [hideName, setHideName] = useState(false);
  const [hideEmail, setHideEmail] = useState(false);

  useEffect(() => {
    const loadFlags = () => {
      const savedFlags = localStorage.getItem("featureFlags");
      if (savedFlags) {
        const flags = JSON.parse(savedFlags);
        setHideKeyboardShortcuts(
          flags.find((f) => f.name === "Hide Keyboard Shortcuts")?.enabled || false
        );
        setHideName(
          flags.find((f) => f.name === "Hide Name in Create")?.enabled || false
        );
        setHideEmail(
          flags.find((f) => f.name === "Hide Email in Create")?.enabled || false
        );
      }
    };

    loadFlags();
    window.addEventListener("storage", loadFlags);
    return () => window.removeEventListener("storage", loadFlags);
  }, []);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed z-10 inset-0" onClose={setOpen}>
        <div className="flex items-end justify-center min-h-screen pt-4 mx-4 md:mx-12 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block bg-background rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 align-middle md:max-w-3xl w-full">
              {/* Header */}
              <div className="flex flex-row w-full items-center">
                <span className="text-md font-semibold">New Issue</span>
                <button
                  type="button"
                  className="ml-auto text-foreground font-bold text-xs rounded-md hover:text-primary outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                name="title"
                placeholder="Issue title"
                maxLength={64}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-2 text-md bg-background border-none focus:outline-none"
              />

              {/* Name + Email */}
              {!hideName && (
                <input
                  type="text"
                  placeholder={t("ticket_name_here")}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 bg-background border-none focus:outline-none"
                />
              )}
              {!hideEmail && (
                <input
                  type="email"
                  placeholder={t("ticket_email_here")}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-2 bg-background border-none focus:outline-none"
                />
              )}

              {/* Editor */}
              <Editor setIssue={setIssue} />

              {/* Dropdowns */}
              <div className="flex flex-row space-x-4 mt-4">
                {/* Company */}
                <Listbox value={company} onChange={setCompany}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full min-w-[172px] rounded-md bg-white dark:bg-black py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600">
                        <span className="block truncate">
                          {company?.name || t("select_a_client")}
                        </span>
                        <ChevronUpDownIcon
                          className="h-5 w-5 absolute right-2 top-2 text-gray-400"
                          aria-hidden="true"
                        />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-black py-1 text-base shadow-lg">
                          {options?.map((client) => (
                            <Listbox.Option
                              key={client.id}
                              value={client}
                              className={({ active }) =>
                                classNames(
                                  active ? "bg-indigo-600 text-white" : "",
                                  "cursor-default select-none py-2 pl-3 pr-9"
                                )
                              }
                            >
                              {client.name}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>

                {/* Engineer */}
                <Listbox value={engineer} onChange={setEngineer}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full min-w-[172px] rounded-md bg-white dark:bg-black py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600">
                        <span className="block truncate">
                          {engineer?.name || t("select_an_engineer")}
                        </span>
                        <ChevronUpDownIcon className="h-5 w-5 absolute right-2 top-2 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-black py-1 text-base shadow-lg">
                          {users?.map((u) => (
                            <Listbox.Option
                              key={u.id}
                              value={u}
                              className="cursor-default select-none py-2 pl-3 pr-9"
                            >
                              {u.name}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>

                {/* Type */}
                <Listbox value={selected} onChange={setSelected}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full min-w-[172px] rounded-md bg-white dark:bg-black py-1 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600">
                        <span className="block truncate">{selected.name}</span>
                        <ChevronUpDownIcon className="h-5 w-5 absolute right-2 top-2 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-black py-1 text-base shadow-lg">
                          {type.map((t) => (
                            <Listbox.Option
                              key={t.id}
                              value={t}
                              className="cursor-default select-none py-2 pl-3 pr-9"
                            >
                              {t.name}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>

              {/* Footer */}
              <div className="mt-4 border-t pt-3 text-right">
                <button
                  onClick={() => {
                    setOpen(false);
                    createTicket();
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
