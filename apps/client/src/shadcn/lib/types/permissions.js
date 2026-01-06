// Permission constants
const IssuePermissions = [
  "issue::create",
  "issue::read",
  "issue::write",
  "issue::update",
  "issue::delete",
  "issue::assign",
  "issue::transfer",
  "issue::comment",
];

const UserPermissions = [
  "user::create",
  "user::read",
  "user::update",
  "user::delete",
  "user::manage",
];

const RolePermissions = [
  "role::create",
  "role::read",
  "role::update",
  "role::delete",
  "role::manage",
];

const TeamPermissions = [
  "team::create",
  "team::read",
  "team::update",
  "team::delete",
  "team::manage",
];

const ClientPermissions = [
  "client::create",
  "client::read",
  "client::update",
  "client::delete",
  "client::manage",
];

const KnowledgeBasePermissions = [
  "kb::create",
  "kb::read",
  "kb::update",
  "kb::delete",
  "kb::manage",
];

const SystemPermissions = [
  "settings::view",
  "settings::manage",
  "webhook::manage",
  "integration::manage",
  "email_template::manage",
];

const TimeTrackingPermissions = [
  "time_entry::create",
  "time_entry::read",
  "time_entry::update",
  "time_entry::delete",
];

const DocumentPermissions = [
  "document::create",
  "document::read",
  "document::update",
  "document::delete",
  "document::manage",
];

const WebhookPermissions = [
  "webhook::create",
  "webhook::read",
  "webhook::update",
  "webhook::delete",
];

// All permissions combined
const AllPermissions = [
  ...IssuePermissions,
  ...UserPermissions,
  ...RolePermissions,
  ...TeamPermissions,
  ...ClientPermissions,
  ...KnowledgeBasePermissions,
  ...SystemPermissions,
  ...TimeTrackingPermissions,
  ...DocumentPermissions,
  ...WebhookPermissions,
];

// Permission categories
const PermissionCategories = {
  ISSUE: "Issue Management",
  USER: "User Management",
  ROLE: "Role Management",
  TEAM: "Team Management",
  CLIENT: "Client Management",
  KNOWLEDGE_BASE: "Knowledge Base",
  SYSTEM: "System Settings",
  TIME_TRACKING: "Time Tracking",
  WEBHOOK: "Webhook Management",
  DOCUMENTATION: "Documentation",
};

// Configuration of permissions grouped by category
const PERMISSIONS_CONFIG = [
  {
    category: "Issue Management",
    permissions: [
      "issue::create",
      "issue::read",
      "issue::write",
      "issue::update",
      "issue::delete",
      "issue::assign",
      "issue::transfer",
      "issue::comment",
    ],
  },
  // {
  //   category: "User Management",
  //   permissions: [
  //     "user::create",
  //     "user::read",
  //     "user::update",
  //     "user::delete",
  //     "user::manage",
  //   ],
  // },
  {
    category: "Role Management",
    permissions: [
      "role::create",
      "role::read",
      "role::update",
      "role::delete",
      "role::manage",
    ],
  },
  // {
  //   category: "Team Management",
  //   permissions: [
  //     "team::create",
  //     "team::read",
  //     "team::update",
  //     "team::delete",
  //     "team::manage"
  //   ]
  // },
  // {
  //   category: "Client Management",
  //   permissions: [
  //     "client::create",
  //     "client::read",
  //     "client::update",
  //     "client::delete",
  //     "client::manage",
  //   ],
  // },
  // {
  //   category: "Knowledge Base",
  //   permissions: [
  //     "kb::create",
  //     "kb::read",
  //     "kb::update",
  //     "kb::delete",
  //     "kb::manage"
  //   ]
  // },
  // {
  //   category: "System Settings",
  //   permissions: [
  //     "settings::view",
  //     "settings::manage",
  //     "webhook::manage",
  //     "integration::manage",
  //     "email_template::manage",
  //   ],
  // },
  // {
  //   category: "Time Tracking",
  //   permissions: [
  //     "time_entry::create",
  //     "time_entry::read",
  //     "time_entry::update",
  //     "time_entry::delete"
  //   ]
  // },
  {
    category: "Document Management",
    permissions: [
      "document::create",
      "document::read",
      "document::update",
      "document::delete",
      "document::manage",
    ],
  },
  {
    category: "Webhook Management",
    permissions: [
      "webhook::create",
      "webhook::read",
      "webhook::update",
      "webhook::delete",
    ],
  },
];

// Optional: Export if using modules
module.exports = {
  AllPermissions,
  PermissionCategories,
  PERMISSIONS_CONFIG,
  IssuePermissions,
  UserPermissions,
  RolePermissions,
  TeamPermissions,
  ClientPermissions,
  KnowledgeBasePermissions,
  SystemPermissions,
  TimeTrackingPermissions,
  DocumentPermissions,
  WebhookPermissions,
};