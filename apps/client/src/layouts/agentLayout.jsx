// src/layouts/agentLayout.jsx
import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import ThemeSettings from "../components/ThemeSettings";
import AccountDropdown from "../components/AccountDropdown";
import { Ticket } from "lucide-react";

export default function AgentsLayout() {
  const location = useLocation();

  const nav = [
    {
      title: "Tickets",
      href: "/agents/tickets?status=open", // ALWAYS correct path
      active: location.pathname.startsWith("/agents/tickets"),
      icon: Ticket,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* SIDEBAR */}
      <div className="hidden md:flex w-60 border-r flex-col bg-background">
        <div className="h-14 flex items-center px-4 border-b text-xl font-bold">
          Grassroots
        </div>

        <nav className="px-3 py-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                item.active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t">
          <ThemeSettings />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

        <footer className="flex justify-end p-2 border-t">
          <AccountDropdown />
        </footer>
      </div>
    </div>
  );
}
