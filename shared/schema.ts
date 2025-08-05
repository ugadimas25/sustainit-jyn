import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, jsonb, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("compliance_officer"), // admin, mill_manager, compliance_officer
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  supplierType: text("supplier_type").notNull(), // smallholder, company
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: text("plot_id").notNull().unique(), // KPN-S-2847
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  name: text("name").notNull(),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(), // hectares
  coordinates: jsonb("coordinates").notNull(), // GeoJSON polygon
  status: text("status").notNull().default("pending"), // compliant, at_risk, critical, pending
  legalityStatus: text("legality_status").notNull().default("pending"), // verified, pending, issues
  deforestationRisk: text("deforestation_risk").notNull().default("unknown"), // low, medium, high, unknown
  lastMonitored: timestamp("last_monitored"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").references(() => plots.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  documentType: text("document_type").notNull(), // land_title, environmental_permit, fpic, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  verificationStatus: text("verification_status").notNull().default("pending"), // verified, pending, rejected
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deforestationAlerts = pgTable("deforestation_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").references(() => plots.id).notNull(),
  alertSource: text("alert_source").notNull(), // GLAD, RADD, FIRES
  alertDate: timestamp("alert_date").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // percentage
  areaLost: decimal("area_lost", { precision: 10, scale: 2 }), // hectares
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, investigated, resolved, false_positive
  investigationNotes: text("investigation_notes"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mills = pgTable("mills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }), // tonnes per day
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").references(() => plots.id).notNull(),
  millId: varchar("mill_id").references(() => mills.id).notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(), // tonnes
  quality: text("quality"), // Grade A, B, C
  batchNumber: text("batch_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productionLots = pgTable("production_lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: text("lot_id").notNull().unique(), // L-001
  millId: varchar("mill_id").references(() => mills.id).notNull(),
  productionDate: timestamp("production_date").notNull(),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  productType: text("product_type").notNull().default("crude_palm_oil"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lotDeliveries = pgTable("lot_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lotId: varchar("lot_id").references(() => productionLots.id).notNull(),
  deliveryId: varchar("delivery_id").references(() => deliveries.id).notNull(),
});

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: text("shipment_id").notNull().unique(), // EXP-2024-0156
  destinationCountry: text("destination_country").notNull(),
  destinationPort: text("destination_port"),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  shipmentDate: timestamp("shipment_date").notNull(),
  status: text("status").notNull().default("preparing"), // preparing, shipped, delivered
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shipmentLots = pgTable("shipment_lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").references(() => shipments.id).notNull(),
  lotId: varchar("lot_id").references(() => productionLots.id).notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
});

export const ddsReports = pgTable("dds_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: text("report_id").notNull().unique(), // DDS-2024-0156
  shipmentId: varchar("shipment_id").references(() => shipments.id).notNull(),
  operatorInfo: jsonb("operator_info").notNull(),
  productInfo: jsonb("product_info").notNull(),
  geolocations: jsonb("geolocations").notNull(), // array of plot coordinates
  riskAssessment: jsonb("risk_assessment"),
  status: text("status").notNull().default("draft"), // draft, generated, submitted
  tracesReferenceNumber: text("traces_reference_number"),
  submittedAt: timestamp("submitted_at"),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  template: text("template").notNull(), // eudr_basic, indonesian_law, rspo, custom
  questions: jsonb("questions").notNull(), // array of question objects
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").references(() => surveys.id).notNull(),
  plotId: varchar("plot_id").references(() => plots.id).notNull(),
  responses: jsonb("responses").notNull(), // question answers
  score: decimal("score", { precision: 5, scale: 2 }), // compliance score
  completedBy: varchar("completed_by").references(() => users.id).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedMills: many(mills),
  verifiedDocuments: many(documents),
  resolvedAlerts: many(deforestationAlerts),
  createdSurveys: many(surveys),
  completedSurveys: many(surveyResponses),
  generatedReports: many(ddsReports),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  plots: many(plots),
  documents: many(documents),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [plots.supplierId],
    references: [suppliers.id],
  }),
  documents: many(documents),
  alerts: many(deforestationAlerts),
  deliveries: many(deliveries),
  surveyResponses: many(surveyResponses),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  plot: one(plots, {
    fields: [documents.plotId],
    references: [plots.id],
  }),
  supplier: one(suppliers, {
    fields: [documents.supplierId],
    references: [suppliers.id],
  }),
  verifiedBy: one(users, {
    fields: [documents.verifiedBy],
    references: [users.id],
  }),
}));

export const millsRelations = relations(mills, ({ one, many }) => ({
  manager: one(users, {
    fields: [mills.managerId],
    references: [users.id],
  }),
  deliveries: many(deliveries),
  productionLots: many(productionLots),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  plot: one(plots, {
    fields: [deliveries.plotId],
    references: [plots.id],
  }),
  mill: one(mills, {
    fields: [deliveries.millId],
    references: [mills.id],
  }),
  lotDeliveries: many(lotDeliveries),
}));

export const productionLotsRelations = relations(productionLots, ({ one, many }) => ({
  mill: one(mills, {
    fields: [productionLots.millId],
    references: [mills.id],
  }),
  lotDeliveries: many(lotDeliveries),
  shipmentLots: many(shipmentLots),
}));

export const shipmentsRelations = relations(shipments, ({ many }) => ({
  shipmentLots: many(shipmentLots),
  ddsReports: many(ddsReports),
}));

export const ddsReportsRelations = relations(ddsReports, ({ one }) => ({
  shipment: one(shipments, {
    fields: [ddsReports.shipmentId],
    references: [shipments.id],
  }),
  generatedBy: one(users, {
    fields: [ddsReports.generatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
  createdAt: true,
  lastMonitored: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertDeforestationAlertSchema = createInsertSchema(deforestationAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertMillSchema = createInsertSchema(mills).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
});

export const insertProductionLotSchema = createInsertSchema(productionLots).omit({
  id: true,
  createdAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
});

export const insertDDSReportSchema = createInsertSchema(ddsReports).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  completedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertDeforestationAlert = z.infer<typeof insertDeforestationAlertSchema>;
export type DeforestationAlert = typeof deforestationAlerts.$inferSelect;

export type InsertMill = z.infer<typeof insertMillSchema>;
export type Mill = typeof mills.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type InsertProductionLot = z.infer<typeof insertProductionLotSchema>;
export type ProductionLot = typeof productionLots.$inferSelect;

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

export type InsertDDSReport = z.infer<typeof insertDDSReportSchema>;
export type DDSReport = typeof ddsReports.$inferSelect;

export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveys.$inferSelect;

export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
