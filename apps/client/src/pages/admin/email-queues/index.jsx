// src/pages/admin/email-queues/index.jsx
import React, { useMemo, useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

const DefaultColumnFilter = ({ column }) => {
  const { filterValue, setFilter } = column;
  return (
    <input
      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
      type="text"
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value || undefined)}
      placeholder="Type to filter"
    />
  );
};

const Table = ({ columns, data }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    filterFns: {
      text: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return value
          ? String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          : true;
      },
    },
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageCount,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState,
  } = table;

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="shadow overflow-hidden border-b border-gray-200 md:rounded-lg">
          <input
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md mb-4"
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
          />
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.isPlaceholder ? null : (
                        <>
                          {flexRender(column.column.columnDef.header, column.getContext())}
                          {column.column.getCanFilter() ? (
                            <div>{flexRender(column.column.columnDef.filter, column.getContext())}</div>
                          ) : null}
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <nav
              className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <div className="flex flex-row flex-nowrap w-full space-x-2">
                  <p className="block text-sm font-medium text-gray-700 mt-4">Show</p>
                  <select
                    className="block w-full pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={getState().pagination.pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  type="button"
                  onClick={() => previousPage()}
                  disabled={!getCanPreviousPage()}
                >
                  Previous
                </button>
                <button
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  type="button"
                  onClick={() => nextPage()}
                  disabled={!getCanNextPage()}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

const EmailQueuesList = () => {
  const { fetchWithAuth } = useUser();
  const navigate = useNavigate();
  const [queues, setQueues] = useState(null);

  const fetchQueues = async () => {
    try {
      const response = await fetchWithAuth("/v1/email-queue/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch queues: ${response.statusText}`);
      const result = await response.json();
      if (result.success !== false) {
        // Normalize queue data
        const normalizedQueues = result.queues.map((queue, index) => ({
          ...queue,
          id: queue._id || `fallback-${index}`, // Ensure unique ID
          name: queue.name || "N/A",
          username: queue.username || "N/A",
          hostname: queue.hostname || "N/A",
          tls: queue.tls || false,
        }));
        setQueues(normalizedQueues);
      } else {
        throw new Error(result.error || "Failed to fetch queues");
      }
    } catch (err) {
      toast.error(`Error fetching queues: ${err.message}`, {
        toastId: "fetch-queues-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  const deleteItem = async (id) => {
    try {
      const response = await fetchWithAuth("/v1/email-queue/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error(`Failed to delete queue: ${response.statusText}`);
      const result = await response.json();
      if (result.success !== false) {
        toast.success("Queue deleted successfully");
        fetchQueues();
      } else {
        throw new Error(result.error || "Failed to delete queue");
      }
    } catch (err) {
      toast.error(`Error deleting queue: ${err.message}`, {
        toastId: "delete-queue-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        id: "name",
        filterFn: "text",
      },
      {
        header: "Email/Username",
        accessorKey: "username",
        id: "username",
        filterFn: "text",
      },
      {
        header: "Hostname",
        accessorKey: "hostname",
        id: "hostname",
        filterFn: "text",
      },
      {
        header: "Port",
        accessorKey: "tls",
        id: "port",
        cell: ({ row }) => (row.original.tls ? "993" : "110"),
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <div className="space-x-4 flex flex-row">
            <button
              type="button"
              onClick={() => deleteItem(row.original.id)}
              className="rounded bg-red-600 py-1 px-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  useEffect(() => {
    fetchQueues();
  }, [fetchWithAuth]);

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Email Queues
            </h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-gray-700 dark:text-white">
                  A list of the mailboxes you are listening to. These will
                  automatically create tickets and can be accessed down the
                  side navigation.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link
                  to="/admin/email-queues/new"
                  className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  New Queue
                </Link>
              </div>
            </div>
            <div className="py-4">
              {queues === null && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2>Loading queues...</h2>
                </div>
              )}
              {queues && queues.length === 0 && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2>No queues found</h2>
                </div>
              )}
              {queues && queues.length > 0 && (
                <div className="hidden sm:block">
                  <Table columns={columns} data={queues} />
                </div>
              )}
              {queues && queues.length > 0 && (
                <div className="sm:hidden">
                  {queues.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col text-center bg-white rounded-lg shadow mt-4"
                    >
                      <div className="flex-1 flex flex-col p-8">
                        <h3 className="text-gray-900 text-sm font-medium">{item.name}</h3>
                        <dl className="mt-1 flex-grow flex flex-col justify-between">
                          <dd className="text-gray-500 text-sm">{item.username}</dd>
                          <dd className="mt-1 text-gray-500 text-sm">{item.hostname}</dd>
                          <dd className="mt-1 text-gray-500 text-sm">
                            Port: {item.tls ? "993" : "110"}
                          </dd>
                        </dl>
                      </div>
                      <div className="space-x-4 flex flex-row justify-center -mt-8 mb-4">
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="rounded bg-red-600 py-1 px-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EmailQueuesList;