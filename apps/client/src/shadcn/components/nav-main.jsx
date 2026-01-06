// src/shadcn/components/nav-main.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// import {
//   SidebarGroup,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
//   useSidebar,
// } from "../ui/sidebar";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "../ui/sidebar";

export function NavMain({ items }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useSidebar();

  const [hideKeyboardShortcuts, setHideKeyboardShortcuts] = useState(false);

  // Load feature flags
  useEffect(() => {
    const loadFlags = () => {
      const savedFlags = localStorage.getItem("featureFlags");
      if (savedFlags) {
        const flags = JSON.parse(savedFlags);
        const hideShortcuts = flags.find(
          (f) => f.name === "Hide Keyboard Shortcuts"
        )?.enabled;
        setHideKeyboardShortcuts(hideShortcuts || false);
      }
    };

    loadFlags();
    window.addEventListener("storage", loadFlags);
    return () => window.removeEventListener("storage", loadFlags);
  }, []);

  // navigation handler
  const handleNavigation = (url) => {
    if (url) navigate(url);
  };

  // action-only key trigger
  const handleKeyboardEvent = (initial) => {
    const event = new KeyboardEvent("keydown", { key: initial });
    document.dispatchEvent(event);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const active = item.url && location.pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              {/* MAIN BUTTON */}
              <SidebarMenuButton
                tooltip={!hideKeyboardShortcuts ? item.initial : item.title}
                isActive={active}
                onClick={() => {
                  if (item.action) {
                    item.action(); // run modal/new ticket action
                  } else if (item.url) {
                    handleNavigation(item.url);
                  } else {
                    handleKeyboardEvent(item.initial);
                  }
                }}
              >
                <div className="flex flex-row items-center justify-between w-full">
                  <div className="flex flex-row items-center gap-x-2 w-full">
                    {item.icon && <item.icon className="size-4" />}
                    <span
                      className={
                        sidebar.state === "collapsed" ? "hidden" : ""
                      }
                    >
                      {item.title}
                    </span>
                  </div>

                  {!hideKeyboardShortcuts && (
                    <span
                      className={
                        sidebar.state === "collapsed" ? "hidden" : ""
                      }
                    >
                      {item.initial}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>

              {/* SUB ITEMS */}
              {item.items && (
                <SidebarMenuSub>
                  {item.items.map((sub) => {
                    const subActive = location.pathname === sub.url;

                    return (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          isActive={subActive}
                          onClick={() => handleNavigation(sub.url)}
                          className="cursor-pointer flex flex-row items-center justify-between w-full px-0 pl-2.5 text-xs"
                        >
                          <span>{sub.title}</span>
                          {!hideKeyboardShortcuts && (
                            <span className="flex h-6 w-6 justify-center">
                              {sub.initial}
                            </span>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
