// src/pages/portal/tickets/search.jsx
import React, { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../store/session";
import { useNavigate } from "react-router-dom";

const TicketSearch = () => {
  const { fetchWithAuth } = useUser();
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth("/v1/ticket/tickets/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`Failed to search tickets: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setTickets(result.tickets);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      setError("Failed to search tickets");
      toast.error(`Error searching tickets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (id) => navigate(`/portal/tickets/${id}`);

  const hasResults = !loading && !error && tickets.length > 0;
  const hasSearched = !!query.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Search Tickets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Find tickets by subject, number, or other keywords.
            </p>
          </div>
        </div>
      </div>

      {/* Search Card */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, ticket number, or other text…"
              className="w-full pl-9 pr-24 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTickets([]);
                  setError(null);
                }}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Search
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Tip: Try searching for part of the subject line or ticket number
            (e.g.{" "}
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
              #1234
            </span>
            ).
          </p>
        </form>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-3" />
            Searching tickets…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && !hasResults && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-sm">
            <Search className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">Start by searching</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Enter a ticket subject, number, or keyword to quickly locate a
              specific ticket.
            </p>
          </div>
        )}

        {!loading && !error && !hasResults && hasSearched && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-sm">
            <Search className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">
              No tickets found for “{query}”.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try a different keyword, remove filters, or search by ticket
              number.
            </p>
          </div>
        )}

        {hasResults && (
          <div className="space-y-3">
            <div className="text-[11px] text-slate-500">
              Found{" "}
              <span className="font-semibold text-slate-700">
                {tickets.length}
              </span>{" "}
              matching ticket{tickets.length !== 1 ? "s" : ""}.
            </div>
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li
                  key={ticket._id}
                  className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 hover:shadow-sm transition-all"
                  onClick={() => handleViewTicket(ticket._id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span className="line-clamp-1">{ticket.title}</span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{ticket.number}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ticket.client?.name || ticket.email || "Unknown client"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 border ${
                          ticket.priority === "high"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : ticket.priority === "medium"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        Priority: {ticket.priority}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 border ${
                          ticket.isComplete
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {ticket.isComplete ? "Closed" : "Open"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketSearch;