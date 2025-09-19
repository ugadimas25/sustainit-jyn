import { pgTable, serial, text, timestamp, boolean, integer, decimal, jsonb, varchar, date, uuid, pgEnum } from "drizzle-orm/pg-core";
import { geometry } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enable PostGIS extension for geospatial data
// This will be handled in the migration

// Enums for better type safety
export const partyTypeEnum = pgEnum("party_type", ["grower", "mill", "trader", "manufacturer", "port", "warehouse"]);
export const facilityTypeEnum = pgEnum("facility_type", ["plot", "mill", "warehouse", "port", "collection_center", "processing_center", "refinery"]);
export const eventTypeEnum = pgEnum("event_type", ["TRANSFER", "TRANSFORM", "AGGREGATE", "DISAGGREGATE"]);
export const businessStepEnum = pgEnum("business_step", ["harvesting", "processing", "shipping", "receiving", "storing", "transformation", "aggregation", "disaggregation"]);
export const dispositionEnum = pgEnum("disposition", ["active", "inactive", "in_transit", "stored", "processed", "shipped"]);
export const relationshipTypeEnum = pgEnum("relationship_type", ["supplier", "customer", "processor", "transporter"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);
export const supplierTypeEnum = pgEnum("supplier_type", ["Estate", "Mill", "Bulking Station", "KCP", "Smallholder", "Other"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["Draft", "In Progress", "Submitted", "Under Review", "Complete"]);
export const tenureTypeEnum = pgEnum("tenure_type", ["HGU", "HGB", "State Forest Permit", "Customary Land", "Other"]);
export const permitTypeEnum = pgEnum("permit_type", ["AMDAL", "UKL-UPL", "SPPL", "None Required"]);
export const forestStatusEnum = pgEnum("forest_status", ["Ex-Forest Area", "Forest Area", "Non-Forest Area"]);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("compliance_officer"),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analysis Results table for storing GeoJSON analysis results
export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: text("plot_id").notNull(),
  country: text("country").notNull(),
  area: decimal("area", { precision: 12, scale: 2 }).notNull(),
  overallRisk: text("overall_risk").notNull(), // LOW, MEDIUM, HIGH
  complianceStatus: text("compliance_status").notNull(), // COMPLIANT, NON-COMPLIANT
  gfwLoss: text("gfw_loss").notNull(),
  jrcLoss: text("jrc_loss").notNull(), 
  sbtnLoss: text("sbtn_loss").notNull(),
  // Intersection area data for high-risk datasets
  gfwLossArea: decimal("gfw_loss_area", { precision: 12, scale: 4 }).default("0"),
  jrcLossArea: decimal("jrc_loss_area", { precision: 12, scale: 4 }).default("0"),
  sbtnLossArea: decimal("sbtn_loss_area", { precision: 12, scale: 4 }).default("0"),
  highRiskDatasets: jsonb("high_risk_datasets").$type<string[]>().default([]),
  geometry: jsonb("geometry"), // Store the original GeoJSON geometry
  uploadSession: text("upload_session"), // Track which upload session this belongs to
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Commodities table for product definitions
export const commodities = pgTable("commodities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  uomBase: text("uom_base").notNull(), // kg, tonnes, liters
  category: text("category"), // palm_oil, coconut, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Parties (companies/organizations) following EPCIS standards
export const parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: partyTypeEnum("type").notNull(),
  parentId: varchar("parent_id").references((): any => parties.id),
  gln: text("gln"), // Global Location Number for EPCIS
  address: text("address"),
  country: text("country"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  riskFlags: jsonb("risk_flags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facilities (physical locations) with PostGIS geometry
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyId: varchar("party_id").references(() => parties.id).notNull(),
  name: text("name").notNull(),
  type: facilityTypeEnum("type").notNull(),
  geometry: text("geometry"), // PostGIS geometry stored as text for compatibility
  address: text("address"),
  country: text("country"),
  province: text("province"),
  district: text("district"),
  village: text("village"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  riskFlags: jsonb("risk_flags").$type<string[]>().default([]),
  capacity: decimal("capacity", { precision: 12, scale: 3 }), // processing capacity
  capacityUom: text("capacity_uom"), // tonnes/day, kg/hour
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lots (batches/assets) with EPCIS compliance
export const lots = pgTable("lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: text("lot_id").notNull().unique(), // EPCIS identifier
  commodityId: varchar("commodity_id").references(() => commodities.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  uom: text("uom").notNull(), // unit of measure
  grade: text("grade"),
  ownerFacilityId: varchar("owner_facility_id").references(() => facilities.id).notNull(),
  producedAt: timestamp("produced_at").notNull(),
  expiryAt: timestamp("expiry_at"),
  ilmd: jsonb("ilmd"), // Instance/Lot Master Data - EPCIS standard
  attributes: jsonb("attributes"), // Additional product attributes
  parentLotIds: jsonb("parent_lot_ids").$type<string[]>().default([]), // For traceability
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// EPCIS Events for complete supply chain tracking
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull().unique(),
  type: eventTypeEnum("type").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  businessStep: businessStepEnum("business_step").notNull(),
  disposition: dispositionEnum("disposition").notNull(),
  readPointFacilityId: varchar("read_point_facility_id").references(() => facilities.id).notNull(),
  bizLocationFacilityId: varchar("biz_location_facility_id").references(() => facilities.id),
  ilmd: jsonb("ilmd"), // Instance/Lot Master Data
  eventMetadata: jsonb("event_metadata"), // Additional event data
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event inputs (what goes into an event)
export const eventInputs = pgTable("event_inputs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  lotId: varchar("lot_id").references(() => lots.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  uom: text("uom").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event outputs (what comes out of an event)
export const eventOutputs = pgTable("event_outputs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  newLotId: varchar("new_lot_id").references(() => lots.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  uom: text("uom").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipments for movement tracking
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: text("shipment_id").notNull().unique(),
  fromFacilityId: varchar("from_facility_id").references(() => facilities.id).notNull(),
  toFacilityId: varchar("to_facility_id").references(() => facilities.id).notNull(),
  departAt: timestamp("depart_at"),
  arriveAt: timestamp("arrive_at"),
  estimatedArriveAt: timestamp("estimated_arrive_at"),
  mode: text("mode"), // truck, ship, rail
  carrier: text("carrier"),
  vesselName: text("vessel_name"),
  docs: jsonb("docs").$type<string[]>().default([]), // document references
  status: text("status").default("pending"),
  totalWeight: decimal("total_weight", { precision: 12, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supplier relationships with tier tracking
export const supplierLinks = pgTable("supplier_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromPartyId: varchar("from_party_id").references(() => parties.id).notNull(),
  toPartyId: varchar("to_party_id").references(() => parties.id).notNull(),
  tier: integer("tier").notNull(), // 1 = direct, 2+ = indirect
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plots as separate entities (if different from facilities)
export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: text("plot_id").notNull().unique(),
  facilityId: varchar("facility_id").references(() => facilities.id), // reference to grower facility
  polygon: text("polygon"), // PostGIS POLYGON stored as text
  areaHa: decimal("area_ha", { precision: 10, scale: 4 }), // computed via PostGIS
  crop: text("crop"),
  plantingYear: integer("planting_year"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  riskFlags: jsonb("risk_flags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// External risk/certification layers
export const externalLayers = pgTable("external_layers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // WDPA, GFW, etc.
  layerType: text("layer_type").notNull(), // protected_areas, deforestation_alerts, etc.
  geometry: text("geometry"), // PostGIS geometry stored as text
  attributes: jsonb("attributes"), // layer-specific data
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custody chains for complete traceability
export const custodyChains = pgTable("custody_chains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: text("chain_id").notNull().unique(),
  rootLotId: varchar("root_lot_id").references(() => lots.id).notNull(),
  currentFacilityId: varchar("current_facility_id").references(() => facilities.id).notNull(),
  status: text("status").default("active"), // active, completed, archived
  totalQuantity: decimal("total_quantity", { precision: 12, scale: 3 }),
  remainingQuantity: decimal("remaining_quantity", { precision: 12, scale: 3 }),
  riskLevel: riskLevelEnum("risk_level").default("low"),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mass balance tracking for efficiency calculations
export const massBalanceRecords = pgTable("mass_balance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalInput: decimal("total_input", { precision: 12, scale: 3 }),
  totalOutput: decimal("total_output", { precision: 12, scale: 3 }),
  totalWaste: decimal("total_waste", { precision: 12, scale: 3 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // percentage
  isValid: boolean("is_valid").default(true),
  discrepancies: jsonb("discrepancies").$type<Array<{ type: string; amount: number; description: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced suppliers table for workflow management
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  registrationNumber: text("registration_number"),
  name: text("name").notNull(), // kept for backwards compatibility
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  businessType: text("business_type").notNull(),
  supplierType: text("supplier_type").notNull(), // kept for backwards compatibility
  tier: integer("tier").default(1), // 1, 2, 3, 4 for tier-based linkage
  legalityStatus: text("legality_status").default("pending"), // verified, pending, non-compliant
  legalityScore: integer("legality_score"), // 0-100
  certifications: jsonb("certifications").$type<string[]>().default([]),
  linkedSuppliers: jsonb("linked_suppliers").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New supplier workflow links table for tier-based relationships
export const supplierWorkflowLinks = pgTable("supplier_workflow_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentSupplierId: varchar("parent_supplier_id").references(() => suppliers.id).notNull(),
  childSupplierId: varchar("child_supplier_id").references(() => suppliers.id).notNull(),
  parentTier: integer("parent_tier").notNull(),
  childTier: integer("child_tier").notNull(),
  linkType: text("link_type").notNull(), // direct-supplier, indirect-supplier, service-provider
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Simplified shipments table for workflow tracking
export const workflowShipments = pgTable("workflow_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  productType: text("product_type").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  shipmentDate: timestamp("shipment_date").notNull(),
  destination: text("destination").notNull(),
  batchNumber: text("batch_number").notNull(),
  qualityGrade: text("quality_grade").notNull(),
  status: text("status").default("pending"), // pending, in-transit, delivered
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Legacy mills table for backwards compatibility  
export const mills = pgTable("mills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relationships
export const partiesRelations = relations(parties, ({ one, many }) => ({
  parent: one(parties, {
    fields: [parties.parentId],
    references: [parties.id],
  }),
  children: many(parties),
  facilities: many(facilities),
  supplierLinksFrom: many(supplierLinks, { relationName: "fromParty" }),
  supplierLinksTo: many(supplierLinks, { relationName: "toParty" }),
}));

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  party: one(parties, {
    fields: [facilities.partyId],
    references: [parties.id],
  }),
  lots: many(lots),
  events: many(events),
  plots: many(plots),
  shipmentsFrom: many(shipments, { relationName: "fromFacility" }),
  shipmentsTo: many(shipments, { relationName: "toFacility" }),
  custodyChains: many(custodyChains),
  massBalanceRecords: many(massBalanceRecords),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  commodity: one(commodities, {
    fields: [lots.commodityId],
    references: [commodities.id],
  }),
  ownerFacility: one(facilities, {
    fields: [lots.ownerFacilityId],
    references: [facilities.id],
  }),
  eventInputs: many(eventInputs),
  eventOutputs: many(eventOutputs),
  custodyChains: many(custodyChains),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  readPointFacility: one(facilities, {
    fields: [events.readPointFacilityId],
    references: [facilities.id],
  }),
  bizLocationFacility: one(facilities, {
    fields: [events.bizLocationFacilityId],
    references: [facilities.id],
  }),
  inputs: many(eventInputs),
  outputs: many(eventOutputs),
  massBalanceRecords: many(massBalanceRecords),
}));

export const eventInputsRelations = relations(eventInputs, ({ one }) => ({
  event: one(events, {
    fields: [eventInputs.eventId],
    references: [events.id],
  }),
  lot: one(lots, {
    fields: [eventInputs.lotId],
    references: [lots.id],
  }),
}));

export const eventOutputsRelations = relations(eventOutputs, ({ one }) => ({
  event: one(events, {
    fields: [eventOutputs.eventId],
    references: [events.id],
  }),
  newLot: one(lots, {
    fields: [eventOutputs.newLotId],
    references: [lots.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  fromFacility: one(facilities, {
    fields: [shipments.fromFacilityId],
    references: [facilities.id],
    relationName: "fromFacility",
  }),
  toFacility: one(facilities, {
    fields: [shipments.toFacilityId],
    references: [facilities.id],
    relationName: "toFacility",
  }),
}));

export const supplierLinksRelations = relations(supplierLinks, ({ one }) => ({
  fromParty: one(parties, {
    fields: [supplierLinks.fromPartyId],
    references: [parties.id],
    relationName: "fromParty",
  }),
  toParty: one(parties, {
    fields: [supplierLinks.toPartyId],
    references: [parties.id],
    relationName: "toParty",
  }),
}));

export const plotsRelations = relations(plots, ({ one }) => ({
  facility: one(facilities, {
    fields: [plots.facilityId],
    references: [facilities.id],
  }),
}));

export const custodyChainsRelations = relations(custodyChains, ({ one }) => ({
  rootLot: one(lots, {
    fields: [custodyChains.rootLotId],
    references: [lots.id],
  }),
  currentFacility: one(facilities, {
    fields: [custodyChains.currentFacilityId],
    references: [facilities.id],
  }),
}));

export const massBalanceRecordsRelations = relations(massBalanceRecords, ({ one }) => ({
  event: one(events, {
    fields: [massBalanceRecords.eventId],
    references: [events.id],
  }),
  facility: one(facilities, {
    fields: [massBalanceRecords.facilityId],
    references: [facilities.id],
  }),
}));

// DDS (Due Diligence Statement) Reports - Enhanced for PRD requirements
export const ddsReports = pgTable("dds_reports", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: text("shipment_id").references(() => shipments.id),
  
  // Company and Activity details
  companyInternalRef: text("company_internal_ref"),
  activity: text("activity"),
  
  // Operator/Trader details (PRD Section 1)
  operatorLegalName: text("operator_legal_name").notNull(),
  operatorAddress: text("operator_address").notNull(),
  placeOfActivity: text("place_of_activity"), // PRD: Place of activity (city/country where operations occur)
  operatorCountry: text("operator_country"),
  operatorIsoCode: text("operator_iso_code"),
  eoriNumber: text("eori_number"),
  
  // Product details (PRD Section 2)
  hsCode: text("hs_code").notNull(), // Harmonized System code from dropdown
  productDescription: text("product_description").notNull(),
  scientificName: text("scientific_name"), // From dropdown to avoid misspelling
  commonName: text("common_name"), // Common name of product
  producerName: text("producer_name"),
  netMassKg: decimal("net_mass_kg", { precision: 10, scale: 3 }).notNull(),
  volumeUnit: text("volume_unit"), // cubic meters, liters, etc.
  volumeQuantity: decimal("volume_quantity", { precision: 10, scale: 3 }),
  percentageEstimation: decimal("percentage_estimation", { precision: 5, scale: 2 }),
  supplementaryUnit: text("supplementary_unit"),
  supplementaryQuantity: decimal("supplementary_quantity", { precision: 10, scale: 3 }),
  
  // Production Plot Information (PRD Section 3)
  plotSelectionMethod: text("plot_selection_method"), // "existing_list" or "upload_geojson"
  selectedPlotId: text("selected_plot_id"), // Reference to pre-existing plot
  plotName: text("plot_name"), // Name/ID of the production plot
  totalProducers: integer("total_producers"),
  totalPlots: integer("total_plots"),
  totalProductionArea: decimal("total_production_area", { precision: 10, scale: 2 }),
  countryOfHarvest: text("country_of_harvest"),
  maxIntermediaries: integer("max_intermediaries"),
  traceabilityMethod: text("traceability_method"),
  expectedHarvestDate: date("expected_harvest_date"),
  productionDateRange: text("production_date_range"),
  
  // GeoJSON and geolocation (Enhanced for PRD requirements)
  countryOfProduction: text("country_of_production").notNull(),
  geolocationType: text("geolocation_type"), // "plot", "coordinates", "polygon"
  geolocationCoordinates: text("geolocation_coordinates"), // Stored GeoJSON polygon
  uploadedGeojson: jsonb("uploaded_geojson"), // Full GeoJSON object for processing
  geojsonValidated: boolean("geojson_validated").default(false),
  geojsonValidationErrors: text("geojson_validation_errors"),
  plotGeolocations: text("plot_geolocations").array(),
  establishmentGeolocations: text("establishment_geolocations").array(),
  kmlFileName: text("kml_file_name"),
  geojsonFilePaths: text("geojson_file_paths"),
  
  // Map preview and validation metadata
  plotBoundingBox: jsonb("plot_bounding_box"), // For map centering {north, south, east, west}
  plotCentroid: jsonb("plot_centroid"), // {lat, lng} for map preview
  plotArea: decimal("plot_area", { precision: 12, scale: 4 }), // Calculated area in hectares
  
  // Reference to prior DDS
  priorDdsReference: text("prior_dds_reference"),
  
  // Declaration and signature (PRD page 1 content)
  operatorDeclaration: text("operator_declaration").notNull(),
  signedBy: text("signed_by").notNull(),
  signedDate: timestamp("signed_date").notNull(),
  signatoryFunction: text("signatory_function").notNull(),
  digitalSignature: text("digital_signature"),
  signatureType: text("signature_type"), // "upload" or "canvas"
  signatureImagePath: text("signature_image_path"), // File path for uploaded signature images
  signatureData: text("signature_data"), // Base64 data for canvas signatures
  
  // Status and processing
  status: text("status").notNull().default("draft"), // draft, generated, downloaded, submitted
  submissionDate: timestamp("submission_date"),
  euTraceReference: text("eu_trace_reference"),
  pdfDocumentPath: text("pdf_document_path"),
  pdfFileName: text("pdf_file_name"), // Auto-generated filename
  
  // Session management for PRD dashboard
  sessionId: text("session_id"), // For session-based storage
  downloadCount: integer("download_count").default(0),
  lastDownloaded: timestamp("last_downloaded"),
  
  // Cross-module integration
  deforestationRiskLevel: text("deforestation_risk_level"),
  legalityStatus: text("legality_status"),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  traceability: jsonb("traceability"), // Supply chain linkage configuration
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Estate Data Collection Forms
export const estateDataCollection = pgTable("estate_data_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Bagian 1: Informasi Umum
  namaSupplier: text("nama_supplier").notNull(),
  namaGroupParentCompany: text("nama_group_parent_company"),
  aktaPendirianPerusahaan: text("akta_pendirian_perusahaan"),
  aktaPendirianDokumen: text("akta_pendirian_dokumen"), // document URL
  aktaPerubahan: text("akta_perubahan"),
  aktaPerubahanDokumen: text("akta_perubahan_dokumen"), // document URL
  izinBerusaha: text("izin_berusaha"),
  tipeSertifikat: text("tipe_sertifikat"),
  nomorSertifikat: text("nomor_sertifikat"),
  lembagaSertifikasi: text("lembaga_sertifikasi"),
  ruangLingkupSertifikasi: text("ruang_lingkup_sertifikasi"),
  masaBerlakuSertifikat: text("masa_berlaku_sertifikat"),
  linkDokumen: text("link_dokumen"),
  
  // Alamat & Koordinat
  alamatKantor: text("alamat_kantor"),
  alamatKebun: text("alamat_kebun"),
  koordinatKantor: text("koordinat_kantor"),
  koordinatKebun: text("koordinat_kebun"),
  
  // Jenis Supplier & Info Lainnya
  jenisSupplier: text("jenis_supplier"),
  totalProduksiTBS: text("total_produksi_tbs"),
  tanggalPengisianKuisioner: text("tanggal_pengisian_kuisioner"),
  
  // Penanggung Jawab
  namaPenanggungJawab: text("nama_penanggung_jawab"),
  jabatanPenanggungJawab: text("jabatan_penanggung_jawab"),
  emailPenanggungJawab: text("email_penanggung_jawab"),
  nomorTelefonPenanggungJawab: text("nomor_telepon_penanggung_jawab"),
  
  // Tim Internal
  namaTimInternal: text("nama_tim_internal"),
  jabatanTimInternal: text("jabatan_tim_internal"),
  emailTimInternal: text("email_tim_internal"),
  nomorTelefonTimInternal: text("nomor_telepon_tim_internal"),
  
  // Bagian 2: Sumber TBS (JSON array)
  sumberTBS: jsonb("sumber_tbs").$type<Array<{
    no: number;
    namaKebun: string;
    alamat: string;
    luasLahan: number;
    longitude: string;
    latitude: string;
    tahunTanam: string;
    jenisBibit: string;
    produksiTBS: number;
  }>>().default([]),
  
  // Bagian 3: Perlindungan Hutan dan Gambut
  memilikiKebijakanPerlindunganHutan: boolean("memiliki_kebijakan_perlindungan_hutan"),
  keteranganKebijakanHutan: text("keterangan_kebijakan_hutan"),
  dokumenKebijakanHutan: text("dokumen_kebijakan_hutan"), // document URL
  
  mengikutiWorkshopNDPE: boolean("mengikuti_workshop_ndpe"),
  keteranganWorkshopNDPE: text("keterangan_workshop_ndpe"),
  
  memilikiSOPKonservasi: boolean("memiliki_sop_konservasi"),
  memilikiSOPPembukaanLahan: boolean("memiliki_sop_pembukaan_lahan"),
  keteranganSOP: text("keterangan_sop"),
  
  melakukanPenilaianNKT: boolean("melakukan_penilaian_nkt"),
  menyampaikanLaporanNKT: boolean("menyampaikan_laporan_nkt"),
  melakukanPenilaianSKT: boolean("melakukan_penilaian_skt"),
  keteranganPenilaian: text("keterangan_penilaian"),
  
  penanamanDiAreaGambut: boolean("penanaman_di_area_gambut"),
  keteranganAreaGambut: text("keterangan_area_gambut"),
  luasAreaGambut: decimal("luas_area_gambut", { precision: 10, scale: 2 }),
  tahunPembukaanGambut: integer("tahun_pembukaan_gambut"),
  
  memilikiSKTitikPenaatan: boolean("memiliki_sk_titik_penaatan"),
  keteranganSKTitikPenaatan: text("keterangan_sk_titik_penaatan"),
  dokumenSKTitikPenaatan: text("dokumen_sk_titik_penaatan"), // document URL
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mill Data Collection Forms
export const millDataCollection = pgTable("mill_data_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Bagian 1: Informasi Umum
  umlId: text("uml_id"),
  namaPabrik: text("nama_pabrik").notNull(),
  namaGroupParentCompany: text("nama_group_parent_company"),
  aktaPendirianPerusahaan: text("akta_pendirian_perusahaan"),
  aktaPendirianDokumen: text("akta_pendirian_dokumen"), // document URL
  aktaPerubahan: text("akta_perubahan"),
  aktaPerubahanDokumen: text("akta_perubahan_dokumen"), // document URL
  izinBerusaha: text("izin_berusaha"),
  tipeSertifikat: text("tipe_sertifikat"),
  nomorSertifikat: text("nomor_sertifikat"),
  lembagaSertifikasi: text("lembaga_sertifikasi"),
  ruangLingkupSertifikasi: text("ruang_lingkup_sertifikasi"),
  masaBerlakuSertifikat: text("masa_berlaku_sertifikat"),
  
  // Alamat & Koordinat
  alamatKantor: text("alamat_kantor"),
  alamatPabrik: text("alamat_pabrik"),
  koordinatPabrik: text("koordinat_pabrik"),
  koordinatKantor: text("koordinat_kantor"),
  
  // Jenis Supplier & Info Lainnya
  jenisSupplier: text("jenis_supplier"),
  kuantitasCPOPK: text("kuantitas_cpo_pk"),
  tanggalPengisianKuisioner: text("tanggal_pengisian_kuisioner"),
  
  // Penanggung Jawab
  namaPenanggungJawab: text("nama_penanggung_jawab"),
  jabatanPenanggungJawab: text("jabatan_penanggung_jawab"),
  emailPenanggungJawab: text("email_penanggung_jawab"),
  nomorTelefonPenanggungJawab: text("nomor_telepon_penanggung_jawab"),
  
  // Tim Internal
  namaTimInternal: text("nama_tim_internal"),
  jabatanTimInternal: text("jabatan_tim_internal"),
  emailTimInternal: text("email_tim_internal"),
  nomorTelefonTimInternal: text("nomor_telepon_tim_internal"),
  
  // Bagian 2: Daftar Sumber TBS & Plot Produksi (JSON arrays for each category)
  kebunInti: jsonb("kebun_inti").$type<Array<{
    no: number;
    namaSupplier: string;
    alamat: string;
    luasPlotLahan: number;
    longitude: string;
    latitude: string;
    polygonKebun: string;
    persenPasokanKeMill: number;
    volumeTBSPasokan: number;
    dokumenLegalitasLahan: string; // document URL
    tahunTanam: string;
  }>>().default([]),
  
  kebunSepupu: jsonb("kebun_sepupu").$type<Array<{
    no: number;
    namaSupplier: string;
    alamat: string;
    luasPlotLahan: number;
    longitude: string;
    latitude: string;
    polygonKebun: string;
    persenPasokanKeMill: number;
    volumeTBSPasokan: number;
    dokumenLegalitasLahan: string; // document URL
    tahunTanam: string;
  }>>().default([]),
  
  thirdPartied: jsonb("third_partied").$type<Array<{
    no: number;
    namaSupplier: string;
    alamat: string;
    luasPlotLahan: number;
    longitude: string;
    latitude: string;
    polygonKebun: string;
    persenPasokanKeMill: number;
    volumeTBSPasokan: number;
    dokumenLegalitasLahan: string; // document URL
    tahunTanam: string;
  }>>().default([]),
  
  smallHolder: jsonb("small_holder").$type<Array<{
    no: number;
    namaSupplier: string;
    alamat: string;
    luasPlotLahan: number;
    longitude: string;
    latitude: string;
    polygonKebun: string;
    persenPasokanKeMill: number;
    volumeTBSPasokan: number;
    dokumenLegalitasLahan: string; // document URL
    tahunTanam: string;
  }>>().default([]),
  
  // Bagian 3: Perlindungan Hutan dan Gambut
  memilikiKebijakanPerlindunganHutan: boolean("memiliki_kebijakan_perlindungan_hutan"),
  memilikiKebijakanPerlindunganGambut: boolean("memiliki_kebijakan_perlindungan_gambut"),
  keteranganKebijakanHutan: text("keterangan_kebijakan_hutan"),
  dokumenKebijakanHutan: text("dokumen_kebijakan_hutan"), // document URL
  
  mengikutiWorkshopNDPE: boolean("mengikuti_workshop_ndpe"),
  keteranganWorkshopNDPE: text("keterangan_workshop_ndpe"),
  
  memilikiSOPKonservasi: boolean("memiliki_sop_konservasi"),
  memilikiSOPPembukaanLahan: boolean("memiliki_sop_pembukaan_lahan"),
  keteranganSOP: text("keterangan_sop"),
  
  melakukanPenilaianNKT: boolean("melakukan_penilaian_nkt"),
  menyampaikanLaporanNKT: boolean("menyampaikan_laporan_nkt"),
  melakukanPenilaianSKT: boolean("melakukan_penilaian_skt"),
  keteranganPenilaian: text("keterangan_penilaian"),
  
  penanamanDiAreaGambut: boolean("penanaman_di_area_gambut"),
  keteranganAreaGambut: text("keterangan_area_gambut"),
  luasAreaGambut: decimal("luas_area_gambut", { precision: 10, scale: 2 }),
  tahunPembukaanGambut: integer("tahun_pembukaan_gambut"),
  
  memilikiSKTitikPenaatan: boolean("memiliki_sk_titik_penaatan"),
  keteranganSKTitikPenaatan: text("keterangan_sk_titik_penaatan"),
  dokumenSKTitikPenaatan: text("dokumen_sk_titik_penaatan"), // document URL
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ddsReportsRelations = relations(ddsReports, ({ one }) => ({
  shipment: one(shipments, {
    fields: [ddsReports.shipmentId],
    references: [shipments.id],
  }),
}));

// Legacy Estate Data Collection for EUDR compliance (renamed to avoid conflicts)
export const legacyEstateDataCollection = pgTable("legacy_estate_data_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Section 1: General Information
  supplierName: text("supplier_name").notNull(),
  groupParentCompanyName: text("group_parent_company_name"),
  establishmentAct: text("establishment_act"),
  amendmentAct: text("amendment_act"),
  businessLicense: text("business_license"),
  certificationType: text("certification_type"), // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
  certificateNumber: text("certificate_number"),
  certificationBody: text("certification_body"),
  certificationScope: text("certification_scope"),
  certificateValidity: date("certificate_validity"),
  documentLink: text("document_link"),
  
  // Addresses
  officeAddress: text("office_address"),
  estateAddress: text("estate_address"),
  
  // Coordinates
  estateCoordinates: text("estate_coordinates"),
  officeCoordinates: text("office_coordinates"),
  
  // Supplier type (enum-like)
  supplierType: text("supplier_type"), // KKPA, sister company, third party
  totalAnnualProduction: decimal("total_annual_production", { precision: 12, scale: 3 }),
  formFillingDate: date("form_filling_date"),
  
  // Responsible person
  responsiblePersonName: text("responsible_person_name"),
  responsiblePersonPosition: text("responsible_person_position"),
  responsiblePersonEmail: text("responsible_person_email"),
  responsiblePersonPhone: text("responsible_person_phone"),
  
  // Internal sustainability team
  internalTeamName: text("internal_team_name"),
  internalTeamPosition: text("internal_team_position"),
  internalTeamEmail: text("internal_team_email"),
  internalTeamPhone: text("internal_team_phone"),
  
  // Section 2: FFB Sources (stored as JSONB array)
  ffbSources: jsonb("ffb_sources").$type<Array<{
    no: number;
    estateName: string;
    address: string;
    landArea: number; // in hectares
    longitude: string;
    latitude: string;
    plantingYear: string;
    seedType: string;
    annualProduction: number; // in tons
  }>>().default([]),
  
  // Section 3: Forest and Peat Protection
  hasForestPeatPolicy: boolean("has_forest_peat_policy"),
  forestPeatPolicyNotes: text("forest_peat_policy_notes"),
  forestPeatDocumentLink: text("forest_peat_document_link"),
  
  attendedNdpeWorkshop: boolean("attended_ndpe_workshop"),
  ndpeWorkshopNotes: text("ndpe_workshop_notes"),
  
  hasForestProtectionProcedure: boolean("has_forest_protection_procedure"),
  hasConservationAreaSop: boolean("has_conservation_area_sop"),
  hasLandOpeningSop: boolean("has_land_opening_sop"),
  forestProtectionNotes: text("forest_protection_notes"),
  
  conductedHcvAssessment: boolean("conducted_hcv_assessment"),
  submittedHcvReport: boolean("submitted_hcv_report"),
  conductedHcsAssessment: boolean("conducted_hcs_assessment"),
  hcsAssessmentNotes: text("hcs_assessment_notes"),
  
  plantingOnPeatland: boolean("planting_on_peatland"),
  peatlandArea: decimal("peatland_area", { precision: 8, scale: 2 }),
  peatlandOpeningYear: integer("peatland_opening_year"),
  peatlandNotes: text("peatland_notes"),
  
  hasHydrologicalRestorationPermit: boolean("has_hydrological_restoration_permit"),
  hydrologicalPermitNotes: text("hydrological_permit_notes"),
  hydrologicalDocumentLink: text("hydrological_document_link"),
  
  // Status and metadata
  status: text("status").default("draft"), // draft, submitted, reviewed, approved
  completionPercentage: integer("completion_percentage").default(0),
  reviewComments: text("review_comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Traceability (TBS Luar) Data Collection Schema
export const traceabilityDataCollection = pgTable("traceability_data_collection", {
  id: serial("id").primaryKey(),
  
  // Basic DO Information
  nomorDO: text("nomor_do").notNull(),
  pemegangDO: text("pemegang_do").notNull(),
  alamatPemegangDO: text("alamat_pemegang_do"),
  lokasiUsaha: text("lokasi_usaha"),
  
  // Legalitas Pemegang DO
  aktaPendirianUsaha: text("akta_pendirian_usaha"), // document URL
  nib: text("nib"),
  npwp: text("npwp"),
  ktp: text("ktp"), // document URL
  
  // Pemasok TBS Array - structured as JSON for dynamic farmer entries
  pemasokTBS: jsonb("pemasok_tbs").$type<Array<{
    no: number;
    namaPetani: string;
    alamatTempaTinggal: string;
    lokasiKebun: string;
    luasHa: number;
    legalitasLahan: string; // document URL
    tahunTanam: string;
    stdb: string; // document URL
    sppl: string; // document URL
    nomorObjekPajakPBB: string;
    longitude: string;
    latitude: string;
  }>>().default([]),
  
  // Status and metadata
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// KCP Data Collection Schema
export const kcpDataCollection = pgTable("kcp_data_collection", {
  id: serial("id").primaryKey(),
  
  // Bagian 1 - Informasi Umum
  ublFacilityId: text("ubl_facility_id"),
  namaKCP: text("nama_kcp").notNull(),
  namaGroup: text("nama_group"),
  izinBerusaha: text("izin_berusaha"),
  tipeSertifikat: text("tipe_sertifikat"),
  nomorSertifikat: text("nomor_sertifikat"),
  lembagaSertifikasi: text("lembaga_sertifikasi"),
  ruangLingkupSertifikasi: text("ruang_lingkup_sertifikasi"),
  masaBerlakuSertifikat: text("masa_berlaku_sertifikat"),
  
  // Alamat
  alamatKantor: text("alamat_kantor"),
  alamatKCP: text("alamat_kcp"),
  koordinatKantor: text("koordinat_kantor"),
  koordinatKCP: text("koordinat_kcp"),
  
  // Operational Info
  modelChainOfCustody: text("model_chain_of_custody"),
  kapasitasOlahMTHari: decimal("kapasitas_olah_mt_hari", { precision: 10, scale: 2 }),
  sistemPencatatan: text("sistem_pencatatan"), // LIFO/FIFO/Weighted
  tanggalPengisianKuisioner: date("tanggal_pengisian_kuisioner"),
  
  // Penanggung Jawab
  namaPenanggungJawab: text("nama_penanggung_jawab"),
  jabatanPenanggungJawab: text("jabatan_penanggung_jawab"),
  emailPenanggungJawab: text("email_penanggung_jawab"),
  nomorTelefonPenanggungJawab: text("nomor_telepon_penanggung_jawab"),
  
  // Tim Internal
  namaTimInternal: text("nama_tim_internal"),
  jabatanTimInternal: text("jabatan_tim_internal"),
  emailTimInternal: text("email_tim_internal"),
  nomorTelefonTimInternal: text("nomor_telepon_tim_internal"),
  
  // Bagian 2 - Daftar Tangki/Silo Array
  daftarTangkiSilo: jsonb("daftar_tangki_silo").$type<Array<{
    idTangkiSilo: string;
    kategori: string; // Raw Kernel/CPKO/PKC
    produk: string;
    alamat: string;
    longitude: string;
    latitude: string;
    kapasitas: number;
    tanggalCleaningTerakhir: string;
  }>>().default([]),
  
  // Bagian 3 - Sumber Produk Array
  sumberProduk: jsonb("sumber_produk").$type<Array<{
    millId: string;
    namaPKS: string;
    alamat: string;
    longitude: string;
    latitude: string;
    produk: string;
    volume: number;
    sertifikasi: string; // ISPO/RSPO/ISCC
  }>>().default([]),
  
  // Status and metadata
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bulking Data Collection Schema
export const bulkingDataCollection = pgTable("bulking_data_collection", {
  id: serial("id").primaryKey(),
  
  // Bagian 1 - Informasi Umum
  ublFacilityId: text("ubl_facility_id"),
  namaFasilitasBulking: text("nama_fasilitas_bulking").notNull(),
  namaGroup: text("nama_group"),
  izinBerusaha: text("izin_berusaha"),
  tipeSertifikat: text("tipe_sertifikat"),
  nomorSertifikat: text("nomor_sertifikat"),
  lembagaSertifikasi: text("lembaga_sertifikasi"),
  ruangLingkupSertifikasi: text("ruang_lingkup_sertifikasi"),
  masaBerlakuSertifikat: text("masa_berlaku_sertifikat"),
  
  // Alamat
  alamatKantor: text("alamat_kantor"),
  alamatBulking: text("alamat_bulking"),
  
  // Operational Info
  modelChainOfCustody: text("model_chain_of_custody"),
  kapasitasTotal: decimal("kapasitas_total", { precision: 10, scale: 2 }),
  sistemPencatatan: text("sistem_pencatatan"), // LIFO/FIFO
  tanggalPengisianKuisioner: date("tanggal_pengisian_kuisioner"),
  
  // Penanggung Jawab
  namaPenanggungJawab: text("nama_penanggung_jawab"),
  jabatanPenanggungJawab: text("jabatan_penanggung_jawab"),
  emailPenanggungJawab: text("email_penanggung_jawab"),
  nomorTelefonPenanggungJawab: text("nomor_telepon_penanggung_jawab"),
  
  // Tim Internal
  namaTimInternal: text("nama_tim_internal"),
  jabatanTimInternal: text("jabatan_tim_internal"),
  emailTimInternal: text("email_tim_internal"),
  nomorTeleponTimInternal: text("nomor_telepon_tim_internal"),
  
  // Bagian 2 - Daftar Tangki Array
  daftarTangki: jsonb("daftar_tangki").$type<Array<{
    tankId: string;
    produk: string;
    kapasitas: number;
    alamat: string;
    longitude: string;
    latitude: string;
    dedicatedShared: string; // Dedicated/Shared
    tanggalCleaningTerakhir: string;
  }>>().default([]),
  
  // Bagian 3 - Sumber Produk Array
  sumberProduk: jsonb("sumber_produk").$type<Array<{
    millId: string;
    namaPKS: string;
    alamat: string;
    longitude: string;
    latitude: string;
    produk: string;
    volume: number;
    sertifikasi: string; // ISPO/RSPO/ISCC
  }>>().default([]),
  
  // Status and metadata
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Commodity = typeof commodities.$inferSelect;
export type InsertCommodity = typeof commodities.$inferInsert;
export type Party = typeof parties.$inferSelect;
export type InsertParty = typeof parties.$inferInsert;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;
export type Lot = typeof lots.$inferSelect;
export type InsertLot = typeof lots.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type EventInput = typeof eventInputs.$inferSelect;
export type InsertEventInput = typeof eventInputs.$inferInsert;
export type EventOutput = typeof eventOutputs.$inferSelect;
export type InsertEventOutput = typeof eventOutputs.$inferInsert;
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;
export type SupplierLink = typeof supplierLinks.$inferSelect;
export type InsertSupplierLink = typeof supplierLinks.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;
export type Plot = typeof plots.$inferSelect;
export type InsertPlot = typeof plots.$inferInsert;
export type ExternalLayer = typeof externalLayers.$inferSelect;
export type InsertExternalLayer = typeof externalLayers.$inferInsert;
export type CustodyChain = typeof custodyChains.$inferSelect;
export type InsertCustodyChain = typeof custodyChains.$inferInsert;
export type MassBalanceRecord = typeof massBalanceRecords.$inferSelect;
export type InsertMassBalanceRecord = typeof massBalanceRecords.$inferInsert;
export type Mill = typeof mills.$inferSelect;
export type InsertMill = typeof mills.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertCommoditySchema = createInsertSchema(commodities);
export const insertPartySchema = createInsertSchema(parties);
export const insertFacilitySchema = createInsertSchema(facilities);
export const insertLotSchema = createInsertSchema(lots);
export const insertEventSchema = createInsertSchema(events);
export const insertEventInputSchema = createInsertSchema(eventInputs);
export const insertEventOutputSchema = createInsertSchema(eventOutputs);
export const insertShipmentSchema = createInsertSchema(shipments);
export const insertSupplierLinkSchema = createInsertSchema(supplierLinks);
export const insertPlotSchema = createInsertSchema(plots);
export const insertExternalLayerSchema = createInsertSchema(externalLayers);
export const insertCustodyChainSchema = createInsertSchema(custodyChains);
export const insertMassBalanceRecordSchema = createInsertSchema(massBalanceRecords);
export const insertSupplierSchema = createInsertSchema(suppliers);
export const insertSupplierWorkflowLinkSchema = createInsertSchema(supplierWorkflowLinks);
export const insertWorkflowShipmentSchema = createInsertSchema(workflowShipments);
export const insertMillSchema = createInsertSchema(mills);
export const insertAnalysisResultSchema = createInsertSchema(analysisResults);
export const insertDdsReportSchema = createInsertSchema(ddsReports);
export const insertEstateDataCollectionSchema = createInsertSchema(estateDataCollection);
export const insertMillDataCollectionSchema = createInsertSchema(millDataCollection);
export const insertTraceabilityDataCollectionSchema = createInsertSchema(traceabilityDataCollection);
export const insertKcpDataCollectionSchema = createInsertSchema(kcpDataCollection);
export const insertBulkingDataCollectionSchema = createInsertSchema(bulkingDataCollection);

// Export types for workflow entities (supplement to existing Supplier types)
export type SupplierWorkflowLink = typeof supplierWorkflowLinks.$inferSelect;
export type InsertSupplierWorkflowLink = z.infer<typeof insertSupplierWorkflowLinkSchema>;
export type WorkflowShipment = typeof workflowShipments.$inferSelect;
export type InsertWorkflowShipment = z.infer<typeof insertWorkflowShipmentSchema>;
export type DdsReport = typeof ddsReports.$inferSelect;
export type InsertDdsReport = z.infer<typeof insertDdsReportSchema>;
export type EstateDataCollection = typeof estateDataCollection.$inferSelect;
export type InsertEstateDataCollection = typeof estateDataCollection.$inferInsert;
export type MillDataCollection = typeof millDataCollection.$inferSelect;
export type InsertMillDataCollection = typeof millDataCollection.$inferInsert;
export type TraceabilityDataCollection = typeof traceabilityDataCollection.$inferSelect;
export type InsertTraceabilityDataCollection = typeof traceabilityDataCollection.$inferInsert;
export type KcpDataCollection = typeof kcpDataCollection.$inferSelect;
export type InsertKcpDataCollection = typeof kcpDataCollection.$inferInsert;
export type BulkingDataCollection = typeof bulkingDataCollection.$inferSelect;
export type InsertBulkingDataCollection = typeof bulkingDataCollection.$inferInsert;

// Digital Signature Types
export interface SignatureData {
  type: "upload" | "canvas";
  data?: string; // Base64 data for canvas signatures or uploaded images
  imagePath?: string; // File path for uploaded images  
  fileName?: string; // Original filename for uploads
  timestamp: string;
}

// EUDR Legality Assessment Schema - Comprehensive 8-indicator compliance audit
export const eudrAssessments = pgTable("eudr_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Supplier/Business Details
  supplierType: supplierTypeEnum("supplier_type").notNull(),
  supplierName: text("supplier_name").notNull(),
  supplierID: text("supplier_id").notNull(),
  location: text("location").notNull(),
  ownership: text("ownership"),
  
  // Contact Details
  contactName: text("contact_name"),
  contactPosition: text("contact_position"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  
  // Assessment metadata
  status: assessmentStatusEnum("status").default("Draft"),
  assignedAuditor: text("assigned_auditor"),
  
  // 1. Land Tenure
  landTitleNumber: text("land_title_number"),
  titleIssuanceDate: date("title_issuance_date"),
  tenureType: tenureTypeEnum("tenure_type").notNull(),
  landArea: decimal("land_area", { precision: 10, scale: 2 }).notNull(), // hectares
  gpsCoordinates: text("gps_coordinates"),
  plotMapReference: text("plot_map_reference"),
  landTenureDocuments: jsonb("land_tenure_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 2. Environmental Laws
  permitType: permitTypeEnum("permit_type").notNull(),
  permitNumber: text("permit_number"),
  issuanceYear: integer("issuance_year"),
  environmentalStatus: text("environmental_status").notNull(), // AMDAL/UKL-UPL/SPPL
  monitoringReportDetails: text("monitoring_report_details"),
  environmentalDocuments: jsonb("environmental_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 3. Forest-Related Regulations
  forestLicenseNumber: text("forest_license_number"),
  forestStatus: forestStatusEnum("forest_status").notNull(),
  impactAssessmentID: text("impact_assessment_id"),
  protectedAreaStatus: boolean("protected_area_status").default(false),
  forestDocuments: jsonb("forest_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 4. Third-Party Rights (including FPIC)
  fpicStatus: boolean("fpic_status").default(false),
  fpicDate: date("fpic_date"),
  communalRights: boolean("communal_rights").default(false),
  landConflict: boolean("land_conflict").default(false),
  conflictDescription: text("conflict_description"),
  communityPermits: integer("community_permits").default(0),
  thirdPartyDocuments: jsonb("third_party_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 5. Labour
  employeeCount: integer("employee_count").default(0),
  permanentEmployees: integer("permanent_employees").default(0),
  contractualEmployees: integer("contractual_employees").default(0),
  hasWorkerContracts: boolean("has_worker_contracts").default(false),
  bpjsKetenagakerjaanNumber: text("bpjs_ketenagakerjaan_number"),
  bpjsKesehatanNumber: text("bpjs_kesehatan_number"),
  lastK3AuditDate: date("last_k3_audit_date"),
  labourDocuments: jsonb("labour_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 6. Human Rights
  policyAdherence: boolean("policy_adherence").default(false),
  grievanceRecords: boolean("grievance_records").default(false),
  grievanceDescription: text("grievance_description"),
  certification: text("certification"),
  humanRightsViolations: boolean("human_rights_violations").default(false),
  humanRightsDocuments: jsonb("human_rights_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 7. Tax/Anti-Corruption
  npwpNumber: text("npwp_number"), // 15 digits
  lastTaxReturnYear: integer("last_tax_return_year"),
  pbbPaymentProof: boolean("pbb_payment_proof").default(false),
  antiBriberyPolicy: boolean("anti_bribery_policy").default(false),
  codeOfEthics: boolean("code_of_ethics").default(false),
  whistleblowerMechanism: boolean("whistleblower_mechanism").default(false),
  taxAntiCorruptionDocuments: jsonb("tax_anti_corruption_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // 8. Other National Laws
  tradeLicenses: jsonb("trade_licenses").$type<string[]>().default([]),
  corporateRegistration: text("corporate_registration"),
  customsRegistration: text("customs_registration"),
  dinasAgricultureRegistry: text("dinas_agriculture_registry"),
  businessLicense: text("business_license"),
  otherLawsDocuments: jsonb("other_laws_documents").$type<Array<{
    id: string;
    name: string;
    size: number;
    uploadDate: string;
    description?: string;
    url: string;
  }>>().default([]),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier Assessment Progress Tracking - tracks completion status across the 3-step workflow
export const supplierAssessmentProgress = pgTable("supplier_assessment_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierName: text("supplier_name").notNull(), // Primary identifier for supplier across modules
  supplierType: text("supplier_type").notNull(), // "Estate", "Mill", "Bulking Station", etc.
  
  // Data Collection Step (Step 1) - based on existing data collection forms
  dataCollectionCompleted: boolean("data_collection_completed").default(false),
  dataCollectionCompletedAt: timestamp("data_collection_completed_at"),
  dataCollectionId: varchar("data_collection_id"), // References the specific data collection record
  
  // Legality Compliance Step (Step 2) - based on existing supplier compliance system
  legalityComplianceCompleted: boolean("legality_compliance_completed").default(false),
  legalityComplianceCompletedAt: timestamp("legality_compliance_completed_at"),
  legalityComplianceId: varchar("legality_compliance_id"), // References supplier compliance record
  
  // Risk Assessment Step (Step 3) - new module to be implemented
  riskAssessmentCompleted: boolean("risk_assessment_completed").default(false),
  riskAssessmentCompletedAt: timestamp("risk_assessment_completed_at"),
  riskAssessmentId: varchar("risk_assessment_id"), // Will reference future risk assessment record
  
  // Overall workflow status
  currentStep: integer("current_step").default(1), // 1=Data Collection, 2=Legality Compliance, 3=Risk Assessment
  workflowCompleted: boolean("workflow_completed").default(false),
  workflowCompletedAt: timestamp("workflow_completed_at"),
  
  // Additional metadata
  lastUpdatedBy: varchar("last_updated_by"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export EUDR Assessment types
export type EudrAssessment = typeof eudrAssessments.$inferSelect;
export type InsertEudrAssessment = typeof eudrAssessments.$inferInsert;
export const insertEudrAssessmentSchema = createInsertSchema(eudrAssessments);

// Risk Assessment system based on KPNPLT-SST-XXXX.06.1 methodology
export const riskCategoryEnum = pgEnum("risk_category", ["spatial", "non_spatial"]);
export const riskItemTypeEnum = pgEnum("risk_item_type", ["deforestasi", "legalitas_lahan", "kawasan_gambut", "indigenous_people", "sertifikasi", "dokumentasi_legal"]);
export const riskParameterLevelEnum = pgEnum("risk_parameter_level", ["tinggi", "sedang", "rendah"]); // High, Medium, Low
export const mitigationStatusEnum = pgEnum("mitigation_status", ["pending", "in_progress", "completed", "not_applicable"]);

// Comprehensive Risk Assessment table based on Excel methodology
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Reference to supplier/party being assessed
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierName: text("supplier_name").notNull(),
  assessorId: varchar("assessor_id").references(() => users.id),
  assessorName: text("assessor_name"),
  
  // Assessment metadata
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  assessmentPeriod: text("assessment_period"), // e.g., "2024-Q1"
  status: assessmentStatusEnum("status").default("Draft").notNull(),
  
  // Overall scoring and classification based on Excel methodology
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }), // 0-100
  riskClassification: riskLevelEnum("risk_classification"), // low, medium, high based on score thresholds
  
  // Spatial Risk Analysis Section (Section I from Excel)
  spatialRiskScore: decimal("spatial_risk_score", { precision: 5, scale: 2 }),
  spatialRiskLevel: riskLevelEnum("spatial_risk_level"),
  
  // Non-Spatial Risk Analysis Section 
  nonSpatialRiskScore: decimal("non_spatial_risk_score", { precision: 5, scale: 2 }),
  nonSpatialRiskLevel: riskLevelEnum("non_spatial_risk_level"),
  
  // Individual risk item scores (JSON structure for flexibility)
  riskItemScores: jsonb("risk_item_scores").$type<{
    deforestasi: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
    legalitas_lahan: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
    kawasan_gambut: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
    indigenous_people: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
    sertifikasi?: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
    dokumentasi_legal?: { score: number; level: string; parameter: string; weight: number; mitigasi: string; };
  }>(),
  
  // Mitigation actions and status tracking
  mitigationActions: jsonb("mitigation_actions").$type<{
    riskItem: string;
    action: string;
    status: string;
    targetDate: string;
    assignedTo: string;
    progress: number;
  }[]>().default([]),
  
  // Assessment evidence and supporting documents
  evidenceDocuments: jsonb("evidence_documents").$type<string[]>().default([]),
  supportingData: jsonb("supporting_data"), // Store references to analysis results, maps, etc.
  
  // Assessment review and approval workflow
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Recommendations and next steps
  recommendations: text("recommendations"),
  nextReviewDate: timestamp("next_review_date"),
  
  // Metadata
  notes: text("notes"),
  version: integer("version").default(1), // For versioning assessments
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Risk Assessment Items - detailed breakdown of each risk factor
export const riskAssessmentItems = pgTable("risk_assessment_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  riskAssessmentId: varchar("risk_assessment_id").references(() => riskAssessments.id).notNull(),
  category: riskCategoryEnum("category").notNull(), // spatial or non_spatial
  itemType: riskItemTypeEnum("item_type").notNull(),
  itemName: text("item_name").notNull(), // e.g., "Deforestasi", "Legalitas Lahan"
  
  // Risk parameter details from Excel structure
  riskLevel: riskParameterLevelEnum("risk_level").notNull(), // tinggi, sedang, rendah
  parameter: text("parameter").notNull(), // Descriptive parameter from Excel
  riskValue: integer("risk_value").notNull(), // 1, 2, or 3 based on Excel methodology
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // Bobot (A) from Excel
  calculatedRisk: decimal("calculated_risk", { precision: 5, scale: 2 }).notNull(), // Risk (B) = weight * riskValue
  normalizedScore: decimal("normalized_score", { precision: 5, scale: 4 }).notNull(), // Ni from Excel
  finalScore: decimal("final_score", { precision: 5, scale: 4 }).notNull(), // Final calculated score
  
  // Mitigation information
  mitigationRequired: boolean("mitigation_required").default(false),
  mitigationDescription: text("mitigation_description"), // From Excel "Mitigasi" column
  mitigationStatus: mitigationStatusEnum("mitigation_status").default("pending"),
  
  // Evidence and data sources
  dataSources: jsonb("data_sources").$type<string[]>().default([]), // e.g., "Hansen Alert", "WDPA"
  sourceLinks: jsonb("source_links").$type<string[]>().default([]), // URLs to data sources
  evidenceFiles: jsonb("evidence_files").$type<string[]>().default([]),
  
  // Assessment details
  assessedBy: varchar("assessed_by").references(() => users.id),
  assessedAt: timestamp("assessed_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export Risk Assessment types
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RiskAssessmentItem = typeof riskAssessmentItems.$inferSelect;
export type InsertRiskAssessmentItem = typeof riskAssessmentItems.$inferInsert;
export const insertRiskAssessmentItemSchema = createInsertSchema(riskAssessmentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export Supplier Assessment Progress types
export type SupplierAssessmentProgress = typeof supplierAssessmentProgress.$inferSelect;
export type InsertSupplierAssessmentProgress = typeof supplierAssessmentProgress.$inferInsert;
export const insertSupplierAssessmentProgressSchema = createInsertSchema(supplierAssessmentProgress);

// ========================================
// DASHBOARD COMPLIANCE PRD - PHASE 0: DATA MODEL
// ========================================

// Dashboard-specific enums for compliance tracking
export const riskStatusEnum = pgEnum("risk_status", ["low", "medium", "high"]);
export const legalityStatusEnum = pgEnum("legality_status", ["compliant", "under_review", "non_compliant"]);

// Dashboard data model types for aggregated metrics and analytics
export type DashboardMetrics = {
  totalPlots: number;
  compliantPlots: number;
  highRiskPlots: number;
  mediumRiskPlots: number;
  deforestedPlots: number;
  totalAreaHa: number;
  complianceRate: number;
};

export type RiskSplit = {
  low: number;
  medium: number; 
  high: number;
};

export type LegalitySplit = {
  compliant: number;
  underReview: number;
  nonCompliant: number;
};

export type PlotSummary = {
  plotId: string;
  supplierName: string;
  region?: string;
  businessUnit?: string;
  area: number;
  riskStatus: "low" | "medium" | "high";
  legalityStatus: "compliant" | "under_review" | "non_compliant";
  lastUpdated: Date;
};

export type SupplierSummary = {
  supplierId: string;
  supplierName: string;
  totalPlots: number;
  compliantPlots: number;
  totalArea: number;
  complianceRate: number;
  riskStatus: "low" | "medium" | "high";
  legalityStatus: "compliant" | "under_review" | "non_compliant";
  region?: string;
  businessUnit?: string;
  lastUpdated: Date;
};

export type Alert = {
  id: string;
  type: "deforestation" | "compliance" | "risk";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  plotId?: string;
  supplierId?: string;
  region?: string;
  coordinates?: { lat: number; lng: number };
  detectedAt: Date;
  status: "new" | "acknowledged" | "resolved";
};

export type ComplianceTrendPoint = {
  period: string; // YYYY-MM format
  complianceRate: number;
  totalPlots: number;
  compliantPlots: number;
  date: Date;
};

export type DashboardFilters = {
  businessUnit?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type ExportData = {
  plotSummaries: PlotSummary[];
  supplierSummaries: SupplierSummary[];
  metrics: DashboardMetrics;
  generatedAt: Date;
};

// Zod schemas for dashboard API validation
export const dashboardFiltersSchema = z.object({
  businessUnit: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
}).optional();

export const dashboardMetricsSchema = z.object({
  totalPlots: z.number(),
  compliantPlots: z.number(),
  highRiskPlots: z.number(),
  mediumRiskPlots: z.number(),
  deforestedPlots: z.number(),
  totalAreaHa: z.number(),
  complianceRate: z.number(),
});

export const riskSplitSchema = z.object({
  low: z.number(),
  medium: z.number(),
  high: z.number(),
});

export const legalitySplitSchema = z.object({
  compliant: z.number(),
  underReview: z.number(),
  nonCompliant: z.number(),
});

export const plotSummarySchema = z.object({
  plotId: z.string(),
  supplierName: z.string(),
  region: z.string().optional(),
  businessUnit: z.string().optional(),
  area: z.number(),
  riskStatus: z.enum(["low", "medium", "high"]),
  legalityStatus: z.enum(["compliant", "under_review", "non_compliant"]),
  lastUpdated: z.date(),
});

export const supplierSummarySchema = z.object({
  supplierId: z.string(),
  supplierName: z.string(),
  totalPlots: z.number(),
  compliantPlots: z.number(),
  totalArea: z.number(),
  complianceRate: z.number(),
  riskStatus: z.enum(["low", "medium", "high"]),
  legalityStatus: z.enum(["compliant", "under_review", "non_compliant"]),
  region: z.string().optional(),
  businessUnit: z.string().optional(),
  lastUpdated: z.date(),
});

export const alertSchema = z.object({
  id: z.string(),
  type: z.enum(["deforestation", "compliance", "risk"]),
  severity: z.enum(["low", "medium", "high"]),
  title: z.string(),
  description: z.string(),
  plotId: z.string().optional(),
  supplierId: z.string().optional(),
  region: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  detectedAt: z.date(),
  status: z.enum(["new", "acknowledged", "resolved"]),
});

export const complianceTrendPointSchema = z.object({
  period: z.string(),
  complianceRate: z.number(),
  totalPlots: z.number(),
  compliantPlots: z.number(),
  date: z.date(),
});

export const exportDataSchema = z.object({
  plotSummaries: z.array(plotSummarySchema),
  supplierSummaries: z.array(supplierSummarySchema),
  metrics: dashboardMetricsSchema,
  generatedAt: z.date(),
});

