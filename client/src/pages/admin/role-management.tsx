import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, Plus, Edit, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Role form schema
const roleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type RoleData = z.infer<typeof roleSchema>;

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
  resourceType: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  organizationId: string;
  createdAt: string;
  permissions?: Permission[];
  userCount?: number;
}

export default function RoleManagement() {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/user-config/roles'],
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['/api/user-config/permissions'],
  });

  // Fetch role permissions when editing
  const { data: rolePermissions = [] } = useQuery<Permission[]>({
    queryKey: ['/api/user-config/roles', selectedRole?.id, 'permissions'],
    enabled: !!selectedRole?.id,
  });

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleData) => {
      const response = await fetch('/api/user-config/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/roles'] });
      setRoleDialogOpen(false);
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleData }) => {
      const response = await fetch(`/api/user-config/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/roles'] });
      setEditingRole(null);
      setRoleDialogOpen(false);
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user-config/roles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/roles'] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const response = await fetch(`/api/user-config/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissionIds }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/roles'] });
      setPermissionsDialogOpen(false);
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role permissions",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<RoleData>({
    resolver: zodResolver(roleSchema),
    defaultValues: editingRole ? {
      name: editingRole.name,
      description: editingRole.description,
    } : {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: RoleData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description,
    });
    setRoleDialogOpen(true);
  };

  const handleDeleteRole = async (id: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteRoleMutation.mutate(id);
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    setPermissionsDialogOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => 
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const toggleAllModulePermissions = (module: string, permissions: Permission[]) => {
    const modulePermissionIds = permissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    } else {
      setSelectedPermissions(prev => {
        const combined = [...prev, ...modulePermissionIds];
        return Array.from(new Set(combined));
      });
    }
  };

  const savePermissions = () => {
    if (selectedRole) {
      updateRolePermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissionIds: selectedPermissions,
      });
    }
  };

  const formatModuleName = (module: string) => {
    return module.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="role-management-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Role Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRole(null); form.reset(); }} data-testid="button-create-role">
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </DialogTitle>
              <DialogDescription>
                {editingRole 
                  ? 'Update role information' 
                  : 'Create a new role with specific permissions'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter role name" {...field} data-testid="input-role-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role and its responsibilities" 
                          {...field} 
                          data-testid="textarea-role-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setRoleDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                    data-testid="button-save"
                  >
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Roles ({roles.length})
          </CardTitle>
          <CardDescription>
            Configure roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="text-center py-8" data-testid="loading-roles">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8" data-testid="no-roles">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No roles found</p>
              <p className="text-muted-foreground">Create your first role to get started</p>
            </div>
          ) : (
            <Table data-testid="roles-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} data-testid={`role-row-${role.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{role.name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.permissions?.length || 0} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{role.userCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.isSystemRole ? (
                        <Badge variant="default">System</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleManagePermissions(role)}
                          data-testid={`button-permissions-${role.id}`}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditRole(role)}
                              data-testid={`button-edit-${role.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={deleteRoleMutation.isPending}
                              data-testid={`button-delete-${role.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[700px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="permissions-dialog-title">
              Manage Permissions: {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Select the permissions this role should have access to
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4" data-testid="permissions-list">
            {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
              <Collapsible 
                key={module}
                open={expandedModules.includes(module)}
                onOpenChange={() => toggleModule(module)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80">
                  <div className="flex items-center gap-2">
                    {expandedModules.includes(module) ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                    <span className="font-medium">{formatModuleName(module)}</span>
                    <Badge variant="outline">
                      {modulePermissions.filter(p => selectedPermissions.includes(p.id)).length} / {modulePermissions.length}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllModulePermissions(module, modulePermissions);
                    }}
                  >
                    Toggle All
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid grid-cols-1 gap-2 pl-6">
                    {modulePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          data-testid={`permission-${permission.id}`}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.action.replace('_', ' ').charAt(0).toUpperCase() + permission.action.replace('_', ' ').slice(1)}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPermissionsDialogOpen(false)}
              data-testid="button-permissions-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={savePermissions}
              disabled={updateRolePermissionsMutation.isPending}
              data-testid="button-permissions-save"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}