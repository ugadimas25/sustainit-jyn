import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, Building, Activity, AlertTriangle, CheckCircle, Clock, Lock } from "lucide-react";
import { useLocation } from "wouter";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  unverifiedUsers: number;
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  totalOrganizations: number;
  totalPermissions: number;
  recentActivity: number;
}

interface RecentUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  userName: string;
  timestamp: string;
  details: string;
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

  // Fetch recent audit logs
  const { data: recentAudits = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ['/api/user-config/admin/recent-audits'],
  });

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    onClick 
  }: {
    title: string;
    value: number | string;
    description: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
  }) => (
    <Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'locked':
        return <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" />Locked</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'login':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard-loading">
        <div className="text-center py-8">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System administration overview and management
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description={`${stats?.activeUsers || 0} active, ${stats?.lockedUsers || 0} locked`}
          icon={Users}
          onClick={() => setLocation('/admin/users')}
        />
        <StatCard
          title="System Roles"
          value={stats?.totalRoles || 0}
          description={`${stats?.systemRoles || 0} system, ${stats?.customRoles || 0} custom`}
          icon={Shield}
          onClick={() => setLocation('/admin/roles')}
        />
        <StatCard
          title="Organizations"
          value={stats?.totalOrganizations || 0}
          description="Active organizations"
          icon={Building}
          onClick={() => setLocation('/admin/organizations')}
        />
        <StatCard
          title="Recent Activity"
          value={stats?.recentActivity || 0}
          description="Actions in last 24 hours"
          icon={Activity}
          onClick={() => setLocation('/admin/audit-logs')}
        />
      </div>

      {/* Content Grid */}
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
                Latest user registrations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation('/admin/users')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8" data-testid="no-recent-users">
                <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent users</p>
              </div>
            ) : (
              <Table data-testid="recent-users-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`recent-user-${user.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system actions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation('/admin/audit-logs')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <div className="text-center py-8" data-testid="no-recent-activity">
                <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="recent-activity-list">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`audit-${audit.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getActionColor(audit.action)}`}>
                          {audit.action.toUpperCase()}
                        </span>
                        <span className="text-sm">{audit.resource}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {audit.userName}
                      </p>
                      {audit.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {audit.details}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(audit.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health Alert */}
      {stats && (stats.unverifiedUsers > 0 || stats.lockedUsers > 5) && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              System Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {stats.unverifiedUsers > 0 && (
                <p>
                  <strong>{stats.unverifiedUsers}</strong> users have unverified email addresses
                </p>
              )}
              {stats.lockedUsers > 5 && (
                <p>
                  <strong>{stats.lockedUsers}</strong> user accounts are currently locked
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/admin/users')}
                data-testid="button-review-users"
              >
                Review Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/users')}
              data-testid="button-manage-users"
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/roles')}
              data-testid="button-manage-roles"
              className="justify-start"
            >
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/organizations')}
              data-testid="button-manage-orgs"
              className="justify-start"
            >
              <Building className="w-4 h-4 mr-2" />
              Organizations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/audit-logs')}
              data-testid="button-view-audits"
              className="justify-start"
            >
              <Activity className="w-4 h-4 mr-2" />
              Audit Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}