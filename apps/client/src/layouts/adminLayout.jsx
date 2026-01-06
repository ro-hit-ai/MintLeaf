// AdminLayout.jsx
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import ThemeSettings from "../components/ThemeSettings";
import AccountDropdown from "../components/AccountDropdown";
import {
  ContactIcon,
  FileText,
  KeyRound,
  Mail,
  Mailbox,
  MoveLeft,
  RollerCoaster,
  UserRound,
  Webhook,
} from "lucide-react";
import { useUser } from "../store/session.jsx";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function AdminLayout({ onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Please log in</h1>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">You are not an admin</h1>
      </div>
    );
  }

  const navigation = [
    { name: "Back", href: "/", current: location.pathname === "/", icon: MoveLeft },
    {
      name: "Users",
      href: "/admin/users",
      current: location.pathname.startsWith("/admin/users"),
      icon: UserRound,
    },
    {
      name: "Clients",
      href: "/admin/clients",
      current: location.pathname.startsWith("/admin/clients"),
      icon: ContactIcon,
    },
    {
      name: "Email Queues",
      href: "/admin/email-queues",
      current: location.pathname.startsWith("/admin/email-queues"),
      icon: Mail,
    },
    {
      name: "Webhooks",
      href: "/admin/webhooks",
      current: location.pathname.startsWith("/admin/webhooks"),
      icon: Webhook,
    },
    {
      name: "SMTP Email",
      href: "/admin/smtp",
      current: location.pathname.startsWith("/admin/smtp"),
      icon: Mailbox,
    },
    {
      name: "Authentication",
      href: "/admin/authentication",
      current: location.pathname.startsWith("/admin/authentication"),
      icon: KeyRound,
    },
    {
      name: "Roles",
      href: "/admin/roles",
      current: location.pathname.startsWith("/admin/roles"),
      icon: RollerCoaster,
    },
    {
      name: "Logs",
      href: "/admin/logs",
      current: location.pathname.startsWith("/admin/logs"),
      icon: FileText,
    },
    {
      name: "Tickets",
      href: "/admin/tickets",
      current: location.pathname.startsWith("/admin/tickets"),
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      {/* Top Header */}
      <Header user={user} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1">
        {/* Mobile sidebar */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <div className="fixed inset-0 bg-gray-900/80" />
            <div className="fixed inset-0 flex">
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>

                {/* Sidebar content */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
                  <div className="flex align-middle flex-row h-14 items-center border-b-[1px]">
                    <Link to="/">
                      <span className="text-3xl ml-2 hover:text-green-600 font-bold">
                        Peppermint
                      </span>
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={classNames(
                                  item.current
                                    ? "bg-secondary dark:bg-primary"
                                    : "hover:bg-[#F0F3F9] dark:hover:bg-white dark:hover:text-gray-900",
                                  "group -mx-2 flex gap-x-3 p-1 rounded-md text-xs font-semibold leading-6"
                                )}
                                onClick={() => onNavigate && onNavigate(item.href)}
                              >
                                <item.icon className="h-4 w-4 ml-1 shrink-0 mt-1" />
                                <span className="whitespace-nowrap">{item.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                    <ThemeSettings />
                  </nav>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-64 2xl:w-72 lg:flex-col border-r">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background pb-4">
            <div className="flex align-middle flex-row h-14 items-center border-b px-6">
                        <Link to="/admin">  {/* Instead of "/" */}
                          <span className="text-3xl ml-2 hover:text-primary font-bold">Grassroots</span>
                      </Link>
            </div>
            <nav className="flex flex-1 flex-col px-6">
              <ul role="list" className="flex flex-1 flex-col gap-y-7 w-full">
                <li>
                  <ul role="list" className="-mx-2 space-y-1 w-full">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            item.current
                              ? "bg-secondary dark:bg-primary"
                              : "hover:bg-[#F0F3F9] dark:hover:bg-white dark:hover:text-gray-900",
                            "group -mx-2 flex gap-x-3 p-1 rounded-md text-xs font-semibold leading-6"
                          )}
                          onClick={() => onNavigate && onNavigate(item.href)}
                        >
                          <item.icon className="h-4 w-4 ml-1 shrink-0 mt-1" />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
              <ThemeSettings />
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 lg:pl-64 2xl:pl-72">
          <main className="flex-1 p-4 overflow-y-auto w-full">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="flex justify-end items-center gap-x-2 p-2 border-t">
            {user?.isAdmin && (
              <Link to="https://github.com/Peppermint-Lab/peppermint/releases">
                <span className="inline-flex items-center rounded-md bg-green-700/10 px-3 py-2 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-500/20">
                  Version {import.meta.env.VITE_CLIENT_VERSION || "1.0.0"}
                </span>
              </Link>
            )}
            <AccountDropdown />
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;