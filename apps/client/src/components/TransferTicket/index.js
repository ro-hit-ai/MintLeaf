import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import {
  CheckIcon,
  DocumentDuplicateIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Placeholder for toast notifications (replace with react-toastify or similar)
const toast = ({ title, description, variant }) => {
  alert(`${title}: ${description}`);
};

export default function TransferTicket({ id, onTransferSuccess }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [n, setN] = useState();

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("session") || ""; // Replace with your token logic
      const res = await fetch("https://your-api-endpoint/users/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  // Transfer ticket
  const postData = async () => {
    if (!n?.id) {
      toast({
        title: "Error",
        description: "Please select a user to transfer the ticket to",
        variant: "destructive",
      });
      return;
    }
    try {
      const token = localStorage.getItem("session") || "";
      const res = await fetch(`https://your-api-endpoint/ticket/${id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user: n.id }),
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        if (onTransferSuccess) onTransferSuccess(); // Callback for success
        else window.location.reload(); // Fallback to reload
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to transfer ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer ticket",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <div
        className="flex flex-row px-4 py-2 w-full group text-gray-400 hover:text-gray-500 hover:bg-gray-100 hover:cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <DocumentDuplicateIcon
          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-700">Transfer</span>
      </div>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setOpen}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
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
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl h-64 sm:w-full sm:p-6">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    {/* Replace with an icon from @heroicons/react/20/solid if needed */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="sm:flex sm:items-start w-full">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Transfer Ticket
                    </Dialog.Title>
                    <div className="mt-2 pb-16">
                      <Listbox value={n} onChange={setN} className="z-50">
                        {({ open }) => (
                          <>
                            <Listbox.Label className="block text-sm font-medium text-gray-700">
                              Assigned to
                            </Listbox.Label>
                            <div className="mt-1 relative">
                              <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <span className="block truncate">
                                  {n ? n.name : "Please select new user"}
                                </span>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                  {/* Replace with an icon from @heroicons/react/20/solid if needed */}
                                  <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                                    />
                                  </svg>
                                </span>
                              </Listbox.Button>

                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                  {users.map((user) => (
                                    <Listbox.Option
                                      key={user.id}
                                      className={({ active }) =>
                                        classNames(
                                          active
                                            ? "text-white bg-indigo-600"
                                            : "text-gray-900",
                                          "cursor-default select-none relative py-2 pl-3 pr-9"
                                        )
                                      }
                                      value={user}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <span
                                            className={classNames(
                                              selected
                                                ? "font-semibold"
                                                : "font-normal",
                                              "block truncate"
                                            )}
                                          >
                                            {user.name}
                                          </span>
                                          {selected ? (
                                            <span
                                              className={classNames(
                                                active
                                                  ? "text-white"
                                                  : "text-indigo-600",
                                                "absolute inset-y-0 right-0 flex items-center pr-4"
                                              )}
                                            >
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </>
                        )}
                      </Listbox>

                      <button
                        onClick={postData}
                        type="button"
                        className="float-right mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}