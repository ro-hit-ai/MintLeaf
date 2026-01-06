import moment from "moment";
import React, { useMemo } from "react";
import { useQuery } from "react-query";
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useTable,
} from "react-table";
import TicketsMobileList from "./TicketsMobileList"; // Adjust path as needed

// Fetch tickets (replace with your API endpoint and token logic)
const fetchALLTIckets = async () => {
  const token = localStorage.getItem("session") || ""; // Replace with your token retrieval logic
  const res = await fetch("https://your-api-endpoint/tickets/all/admin", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return res.json();
};

// Default column filter component
function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
  return (
    <input
      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
      type="text"
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value || undefined)}
      placeholder="Type to filter"
    />
  );
}

// Table component
function Table({ columns, data }) {
  const filterTypes = useMemo(
    () => ({
      text: (rows, id, filterValue) =>
        rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        }),
    }),
    []
  );

  const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      initialState: { pageIndex: 0 },
    },
    useFilters,
    useGlobalFilter,
    usePagination
  );

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="shadow overflow-hidden border-b border-gray-200 md:rounded-lg">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.headers.map((header) => header.id).join("")}
                >
                  {headerGroup.headers.map((column) =>
                    column.hideHeader === false ? null : (
                      <th
                        {...column.getHeaderProps()}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.render("Header")}
                        <div>{column.canFilter ? column.render("Filter") : null}</div>
                      </th>
                    )
                  )}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="bg-white">
                    {row.cells.map((cell) => (
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                        {...cell.getCellProps()}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
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
                    id="location"
                    name="location"
                    className="block w-full pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[10, 20, 30, 40, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
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
                  disabled={!canPreviousPage}
                >
                  Previous
                </button>
                <button
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  type="button"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
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
}

export default function AdminTicketLayout() {
  const { data, status, error, refetch } = useQuery("fetchallTickets", fetchALLTIckets, {
    retry: 1, // Optional: limit retries for failed requests
  });

  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  const columns = useMemo(
    () => [
      {
        Header: "Type",
        accessor: "type",
        id: "type",
        width: 50,
      },
      {
        Header: "Summary",
        accessor: "title",
        id: "summary",
        Cell: ({ row, value }) => (
          <span className="max-w-[240px] truncate">{value}</span>
        ),
      },
      {
        Header: "Assignee",
        accessor: "assignedTo.name",
        id: "assignee",
        Cell: ({ row, value }) => (
          <span className="w-[80px] truncate">{value ? value : "n/a"}</span>
        ),
      },
      {
        Header: "Client",
        accessor: "client.name",
        id: "client",
        Cell: ({ row, value }) => (
          <span className="w-[80px] truncate">{value ? value : "n/a"}</span>
        ),
      },
      {
        Header: "Priority",
        accessor: "priority",
        id: "priority",
        Cell: ({ row, value }) => {
          let badge;
          if (value === "Low") badge = low;
          if (value === "Normal") badge = normal;
          if (value === "High") badge = high;

          return (
            <span
              className={`inline-flex items-center rounded-md justify-center w-1/2 px-2 py-1 text-xs font-medium ring-1 ring-inset ${badge}`}
            >
              {value}
            </span>
          );
        },
      },
      {
        Header: "Status",
        accessor: "status",
        id: "status",
        Cell: ({ row, value }) => (
          <span
            className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-red-600/10"
          >
            {value === "needs_support" && "Needs Support"}
            {value === "in_progress" && "In Progress"}
            {value === "in_review" && "In Review"}
            {value === "done" && "Done"}
          </span>
        ),
      },
      {
        Header: "Created",
        accessor: "createdAt",
        id: "created",
        Cell: ({ row, value }) => {
          const now = moment(value).format("DD/MM/YYYY");
          return <span>{now}</span>;
        },
      },
    ],
    []
  );

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      {status === "success" && (
        <>
          {data.tickets && data.tickets.length > 0 ? (
            <>
              <div className="hidden sm:block">
                <Table columns={columns} data={data.tickets} />
              </div>
              <div className="sm:hidden">
                <TicketsMobileList tickets={data.tickets} />
              </div>
            </>
          ) : (
            <div className="text-center mt-72">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                You currently don't have any assigned tickets. :)
              </h3>
            </div>
          )}
        </>
      )}
    </>
  );
}