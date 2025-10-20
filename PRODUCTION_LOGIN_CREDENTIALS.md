# Production Login Credentials

## Default Admin User (Works in ALL Environments)

This user is automatically created when the application starts for the first time:

**Username:** `kpncompliance2025`  
**Password:** `kpncompliance2025`  
**Role:** Admin (full system access)

### Important Notes

1. **This user is created automatically** on first deployment to production
2. **Change the password immediately** after first login for security
3. This admin user can create other users through the "Manage Users" menu
4. The admin has access to all system features and permissions

---

## Test Users (Development Environment Only)

The following test users are ONLY available in the development environment:

| Username | Password | Role | Environment |
|----------|----------|------|-------------|
| kpncompliance2025 | kpncompliance2025 | Admin | ALL (Dev + Prod) |
| super_admin | password123 | Super Admin | Development Only |
| creator_user | password123 | Creator | Development Only |
| approver_user | password123 | Approver | Development Only |

---

## For Production Deployment

1. **First Login:** Use `kpncompliance2025` / `kpncompliance2025`
2. **Create Real Users:** Navigate to Admin → Manage Users
3. **Assign Roles:** Assign appropriate roles (Super Admin, Creator, Approver)
4. **Security:** Change or disable the default admin credentials after setup

---

## Troubleshooting

If login fails on the published version:
- Wait 30 seconds for the server to fully initialize
- The default user is created automatically on first server startup
- Check deployment logs for "Default user 'kpncompliance2025' created successfully"
