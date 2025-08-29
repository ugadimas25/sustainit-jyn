
# KPN EUDR Platform - System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Technical Stack](#technical-stack)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Security & Authentication](#security--authentication)
8. [Deployment & Infrastructure](#deployment--infrastructure)
9. [Integration Points](#integration-points)
10. [User Workflows](#user-workflows)
11. [Development Guidelines](#development-guidelines)
12. [Monitoring & Analytics](#monitoring--analytics)

## System Overview

The KPN EUDR Platform is a comprehensive supply chain traceability and compliance management system designed to ensure compliance with the EU Deforestation Regulation (EUDR). The platform provides end-to-end provenance tracking from agricultural plots to export shipments, featuring real-time deforestation monitoring, AI-powered risk assessment, and automated compliance reporting.

### Key Features
- **End-to-End Traceability**: EPCIS 2.0-compliant supply chain tracking from plot to shipment
- **Deforestation Monitoring**: Real-time satellite monitoring with GLAD, RADD, and FORMA alerts
- **Legal Compliance Assessment**: Comprehensive EUDR legality evaluation across 8 key indicators
- **Risk Analytics**: AI-powered compliance scoring and risk factor identification
- **Interactive Mapping**: Geospatial visualization with facility locations and plot boundaries
- **Chain of Custody Management**: Mass balance validation and custody event tracking
- **Due Diligence Reporting**: Automated DDS report generation for regulatory compliance

### Business Value
- **Regulatory Compliance**: Ensure EUDR compliance for palm oil supply chains
- **Risk Mitigation**: Early identification and resolution of deforestation risks
- **Supply Chain Visibility**: Complete transparency from source to destination
- **Operational Efficiency**: Automated data collection and compliance workflows
- **Stakeholder Trust**: Verifiable sustainability credentials and transparent reporting

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/TS)    │◄──►│   (Node.js/TS)  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
├─ Dashboard            ├─ REST APIs           ├─ Global Forest Watch
├─ Mapping Interface    ├─ GraphQL API        ├─ WDPA Database
├─ Data Collection      ├─ Authentication     ├─ EUDR Multilayer API
├─ Compliance Forms     ├─ File Processing    ├─ Google Cloud Storage
├─ Reporting            └─ Background Jobs    └─ Neon PostgreSQL
└─ Analytics
```

### System Components

#### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom EUDR color palette
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: Uppy.js with drag-and-drop support

#### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with local strategy
- **API Types**: REST endpoints + GraphQL for complex queries
- **File Storage**: Google Cloud Storage integration
- **Background Processing**: Queue-based job processing

### Data Flow Architecture
```
Plot Data → Data Collection → Validation → Storage → Analysis → Reporting
    ↓              ↓             ↓         ↓         ↓         ↓
Geospatial → Form Validation → Database → Risk AI → Dashboard → DDS Reports
Coordinates    Field Rules     PostgreSQL  OpenAI    Metrics   PDF Export
```

## Core Modules

### 1. Dashboard Module
**Purpose**: Executive overview and key performance indicators
- **Real-time Metrics**: Total plots, compliance status, active alerts
- **Compliance Overview**: EUDR compliance by supplier and region
- **Risk Summary**: Critical alerts, high-risk plots, trend analysis
- **Quick Actions**: Navigation to key workflows and reports

### 2. Deforestation Monitoring Module
**Purpose**: Satellite-based forest loss detection and alert management
- **Alert Sources**: GLAD, RADD, FORMA, Terra-i integration
- **Spatial Analysis**: Interactive map with plot boundaries and alerts
- **Risk Assessment**: AI-powered severity classification
- **Verification Workflow**: Alert investigation and resolution tracking

### 3. Data Collection Module
**Purpose**: Standardized data capture for supply chain entities
- **Multi-Entity Forms**: Estates, mills, bulking stations, KCPs, smallholders
- **Document Management**: PDF upload with 10MB size limits
- **Validation Rules**: Field-level validation based on entity type
- **Progress Tracking**: Form completion status and mandatory field indicators

### 4. Legality Compliance Module
**Purpose**: Comprehensive EUDR legal assessment across 8 indicators
- **Legal Indicators**: Land tenure, environmental, forest, third-party rights, labor, human rights, tax/anti-corruption, other laws
- **Dynamic Validation**: Context-aware mandatory fields based on supplier type
- **Document Repository**: Legal document storage and management
- **Assessment Workflow**: Draft → Review → Approval process

### 5. Supply Chain Traceability Module
**Purpose**: End-to-end provenance tracking with mass balance validation
- **EPCIS 2.0 Compliance**: Standardized event tracking (TRANSFER, TRANSFORM, AGGREGATE, DISAGGREGATE)
- **Chain of Custody**: Lot tracking from harvest to shipment
- **Mass Balance Validation**: Automated input/output reconciliation
- **Lineage Visualization**: Interactive supply chain mapping

### 6. Map Viewer Module
**Purpose**: Geospatial visualization and analysis platform
- **Multi-layer Mapping**: Plot boundaries, facilities, protected areas
- **Satellite Imagery**: High-resolution imagery with before/after comparison
- **Spatial Analytics**: Distance calculations, overlap analysis
- **Export Capabilities**: GeoJSON, KML format support

## Technical Stack

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.0",
  "vite": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "@radix-ui/react-*": "Latest",
  "tailwindcss": "^3.3.0",
  "wouter": "^3.0.0",
  "react-hook-form": "^7.45.0",
  "zod": "^3.22.0",
  "@uppy/core": "^3.5.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "typescript": "^5.2.0",
  "drizzle-orm": "^0.28.0",
  "passport": "^0.6.0",
  "apollo-server-express": "^3.12.0",
  "graphql": "^16.8.0",
  "openai": "^4.0.0",
  "pg": "^8.11.0",
  "@google-cloud/storage": "^7.0.0"
}
```

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript with strict mode
- **Code Quality**: ESLint + Prettier
- **Database Migrations**: Drizzle migrations
- **API Testing**: Built-in API test panel
- **Hot Reload**: Vite HMR for frontend, tsx for backend

## Database Schema

### Core Entity Relationships
```sql
-- Plots (Source of materials)
plots ←→ deliveries ←→ production_lots ←→ shipments

-- Supply chain hierarchy
suppliers ←→ facilities ←→ custody_chains ←→ events

-- Compliance tracking
eudr_assessments ←→ suppliers
deforestation_alerts ←→ plots
```

### Key Tables

#### Plots Table
```sql
CREATE TABLE plots (
  id SERIAL PRIMARY KEY,
  plot_id VARCHAR(255) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  name VARCHAR(255) NOT NULL,
  area DECIMAL(10,4) NOT NULL,
  coordinates GEOMETRY(POLYGON, 4326),
  status VARCHAR(50) DEFAULT 'active',
  legality_status VARCHAR(50) DEFAULT 'pending',
  deforestation_risk VARCHAR(50) DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### EUDR Assessments Table
```sql
CREATE TABLE eudr_assessments (
  id SERIAL PRIMARY KEY,
  supplier_type VARCHAR(50) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  -- Land Tenure Fields
  tenure_type VARCHAR(50),
  land_area DECIMAL(10,4),
  -- Environmental Fields
  permit_type VARCHAR(50),
  permit_number VARCHAR(100),
  -- Additional compliance fields...
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Custody Chains Table
```sql
CREATE TABLE custody_chains (
  id SERIAL PRIMARY KEY,
  chain_id VARCHAR(100) UNIQUE NOT NULL,
  source_plot_id INTEGER REFERENCES plots(id),
  source_facility_id INTEGER REFERENCES facilities(id),
  destination_facility_id INTEGER REFERENCES facilities(id),
  product_type VARCHAR(100) NOT NULL,
  total_quantity DECIMAL(12,4) NOT NULL,
  remaining_quantity DECIMAL(12,4) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Spatial Data Support
- **PostGIS Extension**: Enabled for geospatial operations
- **Coordinate System**: WGS84 (EPSG:4326)
- **Spatial Indexes**: GIST indexes on geometry columns
- **Spatial Queries**: Distance calculations, intersection checks

## API Reference

### REST API Endpoints

#### Authentication
```
POST /api/auth/login    - User authentication
POST /api/auth/logout   - User logout
GET  /api/user         - Get current user
```

#### Dashboard
```
GET /api/dashboard/metrics           - Key performance indicators
GET /api/dashboard/compliance-chart  - Compliance trend data
GET /api/dashboard/risk-summary      - Risk analysis summary
```

#### Plots Management
```
GET    /api/plots              - List all plots
GET    /api/plots/:id          - Get specific plot
POST   /api/plots              - Create new plot
PUT    /api/plots/:id          - Update plot
DELETE /api/plots/:id          - Delete plot
POST   /api/plots/bulk-upload  - Bulk plot upload (GeoJSON/KML)
```

#### EUDR Assessments
```
GET  /api/eudr-assessments     - List assessments
GET  /api/eudr-assessments/:id - Get specific assessment
POST /api/eudr-assessments     - Create/update assessment
```

#### Deforestation Monitoring
```
GET /api/alerts                    - Get active alerts
GET /api/alerts/gfw/:plotId        - Get GFW analysis for plot
POST /api/alerts/verify            - Verify/resolve alert
GET /api/multilayer-analysis       - External API integration
```

#### File Management
```
POST /api/files/upload    - Upload documents (PDF, images)
GET  /api/files/:id       - Download file
DELETE /api/files/:id     - Delete file
```

### GraphQL API

#### Traceability Queries
```graphql
query GetFullLineage($entityId: String!, $entityType: String!) {
  getFullLineage(entityId: $entityId, entityType: $entityType) {
    entityId
    entityType
    totalNodes
    nodes {
      id
      type
      name
      riskLevel
      certifications
      coordinates {
        latitude
        longitude
      }
    }
    edges {
      source
      target
      type
      quantity
    }
    riskAssessment {
      overallRisk
      riskFactors {
        type
        severity
        description
      }
      compliance {
        eudrCompliant
        rspoCompliant
      }
    }
  }
}
```

#### Supply Chain Queries
```graphql
query GetSupplierTiers($millId: ID) {
  getSupplierTiers(millId: $millId) {
    id
    supplier {
      name
      supplierType
    }
    tierLevel
    performanceScore
    riskRating
  }
}
```

### API Response Formats

#### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Security & Authentication

### Authentication System
- **Strategy**: Passport.js with local strategy
- **Session Management**: Express session with PostgreSQL store
- **Password Security**: Bcrypt hashing with salt rounds
- **Route Protection**: Middleware-based authentication checks

### Data Security
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **File Upload Security**: Type validation, size limits, virus scanning
- **CORS Configuration**: Restricted to application domain

### Access Control
- **Role-Based Access**: User roles (admin, auditor, data_collector, viewer)
- **Resource-Level Permissions**: Entity-specific access controls
- **API Rate Limiting**: Request throttling for public endpoints
- **Audit Logging**: Comprehensive activity logging

### Data Privacy
- **GDPR Compliance**: Data minimization and retention policies
- **Encryption**: TLS 1.3 for data in transit
- **Database Security**: Connection string encryption
- **PII Protection**: Anonymization for analytics data

## Deployment & Infrastructure

### Replit Deployment
- **Platform**: Replit for development and production hosting
- **Port Configuration**: Port 5000 forwarded to 80/443 in production
- **Environment Variables**: Secure configuration via Replit Secrets
- **Automatic Scaling**: Replit's auto-scaling infrastructure

### Database Infrastructure
- **Primary Database**: Neon PostgreSQL (serverless)
- **Connection Pooling**: Built-in connection management
- **Backup Strategy**: Automated daily backups
- **Migration Management**: Drizzle migrations for schema changes

### External Services
- **File Storage**: Google Cloud Storage for document management
- **AI Services**: OpenAI GPT-4 for risk analysis and insights
- **Monitoring APIs**: GFW, WDPA, EUDR Multilayer API integration
- **CDN**: Replit's edge network for static asset delivery

### Performance Optimization
- **Frontend**: Vite build optimization, code splitting, lazy loading
- **Backend**: Express.js with compression middleware
- **Database**: Optimized queries with proper indexing
- **Caching**: React Query for client-side caching

## Integration Points

### External API Integrations

#### Global Forest Watch (GFW)
```typescript
// Get deforestation alerts for specific coordinates
const gfwService = new GFWService();
const alerts = await gfwService.getGLADAlerts(coordinates, startDate, endDate);
```

#### WDPA Protected Areas
```typescript
// Check if plot overlaps with protected areas
const wdpaService = new WDPAService();
const protectedStatus = await wdpaService.checkProtectedArea(plotCoordinates);
```

#### EUDR Multilayer API
```typescript
// Real-time satellite analysis
const response = await fetch('https://eudr-multilayer-api.fly.dev/analyze', {
  method: 'POST',
  body: JSON.stringify({ coordinates, datasets: ['GFW', 'JRC', 'SBTN'] })
});
```

### Data Import/Export

#### Supported Formats
- **Import**: GeoJSON, KML, CSV, Excel
- **Export**: PDF (reports), Excel (data), GeoJSON (spatial)

#### Bulk Operations
- **Plot Upload**: Batch processing of geospatial data
- **Document Management**: Multi-file upload with progress tracking
- **Report Generation**: Automated PDF report creation

## User Workflows

### 1. New Supplier Onboarding
1. **Data Collection**: Complete supplier information form
2. **Plot Mapping**: Upload plot boundaries (GeoJSON/KML)
3. **Document Upload**: Submit required legal documents
4. **Legality Assessment**: Complete 8-indicator EUDR evaluation
5. **Review & Approval**: Supervisor review and approval process

### 2. Deforestation Alert Response
1. **Alert Detection**: Automated satellite monitoring triggers alert
2. **Risk Classification**: AI-powered severity assessment
3. **Investigation**: Field verification and documentation
4. **Resolution**: Corrective action plan and implementation
5. **Reporting**: Compliance report generation

### 3. Supply Chain Traceability
1. **Chain Creation**: Initialize custody chain from harvest
2. **Event Tracking**: Record transformation and transfer events
3. **Mass Balance Validation**: Automated input/output reconciliation
4. **Lineage Analysis**: Full backward/forward traceability
5. **Export Documentation**: Generate chain-of-custody certificates

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, explicit typing required
- **React Patterns**: Functional components, hooks, proper state management
- **API Design**: RESTful principles, consistent response formats
- **Error Handling**: Comprehensive error boundaries and logging

### Testing Strategy
- **Unit Testing**: Component-level testing with React Testing Library
- **Integration Testing**: API endpoint testing
- **E2E Testing**: Critical user journey validation
- **Performance Testing**: Load testing for API endpoints

### Development Workflow
1. **Feature Branches**: Git flow with feature branches
2. **Code Review**: Peer review required for all changes
3. **Testing**: Automated test suite execution
4. **Deployment**: Continuous deployment via Replit

### Best Practices
- **Component Design**: Reusable, accessible UI components
- **Performance**: Lazy loading, code splitting, optimization
- **Security**: Input validation, secure authentication
- **Documentation**: Comprehensive inline documentation

## Monitoring & Analytics

### Application Monitoring
- **Performance Metrics**: Response times, throughput, error rates
- **User Analytics**: Feature usage, user journey tracking
- **System Health**: Database performance, API availability
- **Alert System**: Automated alerting for critical issues

### Business Intelligence
- **Compliance Dashboard**: Real-time compliance metrics
- **Risk Analytics**: Trend analysis and predictive insights
- **Supply Chain Visibility**: End-to-end traceability reports
- **Regulatory Reporting**: Automated EUDR compliance reports

### Data Analytics
- **Plot Analysis**: Deforestation risk assessment
- **Supplier Performance**: Compliance scoring and ranking
- **Geographic Insights**: Regional risk pattern analysis
- **Trend Analysis**: Historical compliance trend monitoring

---

## Version Information
- **Documentation Version**: 1.0
- **Last Updated**: January 2024
- **Platform Version**: EUDR Platform v1.0
- **Next Review Date**: March 2024

## Support & Maintenance
- **Technical Support**: Available via platform support portal
- **System Updates**: Monthly feature releases, weekly security updates
- **Training Resources**: User guides, video tutorials, API documentation
- **Service Level Agreement**: 99.9% uptime, <2 second response time

---

*This documentation is maintained by the KPN EUDR Platform development team. For questions or updates, please contact the system administrators.*
