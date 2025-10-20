import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Shield, Activity, CheckCircle, Lock, AlertCircle, Eye } from "lucide-react";
import { useLocation } from "wouter";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  unverifiedUsers: number;
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
}

interface RecentUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/user-config/admin/stats'],
  });

  // Fetch recent users
  const { data: recentUsers = [] } = useQuery<RecentUser[]>({
    queryKey: ['/api/user-config/admin/recent-users'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />Active
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="destructive">
            <Lock className="w-3 h-3 mr-1" />Locked
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (statsLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-8">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">
              System Administration
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users, roles, and system settings
            </p>
          </div>
          <Button
            onClick={() => setLocation('/admin/users')}
            size="lg"
            className="gap-2"
            data-testid="button-manage-users"
          >
            <UserPlus className="w-5 h-5" />
            Manage Users
          </Button>
        </div>

        {/* User Management Metrics - Highlighted */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-blue-600" />
              User Management Overview
            </CardTitle>
            <CardDescription>
              Quick insights into your user base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-4xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Active Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Locked Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-red-600">{stats?.lockedUsers || 0}</p>
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unverified</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-yellow-600">{stats?.unverifiedUsers || 0}</p>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setLocation('/admin/users')}
                className="flex-1"
                data-testid="button-view-all-users"
              >
                <Users className="w-4 h-4 mr-2" />
                View All Users
              </Button>
              <Button
                onClick={() => setLocation('/admin/users')}
                variant="outline"
                className="flex-1"
                data-testid="button-create-user"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create New User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Features */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Latest user accounts created
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/users')}
                data-testid="button-view-all-recent"
              >
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent users
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.slice(0, 5).map((user) => (
                      <TableRow key={user.id} data-testid={`recent-user-${user.id}`}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  System and custom roles
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/roles')}
                data-testid="button-view-roles"
              >
                <Eye className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">System Roles</p>
                    <p className="text-sm text-muted-foreground">
                      Pre-defined platform roles
                    </p>
                  </div>
                  <div className="text-3xl font-bold">{stats?.systemRoles || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Total Roles</p>
                    <p className="text-sm text-muted-foreground">
                      All available roles
                    </p>
                  </div>
                  <div className="text-3xl font-bold">{stats?.totalRoles || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/users')}
                data-testid="quick-action-users"
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">User Management</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Create, edit, and manage users
                  </span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/roles')}
                data-testid="quick-action-roles"
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold">Role Management</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Configure roles and permissions
                  </span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => setLocation('/admin/users')}
                data-testid="quick-action-create"
              >
                <div className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span className="font-semibold">Create New User</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Add a new user to the system
                  </span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
