interface WDPAProtectedArea {
  id: string;
  name: string;
  designation: string;
  country: string;
  iucnCategory: string;
  designatedYear: number;
  area: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  managementAuthority: string;
  legalStatus: 'Designated' | 'Inscribed' | 'Proposed' | 'Not Reported';
  governanceType: string;
}

interface WDPAOverlapResult {
  isInProtectedArea: boolean;
  protectedAreas: WDPAProtectedArea[];
  overlapPercentage: number;
  legalStatus: 'compliant' | 'restricted' | 'prohibited';
  restrictions: string[];
  verificationDate: string;
}

export class WDPAService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.protectedplanet.net/v3';

  constructor() {
    this.apiKey = process.env.WDPA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('WDPA_API_KEY not found - WDPA verification will return mock data');
    }
  }

  /**
   * Check if plot coordinates overlap with protected areas
   */
  async checkProtectedAreaOverlap(
    coordinates: [number, number][] | [number, number]
  ): Promise<WDPAOverlapResult> {
    // Return mock data if API key is not available
    if (!this.apiKey) {
      return this.getMockWDPAResult();
    }
    
    try {
      let searchCoords: [number, number];
      
      // Handle both point and polygon coordinates
      if (Array.isArray(coordinates[0])) {
        // Polygon - use centroid
        const polygon = coordinates as [number, number][];
        searchCoords = this.calculateCentroid(polygon);
      } else {
        // Point coordinates
        searchCoords = coordinates as [number, number];
      }

      const [longitude, latitude] = searchCoords;

      // Query WDPA API for protected areas at coordinates
      const response = await fetch(
        `${this.baseUrl}/protected_areas/search?` + 
        new URLSearchParams({
          'lat': latitude.toString(),
          'lng': longitude.toString(),
          'token': this.apiKey
        })
      );

      if (!response.ok) {
        throw new Error(`WDPA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const protectedAreas: WDPAProtectedArea[] = data.protected_areas || [];

      // Determine legal status based on protected area types
      const legalStatus = this.determineLegalStatus(protectedAreas);
      const restrictions = this.getRestrictions(protectedAreas);
      const overlapPercentage = protectedAreas.length > 0 ? 100 : 0; // Simplified for point-in-polygon

      return {
        isInProtectedArea: protectedAreas.length > 0,
        protectedAreas,
        overlapPercentage,
        legalStatus,
        restrictions,
        verificationDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('WDPA verification error:', error);
      throw new Error(`Protected area verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information about a specific protected area
   */
  async getProtectedAreaDetails(protectedAreaId: string): Promise<WDPAProtectedArea | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/protected_areas/${protectedAreaId}?token=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`WDPA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.protected_area || null;
    } catch (error) {
      console.error('WDPA details error:', error);
      throw new Error(`Failed to get protected area details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search protected areas by country and region
   */
  async searchProtectedAreasByRegion(
    country: string,
    province?: string
  ): Promise<WDPAProtectedArea[]> {
    try {
      const params = new URLSearchParams({
        'country': country,
        'token': this.apiKey
      });

      if (province) {
        params.append('region', province);
      }

      const response = await fetch(
        `${this.baseUrl}/protected_areas/search?${params}`
      );

      if (!response.ok) {
        throw new Error(`WDPA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.protected_areas || [];
    } catch (error) {
      console.error('WDPA region search error:', error);
      throw new Error(`Protected area search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateCentroid(coordinates: [number, number][]): [number, number] {
    const x = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const y = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    return [x, y];
  }

  private determineLegalStatus(protectedAreas: WDPAProtectedArea[]): 'compliant' | 'restricted' | 'prohibited' {
    if (protectedAreas.length === 0) {
      return 'compliant';
    }

    // Check for strict protection categories
    const hasStrictProtection = protectedAreas.some(area => 
      area.iucnCategory === 'Ia' || // Strict Nature Reserve
      area.iucnCategory === 'Ib' || // Wilderness Area
      area.iucnCategory === 'II'    // National Park
    );

    if (hasStrictProtection) {
      return 'prohibited';
    }

    // Check for moderate protection
    const hasModerateProtection = protectedAreas.some(area =>
      area.iucnCategory === 'III' || // Natural Monument
      area.iucnCategory === 'IV'     // Habitat/Species Management Area
    );

    if (hasModerateProtection) {
      return 'restricted';
    }

    // Category V and VI allow sustainable use
    return 'restricted';
  }

  private getRestrictions(protectedAreas: WDPAProtectedArea[]): string[] {
    const restrictions: string[] = [];

    protectedAreas.forEach(area => {
      switch (area.iucnCategory) {
        case 'Ia':
        case 'Ib':
        case 'II':
          restrictions.push(`No commercial activities allowed in ${area.name} (${area.iucnCategory})`);
          break;
        case 'III':
        case 'IV':
          restrictions.push(`Limited activities allowed in ${area.name} - requires permits`);
          break;
        case 'V':
        case 'VI':
          restrictions.push(`Sustainable use permitted in ${area.name} with management approval`);
          break;
        default:
          restrictions.push(`Special regulations apply in ${area.name}`);
      }
    });

    return restrictions;
  }

  private getMockWDPAResult(): WDPAOverlapResult {
    return {
      isInProtectedArea: false,
      protectedAreas: [],
      overlapPercentage: 0,
      legalStatus: 'compliant',
      restrictions: [],
      verificationDate: new Date().toISOString()
    };
  }
}