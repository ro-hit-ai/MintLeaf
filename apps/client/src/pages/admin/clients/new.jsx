// src/pages/admin/clients/new.jsx
import React,{ useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session";

const NewClient = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();

  const [number, setNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const isEnabled = number.length > 0 && contactName.length > 0 && name.length > 0 && email.length > 0;

  const createClient = async () => {
    try {
      const response = await fetchWithAuth("/v1/client/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
          contactName,
          name,
          email,
        }),
      });
      if (!response.ok) throw new Error(`Failed to create client: ${response.statusText}`);
      const result = await response.json();

      if (result.success === true) {
        toast.success("Client created successfully");
        navigate("/admin/clients");
      } else {
        throw new Error(result.error || "Failed to create client");
      }
    } catch (err) {
      toast.error(`Error creating client: ${err.message}`, {
        toastId: "create-client-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  return (
    <div>
      <main className="flex-1">
        <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
          <div className="pt-10 pb-16 divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-foreground">
                Register a new client
              </h1>
            </div>
            <div className="py-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-foreground">
                        Create a new client
                      </h3>
                      <h3 className="text-xs font-normal text-foreground">
                        All fields are required!
                      </h3>
                      <div className="mt-2 space-y-4">
                        <input
                          type="text"
                          className="shadow-sm text-foreground bg-transparent focus:ring-indigo-500 focus:border-indigo-500 block w-3/4 sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter client name here..."
                          name="name"
                          onChange={(e) => setName(e.target.value)}
                          value={name}
                        />
                        <input
                          type="email"
                          className="shadow-sm text-foreground bg-transparent focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter email here..."
                          name="email"
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                        />
                        <input
                          type="text"
                          className="shadow-sm text-foreground bg-transparent focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter client primary contact name here..."
                          name="contactName"
                          onChange={(e) => setContactName(e.target.value)}
                          value={contactName}
                        />
                        <input
                          type="text"
                          className="shadow-sm text-foreground bg-transparent focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter client primary contact number here..."
                          name="number"
                          onChange={(e) => setNumber(e.target.value)}
                          value={number}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={createClient}
                  disabled={!isEnabled}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewClient;
