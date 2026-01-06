// apps/api/src/lib/roles.js
const User = require('../models/User');

class InsufficientPermissionsError extends Error {
  constructor(message = "Insufficient permissions") {
    super(message);
    this.name = "InsufficientPermissionsError";
  }
}

function getUserPermissions(user) {
  const perms = new Set();
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(p => perms.add(p));
      }
    });
  }
  if (user.permissions && Array.isArray(user.permissions)) {
    user.permissions.forEach(p => perms.add(p));
  }
  return perms;
}

function hasPermission(user, requiredPermissions, requireAll = true) {
  if (!user) {
    console.log('❌ hasPermission: No user provided');
    return false;
  }
  if (user.isAdmin) {
    console.log('✅ hasPermission: Admin override');
    return true;
  }
  const permsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const userPerms = getUserPermissions(user);
  if (userPerms.has('*')) {
    console.log('✅ hasPermission: Wildcard permission granted');
    return true;
  }
  const hasPerm = requireAll
    ? permsToCheck.every(p => userPerms.has(p))
    : permsToCheck.some(p => userPerms.has(p));
  console.log('🔍 hasPermission: Required:', permsToCheck, 'User perms:', Array.from(userPerms), 'Result:', hasPerm);
  return hasPerm;
}

function requirePermission(requiredPermissions, requireAll = true) {
  return async (req, res, next) => {
    try {
      console.log('🔍 requirePermission: Checking for', requiredPermissions);
      if (!req.user) {
        console.log('❌ requirePermission: No user in request');
        return res.status(401).json({ message: "Unauthorized", success: false });
      }

      if (req.user.roles && req.user.roles.length > 0 && req.user.roles[0].permissions === undefined) {
        console.log('🔍 requirePermission: Populating roles for user:', req.user.email);
        const userWithRoles = await User.findById(req.user._id).populate('roles').lean();
        if (userWithRoles) {
          req.user.roles = userWithRoles.roles;
          req.user.permissions = userWithRoles.permissions || [];
        }
      }

      if (!hasPermission(req.user, requiredPermissions, requireAll)) {
        console.log('❌ requirePermission: Insufficient permissions for', req.user.email);
        return res.status(403).json({
          message: "You do not have the required permission to access this resource.",
          success: false,
        });
      }

      console.log('✅ requirePermission: Permission granted for', req.user.email);
      next();
    } catch (err) {
      console.error('❌ requirePermission error:', err.message, err);
      res.status(500).json({ message: "Internal Server Error", success: false });
    }
  };
}

module.exports = {
  InsufficientPermissionsError,
  getUserPermissions,
  hasPermission,
  requirePermission
};