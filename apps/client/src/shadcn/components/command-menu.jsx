import { Button } from "@radix-ui/themes";
import {
    AlertCircle,
    CheckCircle2,
    Circle,
    Clock,
    Plus,
    Search,
    Settings,
    SignalHigh,
    SignalLow,
    SignalMedium,
    Timer,
    Trash2,
    User,
    User2,
    UserPlus2,
} from "lucide-react";
import moment from "moment";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "../ui/command";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useTicketActions } from "../hooks/useTicketActions";

export function CommandMenu({ user, token }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Add route change handler
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const { data: ticketsData, refetch } = useQuery(
    "tickets",
    async () => {
      const response = await fetch("/api/v1/tickets/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.tickets;
    },
    {
      enabled: open, // Only fetch when command menu is open
    }
  );

  const { data: usersData } = useQuery(
    "users",
    async () => {
      const response = await fetch("/api/v1/users/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.users;
    },
    {
      enabled: open, // Only fetch when command menu is open
    }
  );

  const {
    updateTicketStatus,
    updateTicketAssignee,
    updateTicketPriority,
    deleteTicket,
  } = useTicketActions(token, refetch);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const priorities = [
    { label: "High", value: "high", icon: SignalHigh },
    { label: "Medium", value: "medium", icon: SignalMedium },
    { label: "Low", value: "low", icon: SignalLow },
  ];

  // Filter and group tickets
  const filteredAndGroupedTickets = useMemo(() => {
    if (!ticketsData) return null;

    const filtered = ticketsData.filter((ticket) => {
      const searchLower = search.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.id.toString().includes(searchLower) ||
        (ticket.detail || "").toLowerCase().includes(searchLower) ||
        (ticket.assignedTo?.name || "").toLowerCase().includes(searchLower)
      );
    });

    // Group by status
    const groups = {
      open: filtered.filter(t => !t.isComplete),
      closed: filtered.filter(t => t.isComplete),
    };

    return groups;
  }, [ticketsData, search]);

  return (
    <>
      <Button
        variant="outline"
        className="relative text-foreground hover:cursor-pointer whitespace-nowrap flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search tickets by title, ID, description, or assignee..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No tickets found.</CommandEmpty>

          {/* Quick Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate("/issues")}>
              <Circle className="mr-2 h-4 w-4" />
              <span>All Issues</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/issues/open")}>
              <Circle className="mr-2 h-4 w-4" />
              <span>Open Issues</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/issues/closed")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Closed Issues</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                // Simulate keyboard event for creating new issue
                const event = new KeyboardEvent('keydown', { key: 'c' });
                document.dispatchEvent(event);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Issue</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Enhanced Ticket Search */}
          {filteredAndGroupedTickets && (
            <>
              {/* Open Tickets */}
              {filteredAndGroupedTickets.open.length > 0 && (
                <CommandGroup heading="Open Tickets">
                  {filteredAndGroupedTickets.open.map((ticket) => (
                    <CommandItem
                      key={ticket.id}
                      onSelect={() => navigate(`/issue/${ticket.id}`)}
                      className="flex flex-col py-2 px-2 text-sm justify-start items-start hover:cursor-pointer"
                    >
                      <span>{ticket.title}</span>
                      <span className="text-xs text-muted-foreground">
                        #{ticket.id} • {ticket.assignedTo?.name || "Unassigned"} • {moment(ticket.createdAt).fromNow()}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Closed Tickets */}
              {filteredAndGroupedTickets.closed.length > 0 && (
                <CommandGroup heading="Closed Tickets">
                  {filteredAndGroupedTickets.closed.map((ticket) => (
                    <CommandItem
                      key={ticket.id}
                      onSelect={() => navigate(`/issue/${ticket.id}`)}
                      className="flex flex-col py-2 px-2 text-sm justify-start items-start hover:cursor-pointer"
                    >
                      <span>{ticket.title}</span>
                      <span className="text-xs text-muted-foreground">
                        #{ticket.id} • {ticket.assignedTo?.name || "Unassigned"} • {moment(ticket.createdAt).fromNow()}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          <CommandSeparator />

          {/* Quick Actions for Current Ticket */}
          {location.pathname.includes("/issue/") &&
            params.id &&
            ticketsData && (
              <CommandGroup heading="Ticket Actions">
                {/* Status Toggle */}
                <CommandItem
                  onSelect={() => {
                    const ticket = ticketsData.find(
                      (t) => t.id === parseInt(params.id)
                    );
                    if (ticket) {
                      updateTicketStatus(ticket);
                      setOpen(false);
                    }
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Toggle Status</span>
                </CommandItem>

                {/* Priority Actions */}
                {priorities.map((priority) => (
                  <CommandItem
                    key={priority.value}
                    onSelect={() => {
                      const ticket = ticketsData.find(
                        (t) => t.id === parseInt(params.id)
                      );
                      if (ticket) {
                        updateTicketPriority(ticket, priority.value);
                        setOpen(false);
                      }
                    }}
                  >
                    <priority.icon className="mr-2 h-4 w-4" />
                    <span>Set Priority: {priority.label}</span>
                  </CommandItem>
                ))}

                {/* Assign Actions */}
                {usersData && (
                  <CommandGroup heading="Assign To">
                    {usersData.map((userItem) => (
                      <CommandItem
                        key={userItem.id}
                        onSelect={() => {
                          if (params.id) {
                            updateTicketAssignee(
                              params.id,
                              userItem
                            );
                            setOpen(false);
                          }
                        }}
                      >
                        <UserPlus2 className="mr-2 h-4 w-4" />
                        <span>Assign to {userItem.name}</span>
                      </CommandItem>
                    ))}
                    <CommandItem
                      onSelect={() => {
                        if (params.id) {
                          updateTicketAssignee(
                            params.id,
                            undefined
                          );
                          setOpen(false);
                        }
                      }}
                    >
                      <User2 className="mr-2 h-4 w-4" />
                      <span>Unassign</span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Delete Action */}
                {user?.isAdmin && (
                  <CommandItem
                    onSelect={() => {
                      if (params.id) {
                        deleteTicket(params.id);
                        navigate("/issues");
                        setOpen(false);
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Ticket</span>
                  </CommandItem>
                )}
              </CommandGroup>
            )}

          <CommandSeparator />

          {/* Settings and Profile */}
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}