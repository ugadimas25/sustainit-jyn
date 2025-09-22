import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Define enhanced user interface for middleware
interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  organizationId?: string; // Current/active organization
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

// Audit logging helper
export const auditLog = {
  async log(
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'access_granted' | 'access_denied' | 'permission_changed' | 'role_assigned' | 'group_joined' | 'group_left',
    entityType: string,
    entityId?: string,
    entityName?: string,
    req?: Request,
    before?: any,
    after?: any,
    success: boolean = true,
    reason?: string
  ): Promise<void> {
    try {
      const auditEntry = {
        organizationId: req?.authenticatedUser?.organizationId || null,
        actorUserId: req?.authenticatedUser?.id || null,
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
        success,
        reason: reason || null,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get('User-Agent') || null,
        sessionId: req?.sessionID || null,
        correlationId: req?.headers['x-correlation-id'] as string || null,
        metadata: {
          url: req?.url,
          method: req?.method,
          timestamp: new Date().toISOString()
        }
      };

      await storage.createAuditLog(auditEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the application
    }
  }
};

// Authentication middleware (enhanced version)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is logged in via session (using existing req.user from auth.ts)
    if (!req.user?.id) {
      await auditLog.log('access_denied', 'authentication', undefined, undefined, req, undefined, undefined, false, 'No authentication session');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get enhanced user info with current organization
    const userEnhanced = await storage.getUserEnhanced(req.user.id);
    if (!userEnhanced) {
      await auditLog.log('access_denied', 'authentication', req.user.id, undefined, req, undefined, undefined, false, 'User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    // Check user status
    if (userEnhanced.status !== 'active') {
      await auditLog.log('access_denied', 'authentication', req.user.id, userEnhanced.username, req, undefined, undefined, false, `User status: ${userEnhanced.status}`);
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Check if user is locked
    if (userEnhanced.lockedUntil && new Date(userEnhanced.lockedUntil) > new Date()) {
      await auditLog.log('access_denied', 'authentication', req.user.id, userEnhanced.username, req, undefined, undefined, false, 'Account locked');
      return res.status(403).json({ error: 'Account is temporarily locked' });
    }

    // Set up authenticated user context with organization info
    req.authenticatedUser = {
      id: req.user.id,
      username: req.user.username,
      email: userEnhanced.email || undefined,
      organizationId: undefined // Will be set below
    };

    // Get user's default organization if not set
    const userOrgs = await storage.getUserOrganizations(req.user.id);
    console.log('🔍 DEBUG: User orgs for', req.user.username, ':', JSON.stringify(userOrgs, null, 2));
    
    const defaultOrg = userOrgs.find(uo => uo.isDefault);
    console.log('🔍 DEBUG: Default org found:', JSON.stringify(defaultOrg, null, 2));
    
    if (defaultOrg) {
      req.authenticatedUser.organizationId = defaultOrg.organizationId;
      console.log('🔍 DEBUG: Set organizationId to:', defaultOrg.organizationId);
    } else {
      console.log('🔍 DEBUG: No default org found, organizationId remains undefined');
    }

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    await auditLog.log('access_denied', 'authentication', req.user?.id, undefined, req, undefined, undefined, false, 'Authentication error');
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Authorization middleware factory
export const requirePermission = (module: string, action: string, resource?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authenticatedUser?.id || !req.authenticatedUser?.organizationId) {
        await auditLog.log('access_denied', 'authorization', req.authenticatedUser?.id, undefined, req, undefined, undefined, false, 'Missing user or organization context');
        return res.status(403).json({ error: 'Insufficient context for authorization' });
      }

      // Check user permission
      const hasPermission = await storage.checkUserPermission(
        req.authenticatedUser.id,
        req.authenticatedUser.organizationId,
        module,
        action,
        resource
      );

      if (!hasPermission) {
        await auditLog.log('access_denied', 'authorization', req.authenticatedUser.id, undefined, req, undefined, undefined, false, `Permission denied: ${module}:${action}${resource ? `:${resource}` : ''}`);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: { module, action, resource }
        });
      }

      // Log successful access
      await auditLog.log('access_granted', 'authorization', req.authenticatedUser.id, undefined, req, undefined, undefined, true, `Permission granted: ${module}:${action}${resource ? `:${resource}` : ''}`);

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      await auditLog.log('access_denied', 'authorization', req.user?.id, undefined, req, undefined, undefined, false, 'Authorization error');
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Role-based authorization middleware
export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.authenticatedUser?.id || !req.authenticatedUser?.organizationId) {
        await auditLog.log('access_denied', 'role_check', req.authenticatedUser?.id, undefined, req, undefined, undefined, false, 'Missing user or organization context');
        return res.status(403).json({ error: 'Insufficient context for role check' });
      }

      // Get user roles
      const userRoles = await storage.getUserRoles(req.authenticatedUser.id, req.authenticatedUser.organizationId);
      
      // Get role details to check role names
      const roleChecks = await Promise.all(
        userRoles.map(async (ur) => {
          const role = await storage.getRole(ur.roleId);
          return role?.name === roleName;
        })
      );

      const hasRole = roleChecks.some(Boolean);

      if (!hasRole) {
        await auditLog.log('access_denied', 'role_check', req.authenticatedUser.id, undefined, req, undefined, undefined, false, `Role required: ${roleName}`);
        return res.status(403).json({ 
          error: 'Insufficient role',
          required: roleName
        });
      }

      await auditLog.log('access_granted', 'role_check', req.authenticatedUser.id, undefined, req, undefined, undefined, true, `Role granted: ${roleName}`);

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      await auditLog.log('access_denied', 'role_check', req.authenticatedUser?.id, undefined, req, undefined, undefined, false, 'Role check error');
      return res.status(500).json({ error: 'Role check error' });
    }
  };
};

// Organization context middleware
export const requireOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Initialize authenticated user if not already set
    if (!req.authenticatedUser) {
      req.authenticatedUser = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email || undefined
      };
    }

    // If organization is already set, continue
    if (req.authenticatedUser && req.authenticatedUser.organizationId) {
      next();
      return;
    }

    // Get user organizations
    const userOrgs = await storage.getUserOrganizations(req.user.id);
    if (userOrgs.length === 0) {
      await auditLog.log('access_denied', 'organization', req.user.id, undefined, req, undefined, undefined, false, 'No organization membership');
      return res.status(403).json({ error: 'No organization access' });
    }

    // Set default organization
    const defaultOrg = userOrgs.find(uo => uo.isDefault) || userOrgs[0];
    if (req.authenticatedUser) {
      req.authenticatedUser.organizationId = defaultOrg.organizationId;
    }

    next();
  } catch (error) {
    console.error('Organization middleware error:', error);
    return res.status(500).json({ error: 'Organization context error' });
  }
};

// System admin middleware (checks for system admin role)
export const requireSystemAdmin = requireRole('system_admin');

// Organization admin middleware (checks for org admin role)
export const requireOrgAdmin = requireRole('organization_admin');

// Audit middleware (logs all requests)
export const auditMiddleware = (entityType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log the request after response is sent
      const success = res.statusCode < 400;
      const action = getActionFromMethod(req.method);
      
      if (action) {
        auditLog.log(
          action,
          entityType,
          req.params.id,
          undefined,
          req,
          req.method === 'PUT' || req.method === 'PATCH' ? req.body : undefined,
          success ? body : undefined,
          success,
          success ? undefined : `HTTP ${res.statusCode}`
        );
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// Helper function to map HTTP methods to audit actions
function getActionFromMethod(method: string): 'create' | 'update' | 'delete' | undefined {
  switch (method.toUpperCase()) {
    case 'POST': return 'create';
    case 'PUT':
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return undefined; // GET requests typically aren't audited as modifications
  }
}

// Permission constants for common modules
export const PERMISSIONS = {
  DASHBOARD: {
    module: 'dashboard',
    actions: {
      VIEW: 'view',
      EXPORT: 'export'
    }
  },
  USER_MANAGEMENT: {
    module: 'user_management',
    actions: {
      VIEW: 'view_users',
      CREATE: 'create_users',
      UPDATE: 'edit_users',
      DELETE: 'delete_users',
      MANAGE_ROLES: 'manage_roles'
    }
  },
  ROLE_PERMISSION_MANAGEMENT: {
    module: 'role_permission_management',
    actions: {
      VIEW: 'view_roles',
      CREATE: 'create_roles',
      UPDATE: 'edit_roles',
      DELETE: 'delete_roles',
      ASSIGN: 'assign_permissions'
    }
  },
  ORGANIZATION: {
    module: 'organization',
    actions: {
      VIEW: 'view',
      UPDATE: 'update',
      MANAGE_USERS: 'manage_users',
      MANAGE_SETTINGS: 'manage_settings'
    }
  },
  DEFORESTATION: {
    module: 'deforestation',
    actions: {
      VIEW: 'view',
      ANALYZE: 'analyze',
      EXPORT: 'export'
    }
  },
  COMPLIANCE: {
    module: 'compliance',
    actions: {
      VIEW: 'view',
      ASSESS: 'assess',
      APPROVE: 'approve',
      EXPORT: 'export'
    }
  },
  SUPPLY_CHAIN: {
    module: 'supply_chain',
    actions: {
      VIEW: 'view',
      MANAGE: 'manage',
      EXPORT: 'export'
    }
  },
  REPORTS: {
    module: 'reports',
    actions: {
      VIEW: 'view',
      GENERATE: 'generate',
      EXPORT: 'export'
    }
  }
} as const;