# Production Login Credentials

## All Login Credentials (Works in ALL Environments)

The following users are automatically created when the application starts:

### Main Admin User
**Username:** `kpncompliance2025`  
**Password:** `kpncompliance2025`  
**Role:** Admin (legacy system admin)

### Test Users for Role-Based Testing
| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| **super_admin** | password123 | Super Admin | Full system access - can create users |
| **creator_user** | password123 | Creator | Data input only - needs approval |
| **approver_user** | password123 | Approver | Review & approve Creator's data |

---

## Important Security Notes

⚠️ **PRODUCTION SECURITY CHECKLIST:**

1. ✅ **All 4 users are now enabled in production** for testing
2. ⚠️ **These use simple passwords** - meant for initial testing only
3. 🔒 **After testing, you should:**
   - Create real production users with strong passwords
   - Delete or disable these test accounts
   - Or at minimum, change their passwords

---

## User Affiliations

All users are automatically affiliated with:
- **Organization:** PT THIP
- **Status:** Active
- **Default Company:** PT THIP

---

## For Production Deployment

### Initial Setup
1. **First Login:** Use any of the 4 accounts above
2. **Test Role Permissions:** Verify each role works correctly
3. **Create Real Users:** Navigate to Admin → Manage Users
4. **Assign Production Roles:** Create actual users for your team
5. **Cleanup Test Accounts:** Delete or secure test accounts

### Role Responsibilities
- **Super Admin:** System configuration, user management, full access
- **Creator:** Data entry - plots, suppliers, assessments (requires approval)
- **Approver:** Review and approve/reject Creator submissions

---

## Troubleshooting

If login fails on the published version:
- Wait 30-60 seconds for the server to fully initialize
- Users are created automatically on first server startup
- Check deployment logs for user creation messages
- All 4 users should be created in both dev and production
