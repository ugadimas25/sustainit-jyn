// Application Constants for KPN Compliance Platform

// EUDR Compliance Constants
export const EUDR_CONSTANTS = {
  CUTOFF_DATE: '2020-12-31',
  REQUIRED_COORDINATE_PRECISION: 6, // decimal places
  SUPPORTED_COORDINATE_SYSTEMS: ['WGS84'],
  HS_CODES: {
    // Palm oil and related products comprehensive list
    PALM_NUTS_KERNELS: '1207.10',
    CRUDE_PALM_OIL: '1511.10',
    REFINED_PALM_OIL: '1511.90',
    CRUDE_PALM_KERNEL_OIL: '1513.21',
    REFINED_PALM_KERNEL_OIL: '1513.29',
    PALM_OIL_CAKE_RESIDUES: '2306.60',
    GLYCEROL_95_PERCENT: '2905.45',
    PALMITIC_STEARIC_ACID: '2915.70',
    SATURATED_MONOCARBOXYLIC_ACIDS: '2915.90',
    STEARIC_ACID_INDUSTRIAL: '3823.11',
    OLEIC_ACID_INDUSTRIAL: '3823.12',
    INDUSTRIAL_FATTY_ACIDS: '3823.19',
    INDUSTRIAL_FATTY_ALCOHOLS: '3823.70'
  },
  TRACES_SUBMISSION_FORMATS: ['XML', 'PDF']
} as const;

// HS Codes with descriptions for palm oil products
export const PALM_OIL_HS_CODES = [
  { code: '1207.10', description: 'Palm nuts and kernels' },
  { code: '1511.10', description: 'Crude palm oil and its fractions, whether or not refined, but not chemically modified' },
  { code: '1511.90', description: 'Refined palm oil and its fractions, whether or not refined, but not chemically modified' },
  { code: '1513.21', description: 'Crude palm kernel and babassu oil and fractions thereof, whether or not refined, but not chemically modified' },
  { code: '1513.29', description: 'Palm kernel and babassu oil and their fractions, whether or not refined, but not chemically modified (excluding crude oil)' },
  { code: '2306.60', description: 'Oilcake and other solid residues of palm nuts or kernels, whether or not ground or in the form of pellets, resulting from the extraction of palm nut or kernel fats or oils' },
  { code: '2905.45', description: 'Glycerol, with a purity of 95% or more (calculated on the weight of the dry product)' },
  { code: '2915.70', description: 'Palmitic acid, stearic acid, their salts and esters' },
  { code: '2915.90', description: 'Saturated acyclic monocarboxylic acids, their anhydrides, halides, peroxides and peroxyacids; their halogenated, sulphonated, nitrated or nitrosated derivatives (excluding formic acid, acetic acid, mono-, di- or trichloroacetic acids, propionic acid, butanoic acids, pentanoic acids, palmitic acid, stearic acid, their salts and esters, and acetic anhydride)' },
  { code: '3823.11', description: 'Stearic acid, industrial' },
  { code: '3823.12', description: 'Oleic acid, industrial' },
  { code: '3823.19', description: 'Industrial monocarboxylic fatty acids; acid oils from refining (excluding stearic acid, oleic acid and tall oil fatty acids)' },
  { code: '3823.70', description: 'Industrial fatty alcohols' }
] as const;

// Scientific names for EUDR commodities
export const SCIENTIFIC_NAMES = [
  { name: 'Elaeis guineensis', description: 'African oil palm' },
  { name: 'Elaeis oleifera', description: 'American oil palm' },
  { name: 'Cocos nucifera', description: 'Coconut palm' },
  { name: 'Theobroma cacao', description: 'Cacao tree' },
  { name: 'Coffea arabica', description: 'Arabica coffee' },
  { name: 'Coffea canephora', description: 'Robusta coffee' },
  { name: 'Glycine max', description: 'Soybean' },
  { name: 'Bos taurus', description: 'Cattle' },
  { name: 'Hevea brasiliensis', description: 'Rubber tree' }
] as const;

// Plot Status Types
export const PLOT_STATUS = {
  COMPLIANT: 'compliant',
  AT_RISK: 'at_risk', 
  CRITICAL: 'critical',
  PENDING: 'pending'
} as const;

// Legality Status Types  
export const LEGALITY_STATUS = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  ISSUES: 'issues'
} as const;

// Deforestation Risk Levels
export const DEFORESTATION_RISK = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  UNKNOWN: 'unknown'
} as const;

// Alert Sources
export const ALERT_SOURCES = {
  GLAD: 'GLAD',
  RADD: 'RADD', 
  FIRES: 'FIRES'
} as const;

// Alert Severity Levels
export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high', 
  CRITICAL: 'critical'
} as const;

// Alert Status
export const ALERT_STATUS = {
  ACTIVE: 'active',
  INVESTIGATED: 'investigated',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive'
} as const;

// Document Types
export const DOCUMENT_TYPES = {
  LAND_TITLE: 'land_title',
  ENVIRONMENTAL_PERMIT: 'environmental_permit',
  OPERATING_PERMIT: 'operating_permit',
  FPIC: 'fpic',
  BUSINESS_LICENSE: 'business_license',
  RSPO_CERTIFICATE: 'rspo_certificate',
  ISPO_CERTIFICATE: 'ispo_certificate',
  OTHER: 'other'
} as const;

// Document Verification Status
export const VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  REJECTED: 'rejected'
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MILL_MANAGER: 'mill_manager',
  COMPLIANCE_OFFICER: 'compliance_officer'
} as const;

// Supplier Types
export const SUPPLIER_TYPES = {
  SMALLHOLDER: 'smallholder',
  COMPANY: 'company'
} as const;

// Product Types
export const PRODUCT_TYPES = {
  CRUDE_PALM_OIL: 'crude_palm_oil',
  REFINED_PALM_OIL: 'refined_palm_oil',
  PALM_KERNEL_OIL: 'palm_kernel_oil'
} as const;

// Shipment Status
export const SHIPMENT_STATUS = {
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered'
} as const;

// DDS Report Status
export const DDS_REPORT_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SUBMITTED: 'submitted'
} as const;

// DDS Statement Types
export const DDS_STATEMENT_TYPES = {
  INITIAL: 'initial',
  UPDATED: 'updated',
  CORRECTIVE: 'corrective'
} as const;

// DDS Geolocation Types
export const DDS_GEOLOCATION_TYPES = {
  PLOT: 'plot',
  FACILITY: 'facility',
  POINT: 'point'
} as const;

// Survey Templates
export const SURVEY_TEMPLATES = {
  EUDR_BASIC: 'eudr_basic',
  INDONESIAN_LAW: 'indonesian_law',
  RSPO: 'rspo',
  CUSTOM: 'custom'
} as const;

// GFW API Configuration
export const GFW_CONFIG = {
  BASE_URL: 'https://data-api.globalforestwatch.org',
  GLAD_ENDPOINT: '/v1/glad-alerts',
  RADD_ENDPOINT: '/v1/radd-alerts',
  FIRES_ENDPOINT: '/v1/fire-alerts',
  ALERT_FREQUENCIES: ['daily', 'weekly', 'monthly'],
  CONFIDENCE_THRESHOLDS: {
    LOW: 50,
    MEDIUM: 70,
    HIGH: 90
  },
  MAX_BUFFER_ZONE_KM: 10
} as const;

// WDPA API Configuration  
export const WDPA_CONFIG = {
  BASE_URL: 'https://api.protectedplanet.net',
  PROTECTED_AREAS_ENDPOINT: '/v3/protected_areas',
  COUNTRIES_ENDPOINT: '/v3/countries'
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 2.5, lng: 99.5 }, // Indonesia palm oil region
  DEFAULT_ZOOM: 8,
  MIN_ZOOM: 6,
  MAX_ZOOM: 18,
  TILE_LAYERS: {
    SATELLITE: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    TERRAIN: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    FOREST: 'https://tiles.globalforestwatch.org/gfw_2020/{z}/{x}/{y}.png'
  }
} as const;

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_DOCUMENT_TYPES: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  ALLOWED_POLYGON_TYPES: ['.kml', '.geojson', '.shp', '.gpx'],
  MAX_FILES_PER_UPLOAD: 5
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIMESTAMP: 'yyyy-MM-dd HH:mm:ss',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
} as const;

// Color Schemes (matching CSS variables)
export const COLORS = {
  FOREST: 'hsl(142, 36%, 28%)',
  FOREST_LIGHT: 'hsl(142, 49%, 53%)',
  FOREST_DARK: 'hsl(142, 43%, 20%)',
  WARNING: 'hsl(39, 100%, 50%)',
  CRITICAL: 'hsl(4, 90%, 58%)',
  PROFESSIONAL: 'hsl(207, 90%, 54%)',
  NEUTRAL_BG: 'hsl(0, 0%, 98%)',
  NEUTRAL_BORDER: 'hsl(0, 0%, 88%)'
} as const;

// Validation Constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TEXT_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_AREA_HECTARES: 0.1,
  MAX_AREA_HECTARES: 10000,
  COORDINATE_DECIMAL_PLACES: 6
} as const;

// API Response Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'kpn_eudr_user_preferences',
  MAP_SETTINGS: 'kpn_eudr_map_settings',
  FILTER_SETTINGS: 'kpn_eudr_filter_settings',
  SELECTED_PLOTS_FOR_DDS: 'selectedPlotsForDDS'
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_REAL_TIME_ALERTS: true,
  ENABLE_ADVANCED_ANALYTICS: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_EXPORT_FUNCTIONALITY: true,
  ENABLE_MOBILE_RESPONSIVE: true
} as const;

// Indonesian Regions (for filtering)
export const INDONESIAN_REGIONS = [
  'Sumatra',
  'Kalimantan', 
  'Sulawesi',
  'Java',
  'Papua',
  'Maluku',
  'Nusa Tenggara'
] as const;

// EU Countries (for DDS destination)
export const EU_COUNTRIES = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DK', name: 'Denmark' },
  { code: 'SE', name: 'Sweden' }
] as const;

// Quality Grades
export const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C'] as const;

// Mills in Indonesia (mock data for selection)
export const MILLS = [
  'KPN Mill Sumatra',
  'KPN Mill Kalimantan', 
  'KPN Mill Sulawesi',
  'KPN Mill Riau',
  'KPN Mill Jambi'
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_COORDINATES: 'Invalid coordinates format.',
  DUPLICATE_PLOT_ID: 'Plot ID already exists.',
  MISSING_DOCUMENTS: 'Required documents are missing.',
  EXPIRED_DOCUMENTS: 'Some documents have expired and need renewal.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  UPLOADED: 'File uploaded successfully.',
  VERIFIED: 'Verification completed.',
  GENERATED: 'Report generated successfully.',
  SUBMITTED: 'Submitted successfully.'
} as const;
