import { useQuery } from "@tanstack/react-query";

interface PermissionsResponse {
  permissions: string[];
}

export function usePermissions() {
  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["/api/user/permissions"],
    retry: 1,
  });

  const permissions = data?.permissions || [];

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
