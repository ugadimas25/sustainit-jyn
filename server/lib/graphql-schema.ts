import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime

  type Query {
    # Lineage queries
    traceForward(entityId: ID!, entityType: String!): LineageResult!
    traceBackward(entityId: ID!, entityType: String!): LineageResult!
    getFullLineage(entityId: ID!, entityType: String!): LineageResult!
    
    # Supplier queries
    getSupplierTiers(millId: ID): [SupplierTier!]!
    getSupplierByDistance(lat: Float!, lng: Float!, radiusKm: Float!): [SupplierWithDistance!]!
    
    # Facility queries
    getFacilities(type: String): [Facility!]!
    getFacilityHierarchy(rootId: ID!): FacilityTree!
    
    # Custody chain queries
    getCustodyChains(status: String, productType: String): [CustodyChain!]!
    getCustodyEvents(chainId: ID, facilityId: ID, limit: Int): [CustodyEvent!]!
    
    # Mass balance queries
    getMassBalanceEvents(chainId: ID, facilityId: ID): [MassBalanceEvent!]!
    validateMassBalance(chainId: ID!): MassBalanceValidation!
  }

  type Mutation {
    # Chain of custody mutations
    createCustodyChain(input: CustodyChainInput!): CustodyChain!
    recordCustodyEvent(input: CustodyEventInput!): CustodyEvent!
    splitCustodyChain(input: SplitChainInput!): SplitResult!
    mergeCustodyChains(input: MergeChainInput!): MergeResult!
    
    # Mass balance mutations
    recordMassBalanceEvent(input: MassBalanceEventInput!): MassBalanceEvent!
    
    # Lineage report generation
    generateLineageReport(input: LineageReportInput!): LineageReport!
  }

  # Core types
  type LineageResult {
    entityId: ID!
    entityType: String!
    depth: Int!
    totalNodes: Int!
    nodes: [LineageNode!]!
    edges: [LineageEdge!]!
    riskAssessment: RiskAssessment
  }

  type LineageNode {
    id: ID!
    type: String!
    name: String!
    data: JSON!
    coordinates: Coordinates
    riskLevel: String
    certifications: [String!]
    distance: Float
  }

  type LineageEdge {
    source: ID!
    target: ID!
    type: String!
    quantity: Float
    date: DateTime
    metadata: JSON
  }

  type RiskAssessment {
    overallRisk: String!
    riskFactors: [RiskFactor!]!
    compliance: ComplianceStatus!
  }

  type RiskFactor {
    type: String!
    severity: String!
    description: String!
    entityId: ID!
  }

  type ComplianceStatus {
    eudrCompliant: Boolean!
    rspoCompliant: Boolean!
    issues: [String!]!
  }

  type SupplierTier {
    id: ID!
    supplier: Supplier!
    tierLevel: Int!
    parentSupplier: Supplier
    relationshipType: String!
    annualVolume: Float
    performanceScore: Float
    riskRating: String!
    distanceFromMill: Float
    transportRoute: JSON
  }

  type SupplierWithDistance {
    supplier: Supplier!
    distance: Float!
    bearing: Float!
    estimatedTravelTime: Float!
  }

  type Supplier {
    id: ID!
    name: String!
    contactPerson: String
    email: String
    phone: String
    address: String
    supplierType: String!
    plots: [Plot!]!
  }

  type Plot {
    id: ID!
    plotId: String!
    name: String!
    area: Float!
    coordinates: JSON!
    status: String!
    legalityStatus: String!
    deforestationRisk: String!
  }

  type Facility {
    id: ID!
    facilityId: String!
    name: String!
    facilityType: String!
    address: String
    coordinates: Coordinates
    parentFacility: Facility
    capacity: Float
    operationalStatus: String!
    certifications: JSON
    riskLevel: String!
    lastAuditDate: DateTime
  }

  type FacilityTree {
    facility: Facility!
    children: [FacilityTree!]!
    totalCapacity: Float!
    activeChildren: Int!
  }

  type Coordinates {
    latitude: Float!
    longitude: Float!
  }

  type CustodyChain {
    id: ID!
    chainId: String!
    sourcePlot: Plot
    sourceFacility: Facility
    destinationFacility: Facility
    productType: String!
    totalQuantity: Float!
    remainingQuantity: Float!
    status: String!
    qualityGrade: String
    batchNumber: String
    harvestDate: DateTime
    expiryDate: DateTime
    events: [CustodyEvent!]!
  }

  type CustodyEvent {
    id: ID!
    eventType: String!
    eventTime: DateTime!
    businessStep: String!
    disposition: String!
    quantity: Float
    uom: String!
    location: Coordinates
    facility: Facility
    recordedBy: User
    userData: JSON
  }

  type User {
    id: ID!
    username: String!
    name: String!
    role: String!
  }

  type MassBalanceEvent {
    id: ID!
    eventType: String!
    parentChain: CustodyChain
    childChainIds: [String!]
    inputQuantity: Float!
    outputQuantity: Float!
    conversionRate: Float
    wasteQuantity: Float
    processLocation: Facility
    processDate: DateTime!
    processedBy: User
    notes: String
  }

  type MassBalanceValidation {
    isValid: Boolean!
    totalInput: Float!
    totalOutput: Float!
    totalWaste: Float!
    efficiency: Float!
    discrepancies: [Discrepancy!]!
  }

  type Discrepancy {
    type: String!
    expected: Float!
    actual: Float!
    variance: Float!
    description: String!
  }

  type SplitResult {
    parentChain: CustodyChain!
    childChains: [CustodyChain!]!
    massBalanceEvent: MassBalanceEvent!
  }

  type MergeResult {
    parentChains: [CustodyChain!]!
    mergedChain: CustodyChain!
    massBalanceEvent: MassBalanceEvent!
  }

  type LineageReport {
    id: ID!
    reportId: String!
    reportType: String!
    lineageData: JSON!
    totalNodes: Int!
    totalLevels: Int!
    generatedAt: DateTime!
    exportUrl: String!
  }

  # Input types
  input CustodyChainInput {
    chainId: String!
    sourcePlotId: ID
    sourceFacilityId: ID
    destinationFacilityId: ID
    productType: String!
    totalQuantity: Float!
    qualityGrade: String
    batchNumber: String
    harvestDate: DateTime
  }

  input CustodyEventInput {
    chainId: ID!
    eventType: String!
    businessStep: String!
    disposition: String!
    quantity: Float
    locationId: ID
    userData: JSON
  }

  input SplitChainInput {
    parentChainId: ID!
    splits: [SplitDefinition!]!
    processLocationId: ID!
    notes: String
  }

  input SplitDefinition {
    quantity: Float!
    destinationFacilityId: ID
    qualityGrade: String
  }

  input MergeChainInput {
    parentChainIds: [ID!]!
    destinationFacilityId: ID!
    productType: String!
    qualityGrade: String
    processLocationId: ID!
    notes: String
  }

  input MassBalanceEventInput {
    eventType: String!
    parentChainId: ID
    inputQuantity: Float!
    outputQuantity: Float!
    conversionRate: Float
    wasteQuantity: Float
    processLocationId: ID!
    notes: String
  }

  input LineageReportInput {
    reportType: String!
    targetEntityId: ID!
    targetEntityType: String!
    includeRiskAssessment: Boolean
    exportFormat: String
    filters: JSON
  }
`;