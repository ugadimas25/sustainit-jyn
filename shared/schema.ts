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
  parentId: varchar("parent_id").references(() => parties.id),
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

// DDS (Due Diligence Statement) Reports
export const ddsReports = pgTable("dds_reports", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: text("shipment_id").references(() => shipments.id),
  
  // Operator details
  operatorLegalName: text("operator_legal_name").notNull(),
  operatorAddress: text("operator_address").notNull(),
  eoriNumber: text("eori_number"),
  
  // Product details
  hsCode: text("hs_code").notNull(),
  productDescription: text("product_description").notNull(),
  scientificName: text("scientific_name"),
  netMassKg: decimal("net_mass_kg", { precision: 10, scale: 3 }).notNull(),
  supplementaryUnit: text("supplementary_unit"),
  supplementaryQuantity: decimal("supplementary_quantity", { precision: 10, scale: 3 }),
  
  // Origin & geolocation
  countryOfProduction: text("country_of_production").notNull(),
  plotGeolocations: text("plot_geolocations").array(),
  establishmentGeolocations: text("establishment_geolocations").array(),
  geolocationType: text("geolocation_type"),
  geolocationCoordinates: text("geolocation_coordinates"),
  kmlFileName: text("kml_file_name"),
  geojsonFilePaths: text("geojson_file_paths"),
  
  // Reference to prior DDS
  priorDdsReference: text("prior_dds_reference"),
  
  // Declaration and signature
  operatorDeclaration: text("operator_declaration").notNull(),
  signedBy: text("signed_by").notNull(),
  signedDate: timestamp("signed_date").notNull(),
  signatoryFunction: text("signatory_function").notNull(),
  digitalSignature: text("digital_signature"),
  
  // Status and processing
  status: text("status").notNull().default("draft"),
  submissionDate: timestamp("submission_date"),
  euTraceReference: text("eu_trace_reference"),
  pdfDocumentPath: text("pdf_document_path"),
  
  // Cross-module integration
  deforestationRiskLevel: text("deforestation_risk_level"),
  legalityStatus: text("legality_status"),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const ddsReportsRelations = relations(ddsReports, ({ one }) => ({
  shipment: one(shipments, {
    fields: [ddsReports.shipmentId],
    references: [shipments.id],
  }),
}));



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
export const insertDdsReportSchema = createInsertSchema(ddsReports);

// Export types for workflow entities (supplement to existing Supplier types)
export type SupplierWorkflowLink = typeof supplierWorkflowLinks.$inferSelect;
export type InsertSupplierWorkflowLink = z.infer<typeof insertSupplierWorkflowLinkSchema>;
export type WorkflowShipment = typeof workflowShipments.$inferSelect;
export type InsertWorkflowShipment = z.infer<typeof insertWorkflowShipmentSchema>;
export type DdsReport = typeof ddsReports.$inferSelect;
export type InsertDdsReport = z.infer<typeof insertDdsReportSchema>;