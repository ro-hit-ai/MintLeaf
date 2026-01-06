// src/pages/portal/tickets/summary.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import { useUser } from "../../store/session";
import { Loader2 } from "lucide-react";

const TicketSummary = () => {
  const { fetchWithAuth } = useUser();
  const [summary, setSummary] = useState({
    open: 0,
    completed: 0,
    unassigned: 0,
    userTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchWithAuth("/v1/ticket/summary");
        if (!response.ok)
          throw new Error(
            `Failed to fetch summary: ${response.statusText}`
          );
        const result = await response.json();
        if (result.success) {
          setSummary(result.summary);
        } else {
          setError(result.message);
          toast.error(result.message);
        }
      } catch (err) {
        setError("Failed to fetch summary");
        toast.error(`Error fetching summary: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [fetchWithAuth]);

  const data = [
    { name: "Open", value: summary.open },
    { name: "Completed", value: summary.completed },
    { name: "Unassigned", value: summary.unassigned },
    { name: "My Tickets", value: summary.userTickets },
  ];

  const total = summary.open + summary.completed;
  const completionRate =
    total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading ticket summary…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-center text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Ticket Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            High-level overview of ticket load, completion, and ownership.
          </p>
        </div>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] gap-5">
        {/* Stat cards */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-3">
              <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                Open Tickets
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-900">
                {summary.open}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {summary.completed}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                Unassigned
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {summary.unassigned}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                My Tickets
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.userTickets}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Completion Rate
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-slate-900">
                {completionRate}%
              </p>
              <p className="text-[11px] text-slate-500">
                {summary.completed} of {total || 0} tickets completed
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Ticket Distribution
          </p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#E5E7EB",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
                <Bar dataKey="value" name="Tickets" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSummary;