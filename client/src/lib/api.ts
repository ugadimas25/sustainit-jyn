import { apiRequest } from './queryClient';

export interface WDPAVerificationResult {
  isInProtectedArea: boolean;
  protectedAreas: Array<{
    id: string;
    name: string;
    designation: string;
    iucnCategory: string;
    legalStatus: string;
  }>;
  overlapPercentage: number;
  legalStatus: 'compliant' | 'restricted' | 'prohibited';
  restrictions: string[];
  verificationDate: string;
}

export interface GFWAnalysisResult {
  alertsCount: number;
  alerts: Array<{
    id: string;
    latitude: number;
    longitude: number;
    alertDate: string;
    confidence: string;
  }>;
  totalTreeCoverLoss: number;
  totalBiomassLoss: number;
  totalCarbonEmissions: number;
  protectedAreaOverlap: boolean;
  primaryForestLoss: boolean;
  analysisDate: string;
}

export interface ComprehensiveVerificationResult {
  plotId: string;
  verificationDate: string;
  complianceStatus: 'compliant' | 'low-risk' | 'medium-risk' | 'high-risk';
  risks: string[];
  wdpaAnalysis: WDPAVerificationResult;
  gfwAnalysis: GFWAnalysisResult;
  eudrCompliant: boolean;
  recommendedActions: string[];
}

export const wdpaApi = {
  verifyCoordinates: async (coordinates: number[][] | number[]): Promise<WDPAVerificationResult> => {
    const response = await apiRequest('POST', '/api/wdpa/verify-coordinates', { coordinates });
    return response.json();
  },

  getProtectedAreaDetails: async (id: string) => {
    const response = await apiRequest('GET', `/api/wdpa/protected-area/${id}`);
    return response.json();
  },

  searchByRegion: async (country: string, province?: string) => {
    const params = new URLSearchParams({ country });
    if (province) params.append('province', province);

    const response = await apiRequest('GET', `/api/wdpa/search?${params}`);
    return response.json();
  }
};

export const gfwApi = {
  getForestAnalysis: async (coordinates: number[][] | number[], year?: number): Promise<GFWAnalysisResult> => {
    const response = await apiRequest('POST', '/api/gfw/forest-analysis', { coordinates, year });
    return response.json();
  },

  getGLADAlerts: async (coordinates: number[][] | number[], startDate?: string, endDate?: string) => {
    const response = await apiRequest('POST', '/api/gfw/glad-alerts', {
      coordinates,
      startDate,
      endDate
    });
    return response.json();
  }
};

export const verificationApi = {
  comprehensiveVerification: async (plotId: string, coordinates: number[][] | number[]): Promise<ComprehensiveVerificationResult> => {
    const response = await apiRequest('POST', '/api/plots/comprehensive-verification', {
      plotId,
      coordinates
    });
    return response.json();
  }
};