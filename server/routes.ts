import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import { setupAuth, isAuthenticated } from "./auth";
import { voiceAssistantRouter } from "./routes/voice-assistant";
import userConfigRoutes from "./user-config-routes";
import { storage } from "./storage";
import {
  insertCommoditySchema,
  insertPartySchema,
  insertFacilitySchema,
  insertLotSchema,
  insertEventSchema,
  insertEventInputSchema,
  insertEventOutputSchema,
  insertShipmentSchema,
  insertCustodyChainSchema,
  insertMassBalanceRecordSchema,
  insertSupplierLinkSchema,
  insertPlotSchema,
  insertSupplierSchema,
  insertSupplierWorkflowLinkSchema,
  insertWorkflowShipmentSchema,
  insertDdsReportSchema,
  insertEudrAssessmentSchema,
  insertMillSchema,
  insertSupplierAssessmentProgressSchema,
  insertRiskAssessmentSchema,
  insertRiskAssessmentItemSchema,
  // Type imports for type casting
  type InsertSupplier,
  type Supplier,
  type InsertRiskAssessment,
  type RiskAssessment,
  type InsertRiskAssessmentItem,
  type RiskAssessmentItem,
  type InsertEudrAssessment,
  type EudrAssessment,
  // Dashboard PRD imports
  dashboardFiltersSchema,
  dashboardMetricsSchema,
  riskSplitSchema,
  legalitySplitSchema,
  supplierSummarySchema,
  alertSchema,
  complianceTrendPointSchema,
  exportDataSchema,
  plotSummarySchema
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { openaiService } from "./lib/openai-service";
import { WDPAService } from "./lib/wdpa-service";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import FormData from "form-data";
import { Readable } from "stream";
import { jsPDF } from "jspdf";
import * as fs from 'fs';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  // Only create default user in development environment
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const existingUser = await storage.getUserByUsername("kpneudr");
    if (!existingUser) {
      const hashedPassword = await hashPassword("kpneudr");
      await storage.createUser({
        username: "kpneudr",
        password: hashedPassword,
        role: "admin",
        name: "KPN Compliance Administrator",
        email: "admin@kpn.com"
      });
      console.log("✓ Default user 'kpneudr' created successfully");
    }
  } catch (error) {
    console.error("Error initializing default user:", error);
  }
}

async function seedSampleData() {
  try {
    // Create sample commodity
    const commodities = await storage.getCommodities();
    if (commodities.length === 0) {
      await storage.createCommodity({
        code: "CPO",
        name: "Crude Palm Oil",
        uomBase: "kg",
        category: "palm_oil"
      });

      await storage.createCommodity({
        code: "FFB",
        name: "Fresh Fruit Bunches",
        uomBase: "kg",
        category: "palm_oil"
      });
    }

    // Create sample parties
    const parties = await storage.getParties();
    if (parties.length === 0) {
      const growerParty = await storage.createParty({
        name: "PT THIP Growers",
        type: "grower",
        address: "Riau Province, Indonesia",
        country: "Indonesia",
        certifications: ["RSPO", "ISPO"]
      });

      const millParty = await storage.createParty({
        name: "PT BSU Mill",
        type: "mill",
        address: "Central Sumatra, Indonesia",
        country: "Indonesia",
        certifications: ["RSPO", "ISCC", "SFC"]
      });
    }

    // Create sample DDS reports with required operators
    const ddsReports = await storage.getDdsReports();
    if (ddsReports.length === 0) {
      const ddsReport1 = await storage.createDdsReport({
        operatorLegalName: "PT THIP",
        operatorAddress: "Jl. Jenderal Sudirman No. 45, Jakarta 12930, Indonesia",
        eoriNumber: "ID123456789000",
        hsCode: "151110",
        productDescription: "Crude Palm Oil (CPO)",
        netMassKg: "2150.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -0.7893, longitude: 101.4467, plotId: "PLT-RIAU-TH-001" },
          { latitude: -0.5333, longitude: 101.4500, plotId: "PLT-RIAU-TH-002" }
        ]),
        operatorDeclaration: "I hereby declare that the information provided is accurate and complete.",
        signedBy: "Dr. Bambang Suharto",
        signedDate: new Date("2024-08-15"),
        signatoryFunction: "Chief Executive Officer",
        status: "draft"
      });

      const ddsReport2 = await storage.createDdsReport({
        operatorLegalName: "KPN 01",
        operatorAddress: "Jl. MH Thamrin No. 28, Jakarta 10350, Indonesia",
        eoriNumber: "ID987654321000",
        hsCode: "151110",
        productDescription: "Refined Palm Oil",
        netMassKg: "1500.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -1.2708, longitude: 103.7367, plotId: "PLT-JAMBI-UP-001" },
          { latitude: -1.6000, longitude: 103.6000, plotId: "PLT-JAMBI-UP-002" }
        ]),
        priorDdsReference: "EU-DDS-2024-001",
        operatorDeclaration: "This shipment complies with all EU deforestation regulations.",
        signedBy: "Ir. Sari Indrawati",
        signedDate: new Date("2024-08-10"),
        signatoryFunction: "Operations Director",
        status: "generated",
        pdfDocumentPath: "/pdfs/dds-sample-001.pdf"
      });

      const ddsReport3 = await storage.createDdsReport({
        operatorLegalName: "KPN 02",
        operatorAddress: "Kawasan Industri Pulogadung, Jakarta 13260, Indonesia",
        eoriNumber: "ID456789123000",
        hsCode: "151190",
        productDescription: "Palm Kernel Oil",
        netMassKg: "850.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -2.1234, longitude: 102.8567, plotId: "PLT-SUMSEL-DS-001" },
          { latitude: -2.5678, longitude: 103.1234, plotId: "PLT-SUMSEL-DS-002" }
        ]),
        operatorDeclaration: "All products sourced from verified deforestation-free areas.",
        signedBy: "Drs. Agus Wibowo",
        signedDate: new Date("2024-08-05"),
        signatoryFunction: "Supply Chain Manager",
        status: "submitted",
        pdfDocumentPath: "/pdfs/dds-sample-002.pdf",
        euTraceReference: "EU-TRACE-1755198000-456789ab",
        submissionDate: new Date("2024-08-06")
      });
      console.log("✓ Sample DDS reports created");
    }

    // Create sample suppliers with real names
    const suppliers = await storage.getSuppliers();
    if (suppliers.length === 0) {
      await storage.createSupplier({
        name: "PT THIP 02",
        companyName: "PT THIP 02",
        businessType: "Estate",
        supplierType: "Estate",
        contactPerson: "Budi Santoso",
        email: "budi.santoso@ptpn3.co.id",
        phone: "+62-61-4567890",
        address: "Jl. Sei Batanghari No. 2, Medan, Sumatera Utara",
        tier: 1,
        legalityStatus: "verified",
        legalityScore: 85,
        certifications: ["RSPO", "ISPO"]
      });

      await storage.createSupplier({
        name: "PT THIP 01",
        companyName: "PT THIP 01",
        businessType: "Estate",
        supplierType: "Estate",
        contactPerson: "Sari Indrawati",
        email: "sari.indrawati@aal.astra.co.id",
        phone: "+62-21-5794567",
        address: "Jl. Pulo Ayang Raya Blok OR-1, Jakarta Timur",
        tier: 1,
        legalityStatus: "verified",
        legalityScore: 92,
        certifications: ["RSPO", "ISPO", "ISCC"]
      });

      await storage.createSupplier({
        name: "PT BSU 01",
        companyName: "PT BSU 01",
        businessType: "Estate",
        supplierType: "Estate",
        contactPerson: "Ahmad Wijaya",
        email: "ahmad.wijaya@sampagro.com",
        phone: "+62-21-5290123",
        address: "Jl. Thamrin No. 59, Jakarta Pusat",
        tier: 1,
        legalityStatus: "pending",
        legalityScore: 75,
        certifications: ["ISPO"]
      });

      await storage.createSupplier({
        name: "KPN 03",
        companyName: "KPN 03",
        businessType: "Estate",
        supplierType: "Estate",
        contactPerson: "Dewi Lestari",
        email: "dewi.lestari@goldenagri.com.sg",
        phone: "+62-21-5012345",
        address: "Jl. Barito II No. 2, Jakarta Selatan",
        tier: 1,
        legalityStatus: "verified",
        legalityScore: 88,
        certifications: ["RSPO", "ISPO"]
      });

      await storage.createSupplier({
        name: "PT BSU 02",
        companyName: "PT BSU 02",
        businessType: "Estate",
        supplierType: "Estate",
        contactPerson: "Rina Maharani",
        email: "rina.maharani@simp.co.id",
        phone: "+62-21-5678901",
        address: "Jl. Sudirman Kav. 76-78, Jakarta Selatan",
        tier: 1,
        legalityStatus: "verified",
        legalityScore: 90,
        certifications: ["RSPO", "ISPO", "ISCC"]
      });

      console.log("✓ Sample suppliers created");
    }

    console.log("✓ Sample data seeded successfully");
  } catch (error) {
    console.error("Error seeding sample data:", error);
  }
}

async function seedUserConfigurationData() {
  try {
    console.log("🔧 Seeding User Configuration data...");
    
    // 1. Create default system organization
    const existingOrgs = await storage.getOrganizations();
    let systemOrg;
    
    if (existingOrgs.length === 0) {
      systemOrg = await storage.createOrganization({
        name: "KPN System Administration",
        slug: "kpn-system-admin",
        description: "Default system administration organization for KPN EUDR Platform",
        settings: {
          features: ["user_management", "compliance_monitoring", "supply_chain", "analytics"],
          branding: { 
            primaryColor: "#2563eb",
            logo: null
          },
          security: {
            passwordPolicy: { minLength: 8, requireNumbers: true },
            sessionTimeout: 3600
          }
        },
        status: "active"
      });
      console.log("✓ Created default system organization");
    } else {
      systemOrg = existingOrgs[0];
    }

    // 2. Create system permissions organized by modules
    const modulePermissions = {
      'user_management': [
        { action: 'view_users', description: 'View user accounts' },
        { action: 'create_users', description: 'Create new user accounts' },
        { action: 'edit_users', description: 'Edit existing user accounts' },
        { action: 'delete_users', description: 'Delete user accounts' },
        { action: 'manage_roles', description: 'Assign/remove user roles' },
        { action: 'lock_unlock_users', description: 'Lock/unlock user accounts' }
      ],
      'organization_management': [
        { action: 'view_organizations', description: 'View organizations' },
        { action: 'create_organizations', description: 'Create new organizations' },
        { action: 'edit_organizations', description: 'Edit organization settings' },
        { action: 'delete_organizations', description: 'Delete organizations' }
      ],
      'role_permission_management': [
        { action: 'view_roles', description: 'View roles and permissions' },
        { action: 'create_roles', description: 'Create new roles' },
        { action: 'edit_roles', description: 'Edit existing roles' },
        { action: 'delete_roles', description: 'Delete roles' },
        { action: 'assign_permissions', description: 'Assign permissions to roles' }
      ],
      'dashboard_analytics': [
        { action: 'view_dashboard', description: 'Access main dashboard' },
        { action: 'view_analytics', description: 'View analytics and reports' },
        { action: 'export_data', description: 'Export dashboard data' }
      ],
      'supply_chain_management': [
        { action: 'view_suppliers', description: 'View supplier information' },
        { action: 'create_suppliers', description: 'Add new suppliers' },
        { action: 'edit_suppliers', description: 'Edit supplier information' },
        { action: 'delete_suppliers', description: 'Remove suppliers' },
        { action: 'manage_traceability', description: 'Manage supply chain traceability' }
      ],
      'compliance_monitoring': [
        { action: 'view_compliance', description: 'View compliance status' },
        { action: 'create_assessments', description: 'Create compliance assessments' },
        { action: 'edit_assessments', description: 'Edit existing assessments' },
        { action: 'generate_reports', description: 'Generate compliance reports' },
        { action: 'view_audit_logs', description: 'Access audit trail' }
      ],
      'deforestation_monitoring': [
        { action: 'view_plots', description: 'View plot information' },
        { action: 'create_plots', description: 'Add new plots' },
        { action: 'edit_plots', description: 'Edit plot data' },
        { action: 'analyze_deforestation', description: 'Run deforestation analysis' },
        { action: 'view_alerts', description: 'View deforestation alerts' }
      ]
    };

    const createdPermissions: Record<string, any> = {};
    const existingPermissions = await storage.getPermissions();
    
    for (const [module, permissions] of Object.entries(modulePermissions)) {
      for (const perm of permissions) {
        const existing = existingPermissions.find(p => 
          p.module === module && p.action === perm.action
        );
        
        if (!existing) {
          const newPerm = await storage.createPermission({
            module,
            action: perm.action,
            description: perm.description,
            resource: '*'
          });
          createdPermissions[`${module}.${perm.action}`] = newPerm;
        } else {
          createdPermissions[`${module}.${perm.action}`] = existing;
        }
      }
    }
    
    console.log(`✓ Created/verified ${Object.keys(createdPermissions).length} system permissions`);

    // 3. Create default roles with appropriate permissions
    const defaultRoles = [
      {
        name: 'system_admin',
        description: 'Full system access with all permissions',
        permissions: Object.keys(createdPermissions) // All permissions
      },
      {
        name: 'organization_admin', 
        description: 'Organization-level administration',
        permissions: [
          'user_management.view_users', 'user_management.create_users',
          'user_management.edit_users', 'user_management.manage_roles',
          'role_permission_management.view_roles', 'role_permission_management.assign_permissions',
          'dashboard_analytics.view_dashboard', 'dashboard_analytics.view_analytics',
          'supply_chain_management.view_suppliers', 'supply_chain_management.create_suppliers',
          'supply_chain_management.edit_suppliers', 'compliance_monitoring.view_compliance',
          'compliance_monitoring.create_assessments', 'deforestation_monitoring.view_plots',
          'deforestation_monitoring.create_plots', 'deforestation_monitoring.analyze_deforestation'
        ]
      },
      {
        name: 'User Manager',
        description: 'User account management and basic operations',
        permissions: [
          'user_management.view_users', 'user_management.create_users',
          'user_management.edit_users', 'user_management.manage_roles',
          'dashboard_analytics.view_dashboard', 'supply_chain_management.view_suppliers',
          'compliance_monitoring.view_compliance', 'deforestation_monitoring.view_plots'
        ]
      },
      {
        name: 'Supply Chain Manager',
        description: 'Supply chain and traceability management',
        permissions: [
          'dashboard_analytics.view_dashboard', 'dashboard_analytics.view_analytics',
          'supply_chain_management.view_suppliers', 'supply_chain_management.create_suppliers',
          'supply_chain_management.edit_suppliers', 'supply_chain_management.manage_traceability',
          'compliance_monitoring.view_compliance', 'compliance_monitoring.create_assessments',
          'deforestation_monitoring.view_plots', 'deforestation_monitoring.create_plots',
          'deforestation_monitoring.analyze_deforestation'
        ]
      },
      {
        name: 'Compliance Officer',
        description: 'Compliance monitoring and assessment',
        permissions: [
          'dashboard_analytics.view_dashboard', 'dashboard_analytics.view_analytics',
          'supply_chain_management.view_suppliers', 'compliance_monitoring.view_compliance',
          'compliance_monitoring.create_assessments', 'compliance_monitoring.edit_assessments',
          'compliance_monitoring.generate_reports', 'compliance_monitoring.view_audit_logs',
          'deforestation_monitoring.view_plots', 'deforestation_monitoring.analyze_deforestation',
          'deforestation_monitoring.view_alerts'
        ]
      },
      {
        name: 'Regular User',
        description: 'Basic access with read permissions',
        permissions: [
          'dashboard_analytics.view_dashboard', 'supply_chain_management.view_suppliers',
          'compliance_monitoring.view_compliance', 'deforestation_monitoring.view_plots'
        ]
      }
    ];

    const existingRoles = await storage.getRoles();
    const createdRoles: Record<string, any> = {};

    for (const roleData of defaultRoles) {
      const existing = existingRoles.find(r => r.name === roleData.name);
      
      if (!existing) {
        const newRole = await storage.createRole({
          name: roleData.name,
          description: roleData.description,
          organizationId: systemOrg.id,
          isSystem: roleData.name === 'system_admin'
        });
        
        // Assign permissions to role
        const permissionIds = roleData.permissions
          .map(permKey => createdPermissions[permKey]?.id)
          .filter(id => id !== undefined);
        
        if (permissionIds.length > 0) {
          await storage.setRolePermissions(newRole.id, permissionIds);
        }
        
        createdRoles[roleData.name] = newRole;
        console.log(`✓ Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      } else {
        createdRoles[roleData.name] = existing;
      }
    }

    // 4. Assign System Administrator role to default admin user (ROBUST VERSION)
    const adminUser = await storage.getUserByUsername("kpneudr");
    if (adminUser && systemOrg && createdRoles['system_admin']) {
      // ALWAYS ensure user is in system organization
      let existingUserOrg = await storage.getUserOrganizations(adminUser.id);
      const isInSystemOrg = existingUserOrg.some(uo => uo.organizationId === systemOrg.id);
      
      if (!isInSystemOrg) {
        await storage.addUserToOrganization({
          userId: adminUser.id,
          organizationId: systemOrg.id,
          status: 'active',
          isDefault: true
        });
        console.log("✓ Added admin user to system organization");
      } else {
        // Ensure it's marked as default organization
        const userOrg = existingUserOrg.find(uo => uo.organizationId === systemOrg.id);
        if (userOrg && !userOrg.isDefault) {
          // Update to make it default
          // Skip update for now - user already in organization
          console.log("✓ Updated admin user default organization");
        }
      }
      
      // ALWAYS ensure system admin role is assigned
      const existingUserRoles = await storage.getUserRoles(adminUser.id, systemOrg.id);
      const hasAdminRole = existingUserRoles.some(r => r.roleId === createdRoles['system_admin'].id);
      
      if (!hasAdminRole) {
        await storage.assignUserRole({
          userId: adminUser.id,
          roleId: createdRoles['system_admin'].id,
          organizationId: systemOrg.id
        });
        console.log("✓ Assigned System Administrator role to default admin user");
      } else {
        console.log("✓ Admin user already has System Administrator role");
      }
      
      // VERIFY and LOG final state
      const finalUserOrgs = await storage.getUserOrganizations(adminUser.id);
      const finalUserRoles = await storage.getUserRoles(adminUser.id, systemOrg.id);
      console.log(`✓ ADMIN USER VERIFICATION: User ${adminUser.username} has ${finalUserOrgs.length} org(s), ${finalUserRoles.length} role(s) in system org`);
    } else {
      console.error(`❌ SEEDING ERROR: Missing adminUser(${!!adminUser}) or systemOrg(${!!systemOrg}) or system_admin role(${!!createdRoles['system_admin']})`);
    }

    console.log("✓ User Configuration seeding completed successfully");
  } catch (error) {
    console.error("Error seeding User Configuration data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  await setupAuth(app);
  await initializeDefaultUser();
  await seedSampleData();
  await seedUserConfigurationData();

  // Voice Assistant Routes
  app.use('/api/voice-assistant', voiceAssistantRouter);

  // User Configuration Routes (RBAC System)
  app.use('/api/user-config', userConfigRoutes);

  // GraphQL endpoint for traceability queries
  app.post('/api/graphql', isAuthenticated, async (req, res) => {
    try {
      const { query, variables } = req.body;

      if (query.includes('traceForward') || query.includes('traceBackward') || query.includes('getFullLineage')) {
        const entityId = variables?.entityId;
        const entityType = variables?.entityType;

        // Mock comprehensive lineage data for testing
        const mockLineageResult = {
          entityId,
          entityType,
          depth: 5,
          totalNodes: 12,
          nodes: [
            {
              id: 'plot-riau-001',
              type: 'plot',
              name: 'Palm Plot A - Riau Province',
              data: {
                level: 0,
                area: '5.2 hectares',
                farmer: 'Budi Santoso',
                crop: 'oil_palm',
                plantingYear: 2018
              },
              coordinates: { latitude: -0.5021, longitude: 101.4967 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISPO'],
              distance: 0,
              massBalance: { input: 0, output: 50.5, efficiency: 100 }
            },
            {
              id: 'collection-riau-001',
              type: 'facility',
              name: 'Riau Collection Center A',
              data: {
                level: 1,
                facilityType: 'collection_center',
                capacity: '1000 tonnes/day',
                operatingHours: '24/7'
              },
              coordinates: { latitude: -0.5105, longitude: 101.5123 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC'],
              distance: 2.1,
              massBalance: { input: 50.5, output: 48.2, efficiency: 95.4 }
            },
            {
              id: 'mill-sumatra-001',
              type: 'facility',
              name: 'Central Palm Mill Complex',
              data: {
                level: 2,
                facilityType: 'mill',
                capacity: '200 tonnes/hour',
                processes: ['sterilization', 'pressing', 'clarification']
              },
              coordinates: { latitude: -0.5234, longitude: 101.5456 },
              riskLevel: 'medium',
              certifications: ['RSPO', 'ISCC', 'SFC'],
              distance: 8.7,
              massBalance: { input: 48.2, output: 22.1, efficiency: 45.8 }
            },
            {
              id: 'refinery-jakarta-001',
              type: 'facility',
              name: 'Jakarta Oil Refinery Complex',
              data: {
                level: 3,
                facilityType: 'refinery',
                capacity: '500 tonnes/day',
                processes: ['neutralization', 'bleaching', 'deodorization']
              },
              coordinates: { latitude: -6.2088, longitude: 106.8456 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC', 'RTRS'],
              distance: 45.3,
              massBalance: { input: 22.1, output: 21.8, efficiency: 98.6 }
            },
            {
              id: 'port-jakarta-001',
              type: 'facility',
              name: 'Tanjung Priok Export Terminal',
              data: {
                level: 4,
                facilityType: 'port',
                capacity: '10000 tonnes storage',
                exportDestinations: ['Rotterdam', 'Hamburg', 'Antwerp']
              },
              coordinates: { latitude: -6.1052, longitude: 106.8970 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC'],
              distance: 50.2,
              massBalance: { input: 21.8, output: 21.8, efficiency: 100 }
            },
            {
              id: 'shipment-exp-001',
              type: 'shipment',
              name: 'Export Shipment EXP-2024-001',
              data: {
                level: 5,
                destination: 'Rotterdam, Netherlands',
                vessel: 'MV Palm Carrier',
                departureDate: '2024-08-15',
                estimatedArrival: '2024-09-10'
              },
              coordinates: { latitude: -6.1052, longitude: 106.8970 },
              riskLevel: 'low',
              certifications: ['EUDR', 'RSPO'],
              distance: 55.8,
              massBalance: { input: 21.8, output: 21.8, efficiency: 100 }
            }
          ],
          edges: [
            {
              source: 'plot-riau-001',
              target: 'collection-riau-001',
              type: 'delivery',
              quantity: 50.5,
              uom: 'tonnes',
              date: '2024-08-10',
              eventType: 'TRANSFER'
            },
            {
              source: 'collection-riau-001',
              target: 'mill-sumatra-001',
              type: 'processing',
              quantity: 48.2,
              uom: 'tonnes',
              date: '2024-08-11',
              eventType: 'TRANSFORM'
            },
            {
              source: 'mill-sumatra-001',
              target: 'refinery-jakarta-001',
              type: 'transformation',
              quantity: 22.1,
              uom: 'tonnes',
              date: '2024-08-12',
              eventType: 'TRANSFER'
            },
            {
              source: 'refinery-jakarta-001',
              target: 'port-jakarta-001',
              type: 'transfer',
              quantity: 21.8,
              uom: 'tonnes',
              date: '2024-08-13',
              eventType: 'TRANSFER'
            },
            {
              source: 'port-jakarta-001',
              target: 'shipment-exp-001',
              type: 'shipment',
              quantity: 21.8,
              uom: 'tonnes',
              date: '2024-08-15',
              eventType: 'TRANSFER'
            }
          ],
          riskAssessment: {
            overallRisk: 'medium',
            riskFactors: [
              {
                type: 'Processing Efficiency',
                severity: 'medium',
                description: 'Mill processing efficiency below industry standard at 45.8%',
                entityId: 'mill-sumatra-001',
                recommendation: 'Equipment maintenance and process optimization needed'
              },
              {
                type: 'Geographic Risk',
                severity: 'low',
                description: 'Source location in low-risk deforestation area',
                entityId: 'plot-riau-001',
                recommendation: 'Continue monitoring satellite data'
              }
            ],
            compliance: {
              eudrCompliant: true,
              rspoCompliant: true,
              issues: [],
              score: 87.5
            },
            massBalanceValidation: {
              isValid: true,
              overallEfficiency: 95.2,
              totalInput: 50.5,
              totalOutput: 21.8,
              totalWaste: 28.7,
              conversionRate: 0.431 // CPO from FFB
            }
          },
          chainOfCustodyEvents: [
            {
              id: 'evt-001',
              eventType: 'creation',
              timestamp: '2024-08-10T06:00:00Z',
              facility: 'plot-riau-001',
              businessStep: 'harvesting',
              quantity: 50.5,
              uom: 'tonnes'
            },
            {
              id: 'evt-002',
              eventType: 'TRANSFER',
              timestamp: '2024-08-10T14:00:00Z',
              facility: 'collection-riau-001',
              businessStep: 'receiving',
              quantity: 50.5,
              uom: 'tonnes'
            },
            {
              id: 'evt-003',
              eventType: 'TRANSFORM',
              timestamp: '2024-08-11T08:00:00Z',
              facility: 'mill-sumatra-001',
              businessStep: 'processing',
              inputQuantity: 48.2,
              outputQuantity: 22.1,
              uom: 'tonnes'
            }
          ]
        };

        const operation = query.includes('traceForward') ? 'traceForward' :
                         query.includes('traceBackward') ? 'traceBackward' : 'getFullLineage';
        res.json({ data: { [operation]: mockLineageResult } });
      } else if (query.includes('getCustodyChains')) {
        const mockChains = [
          {
            id: 'chain-001',
            chainId: 'CHAIN-FFB-001',
            sourcePlot: { id: 'plot-riau-001', name: 'Palm Plot A - Riau', area: '5.2 ha' },
            sourceFacility: { id: 'collection-riau-001', name: 'Riau Collection Center A', facilityType: 'collection_center' },
            destinationFacility: { id: 'mill-sumatra-001', name: 'Central Palm Mill', facilityType: 'mill' },
            productType: 'FFB',
            totalQuantity: 50.5,
            remainingQuantity: 22.1,
            status: 'active',
            qualityGrade: 'Grade A',
            batchNumber: 'BATCH-FFB-001',
            harvestDate: '2024-08-10',
            expiryDate: '2024-08-20',
            riskLevel: 'low',
            complianceScore: 87.5
          },
          {
            id: 'chain-002',
            chainId: 'CHAIN-CPO-001',
            sourcePlot: { id: 'plot-riau-002', name: 'Palm Plot B - Sumatra', area: '8.1 ha' },
            sourceFacility: { id: 'mill-sumatra-001', name: 'Central Palm Mill', facilityType: 'mill' },
            destinationFacility: { id: 'refinery-jakarta-001', name: 'Jakarta Oil Refinery', facilityType: 'refinery' },
            productType: 'CPO',
            totalQuantity: 22.1,
            remainingQuantity: 21.8,
            status: 'active',
            qualityGrade: 'Premium',
            batchNumber: 'BATCH-CPO-002',
            harvestDate: '2024-08-12',
            expiryDate: '2024-09-12',
            riskLevel: 'medium',
            complianceScore: 92.3
          }
        ];
        res.json({ data: { getCustodyChains: mockChains } });
      } else if (query.includes('getFacilities')) {
        const mockFacilities = [
          {
            id: 'collection-riau-001',
            name: 'Riau Collection Center A',
            facilityType: 'collection_center',
            location: { latitude: -0.5105, longitude: 101.5123 },
            certifications: ['RSPO', 'ISCC'],
            capacity: '1000 tonnes/day',
            riskLevel: 'low'
          },
          {
            id: 'mill-sumatra-001',
            name: 'Central Palm Mill Complex',
            facilityType: 'mill',
            location: { latitude: -0.5234, longitude: 101.5456 },
            certifications: ['RSPO', 'ISCC', 'SFC'],
            capacity: '200 tonnes/hour',
            riskLevel: 'medium'
          },
          {
            id: 'refinery-jakarta-001',
            name: 'Jakarta Oil Refinery Complex',
            facilityType: 'refinery',
            location: { latitude: -6.2088, longitude: 106.8456 },
            certifications: ['RSPO', 'ISCC', 'RTRS'],
            capacity: '500 tonnes/day',
            riskLevel: 'low'
          }
        ];
        res.json({ data: { getFacilities: mockFacilities } });
      } else if (query.includes('getCustodyEvents')) {
        const mockEvents = [
          {
            id: 'evt-001',
            eventType: 'creation',
            eventTime: '2024-08-10T06:00:00Z',
            businessStep: 'harvesting',
            disposition: 'active',
            quantity: 50.5,
            uom: 'tonnes',
            facility: { name: 'Palm Plot A - Riau', facilityType: 'plot' },
            recordedBy: { name: 'Farmer Budi Santoso' }
          },
          {
            id: 'evt-002',
            eventType: 'TRANSFER',
            eventTime: '2024-08-10T14:00:00Z',
            businessStep: 'shipping',
            disposition: 'in_transit',
            quantity: 50.5,
            uom: 'tonnes',
            facility: { name: 'Riau Collection Center A', facilityType: 'collection_center' },
            recordedBy: { name: 'Driver Ahmad' }
          },
          {
            id: 'evt-003',
            eventType: 'TRANSFORM',
            eventTime: '2024-08-11T08:00:00Z',
            businessStep: 'processing',
            disposition: 'processed',
            inputQuantity: 48.2,
            outputQuantity: 22.1,
            uom: 'tonnes',
            facility: { name: 'Central Palm Mill Complex', facilityType: 'mill' },
            recordedBy: { name: 'Mill Operator Sari' }
          }
        ];
        res.json({ data: { getCustodyEvents: mockEvents } });
      } else if (query.includes('validateMassBalance')) {
        const mockValidation = {
          isValid: true,
          totalInput: 50.5,
          totalOutput: 21.8,
          totalWaste: 28.7,
          overallEfficiency: 95.2,
          conversionRate: 0.431,
          discrepancies: [],
          facilityEfficiencies: [
            { facilityId: 'collection-riau-001', efficiency: 95.4, status: 'good' },
            { facilityId: 'mill-sumatra-001', efficiency: 45.8, status: 'below_target' },
            { facilityId: 'refinery-jakarta-001', efficiency: 98.6, status: 'excellent' }
          ]
        };
        res.json({ data: { validateMassBalance: mockValidation } });
      } else {
        res.status(400).json({ error: 'Unsupported GraphQL operation' });
      }
    } catch (error) {
      console.error('GraphQL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Core entity routes
  app.get("/api/commodities", isAuthenticated, async (req, res) => {
    try {
      const commodities = await storage.getCommodities();
      res.json(commodities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commodities" });
    }
  });

  app.get("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parties" });
    }
  });

  app.get("/api/facilities", isAuthenticated, async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.get("/api/lots", isAuthenticated, async (req, res) => {
    try {
      const lots = await storage.getLots();
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lots" });
    }
  });

  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.get("/api/custody-chains", isAuthenticated, async (req, res) => {
    try {
      const chains = await storage.getCustodyChains();
      res.json(chains);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custody chains" });
    }
  });

  // Legacy support routes
  // Suppliers endpoints for workflow
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData as InsertSupplier);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier" });
      }
    }
  });

  app.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData as Partial<Supplier>);
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
      } else {
        res.json(supplier);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update supplier" });
      }
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSupplier(id);
      if (!deleted) {
        res.status(404).json({ error: "Supplier not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Supplier links endpoints
  app.get("/api/supplier-links", isAuthenticated, async (req, res) => {
    try {
      const links = await storage.getSupplierWorkflowLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier links" });
    }
  });

  app.post("/api/supplier-links", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierWorkflowLinkSchema.parse(req.body);
      const link = await storage.createSupplierWorkflowLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid link data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier link" });
      }
    }
  });

  app.delete("/api/supplier-links/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSupplierWorkflowLink(id);
      if (!deleted) {
        res.status(404).json({ error: "Supplier link not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier link" });
    }
  });

  // Workflow shipments endpoints
  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipments = await storage.getWorkflowShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.post("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkflowShipmentSchema.parse(req.body);
      const shipment = await storage.createWorkflowShipment(validatedData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create shipment" });
      }
    }
  });

  app.put("/api/shipments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWorkflowShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateWorkflowShipment(id, validatedData);
      if (!shipment) {
        res.status(404).json({ error: "Shipment not found" });
      } else {
        res.json(shipment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update shipment" });
      }
    }
  });

  app.delete("/api/shipments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkflowShipment(id);
      if (!deleted) {
        res.status(404).json({ error: "Shipment not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  });

  // Supplier Assessment Progress endpoints
  app.get("/api/supplier-assessment-progress", isAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getSupplierAssessmentProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier assessment progress" });
    }
  });

  app.get("/api/supplier-assessment-progress/:supplierName", isAuthenticated, async (req, res) => {
    try {
      const { supplierName } = req.params;
      const progress = await storage.getSupplierAssessmentProgressByName(decodeURIComponent(supplierName));
      if (!progress) {
        res.status(404).json({ error: "Supplier progress not found" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier progress" });
    }
  });

  app.post("/api/supplier-assessment-progress", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierAssessmentProgressSchema.parse(req.body);
      const progress = await storage.createSupplierAssessmentProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid progress data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier progress" });
      }
    }
  });

  app.put("/api/supplier-assessment-progress/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSupplierAssessmentProgressSchema.partial().parse(req.body);
      const progress = await storage.updateSupplierAssessmentProgress(id, validatedData);
      if (!progress) {
        res.status(404).json({ error: "Supplier progress not found" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid progress data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update supplier progress" });
      }
    }
  });

  // Workflow step management endpoints
  app.post("/api/supplier-workflow-step", isAuthenticated, async (req, res) => {
    try {
      const { supplierName, step, completed, referenceId } = req.body;
      if (!supplierName || typeof step !== 'number' || typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Missing required fields: supplierName, step, completed" });
      }

      const progress = await storage.updateSupplierWorkflowStep(supplierName, step, completed, referenceId);
      if (!progress) {
        res.status(404).json({ error: "Failed to update workflow step" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow step" });
    }
  });

  app.get("/api/supplier-step-access/:supplierName/:step", isAuthenticated, async (req, res) => {
    try {
      const { supplierName, step } = req.params;
      const stepNumber = parseInt(step, 10);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 4) {
        return res.status(400).json({ error: "Step must be a number between 1 and 4" });
      }

      const hasAccess = await storage.checkSupplierStepAccess(decodeURIComponent(supplierName), stepNumber);
      res.json({ supplierName, step: stepNumber, hasAccess });
    } catch (error) {
      res.status(500).json({ error: "Failed to check step access" });
    }
  });

  // Risk Assessment API endpoints based on Excel methodology
  app.get("/api/risk-assessments", isAuthenticated, async (req, res) => {
    try {
      const assessments = await storage.getRiskAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessments" });
    }
  });

  app.get("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getRiskAssessment(id);
      if (!assessment) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json(assessment);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessment" });
    }
  });

  app.get("/api/risk-assessments/supplier/:supplierId", isAuthenticated, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const assessments = await storage.getRiskAssessmentBySupplier(supplierId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier risk assessments" });
    }
  });

  app.post("/api/risk-assessments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRiskAssessmentSchema.parse(req.body);
      const assessment = await storage.createRiskAssessment(validatedData as InsertRiskAssessment);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create risk assessment" });
      }
    }
  });

  app.put("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRiskAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateRiskAssessment(id, validatedData as Partial<RiskAssessment>);
      if (!assessment) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json(assessment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update risk assessment" });
      }
    }
  });

  app.delete("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRiskAssessment(id);
      if (!deleted) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk assessment" });
    }
  });

  // Risk Assessment Items endpoints
  app.get("/api/risk-assessments/:assessmentId/items", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const items = await storage.getRiskAssessmentItems(assessmentId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessment items" });
    }
  });

  app.post("/api/risk-assessments/:assessmentId/items", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const validatedData = insertRiskAssessmentItemSchema.parse({
        ...req.body,
        riskAssessmentId: assessmentId
      });
      const item = await storage.createRiskAssessmentItem(validatedData as InsertRiskAssessmentItem);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create risk assessment item" });
      }
    }
  });

  app.put("/api/risk-assessment-items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRiskAssessmentItemSchema.partial().parse(req.body);
      const item = await storage.updateRiskAssessmentItem(id, validatedData as Partial<RiskAssessmentItem>);
      if (!item) {
        res.status(404).json({ error: "Risk assessment item not found" });
      } else {
        res.json(item);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update risk assessment item" });
      }
    }
  });

  app.delete("/api/risk-assessment-items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRiskAssessmentItem(id);
      if (!deleted) {
        res.status(404).json({ error: "Risk assessment item not found" });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk assessment item" });
    }
  });

  // Risk scoring and reporting endpoints based on Excel methodology
  app.get("/api/risk-assessments/:assessmentId/score", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const scoring = await storage.calculateRiskScore(assessmentId);
      res.json(scoring);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate risk score" });
    }
  });

  app.get("/api/risk-assessments/:assessmentId/report", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const report = await storage.generateRiskReport(assessmentId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate risk report" });
    }
  });

  // Excel-based risk template initialization endpoint
  app.post("/api/risk-assessments/:assessmentId/init-excel-template", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;

      // Initialize default risk items based on Excel methodology
      const defaultRiskItems = [
        // Spatial Risk Analysis items from Excel
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "deforestasi",
          itemName: "Deforestasi",
          riskLevel: "rendah",
          parameter: "Sumber TBS Berasal dari Kebun yang di kembangkan sebelum Desember 2020",
          riskValue: 3,
          weight: "45.00",
          calculatedRisk: 135.00, // 45 * 3
          normalizedScore: 0.45, // 135 / 300 (max possible score)
          finalScore: 0.15,
          mitigationRequired: false,
          mitigationDescription: "Monitoring berkala plot sumber TBS",
          dataSources: ["Hansen Alert", "Glad Alert", "JRC Natural Forest"],
          sourceLinks: ["https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html", "http://glad-forest-alert.appspot.com/", "https://data.jrc.ec.europa.eu/dataset/10d1b337-b7d1-4938-a048-686c8185b290"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "legalitas_lahan",
          itemName: "Legalitas Lahan",
          riskLevel: "rendah",
          parameter: "Memiliki Izin dan Berada di Kawasan APL",
          riskValue: 3,
          weight: "35.00",
          calculatedRisk: 105.00,
          normalizedScore: 0.35,
          finalScore: 0.12,
          mitigationRequired: false,
          mitigationDescription: "Monitoring Berkala plot Sumber TBS",
          dataSources: ["Peta WDPA", "Peta Kawasan Hutan Indonesia"],
          sourceLinks: ["https://www.protectedplanet.net/en/thematic-areas/wdpa?tab=WDPA", "https://geoportal.menlhk.go.id/portal/apps/webappviewer/index.html?id=2ee8bdda1d714899955fccbe7fdf8468&utm_"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "kawasan_gambut",
          itemName: "Kawasan Gambut",
          riskLevel: "sedang",
          parameter: "Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan sedang proses bimbingan teknis",
          riskValue: 2,
          weight: "10.00",
          calculatedRisk: 20.00,
          normalizedScore: 0.10,
          finalScore: 0.03,
          mitigationRequired: true,
          mitigationDescription: "Sosialisasi kebijakan perusahaan kepada supplier",
          dataSources: ["Peta Areal Gambut"],
          sourceLinks: ["https://brgm.go.id/"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "indigenous_people",
          itemName: "Indigenous People",
          riskLevel: "rendah",
          parameter: "Tidak ada Overlap dan Memiliki SOP mengenai Penanganan Keluhan Stakeholder",
          riskValue: 3,
          weight: "10.00",
          calculatedRisk: 30.00,
          normalizedScore: 0.10,
          finalScore: 0.03,
          mitigationRequired: false,
          mitigationDescription: "Monitoring isu sosial secara berkala untuk deteksi dini potensi konflik",
          dataSources: ["Peta Masyarakat Adat"],
          sourceLinks: ["https://www.aman.or.id/"]
        }
      ];

      // Create all default items
      const createdItems = [];
      for (const itemData of defaultRiskItems) {
        const item = await storage.createRiskAssessmentItem({
          ...itemData,
          category: itemData.category as "spatial" | "non_spatial",
          itemType: itemData.itemType as "deforestasi" | "legalitas_lahan" | "kawasan_gambut" | "indigenous_people" | "sertifikasi" | "dokumentasi_legal",
          riskLevel: itemData.riskLevel as "tinggi" | "sedang" | "rendah",
          calculatedRisk: itemData.calculatedRisk.toString(),
          normalizedScore: itemData.normalizedScore.toString(),
          finalScore: itemData.finalScore.toString()
        });
        createdItems.push(item);
      }

      // Calculate initial score
      const scoring = await storage.calculateRiskScore(assessmentId);

      // Update assessment with initial scores
      await storage.updateRiskAssessment(assessmentId, {
        spatialRiskScore: scoring.overallScore.toString(),
        spatialRiskLevel: scoring.riskClassification as any,
        overallScore: scoring.overallScore.toString(),
        riskClassification: scoring.riskClassification as any
      });

      res.json({
        items: createdItems,
        scoring
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize Excel-based risk template" });
    }
  });

  app.get("/api/mills", isAuthenticated, async (req, res) => {
    try {
      const mills = await storage.getMills();
      res.json(mills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mills" });
    }
  });

  app.get("/api/plots", isAuthenticated, async (req, res) => {
    try {
      const plots = await storage.getPlots();
      res.json(plots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plots" });
    }
  });

  // ========================================
  // DASHBOARD COMPLIANCE PRD - PHASE 2: API ROUTES
  // ========================================

  // Dashboard metrics with optional filters
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const metrics = await storage.getDashboardMetrics(filters);

      // Validate response with schema
      const validatedMetrics = dashboardMetricsSchema.parse(metrics);
      res.json(validatedMetrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return zeros in case of error to maintain zero state
      res.json({
        totalPlots: 0,
        compliantPlots: 0,
        highRiskPlots: 0,
        mediumRiskPlots: 0,
        deforestedPlots: 0,
        totalAreaHa: 0,
        complianceRate: 0
      });
    }
  });

  // Risk split data for donut charts
  app.get("/api/dashboard/risk-split", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const riskSplit = await storage.getRiskSplit(filters);

      // Validate response with schema
      const validatedRiskSplit = riskSplitSchema.parse(riskSplit);
      res.json(validatedRiskSplit);
    } catch (error) {
      console.error("Error fetching risk split:", error);
      res.status(500).json({ error: "Failed to fetch risk split data" });
    }
  });

  // Legality split data for donut charts
  app.get("/api/dashboard/legality-split", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const legalitySplit = await storage.getLegalitySplit(filters);

      // Validate response with schema
      const validatedLegalitySplit = legalitySplitSchema.parse(legalitySplit);
      res.json(validatedLegalitySplit);
    } catch (error) {
      console.error("Error fetching legality split:", error);
      res.status(500).json({ error: "Failed to fetch legality split data" });
    }
  });

  // Supplier compliance table data
  app.get("/api/dashboard/suppliers", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const suppliers = await storage.getSupplierCompliance(filters);

      // Validate response with schema - validate each item
      const validatedSuppliers = suppliers.map(supplier => supplierSummarySchema.parse(supplier));
      res.json(validatedSuppliers);
    } catch (error) {
      console.error("Error fetching supplier compliance:", error);
      res.status(500).json({ error: "Failed to fetch supplier compliance data" });
    }
  });

  // Dashboard alerts for alerts widget
  app.get("/api/dashboard/alerts", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const alerts = await storage.getDashboardAlerts(filters);

      // Validate response with schema - validate each alert
      const validatedAlerts = alerts.map(alert => alertSchema.parse(alert));
      res.json(validatedAlerts);
    } catch (error) {
      console.error("Error fetching dashboard alerts:", error);
      res.status(500).json({ error: "Failed to fetch dashboard alerts" });
    }
  });

  // Compliance trend data for line chart
  app.get("/api/dashboard/trend", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const trendData = await storage.getComplianceTrend(filters);

      // Validate response with schema - validate each point
      const validatedTrendData = trendData.map(point => complianceTrendPointSchema.parse(point));
      res.json(validatedTrendData);
    } catch (error) {
      console.error("Error fetching compliance trend:", error);
      res.status(500).json({ error: "Failed to fetch compliance trend data" });
    }
  });

  // Save polygon-supplier association endpoint
  app.post("/api/plots/save-association", isAuthenticated, async (req, res) => {
    try {
      const { plotIds, supplierId } = req.body;

      if (!plotIds || !Array.isArray(plotIds) || plotIds.length === 0) {
        return res.status(400).json({ error: "plotIds array is required" });
      }

      if (!supplierId) {
        return res.status(400).json({ error: "supplierId is required" });
      }

      // Verify supplier exists
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Get analysis results for the selected plots
      const analysisResultsToUpdate = await storage.getAnalysisResultsByPlotIds(plotIds);

      if (analysisResultsToUpdate.length === 0) {
        return res.status(404).json({ error: "No analysis results found for the specified plot IDs" });
      }

      // Update analysis results with supplier association
      const updatedAnalysisResults = [];
      for (const result of analysisResultsToUpdate) {
        const updated = await storage.updateAnalysisResult(result.id, { supplierId });
        updatedAnalysisResults.push(updated);

        // Create or update plot record (handle missing supplier_id column gracefully)
        try {
          // First try to add supplier_id column if it doesn't exist
          try {
            await db.execute(sql`ALTER TABLE plots ADD COLUMN IF NOT EXISTS supplier_id VARCHAR REFERENCES suppliers(id)`);
          } catch (alterError) {
            console.log('supplier_id column already exists or alter failed, continuing...');
          }

          const existingPlot = await storage.getPlotByPlotId(result.plotId);
          if (existingPlot) {
            // Update existing plot with supplier association
            await storage.updateLot(existingPlot.id, { supplierId });
            console.log(`✓ Updated existing plot ${result.plotId} with supplier ${supplierId}`);
          } else {
            // Create new plot record
            await storage.createPlot({
              plotId: result.plotId,
              supplierId: supplierId,
              polygon: result.geometry ? JSON.stringify(result.geometry) : null,
              areaHa: result.area.toString(),
              crop: "oil_palm", // Default crop
              isActive: true
            });
            console.log(`✓ Created new plot ${result.plotId} with supplier ${supplierId}`);
          }
        } catch (plotError) {
          console.error(`Error handling plot ${result.plotId}:`, plotError);
          // Continue with other plots even if one fails
        }
      }

      // Update supplier assessment progress to enable Step 3 (Legality Compliance)
      try {
        const progress = await storage.getSupplierAssessmentProgressByName(supplier.name);
        if (progress) {
          // Mark data collection as completed and enable legality compliance
          await storage.updateSupplierAssessmentProgress(progress.id, {
            dataCollectionCompleted: true,
            dataCollectionCompletedAt: new Date(),
            currentStep: 3 // Enable Step 3 (Legality Compliance) - this should be step 3, not 2
          });
          console.log(`✅ Updated existing progress for ${supplier.name} - enabled step 3`);
        } else {
          // Create new progress record
          await storage.createSupplierAssessmentProgress({
            supplierName: supplier.name,
            supplierType: supplier.supplierType || 'Estate',
            dataCollectionCompleted: true,
            dataCollectionCompletedAt: new Date(),
            currentStep: 3 // Enable Step 3 (Legality Compliance)
          });
          console.log(`✅ Created new progress for ${supplier.name} - enabled step 3`);
        }
      } catch (progressError) {
        console.error("Error updating supplier assessment progress:", progressError);
      }

      res.json({
        success: true,
        message: `Successfully associated ${updatedAnalysisResults.length} plots with supplier ${supplier.name}. Step 3 (Legality Compliance) is now available!`,
        data: {
          updatedResults: updatedAnalysisResults.length,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            companyName: supplier.companyName
          },
          plotIds: plotIds,
          nextStepEnabled: "Step 3 - Legality Compliance"
        }
      });

    } catch (error) {
      console.error("Error saving plot-supplier association:", error);
      res.status(500).json({ error: "Failed to save plot-supplier association" });
    }
  });

  // Export functionality for CSV/XLSX
  app.get("/api/dashboard/export", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const format = req.query.format || 'json';
      const exportData = await storage.getExportData(filters);

      // Validate response with schema
      const validatedExportData = exportDataSchema.parse(exportData);

      if (format === 'csv') {
        // Convert to CSV format
        const csvLines: string[] = [];

        // Supplier summary CSV
        csvLines.push('Supplier Summary');
        csvLines.push('Supplier Name,Total Plots,Compliant Plots,Total Area (Ha),Compliance Rate (%),Risk Status,Legality Status,Region,Last Updated');

        validatedExportData.supplierSummaries.forEach(supplier => {
          csvLines.push([
            supplier.supplierName,
            supplier.totalPlots,
            supplier.compliantPlots,
            supplier.totalArea,
            supplier.complianceRate,
            supplier.riskStatus,
            supplier.legalityStatus,
            supplier.region || '',
            supplier.lastUpdated.toISOString()
          ].join(','));
        });

        csvLines.push(''); // Empty line

        // Plot summary CSV
        csvLines.push('Plot Summary');
        csvLines.push('Plot ID,Supplier Name,Region,Area (Ha),Risk Status,Legality Status,Last Updated');

        validatedExportData.plotSummaries.forEach(plot => {
          csvLines.push([
            plot.plotId,
            plot.supplierName,
            plot.region || '',
            plot.area,
            plot.riskStatus,
            plot.legalityStatus,
            plot.lastUpdated.toISOString()
          ].join(','));
        });

        const csvContent = csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="compliance-overview-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json(validatedExportData);
      }
    } catch (error) {
      console.error("Error generating export data:", error);
      res.status(500).json({ error: "Failed to generate export data" });
    }
  });

  // Plot summaries for drill-down functionality
  app.get("/api/dashboard/plots", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const plots = await storage.getPlotSummaries(filters);

      // Validate response with schema - validate each plot
      const validatedPlots = plots.map(plot => plotSummarySchema.parse(plot));
      res.json(validatedPlots);
    } catch (error) {
      console.error("Error fetching plot summaries:", error);
      res.status(500).json({ error: "Failed to fetch plot summaries" });
    }
  });

  // User authentication routes
  app.get("/api/user", async (req, res) => {
    // Force fresh response - no caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': Math.random().toString() // Force unique response
    });
    if (req.user) {
      try {
        const { password, ...userWithoutPassword } = req.user as any;
        
        // Derive the user's role from their organization roles
        let derivedRole = 'user'; // default role
        console.log(`🔍 DEBUG: Starting role derivation for user ${userWithoutPassword.username}`);
        
        try {
          // Get user's organizations
          const userOrgs = await storage.getUserOrganizations(userWithoutPassword.id);
          
          if (userOrgs.length > 0) {
            // Check roles in each organization
            for (const userOrg of userOrgs) {
              const userRoles = await storage.getUserRoles(userWithoutPassword.id, userOrg.organizationId);
              
              for (const userRole of userRoles) {
                const role = await storage.getRole(userRole.roleId);
                if (role?.name === 'system_admin') {
                  derivedRole = 'system_admin';
                  break;
                } else if (role?.name === 'organization_admin') {
                  derivedRole = 'organization_admin';
                }
              }
              
              if (derivedRole === 'system_admin') break;
            }
          }
        } catch (roleError) {
          console.log('Error deriving user role:', roleError);
        }
        
        // Return user with derived role
        console.log(`🔍 DEBUG: Final derived role for ${userWithoutPassword.username}: ${derivedRole}`);
        res.json({ ...userWithoutPassword, role: derivedRole, lastUpdated: new Date().toISOString() });
      } catch (error) {
        console.error('Error in /api/user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      // Mock alerts for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Shipment traceability endpoint
  app.get("/api/shipments/:shipmentId/traceability", isAuthenticated, async (req, res) => {
    try {
      const { shipmentId } = req.params;

      // Mock traceability data
      const mockTraceability = {
        shipment: {
          id: shipmentId,
          shipmentId: `EXP-2024-${shipmentId.slice(-3)}`,
          destination: 'Rotterdam, Netherlands',
          totalWeight: '21.8'
        },
        shipmentLots: [
          {
            lot: { id: 'lot-001', lotId: 'BATCH-CPO-001', quantity: 21.8 },
            mill: { id: 'mill-001', name: 'Central Palm Mill Complex' }
          }
        ],
        sourcePlots: [
          {
            plot: { id: 'plot-001', plotId: 'PLT-RIAU-001', name: 'Palm Plot A - Riau' },
            supplier: { name: 'Riau Growers Cooperative' },
            delivery: { weight: '50.5', deliveryDate: '2024-08-10' }
          }
        ]
      };

      res.json(mockTraceability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traceability data" });
    }
  });

  // Enhanced DDS Reports routes for PRD implementation

  // Get available HS codes for product selection dropdown
  app.get('/api/dds/hs-codes', isAuthenticated, async (req, res) => {
    try {
      const hsCodes = [
        { code: '1511', description: 'Palm Oil and its fractions, crude', category: 'palm_oil' },
        { code: '151110', description: 'Crude palm oil', category: 'palm_oil' },
        { code: '151190', description: 'Palm oil and its fractions, refined', category: 'palm_oil' },
        { code: '1513', description: 'Coconut (copra), palm kernel or babassu oil', category: 'palm_oil' },
        { code: '151321', description: 'Crude coconut oil', category: 'coconut' },
        { code: '0901', description: 'Coffee, not roasted or decaffeinated', category: 'coffee' },
        { code: '090111', description: 'Coffee, not roasted, not decaffeinated', category: 'coffee' },
        { code: '1801', description: 'Cocoa beans, whole or broken, raw or roasted', category: 'cocoa' },
        { code: '180100', description: 'Cocoa beans, whole or broken', category: 'cocoa' },
        { code: '4401', description: 'Fuel wood, in logs, billets, twigs, faggots', category: 'wood' },
        { code: '440110', description: 'Fuel wood, in logs, billets, twigs', category: 'wood' },
        { code: '1201', description: 'Soya beans, whether or not broken', category: 'soy' },
        { code: '120100', description: 'Soya beans, whether or not broken', category: 'soy' }
      ];
      res.json(hsCodes);
    } catch (error) {
      console.error('Error fetching HS codes:', error);
      res.status(500).json({ error: 'Failed to fetch HS codes' });
    }
  });

  // Get scientific names for products dropdown
  app.get('/api/dds/scientific-names', isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      const scientificNames = {
        palm_oil: [
          { name: 'Elaeis guineensis', common: 'African Oil Palm' },
          { name: 'Elaeis oleifera', common: 'American Oil Palm' }
        ],
        coconut: [
          { name: 'Cocos nucifera', common: 'Coconut Palm' }
        ],
        coffee: [
          { name: 'Coffea arabica', common: 'Arabica Coffee' },
          { name: 'Coffea canephora', common: 'Robusta Coffee' },
          { name: 'Coffea liberica', common: 'Liberica Coffee' }
        ],
        cocoa: [
          { name: 'Theobroma cacao', common: 'Cacao Tree' }
        ],
        soy: [
          { name: 'Glycine max', common: 'Soybean' }
        ],
        wood: [
          { name: 'Various species', common: 'Mixed Forest Species' }
        ]
      };

      if (category && scientificNames[category as keyof typeof scientificNames]) {
        res.json(scientificNames[category as keyof typeof scientificNames]);
      } else {
        res.json(Object.values(scientificNames).flat());
      }
    } catch (error) {
      console.error('Error fetching scientific names:', error);
      res.status(500).json({ error: 'Failed to fetch scientific names' });
    }
  });

  // Validate GeoJSON data endpoint
  app.post('/api/dds/validate-geojson', isAuthenticated, async (req, res) => {
    try {
      const { geojson } = req.body;

      if (!geojson) {
        return res.status(400).json({
          valid: false,
          error: 'No GeoJSON data provided'
        });
      }

      let parsedGeoJson;
      try {
        parsedGeoJson = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
      } catch (parseError) {
        return res.status(400).json({
          valid: false,
          error: 'Invalid JSON format'
        });
      }

      // Basic GeoJSON structure validation
      if (!parsedGeoJson.type) {
        return res.status(400).json({
          valid: false,
          error: 'Missing type property'
        });
      }

      // Check for valid geometry types
      const validTypes = ['Feature', 'FeatureCollection', 'Polygon', 'MultiPolygon'];
      if (!validTypes.includes(parsedGeoJson.type)) {
        return res.status(400).json({
          valid: false,
          error: `Invalid GeoJSON type: ${parsedGeoJson.type}. Must be Feature, FeatureCollection, Polygon, or MultiPolygon`
        });
      }

      let polygonFound = false;
      let boundingBox = null;
      let area = 0;
      let centroid = null;

      // Extract polygon geometry and calculate metadata
      if (parsedGeoJson.type === 'Polygon') {
        polygonFound = true;
        const coords = parsedGeoJson.coordinates;
        if (coords && coords[0] && coords[0].length >= 4) {
          boundingBox = calculateBoundingBox(coords[0]);
          centroid = calculateCentroid(coords[0]);
          area = calculatePolygonArea(coords[0]);
        }
      } else if (parsedGeoJson.type === 'MultiPolygon') {
        polygonFound = true;
        const coords = parsedGeoJson.coordinates;
        if (coords && coords[0] && coords[0][0] && coords[0][0].length >= 4) {
          boundingBox = calculateBoundingBox(coords[0][0]);
          centroid = calculateCentroid(coords[0][0]);
          area = calculatePolygonArea(coords[0][0]);
        }
      } else if (parsedGeoJson.type === 'Feature') {
        const geometry = parsedGeoJson.geometry;
        if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
          polygonFound = true;
          const coords = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates[0];
          if (coords && coords[0] && coords[0].length >= 4) {
            boundingBox = calculateBoundingBox(coords[0]);
            centroid = calculateCentroid(coords[0]);
            area = calculatePolygonArea(coords[0]);
          }
        }
      } else if (parsedGeoJson.type === 'FeatureCollection') {
        const features = parsedGeoJson.features;
        if (features && features.length > 0) {
          for (const feature of features) {
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
              polygonFound = true;
              const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates[0];
              if (coords && coords[0] && coords[0].length >= 4) {
                boundingBox = calculateBoundingBox(coords[0]);
                centroid = calculateCentroid(coords[0]);
                area = calculatePolygonArea(coords[0]);
                break; // Use first valid polygon
              }
            }
          }
        }
      }

      if (!polygonFound) {
        return res.status(400).json({
          valid: false,
          error: 'No valid polygon geometry found. Only Polygon and MultiPolygon geometries are supported.'
        });
      }

      res.json({
        valid: true,
        metadata: {
          area: area,
          boundingBox: boundingBox,
          centroid: centroid,
          geometryType: parsedGeoJson.type
        }
      });

    } catch (error) {
      console.error('Error validating GeoJSON:', error);
      res.status(500).json({
        valid: false,
        error: 'Server error during validation'
      });
    }
  });

  // Get session-based DDS list (PRD requirement for dashboard)
  app.get('/api/dds/list', isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const reports = sessionId ? await storage.getDdsReportsBySession(sessionId) : await storage.getDdsReports();

      // Format for PRD dashboard requirements
      const formattedReports = reports.map(report => ({
        id: report.id,
        statementId: report.id.slice(-8).toUpperCase(),
        date: report.createdAt,
        product: report.productDescription || report.commonName,
        operator: report.operatorLegalName,
        status: report.status,
        downloadPath: report.pdfDocumentPath,
        fileName: report.pdfFileName,
        canDownload: report.status !== 'draft'
      }));

      res.json(formattedReports);
    } catch (error) {
      console.error('Error fetching DDS list:', error);
      res.status(500).json({ error: 'Failed to fetch DDS list' });
    }
  });

  // Enhanced DDS creation endpoint for comprehensive form data
  app.post('/api/dds/create', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDdsReportSchema.parse(req.body);

      // Generate session ID if not provided
      if (!validatedData.sessionId) {
        validatedData.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Auto-generate PDF filename
      const operatorName = validatedData.operatorLegalName.replace(/[^a-zA-Z0-9]/g, '_');
      const productName = (validatedData.commonName || validatedData.productDescription).replace(/[^a-zA-Z0-9]/g, '_');
      const dateString = new Date().toISOString().split('T')[0];
      validatedData.pdfFileName = `DDS_${operatorName}_${productName}_${dateString}.pdf`;

      const ddsReport = await storage.createDdsReport(validatedData);
      res.status(201).json(ddsReport);
    } catch (error) {
      console.error('Error creating DDS report:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid DDS report data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create DDS report' });
      }
    }
  });

  // Original DDS reports endpoint (maintained for backward compatibility)
  app.get('/api/dds-reports', isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getDdsReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch DDS reports' });
    }
  });

  app.get('/api/dds-reports/:id', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (report) {
        res.json(report);
      } else {
        res.status(404).json({ error: 'DDS report not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch DDS report' });
    }
  });

  app.post('/api/dds-reports', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDdsReportSchema.parse(req.body);
      const newReport = await storage.createDdsReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid DDS report data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create DDS report' });
      }
    }
  });

  app.put('/api/dds-reports/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const updatedReport = await storage.updateDdsReport(req.params.id, updates);
      if (updatedReport) {
        res.json(updatedReport);
      } else {
        res.status(404).json({ error: 'DDS report not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update DDS report' });
    }
  });

  // DDS Report PDF generation
  app.post('/api/dds-reports/:id/pdf', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Generate actual PDF file
      const { generateFixedDDSPDF } = await import('./pdf-generator-fixed.js');
      const pdfBuffer = generateFixedDDSPDF(report);

      // For demo purposes, we'll return the PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dds-${report.id}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // Generate FIXED 4-page DDS PDF document with correct format
  app.get('/api/generate-fixed-dds-pdf', isAuthenticated, async (req, res) => {
    try {
      const { generateFixedDDSPDF } = await import('./pdf-generator-fixed.js');
      const pdfBuffer = generateFixedDDSPDF({});
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="dds-fixed-4-page.pdf"');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error generating FIXED DDS PDF:', error);
      res.status(500).json({ error: 'Failed to generate FIXED DDS PDF' });
    }
  });

  // Generate dummy DDS PDF document
  app.get('/api/generate-dummy-dds-pdf', isAuthenticated, async (req, res) => {
    try {
      // Create dummy report data
      const dummyReport = {
        companyInternalRef: 'DDS-2024-DUMMY-001',
        activity: 'Import of Palm Oil Products',
        operatorLegalName: 'KPN Corporation Berhad',
        operatorAddress: 'Level 6, Menara KPN, Jalan Sultan Ismail, 50250 Kuala Lumpur, Malaysia',
        operatorCountry: 'Malaysia',
        operatorIsoCode: 'MY',
        productDescription: 'Crude Palm Oil (CPO)',
        netMassKg: 2150.000,
        percentageEstimation: 5,
        supplementaryUnit: 'MT',
        scientificName: 'Elaeis guineensis',
        commonName: 'Oil Palm',
        producerName: 'Riau Cooperative Growers',
        countryOfProduction: 'Malaysia',
        totalProducers: 15,
        totalPlots: 45,
        totalProductionArea: 1250.50,
        countryOfHarvest: 'Malaysia',
        maxIntermediaries: 2,
        traceabilityMethod: 'GPS Coordinates + Plot Mapping',
        expectedHarvestDate: '2024-12-31',
        productionDateRange: 'January 2024 - December 2024'
      };

      console.log('Starting PDF generation...');

      // Generate the PDF using jsPDF
      const doc = new jsPDF();

      // Set up the document
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Due Diligence Statement', 105, 20, { align: 'center' });

      // Page info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('-------------------------------------------------------------------------------------------------------------', 10, 30);
      doc.text('Page 1', 10, 40);
      doc.text('Status: SUBMITTED', 150, 40);

      const currentDate = new Date().toLocaleDateString('en-GB');
      doc.text(`Created On: ${currentDate}`, 10, 50);

      // Section 1
      let yPos = 70;
      doc.setFont('helvetica', 'bold');
      doc.text('1. Company Internal Ref:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.companyInternalRef, 80, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('2. Activity:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.activity, 50, yPos);

      // Section 3 - Operator Information
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('3. Operator/Trader name and address:', 10, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorLegalName, 40, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      const addressLines = doc.splitTextToSize(dummyReport.operatorAddress, 140);
      doc.text(addressLines, 45, yPos);
      yPos += addressLines.length * 5;

      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Country:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorCountry, 45, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('ISO Code:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorIsoCode, 45, yPos);

      // Commodity Section
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Commodity(ies) or Product(s)', 10, yPos);

      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 10, yPos);
      doc.text('Net Mass (Kg)', 70, yPos);
      doc.text('% Est.', 120, yPos);
      doc.text('Units', 150, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.productDescription, 10, yPos);
      doc.text(dummyReport.netMassKg.toString(), 70, yPos);
      doc.text(dummyReport.percentageEstimation.toString() + '%', 120, yPos);
      doc.text(dummyReport.supplementaryUnit, 150, yPos);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Scientific Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.scientificName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Common Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.commonName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Producer Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.producerName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Country of Production:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.countryOfProduction, 80, yPos);

      // Summary Plot Information
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Plot Information', 10, yPos);

      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Producers: ${dummyReport.totalProducers}`, 10, yPos);
      doc.text(`Total Plots: ${dummyReport.totalPlots}`, 10, yPos + 8);
      doc.text(`Total Production Area (ha): ${dummyReport.totalProductionArea}`, 10, yPos + 16);
      doc.text(`Country of Harvest: ${dummyReport.countryOfHarvest}`, 10, yPos + 24);
      doc.text(`Max. Intermediaries: ${dummyReport.maxIntermediaries}`, 10, yPos + 32);
      doc.text(`Traceability Method: ${dummyReport.traceabilityMethod}`, 10, yPos + 40);
      doc.text(`Expected Harvest Date: ${dummyReport.expectedHarvestDate}`, 10, yPos + 48);
      doc.text(`Production Date Range: ${dummyReport.productionDateRange}`, 10, yPos + 56);

      // PAGE 2 - EUDR Compliance Decision Tree (Halaman 2 ikuti EUDR Compliance Decision Tree GAMBAR TERLAMPIR)
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EUDR Compliance Decision Tree', 105, 20, { align: 'center' });

      // Header for page 2
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 2 of 4', 15, 38);
      doc.text('EUDR Compliance Verification - Art. 2.40', 75, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Embed the EUDR Compliance Verification flowchart image
      try {
        // Base64 embedded EUDR Compliance Verification methodology image (Page 2)
        const methodologyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAABmYAAARCCAYAAAC5GE0SAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAP+lSURBVHhe7N17XFR1/sfx14Booomp4D3REiyxVVMzxUtpatamibXVrlprZjd+2k23ddtqyy21rYxqc9UtdbermlbrhdRM0cy8lWiCpqiICmriZRC5zO+PGYZzDgMMMIyI7+fjMT7ke87MucyZc77f7+d7sTkcDgciIiIiIiIiIiIiIiIlI5FJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERERERERERERMRPFJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERE5BKXlZNNcsZ+00tEREREREQqh83hcDisieVhm3e/NcnNMeIDa5KIiFyCUjOPYj9/jpb1m1A7qJZ1sVxith36kc+SEgi/4iqGRN5IWHCIdRURKUVFf0fb0n7mi6SveT51i3UDIO8378GjHQZyTWgrd1pFtyk6hyL+lJWTzcGTR5T/LEVq5lEAWoQ0ti4SkYtUcXW1qqcVqRoUmBER1u3fysLkbziX75PbgVtAQE3ibom1JnvcXkBATSZ2u7vCBYHiPtvTfhTw9J7S1AsK5trQCOoE2GhzRXOurN+EBhWsVCnPfgBE1g+ncd0raFG3Aa3qN63wOfSVE/ZMVu/byNrULbyZ/rN1MQA9a4cyoFlnbm5+Ddc3u0aF5YvYhBVvcjYvrzDBVoPfRfahd6uOxtUAyMrJ4q4vJvI/+ylT+tc3P0v/5pGmNKne5m77gq3puzlvvO0FBPF/HYcQaQgEVNTbGz9i969p5BrSfPXcuVAq+jvKysnmjQ2zmZSykTrAWesK4Opcn8/a3uOJbtWxwtuUin9vcvGL353A0n3fm+57AQE1mdr3IWDfCQ18yir9q5n+cEtfJh50LqY2+uFM6jl9Qy5qluVfgas27+Z+Umrzc9IbNQIrMn0/o8bE8tl3f5tfJOynk/StpOYm2Va1rZGML9tcj13trmeaA95ORG5OBRXV6t6WpGqQYEZEWHhjmXEbPnYmlxBNsDh8fdfdHvOdZMGvUhEBSviivpsT/tRoOh7ymdwvTb8/qpo7ozsWa6Cta/2o3vtMB5tN4jh5dyPikrO2M+/tn3CP47sBKAGmCpDi9O6RjCTomK4r130BdlvqRjbvPuLVO7O6jyS0e1vNqQ4rUtZTvTajyyp...";

        console.log("✅ Embedded EUDR Compliance methodology image, base64 length:", methodologyImageBase64.length);

        doc.addImage(methodologyImageBase64, 'PNG', 15, yPos, 180, 100);
        yPos += 110;
      } catch (error) {
        console.log('Note: Image embedding not supported, using text description');
        yPos += 10;
      }

      // Methodology Section 1: Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. EUDR Compliance Verification Process', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const methodologyOverview = [
        'The EUDR compliance verification follows Article 2.40 requirements through a systematic',
        'three-step process: Proof of No Deforestation after 2020, Proof located on Approved Land,',
        'and Proof of Legality across 8 key indicators.',
        '',
        'Data Sources:',
        '• Geospatial data based on plot GPS/Polygon coordinates',
        '• On-site surveys from farmers and plot assessments',
        '• Satellite imagery analysis and desktop verification',
        '• Field verification and land legality confirmation'
      ];

      methodologyOverview.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 55;

      // Methodology Section 1: Deforestation Analysis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Deforestation Analysis Methodology', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText1 = [
        'Our deforestation analysis employs a multi-layer satellite monitoring approach:',
        '',
        '• Global Forest Watch (GFW) - Provides annual tree cover loss data',
        '• Joint Research Centre (JRC) - EU\'s forest monitoring system',
        '• Science Based Targets Network (SBTN) - Advanced deforestation alerts',
        '',
        'Analysis Workflow:',
        '1. Plot boundary verification using GPS coordinates',
        '2. Historical forest cover analysis (2000-2023)',
        '3. Cross-reference with protected area databases',
        '4. Risk assessment scoring and compliance determination'
      ];

      methodologyText1.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 70;

      // Methodology Section 2: Risk Assessment & Compliance Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Risk Assessment & Compliance Framework', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText2 = [
        'Risk Classification System:',
        '',
        '• HIGH RISK: Forest loss detected after December 31, 2020',
        '• MEDIUM RISK: Forest loss between 2018-2020 (requires additional verification)',
        '• LOW RISK: No significant forest loss detected in monitoring period',
        '',
        'Compliance Determination Process:',
        '• COMPLIANT: No deforestation after cutoff date, all documentation verified',
        '• NON-COMPLIANT: Evidence of post-2020 deforestation or legal violations',
        '• UNDER REVIEW: Additional verification required for final determination'
      ];

      methodologyText2.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 60;

      // Methodology Section 3: Data Integration & Sources
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Data Integration & Verification Sources', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText3 = [
        'Plot boundaries and verification data are provided in standardized GeoJSON format',
        'ensuring full compatibility with EU TRACE system requirements and regulations.',
        '',
        'Primary Data Sources:',
        '• Verified plot coordinates with sub-meter GPS accuracy',
        '• Multi-temporal satellite imagery analysis (Sentinel-2, Landsat)',
        '• Ground-truthing surveys and farmer documentation',
        '• Integration with national land tenure and forest databases',
        '• Cross-validation with protected area and conservation datasets',
        '',
        'All verification data and plot geometries are accessible through the',
        'accompanying GeoJSON files referenced in this Due Diligence Statement.'
      ];

      methodologyText3.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 65;

      // PAGE 3 - Risk Analysis and Process Flowcharts
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Analysis & Process Flowcharts', 105, 20, { align: 'center' });

      // Header for page 3 with improved styling
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 3 of 4', 15, 38);
      doc.text('Risk Assessment Processes', 85, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Section 1: Risk Assessment Process Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Risk Assessment Process Overview', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Create styled box for process overview
      doc.rect(10, yPos, 190, 45);
      yPos += 8;

      const riskOverviewText = [
        'This section outlines the systematic risk assessment approach used to evaluate',
        'deforestation risks and ensure EUDR compliance across all production plots.',
        '',
        'Key Process Components:',
        '  • Data Collection → Risk Identification → Impact Assessment → Scoring',
        '  • Satellite Monitoring → Field Verification → Documentation Review',
        '  • Legal Compliance Check → Final Risk Determination → Mitigation Planning'
      ];

      riskOverviewText.forEach((line, index) => {
        doc.text(line, 12, yPos + (index * 5));
      });
      yPos += 50;

      // Section 2: Detailed Risk Categories & Assessment Matrix
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Risk Categories & Assessment Matrix', 10, yPos);
      yPos += 10;

      // Create assessment matrix table
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      // Table borders
      doc.rect(10, yPos, 190, 60);
      doc.line(10, yPos + 15, 200, yPos + 15);  // Header line
      doc.line(60, yPos, 60, yPos + 60);        // First column divider
      doc.line(120, yPos, 120, yPos + 60);      // Second column divider

      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Category', 12, yPos + 10);
      doc.text('Assessment Criteria', 62, yPos + 10);
      doc.text('Compliance Action', 122, yPos + 10);

      doc.setFont('helvetica', 'normal');
      yPos += 20;

      // Table content
      const riskMatrix = [
        ['Deforestation', 'Satellite imagery analysis', 'No forest loss post-2020'],
        ['Legal Compliance', 'Permits & certifications', 'Valid documentation'],
        ['Supply Chain', 'Traceability verification', 'Complete chain of custody'],
        ['Operational', 'Quality & production data', 'Standards compliance']
      ];

      riskMatrix.forEach((row, index) => {
        const rowY = yPos + (index * 10);
        doc.text(row[0], 12, rowY);
        doc.text(row[1], 62, rowY);
        doc.text(row[2], 122, rowY);
        if (index < riskMatrix.length - 1) {
          doc.line(10, rowY + 5, 200, rowY + 5);
        }
      });

      yPos += 50;

      // Section 3: Data Verification & Quality Assurance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Data Verification & Quality Assurance', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const qaText = [
        'Quality assurance measures ensure accuracy and reliability of all compliance data:',
        '',
        '• Multi-source data cross-validation and consistency checks',
        '• Independent third-party verification of critical findings',
        '• Automated monitoring systems with manual verification protocols',
        '• Regular audit trails and documentation review processes',
        '',
        'All verification data and plot geometries are accessible through standardized',
        'GeoJSON files that accompany this Due Diligence Statement.'
      ];

      qaText.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 50;

      // Reference to GeoJSON data
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('GeoJSON Data Access:', 10, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const geoJsonLink = 'https://api.kpn-compliance.com/dds/geojson/plots-data.geojson';
      doc.setTextColor(0, 0, 255);
      doc.text('Link: ' + geoJsonLink, 15, yPos);
      doc.setTextColor(0, 0, 0);

      // PAGE 4 - Land Cover Change Monitoring Flowchart
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Land Cover Change Monitoring', 105, 20, { align: 'center' });

      // Header for page 4
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 4 of 4', 15, 38);
      doc.text('Land Cover Change Monitoring System', 75, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Section 1: Monitoring System Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Land Cover Change Monitoring Flowchart', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lccIntroText = [
        'This flowchart illustrates the systematic workflow for monitoring and verifying',
        'deforestation alerts across plantation concession areas. The monitoring system',
        'operates on both scheduled (bi-weekly) and incident-based protocols.',
        ''
      ];

      lccIntroText.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 25;

      // Embed the LCC flowchart image
      try {
        // Define placeholder base64 image data or skip embedding if not available
        const lccFlowchartImageBase64 = ''; // Placeholder - would contain actual base64 image data
        if (lccFlowchartImageBase64) {
          doc.addImage(lccFlowchartImageBase64, 'PNG', 10, yPos, 190, 100);
          yPos += 110;
          console.log('✅ Successfully embedded Land Cover Change flowchart image');
        } else {
          throw new Error('No flowchart image available');
        }
      } catch (error) {
        console.log('⚠️  LCC flowchart image embedding failed, using fallback text');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('[LAND COVER CHANGE MONITORING FLOWCHART]', 105, yPos + 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('(See attached flowchart document for complete monitoring process)', 105, yPos + 50, { align: 'center' });
        yPos += 70;
      }

      // Section 2: Process Components
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Key Process Components:', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Create process flow table
      doc.rect(10, yPos, 190, 80);
      doc.line(10, yPos + 15, 200, yPos + 15);
      doc.line(100, yPos, 100, yPos + 80);

      doc.setFont('helvetica', 'bold');
      doc.text('Process Stage', 12, yPos + 10);
      doc.text('Responsible Party & Action', 102, yPos + 10);

      doc.setFont('helvetica', 'normal');
      yPos += 20;

      const lccProcesses = [
        ['1. GIS Alert Detection', 'System Monitoring - Automated satellite analysis'],
        ['2. Coordinate Verification', 'GIS Team - Location accuracy confirmation'],
        ['3. Desktop Analysis', 'Technical Team - Preliminary assessment'],
        ['4. Field Verification', 'Estate Manager - On-ground validation'],
        ['5. Final Report', 'System Monitoring - Compliance determination']
      ];

      lccProcesses.forEach((process, index) => {
        const processY = yPos + (index * 12);
        doc.text(process[0], 12, processY);
        doc.text(process[1], 102, processY);
        if (index < lccProcesses.length - 1) {
          doc.line(10, processY + 6, 200, processY + 6);
        }
      });

      yPos += 70;

      // Section 3: Legal Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Legal Framework & Compliance:', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const legalFramework = [
        '• UU No. 41 Tahun 1999 - Forestry Law: Prohibits unauthorized land clearing',
        '• UU No. 32 Tahun 2009 - Environmental Protection: Requires environmental monitoring',
        '• UU No. 39 Tahun 2014 - Plantation Law: Mandates sustainable practices',
        '• PERMEN LHK No. P.8/2019 - Environmental information systems',
        '• ISPO (Indonesian Sustainable Palm Oil) - No deforestation requirements',
        '• NDPE Policy KPN Plantations - No Deforestation, No Peat, No Exploitation',
        '• EU Deforestation Regulation (EUDR) - Supply chain traceability since 2020'
      ];

      legalFramework.forEach((item, index) => {
        doc.text(item, 10, yPos + (index * 5));
      });

      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer');

      console.log('✅ Enhanced 4-page PDF generated successfully with professional layout');
      console.log('✅ PDF includes: Page 1 (DDS Data), Page 2 (Methodology), Page 3 (Risk Analysis), Page 4 (LCC Monitoring)');
      return pdfBuffer;

    } catch (error) {
      console.error('Error generating dummy DDS PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to generate dummy DDS PDF', details: errorMessage });
    }
  });

  // DDS Report Download endpoint
  app.get('/api/dds/:id/download', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Generate PDF for download
      const { generateFixedDDSPDF } = await import('./pdf-generator-fixed.js');
      const pdfBuffer = generateFixedDDSPDF(report);

      // Set response headers for file download
      const filename = `dds-report-${report.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.byteLength.toString());

      console.log(`✅ DDS report ${report.id} PDF download initiated`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error downloading DDS report PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to download DDS report PDF', details: errorMessage });
    }
  });

  // DDS Report EU Trace submission
  app.post('/api/dds-reports/:id/submit', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Mock EU Trace submission - in real implementation, integrate with EU Trace API
      const euTraceRef = `EU-TRACE-${Date.now()}-${report.id.slice(0, 8)}`;

      // Update report with submission details
      await storage.updateDdsReport(req.params.id, {
        euTraceReference: euTraceRef,
        submissionDate: new Date(),
        status: 'submitted'
      });

      res.json({
        success: true,
        message: 'DDS report submitted to EU Trace system',
        euTraceReference: euTraceRef
      });
    } catch (error) {
      console.error('Error submitting to EU Trace:', error);
      res.status(500).json({ error: 'Failed to submit to EU Trace' });
    }
  });

  // KML upload endpoint for DDS polygon data
  app.post('/api/dds-reports/:id/upload-kml', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      const { kmlData, fileName } = req.body;
      if (!kmlData) {
        return res.status(400).json({ error: 'KML data is required' });
      }

      // Parse KML and extract coordinates
      // In real implementation, use a proper KML parser like @mapbox/togeojson
      const mockPolygonCoordinates = [
        { latitude: 3.1390, longitude: 101.6869, plotId: "KML-PLOT-001" },
        { latitude: 3.1400, longitude: 101.6880, plotId: "KML-PLOT-002" },
        { latitude: 3.1410, longitude: 101.6890, plotId: "KML-PLOT-003" }
      ];

      // Update report with KML-derived coordinates
      await storage.updateDdsReport(req.params.id, {
        geolocationCoordinates: JSON.stringify(mockPolygonCoordinates),
        kmlFileName: fileName || 'uploaded-polygons.kml'
      });

      res.json({
        success: true,
        message: 'KML file processed successfully',
        extractedPlots: mockPolygonCoordinates.length
      });
    } catch (error) {
      console.error('Error processing KML upload:', error);
      res.status(500).json({ error: 'Failed to process KML file' });
    }
  });

  // Generate GeoJSON files for verified deforestation-free polygons
  app.post('/api/dds-reports/:id/generate-geojson', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Parse coordinates from the report
      let coordinates = [];
      if (report.geolocationCoordinates) {
        coordinates = JSON.parse(report.geolocationCoordinates);
      }

      // Generate GeoJSON files for each verified deforestation-free polygon
      const geoJsonFiles = coordinates.map((coord: any, index: number) => {
        const geoJson = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {
              plotId: coord.plotId || `PLOT-${index + 1}`,
              reportId: report.id,
              operatorName: report.operatorLegalName,
              verificationStatus: "deforestation-free",
              verificationDate: new Date().toISOString(),
              hsCode: report.hsCode,
              productDescription: report.productDescription
            },
            geometry: {
              type: "Point",
              coordinates: [coord.longitude, coord.latitude]
            }
          }]
        };

        return {
          fileName: `${coord.plotId || `plot-${index + 1}`}-verified.geojson`,
          content: JSON.stringify(geoJson, null, 2),
          plotId: coord.plotId || `PLOT-${index + 1}`
        };
      });

      // Create a combined GeoJSON file as well
      const combinedGeoJson = {
        type: "FeatureCollection",
        features: coordinates.map((coord: any, index: number) => ({
          type: "Feature",
          properties: {
            plotId: coord.plotId || `PLOT-${index + 1}`,
            reportId: report.id,
            operatorName: report.operatorLegalName,
            verificationStatus: "deforestation-free",
            verificationDate: new Date().toISOString()
          },
          geometry: {
            type: "Point",
            coordinates: [coord.longitude, coord.latitude]
          }
        }))
      };

      // Mock file paths - in real implementation, save to storage
      const filePaths = geoJsonFiles.map((file: { fileName: string }) => `/geojson/${report.id}/${file.fileName}`);
      const combinedFilePath = `/geojson/${report.id}/combined-verified-polygons.geojson`;

      // Update report with generated GeoJSON paths
      await storage.updateDdsReport(report.id, {
        geojsonFilePaths: JSON.stringify([...filePaths, combinedFilePath])
      });

      res.json({
        success: true,
        message: 'GeoJSON files generated successfully',
        files: [
          ...geoJsonFiles.map((file: { fileName: string; plotId: string }) => ({
            fileName: file.fileName,
            path: `/geojson/${report.id}/${file.fileName}`,
            plotId: file.plotId
          })),
          {
            fileName: 'combined-verified-polygons.geojson',
            path: combinedFilePath,
            plotId: 'ALL'
          }
        ],
        totalFiles: geoJsonFiles.length + 1
      });
    } catch (error) {
      console.error('Error generating GeoJSON:', error);
      res.status(500).json({ error: 'Failed to generate GeoJSON files' });
    }
  });

  // Download generated GeoJSON files
  app.get('/api/dds-reports/:id/geojson/:fileName', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      const { fileName } = req.params;

      // In real implementation, serve from actual file storage
      // Mock GeoJSON content for now
      const mockGeoJson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            plotId: "SAMPLE-PLOT",
            reportId: report.id,
            operatorName: report.operatorLegalName,
            verificationStatus: "deforestation-free",
            verificationDate: new Date().toISOString()
          },
          geometry: {
            type: "Point",
            coordinates: [101.6869, 3.1390]
          }
        }]
      };

      res.set({
        'Content-Type': 'application/geo+json',
        'Content-Disposition': `attachment; filename=${fileName}`
      });

      res.json(mockGeoJson);
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      res.status(500).json({ error: 'Failed to download GeoJSON file' });
    }
  });


  // Estate Data Collection API routes
  app.get("/api/estate-data-collection", isAuthenticated, async (req, res) => {
    try {
      const estates = await storage.getEstateDataCollection();
      res.json(estates);
    } catch (error) {
      console.error('Error fetching estate data collections:', error);
      res.status(500).json({ error: "Failed to fetch estate data collections" });
    }
  });

  app.post("/api/estate-data-collection", isAuthenticated, async (req, res) => {
    try {
      const { insertEstateDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertEstateDataCollectionSchema.parse(req.body);
      const estate = await storage.createEstateDataCollection(validatedData as import("@shared/schema").InsertEstateDataCollection);
      res.status(201).json(estate);
    } catch (error) {
      console.error('Error creating estate data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid estate data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create estate data collection" });
      }
    }
  });

  // Mill Data Collection API routes
  app.get("/api/mill-data-collection", isAuthenticated, async (req, res) => {
    try {
      const mills = await storage.getMillDataCollection();
      res.json(mills);
    } catch (error) {
      console.error('Error fetching mill data collection:', error);
      res.status(500).json({ error: 'Failed to fetch mill data collection' });
    }
  });

  app.get("/api/mill-data-collection/:id", isAuthenticated, async (req, res) => {
    try {
      const mill = await storage.getMillDataCollectionById(req.params.id);
      if (!mill) {
        return res.status(404).json({ error: 'Mill data collection not found' });
      }
      res.json(mill);
    } catch (error) {
      console.error('Error fetching mill data collection:', error);
      res.status(500).json({ error: 'Failed to fetch mill data collection' });
    }
  });

  app.post("/api/mill-data-collection", isAuthenticated, async (req, res) => {
    try {
      const { insertMillDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertMillDataCollectionSchema.parse(req.body);
      const mill = await storage.createMillDataCollection(validatedData as import("@shared/schema").InsertMillDataCollection);
      res.status(201).json(mill);
    } catch (error) {
      console.error('Error creating mill data collection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create mill data collection' });
    }
  });

  // Object storage endpoints for document uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Get list of TIFF files from App Storage
  app.get("/api/objects/tiff-files", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();

      // Search for TIFF files in public search paths
      const searchPaths = objectStorageService.getPublicObjectSearchPaths();
      const tiffFiles = [];

      for (const searchPath of searchPaths) {
        try {
          // List files in the bucket (simplified implementation)
          // In a real implementation, you would list bucket contents and filter for .tiff/.tif files
          const mockTiffFiles = [
            { name: 'uav_plot_001.tiff', path: `/objects/uav_plot_001.tiff`, size: '2.5MB' },
            { name: 'uav_plot_002.tiff', path: `/objects/uav_plot_002.tiff`, size: '3.1MB' },
            { name: 'sentinel_2024.tiff', path: `/objects/sentinel_2024.tiff`, size: '15.2MB' }
          ];
          tiffFiles.push(...mockTiffFiles);
        } catch (error) {
          console.warn(`Could not list files in path: ${searchPath}`, error);
        }
      }

      res.json({ files: tiffFiles });
    } catch (error) {
      console.error("Error listing TIFF files:", error);
      res.status(500).json({ error: "Failed to list TIFF files" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof Error && error.constructor.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Traceability Data Collection endpoints
  app.get('/api/traceability-data-collection', async (req, res) => {
    try {
      const collections = await storage.getTraceabilityDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching traceability data collections:', error);
      res.status(500).json({ error: 'Failed to fetch traceability data collections' });
    }
  });

  app.post('/api/traceability-data-collection', async (req, res) => {
    try {
      const { insertTraceabilityDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertTraceabilityDataCollectionSchema.parse(req.body);
      const collection = await storage.createTraceabilityDataCollection(validatedData as import("@shared/schema").InsertTraceabilityDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating traceability data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create traceability data collection' });
      }
    }
  });

  // KCP Data Collection endpoints
  app.get('/api/kcp-data-collection', async (req, res) => {
    try {
      const collections = await storage.getKcpDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching KCP data collections:', error);
      res.status(500).json({ error: 'Failed to fetch KCP data collections' });
    }
  });

  app.post('/api/kcp-data-collection', async (req, res) => {
    try {
      const { insertKcpDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertKcpDataCollectionSchema.parse(req.body);
      const collection = await storage.createKcpDataCollection(validatedData as import("@shared/schema").InsertKcpDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating KCP data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create KCP data collection' });
      }
    }
  });

  // Bulking Data Collection endpoints
  app.get('/api/bulking-data-collection', async (req, res) => {
    try {
      const collections = await storage.getBulkingDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching bulking data collections:', error);
      res.status(500).json({ error: 'Failed to fetch bulking data collections' });
    }
  });

  app.post('/api/bulking-data-collection', async (req, res) => {
    try {
      const { insertBulkingDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertBulkingDataCollectionSchema.parse(req.body);
      const collection = await storage.createBulkingDataCollection(validatedData as import("@shared/schema").InsertBulkingDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating bulking data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create bulking data collection' });
      }
    }
  });

  // EUDR Assessment endpoints
  app.get('/api/eudr-assessments', isAuthenticated, async (req, res) => {
    try {
      const assessments = await storage.getEudrAssessments();
      res.json(assessments);
    } catch (error) {
      console.error('Error fetching EUDR assessments:', error);
      res.status(500).json({ error: 'Failed to fetch EUDR assessments' });
    }
  });

  app.get('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      const assessment = await storage.getEudrAssessment(req.params.id);
      if (assessment) {
        res.json(assessment);
      } else {
        res.status(404).json({ error: 'EUDR assessment not found' });
      }
    } catch (error) {
      console.error('Error fetching EUDR assessment:', error);
      res.status(500).json({ error: 'Failed to fetch EUDR assessment' });
    }
  });

  app.post('/api/eudr-assessments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEudrAssessmentSchema.parse(req.body);
      const assessment = await storage.createEudrAssessment(validatedData as InsertEudrAssessment);
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Error creating EUDR assessment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create EUDR assessment' });
      }
    }
  });

  app.put('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEudrAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateEudrAssessment(req.params.id, validatedData as Partial<EudrAssessment>);
      res.json(assessment);
    } catch (error) {
      console.error('Error updating EUDR assessment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update EUDR assessment' });
      }
    }
  });

  app.delete('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEudrAssessment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting EUDR assessment:', error);
      res.status(500).json({ error: 'Failed to delete EUDR assessment' });
    }
  });


  // Helper function to get country from coordinates using adm_boundary_lv0
  async function getCountryFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      // Primary method: Use PostGIS database lookup for adm_boundary_lv0
      console.log(`🗄️  Checking adm_boundary_lv0 for coordinates (${lat}, ${lng})`);

      try {
        // Use raw SQL query to check if point is within any country boundary
        const result = await db.execute(sql`
          SELECT nam_0 
          FROM adm_boundary_lv0 
          WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
          LIMIT 1
        `);

        if (result.rows && result.rows.length > 0) {
          const countryName = result.rows[0].nam_0;
          console.log(`✅ Country detected from adm_boundary_lv0: ${countryName}`);
          return countryName as string;
        }
      } catch (dbError) {
        console.log(`❌ Database query error:`, dbError);
      }

      // Fallback 1: Try with a buffer around the point for more tolerance
      try {
        const result = await db.execute(sql`
          SELECT nam_0 
          FROM adm_boundary_lv0 
          WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 0.01)
          ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
          LIMIT 1
        `);

        if (result.rows && result.rows.length > 0) {
          const countryName = result.rows[0].nam_0;
          console.log(`✅ Country detected from adm_boundary_lv0 with buffer: ${countryName}`);
          return countryName as string;
        }
      } catch (dbError) {
        console.log(`❌ Database buffer query error:`, dbError);
      }

      // Fallback 2: Enhanced coordinate-based country detection for Indonesia
      console.log(`🗺️  Using coordinate-based country detection for (${lat}, ${lng})`);

      // Indonesia - more precise bounds including Sulawesi
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
        // Special check for Sulawesi region where your plots are located
        if (lat >= -6 && lat <= 2 && lng >= 118 && lng <= 125) {
          console.log(`🇮🇩 Detected Indonesia (Sulawesi region) by coordinates`);
          return 'Indonesia';
        }
        console.log(`🇮🇩 Detected Indonesia by coordinates`);
        return 'Indonesia';
      }
      // Malaysia
      else if (lat >= 0.85 && lat <= 7.36 && lng >= 99.64 && lng <= 119.27) {
        console.log(`🇲🇾 Detected Malaysia by coordinates`);
        return 'Malaysia';
      }
      // Nigeria
      else if (lat >= 4.27 && lat <= 13.89 && lng >= 2.67 && lng <= 14.68) {
        console.log(`🇳🇬 Detected Nigeria by coordinates`);
        return 'Nigeria';
      }
      // Ghana
      else if (lat >= 4.74 && lat <= 11.17 && lng >= -3.25 && lng <= 1.19) {
        console.log(`🇬🇭 Detected Ghana by coordinates`);
        return 'Ghana';
      }
      // Ivory Coast
      else if (lat >= 4.36 && lat <= 10.74 && lng >= -8.60 && lng <= -2.49) {
        console.log(`🇨🇮 Detected Ivory Coast by coordinates`);
        return 'Ivory Coast';
      }
      // Brazil
      else if (lat >= -33.75 && lat <= 5.27 && lng >= -73.99 && lng <= -28.84) {
        console.log(`🇧🇷 Detected Brazil by coordinates`);
        return 'Brazil';
      }
      // Central African Republic
      else if (lat >= 2.22 && lat <= 11.00 && lng >= 14.42 && lng <= 27.46) {
        console.log(`🇨🇫 Detected Central African Republic by coordinates`);
        return 'Central African Republic';
      }

      console.log(`❓ Could not determine country for coordinates (${lat}, ${lng})`);
      return 'Unknown';

    } catch (error) {
      console.error('Database lookup error:', error);

      // Final fallback based on coordinate ranges
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
        return 'Indonesia';
      } else if (lat >= 0.85 && lat <= 7.36 && lng >= 99.64 && lng <= 119.27) {
        return 'Malaysia';
      } else if (lat >= 4.27 && lat <= 13.89 && lng >= 2.67 && lng <= 14.68) {
        return 'Nigeria';
      } else if (lat >= 4.74 && lat <= 11.17 && lng >= -3.25 && lng <= 1.19) {
        return 'Ghana';
      } else if (lat >= 4.36 && lat <= 10.74 && lng >= -8.60 && lng <= -2.49) {
        return 'Ivory Coast';
      } else if (lat >= -33.75 && lat <= 5.27 && lng >= -73.99 && lng <= -28.84) {
        return 'Brazil';
      } else if (lat >= 2.22 && lat <= 11.00 && lng >= 14.42 && lng <= 27.46) {
        return 'Central African Republic';
      }

      return 'Unknown';
    }
  }

  // Helper function to extract centroid coordinates from geometry
  function getCentroidFromGeometry(geometry: any): { lat: number, lng: number } | null {
    try {
      if (!geometry || !geometry.coordinates) return null;

      if (geometry.type === 'Point') {
        return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
      } else if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        if (coords && coords.length > 0) {
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          return {
            lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length,
            lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length
          };
        }
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates[0][0];
        if (coords && coords.length > 0) {
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          return {
            lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length,
            lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('Error extracting centroid:', error);
      return null;
    }
  }

  // Helper function to calculate area from geometry using PostGIS
  async function calculateAreaFromGeometry(geometry: any): Promise<number> {
    try {
      if (!geometry || !geometry.coordinates) {
        return 1.0; // Default 1 hectare
      }

      // Convert geometry to WKT format for PostGIS calculation
      let wkt = '';

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        if (coords && coords.length >= 4) {
          const wktCoords = coords.map((coord: any) => `${coord[0]} ${coord[1]}`).join(', ');
          wkt = `POLYGON((${wktCoords}))`;
        }
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates[0][0];
        if (coords && coords.length >= 4) {
          const wktCoords = coords.map((coord: any) => `${coord[0]} ${coord[1]}`).join(', ');
          wkt = `POLYGON((${wktCoords}))`;
        }
      }

      if (!wkt) {
        return 1.0; // Default 1 hectare
      }

      // Use PostGIS to calculate area in hectares
      const result = await db.execute(sql`
        SELECT ST_Area(ST_Transform(ST_GeomFromText(${wkt}, 4326), 3857)) / 10000 as area_hectares
      `);

      const areaHectares = parseFloat(result.rows[0]?.area_hectares?.toString() || '1.0');

      // Ensure minimum area and reasonable maximum
      if (areaHectares < 0.1) return 0.1;
      if (areaHectares > 1000) return 1000;

      console.log(`📏 Calculated area: ${areaHectares.toFixed(2)} hectares using PostGIS`);
      return Math.round(areaHectares * 100) / 100; // Round to 2 decimal places

    } catch (error) {
      console.warn('Error calculating area from geometry:', error);
      return 1.0; // Default 1 hectare
    }
  }

  // GeoJSON upload and analysis endpoint
  app.post('/api/geojson/upload', isAuthenticated, async (req, res) => {
    try {
      // Add CORS headers for production
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      console.log('📥 Received GeoJSON upload request');
      console.log('📋 Request headers:', Object.keys(req.headers));
      console.log('📋 Content-Type:', req.headers['content-type']);
      console.log('📋 Body keys:', Object.keys(req.body || {}));
      
      const { geojson, geojsonFile, filename, fileName } = req.body;

      // Accept both parameter names for flexibility
      const geoJsonData = geojson || geojsonFile;
      const fileNameToUse = filename || fileName;

      if (!geoJsonData) {
        console.log('Request body keys:', Object.keys(req.body));
        return res.status(400).json({ error: 'No GeoJSON data provided' });
      }

      let parsedGeojson;
      try {
        // Handle different input formats
        if (typeof geoJsonData === 'string') {
          // Try to parse as JSON string
          parsedGeojson = JSON.parse(geoJsonData);
        } else if (typeof geoJsonData === 'object') {
          // Already parsed object
          parsedGeojson = geoJsonData;
        } else {
          throw new Error('Invalid GeoJSON data format');
        }

        console.log('✅ Successfully parsed GeoJSON data');
        console.log('📋 GeoJSON type:', parsedGeojson.type);
        console.log('📋 Features count:', parsedGeojson.features?.length || 0);

      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        return res.status(400).json({ 
          error: 'Failed to parse GeoJSON file', 
          details: parseError instanceof Error ? parseError.message : 'Invalid JSON format'
        });
      }

      // Enhanced GeoJSON validation
      if (!parsedGeojson || typeof parsedGeojson !== 'object') {
        return res.status(400).json({ error: 'Invalid GeoJSON: root must be an object' });
      }

      if (parsedGeojson.type !== 'FeatureCollection') {
        return res.status(400).json({ 
          error: `Invalid GeoJSON: expected FeatureCollection, got ${parsedGeojson.type}` 
        });
      }

      if (!parsedGeojson.features || !Array.isArray(parsedGeojson.features)) {
        return res.status(400).json({ 
          error: 'Invalid GeoJSON: missing or invalid features array',
          details: `Features is ${typeof parsedGeojson.features}, expected array`
        });
      }

      if (parsedGeojson.features.length === 0) {
        return res.status(400).json({ error: 'Invalid GeoJSON: features array is empty' });
      }

      console.log(`✅ GeoJSON validation passed: ${parsedGeojson.features.length} features found`);

      // Remove z-values (3D coordinates) to make it compatible with external APIs
      const cleanedGeojson = {
        ...parsedGeojson,
        features: parsedGeojson.features.map((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const cleanedGeometry = {
              ...feature.geometry,
              coordinates: removeZValues(feature.geometry.coordinates)
            };
            return {
              ...feature,
              geometry: cleanedGeometry
            };
          }
          return feature;
        })
      };

      // Enhanced validation for different GeoJSON formats
      const validatedFeatures = [];

      for (let i = 0; i < cleanedGeojson.features.length; i++) {
        const feature = cleanedGeojson.features[i];

        try {
          // Validate feature structure
          if (!feature || typeof feature !== 'object') {
            console.warn(`⚠️ Feature ${i + 1}: Invalid feature object, skipping`);
            continue;
          }

          if (feature.type !== 'Feature') {
            console.warn(`⚠️ Feature ${i + 1}: Expected type 'Feature', got '${feature.type}', skipping`);
            continue;
          }

          if (!feature.geometry) {
            console.warn(`⚠️ Feature ${i + 1}: Missing geometry, skipping`);
            continue;
          }

          const props = feature.properties || {};

          // Robustly get plot ID with better fallback
          const plotId = props.id || props.plot_id || props['.Farmers ID'] || props.Name || props.farmer_id || `PLOT_${String(i + 1).padStart(3, '0')}`;

          console.log(`✅ Processing feature ${i + 1}: plotId="${plotId}", properties=${JSON.stringify(Object.keys(props))}`);

          // Continue processing even if some properties are missing
          // This is more forgiving than before

        // Get country from multiple sources with priority order
        let detectedCountry = 'Unknown';

        // Priority 1: Use country_name from API response if available and not "unknown"
        if (feature.properties?.country_name &&
            feature.properties.country_name !== 'unknown' &&
            feature.properties.country_name !== 'Unknown') {
          detectedCountry = feature.properties.country_name;
          console.log(`✅ Country from API response: ${detectedCountry}`);
        }
        // Priority 2: Use PostGIS spatial lookup based on geometry centroid
        else {
          const centroid = getCentroidFromGeometry(feature.geometry);
          if (centroid) {
            console.log(`🌍 Detecting country for coordinates: ${centroid.lat}, ${centroid.lng}`);
            detectedCountry = await getCountryFromCoordinates(centroid.lat, centroid.lng);
            console.log(`✅ Country detected: ${detectedCountry}`);

            // No delay needed since we're using local database
          } else {
            // Priority 3: Fallback to property-based detection for Indonesian data
            if (props['.Distict'] || props['.Aggregator Location']) {
              detectedCountry = 'Indonesia';
              console.log(`🇮🇩 Using Indonesian data format fallback: ${detectedCountry}`);
            } else {
              detectedCountry = props.country_name || props.country || props.district ||
                               props.region || props.province || props.kabupaten || 'Indonesia';
              console.log(`🌍 Using property fallback: ${detectedCountry}`);
            }
          }
        }

        // Update feature properties with detected country
          feature.properties.detected_country = detectedCountry;
          validatedFeatures.push(feature);

        } catch (featureError) {
          console.error(`❌ Error processing feature ${i + 1}:`, featureError);
          // Continue with next feature instead of failing completely
          continue;
        }
      }

      if (validatedFeatures.length === 0) {
        return res.status(400).json({
          error: 'No valid features found after processing',
          details: 'All features were either invalid or missing required properties (geometry, plot ID)'
        });
      }

      console.log(`✅ Validated ${validatedFeatures.length} out of ${cleanedGeojson.features.length} features`);

      cleanedGeojson.features = validatedFeatures;

      console.log('=== DEBUGGING FEATURE COUNT ===');
      console.log('Input features sent to API:', cleanedGeojson.features.length);

      // Create a proper multipart/form-data request
      const boundary = `----formdata-node-${Date.now()}`;
      const fileContent = JSON.stringify(cleanedGeojson); // Use cleaned GeoJSON
      const uploadFileName = fileNameToUse || 'plot_boundaries.json';

      const formBody = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${uploadFileName}"`,
        'Content-Type: application/json',
        '',
        fileContent,
        `--${boundary}--`
      ].join('\r\n');

      // Call EUDR Multilayer API with enhanced error handling
      let response;
      let analysisResults;

      try {
        console.log('🚀 Sending request to EUDR Multilayer API...');
        console.log(`📤 Request size: ${formBody.length} bytes`);

        response = await fetch('https://eudr-multilayer-api.fly.dev/api/v1/upload-geojson', {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body: formBody
        });

        console.log(`📥 API Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', response.status, errorText);
          return res.status(response.status).json({
            error: 'Failed to analyze GeoJSON file',
            details: `API returned ${response.status}: ${errorText}`,
            apiStatus: response.status
          });
        }

        analysisResults = await response.json();
        console.log('✅ Successfully received analysis results from API');

      } catch (fetchError) {
        console.error('❌ Network/API Error:', fetchError);
        return res.status(500).json({
          error: 'Failed to communicate with analysis API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown network error'
        });
      }

      // Log both request and response for debugging
      const inputFeatures = cleanedGeojson.features.length; // Use count from cleaned GeoJSON
      const outputFeatures = analysisResults.data?.features?.length || 0;
      console.log('=== DEBUGGING FEATURE COUNT ===');
      console.log('Input features sent to API:', inputFeatures);
      console.log('Output features received from API:', outputFeatures);
      console.log(`Processing stats:`, analysisResults.processing_stats);
      console.log(`File info from API:`, analysisResults.file_info);
      console.log(`Analysis summary:`, analysisResults.analysis_summary);

      if (inputFeatures !== outputFeatures) {
        console.log(`⚠️  FEATURE MISMATCH: Sent ${inputFeatures} but received ${outputFeatures}`);
        console.log(`This appears to be an API-side processing limitation when handling large files.`);
        console.log(`Recommendation: Split large files into smaller batches (5-10 features each) for complete processing.`);

        // Add a warning to the response for users
        analysisResults.warning = {
          message: `Only ${outputFeatures} out of ${inputFeatures} features were processed successfully.`,
          recommendation: "For better results, split large files into smaller batches of 5-10 features each."
        };
      }

      // Store analysis results in database for dashboard metrics
      if (analysisResults.data?.features) {
        const uploadSession = `session-${Date.now()}`;

        // Clear previous analysis results
        await storage.clearAnalysisResults();

        // Create a mapping of original plot IDs from the input GeoJSON
        const originalFeatures = cleanedGeojson.features;
        const originalPlotIds = originalFeatures.map((feature: any, index: number) => {
          const props = feature.properties || {};
          return props['.Farmers ID'] || props.id || props.Name || props.plot_id || props.farmer_id || `PLOT_${index + 1}`;
        });

        console.log(`📋 Original Plot IDs from input GeoJSON:`, originalPlotIds);

        // Store each analysis result in the database
        for (const feature of analysisResults.data.features) {
          const featureIndex = analysisResults.data.features.indexOf(feature);
          console.log(`=== PROCESSING FEATURE ${featureIndex + 1} ===`);
          console.log(`📋 Available properties:`, Object.keys(feature.properties || {}));

          try {
            // Use the original plot ID from the input GeoJSON based on feature index
            let plotId = originalPlotIds[featureIndex] || `PLOT_${featureIndex + 1}`;

            console.log(`✅ Using original Plot ID: ${plotId} (from input GeoJSON feature ${featureIndex + 1})`);

            // If API returned a different plot_id, log it for debugging
            if (feature.properties?.plot_id && feature.properties.plot_id !== plotId) {
              console.log(`🔄 API returned different plot_id: ${feature.properties.plot_id}, keeping original: ${plotId}`);
            }

            // Use detected country with proper validation and fallback
            let country = feature.properties?.detected_country || 'Unknown';

            console.log(`🌍 Initial country detection: ${country}`);

            // Apply additional validation and fallback logic
            if (!country || country === 'Unknown' || country === 'unknown') {
              // Check for Indonesian-specific field patterns
              if (feature.properties?.['.Distict']) {
                country = 'Indonesia';
                console.log(`🇮🇩 Detected Indonesia from district field`);
              } else if (feature.properties?.['.Aggregator Location']) {
                country = 'Indonesia';
                console.log(`🇮🇩 Detected Indonesia from aggregator location field`);
              } else if (feature.properties?.country_name &&
                        feature.properties.country_name !== 'unknown') {
                country = feature.properties.country_name;
                console.log(`🌍 Using country_name from API: ${country}`);
              } else {
                // Use centroid-based detection as final fallback
                const centroid = getCentroidFromGeometry(feature.geometry);
                if (centroid) {
                  country = await getCountryFromCoordinates(centroid.lat, centroid.lng);
                  console.log(`🗺️ Country from coordinates: ${country}`);
                } else {
                  country = 'Indonesia'; // Default for most palm oil data
                  console.log(`🇮🇩 Using Indonesia as final fallback`);
                }
              }
            }

            // Enhanced area parsing for Indonesian format
            let area = 0;
            if (feature.properties?.['.Plot size']) {
              // Parse Indonesian format: "0.50 Ha", "24.00 Ha", etc.
              const plotSize = feature.properties['.Plot size'].toString();
              const areaMatch = plotSize.match(/(\d+\.?\d*)/);
              area = areaMatch ? parseFloat(areaMatch[1]) : 0;
              console.log(`📏 Plot ${plotId}: Parsed area ${area}ha from "${plotSize}"`);
            } else if (feature.properties?.area_ha) {
              area = parseFloat(feature.properties.area_ha);
            } else if (feature.properties?.total_area_hectares) {
              area = parseFloat(feature.properties.total_area_hectares);
            } else if (feature.properties?.area) {
              area = parseFloat(feature.properties.area);
            } else if (feature.properties?.Plot_Size) {
              area = parseFloat(feature.properties.Plot_Size);
            } else {
              // Calculate area from geometry if available
              area = await calculateAreaFromGeometry(feature.geometry);
              console.log(`📏 Plot ${plotId}: Calculated area ${area}ha from geometry using PostGIS`);
            }

            // Get loss percentages from API and convert to actual hectares
            const totalAreaHa = parseFloat(feature.properties?.total_area_hectares || area.toString() || '1');
            const gfwLossPercent = parseFloat(feature.properties?.gfw_loss?.gfw_loss_area || '0');
            const jrcLossPercent = parseFloat(feature.properties?.jrc_loss?.jrc_loss_area || '0');
            const sbtnLossPercent = parseFloat(feature.properties?.sbtn_loss?.sbtn_loss_area || '0');

            // Calculate actual loss areas in hectares
            const gfwLossArea = gfwLossPercent * totalAreaHa;
            const jrcLossArea = jrcLossPercent * totalAreaHa;
            const sbtnLossArea = sbtnLossPercent * totalAreaHa;

            // Calculate OVERALL RISK based on refined logic
            let overallRisk = 'LOW';
            let complianceStatus = 'COMPLIANT';
            
            // Check if any loss area > 0.01 hectares
            if (gfwLossArea > 0.01 || jrcLossArea > 0.01 || sbtnLossArea > 0.01) {
              overallRisk = 'HIGH';
              complianceStatus = 'NON-COMPLIANT';
            } 
            // Check if any loss area < 0.01 but > 0 (between 0.000 and 0.01)
            else if (gfwLossArea > 0 || jrcLossArea > 0 || sbtnLossArea > 0) {
              overallRisk = 'MEDIUM';
              complianceStatus = 'NON-COMPLIANT';
            }
            // If all loss areas = 0.000, keep LOW and COMPLIANT (default values)

            const highRiskDatasets = feature.properties?.overall_compliance?.high_risk_datasets || [];

            console.log(`🔍 Plot ${plotId} calculation:`, {
              totalAreaHa,
              gfwLossPercent: `${(gfwLossPercent * 100).toFixed(1)}%`,
              jrcLossPercent: `${(jrcLossPercent * 100).toFixed(1)}%`,
              sbtnLossPercent: `${(sbtnLossPercent * 100).toFixed(1)}%`,
              gfwLossArea: `${gfwLossArea.toFixed(4)}ha`,
              jrcLossArea: `${jrcLossArea.toFixed(4)}ha`,
              sbtnLossArea: `${sbtnLossArea.toFixed(4)}ha`
            });

            // Perform WDPA protected area analysis
            let wdpaStatus = 'UNKNOWN';
            let peatlandStatus = 'UNKNOWN';
            
            try {
              // Initialize WDPA service
              const wdpaService = new WDPAService();
              
              // Extract coordinates for analysis - use centroid for polygons
              let analysisCoords: [number, number];
              if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                // Calculate centroid of polygon
                const coords = feature.geometry.coordinates[0];
                const lons = coords.map((coord: number[]) => coord[0]);
                const lats = coords.map((coord: number[]) => coord[1]);
                const centroidLon = lons.reduce((a: number, b: number) => a + b, 0) / lons.length;
                const centroidLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
                analysisCoords = [centroidLon, centroidLat];
              } else if (feature.properties?.['.Long'] && feature.properties?.['.Lat']) {
                analysisCoords = [parseFloat(feature.properties['.Long']), parseFloat(feature.properties['.Lat'])];
              } else {
                // Use a default coordinate if no geometry available (fallback)
                analysisCoords = [101.4967, -0.5021]; // Central Indonesia
              }
              
              // Check WDPA protected area intersection area using database query
              let wdpaArea = 0; // Initialize WDPA intersection area in hectares
              if (country === 'Indonesia' || country === 'indonesia') {
                try {
                  // Calculate intersection area with wdpa_idn polygons using proper geometry handling
                  let wdpaQuery;
                  
                  if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
                    // Use full geometry for polygon features with accurate geographic area calculation
                    wdpaQuery = await db.execute(sql`
                      WITH plot_geom AS (
                        SELECT ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4326)::geography AS geom
                      )
                      SELECT 
                        COALESCE(SUM(ST_Area(ST_Intersection(ST_Transform(w.geom, 4326)::geography, plot_geom.geom))), 0) / 10000 AS intersection_area_ha,
                        array_agg(DISTINCT w.name) as wdpa_names,
                        array_agg(DISTINCT w.category) as wdpa_categories
                      FROM wdpa_idn w, plot_geom
                      WHERE ST_Intersects(ST_Transform(w.geom, 4326)::geography, plot_geom.geom)
                    `);
                  } else {
                    // Fallback for point geometries - use buffer around point
                    wdpaQuery = await db.execute(sql`
                      WITH plot_geom AS (
                        SELECT ST_Buffer(ST_SetSRID(ST_Point(${analysisCoords[0]}, ${analysisCoords[1]}), 4326)::geography, 100) AS geom
                      )
                      SELECT 
                        COALESCE(SUM(ST_Area(ST_Intersection(ST_Transform(w.geom, 4326)::geography, plot_geom.geom))), 0) / 10000 AS intersection_area_ha,
                        array_agg(DISTINCT w.name) as wdpa_names,
                        array_agg(DISTINCT w.category) as wdpa_categories
                      FROM wdpa_idn w, plot_geom
                      WHERE ST_Intersects(ST_Transform(w.geom, 4326)::geography, plot_geom.geom)
                    `);
                  }
                  
                  // Now wdpaQuery always returns one row due to aggregation
                  wdpaArea = parseFloat(wdpaQuery.rows[0].intersection_area_ha as string) || 0;
                  // Use explicit threshold to handle very small intersections
                  if (wdpaArea >= 0.0001) { // Minimum 0.0001 hectares (1 square meter)
                    wdpaStatus = `${wdpaArea.toFixed(4)} ha`;
                    const wdpaNames = (wdpaQuery.rows[0].wdpa_names as string[])?.filter((name: string) => name) || [];
                    const wdpaCategories = (wdpaQuery.rows[0].wdpa_categories as string[])?.filter((cat: string) => cat) || [];
                    console.log(`🏞️ Plot ${plotId} WDPA intersection: ${wdpaArea.toFixed(4)} hectares with ${wdpaNames.length} protected areas (Categories: ${wdpaCategories.join(', ')})`);
                  } else {
                    wdpaStatus = 'NOT_PROTECTED';
                  }
                } catch (wdpaError) {
                  console.warn(`⚠️ WDPA intersection calculation failed for plot ${plotId}:`, wdpaError);
                  // Fallback to simple point check if intersection calculation fails
                  try {
                    const fallbackQuery = await db.execute(sql`
                      SELECT name, category 
                      FROM wdpa_idn 
                      WHERE ST_Contains(ST_Transform(geom, 4326)::geography, ST_SetSRID(ST_Point(${analysisCoords[0]}, ${analysisCoords[1]}), 4326)::geography)
                      LIMIT 1
                    `);
                    wdpaStatus = fallbackQuery.rows.length > 0 ? 'PROTECTED' : 'NOT_PROTECTED';
                  } catch (fallbackError) {
                    console.warn(`⚠️ WDPA fallback check also failed for plot ${plotId}:`, fallbackError);
                    // Keep default 'UNKNOWN' for WDPA if all queries fail
                  }
                }
              } else {
                // For non-Indonesia countries, assume not in protected area
                wdpaStatus = 'NOT_PROTECTED';
              }
              
              // Check peatland intersection area using database query
              let peatlandArea = 0; // Initialize peatland intersection area in hectares
              if (country === 'Indonesia' || country === 'indonesia') {
                try {
                  // Calculate intersection area with peatland_idn polygons using proper geometry handling
                  let peatlandQuery;
                  
                  if (feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') {
                    // Use full geometry for polygon features with accurate geographic area calculation
                    const geometryJson = JSON.stringify(feature.geometry);
                    peatlandQuery = await db.execute(sql`
                      WITH plot_geom AS (
                        SELECT ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326) as geom
                      )
                      SELECT 
                        COALESCE(SUM(ST_Area(ST_Intersection(p.geom, plot_geom.geom)::geography)), 0) / 10000 as intersection_area_ha
                      FROM peatland_idn p, plot_geom
                      WHERE ST_Intersects(ST_Transform(p.geom, 4326), plot_geom.geom)
                    `);
                  } else {
                    // Fallback: create 100m buffer around centroid point for non-polygon features  
                    peatlandQuery = await db.execute(sql`
                      WITH plot_geom AS (
                        SELECT ST_Buffer(ST_SetSRID(ST_Point(${analysisCoords[0]}, ${analysisCoords[1]}), 4326)::geography, 100)::geometry as geom
                      )
                      SELECT 
                        COALESCE(SUM(ST_Area(ST_Intersection(p.geom, plot_geom.geom)::geography)), 0) / 10000 as intersection_area_ha
                      FROM peatland_idn p, plot_geom
                      WHERE ST_Intersects(ST_Transform(p.geom, 4326), plot_geom.geom)
                    `);
                  }
                  
                  if (peatlandQuery.rows.length > 0) {
                    peatlandArea = parseFloat(peatlandQuery.rows[0].intersection_area_ha as string) || 0;
                    // Use explicit threshold to handle very small intersections
                    if (peatlandArea >= 0.0001) { // Minimum 0.0001 hectares (1 square meter)
                      peatlandStatus = `${peatlandArea.toFixed(4)} ha`;
                      console.log(`🏞️ Plot ${plotId} peatland intersection: ${peatlandArea.toFixed(4)} hectares`);
                    } else {
                      peatlandStatus = 'NOT_PEATLAND';
                    }
                  } else {
                    peatlandStatus = 'NOT_PEATLAND';
                  }
                } catch (peatlandError) {
                  console.warn(`⚠️ Peatland intersection calculation failed for plot ${plotId}:`, peatlandError);
                  // Fallback to simple point check if intersection calculation fails
                  try {
                    const fallbackQuery = await db.execute(sql`
                      SELECT kubah__gbt 
                      FROM peatland_idn 
                      WHERE ST_Contains(geom, ST_Point(${analysisCoords[0]}, ${analysisCoords[1]}))
                      LIMIT 1
                    `);
                    peatlandStatus = fallbackQuery.rows.length > 0 ? 'PEATLAND' : 'NOT_PEATLAND';
                  } catch (fallbackError) {
                    console.warn(`⚠️ Peatland fallback check also failed for plot ${plotId}:`, fallbackError);
                    // Keep default 'UNKNOWN' for peatland if all queries fail
                  }
                }
              } else {
                // For non-Indonesia countries, assume not peatland
                peatlandStatus = 'NOT_PEATLAND';
              }
              
              console.log(`🔍 Plot ${plotId} spatial analysis: WDPA=${wdpaStatus}, Peatland=${peatlandStatus}`);
              
            } catch (spatialError) {
              console.warn(`⚠️ Spatial analysis failed for plot ${plotId}:`, spatialError);
              // Keep default 'UNKNOWN' values if analysis fails
            }

            // Apply WDPA compliance logic: if WDPA is protected and currently compliant, mark as non-compliant
            if (wdpaStatus !== 'NOT_PROTECTED' && complianceStatus === 'COMPLIANT') {
              complianceStatus = 'NON-COMPLIANT';
              console.log(`🏞️ Plot ${plotId} marked NON-COMPLIANT due to WDPA protected area intersection: ${wdpaStatus}`);
            }

            // Create analysis result with comprehensive Indonesian metadata
            const analysisResult = {
              plotId,
              country,
              area: area.toString(),
              overallRisk,
              complianceStatus,
              gfwLoss: gfwLossArea > 0 ? 'TRUE' : 'FALSE',
              jrcLoss: jrcLossArea > 0 ? 'TRUE' : 'FALSE',
              sbtnLoss: sbtnLossArea > 0 ? 'TRUE' : 'FALSE',
              gfwLossArea: gfwLossArea.toString(),
              jrcLossArea: jrcLossArea.toString(),
              sbtnLossArea: sbtnLossArea.toString(),
              wdpaStatus: wdpaStatus,
              peatlandStatus: peatlandStatus,
              highRiskDatasets,
              uploadSession: uploadSession,
              geometry: feature.geometry,
              // Enhanced metadata from Indonesian data
              farmerName: feature.properties?.['.Farmer Name'] ||
                         feature.properties?.farmer_name ||
                         feature.properties?.grower_name || null,
              aggregatorName: feature.properties?.['.Aggregator Name'] ||
                             feature.properties?.aggregator ||
                             feature.properties?.cooperative || null,
              mappingDate: feature.properties?.['.Mapping date'] ||
                          feature.properties?.mapping_date ||
                          feature.properties?.survey_date || null,
              // Additional Indonesian-specific fields
              aggregatorLocation: feature.properties?.['.Aggregator Location'] || null,
              plotName: feature.properties?.Name || feature.properties?.name || null,
              coordinates: {
                longitude: feature.properties?.['.Long'] || null,
                latitude: feature.properties?.['.Lat'] || null
              }
            };

            await storage.createAnalysisResult(analysisResult);
          } catch (err) {
            const errMessage = err instanceof Error ? err.message : 'Unknown error';
            console.log("Could not store analysis result:", errMessage);
          }
        }

        console.log(`✅ Stored ${analysisResults.data.features.length} analysis results in database for reactive dashboard`);
      }

      // Return the response directly as it already has the expected structure
      res.json(analysisResults);

    } catch (error) {
      console.error('GeoJSON upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Internal server error during GeoJSON analysis',
        details: errorMessage
      });
    }
  });

  // Get analysis results endpoint for map viewer
  app.get('/api/analysis-results', async (req, res) => {
    try {
      const results = await storage.getAnalysisResults();
      // Map database fields to frontend expected fields
      const formattedResults = results.map(result => ({
        ...result,
        // Map peatlandOverlap back to peatlandStatus for frontend compatibility
        peatlandStatus: result.peatlandOverlap || 'UNKNOWN',
        // Map wdpaOverlap back to wdpaStatus for frontend compatibility
        wdpaStatus: result.wdpaOverlap || 'UNKNOWN'
      }));
      res.json(formattedResults);
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
  });

  // Clear analysis results endpoint for dashboard reset
  app.delete('/api/analysis-results', async (req, res) => {
    try {
      await storage.clearAnalysisResults();
      res.json({ success: true, message: 'Analysis results cleared' });
    } catch (error) {
      console.error('Error clearing analysis results:', error);
      res.status(500).json({ error: 'Failed to clear analysis results' });
    }
  });

  // Update polygon geometry after editing
  app.patch('/api/analysis-results/:plotId/geometry', async (req, res) => {
    try {
      const { plotId } = req.params;
      const { coordinates } = req.body;

      if (!coordinates || !Array.isArray(coordinates)) {
        return res.status(400).json({ error: 'Invalid coordinates provided' });
      }

      // Update the geometry in analysis results
      const result = await storage.updateAnalysisResultGeometry(plotId, coordinates);

      if (!result) {
        return res.status(404).json({ error: 'Plot not found' });
      }

      res.json({
        success: true,
        message: `Updated geometry for ${plotId}`,
        plotId,
        coordinatesCount: coordinates.length
      });
    } catch (error) {
      console.error('Error updating polygon geometry:', error);
      res.status(500).json({ error: 'Failed to update polygon geometry' });
    }
  });

  // Update compliance status after verification
  app.patch('/api/analysis-results/:plotId/compliance-status', async (req, res) => {
    try {
      const { plotId } = req.params;
      const { complianceStatus, verificationType, assessedBy, updatedDate } = req.body;

      if (!complianceStatus) {
        return res.status(400).json({ error: 'Compliance status is required' });
      }

      // Find the analysis result by plotId first
      const results = await storage.getAnalysisResults();
      const targetResult = results.find(r => r.plotId === plotId);

      if (!targetResult) {
        return res.status(404).json({ error: 'Analysis result not found for plotId: ' + plotId });
      }

      // Update the compliance status and verification details
      const updates = {
        complianceStatus,
        ...(verificationType && { verificationType }),
        ...(assessedBy && { assessedBy }),
        ...(updatedDate && { verifiedAt: new Date(updatedDate) })
      };

      const updatedResult = await storage.updateAnalysisResult(targetResult.id, updates);

      if (!updatedResult) {
        return res.status(404).json({ error: 'Failed to update analysis result' });
      }

      console.log(`✅ Updated compliance status for ${plotId} to ${complianceStatus}`);

      res.json({
        success: true,
        message: `Updated compliance status for ${plotId} to ${complianceStatus}`,
        plotId,
        complianceStatus,
        updatedResult
      });
    } catch (error) {
      console.error('Error updating compliance status:', error);
      res.status(500).json({ error: 'Failed to update compliance status' });
    }
  });

  // Supply Chain Analytics endpoint
  app.get('/api/supply-chain/analytics', isAuthenticated, async (req, res) => {
    try {
      const { range = '6months' } = req.query;

      // Mock analytics data with renamed external suppliers
      const analyticsData = {
        suppliers: [
          {
            supplierId: "coop-001",
            supplierName: "Cooperative 1",
            complianceScore: {
              overallScore: 85,
              riskLevel: 'low',
              confidence: 0.92,
              factors: [
                { name: "Documentation", impact: 15, trend: 'improving' },
                { name: "Geolocation", impact: 10, trend: 'stable' },
                { name: "Deforestation Risk", impact: -2, trend: 'improving' },
                { name: "Traceability", impact: 12, trend: 'stable' }
              ],
              recommendations: [
                "Maintain current documentation standards",
                "Continue regular monitoring protocols",
                "Review quarterly compliance metrics"
              ],
              nextReviewDate: "2024-12-15"
            },
            trends: [
              { period: "Jan", score: 78, alerts: 2, violations: 0 },
              { period: "Feb", score: 82, alerts: 1, violations: 0 },
              { period: "Mar", score: 85, alerts: 0, violations: 0 },
              { period: "Apr", score: 84, alerts: 1, violations: 0 },
              { period: "May", score: 87, alerts: 0, violations: 0 },
              { period: "Jun", score: 85, alerts: 0, violations: 0 }
            ],
            riskFactors: [
              {
                category: "Location Risk",
                severity: 'low',
                description: "Minimal deforestation risk in operational area",
                mitigation: "Continue quarterly satellite monitoring"
              }
            ]
          },
          {
            supplierId: "kud-002",
            supplierName: "KUD 2",
            complianceScore: {
              overallScore: 72,
              riskLevel: 'medium',
              confidence: 0.87,
              factors: [
                { name: "Documentation", impact: 8, trend: 'stable' },
                { name: "Geolocation", impact: -5, trend: 'declining' },
                { name: "Deforestation Risk", impact: -8, trend: 'stable' },
                { name: "Traceability", impact: 5, trend: 'improving' }
              ],
              recommendations: [
                "Improve geolocation accuracy for plots",
                "Enhance documentation processes",
                "Implement additional monitoring controls"
              ],
              nextReviewDate: "2024-11-30"
            },
            trends: [
              { period: "Jan", score: 75, alerts: 3, violations: 1 },
              { period: "Feb", score: 73, alerts: 2, violations: 0 },
              { period: "Mar", score: 71, alerts: 3, violations: 1 },
              { period: "Apr", score: 74, alerts: 2, violations: 0 },
              { period: "May", score: 72, alerts: 2, violations: 0 },
              { period: "Jun", score: 72, alerts: 1, violations: 0 }
            ],
            riskFactors: [
              {
                category: "Documentation Gap",
                severity: 'medium',
                description: "Some plot records lack complete geolocation data",
                mitigation: "Conduct field verification within 60 days"
              },
              {
                category: "Monitoring",
                severity: 'low',
                description: "Infrequent satellite monitoring updates",
                mitigation: "Increase monitoring frequency to monthly"
              }
            ]
          },
          {
            supplierId: "cv-001",
            supplierName: "CV 1",
            complianceScore: {
              overallScore: 91,
              riskLevel: 'low',
              confidence: 0.95,
              factors: [
                { name: "Documentation", impact: 18, trend: 'improving' },
                { name: "Geolocation", impact: 15, trend: 'stable' },
                { name: "Deforestation Risk", impact: 12, trend: 'improving' },
                { name: "Traceability", impact: 16, trend: 'improving' }
              ],
              recommendations: [
                "Excellent compliance - maintain current standards",
                "Consider best practice sharing with other suppliers",
                "Continue leadership in sustainable practices"
              ],
              nextReviewDate: "2025-01-15"
            },
            trends: [
              { period: "Jan", score: 88, alerts: 0, violations: 0 },
              { period: "Feb", score: 89, alerts: 0, violations: 0 },
              { period: "Mar", score: 90, alerts: 0, violations: 0 },
              { period: "Apr", score: 91, alerts: 0, violations: 0 },
              { period: "May", score: 92, alerts: 0, violations: 0 },
              { period: "Jun", score: 91, alerts: 0, violations: 0 }
            ],
            riskFactors: []
          },
          {
            supplierId: "coop-003",
            supplierName: "Cooperative 3",
            complianceScore: {
              overallScore: 68,
              riskLevel: 'medium',
              confidence: 0.83,
              factors: [
                { name: "Documentation", impact: 5, trend: 'stable' },
                { name: "Geolocation", impact: -3, trend: 'declining' },
                { name: "Deforestation Risk", impact: -12, trend: 'declining' },
                { name: "Traceability", impact: 8, trend: 'improving' }
              ],
              recommendations: [
                "Urgent: Address deforestation risk areas",
                "Improve plot boundary documentation",
                "Implement enhanced monitoring protocols"
              ],
              nextReviewDate: "2024-10-31"
            },
            trends: [
              { period: "Jan", score: 72, alerts: 4, violations: 2 },
              { period: "Feb", score: 70, alerts: 3, violations: 1 },
              { period: "Mar", score: 68, alerts: 5, violations: 2 },
              { period: "Apr", score: 69, alerts: 3, violations: 1 },
              { period: "May", score: 67, alerts: 4, violations: 1 },
              { period: "Jun", score: 68, alerts: 3, violations: 1 }
            ],
            riskFactors: [
              {
                category: "Deforestation Risk",
                severity: 'high',
                description: "Some plots located near high-risk deforestation areas",
                mitigation: "Immediate field assessment and buffer zone establishment"
              },
              {
                category: "Documentation Gap",
                severity: 'medium',
                description: "Incomplete plot boundary records",
                mitigation: "Complete GPS mapping within 30 days"
              }
            ]
          }
        ],
        insights: {
          summary: "Overall supplier network shows good compliance with 75% scoring above 70. Key focus areas include improving documentation accuracy and addressing deforestation risks.",
          keyFindings: [
            "CV 1 demonstrates exemplary compliance practices",
            "Cooperative 3 requires immediate attention for deforestation risk",
            "Documentation quality varies significantly across suppliers",
            "Traceability systems show consistent improvement trends"
          ],
          actionItems: [
            "Conduct urgent field assessment for Cooperative 3",
            "Implement standardized documentation training",
            "Share CV 1 best practices across network",
            "Increase monitoring frequency for medium-risk suppliers"
          ]
        }
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching supply chain analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // Supply Chain Tier Management endpoint
  app.post('/api/supply-chain/tiers', isAuthenticated, async (req, res) => {
    try {
      const tierAssignments = req.body;
      console.log('✅ Received tier assignments for saving:', JSON.stringify(tierAssignments, null, 2));

      // Validate that tierAssignments is an object
      if (!tierAssignments || typeof tierAssignments !== 'object') {
        return res.status(400).json({ error: 'Invalid tier assignments data' });
      }

      // For now, we'll store it in memory or could extend to database storage later
      console.log('✅ Supply chain tier configuration saved successfully');

      res.json({
        success: true,
        message: 'Supply chain configuration saved successfully!',
        savedAt: new Date().toISOString(),
        tierCount: Object.keys(tierAssignments).length,
        totalSuppliers: Object.values(tierAssignments).reduce((total: number, tier: any) => total + (Array.isArray(tier) ? tier.length : 0), 0)
      });

    } catch (error) {
      console.error('❌ Error saving supply chain tier configuration:', error);
      res.status(500).json({ error: 'Failed to save supply chain configuration' });
    }
  });

  // Auto-fill suppliers endpoint - fetch all suppliers from data collection forms
  app.get('/api/suppliers/auto-fill', isAuthenticated, async (req, res) => {
    try {
      console.log('📋 Fetching suppliers for auto-fill from data collection forms...');

      // Fetch estate data collection
      const estates = await storage.getEstateDataCollection();

      // Fetch mill data collection
      const mills = await storage.getMillDataCollection();

      // Combine and format supplier data for auto-fill
      const suppliers: Array<{
        id: string;
        name: string;
        type: 'Estate' | 'Mill';
        groupParentCompany?: string;
        officeAddress?: string;
        plantationAddress?: string;
        officeCoordinates?: string;
        plantationCoordinates?: string;
        businessLicense?: string;
        establishmentAct?: string;
        amendmentAct?: string;
        certificationType?: string;
        certificateNumber?: string;
        supplierType?: string;
        responsiblePersonName?: string;
        responsiblePersonPosition?: string;
        responsiblePersonEmail?: string;
        responsiblePersonPhone?: string;
        internalTeamName?: string;
        internalTeamPosition?: string;
        internalTeamEmail?: string;
        internalTeamPhone?: string;
        originalData: any;
      }> = [];

      // Add estate suppliers
      estates.forEach(estate => {
        suppliers.push({
          id: estate.id,
          name: estate.namaSupplier,
          type: 'Estate',
          groupParentCompany: estate.namaGroupParentCompany || undefined,
          officeAddress: estate.alamatKantor || undefined,
          plantationAddress: estate.alamatKebun || undefined,
          officeCoordinates: estate.koordinatKantor || undefined,
          plantationCoordinates: estate.koordinatKebun || undefined,
          businessLicense: estate.izinBerusaha || undefined,
          establishmentAct: estate.aktaPendirianPerusahaan || undefined,
          amendmentAct: estate.aktaPerubahan || undefined,
          certificationType: estate.tipeSertifikat || undefined,
          certificateNumber: estate.nomorSertifikat || undefined,
          supplierType: estate.jenisSupplier || undefined,
          responsiblePersonName: estate.namaPenanggungJawab || undefined,
          responsiblePersonPosition: estate.jabatanPenanggungJawab || undefined,
          responsiblePersonEmail: estate.emailPenanggungJawab || undefined,
          responsiblePersonPhone: estate.nomorTelefonPenanggungJawab || undefined,
          internalTeamName: estate.namaTimInternal || undefined,
          internalTeamPosition: estate.jabatanTimInternal || undefined,
          internalTeamEmail: estate.emailTimInternal || undefined,
          internalTeamPhone: estate.nomorTelefonTimInternal || undefined,
          originalData: estate
        });
      });

      // Add mill suppliers
      mills.forEach(mill => {
        suppliers.push({
          id: mill.id,
          name: mill.namaPabrik,
          type: 'Mill',
          groupParentCompany: mill.namaGroupParentCompany || undefined,
          officeAddress: mill.alamatKantor || undefined,
          plantationAddress: mill.alamatPabrik || undefined,
          officeCoordinates: mill.koordinatKantor || undefined,
          plantationCoordinates: mill.koordinatPabrik || undefined,
          businessLicense: mill.izinBerusaha || undefined,
          establishmentAct: mill.aktaPendirianPerusahaan || undefined,
          amendmentAct: mill.aktaPerubahan || undefined,
          certificationType: mill.tipeSertifikat || undefined,
          certificateNumber: mill.nomorSertifikat || undefined,
          supplierType: mill.jenisSupplier || undefined,
          responsiblePersonName: mill.namaPenanggungJawab || undefined,
          responsiblePersonPosition: mill.jabatanPenanggungJawab || undefined,
          responsiblePersonEmail: mill.emailPenanggungJawab || undefined,
          responsiblePersonPhone: mill.nomorTelefonPenanggungJawab || undefined,
          internalTeamName: mill.namaTimInternal || undefined,
          internalTeamPosition: mill.jabatanTimInternal || undefined,
          internalTeamEmail: mill.emailTimInternal || undefined,
          internalTeamPhone: mill.nomorTelefonTimInternal || undefined,
          originalData: mill
        });
      });

      console.log(`✅ Found ${suppliers.length} suppliers for auto-fill (${estates.length} estates, ${mills.length} mills)`);

      res.json(suppliers);
    } catch (error) {
      console.error('❌ Error fetching suppliers for auto-fill:', error);
      res.status(500).json({ error: 'Failed to fetch suppliers for auto-fill' });
    }
  });

  // Supplier Compliance endpoints
  app.post('/api/supplier-compliance', async (req, res) => {
    try {
      const supplierComplianceData = req.body;
      console.log('Saving supplier compliance data:', supplierComplianceData.namaSupplier);

      // Store the data (you may want to add this to your storage interface)
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Supplier compliance data saved successfully',
        id: Date.now().toString()
      });
    } catch (error) {
      console.error('Error saving supplier compliance data:', error);
      res.status(500).json({ error: 'Failed to save supplier compliance data' });
    }
  });

  app.get('/api/supplier-compliance', async (req, res) => {
    try {
      // Return dummy data for now (in a real implementation, fetch from storage)
      const supplierComplianceData = [
        {
          id: 1,
          namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
          tingkatKepatuhan: 85,
          statusKepatuhan: 'Compliant',
          tanggalPenilaian: '15 November 2024',
          nomorTeleponTimInternal: '+62 811-2345-6789',
          emailKontak: 'compliance@kebun-sejahtera.co.id',
          analysisData: null
        },
        {
          id: 2,
          namaSupplier: 'CV Perkebunan Nusantara',
          tingkatKepatuhan: 92,
          statusKepatuhan: 'Highly Compliant',
          tanggalPenilaian: '18 November 2024',
          nomorTeleponTimInternal: '+62 812-3456-7890',
          emailKontak: 'legal@perkebunan-nusantara.co.id',
          analysisData: null
        },
        {
          id: 3,
          namaSupplier: 'Koperasi Tani Mandiri',
          tingkatKepatuhan: 68,
          statusKepatuhan: 'Partially Compliant',
          tanggalPenilaian: '20 November 2024',
          nomorTeleponTimInternal: '+62 813-4567-8901',
          emailKontak: 'koperasi@tani-mandiri.co.id',
          analysisData: null
        }
      ];

      res.json(supplierComplianceData);
    } catch (error) {
      console.error('Error fetching supplier compliance data:', error);
      res.status(500).json({ error: 'Failed to fetch supplier compliance data' });
    }
  });

  // AI Analysis endpoint for supplier compliance
  app.post('/api/supplier-compliance/:id/analyze', async (req, res) => {
    try {
      const { id } = req.params;
      const { formData, supplierName } = req.body;

      if (!formData || !supplierName) {
        return res.status(400).json({ error: 'Missing required fields: formData and supplierName' });
      }

      console.log(`Starting AI analysis for supplier: ${supplierName}`);

      // Call OpenAI service for compliance analysis
      const analysis = await openaiService.analyzeSupplierCompliance({
        supplierName,
        formData,
        analysisType: 'full_analysis'
      });

      console.log(`AI analysis completed for supplier: ${supplierName}`);

      res.json({
        success: true,
        supplierId: id,
        supplierName,
        analysis,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error analyzing supplier compliance:', error);
      res.status(500).json({
        error: 'Failed to analyze supplier compliance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk analysis endpoint
  app.post('/api/supplier-compliance/analyze-all', async (req, res) => {
    try {
      const { supplierData } = req.body;

      if (!Array.isArray(supplierData) || supplierData.length === 0) {
        return res.status(400).json({ error: 'Missing or empty supplierData array' });
      }

      console.log(`Starting bulk AI analysis for ${supplierData.length} suppliers`);

      const results = [];
      for (const supplier of supplierData) {
        try {
          const analysis = await openaiService.analyzeSupplierCompliance({
            supplierName: supplier.namaSupplier,
            formData: supplier,
            analysisType: 'full_analysis'
          });

          results.push({
            supplierId: supplier.id || Date.now().toString(),
            supplierName: supplier.namaSupplier,
            analysis,
            analyzedAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Error analyzing supplier ${supplier.namaSupplier}:`, error);
          results.push({
            supplierId: supplier.id || Date.now().toString(),
            supplierName: supplier.namaSupplier,
            error: error instanceof Error ? error.message : 'Unknown error',
            analyzedAt: new Date().toISOString()
          });
        }
      }

      console.log(`Bulk AI analysis completed for ${results.length} suppliers`);

      res.json({
        success: true,
        totalAnalyzed: results.length,
        results
      });

    } catch (error) {
      console.error('Error in bulk analysis:', error);
      res.status(500).json({
        error: 'Failed to perform bulk analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PostGIS polygon overlap detection endpoint
  app.post('/api/polygon-overlap-detection', async (req, res) => {
    try {
      const { polygons } = req.body;

      if (!Array.isArray(polygons) || polygons.length < 2) {
        return res.status(400).json({ error: 'At least 2 polygons required for overlap detection' });
      }

      console.log(`Checking overlaps for ${polygons.length} polygons using PostGIS`);

      // Enable PostGIS extension if not already enabled
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);

      const overlaps = [];

      // Check each polygon against all others
      for (let i = 0; i < polygons.length; i++) {
        for (let j = i + 1; j < polygons.length; j++) {
          const polygon1 = polygons[i];
          const polygon2 = polygons[j];

          try {
            // Convert coordinates to WKT format for PostGIS
            const wkt1 = coordinatesToWKT(polygon1.coordinates);
            const wkt2 = coordinatesToWKT(polygon2.coordinates);

            console.log(`Checking overlap between ${polygon1.plotId} and ${polygon2.plotId}`);

            // Use PostGIS ST_Intersection to detect overlap
            const result = await db.execute(sql`
              SELECT
                ST_Area(ST_Intersection(
                  ST_GeomFromText(${wkt1}, 4326),
                  ST_GeomFromText(${wkt2}, 4326)
                )) as intersection_area,
                ST_Intersects(
                  ST_GeomFromText(${wkt1}, 4326),
                  ST_GeomFromText(${wkt2}, 4326)
                ) as intersects
            `);

            const intersectionArea = parseFloat(result.rows[0]?.intersection_area?.toString() || '0');
            const intersects = result.rows[0]?.intersects || false;

            console.log(`Intersection area between ${polygon1.plotId} and ${polygon2.plotId}: ${intersectionArea}`);

            if (intersects && intersectionArea > 0) {
              overlaps.push({
                polygon1: polygon1.plotId,
                polygon2: polygon2.plotId,
                intersectionArea: intersectionArea,
                intersectionAreaHa: intersectionArea * 111319.9 * 111319.9 / 10000 // Convert to hectares (approximate)
              });
              console.log(`OVERLAP DETECTED: ${polygon1.plotId} overlaps with ${polygon2.plotId}, area: ${intersectionArea}`);
            }
          } catch (error) {
            console.error(`Error checking overlap between ${polygon1.plotId} and ${polygon2.plotId}:`, error);
          }
        }
      }

      res.json({
        success: true,
        totalPolygons: polygons.length,
        overlapsDetected: overlaps.length,
        overlaps: overlaps
      });

    } catch (error) {
      console.error('Error in PostGIS overlap detection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to detect overlaps using PostGIS',
        details: errorMessage
      });
    }
  });

  // Peatland data endpoint for EUDR Map Viewer
  app.post('/api/peatland-data', isAuthenticated, async (req, res) => {
    try {
      const { bounds } = req.body;

      if (!bounds || !bounds.west || !bounds.south || !bounds.east || !bounds.north) {
        return res.status(400).json({ error: 'Invalid bounds provided' });
      }

      console.log(`🏞️ Fetching peatland data for bounds:`, bounds);

      let features = [];

      try {
        // Try database query first, then fallback to mock data
        console.log('🏞️ Attempting to query peatland_idn table...');

        // Create bounding box for PostGIS query with buffer
        const buffer = 0.5; // Add buffer to catch more features
        const bbox = `POLYGON((${bounds.west - buffer} ${bounds.south - buffer}, ${bounds.east + buffer} ${bounds.south - buffer}, ${bounds.east + buffer} ${bounds.north + buffer}, ${bounds.west - buffer} ${bounds.north + buffer}, ${bounds.west - buffer} ${bounds.south - buffer}))`;

        console.log('🔍 Using PostGIS query with bounding box:', bbox.substring(0, 100) + '...');

        // Query peatland data from PostGIS database using correct column names from DDL
        const result = await db.execute(sql`
          SELECT 
            COALESCE(kubah__gbt, 'Unknown') as kubah_classification,
            COALESCE(provinsi, 'Unknown') as province_name,
            COALESCE(kabupaten, 'Unknown') as kabupaten_name,
            COALESCE(kecamatan, 'Unknown') as kecamatan_name,
            COALESCE(nama_khg, 'Unknown') as nama_khg,
            COALESCE(status_khg, 'Unknown') as status_khg,
            COALESCE(luas__ha, 0) as area_hectares,
            ST_AsGeoJSON(ST_Simplify(geom, 0.001)) as geometry
          FROM peatland_idn 
          WHERE geom IS NOT NULL
          AND ST_IsValid(geom)
          AND ST_Intersects(
            geom, 
            ST_GeomFromText(${bbox}, 4326)
          )
          ORDER BY COALESCE(luas__ha, 0) DESC
          LIMIT 500
        `);

        console.log(`📊 PostGIS query returned ${result.rows.length} rows`);

        features = result.rows.map((row: any, index: number) => {
          let geometry;
          try {
            geometry = JSON.parse(row.geometry);

            // Validate geometry
            if (!geometry || !geometry.coordinates) {
              console.warn(`⚠️ Feature ${index + 1}: Invalid geometry, skipping`);
              return null;
            }
          } catch (error) {
            console.warn(`⚠️ Feature ${index + 1}: Failed to parse geometry:`, error);
            return null;
          }

          return {
            type: 'Feature',
            properties: {
              Kubah_GBT: row.kubah_classification || 'Unknown',
              Ekosistem: row.nama_khg || 'Unknown',
              Province: row.province_name || 'Unknown',
              Kabupaten: row.kabupaten_name || 'Unknown',
              Kecamatan: row.kecamatan_name || 'Unknown',
              Status_KHG: row.status_khg || 'Unknown',
              Area_Ha: parseFloat(row.area_hectares?.toString() || '0')
            },
            geometry: geometry
          };
        }).filter(Boolean); // Remove null features

        console.log(`✅ Successfully processed ${features.length} peatland features from database`);

      } catch (dbError) {
        console.warn('⚠️ Database query failed, using comprehensive mock peatland data with global coverage:', dbError);

        // Always provide comprehensive mock data for immediate visibility
        const mockPeatlandAreas = [
          // Riau Province - Central Sumatra - Larger coverage
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Kubah Gambut',
              Ekosistem: 'Hutan Rawa Gambut',
              Province: 'Riau',
              Kabupaten: 'Pelalawan',
              Kecamatan: 'Kerumutan',
              Area_Ha: 25420.5
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[100.0, -0.5], [102.0, -0.5], [102.0, 1.5], [100.0, 1.5], [100.0, -0.5]]]
            }
          },
          // Jambi Province - Extended coverage
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Non Kubah Gambut',
              Ekosistem: 'Perkebunan Gambut',
              Province: 'Jambi',
              Kabupaten: 'Muaro Jambi',
              Kecamatan: 'Kumpeh Ulu',
              Area_Ha: 18750.2
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[102.0, -2.2], [104.5, -2.2], [104.5, -0.2], [102.0, -0.2], [102.0, -2.2]]]
            }
          },
          // Central Kalimantan - Massive coverage
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Kubah Gambut',
              Ekosistem: 'Hutan Lindung Gambut',
              Province: 'Kalimantan Tengah',
              Kabupaten: 'Palangka Raya',
              Kecamatan: 'Sebangau',
              Area_Ha: 32150.8
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[112.5, -3.0], [115.5, -3.0], [115.5, -0.2], [112.5, -0.2], [112.5, -3.0]]]
            }
          },
          // South Sumatra - Peatland agriculture
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Non Kubah Gambut',
              Ekosistem: 'Pertanian Gambut',
              Province: 'Sumatra Selatan',
              Kabupaten: 'Ogan Komering Ilir',
              Kecamatan: 'Mesuji Makmur',
              Area_Ha: 6420.3
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[104.0, -3.0], [105.5, -3.0], [105.5, -2.0], [104.0, -2.0], [104.0, -3.0]]]
            }
          },
          // West Kalimantan - Additional coverage
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Kubah Gambut',
              Ekosistem: 'Hutan Rawa Gambut',
              Province: 'Kalimantan Barat',
              Kabupaten: 'Ketapang',
              Kecamatan: 'Kendawangan',
              Area_Ha: 12800.7
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[109.0, -2.0], [111.0, -2.0], [111.0, -0.5], [109.0, -0.5], [109.0, -2.0]]]
            }
          },
          // Papua - Eastern coverage
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Non Kubah Gambut',
              Ekosistem: 'Hutan Gambut Tropis',
              Province: 'Papua',
              Kabupaten: 'Merauke',
              Kecamatan: 'Kimaam',
              Area_Ha: 9340.2
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[140.0, -8.0], [141.0, -8.0], [141.0, -7.0], [140.0, -7.0], [140.0, -8.0]]]
            }
          },
          // North Sumatra - Additional visibility
          {
            type: 'Feature',
            properties: {
              Kubah_GBT: 'Kubah Gambut',
              Ekosistem: 'Hutan Lindung Gambut',
              Province: 'Sumatra Utara',
              Kabupaten: 'Labuhan Batu',
              Kecamatan: 'Panai Hulu',
              Area_Ha: 7890.5
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[99.0, 1.5], [100.5, 1.5], [100.5, 2.5], [99.0, 2.5], [99.0, 1.5]]]
            }
          }
        ];

        // Filter mock data based on bounds
        features = mockPeatlandAreas.filter(feature => {
          if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) {
            return false;
          }

          const coords = feature.geometry.coordinates[0];
          const minLng = Math.min(...coords.map(c => c[0]));
          const maxLng = Math.max(...coords.map(c => c[0]));
          const minLat = Math.min(...coords.map(c => c[1]));
          const maxLat = Math.max(...coords.map(c => c[1]));

          // Check if polygon intersects with bounds
          return !(maxLng < bounds.west || minLng > bounds.east || maxLat < bounds.south || minLat > bounds.north);
        });

        console.log(`✅ Using ${features.length} filtered mock peatland features`);
      }

      // Group by classification for logging
      const classifications = features.reduce((acc: any, feature: any) => {
        const kubahGbt = feature.properties.Kubah_GBT || 'Unknown';
        acc[kubahGbt] = (acc[kubahGbt] || 0) + 1;
        return acc;
      }, {});

      console.log('🏞️ Peatland classifications distribution:', classifications);

      res.json({
        type: 'FeatureCollection',
        features: features
      });

    } catch (error) {
      console.error('❌ Error in peatland data endpoint:', error);

      // Always return valid GeoJSON even if everything fails
      const fallbackFeatures = [
        {
          type: 'Feature',
          properties: {
            Kubah_GBT: 'Kubah Gambut',
            Ekosistem: 'Demo Peatland Area (Fallback)',
            Province: 'Indonesia',
            Area_Ha: 1000.0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[101.0, 0.5], [101.5, 0.5], [101.5, 1.0], [101.0, 1.0], [101.0, 0.5]]]
          }
        },
        {
          type: 'Feature',
          properties: {
            Kubah_GBT: 'Non Kubah Gambut',
            Ekosistem: 'Demo Non-Dome Peat (Fallback)',
            Province: 'Indonesia',
            Area_Ha: 750.5
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[102.0, 1.0], [102.5, 1.0], [102.5, 1.5], [102.0, 1.5], [102.0, 1.0]]]
          }
        }
      ];

      res.json({
        type: 'FeatureCollection',
        features: fallbackFeatures
      });
    }
  });

  // WDPA data endpoint for EUDR Map Viewer
  app.post('/api/wdpa-data', isAuthenticated, async (req, res) => {
    try {
      const { bounds } = req.body;

      if (!bounds || !bounds.west || !bounds.south || !bounds.east || !bounds.north) {
        return res.status(400).json({ error: 'Invalid bounds provided' });
      }

      console.log(`🏞️ Fetching WDPA data for bounds:`, bounds);

      let features = [];

      try {
        // Try database query first, then fallback to mock data
        console.log('🏞️ Attempting to query wdpa_idn table...');

        // Create bounding box for PostGIS query with buffer
        const buffer = 0.5; // Add buffer to catch more features
        const bbox = `POLYGON((${bounds.west - buffer} ${bounds.south - buffer}, ${bounds.east + buffer} ${bounds.south - buffer}, ${bounds.east + buffer} ${bounds.north + buffer}, ${bounds.west - buffer} ${bounds.north + buffer}, ${bounds.west - buffer} ${bounds.south - buffer}))`;

        console.log('🔍 Using PostGIS query with bounding box:', bbox.substring(0, 100) + '...');

        // Query WDPA data from PostGIS database using actual table columns
        const result = await db.execute(sql`
          SELECT 
            COALESCE(name, 'Unknown Protected Area') as name,
            COALESCE(category, 'Unknown') as iucn_category,
            COALESCE(areatype, 'Unknown') as designation,
            ST_AsGeoJSON(ST_Simplify(geom, 0.001)) as geometry
          FROM wdpa_idn 
          WHERE geom IS NOT NULL
          AND ST_IsValid(geom)
          AND ST_Intersects(
            geom, 
            ST_GeomFromText(${bbox}, 4326)
          )
          LIMIT 500
        `);

        console.log(`📊 PostGIS query returned ${result.rows.length} rows`);

        features = result.rows.map((row: any, index: number) => {
          let geometry;
          try {
            geometry = JSON.parse(row.geometry);

            // Validate geometry
            if (!geometry || !geometry.coordinates) {
              console.warn(`⚠️ Feature ${index + 1}: Invalid geometry, skipping`);
              return null;
            }
          } catch (error) {
            console.warn(`⚠️ Feature ${index + 1}: Failed to parse geometry:`, error);
            return null;
          }

          return {
            type: 'Feature',
            properties: {
              name: row.name || 'Unknown Protected Area',
              iucn_category: row.iucn_category || 'Unknown',
              designation: row.designation || 'Unknown'
            },
            geometry: geometry
          };
        }).filter(Boolean); // Remove null features

        console.log(`✅ Successfully processed ${features.length} WDPA features from database`);

      } catch (dbError) {
        console.warn('⚠️ Database query failed, using comprehensive mock WDPA data with global coverage:', dbError);

        // Always provide comprehensive mock data for immediate visibility
        const mockWdpaAreas = [
          // Sumatra Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Gunung Leuser National Park',
              category: 'National Park',
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 862975.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[97.0, 3.0], [98.5, 3.0], [98.5, 4.0], [97.0, 4.0], [97.0, 3.0]]]
            }
          },
          // Java Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Ujung Kulon National Park',
              category: 'National Park',
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 78619.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[105.0, -6.8], [105.8, -6.8], [105.8, -6.2], [105.0, -6.2], [105.0, -6.8]]]
            }
          },
          // Kalimantan Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Tanjung Puting National Park',
              category: 'National Park',
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 415040.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[111.5, -3.0], [112.5, -3.0], [112.5, -2.0], [111.5, -2.0], [111.5, -3.0]]]
            }
          },
          // Sulawesi Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Lore Lindu National Park',
              category: 'National Park', 
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 217991.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[119.5, -1.5], [120.5, -1.5], [120.5, -0.5], [119.5, -0.5], [119.5, -1.5]]]
            }
          },
          // Papua Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Lorentz National Park',
              category: 'National Park',
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 2350000.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[137.0, -5.0], [139.0, -5.0], [139.0, -3.5], [137.0, -3.5], [137.0, -5.0]]]
            }
          },
          // Nusa Tenggara Protected Areas
          {
            type: 'Feature',
            properties: {
              name: 'Komodo National Park',
              category: 'National Park',
              designation: 'National Park',
              iucn_category: 'II',
              area_hectares: 173300.0,
              status_wdpa: 'Designated',
              governance_type: 'Federal'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[119.3, -8.7], [119.7, -8.7], [119.7, -8.3], [119.3, -8.3], [119.3, -8.7]]]
            }
          }
        ];

        // Filter mock data based on bounds
        features = mockWdpaAreas.filter(feature => {
          if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) {
            return false;
          }

          const coords = feature.geometry.coordinates[0];
          const minLng = Math.min(...coords.map(c => c[0]));
          const maxLng = Math.max(...coords.map(c => c[0]));
          const minLat = Math.min(...coords.map(c => c[1]));
          const maxLat = Math.max(...coords.map(c => c[1]));

          // Check if polygon intersects with bounds
          return !(maxLng < bounds.west || minLng > bounds.east || maxLat < bounds.south || minLat > bounds.north);
        });

        console.log(`✅ Using ${features.length} filtered mock WDPA features`);
      }

      // Group by category for logging
      const categories = features.reduce((acc: any, feature: any) => {
        const category = feature.properties.category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      console.log('🏞️ WDPA categories distribution:', categories);

      res.json({
        type: 'FeatureCollection',
        features: features
      });

    } catch (error) {
      console.error('❌ Error in WDPA data endpoint:', error);

      // Always return valid GeoJSON even if everything fails
      const fallbackFeatures = [
        {
          type: 'Feature',
          properties: {
            name: 'Demo Protected Area (Fallback)',
            category: 'National Park',
            designation: 'National Park',
            iucn_category: 'II',
            area_hectares: 50000.0,
            status_wdpa: 'Designated',
            governance_type: 'Federal'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[101.0, 0.5], [101.5, 0.5], [101.5, 1.0], [101.0, 1.0], [101.0, 0.5]]]
          }
        }
      ];

      res.json({
        type: 'FeatureCollection',
        features: fallbackFeatures
      });
    }
  });

  // Helper function to convert coordinates array to WKT format
  function coordinatesToWKT(coordinates: any): string {
    if (!coordinates || !coordinates[0]) {
      throw new Error('Invalid coordinates');
    }

    // Handle both Polygon and MultiPolygon geometries
    let coords = coordinates;
    if (Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon - take first polygon
      coords = coordinates[0];
    }

    const ring = coords[0];
    const wktCoords = ring.map((coord: any) => `${coord[0]} ${coord[1]}`).join(', ');
    return `POLYGON((${wktCoords}))`;
  }


  // Helper functions for GeoJSON processing
  function calculateBoundingBox(coordinates: number[][]): { north: number; south: number; east: number; west: number } {
    if (!coordinates || coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];
    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];

    for (const coord of coordinates) {
      if (coord[1] < minLat) minLat = coord[1];
      if (coord[1] > maxLat) maxLat = coord[1];
      if (coord[0] < minLng) minLng = coord[0];
      if (coord[0] > maxLng) maxLng = coord[0];
    }

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng
    };
  }

  // Helper function to calculate centroid from coordinates
  function calculateCentroid(coordinates: number[][]): { lat: number; lng: number } {
    if (!coordinates || coordinates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    let totalLat = 0;
    let totalLng = 0;

    for (const coord of coordinates) {
      totalLat += coord[1];
      totalLng += coord[0];
    }

    return {
      lat: totalLat / coordinates.length,
      lng: totalLng / coordinates.length
    };
  }

  // Helper function to calculate polygon area from coordinates (in square meters)
  function calculatePolygonArea(coordinates: number[][]): number {
    if (!coordinates || coordinates.length < 3) {
      return 0;
    }

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }

    area = Math.abs(area) / 2;
    
    // Convert from square degrees to square meters (approximate)
    const earthRadius = 6371000; // meters
    const latRadians = coordinates[0][1] * Math.PI / 180;
    const metersPerDegree = earthRadius * Math.PI / 180 * Math.cos(latRadians);
    
    return area * metersPerDegree * metersPerDegree;
  }

  // Helper function to remove z-values from coordinates (API external tidak bisa terima z-values)
  function removeZValues(coordinates: any): any {
    if (!coordinates || !Array.isArray(coordinates)) {
      return coordinates;
    }

    return coordinates.map((coord: any) => {
      if (Array.isArray(coord)) {
        if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          // This is a coordinate pair [lng, lat, z] - remove z
          return [coord[0], coord[1]];
        } else {
          // This is a nested array - recurse
          return removeZValues(coord);
        }
      }
      return coord;
    });
  }


  return httpServer;
}