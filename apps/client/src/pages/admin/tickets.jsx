// src/pages/admin/tickets.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import moment from "moment";
import { useUser } from "../../store/session";

const fetchAllTickets = async (fetchWithAuth) => {
  const response = await fetchWithAuth("/v1/ticket/tickets/all");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

const fetchSingleTicket = async (id, fetchWithAuth) => {
  const response = await fetchWithAuth(`/v1/ticket/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch ticket: ${response.statusText}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Failed to load ticket");
  return result; // { ticket, comments }
};

const DefaultColumnFilter = ({ column }) => (
  <input
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    value={column.getFilterValue() ?? ""}
    onChange={(e) => column.setFilterValue(e.target.value)}
    placeholder="Filter..."
  />
);

const Tickets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, fetchWithAuth } = useUser();

  // LIST MODE
  const listQuery = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => fetchAllTickets(fetchWithAuth),
    enabled: !!fetchWithAuth && !!user && !id,
    retry: 1,
    onError: (err) => {
      toast.error(`Failed: ${err.message}`);
      if (err.message.includes("401")) navigate("/auth/login");
    },
  });

  // SINGLE TICKET MODE
  const singleQuery = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchSingleTicket(id, fetchWithAuth),
    enabled: !!fetchWithAuth && !!id,
    retry: 1,
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
      navigate("/admin/tickets");
    },
  });

  const priorityBadge = {
    low: "bg-blue-100 text-blue-800",
    normal: "bg-green-100 text-green-800",
    high: "bg-red-100 text-red-800",
  };

  const statusBadge = {
    true: "bg-green-100 text-green-800",
    false: "bg-yellow-100 text-yellow-800",
  };

  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.accessor("number", {
        header: "#",
        cell: (info) => <span className="font-mono text-xs">#{info.getValue()}</span>,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "client.name",
        header: "Client",
        cell: (info) => info.row.original.clientId?.name || "—",
      }),
      columnHelper.display({
        id: "assignedTo.name",
        header: "Assignee",
        cell: (info) => info.row.original.assignedTo?.name || "Unassigned",
      }),
      columnHelper.accessor("priority", {
        header: "Priority",
        cell: (info) => {
          const value = info.getValue()?.toLowerCase();
          const badge = priorityBadge[value] || priorityBadge.normal;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge}`}>
              {info.getValue() || "Normal"}
            </span>
          );
        },
      }),
      columnHelper.accessor("isComplete", {
        header: "Status",
        cell: (info) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[info.getValue()]}`}>
            {info.getValue() ? "Closed" : "Open"}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => moment(info.getValue()).format("DD MMM YYYY"),
      }),
    ],
    []
  );

  const tickets = listQuery.data?.tickets || [];
  const ticketData = singleQuery.data;
  const ticket = ticketData?.ticket;
  const comments = ticketData?.comments || [];

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleRowClick = (ticket) => {
    navigate(`/admin/tickets/${ticket._id}`);
  };

  if (authLoading || (id ? singleQuery.isPending : listQuery.isPending)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (id ? singleQuery.isError : listQuery.isError) {
    return <div className="text-center py-12 text-red-600">Failed to load.</div>;
  }

  // SINGLE TICKET VIEW
  if (id && ticket) {
    return (
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate("/admin/tickets")}
            className="mb-6 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Back to All Tickets
          </button>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">#{ticket.number}</h1>
                <h2 className="text-xl text-gray-700 mt-1">{ticket.title}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.isComplete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {ticket.isComplete ? "Closed" : "Open"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{ticket.clientId?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assignee</p>
                <p className="font-medium">{ticket.assignedTo?.name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium capitalize">{ticket.priority || "Normal"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{moment(ticket.createdAt).format("DD MMM YYYY, HH:mm")}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Details</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: ticket.detail || "No details provided." }}
              />
            </div>

            {comments.length > 0 && (
              <div className="border-t mt-6 pt-6">
                <h3 className="text-lg font-semibold mb-3">Comments ({comments.length})</h3>
                <div className="space-y-4">
                  {comments.map((c, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium">{c.user?.name || "Agent"}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {moment(c.createdAt).format("DD MMM YYYY, HH:mm")}
                      </p>
                      <p className="mt-2 text-gray-800 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // LIST VIEW
  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Tickets</h1>
          <div className="mt-3 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {tickets.length} Total
            </span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tickets yet</h3>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanFilter() && (
                            <div className="mt-1">
                              <DefaultColumnFilter column={header.column} />
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row.original)}
                      className="hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {table.getPageCount() > 1 && (
                <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                  <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                  <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-4 py-2 border rounded-md text-sm disabled:opacity-50">
                    Next
                  </button>
                </nav>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {tickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => handleRowClick(t)}
                  className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">#{t.number} {t.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {t.clientId?.name || "—"} • {t.assignedTo?.name || "Unassigned"}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[t.isComplete]}`}>
                      {t.isComplete ? "Closed" : "Open"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {moment(t.createdAt).format("DD MMM YYYY")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Tickets;