# Overview

The KPN EUDR Platform is a comprehensive compliance management system designed to help KPN Plantations Berhad comply with the European Union Deforestation Regulation (EUDR). The platform provides tools for plot mapping, unified deforestation monitoring with satellite imagery analysis, legality assessment, supply chain traceability, and due diligence statement (DDS) report generation for palm oil operations.

The application is built as a full-stack web application with a React frontend and Express.js backend, featuring real-time monitoring capabilities, spatial visualization, and integration with Global Forest Watch for comprehensive deforestation analysis and compliance verification.

## Recent Changes (August 2025)
- **Unified EUDR Monitoring Module**: Merged country map and deforestation monitoring into a comprehensive module providing:
  - Interactive spatial map with polygon plot visualization across Indonesia
  - Real-time deforestation alert monitoring with Global Forest Watch integration
  - Comprehensive satellite imagery analysis with before/after comparisons
  - Multiple alert sources (GLAD, RADD, FORMA, Terra-i) with confidence levels
  - Layer analysis system (WDPA protected areas, KLHK legal status, GFW deforestation)
  - Advanced filtering by business entity, province, district, village, severity, and source
  - Unified plot and alert details panels with compliance status and risk assessment
  - Tabbed interface switching between spatial map, deforestation alerts, and satellite imagery
  - GFW analysis including tree cover loss/gain, biomass loss, carbon emissions
  - Protected area overlap detection and primary forest loss identification
  - Alert verification workflow with detailed compliance tracking

- **Real WDPA and GFW API Integration**: Implemented live legality verification and deforestation monitoring:
  - World Database of Protected Areas (WDPA) integration for real-time protected area verification
  - Global Forest Watch (GFW) API integration for live deforestation alerts and forest analysis
  - Comprehensive verification system combining WDPA legality checks with GFW forest monitoring
  - Real-time plot verification with combined EUDR compliance assessment
  - API fallback system providing mock data when API keys are unavailable
  - Test panel for verifying WDPA and GFW API connectivity and data quality
  - Enhanced plot data with Indonesian coordinates for authentic verification testing

- **Navigation Consistency Update**: Enhanced EUDR monitoring module layout:
  - Added Sidebar and TopBar components for consistent navigation across modules
  - Adjusted monitoring panel width to match navigation proportions (w-64)
  - Maintained all functionality while improving visual consistency with other modules

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Context-based authentication with session management
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Uppy.js integration for file handling with cloud storage support
- **API Design**: RESTful API endpoints with comprehensive error handling and logging

## Database Schema
- **Database**: PostgreSQL (configured for Neon Database with serverless connection pooling)
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Key Entities**:
  - Users (authentication and role management)
  - Suppliers (palm oil suppliers and smallholders)
  - Plots (farm plot polygons with geospatial coordinates)
  - Documents (compliance documentation and file storage)
  - Deforestation Alerts (monitoring data from external APIs)
  - Supply Chain (mills, deliveries, production lots, shipments)
  - Surveys and Reports (legality assessments and DDS reports)

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Google Cloud Storage**: File storage for documents and uploads
- **Global Forest Watch (GFW) API**: Deforestation monitoring and GLAD alerts integration
- **World Database on Protected Areas (WDPA)**: Protected area verification

### File Storage Integration
- **Uppy.js**: File upload library with support for:
  - AWS S3 integration
  - Dashboard interface
  - Drag-and-drop functionality
  - Progress tracking
  - Multiple file format support

### Monitoring and Compliance APIs
- **Forest Monitoring**: Integration with satellite-based deforestation alert systems
- **Geospatial Services**: Coordinate validation and polygon processing
- **Protected Area Verification**: Automated checking against conservation databases

### Development Tools
- **Build System**: Vite with TypeScript support and hot module replacement
- **Package Management**: npm with lock file for dependency consistency
- **Session Storage**: PostgreSQL-based session store for authentication persistence
- **Environment Configuration**: Environment variables for database connections and API keys

The architecture emphasizes type safety throughout the stack, real-time data synchronization, and scalable cloud infrastructure to support EUDR compliance requirements for palm oil supply chain management.