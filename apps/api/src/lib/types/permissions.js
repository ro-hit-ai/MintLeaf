/**
 * @typedef {'issue::create' | 'issue::read' | 'issue::write' | 'issue::update' | 'issue::delete' | 'issue::assign' | 'issue::transfer' | 'issue::comment'} IssuePermission
 */

/**
 * @typedef {'user::create' | 'user::read' | 'user::update' | 'user::delete' | 'user::manage'} UserPermission
 */

/**
 * @typedef {'role::create' | 'role::read' | 'role::update' | 'role::delete' | 'role::manage'} RolePermission
 */

/**
 * @typedef {'team::create' | 'team::read' | 'team::update' | 'team::delete' | 'team::manage'} TeamPermission
 */

/**
 * @typedef {'client::create' | 'client::read' | 'client::update' | 'client::delete' | 'client::manage'} ClientPermission
 */

/**
 * @typedef {'kb::create' | 'kb::read' | 'kb::update' | 'kb::delete' | 'kb::manage'} KnowledgeBasePermission
 */

/**
 * @typedef {'settings::view' | 'settings::manage' | 'webhook::manage' | 'integration::manage' | 'email_template::manage'} SystemPermission
 */

/**
 * @typedef {'time_entry::create' | 'time_entry::read' | 'time_entry::update' | 'time_entry::delete'} TimeTrackingPermission
 */

/**
 * @typedef {'docs::manage' | 'admin::panel'} ViewPermission
 */

/**
 * @typedef {'webhook::create' | 'webhook::read' | 'webhook::update' | 'webhook::delete'} WebhookPermission
 */

/**
 * @typedef {'document::create' | 'document::read' | 'document::update' | 'document::delete' | 'document::manage'} DocumentPermission
 */

/**
 * @typedef {IssuePermission | UserPermission | RolePermission | TeamPermission | ClientPermission | KnowledgeBasePermission | SystemPermission | TimeTrackingPermission | ViewPermission | WebhookPermission | DocumentPermission} Permission
 */

/**
 * @type {Object.<string, string>}
 */
const PermissionCategories = {
  ISSUE: 'Issue Management',
  USER: 'User Management',
  ROLE: 'Role Management',
  TEAM: 'Team Management',
  CLIENT: 'Client Management',
  KNOWLEDGE_BASE: 'Knowledge Base',
  SYSTEM: 'System Settings',
  TIME_TRACKING: 'Time Tracking',
  VIEW: 'Views',
  WEBHOOK: 'Webhook Management',
  DOCUMENT: 'Document Management'
};

/**
 * @typedef {'Issue Management' | 'User Management' | 'Role Management' | 'Team Management' | 'Client Management' | 'Knowledge Base' | 'System Settings' | 'Time Tracking' | 'Views' | 'Webhook Management' | 'Document Management'} PermissionCategory
 */

/**
 * @typedef {Object} PermissionGroup
 * @property {PermissionCategory} category
 * @property {Permission[]} permissions
 */

module.exports = {
  PermissionCategories,
  // Exporting permission arrays for reference
  IssuePermissions: [
    'issue::create',
    'issue::read',
    'issue::write',
    'issue::update',
    'issue::delete',
    'issue::assign',
    'issue::transfer',
    'issue::comment'
  ],
  UserPermissions: [
    'user::create',
    'user::read',
    'user::update',
    'user::delete',
    'user::manage'
  ],
  RolePermissions: [
    'role::create',
    'role::read',
    'role::update',
    'role::delete',
    'role::manage'
  ],
  TeamPermissions: [
    'team::create',
    'team::read',
    'team::update',
    'team::delete',
    'team::manage'
  ],
  ClientPermissions: [
    'client::create',
    'client::read',
    'client::update',
    'client::delete',
    'client::manage'
  ],
  KnowledgeBasePermissions: [
    'kb::create',
    'kb::read',
    'kb::update',
    'kb::delete',
    'kb::manage'
  ],
  SystemPermissions: [
    'settings::view',
    'settings::manage',
    'webhook::manage',
    'integration::manage',
    'email_template::manage'
  ],
  TimeTrackingPermissions: [
    'time_entry::create',
    'time_entry::read',
    'time_entry::update',
    'time_entry::delete'
  ],
  ViewPermissions: [
    'docs::manage',
    'admin::panel'
  ],
  WebhookPermissions: [
    'webhook::create',
    'webhook::read',
    'webhook::update',
    'webhook::delete'
  ],
  DocumentPermissions: [
    'document::create',
    'document::read',
    'document::update',
    'document::delete',
    'document::manage'
  ]
};