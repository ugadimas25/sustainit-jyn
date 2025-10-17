# Overview

The KPN EUDR Platform is a comprehensive supply chain traceability and compliance management system. It provides end-to-end provenance tracking from plots to shipments with interactive visualization, mass balance validation, and risk analytics, ensuring compliance with EUDR regulations. The platform combines advanced traceability technology with AI-powered compliance monitoring, offering real-time supply chain mapping, comprehensive risk assessment, and shareable chain-of-custody reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite.
- **UI Library**: Shadcn/ui components (Radix UI + Tailwind CSS).
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter for client-side routing.
- **Authentication**: Context-based session management.
- **Forms**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Professional light theme alignment with consistent HSL color palette, unified card styling, and application typography. Map viewer transformed into a dedicated page with enhanced interactions (click-to-zoom, full-screen interface, real-time statistics header). Persistent sidebar navigation ensures consistent user experience.

## Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **Authentication**: Passport.js with local strategy.
- **Database ORM**: Drizzle ORM.
- **File Upload**: Uppy.js integration.
- **API Design**: RESTful API endpoints with error handling.
- **Role-Based Access Control (RBAC)**: Comprehensive permission system with 3 user types and menu access control:
    - **Super Admin**: Full system access with all permissions (56 permissions total)
    - **Creator**: Data input role - can input data from Data Collection → Spatial Analysis → Legality Compliance → Risk Assessment → Supply Chain Linkage → DDS Reports. Data must be approved before proceeding to next stage (21 permissions)
    - **Approver**: Data review and approval role - can process, delete, modify, analyze or review data inputted by Creator (40 permissions)
    - **Menu Access Control**: Dynamic sidebar navigation that filters menu items based on user permissions with real-time updates and loading indicators
    - **Permission System**: API endpoint (`/api/user/permissions`) aggregates all user permissions across organizations and roles; frontend hook (`usePermissions`) provides permission checking utilities
- **Approval Workflow**: Complete approval request and history tracking system for Creator → Approver workflow with status tracking (pending, approved, rejected, cancelled)
- **User Management**: Full CRUD API for user configuration (`/api/user-config/*`) with password validation, lock/unlock functionality, and role assignment
- **Technical Implementations**:
    - **EUDR Multilayer API Integration**: Real-time deforestation analysis using an external API for GFW, JRC, and SBTN datasets.
    - **EUDR Assessment Backend Integration**: Full database persistence for 8 EUDR legality indicators with comprehensive API endpoints and document storage.
    - **Enhanced DDS Reports**: Generation of Due Diligence Statement reports replicating the FarmForce structure with 6 sections, integrated risk analysis, and branding.
    - **Data Persistence**: Dashboard metrics and analysis results persist across page navigation via localStorage and database synchronization.
    - **Results Export**: Comprehensive export options for analysis results (Excel CSV, GeoJSON) with smart naming and filtered output.
    - **Automated Workflow Integration**: All 5 data collection endpoints (Estate, Mill, Smallholder, KCP, Bulking) automatically create corresponding Supplier records with appropriate tier assignment (Tier 1/2/3) and return supplierId for seamless downstream workflow integration.
    - **UI Enhancement**: Success notifications display supplierId in toast messages, enabling users to track workflow progression from Data Collection → Spatial Analysis → Legality Assessment → DDS Reports.

## Database Schema
- **Database**: PostgreSQL with PostGIS extension (Neon Database).
- **Schema Management**: Drizzle migrations with EPCIS 2.0-compliant shared schema.
- **Core Entities**: Commodities, Parties, Facilities, Lots, Events (TRANSFER, TRANSFORM, AGGREGATE, DISAGGREGATE), Event Inputs/Outputs, Shipments, Supplier Links, Plots, Custody Chains, Mass Balance Records. Includes tables for supplier workflow management, tier management, and geospatial data for plots.

## System Design Choices
- **Comprehensive Traceability**: EPCIS 2.0-compliant platform providing end-to-end provenance.
- **AI-powered Compliance Monitoring**: Real-time supply chain mapping and risk assessment.
- **Integrated Modules**: Consolidated functionality into 6 core modules: Dashboard, Deforestation Monitoring, Data Collection, Legality Compliance, Supply Chain, DDS Reports.
- **Supply Chain Management**: Unified platform for workflow management, traceability, and analytics, featuring a 3-step workflow.
- **Deforestation Monitoring**: Integrated satellite monitoring and plot management with interactive spatial mapping, alerts from multiple sources (GLAD, RADD, FORMA, Terra-i), and a layer analysis system (WDPA, KLHK, GFW).
- **Scalability**: Designed for real-time data synchronization and scalable cloud infrastructure.

# External Dependencies

- **Neon Database**: Serverless PostgreSQL database hosting.
- **Google Cloud Storage**: File storage for documents and uploads.
- **Global Forest Watch (GFW) API**: Deforestation monitoring and GLAD alerts.
- **World Database on Protected Areas (WDPA)**: Protected area verification.
- **Uppy.js**: File upload library (AWS S3 integration, drag-and-drop).
- **EUDR Multilayer API (https://gis-development.koltivaapi.com)**: Real-time satellite data processing for deforestation analysis.