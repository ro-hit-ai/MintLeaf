// src/shadcn/ui/sidebar.jsx
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { PanelLeft } from "lucide-react";
import { Button } from "./button";
import { Separator } from "./separator";

// simple class join
const cn = (...classes) => classes.filter(Boolean).join(" ");

/* ---------------------------- MOBILE DETECT ---------------------------- */

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
};

/* ---------------------------- CONTEXT ---------------------------- */

const SidebarContext = React.createContext(null);

export const useSidebar = () => {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
};

export const SidebarProvider = ({ children }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(true); // desktop
  const [openMobile, setOpenMobile] = React.useState(false); // mobile drawer

  const toggleSidebar = () => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen((v) => !v);
  };

  return (
    <SidebarContext.Provider
      value={{ isMobile, open, setOpen, openMobile, setOpenMobile, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

/* ---------------------------- SIDEBAR ---------------------------- */

export const Sidebar = ({ children }) => {
  const { isMobile, openMobile, setOpenMobile, open } = useSidebar();

  // MOBILE → drawer
  if (isMobile) {
    return (
      <Dialog.Root open={openMobile} onOpenChange={setOpenMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl outline-none border-r"
            style={{
              backgroundColor: "hsl(var(--sidebar-background))",
              color: "hsl(var(--sidebar-foreground))",
              borderColor: "hsl(var(--sidebar-border))",
            }}
          >
            <Dialog.Title className="sr-only">Sidebar</Dialog.Title>
            <Dialog.Description className="sr-only">
              Navigation
            </Dialog.Description>

            <button
              className="absolute top-4 right-4 rounded-md px-2 py-1 text-xs hover:bg-muted"
              onClick={() => setOpenMobile(false)}
            >
              ✕
            </button>

            <div className="h-full flex flex-col">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // DESKTOP → collapsible
  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-screen transition-all duration-200 border-r",
        open ? "w-64" : "w-16"
      )}
      style={{
        backgroundColor: "hsl(var(--sidebar-background))",
        color: "hsl(var(--sidebar-foreground))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      {children}
    </div>
  );
};

/* ---------------------------- LAYOUT SECTIONS ---------------------------- */

export const SidebarHeader = ({ children }) => {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "px-3 py-3 border-b flex items-center",
        !open && "justify-center"
      )}
      style={{ borderColor: "hsl(var(--sidebar-border))" }}
    >
      {children}
    </div>
  );
};

export const SidebarContent = ({ children }) => (
  <div className="flex-1 overflow-y-auto px-2 py-3">{children}</div>
);

export const SidebarFooter = ({ children }) => (
  <div
    className="px-3 py-3 border-t"
    style={{ borderColor: "hsl(var(--sidebar-border))" }}
  >
    {children}
  </div>
);

export const SidebarSeparator = () => (
  <Separator
    className="my-2"
    style={{ backgroundColor: "hsl(var(--sidebar-border))" }}
  />
);

/* ---------------------------- MENU ---------------------------- */

export const SidebarMenu = ({ children }) => (
  <nav className="flex flex-col gap-1">{children}</nav>
);

export const SidebarMenuItem = ({ children }) => (
  <div className="flex flex-col">{children}</div>
);

export const SidebarMenuButton = ({ children, active, onClick, tooltip }) => {
  const { open, isMobile } = useSidebar();
  const showText = open || isMobile;

  const childArray = React.Children.toArray(children);
  const content = showText ? children : childArray[0]; // icon-only when collapsed

  return (
    <button
      onClick={onClick}
      title={!showText ? tooltip : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !showText && "justify-center px-2"
      )}
      style={
        active
          ? {
              boxShadow: "inset 2px 0 0 hsl(var(--primary))",
            }
          : undefined
      }
    >
      {content}
    </button>
  );
};

export const SidebarMenuSub = ({ children }) => (
  <div
    className="ml-4 mt-1 flex flex-col gap-1 border-l pl-3"
    style={{ borderColor: "hsl(var(--sidebar-border))" }}
  >
    {children}
  </div>
);

export const SidebarMenuSubItem = ({ children }) => (
  <div className="flex flex-col">{children}</div>
);

export const SidebarMenuSubButton = ({
  children,
  active,
  onClick,
  tooltip,
}) => {
  const { open, isMobile } = useSidebar();
  const showText = open || isMobile;

  return (
    <button
      onClick={onClick}
      title={!showText ? tooltip : undefined}
      className={cn(
        "flex items-center gap-2 px-2 py-1 text-xs rounded-md",
        active
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
};

/* ---------------------------- TRIGGER & GROUP ---------------------------- */

export const SidebarTrigger = ({ className }) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={toggleSidebar}
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
};

export const SidebarGroup = ({ children }) => (
  <div className="px-2 py-1">{children}</div>
);
