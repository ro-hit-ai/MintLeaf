// src/pages/admin/clients/index.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session"; // Updated path
import { flexRender } from "@tanstack/react-table";

const fetchClients = async (fetchWithAuth) => {
  try {
    const response = await fetchWithAuth("/v1/client/all", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`Failed to fetch clients: ${response.statusText}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch clients");
    }
    return data;
  } catch (err) {
    console.error("❌ fetchClients failed:", err.message);
    throw err;
  }
};

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

// const DefaultColumnFilter = ({ column }) => {
//   const { filterValue, setFilter } = column;
//   return (
//     <input
//       className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//       type="text"
//       value={filterValue || ""}
//       onChange={(e) => setFilter(e.target.value || undefined)}
//       placeholder="Type to filter"
//     />
//   );
// };

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
const Clients = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWithAuth } = useUser();
  const queryClient = useQueryClient();

  const { data, status, refetch } = useQuery({
    queryKey: ["fetchAllClients"],
    queryFn: () => fetchClients(fetchWithAuth),
    onError: (err) => {
      console.error("Error fetching clients:", err);
      toast.error(`Error fetching clients: ${err.message}`, { autoClose: 5000 });
      navigate("/auth/login");
    },
  });

  const deleteClient = async (id) => {
    try {
      const response = await fetchWithAuth(`/v1/clients/${id}`, { // Updated endpoint
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to delete client: ${response.statusText}`);
      const result = await response.json();
      if (result.success !== false) {
        refetch();
        toast.success("Client deleted successfully");
      } else {
        throw new Error(result.error || "Failed to delete client");
      }
    } catch (err) {
      toast.error(`Error deleting client: ${err.message}`, { autoClose: 5000 });
    }
  };

 const columns = useMemo(
  () => [
    {
      header: "Client Name",
      accessorKey: "name",
      id: "client_name",
      filterFn: "text",
    },
    {
      header: "Contact Name",
      accessorKey: "contactName",
      id: "contactName",
      filterFn: "text",
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <div className="space-x-4 flex flex-row">
          <button
            type="button"
            className="rounded bg-white hover:bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-white shadow-sm ring-1 ring-inset ring-gray-300"
            onClick={() => deleteClient(row.original.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ],
  []
);
  if (status === "pending") {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex flex-col justify-center items-center">
          <h2>Loading data...</h2>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold">Error fetching data...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Clients
            </h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-gray-700 dark:text-white">
                  A list of all internal users of your instance.
                </p>
              </div>
              <div className="sm:ml-16 mt-5 flex flex-row space-x-2">
                <Link
                  to="/submit"
                  className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-gray-300 shadow-sm text-xs rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                >
                  Guest Ticket Url
                </Link>
                <Link
                  to="/portal/"
                  className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-gray-300 shadow-sm text-xs rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                >
                  Portal Url
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-gray-300 shadow-sm text-xs rounded text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                >
                  Portal Register
                </Link>
                <Link
                  to="/admin/clients/new"
                  className="rounded bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  New Client
                </Link>
              </div>
            </div>
            <div className="py-4">
              <div className="hidden sm:block">
                <Table columns={columns} data={data?.clients || []} />
              </div>
              <div className="sm:hidden">
                {(data?.clients || []).map((client) => (
                  <div
                    key={client.id} // Updated to id
                    className="flex flex-col text-center bg-white rounded-lg shadow mt-4"
                  >
                    <div className="flex-1 flex flex-col p-8">
                      <h3 className="text-gray-900 text-sm font-medium">{client.name}</h3>
                      <dl className="mt-1 flex-grow flex flex-col justify-between">
                        <dd className="text-gray-500 text-sm">{client.number}</dd>
                        <dd className="mt-3">
                          <span>Primary Contact - {client.contactName}</span>
                        </dd>
                      </dl>
                    </div>
                    <div className="space-x-4 flex flex-row justify-center -mt-8 mb-4">
                      <button
                        type="button"
                        className="rounded bg-white hover:bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-white shadow-sm ring-1 ring-inset ring-gray-300"
                        onClick={() => deleteClient(client.id)} // Updated to id
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Clients;