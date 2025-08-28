# Overview

The KPN EUDR Platform has evolved into a comprehensive supply chain traceability and compliance management system. Originally designed for KPN Plantations Berhad's EUDR compliance, it now features a complete GS1 EPCIS 2.0-compliant traceability platform providing end-to-end provenance tracking from plots to shipments with interactive visualization, mass balance validation, and risk analytics.

The platform combines advanced traceability technology with AI-powered compliance monitoring, featuring real-time supply chain mapping, comprehensive risk assessment, and shareable chain-of-custody reports for regulatory compliance and transparency.

## Recent Changes (August 2025)

- **Complete EUDR Assessment Backend Integration** (August 28, 2025): Full database persistence and API integration:
  - Built comprehensive PostgreSQL schema with all 8 EUDR legality indicators (Land Tenure, Environmental Laws, Forest Regulations, Third-Party Rights, Labour, Human Rights, Tax/Anti-Corruption, Other National Laws)
  - Created complete backend API endpoints with authentication and error handling
  - Implemented data transformation layer between frontend forms and database schema
  - Added proper document storage support with JSONB fields for all compliance documents
  - Successfully deployed eudr_assessments table with sample data integration
  - Connected existing multi-tab frontend interface to persistent backend storage
  - All assessment data now properly saved to PostgreSQL database with full CRUD operations

- **Enhanced DDS Reports with FarmForce Structure** (August 27, 2025): Comprehensive due diligence document generation:
  - Implemented complete FarmForce EUDR DDS document structure replication
  - Added 6-section professional format: Operator Info, Overall Conclusion, Product Info, Supply Chain Mapping, Deforestation Risk, Legal Compliance
  - Integrated comprehensive risk analysis with country-specific assessments
  - Added professional document preview with KPN branding and reference numbers
  - Enhanced compliance scoring with indigenous lands assessment and mitigation measures
  - Connected to existing supply chain data, plot geolocations, and risk assessments for authentic data integration

- **Removed Estate Data Collection Module** (August 26, 2025): Eliminated duplicate functionality:
  - Removed Estate Data Collection from navigation sidebar (Building icon removed)
  - Deleted estate-data-table.tsx page component
  - Removed all estate data collection API endpoints from server routes
  - Cleaned up storage interface by removing EstateDataCollection methods
  - Consolidated estate functionality into Legality Assessment module to avoid overlap
  - Streamlined navigation from 6 modules to 5: Dashboard, Deforestation Monitoring, Legality Assessment, Supply Chain, DDS Reports

## Previous Changes
- **Persistent Sidebar Navigation**: Implemented consistent layout with always-visible module panel:
  - Updated ProtectedRoute wrapper to include Sidebar and TopBar for all module pages
  - Eliminated need for back button navigation between modules
  - Centralized layout structure for consistent user experience across all pages
  - Fixed module navigation to maintain sidebar visibility when switching between modules

- **Enhanced Deforestation Monitoring with Search**: Added comprehensive search functionality to deforestation map:
  - Renamed "Interactive OpenStreetMap" to "Real-Time Deforestation Monitoring"
  - Integrated supplier/plantation search with real-time filtering across plot names, IDs, suppliers, and locations
  - Interactive search dropdown with detailed plot information and auto-focus functionality
  - Highlighted search result markers with pulsing yellow indicators for visual clarity
  - Automatic map positioning to show search results with smooth zoom transitions

- **Merged Animated Visualization with Supply Chain Module**: Integrated interactive geospatial visualization directly into supply chain management:
  - Added "Animated Visualization" tab to Supply Chain module with real-time animated maps
  - Five-tab design: Progress, Workflow, Traceability, Analytics, Animated Visualization, Reports
  - Features bouncing markers, flowing supply routes, timeline controls with play/pause/speed adjustment
  - Multiple visualization modes: flow networks, heatmaps, risk assessment, cluster analysis
  - Playful map interactions using Leaflet, React Spring animations, and D3 color scales
  - Real-time supply chain data visualization with temporal progression and interactive controls

- **Unified Supply Chain Management Platform**: Merged multiple supply chain modules into comprehensive system:
  - Combined workflow management, traceability, and analytics into single interface
  - Simple 3-step workflow: register suppliers with legality assessment → create tier-based linkages → track tier 1 shipments
  - Complete EPCIS 2.0-compliant database with enhanced supplier workflow tables
  - Interactive supply chain visualization showing business → tier 1-4 → plots flow
  - Real-time data validation and form handling with comprehensive CRUD operations

- **Integrated Deforestation Monitoring**: Merged EUDR monitoring with plot mapping:
  - Combined satellite monitoring and plot management into unified interface  
  - Four-tab design: Overview (metrics and map), Plot Mapping (GPS coordinates and compliance), Deforestation Alerts (real-time monitoring), Live Monitoring (satellite feeds)
  - Interactive spatial mapping with polygon plot visualization and deforestation alerts
  - Multiple alert sources integration (GLAD, RADD, FORMA, Terra-i) with confidence levels
  - Layer analysis system (WDPA protected areas, KLHK legal status, GFW deforestation)
  - Advanced filtering by province, risk level, alert type, and compliance status
  - Real-time plot monitoring with before/after satellite imagery analysis

- **Streamlined Navigation**: Simplified module structure:
  - Reduced from 8 navigation items to 5 core modules
  - Consolidated related functionality to improve user workflow
  - Maintained all core features while reducing interface complexity
  - Clean module separation: Dashboard, Deforestation Monitoring, Legality Assessment, Supply Chain, DDS Reports

- **Enhanced Database Architecture**: Extended EPCIS 2.0 compliance:
  - Added supplier workflow management tables (supplier_workflow_links, workflow_shipments)
  - Enhanced suppliers table with tier management, legality scoring, and certification tracking
  - Maintained backward compatibility with existing EPCIS entities
  - PostgreSQL + PostGIS for comprehensive geospatial data management

- **Preserved Core Features**: Maintained all existing functionality:
  - AI-powered legal document auto-completion assistant
  - Real WDPA and GFW API integration for live monitoring
  - Farmer & plot information management system
  - Authentication and role-based access control
  - Export functionality and regulatory compliance reporting

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
- **Database**: PostgreSQL with PostGIS extension (configured for Neon Database with serverless connection pooling)
- **Schema Management**: Drizzle migrations with EPCIS 2.0-compliant shared schema definitions
- **Core EPCIS Entities**:
  - **Commodities**: Product definitions (CPO, FFB) with UOM and categories
  - **Parties**: Companies and organizations in the supply chain with certification tracking
  - **Facilities**: Physical locations (collection centers, mills, refineries, ports) with geospatial coordinates
  - **Lots**: Product batches with mass balance tracking and quality grades
  - **Events**: EPCIS business events (TRANSFER, TRANSFORM, AGGREGATE, DISAGGREGATE) with timestamps
  - **Event Inputs/Outputs**: Detailed lot transformations with quantity and quality tracking
  - **Shipments**: Transportation events with origin/destination facility mapping
  - **Supplier Links**: Multi-tier supplier relationships with tier classification
  - **Plots**: Farm plots with PostGIS polygon geometry and area calculations in hectares
  - **Custody Chains**: End-to-end traceability chains with status and compliance scoring
  - **Mass Balance Records**: Validation records with efficiency metrics and conversion rates
- **Legacy Entities**: 
  - Users, Suppliers, Mills, Documents, Deforestation Alerts, Surveys, Reports (maintained for backward compatibility)

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