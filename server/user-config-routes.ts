import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { 
  requireAuth, 
  requirePermission, 
  requireRole, 
  requireSystemAdmin, 
  requireOrgAdmin,
  auditLog,
  auditMiddleware,
  PERMISSIONS 
} from './auth-middleware';
import { 
  insertOrganizationSchema, 
  insertRoleSchema, 
  insertPermissionSchema, 
  insertGroupSchema,
  insertUserSchemaEnhanced,
  insertUserPermissionSchema,
  insertUserRoleSchema
} from '@shared/schema';
import { ZodError } from 'zod';

const router = Router();

// =======================
// ORGANIZATION MANAGEMENT
// =======================

// Get all organizations (system admin only)
router.get('/organizations', 
  requireAuth,
  requirePermission(PERMISSIONS.ORGANIZATION_MANAGEMENT.module, PERMISSIONS.ORGANIZATION_MANAGEMENT.actions.VIEW),
  auditMiddleware('organization'),
  async (req: Request, res: Response) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  }
);

// Get organization by ID
router.get('/organizations/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ORGANIZATION_MANAGEMENT.module, PERMISSIONS.ORGANIZATION_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found. Please check the organization ID and try again.' });
      }
      res.json(organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  }
);

// Create organization (system admin only)
router.post('/organizations', 
  requireAuth,
  requirePermission(PERMISSIONS.ORGANIZATION_MANAGEMENT.module, PERMISSIONS.ORGANIZATION_MANAGEMENT.actions.CREATE),
  auditMiddleware('organization'),
  async (req: Request, res: Response) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(data);
      
      await auditLog.log('create', 'organization', organization.id, organization.name, req);
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Please check your input and try again', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Unable to create organization. Please try again later.' });
    }
  }
);

// Update organization
router.put('/organizations/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ORGANIZATION_MANAGEMENT.module, PERMISSIONS.ORGANIZATION_MANAGEMENT.actions.UPDATE),
  auditMiddleware('organization'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const oldOrg = await storage.getOrganization(id);
      
      if (!oldOrg) {
        return res.status(404).json({ error: 'Organization not found. Please check the organization ID and try again.' });
      }

      const updates = req.body;
      const organization = await storage.updateOrganization(id, updates);
      
      await auditLog.log('update', 'organization', id, organization?.name, req, oldOrg, organization);
      res.json(organization);
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({ error: 'Unable to update organization. Please try again later.' });
    }
  }
);

// Delete organization (system admin only)
router.delete('/organizations/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ORGANIZATION_MANAGEMENT.module, PERMISSIONS.ORGANIZATION_MANAGEMENT.actions.DELETE),
  auditMiddleware('organization'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found. Please check the organization ID and try again.' });
      }

      const success = await storage.deleteOrganization(id);
      
      await auditLog.log('delete', 'organization', id, organization.name, req, organization, undefined, success);
      
      if (success) {
        res.json({ message: 'Organization deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete organization' });
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  }
);

// =======================
// USER MANAGEMENT
// =======================

// Get users in organization
router.get('/users', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsersEnhanced();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get user by ID
router.get('/users/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserEnhanced(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// Create user
router.post('/users', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.CREATE),
  auditMiddleware('user'),
  async (req: Request, res: Response) => {
    try {
      const data = insertUserSchemaEnhanced.parse(req.body);
      const user = await storage.createUserEnhanced(data);
      
      await auditLog.log('create', 'user', user.id, user.username, req);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Please check your input and try again', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Unable to create user account. Please try again later.' });
    }
  }
);

// Update user
router.put('/users/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.UPDATE),
  auditMiddleware('user'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const oldUser = await storage.getUserEnhanced(id);
      
      if (!oldUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = req.body;
      const user = await storage.updateUserEnhanced(id, updates);
      
      await auditLog.log('update', 'user', id, user?.username, req, oldUser, user);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Deactivate user
router.post('/users/:id/deactivate', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.UPDATE),
  auditMiddleware('user'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await storage.getUserEnhanced(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const success = await storage.deactivateUser(id);
      
      await auditLog.log('update', 'user', id, user.username, req, user, { status: 'inactive' }, success);
      
      if (success) {
        res.json({ message: 'User deactivated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to deactivate user' });
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }
);

// Lock/unlock user
router.post('/users/:id/lock', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.UPDATE),
  auditMiddleware('user'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { until } = req.body;
      const user = await storage.getUserEnhanced(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const untilDate = until ? new Date(until) : undefined;
      const success = await storage.lockUser(id, untilDate);
      
      await auditLog.log('update', 'user', id, user.username, req, user, { locked: true, until }, success);
      
      if (success) {
        res.json({ message: 'User locked successfully' });
      } else {
        res.status(500).json({ error: 'Failed to lock user' });
      }
    } catch (error) {
      console.error('Error locking user:', error);
      res.status(500).json({ error: 'Failed to lock user' });
    }
  }
);

router.post('/users/:id/unlock', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.UPDATE),
  auditMiddleware('user'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await storage.getUserEnhanced(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const success = await storage.unlockUser(id);
      
      await auditLog.log('update', 'user', id, user.username, req, user, { locked: false }, success);
      
      if (success) {
        res.json({ message: 'User unlocked successfully' });
      } else {
        res.status(500).json({ error: 'Failed to unlock user' });
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      res.status(500).json({ error: 'Failed to unlock user' });
    }
  }
);

// =======================
// ROLE MANAGEMENT
// =======================

// Get roles
router.get('/roles', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.authenticatedUser?.organizationId;
      const roles = await storage.getRoles(organizationId);
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
);

// Get role by ID
router.get('/roles/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json(role);
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  }
);

// Create role
router.post('/roles', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.CREATE),
  auditMiddleware('role'),
  async (req: Request, res: Response) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      
      await auditLog.log('create', 'role', role.id, role.name, req);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
);

// Update role
router.put('/roles/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.UPDATE),
  auditMiddleware('role'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const oldRole = await storage.getRole(id);
      
      if (!oldRole) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const updates = req.body;
      const role = await storage.updateRole(id, updates);
      
      await auditLog.log('update', 'role', id, role?.name, req, oldRole, role);
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

// Delete role
router.delete('/roles/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.DELETE),
  auditMiddleware('role'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const role = await storage.getRole(id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Check if it's a system role
      if (role.isSystem) {
        return res.status(403).json({ error: 'Cannot delete system role' });
      }

      const success = await storage.deleteRole(id);
      
      await auditLog.log('delete', 'role', id, role.name, req, role, undefined, success);
      
      if (success) {
        res.json({ message: 'Role deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete role' });
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  }
);

// Set role permissions
router.put('/roles/:id/permissions', 
  requireAuth,
  requirePermission(PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.module, PERMISSIONS.ROLE_PERMISSION_MANAGEMENT.actions.ASSIGN),
  auditMiddleware('role'),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { permissionIds } = req.body;
      const role = await storage.getRole(id);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Check if it's a system role
      if (role.isSystem) {
        return res.status(403).json({ error: 'Cannot modify system role permissions' });
      }

      const success = await storage.setRolePermissions(id, permissionIds);
      
      await auditLog.log('permission_changed', 'role', id, role.name, req, undefined, { permissionIds }, success);
      
      if (success) {
        res.json({ message: 'Role permissions updated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update role permissions' });
      }
    } catch (error) {
      console.error('Error setting role permissions:', error);
      res.status(500).json({ error: 'Failed to set role permissions' });
    }
  }
);

// =======================
// PERMISSION MANAGEMENT
// =======================

// Get permissions
router.get('/permissions', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  }
);

// Get permissions by module
router.get('/permissions/module/:module', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissionsByModule(req.params.module);
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions by module:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  }
);

// Create permission (system admin only)
router.post('/permissions', 
  requireAuth,
  requireSystemAdmin,
  auditMiddleware('permission'),
  async (req: Request, res: Response) => {
    try {
      const data = insertPermissionSchema.parse(req.body);
      const permission = await storage.createPermission(data);
      
      await auditLog.log('create', 'permission', permission.id, `${permission.module}:${permission.action}`, req);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error creating permission:', error);
      res.status(500).json({ error: 'Failed to create permission' });
    }
  }
);

// =======================
// GROUP MANAGEMENT
// =======================

// Get groups in organization
router.get('/groups', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.authenticatedUser?.organizationId;
      if (!organizationId) {
        return res.status(403).json({ error: 'No organization context' });
      }
      
      const groups = await storage.getGroups(organizationId);
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  }
);

// Get group by ID
router.get('/groups/:id', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.json(group);
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  }
);

// Create group
router.post('/groups', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.CREATE),
  auditMiddleware('group'),
  async (req: Request, res: Response) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(data);
      
      await auditLog.log('create', 'group', group.id, group.name, req);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }
);

// =======================
// USER-ROLE ASSIGNMENTS
// =======================

// Get user roles
router.get('/users/:userId/roles', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.VIEW),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const organizationId = req.authenticatedUser?.organizationId;
      
      if (!organizationId) {
        return res.status(403).json({ error: 'No organization context' });
      }

      const userRoles = await storage.getUserRoles(userId, organizationId);
      res.json(userRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ error: 'Failed to fetch user roles' });
    }
  }
);

// Assign role to user
router.post('/users/:userId/roles', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.MANAGE_ROLES),
  auditMiddleware('user_role'),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const organizationId = req.authenticatedUser?.organizationId;
      
      if (!organizationId) {
        return res.status(403).json({ error: 'No organization context' });
      }

      const data = insertUserRoleSchema.parse({
        userId,
        organizationId,
        ...req.body
      });
      
      const userRole = await storage.assignUserRole(data);
      
      await auditLog.log('role_assigned', 'user', userId, undefined, req, undefined, { roleId: data.roleId });
      res.status(201).json(userRole);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error assigning user role:', error);
      res.status(500).json({ error: 'Failed to assign user role' });
    }
  }
);

// Remove role from user
router.delete('/users/:userId/roles/:roleId', 
  requireAuth,
  requirePermission(PERMISSIONS.USER_MANAGEMENT.module, PERMISSIONS.USER_MANAGEMENT.actions.MANAGE_ROLES),
  auditMiddleware('user_role'),
  async (req: Request, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      const organizationId = req.authenticatedUser?.organizationId;
      
      if (!organizationId) {
        return res.status(403).json({ error: 'No organization context' });
      }

      const success = await storage.removeUserRole(userId, roleId, organizationId);
      
      await auditLog.log('update', 'user', userId, undefined, req, undefined, { removedRoleId: roleId }, success);
      
      if (success) {
        res.json({ message: 'User role removed successfully' });
      } else {
        res.status(404).json({ error: 'User role assignment not found' });
      }
    } catch (error) {
      console.error('Error removing user role:', error);
      res.status(500).json({ error: 'Failed to remove user role' });
    }
  }
);

// =======================
// AUDIT LOGS
// =======================

// Get audit logs
router.get('/audit-logs', 
  requireAuth,
  requireOrgAdmin, // Only org admins can view audit logs
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.authenticatedUser?.organizationId;
      const { userId, action, entityType, limit } = req.query;
      
      const filters = {
        userId: userId as string,
        action: action as string,
        entityType: entityType as string,
        limit: limit ? parseInt(limit as string) : 100
      };

      const auditLogs = await storage.getAuditLogs(organizationId, filters);
      res.json(auditLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

// Get audit logs for specific entity
router.get('/audit-logs/:entityType/:entityId', 
  requireAuth,
  requireOrgAdmin,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      
      const auditLogs = await storage.getAuditLogsByEntity(entityType, entityId);
      res.json(auditLogs);
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch entity audit logs' });
    }
  }
);

// ==================
// ADMIN DASHBOARD ENDPOINTS  
// ==================

// Get admin dashboard statistics
router.get('/admin/stats',
  requireAuth,
  requireSystemAdmin,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.authenticatedUser?.organizationId;
      
      // Get user statistics
      const users = await storage.getUsersEnhanced();
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      const lockedUsers = users.filter(u => u.status === 'inactive').length;
      const unverifiedUsers = users.filter(u => u.status === 'pending').length;
      
      // Get role statistics
      const roles = await storage.getRoles(organizationId);
      const totalRoles = roles.length;
      const systemRoles = roles.filter(r => r.isSystem === true).length;
      const customRoles = roles.filter(r => r.isSystem === false).length;
      
      // Get other statistics
      const organizations = await storage.getOrganizations();
      const permissions = await storage.getPermissions();
      const auditLogs = await storage.getAuditLogs(organizationId, { limit: 10 });
      
      const stats = {
        totalUsers,
        activeUsers,
        lockedUsers,
        unverifiedUsers,
        totalRoles,
        systemRoles,
        customRoles,
        totalOrganizations: organizations.length,
        totalPermissions: permissions.length,
        recentActivity: auditLogs.length
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
  }
);

// Get recent users for admin dashboard
router.get('/admin/recent-users',
  requireAuth,
  requireSystemAdmin,
  async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsersEnhanced();
      
      // Sort by creation date and take the most recent 10
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(u => ({
          id: u.id,
          username: u.username,
          name: u.name || u.username,
          email: u.email || '',
          status: u.status,
          createdAt: u.createdAt
        }));
      
      res.json(recentUsers);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      res.status(500).json({ error: 'Failed to fetch recent users' });
    }
  }
);

// Get recent audit logs for admin dashboard
router.get('/admin/recent-audits',
  requireAuth,
  requireSystemAdmin,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.authenticatedUser?.organizationId;
      const auditLogs = await storage.getAuditLogs(organizationId, { limit: 20 });
      
      // Transform to match frontend interface
      const recentAudits = auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.entityType,
        userName: log.actorUserId, // This should ideally be resolved to username
        timestamp: log.createdAt,
        details: log.entityName || `${log.action} ${log.entityType}`
      }));
      
      res.json(recentAudits);
    } catch (error) {
      console.error('Error fetching recent audits:', error);
      res.status(500).json({ error: 'Failed to fetch recent audit logs' });
    }
  }
);

export default router;