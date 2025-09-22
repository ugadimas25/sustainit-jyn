
# KPN EUDR Platform

A comprehensive supply chain traceability and compliance management system designed to ensure compliance with the EU Deforestation Regulation (EUDR). The platform provides end-to-end provenance tracking from agricultural plots to export shipments, featuring real-time deforestation monitoring, AI-powered risk assessment, and automated compliance reporting.

## 🌟 Key Features

- **End-to-End Traceability**: EPCIS 2.0-compliant supply chain tracking from plot to shipment
- **Deforestation Monitoring**: Real-time satellite monitoring with GLAD, RADD, and FORMA alerts
- **Legal Compliance Assessment**: Comprehensive EUDR legality evaluation across 8 key indicators
- **Risk Analytics**: AI-powered compliance scoring and risk factor identification
- **Interactive Mapping**: Geospatial visualization with facility locations and plot boundaries
- **Chain of Custody Management**: Mass balance validation and custody event tracking
- **Due Diligence Reporting**: Automated DDS report generation for regulatory compliance

## 🏗️ System Architecture

### Frontend Stack
- **React 18** with TypeScript and Vite
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom EUDR color palette
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **File Upload**: Uppy.js with drag-and-drop support

### Backend Stack
- **Node.js** with TypeScript and Express.js
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Drizzle ORM with type-safe queries
- **Authentication**: Passport.js with local strategy
- **File Storage**: Google Cloud Storage integration
- **AI Integration**: OpenAI GPT-4 for risk analysis

### External Integrations
- **Global Forest Watch API**: Deforestation monitoring
- **WDPA Database**: Protected area verification
- **EUDR Multilayer API**: Real-time satellite analysis
- **Google Cloud Storage**: Document management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ with PostGIS extension
- **Google Cloud Storage** account
- **OpenAI API** key
- **External API Access** to GFW, WDPA, and EUDR services

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd kpn-eudr-platform
npm install
```

### 2. Database Setup

```bash
# Install PostgreSQL with PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Create database and enable PostGIS
sudo -u postgres createdb eudr_platform
sudo -u postgres psql eudr_platform -c "CREATE EXTENSION postgis;"

# Run migrations
npm run db:push
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/eudr_platform"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_PRIVATE_KEY="your-private-key"
GOOGLE_CLOUD_CLIENT_EMAIL="your-client-email"
PUBLIC_OBJECT_SEARCH_PATHS="/your-bucket/public"
PRIVATE_OBJECT_DIR="/your-bucket/private"

# OpenAI Integration
OPENAI_API_KEY="your-openai-api-key"

# Session Configuration
SESSION_SECRET="your-session-secret"

# Application Configuration
NODE_ENV="development"
PORT=5000
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🛠️ Production Deployment

### Environment Setup

1. **Server Requirements**:
   - Ubuntu 20.04+ or similar Linux distribution
   - Node.js 18+, PostgreSQL 14+, PostGIS
   - SSL certificate for HTTPS
   - Minimum 4GB RAM, 2 CPU cores

2. **Build Application**:
```bash
npm run build
```

3. **Start Production Server**:
```bash
npm run start
```

### Database Configuration

```sql
-- Create production database
CREATE DATABASE eudr_platform_prod;

-- Enable PostGIS extension
CREATE EXTENSION postgis;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_plots_coordinates ON plots USING GIST (coordinates);
CREATE INDEX CONCURRENTLY idx_events_timestamp ON events (timestamp);
CREATE INDEX CONCURRENTLY idx_suppliers_status ON suppliers (status);
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
echo 'module.exports = {
  apps: [{
    name: "eudr-platform",
    script: "dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: "max",
    exec_mode: "cluster"
  }]
}' > ecosystem.config.js

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Core Modules

### 1. Dashboard Module
Executive overview with real-time metrics, compliance status, and risk analytics.

### 2. Deforestation Monitoring
Satellite-based forest loss detection with GLAD, RADD, and FORMA alerts integration.

### 3. Data Collection
Standardized forms for estates, mills, smallholders, and processing facilities.

### 4. Legality Compliance
Comprehensive EUDR assessment across 8 legal indicators with document management.

### 5. Supply Chain Traceability
EPCIS 2.0-compliant tracking with mass balance validation and lineage visualization.

### 6. Map Viewer
Interactive geospatial platform with multi-layer mapping and spatial analytics.

## 🔧 Development Guide

### Project Structure

```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/              # Express.js backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   ├── auth.ts          # Authentication logic
│   └── lib/             # Service modules
├── shared/              # Shared TypeScript schemas
└── attached_assets/     # File storage directory
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user

#### Dashboard
- `GET /api/dashboard/metrics` - Key performance indicators
- `GET /api/dashboard/compliance-chart` - Compliance trend data

#### Plots Management
- `GET /api/plots` - List all plots
- `POST /api/plots` - Create new plot
- `POST /api/plots/bulk-upload` - Bulk GeoJSON/KML upload

#### EUDR Assessments
- `GET /api/eudr-assessments` - List assessments
- `POST /api/eudr-assessments` - Create/update assessment

### Database Schema

Key tables include:
- `plots` - Agricultural plot polygons with geospatial data
- `suppliers` - Supply chain entity information
- `eudr_assessments` - Legal compliance evaluations
- `custody_chains` - EPCIS traceability events
- `deforestation_alerts` - Satellite monitoring results

## 🧪 Testing

```bash
# Run type checking
npm run check

# Test database connection
node -e "import('./server/db.js').then(({db}) => db.select().from('plots').limit(1))"
```

## 📚 API Documentation

The platform provides both REST and GraphQL APIs:

### REST API
Standard HTTP endpoints for CRUD operations, file uploads, and external service integration.

### GraphQL API
Complex queries for supply chain lineage, traceability analysis, and multi-entity relationships.

Example GraphQL query:
```graphql
query GetFullLineage($entityId: String!, $entityType: String!) {
  getFullLineage(entityId: $entityId, entityType: $entityType) {
    entityId
    totalNodes
    nodes { id, type, name, riskLevel }
    edges { source, target, type, quantity }
    riskAssessment { overallRisk, riskFactors }
  }
}
```

## 🔒 Security

- **Authentication**: Passport.js with secure session management
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **File Upload Security**: Type validation, size limits
- **CORS Configuration**: Restricted to application domain

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify PostgreSQL is running and accessible
   - Check DATABASE_URL format and credentials
   - Ensure PostGIS extension is installed

2. **File Upload Failures**:
   - Verify Google Cloud Storage configuration
   - Check bucket permissions and access keys
   - Ensure file size limits are appropriate

3. **External API Timeouts**:
   - Check network connectivity to GFW, WDPA APIs
   - Verify API keys and rate limits
   - Consider implementing retry logic

### Performance Optimization

- Enable database query logging for slow queries
- Implement connection pooling for high-traffic scenarios
- Use CDN for static assets in production
- Configure appropriate caching headers

## 📄 License

This project is proprietary software developed for KPN EUDR compliance requirements.

## 🤝 Support

For technical support and development questions:
- Review the comprehensive system documentation
- Check the troubleshooting guide above
- Refer to the API documentation for integration details

---

**Built with ❤️ for sustainable supply chain management**
