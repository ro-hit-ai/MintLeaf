const ViewMode = ['list', 'kanban'];

const KanbanGrouping = ['status', 'priority', 'type', 'assignee'];

const SortOption = ['newest', 'oldest', 'priority', 'title'];

const Team = {
  id: "",
  name: ""
};

const User = {
  id: "",
  name: ""
};

const Ticket = {
  id: "",
  Number: 0,
  title: "",
  priority: "",
  type: "",
  status: "",
  createdAt: "",
  team: null,
  assignedTo: null,
  isComplete: false
};

const KanbanColumn = {
  id: "",
  title: "",
  color: "",
  tickets: []
};

const UISettings = {
  showAvatars: false,
  showDates: false,
  showPriority: false,
  showType: false,
  showTicketNumbers: false
};
