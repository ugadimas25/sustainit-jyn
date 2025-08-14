# Overview

The KPN EUDR Platform has evolved into a comprehensive supply chain traceability and compliance management system. Originally designed for KPN Plantations Berhad's EUDR compliance, it now features a complete GS1 EPCIS 2.0-compliant traceability platform providing end-to-end provenance tracking from plots to shipments with interactive visualization, mass balance validation, and risk analytics.

The platform combines advanced traceability technology with AI-powered compliance monitoring, featuring real-time supply chain mapping, comprehensive risk assessment, and shareable chain-of-custody reports for regulatory compliance and transparency.

## Recent Changes (August 2025)
- **Complete GS1 EPCIS 2.0-Compliant Traceability Platform**: Built comprehensive supply chain traceability system:
  - Complete database restructuring with EPCIS 2.0 specification compliance (Party, Facility, Commodity, Lot, Event, EventInput/Output, Shipment, SupplierLink, Plot, ExternalLayer)
  - PostGIS integration with EPSG:4326 coordinate system and hectare area calculations for spatial data
  - Event sourcing architecture with TRANSFER|TRANSFORM|AGGREGATE|DISAGGREGATE operations
  - Comprehensive storage services with full CRUD operations for all EPCIS entities
  - Interactive supply chain visualization with node-based mapping and flow diagrams
  - Real-time mass balance validation with efficiency tracking and conversion rate analysis
  - Advanced risk assessment with AI-powered compliance scoring and factor identification
  - GraphQL API for complex traceability queries (forward/backward tracing, full lineage)
  - Chain-of-custody management with lot tracking and quality grade monitoring
  - Facility management with capacity monitoring, certification tracking, and risk classification
  - Shareable traceability reports with export functionality and regulatory compliance formatting
  - Five-tab interface: Overview, Supply Chain Map, Chain of Custody, Facilities, Risk Analytics
  - Sample data integration with realistic Indonesian palm oil supply chain examples

- **Enhanced Database Architecture**: Migrated to EPCIS 2.0 standards:
  - PostgreSQL + PostGIS for geo-spatial data with proper coordinate system support
  - Event sourcing for complete audit trail and transaction history
  - Mass balance tracking with automatic validation and efficiency calculations
  - Graph-friendly data model for complex supply chain relationship queries
  - Comprehensive entity relationships supporting multi-tier supplier networks

- **Interactive Visualization Platform**: Advanced supply chain mapping:
  - Node-based supply chain visualization with level-based flow diagrams
  - Interactive node selection with detailed facility and lot information panels
  - Risk level color coding and certification badge display
  - Distance calculations and efficiency metrics per supply chain tier
  - Geospatial coordinate display with latitude/longitude precision
  - Mass balance flow visualization with input/output quantity tracking

- **Comprehensive Risk Analytics**: AI-powered compliance monitoring:
  - Overall risk assessment with severity classification (low, medium, high, critical)
  - Compliance score calculation with EUDR and RSPO verification
  - Mass balance validation with efficiency thresholds and conversion rate analysis
  - Risk factor identification with mitigation recommendations
  - Supply chain depth analysis with total node counting
  - Facility efficiency benchmarking and performance monitoring

- **Legacy Module Integration**: Maintained backward compatibility:
  - Preserved existing farmer & plot information management system
  - Continued EUDR monitoring with satellite imagery analysis
  - Maintained AI-powered legal document auto-completion assistant
  - Integrated authentication and visual consistency across all modules
  - Preserved real WDPA and GFW API integration for deforestation monitoring

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