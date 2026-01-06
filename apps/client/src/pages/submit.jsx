import React, { useState, Fragment } from "react";
import { toast } from "react-toastify"; // Replaced shadcn toast
import { Listbox, Transition } from "@headlessui/react";
import { CheckCircleIcon, CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useParams } from "react-router-dom"; // Replaced next/router

const issueTypes = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

const priorities = [
  { id: 7, name: "Low" },
  { id: 8, name: "Medium" },
  { id: 9, name: "High" },
];

function ClientTicketNew() {
  const { id } = useParams(); // Replaced router.query.id
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("new");
  const [ticketID, setTicketID] = useState("");
  const [selectedType, setSelectedType] = useState(issueTypes[2]);
  const [selectedPriority, setSelectedPriority] = useState(priorities[0]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
  });

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function submitTicket() {
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.description) {
      toast.error("Please fill out all required fields");
      return;
    }

    setIsLoading(true);

    try {
     const response = await fetch(`${BACKEND_URL}/api/v1/ticket/public/create`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: formData.name,
    title: formData.subject,
    company: id,
    email: formData.email,
    detail: formData.description,
    priority: selectedPriority.name,
    type: selectedType.name,
  }),
});


      const result = await response.json();

      if (result.success) {
        toast.success("Ticket created successfully");
        setView("success");
        setTicketID(result.id);
      } else {
        throw new Error(result.message || "Failed to create ticket");
      }
    } catch (error) {
      toast.error(error.message || "Please try again later");
    } finally {
      setIsLoading(false);
    }
  }

  if (view === "success") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
        <div className="rounded-md bg-green-600 shadow-md p-8 max-w-md w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-2xl font-medium text-white">Ticket Submitted</h3>
              <div className="mt-2 text-sm text-white">
                <p>A member of our team has been notified and will be in touch shortly.</p>
                {ticketID && (
                  <p className="mt-2 font-mono">Ticket ID: {ticketID}</p>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setView("new")}
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
                >
                  Submit Another Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start py-12 bg-gray-900 min-h-screen">
      <div className="max-w-2xl bg-white p-6 md:p-8 rounded-md shadow-lg w-full mx-4">
        <h1 className="font-bold text-2xl mb-2">Submit a Ticket</h1>
        <p className="text-gray-600 mb-6">
          Need help? Submit a ticket and our support team will get back to you
          as soon as possible.
        </p>

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="I can't login to my account"
              required
            />
          </div>

          <div>
            <Listbox value={selectedType} onChange={setSelectedType}>
              <Listbox.Label className="block text-sm font-medium text-gray-700">
                Issue Type
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                  <span className="block truncate">{selectedType.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {issueTypes.map((type) => (
                      <Listbox.Option
                        key={type.id}
                        className={({ active }) =>
                          classNames(
                            active ? "bg-green-600 text-white" : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value={type}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={classNames(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate"
                              )}
                            >
                              {type.name}
                            </span>

                            {selected ? (
                              <span
                                className={classNames(
                                  active ? "text-white" : "text-green-600",
                                  "absolute inset-y-0 right-0 flex items-center pr-4"
                                )}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div>
            <Listbox value={selectedPriority} onChange={setSelectedPriority}>
              <Listbox.Label className="block text-sm font-medium text-gray-700">
                Priority
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                  <span className="block truncate">{selectedPriority.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {priorities.map((priority) => (
                      <Listbox.Option
                        key={priority.id}
                        className={({ active }) =>
                          classNames(
                            active ? "bg-green-600 text-white" : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value={priority}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={classNames(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate"
                              )}
                            >
                              {priority.name}
                            </span>

                            {selected ? (
                              <span
                                className={classNames(
                                  active ? "text-white" : "text-green-600",
                                  "absolute inset-y-0 right-0 flex items-center pr-4"
                                )}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description of Issue *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Please describe your issue in detail..."
              required
            />
          </div>

          <button
            onClick={submitTicket}
            disabled={isLoading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-white font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientTicketNew;