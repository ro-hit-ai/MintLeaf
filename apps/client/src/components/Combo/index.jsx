// src/components/Combo/index.jsx
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Avatar, AvatarFallback, AvatarImage } from "../../shadcn/ui/avatar";
import { Button } from "../../shadcn/ui/button";

// ✅ ADD THESE MISSING EXPORTS
export function UserCombo({ user, onLogout }) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar} alt={user?.name} />
        <AvatarFallback>
          {user?.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.name || "User"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user?.email || "user@example.com"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="h-6 px-2 text-destructive hover:text-destructive/80"
      >
        Logout
      </Button>
    </div>
  );
}

export function ClientCombo({ client, onSwitch }) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
        <span className="text-xs font-semibold text-primary-foreground">
          {client?.name?.charAt(0) || "C"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {client?.name || "Client"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {client?.organization || "Organization"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSwitch?.(client)}
        className="h-6 px-2"
      >
        Switch
      </Button>
    </div>
  );
}

// ✅ KEEP YOUR EXISTING MODAL
export default function ClientNotesModal({ notes, id }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notes);

  async function postMarkdown() {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/clients/${id}/create-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: value,
          id,
        }),
      });
      
      const res = await response.json();
      
      if (res.success === true) {
        setOpen(false);
        // Optionally refresh data or show success message
      } else {
        alert(res.error || "Failed to save note");
      }
    } catch (error) {
      alert("An error occurred while saving the note.");
      console.error("Error:", error);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="w-full flex px-4 py-2 text-sm group-hover:text-gray-500 hover:bg-gray-100"
        onClick={() => setOpen(true)}
      >
        Notes
      </button>
      
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
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full sm:p-6">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start w-full">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Client Notes
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full h-64 p-2 border border-gray-300 rounded-md resize-none"
                        placeholder="Enter client notes here..."
                      />
                      
                      <div className="mt-4 float-right">
                        <button
                          onClick={postMarkdown}
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}