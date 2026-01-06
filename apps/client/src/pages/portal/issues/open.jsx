import React from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from 'react-spinners/ClipLoader';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';

// Note: You'll need to replace these with React-compatible alternatives
// import useTranslation from "next-translate/useTranslation";
// import { getCookie } from "cookies-next";
// import { useUser } from "../../../store/session";

// Temporary replacements - you'll need to implement these properly
const getCookie = (name) => {
  // Simple cookie getter for React
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const useTranslation = () => {
  // Mock translation hook - replace with your i18n solution
  return {
    t: (key) => key // Returns the key as translation for demo purposes
  };
};

const useUser = () => {
  // Mock user hook
  return {
    user: { id: 1, name: 'Demo User' }
  };
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function getUserTickets(token) {
  const res = await fetch(`/api/v1/tickets/user/open/external`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export default function Tickets() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const token = getCookie("session");
  const { data, status, error } = useQuery("allusertickets", () =>
    getUserTickets(token)
  );

  const user = useUser();

  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  return (
    <div>
      {status === "loading" && (
        <div className="flex flex-col justify-center items-center h-screen">
          <Loader color="green" size={100} />
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col justify-center items-center h-screen">
          <h2 className="text-2xl font-bold">Error loading tickets</h2>
          <p className="text-gray-500">{error?.message}</p>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="flex flex-col">
            <div className="py-2 px-6 flex flex-row items-center justify-between bg-gray-200 dark:bg-[#0A090C] border-b-[1px]">
              <span className="text-sm font-bold">
                You have {data.tickets.length} open ticket
                {data.tickets.length !== 1 ? "s" : ""}
              </span>
            </div>
            {data.tickets.length > 0 ? (
              data.tickets.map((ticket) => {
                let p = ticket.priority;
                let badge;

                if (p === "Low") {
                  badge = low;
                }
                if (p === "Normal") {
                  badge = normal;
                }
                if (p === "High") {
                  badge = high;
                }

                return (
                  <Link 
                    to={`/portal/issue/${ticket.id}`} 
                    key={ticket.id}
                    className="block"
                  >
                    <div className="flex flex-row w-full bg-white dark:bg-[#0A090C] dark:hover:bg-green-600 border-b-[1px] p-2 justify-between px-6 hover:bg-gray-100">
                      <div className="flex flex-row space-x-2 items-center">
                        <span className="text-xs font-semibold">
                          #{ticket.Number}
                        </span>
                        <span className="text-xs font-semibold">
                          {ticket.title}
                        </span>
                      </div>
                      <div className="flex flex-row space-x-3 items-center">
                        <span className="text-xs">
                          created at{" "}
                          {moment(ticket.createdAt).format("DD/MM/yyyy")}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 justify-center w-16 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 ${badge}`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500">
                          <span className="text-[11px] font-medium leading-none text-white uppercase">
                            {ticket.assignedTo ? ticket.assignedTo.name[0] : ""}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <button
                  type="button"
                  className="relative block w-[400px] rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => {
                    navigate("/portal/new");
                  }}
                >
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                    />
                  </svg>
                  <span className="mt-2 block text-sm font-semibold text-gray-900">
                    Create your first issue
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}