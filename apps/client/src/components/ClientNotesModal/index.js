import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import PropTypes from "prop-types";

export default function ClientNotesModal({ notes, id }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notes);
  const [isLoading, setIsLoading] = useState(false);

  async function postMarkdown() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/clients/${id}/create-note`, {
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
      } else {
        alert(res.error);
      }
    } catch (error) {
      alert("An error occurred while saving the note.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Optional: Character limit (example: 5000 characters)
  const characterLimit = 5000;
  const charactersRemaining = characterLimit - value.length;

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
                    disabled={isLoading}
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
                        disabled={isLoading}
                        maxLength={characterLimit}
                      />
                      
                      {/* Character limit indicator */}
                      <div className="text-sm text-gray-500 mt-1">
                        {charactersRemaining} characters remaining
                      </div>
                      
                      <div className="mt-4 float-right">
                        <button
                          onClick={postMarkdown}
                          type="button"
                          disabled={isLoading || value.length === 0}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Saving..." : "Save"}
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

// PropTypes for better development experience
ClientNotesModal.propTypes = {
  notes: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

ClientNotesModal.defaultProps = {
  notes: "",
};