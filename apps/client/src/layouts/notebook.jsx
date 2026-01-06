import { PlusIcon as PlusIconMini } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Link, useLocation } from "react-router-dom"; // Use React Router for navigation
import Loader from "react-spinners/ClipLoader";

async function fetchNotebooks(token) {
  const res = await fetch("/api/v1/notebooks/all", {
    // Adjust to your backend API endpoint
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function NoteBookLayout({ children, token }) {
  const location = useLocation();
  const { data, status, error, refetch } = useQuery(
    "getUsersNotebooks",
    () => fetchNotebooks(token),
    {
      enabled: !!token, // Only fetch if token is provided
      onError: (err) => {
        console.error("Error fetching notebooks:", err);
        alert(`Error fetching notebooks: ${err.message}`); // Replace with toast in production
      },
    }
  );

  const [notebooks, setNotebooks] = useState();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (data) {
      setNotebooks(data.notebooks);
    }
  }, [data]);

  return (
    <div>
      {status === "loading" && (
        <div className="flex flex-col justify-center items-center h-screen">
          <Loader color="green" size={100} />
        </div>
      )}

      {status === "success" && (
        <div className="">
          <div className="flex flex-row">
            <div className="flex flex-col w-64 border-r-[1px]">
              <div className="flex-row">
                <nav className="flex-1 w-full" aria-label="Sidebar">
                  <div className="border-b-[1px]">
                    <Link
                      to="/notebook/new"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 dark:text-white"
                    >
                      <PlusIconMini className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </div>
                  {notebooks &&
                    notebooks.map((item) => (
                      <Link
                        key={item.id}
                        to={`/notebook/${item.id}`}
                        className={classNames(
                          location.pathname === `/notebook/${item.id}`
                            ? "bg-green-500 text-white hover:text-white"
                            : "text-gray-900 dark:text-white hover:bg-green-500 hover:text-white hover:bg-opacity-75",
                          "group flex text-left px-2 py-2 w-full text-sm font-medium border-b-[1px] border-gray-200"
                        )}
                      >
                        <div className="flex flex-row items-center justify-between w-full">
                          <span className="truncate">{item.title}</span>
                        </div>
                      </Link>
                    ))}
                </nav>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-[80vh]">{children}</div>
            </div>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col justify-center items-center h-screen">
          <p className="text-red-600">Error: {error.message}</p>
        </div>
      )}
    </div>
  );
}

export default NoteBookLayout;