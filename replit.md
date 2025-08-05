# Overview

The KPN EUDR Platform is a comprehensive compliance management system designed to help KPN Plantations Berhad comply with the European Union Deforestation Regulation (EUDR). The platform provides tools for plot mapping, deforestation monitoring, legality assessment, supply chain traceability, and due diligence statement (DDS) report generation for palm oil operations.

The application is built as a full-stack web application with a React frontend and Express.js backend, featuring real-time monitoring capabilities, interactive mapping, and integration with external APIs for deforestation alerts and compliance verification.

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