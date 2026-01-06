import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Loader from "react-spinners/ClipLoader";

import { toast } from "@/shadcn/hooks/use-toast";
import { cn } from "@/shadcn/lib/utils";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shadcn/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { getCookie } from "cookies-next";
import { CheckIcon, Filter, X } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useQuery } from "react-query";
import { useUser } from "../../store/session";

async function getUserTickets(token) {
  const res = await fetch(`/api/v1/tickets/user/open`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

const FilterBadge = ({
  text,
  onRemove,
}) => React.createElement("div", { className: "flex items-center gap-1 bg-accent rounded-md px-2 py-1 text-xs" },
  React.createElement("span", null, text),
  React.createElement("button", {
    onClick: (e) => {
      e.preventDefault();
      onRemove();
    },
    className: "hover:bg-muted rounded-full p-0.5"
  },
    React.createElement(X, { className: "h-3 w-3" })
  )
);

export default function Tickets() {
  const router = useRouter();
  const { t } = useTranslation("peppermint");

  const token = getCookie("session");
  const { data, status, error, refetch } = useQuery(
    "allusertickets",
    () => getUserTickets(token),
    {
      refetchInterval: 5000,
    }
  );

  const user = useUser();

  const high = "bg-red-100 text-red-800";
  const low = "bg-blue-100 text-blue-800";
  const normal = "bg-green-100 text-green-800";

  const [filterSelected, setFilterSelected] = useState();
  const [selectedPriorities, setSelectedPriorities] = useState(() => {
    const saved = localStorage.getItem("open_selectedPriorities");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const saved = localStorage.getItem("open_selectedStatuses");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAssignees, setSelectedAssignees] = useState(() => {
    const saved = localStorage.getItem("open_selectedAssignees");
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    localStorage.setItem(
      "open_selectedPriorities",
      JSON.stringify(selectedPriorities)
    );
  }, [selectedPriorities]);

  useEffect(() => {
    localStorage.setItem(
      "open_selectedStatuses",
      JSON.stringify(selectedStatuses)
    );
  }, [selectedStatuses]);

  useEffect(() => {
    localStorage.setItem(
      "open_selectedAssignees",
      JSON.stringify(selectedAssignees)
    );
  }, [selectedAssignees]);

  const clearAllFilters = () => {
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setSelectedAssignees([]);
    localStorage.removeItem("open_selectedPriorities");
    localStorage.removeItem("open_selectedStatuses");
    localStorage.removeItem("open_selectedAssignees");
  };

  const handlePriorityToggle = (priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const handleStatusToggle = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleAssigneeToggle = (assignee) => {
    setSelectedAssignees((prev) =>
      prev.includes(assignee)
        ? prev.filter((a) => a !== assignee)
        : [...prev, assignee]
    );
  };

  const filteredTickets = data
    ? data.tickets.filter((ticket) => {
        const priorityMatch =
          selectedPriorities.length === 0 ||
          selectedPriorities.includes(ticket.priority);
        const statusMatch =
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(ticket.isComplete ? "closed" : "open");
        const assigneeMatch =
          selectedAssignees.length === 0 ||
          selectedAssignees.includes(ticket.assignedTo?.name || "Unassigned");

        return priorityMatch && statusMatch && assigneeMatch;
      })
    : [];

  const [activeFilter, setActiveFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");

  const filteredPriorities = useMemo(() => {
    const priorities = ["low", "medium", "high"];
    return priorities.filter((priority) =>
      priority.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [filterSearch]);

  const filteredStatuses = useMemo(() => {
    const statuses = ["open", "closed"];
    return statuses.filter((status) =>
      status.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [filterSearch]);

  const filteredAssignees = useMemo(() => {
    const assignees = data?.tickets
      .map((t) => t.assignedTo?.name || "Unassigned")
      .filter((name, index, self) => self.indexOf(name) === index);
    return assignees?.filter((assignee) =>
      assignee.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [data?.tickets, filterSearch]);

  async function fetchUsers() {
    await fetch(`/api/v1/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res) {
          setUsers(res.users);
        }
      });
  }

  async function updateTicketStatus(e, ticket) {
    await fetch(`/api/v1/ticket/status/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: ticket.id, status: !ticket.isComplete }),
    })
      .then((res) => res.json())
      .then(() => {
        toast({
          title: ticket.isComplete ? "Issue re-opened" : "Issue closed",
          description: "The status of the issue has been updated.",
          duration: 3000,
        });
        refetch();
      });
  }

  // Add these new functions
  async function updateTicketAssignee(ticketId, user) {
    try {
      const response = await fetch(`/api/v1/ticket/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: user ? user.id : undefined,
          id: ticketId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update assignee");

      toast({
        title: "Assignee updated",
        description: `Transferred issue successfully`,
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignee",
        variant: "destructive",
        duration: 3000,
      });
    }
  }

  async function updateTicketPriority(ticket, priority) {
    try {
      const response = await fetch(`/api/v1/ticket/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: ticket.id,
          detail: ticket.detail,
          note: ticket.note,
          title: ticket.title,
          priority: priority,
          status: ticket.status,
        }),
      }).then((res) => res.json());

      if (!response.success) throw new Error("Failed to update priority");

      toast({
        title: "Priority updated",
        description: `Ticket priority set to ${priority}`,
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
        duration: 3000,
      });
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return React.createElement("div", null,
    status === "loading" && React.createElement("div", { className: "flex flex-col justify-center items-center h-screen" },
      React.createElement(Loader, { color: "green", size: 100 })
    ),
    status === "success" && React.createElement("div", null,
      React.createElement("div", { className: "flex flex-col" },
        React.createElement("div", { className: "py-2 px-3 bg-background border-b-[1px] flex flex-row items-center justify-between" },
          React.createElement("div", { className: "flex flex-row items-center gap-2" },
            React.createElement(Popover, null,
              React.createElement(PopoverTrigger, { asChild: true },
                React.createElement(Button, {
                  variant: "ghost",
                  size: "sm",
                  className: "h-6 bg-transparent"
                },
                  React.createElement(Filter, { className: "mr-2 h-4 w-4" }),
                  React.createElement("span", { className: "hidden sm:block" }, "Filters")
                )
              ),
              React.createElement(PopoverContent, { className: "w-[300px] p-0", align: "start" },
                !activeFilter ? React.createElement(Command, null,
                  React.createElement(CommandInput, { placeholder: "Search filters..." }),
                  React.createElement(CommandList, null,
                    React.createElement(CommandEmpty, null, "No results found."),
                    React.createElement(CommandGroup, null,
                      React.createElement(CommandItem, {
                        onSelect: () => setActiveFilter("priority")
                      }, "Priority"),
                      React.createElement(CommandItem, {
                        onSelect: () => setActiveFilter("status")
                      }, "Status"),
                      React.createElement(CommandItem, {
                        onSelect: () => setActiveFilter("assignee")
                      }, "Assigned To")
                    )
                  )
                ) : activeFilter === "priority" ? React.createElement(Command, null,
                  React.createElement(CommandInput, {
                    placeholder: "Search priority...",
                    value: filterSearch,
                    onValueChange: setFilterSearch
                  }),
                  React.createElement(CommandList, null,
                    React.createElement(CommandEmpty, null, "No priorities found."),
                    React.createElement(CommandGroup, { heading: "Priority" },
                      filteredPriorities.map((priority) =>
                        React.createElement(CommandItem, {
                          key: priority,
                          onSelect: () => handlePriorityToggle(priority)
                        },
                          React.createElement("div", {
                            className: cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedPriorities.includes(priority)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )
                          },
                            React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                          ),
                          React.createElement("span", { className: "capitalize" }, priority)
                        )
                      )
                    ),
                    React.createElement(CommandSeparator, null),
                    React.createElement(CommandGroup, null,
                      React.createElement(CommandItem, {
                        onSelect: () => {
                          setActiveFilter(null);
                          setFilterSearch("");
                        },
                        className: "justify-center text-center"
                      }, "Back to filters")
                    )
                  )
                ) : activeFilter === "status" ? React.createElement(Command, null,
                  React.createElement(CommandInput, {
                    placeholder: "Search status...",
                    value: filterSearch,
                    onValueChange: setFilterSearch
                  }),
                  React.createElement(CommandList, null,
                    React.createElement(CommandEmpty, null, "No statuses found."),
                    React.createElement(CommandGroup, { heading: "Status" },
                      filteredStatuses.map((status) =>
                        React.createElement(CommandItem, {
                          key: status,
                          onSelect: () => handleStatusToggle(status)
                        },
                          React.createElement("div", {
                            className: cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedStatuses.includes(status)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )
                          },
                            React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                          ),
                          React.createElement("span", { className: "capitalize" }, status)
                        )
                      )
                    ),
                    React.createElement(CommandSeparator, null),
                    React.createElement(CommandGroup, null,
                      React.createElement(CommandItem, {
                        onSelect: () => {
                          setActiveFilter(null);
                          setFilterSearch("");
                        },
                        className: "justify-center text-center"
                      }, "Back to filters")
                    )
                  )
                ) : activeFilter === "assignee" ? React.createElement(Command, null,
                  React.createElement(CommandInput, {
                    placeholder: "Search assignee...",
                    value: filterSearch,
                    onValueChange: setFilterSearch
                  }),
                  React.createElement(CommandList, null,
                    React.createElement(CommandEmpty, null, "No assignees found."),
                    React.createElement(CommandGroup, { heading: "Assigned To" },
                      filteredAssignees?.map((name) =>
                        React.createElement(CommandItem, {
                          key: name,
                          onSelect: () => handleAssigneeToggle(name)
                        },
                          React.createElement("div", {
                            className: cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedAssignees.includes(name)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )
                          },
                            React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                          ),
                          React.createElement("span", null, name)
                        )
                      )
                    ),
                    React.createElement(CommandSeparator, null),
                    React.createElement(CommandGroup, null,
                      React.createElement(CommandItem, {
                        onSelect: () => {
                          setActiveFilter(null);
                          setFilterSearch("");
                        },
                        className: "justify-center text-center"
                      }, "Back to filters")
                    )
                  )
                ) : null
              )
            ),
            React.createElement("div", { className: "flex flex-wrap gap-2" },
              selectedPriorities.map((priority) =>
                React.createElement(FilterBadge, {
                  key: `priority-${priority}`,
                  text: `Priority: ${priority}`,
                  onRemove: () => handlePriorityToggle(priority)
                })
              ),
              selectedStatuses.map((status) =>
                React.createElement(FilterBadge, {
                  key: `status-${status}`,
                  text: `Status: ${status}`,
                  onRemove: () => handleStatusToggle(status)
                })
              ),
              selectedAssignees.map((assignee) =>
                React.createElement(FilterBadge, {
                  key: `assignee-${assignee}`,
                  text: `Assignee: ${assignee}`,
                  onRemove: () => handleAssigneeToggle(assignee)
                })
              ),
              (selectedPriorities.length > 0 ||
                selectedStatuses.length > 0 ||
                selectedAssignees.length > 0) && React.createElement(Button, {
                variant: "ghost",
                size: "sm",
                className: "h-6 px-2 text-xs",
                onClick: clearAllFilters
              }, "Clear all")
            )
          ),
          React.createElement("div", null)
        ),
        filteredTickets.length > 0 ? filteredTickets.map((ticket) => {
          let p = ticket.priority;
          let badge;

          if (p === "Low") {
            badge = low;
          }
          if (p === "Normal") {
            badge = normal;
          }
          if (p === "high") {
            badge = high;
          }

          return React.createElement(ContextMenu, null,
            React.createElement(ContextMenuTrigger, null,
              React.createElement(Link, { href: `/issue/${ticket.id}` },
                React.createElement("div", { className: "flex flex-row w-full bg-white dark:bg-[#0A090C] dark:hover:bg-green-600 border-b-[1px] p-1.5 justify-between px-6 hover:bg-gray-100" },
                  React.createElement("div", { className: "flex flex-row items-center space-x-4" },
                    React.createElement("span", { className: "text-xs font-semibold" }, "#" + ticket.Number),
                    React.createElement("span", { className: "text-xs font-semibold" }, ticket.title)
                  ),
                  React.createElement("div", { className: "flex flex-row space-x-3 items-center" },
                    React.createElement("div", null,
                      React.createElement("span", { className: "text-xs" }, moment(ticket.createdAt).format("DD/MM/yyyy"))
                    ),
                    React.createElement("div", null,
                      React.createElement("span", {
                        className: "inline-flex items-center rounded-md px-2 py-1 capitalize justify-center w-20 text-xs font-medium ring-1 ring-inset ring-gray-500/10 bg-orange-400 text-white"
                      }, ticket.type)
                    ),
                    React.createElement("div", null,
                      ticket.isComplete === true ? React.createElement("div", null,
                        React.createElement("span", {
                          className: "inline-flex items-center gap-x-1.5 rounded-md bg-red-100 px-2 w-20 justify-center py-1 text-xs ring-1 ring-inset ring-gray-500/10 font-medium text-red-700"
                        },
                          React.createElement("svg", {
                            className: "h-1.5 w-1.5 fill-red-500",
                            viewBox: "0 0 6 6",
                            "aria-hidden": "true"
                          },
                            React.createElement("circle", { cx: 3, cy: 3, r: 3 })
                          ),
                          t("closed")
                        )
                      ) : React.createElement(React.Fragment, null,
                        React.createElement("span", {
                          className: "inline-flex items-center gap-x-1.5 rounded-md w-20 justify-center font-medium bg-green-100 ring-1 ring-inset ring-gray-500/10 px-2 py-1 text-xs text-green-700"
                        },
                          React.createElement("svg", {
                            className: "h-1.5 w-1.5 fill-green-500",
                            viewBox: "0 0 6 6",
                            "aria-hidden": "true"
                          },
                            React.createElement("circle", { cx: 3, cy: 3, r: 3 })
                          ),
                          t("open")
                        )
                      )
                    ),
                    React.createElement("div", null,
                      React.createElement("span", {
                        className: `inline-flex items-center rounded-md px-2 py-1 capitalize justify-center w-20 text-xs font-medium ring-1 ring-inset ring-gray-500/10 ${badge}`
                      }, ticket.priority)
                    ),
                    React.createElement("span", { className: "inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500" },
                      React.createElement("span", {
                        className: "text-[11px] font-medium leading-none text-white uppercase"
                      }, ticket.assignedTo ? ticket.assignedTo.name[0] : "")
                    )
                  )
                )
              )
            ),
            React.createElement(ContextMenuContent, { className: "w-52" },
              React.createElement(ContextMenuItem, {
                onClick: (e) => updateTicketStatus(e, ticket)
              }, ticket.isComplete ? "Re-open Issue" : "Close Issue"),
              React.createElement(ContextMenuSeparator, null),
              React.createElement(ContextMenuSub, null,
                React.createElement(ContextMenuSubTrigger, null, "Assign To"),
                React.createElement(ContextMenuSubContent, { className: "w-64 ml-1 -mt-1/2" },
                  React.createElement(Command, null,
                    React.createElement(CommandList, null,
                      React.createElement(CommandGroup, { heading: "Assigned To" },
                        React.createElement(CommandItem, {
                          onSelect: () => updateTicketAssignee(ticket.id, undefined)
                        },
                          React.createElement("div", {
                            className: cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              ticket.assignedTo?.name === user.name
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )
                          },
                            React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                          ),
                          React.createElement("span", null, "Unassigned")
                        ),
                        users?.map((user) =>
                          React.createElement(CommandItem, {
                            key: user.id,
                            onSelect: () => updateTicketAssignee(ticket.id, user)
                          },
                            React.createElement("div", {
                              className: cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                ticket.assignedTo?.name === user.name
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )
                            },
                              React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                            ),
                            React.createElement("span", null, user.name)
                          )
                        )
                      )
                    )
                  )
                )
              ),
              React.createElement(ContextMenuSub, null,
                React.createElement(ContextMenuSubTrigger, null, "Change Priority"),
                React.createElement(ContextMenuSubContent, { className: "w-64 ml-1" },
                  React.createElement(Command, null,
                    React.createElement(CommandList, null,
                      React.createElement(CommandGroup, { heading: "Priority" },
                        filteredPriorities.map((priority) =>
                          React.createElement(CommandItem, {
                            key: priority,
                            onSelect: () => updateTicketPriority(ticket, priority)
                          },
                            React.createElement("div", {
                              className: cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                ticket.priority.toLowerCase() === priority
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )
                            },
                              React.createElement(CheckIcon, { className: cn("h-4 w-4") })
                            ),
                            React.createElement("span", { className: "capitalize" }, priority)
                          )
                        )
                      )
                    )
                  )
                )
              ),
              React.createElement(ContextMenuSeparator, null),
              React.createElement(ContextMenuItem, {
                onClick: (e) => {
                  e.preventDefault();
                  toast({
                    title: "Link copied to clipboard",
                    description: "You can now share the link with others.",
                    duration: 3000,
                  });
                  navigator.clipboard.writeText(
                    `${window.location.origin}/issue/${ticket.id}`
                  );
                }
              }, "Share Link"),
              React.createElement(ContextMenuSeparator, null),
              user.isAdmin && React.createElement(React.Fragment, null,
                React.createElement(ContextMenuSeparator, null),
                React.createElement(ContextMenuItem, {
                  className: "text-red-600",
                  onClick: (e) => {
                    e.preventDefault();
                    if (confirm("Are you sure you want to delete this ticket?")) {
                      fetch(`/api/v1/ticket/delete`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: ticket.id }),
                      }).then(() => {
                        refetch();
                      });
                    }
                  }
                }, "Delete Ticket")
              )
            )
          );
        }) : React.createElement("div", { className: "min-h-screen flex items-center justify-center" },
          React.createElement("button", {
            type: "button",
            className: "relative block w-[400px] rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            onClick: () => {
              const event = new KeyboardEvent("keydown", { key: "c" });
              document.dispatchEvent(event);
            }
          },
            React.createElement("svg", {
              className: "mx-auto h-12 w-12 text-gray-400",
              stroke: "currentColor",
              fill: "none",
              viewBox: "0 0 48 48",
              "aria-hidden": "true"
            },
              React.createElement("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
              })
            ),
            React.createElement("span", { className: "mt-2 block text-sm font-semibold text-gray-900" }, "Create your first issue")
          )
        )
      )
    )
  );
}