import { storage } from "../storage";
import { chainOfCustodyService } from "./chain-of-custody-service";
import { lineageService } from "./lineage-service";
import { massBalanceService } from "./mass-balance-service";
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom scalar for JSON
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
});

// Custom scalar for DateTime
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize: (value: any) => value instanceof Date ? value.toISOString() : value,
  parseValue: (value: any) => new Date(value),
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  JSON: JSONScalar,
  DateTime: DateTimeScalar,

  Query: {
    // Lineage queries
    traceForward: async (_: any, { entityId, entityType }: any) => {
      return await lineageService.traceForward(entityId, entityType);
    },

    traceBackward: async (_: any, { entityId, entityType }: any) => {
      return await lineageService.traceBackward(entityId, entityType);
    },

    getFullLineage: async (_: any, { entityId, entityType }: any) => {
      return await lineageService.getFullLineage(entityId, entityType);
    },

    // Supplier queries
    getSupplierTiers: async (_: any, { millId }: any) => {
      return await storage.getSupplierTiers(millId);
    },

    getSupplierByDistance: async (_: any, { lat, lng, radiusKm }: any) => {
      return await storage.getSuppliersByDistance(lat, lng, radiusKm);
    },

    // Facility queries
    getFacilities: async (_: any, { type }: any) => {
      return await storage.getFacilities(type);
    },

    getFacilityHierarchy: async (_: any, { rootId }: any) => {
      return await storage.getFacilityHierarchy(rootId);
    },

    // Custody chain queries
    getCustodyChains: async (_: any, { status, productType }: any) => {
      return await storage.getCustodyChains(status, productType);
    },

    getCustodyEvents: async (_: any, { chainId, facilityId, limit }: any) => {
      return await storage.getCustodyEvents(chainId, facilityId, limit);
    },

    // Mass balance queries
    getMassBalanceEvents: async (_: any, { chainId, facilityId }: any) => {
      return await storage.getMassBalanceEvents(chainId, facilityId);
    },

    validateMassBalance: async (_: any, { chainId }: any) => {
      return await massBalanceService.validateChain(chainId);
    },
  },

  Mutation: {
    // Chain of custody mutations
    createCustodyChain: async (_: any, { input }: any) => {
      return await chainOfCustodyService.createChain(input);
    },

    recordCustodyEvent: async (_: any, { input }: any) => {
      return await chainOfCustodyService.recordEvent(input);
    },

    splitCustodyChain: async (_: any, { input }: any) => {
      return await chainOfCustodyService.splitChain(input);
    },

    mergeCustodyChains: async (_: any, { input }: any) => {
      return await chainOfCustodyService.mergeChains(input);
    },

    // Mass balance mutations
    recordMassBalanceEvent: async (_: any, { input }: any) => {
      return await massBalanceService.recordEvent(input);
    },

    // Lineage report generation
    generateLineageReport: async (_: any, { input }: any) => {
      return await lineageService.generateReport(input);
    },
  },

  // Field resolvers
  CustodyChain: {
    sourcePlot: async (chain: any) => {
      if (chain.sourcePlotId) {
        return await storage.getPlot(chain.sourcePlotId);
      }
      return null;
    },

    sourceFacility: async (chain: any) => {
      if (chain.sourceFacilityId) {
        return await storage.getFacility(chain.sourceFacilityId);
      }
      return null;
    },

    destinationFacility: async (chain: any) => {
      if (chain.destinationFacilityId) {
        return await storage.getFacility(chain.destinationFacilityId);
      }
      return null;
    },

    events: async (chain: any) => {
      return await storage.getCustodyEventsByChain(chain.id);
    },
  },

  CustodyEvent: {
    facility: async (event: any) => {
      if (event.locationId) {
        return await storage.getFacility(event.locationId);
      }
      return null;
    },

    recordedBy: async (event: any) => {
      if (event.recordedBy) {
        return await storage.getUser(event.recordedBy);
      }
      return null;
    },

    location: (event: any) => {
      if (event.location && event.location.latitude && event.location.longitude) {
        return {
          latitude: event.location.latitude,
          longitude: event.location.longitude,
        };
      }
      return null;
    },
  },

  Facility: {
    coordinates: (facility: any) => {
      if (facility.coordinates && facility.coordinates.latitude && facility.coordinates.longitude) {
        return {
          latitude: facility.coordinates.latitude,
          longitude: facility.coordinates.longitude,
        };
      }
      return null;
    },

    parentFacility: async (facility: any) => {
      if (facility.parentFacilityId) {
        return await storage.getFacility(facility.parentFacilityId);
      }
      return null;
    },
  },

  Supplier: {
    plots: async (supplier: any) => {
      return await storage.getPlotsBySupplier(supplier.id);
    },
  },

  SupplierTier: {
    supplier: async (tier: any) => {
      return await storage.getSupplier(tier.supplierId);
    },

    parentSupplier: async (tier: any) => {
      if (tier.parentSupplierId) {
        return await storage.getSupplier(tier.parentSupplierId);
      }
      return null;
    },
  },

  MassBalanceEvent: {
    parentChain: async (event: any) => {
      if (event.parentChainId) {
        return await storage.getCustodyChain(event.parentChainId);
      }
      return null;
    },

    processLocation: async (event: any) => {
      if (event.processLocation) {
        return await storage.getFacility(event.processLocation);
      }
      return null;
    },

    processedBy: async (event: any) => {
      if (event.processedBy) {
        return await storage.getUser(event.processedBy);
      }
      return null;
    },
  },
};