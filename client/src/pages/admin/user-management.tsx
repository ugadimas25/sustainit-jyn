import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Edit, Trash2, Lock, Unlock, Eye, Shield, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

// Platform modules
const PLATFORM_MODULES = [
  { id: "dashboard", name: "Dashboard" },
  { id: "deforestation_monitoring", name: "Deforestation Monitoring" },
  { id: "data_collection", name: "Data Collection" },
  { id: "legality_compliance", name: "Legality Compliance" },
  { id: "supply_chain", name: "Supply Chain" },
  { id: "dds_reports", name: "DDS Reports" },
] as const;

// User form schema
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().optional(),
  status: z.enum(["active", "inactive", "locked"]).default("active"),
  modules: z.array(z.string()).default([]),
  companies: z.array(z.string()).min(1, "Select at least one company affiliation"),
});

const editUserSchema = createUserSchema.omit({ password: true }).extend({
  password: z.string().optional(),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role?: string;
  status: "active" | "inactive" | "locked";
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  organizations?: Array<{
    organizationId: string;
    organizationName: string;
    role: string;
  }>;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function UserManagement() {
  const [selectedTab, setSelectedTab] = useState("users");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/user-config/users'],
  });

  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/user-config/roles'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await fetch('/api/user-config/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/users'] });
      setUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditUserData> }) => {
      const response = await fetch(`/api/user-config/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/users'] });
      setEditingUser(null);
      setUserDialogOpen(false);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user-config/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Lock/unlock user mutations
  const lockUserMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'lock' | 'unlock' }) => {
      const response = await fetch(`/api/user-config/users/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-config/users'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<CreateUserData | EditUserData>({
    resolver: zodResolver(editingUser ? editUserSchema : createUserSchema),
    defaultValues: editingUser ? {
      username: editingUser.username,
      email: editingUser.email,
      name: editingUser.name,
      role: editingUser.role || "none",
      status: editingUser.status,
      modules: [],
      companies: [],
    } : {
      username: "",
      email: "",
      name: "",
      password: "",
      role: "none",
      status: "active",
      modules: [],
      companies: [],
    },
  });

  const onSubmit = async (data: CreateUserData | EditUserData) => {
    // Normalize role: convert "none" to undefined to omit the field
    const normalizedData = {
      ...data,
      role: data.role === "none" ? undefined : data.role,
    };

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: normalizedData });
    } else {
      createUserMutation.mutate(normalizedData as CreateUserData);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role || "none",
      status: user.status,
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleLockToggle = async (user: User) => {
    const action = user.status === 'locked' ? 'unlock' : 'lock';
    lockUserMutation.mutate({ id: user.id, action });
  };

  const getStatusBadge = (status: string, emailVerified: boolean) => {
    if (status === 'locked') {
      return <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" />Locked</Badge>;
    }
    if (status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (!emailVerified) {
      return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unverified</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="user-management-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); form.reset(); }} data-testid="button-create-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Update user information and settings' 
                  : 'Create a new user account with appropriate permissions'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!editingUser && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Role</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="locked">Locked</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Platform Modules Selection */}
                <FormField
                  control={form.control}
                  name="modules"
                  render={() => (
                    <FormItem>
                      <FormLabel>Platform Modules</FormLabel>
                      <div className="space-y-2">
                        {PLATFORM_MODULES.map((module) => (
                          <FormField
                            key={module.id}
                            control={form.control}
                            name="modules"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(module.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, module.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== module.id
                                              )
                                            )
                                      }}
                                      data-testid={`checkbox-module-${module.id}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {module.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Affiliation Selection */}
                <FormField
                  control={form.control}
                  name="companies"
                  render={() => (
                    <FormItem>
                      <FormLabel>Company Affiliation *</FormLabel>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="companies"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("pt-thip")}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, "pt-thip"])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== "pt-thip")
                                        )
                                  }}
                                  data-testid="checkbox-company-pt-thip"
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                PT THIP
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companies"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes("pt-bsu")}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, "pt-bsu"])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== "pt-bsu")
                                        )
                                  }}
                                  data-testid="checkbox-company-pt-bsu"
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                PT BSU
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setUserDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    data-testid="button-save"
                  >
                    {createUserMutation.isPending || updateUserMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                        {editingUser ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingUser ? 'Update User' : 'Create User'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            System Users ({users.length})
          </CardTitle>
          <CardDescription>
            Manage user accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4" data-testid="loading-users">
              {/* Skeleton loading */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8" data-testid="no-users">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-muted-foreground">Create your first user to get started</p>
            </div>
          ) : (
            <Table data-testid="users-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{user.email}</p>
                      {user.organizations && user.organizations.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {user.organizations[0].organizationName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status, user.emailVerified)}
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No role</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <span className="text-sm">
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleLockToggle(user)}
                          disabled={lockUserMutation.isPending}
                          data-testid={`button-lock-${user.id}`}
                        >
                          {user.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}