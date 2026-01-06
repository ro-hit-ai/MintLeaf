// src/layouts/portalLayout.jsx
import React, { useEffect, useMemo } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";

import Header from "./Header.jsx";
import ThemeSettings from "../components/ThemeSettings";
import AccountDropdown from "../components/AccountDropdown";
import { useUser } from "../store/session.jsx";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  useSidebar,
} from "../shadcn/ui/sidebar.jsx";

import { Mail, User, Settings as SettingsIcon, Ticket } from "lucide-react";

const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION || "1.0.0";

export default function PortalLayout() {
  const { user, loading, role, imap_enabled } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // Guards
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.isAgent) return <Navigate to="/agents" replace />;

  // Auto /portal → inbox or tickets
  useEffect(() => {
    if (location.pathname === "/portal") {
      const target = imap_enabled ? "/portal/inbox" : "/portal/tickets";
      navigate(target, { replace: true });
    }
  }, [location.pathname, imap_enabled, navigate]);

  // NAV ITEMS
  const navigation = useMemo(() => {
    const items = [];

    if (imap_enabled) {
      items.push({
        title: "Inbox",
        href: "/portal/inbox",
        icon: Mail,
        active: location.pathname === "/portal/inbox",
      });
    }

    items.push({
      title: "Tickets",
      href: "/portal/tickets",
      icon: Ticket,
      active: location.pathname.startsWith("/portal/tickets"),
      children: [
        { title: "All Tickets", href: "/portal/tickets" },
        { title: "New Ticket", href: "/portal/tickets/new" },
      ],
    });

    items.push({
      title: "Profile",
      href: "/portal/profile",
      icon: User,
      active: location.pathname === "/portal/profile",
    });

    if (role === "admin") {
      items.push({
        title: "Admin Panel",
        href: "/admin",
        icon: SettingsIcon,
        active: location.pathname.startsWith("/admin"),
      });
    }

    return items;
  }, [location.pathname, imap_enabled, role]);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* LEFT: SIDEBAR */}
      <Sidebar>
        <SidebarHeader>
          {/* Freshdesk-style brand block */}
          {open ? (
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-md flex items-center justify-center font-semibold text-xs"
                style={{ backgroundColor: "var(--fd-primary)", color: "#fff" }}
              >
                GR
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold">
                  Grassroots Support
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Customer Portal
                </span>
              </div>
            </div>
          ) : (
            <div
              className="h-9 w-9 rounded-md flex items-center justify-center font-semibold text-xs"
              style={{ backgroundColor: "var(--fd-primary)", color: "#fff" }}
            >
              GR
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navigation.map((nav) => (
              <SidebarMenuItem key={nav.title}>
                <SidebarMenuButton
                  active={nav.active}
                  onClick={() => {
                    if (!nav.children) navigate(nav.href);
                  }}
                  tooltip={nav.title}
                >
                  <nav.icon className="h-4 w-4" />
                  <span className="truncate">{nav.title}</span>
                </SidebarMenuButton>

                {open && nav.children && (
                  <SidebarMenuSub>
                    {nav.children.map((sub) => (
                      <SidebarMenuSubButton
                        key={sub.href}
                        active={location.pathname === sub.href}
                        onClick={() => navigate(sub.href)}
                        tooltip={sub.title}
                      >
                        <span className="truncate">{sub.title}</span>
                      </SidebarMenuSubButton>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-3">
            <ThemeSettings />
            <span className="text-[11px] text-muted-foreground text-center">
              Version {CLIENT_VERSION}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* RIGHT: MAIN AREA */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header user={user} />

        <main className="flex-1 p-4 overflow-y-auto bg-muted/40">
          <Outlet />
        </main>

        <footer className="flex justify-end items-center gap-2 p-2 border-t bg-background/80 backdrop-blur">
          <span className="rounded bg-primary/10 px-3 py-1 text-xs text-primary">
            Version {CLIENT_VERSION}
          </span>
          <AccountDropdown user={user} />
        </footer>
      </div>
    </div>
  );
}
