
# Developer Setup Guide

This guide helps developers set up the KPN EUDR Platform for local development and contribution.

## 🏗️ Development Environment Setup

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** and npm
- **PostgreSQL 14+** with PostGIS extension
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - PostGIS/PostgreSQL Syntax

### 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd kpn-eudr-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Database Setup

#### PostgreSQL Installation (Ubuntu/Debian)

```bash
# Install PostgreSQL and PostGIS
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-14-postgis-3

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Database Configuration

```bash
# Create development database
sudo -u postgres createdb eudr_development
sudo -u postgres createuser --interactive eudr_dev

# Enable PostGIS extension
sudo -u postgres psql eudr_development -c "CREATE EXTENSION postgis;"
sudo -u postgres psql eudr_development -c "CREATE EXTENSION postgis_topology;"

# Set password for development user
sudo -u postgres psql -c "ALTER USER eudr_dev PASSWORD 'dev_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eudr_development TO eudr_dev;"
```

### 3. Environment Configuration

Update your `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://eudr_dev:dev_password@localhost:5432/eudr_development"

# Development Configuration
NODE_ENV="development"
PORT=5000

# Session Configuration (generate with: openssl rand -base64 32)
SESSION_SECRET="your-development-session-secret"

# Google Cloud Storage (Development)
GOOGLE_CLOUD_PROJECT_ID="your-dev-project"
GOOGLE_CLOUD_PRIVATE_KEY="your-dev-service-account-key"
GOOGLE_CLOUD_CLIENT_EMAIL="dev-service-account@project.iam.gserviceaccount.com"
PUBLIC_OBJECT_SEARCH_PATHS="/dev-bucket/public"
PRIVATE_OBJECT_DIR="/dev-bucket/private"

# OpenAI API (optional for development)
OPENAI_API_KEY="sk-your-openai-dev-key"

# External APIs (optional for full functionality)
GFW_API_KEY="your-gfw-api-key"
WDPA_API_KEY="your-wdpa-api-key"
```

### 4. Database Migration

```bash
# Run database migrations
npm run db:push

# Verify database setup
npm run check
```

### 5. Start Development Server

```bash
# Start development server with hot reload
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏃‍♂️ Development Workflow

### Project Structure Overview

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── types/         # TypeScript type definitions
├── server/                # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication logic
│   └── lib/               # Service modules
├── shared/                # Shared TypeScript schemas
│   └── schema.ts          # Zod validation schemas
└── attached_assets/       # File storage directory
```

### Key Development Commands

```bash
# Development server (with hot reload)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm run start

# Database operations
npm run db:push          # Apply schema changes
```

### Code Style and Standards

#### TypeScript Configuration
- Strict mode enabled
- Explicit typing required
- No `any` types allowed
- Path aliases configured for clean imports

#### React Patterns
- Functional components with hooks
- TypeScript interfaces for props
- Custom hooks for shared logic
- Proper error boundaries

#### Backend Standards
- Express.js with TypeScript
- Drizzle ORM for database operations
- Zod schemas for validation
- Proper error handling middleware

### Database Development

#### Schema Changes

The project uses Drizzle ORM with PostgreSQL. Schema definitions are in `shared/schema.ts`.

```typescript
// Example schema definition
export const plots = pgTable('plots', {
  id: serial('id').primaryKey(),
  plotId: varchar('plot_id', { length: 255 }).unique().notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  name: varchar('name', { length: 255 }).notNull(),
  area: decimal('area', { precision: 10, scale: 4 }).notNull(),
  coordinates: geometry('coordinates', { type: 'polygon', srid: 4326 }),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

#### Making Schema Changes

1. Modify schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Test the changes locally
4. Commit schema changes

#### Database Queries

```typescript
// Example database operations
import { db } from './server/db';
import { plots } from '../shared/schema';

// Insert new plot
const newPlot = await db.insert(plots).values({
  plotId: 'PLOT-001',
  name: 'Test Plot',
  area: '10.5',
  coordinates: polygonGeometry
}).returning();

// Query with filters
const activePlots = await db.select()
  .from(plots)
  .where(eq(plots.status, 'active'));
```

## 🧪 Testing and Quality Assurance

### Manual Testing

#### API Testing
The application includes a built-in API test panel accessible at `/api-test` during development.

#### Frontend Testing
- Test all user workflows end-to-end
- Verify form validation and error handling
- Check responsive design on different screen sizes
- Test file upload functionality

#### Database Testing
```bash
# Test database connection
node -e "
import('./server/db.js').then(({db}) => {
  return db.select().from('plots').limit(1);
}).then(console.log).catch(console.error);
"
```

### Performance Testing

#### Database Performance
```sql
-- Enable query logging for performance analysis
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Restart PostgreSQL to apply
sudo systemctl restart postgresql

-- Monitor slow queries
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Application Performance
```bash
# Monitor memory usage during development
node --inspect server/index.ts

# Use Chrome DevTools for frontend performance
# Open Chrome DevTools > Performance tab
```

## 🔧 Development Tools

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Git Hooks (Optional)

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook for type checking
echo '#!/bin/sh
npm run check' > .husky/pre-commit

chmod +x .husky/pre-commit
```

## 🚀 Building Features

### Adding New API Endpoints

1. **Define schema** in `shared/schema.ts`:
```typescript
export const newEntitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});
```

2. **Add database table** (if needed):
```typescript
export const newEntity = pgTable('new_entity', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
});
```

3. **Create API endpoint** in `server/routes.ts`:
```typescript
app.post('/api/new-entity', async (req, res) => {
  try {
    const data = newEntitySchema.parse(req.body);
    const result = await db.insert(newEntity).values(data).returning();
    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

4. **Add frontend integration** in `client/src/lib/api.ts`:
```typescript
export async function createNewEntity(data: NewEntityInput) {
  const response = await fetch('/api/new-entity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### Adding New React Components

1. **Create component** in `client/src/components/`:
```tsx
interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button 
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Action
      </button>
    </div>
  );
}
```

2. **Export from index** if creating a component library
3. **Use in pages** with proper TypeScript types

### Integrating External APIs

Example GFW API integration:

```typescript
// server/lib/external-api-service.ts
export class ExternalAPIService {
  private baseURL = 'https://production-api.globalforestwatch.org';
  
  async getDeforestationAlerts(coordinates: number[][]) {
    const response = await fetch(`${this.baseURL}/glad-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GFW_API_KEY}`
      },
      body: JSON.stringify({ coordinates })
    });
    
    if (!response.ok) {
      throw new Error(`GFW API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## 🐛 Debugging and Troubleshooting

### Common Development Issues

1. **Database connection errors**:
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify connection string in `.env`
   - Ensure database exists and user has permissions

2. **TypeScript errors**:
   - Run `npm run check` for full type checking
   - Ensure all imports have proper types
   - Check `tsconfig.json` configuration

3. **Frontend build issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check for version conflicts in package.json
   - Verify Vite configuration

4. **API request failures**:
   - Check network tab in browser DevTools
   - Verify API endpoint exists and accepts the request method
   - Check request/response format matches schema

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm run dev

# Node.js inspector for backend debugging
node --inspect-brk server/index.ts

# Frontend debugging with source maps
# Use browser DevTools with React Developer Tools extension
```

### Database Debugging

```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'eudr_development';

-- Monitor query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

## 📚 Documentation

### Code Documentation
- Use JSDoc comments for complex functions
- Document API endpoints with expected inputs/outputs
- Include usage examples for utility functions

### Contributing Guidelines
1. Create feature branch from main
2. Follow existing code style and patterns
3. Add appropriate TypeScript types
4. Test changes locally
5. Submit pull request with description

## 🔐 Security Considerations

### Development Security
- Never commit secrets or API keys
- Use different credentials for development
- Keep dependencies updated
- Follow OWASP security guidelines

### Environment Isolation
- Use separate databases for dev/staging/production
- Different API keys for each environment
- Proper CORS configuration for development

---

This developer setup guide provides everything needed to start contributing to the KPN EUDR Platform. For specific questions about implementation details, refer to the main system documentation or contact the development team.
