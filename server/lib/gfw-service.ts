interface GFWAlert {
  id: string;
  latitude: number;
  longitude: number;
  alertDate: string;
  confidence: 'low' | 'nominal' | 'high' | 'highest';
  umdTreeCoverDensity: number;
  wdpaProtectedAreas: boolean;
  primaryForest: boolean;
  peatlands: boolean;
  intactForestLandscapes: boolean;
  treeCoverLoss: number;
  treeCoverGain: number;
  biomassLoss: number;
  carbonEmissions: number;
}

interface GFWAnalysisResult {
  alertsCount: number;
  alerts: GFWAlert[];
  totalTreeCoverLoss: number;
  totalBiomassLoss: number;
  totalCarbonEmissions: number;
  protectedAreaOverlap: boolean;
  primaryForestLoss: boolean;
  analysisDate: string;
}

interface GFWGeometry {
  type: 'Polygon' | 'Point';
  coordinates: number[][][] | number[];
}

export class GFWService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://data-api.globalforestwatch.org/dataset';

  constructor() {
    this.apiKey = process.env.GFW_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GFW_API_KEY not found - GFW analysis will return mock data');
    }
  }

  /**
   * Get GLAD deforestation alerts for a specific area
   */
  async getGLADAlerts(
    coordinates: [number, number][] | [number, number],
    startDate: string = '2023-01-01',
    endDate: string = new Date().toISOString().split('T')[0]
  ): Promise<GFWAlert[]> {
    // Return mock data if API key is not available
    if (!this.apiKey) {
      return this.getMockGLADAlerts();
    }
    
    try {
      const geometry = this.formatGeometry(coordinates);
      
      const response = await fetch(
        `${this.baseUrl}/umd_tree_cover_loss_from_fires/latest/query?sql=` +
        encodeURIComponent(`
          SELECT 
            latitude, longitude, alert_date, confidence,
            umd_tree_cover_density_2000__threshold, wdpa_protected_areas__category,
            is__umd_regional_primary_forest_2001, is__peatland, is__intact_forest_landscapes_2016
          FROM data 
          WHERE alert_date >= '${startDate}' 
          AND alert_date <= '${endDate}'
          AND ST_Intersects(ST_GeomFromGeoJSON('${JSON.stringify(geometry)}'), the_geom)
        `),
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GFW API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.data || []).map((row: any, index: number) => ({
        id: `glad_${index}_${Date.now()}`,
        latitude: row.latitude,
        longitude: row.longitude,
        alertDate: row.alert_date,
        confidence: this.mapConfidence(row.confidence),
        umdTreeCoverDensity: row.umd_tree_cover_density_2000__threshold || 0,
        wdpaProtectedAreas: !!row.wdpa_protected_areas__category,
        primaryForest: !!row.is__umd_regional_primary_forest_2001,
        peatlands: !!row.is__peatland,
        intactForestLandscapes: !!row.is__intact_forest_landscapes_2016,
        treeCoverLoss: 0, // Will be calculated in analysis
        treeCoverGain: 0,
        biomassLoss: 0,
        carbonEmissions: 0
      }));
    } catch (error) {
      console.error('GFW GLAD alerts error:', error);
      throw new Error(`Failed to fetch GLAD alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive forest analysis for an area
   */
  async getForestAnalysis(
    coordinates: [number, number][] | [number, number],
    year: number = new Date().getFullYear()
  ): Promise<GFWAnalysisResult> {
    // Return mock data if API key is not available
    if (!this.apiKey) {
      return this.getMockAnalysisResult();
    }
    
    try {
      const geometry = this.formatGeometry(coordinates);
      const alerts = await this.getGLADAlerts(coordinates);
      
      // Get tree cover loss data
      const treeCoverLoss = await this.getTreeCoverLoss(geometry, year);
      const biomassLoss = await this.getBiomassLoss(geometry, year);
      
      // Calculate totals
      const totalTreeCoverLoss = treeCoverLoss.reduce((sum, item) => sum + (item.area || 0), 0);
      const totalBiomassLoss = biomassLoss.reduce((sum, item) => sum + (item.biomass || 0), 0);
      const totalCarbonEmissions = totalBiomassLoss * 0.47; // Approximate carbon content

      // Check for protected area and primary forest overlap
      const protectedAreaOverlap = alerts.some(alert => alert.wdpaProtectedAreas);
      const primaryForestLoss = alerts.some(alert => alert.primaryForest);

      return {
        alertsCount: alerts.length,
        alerts,
        totalTreeCoverLoss,
        totalBiomassLoss,
        totalCarbonEmissions,
        protectedAreaOverlap,
        primaryForestLoss,
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('GFW forest analysis error:', error);
      throw new Error(`Forest analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tree cover loss data
   */
  private async getTreeCoverLoss(geometry: GFWGeometry, year: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/umd_tree_cover_loss/v1.9/query?sql=` +
        encodeURIComponent(`
          SELECT umd_tree_cover_loss__year, SUM(umd_tree_cover_loss__ha) as area
          FROM data 
          WHERE umd_tree_cover_loss__year = ${year}
          AND ST_Intersects(ST_GeomFromGeoJSON('${JSON.stringify(geometry)}'), the_geom)
          GROUP BY umd_tree_cover_loss__year
        `),
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn(`Tree cover loss API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('Tree cover loss query failed:', error);
      return [];
    }
  }

  /**
   * Get biomass loss data
   */
  private async getBiomassLoss(geometry: GFWGeometry, year: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/gfw_biomass_loss/latest/query?sql=` +
        encodeURIComponent(`
          SELECT year, SUM(biomass_loss__Mg) as biomass
          FROM data 
          WHERE year = ${year}
          AND ST_Intersects(ST_GeomFromGeoJSON('${JSON.stringify(geometry)}'), the_geom)
          GROUP BY year
        `),
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn(`Biomass loss API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('Biomass loss query failed:', error);
      return [];
    }
  }

  private formatGeometry(coordinates: [number, number][] | [number, number]): GFWGeometry {
    if (Array.isArray(coordinates[0])) {
      // Polygon coordinates
      const polygon = coordinates as [number, number][];
      // Ensure polygon is closed
      const closedPolygon = [...polygon];
      if (closedPolygon[0][0] !== closedPolygon[closedPolygon.length - 1][0] ||
          closedPolygon[0][1] !== closedPolygon[closedPolygon.length - 1][1]) {
        closedPolygon.push(closedPolygon[0]);
      }
      
      return {
        type: 'Polygon',
        coordinates: [closedPolygon]
      };
    } else {
      // Point coordinates
      return {
        type: 'Point',
        coordinates: coordinates
      };
    }
  }

  private mapConfidence(confidence: string | number): 'low' | 'nominal' | 'high' | 'highest' {
    if (typeof confidence === 'number') {
      if (confidence >= 90) return 'highest';
      if (confidence >= 70) return 'high';
      if (confidence >= 50) return 'nominal';
      return 'low';
    }
    
    const conf = confidence?.toString().toLowerCase();
    if (conf?.includes('high')) return 'high';
    if (conf?.includes('nominal')) return 'nominal';
    if (conf?.includes('low')) return 'low';
    return 'nominal';
  }

  private getMockGLADAlerts(): GFWAlert[] {
    return [
      {
        id: `mock_glad_${Date.now()}`,
        latitude: -1.5,
        longitude: 112.0,
        alertDate: new Date().toISOString().split('T')[0],
        confidence: 'high',
        umdTreeCoverDensity: 75,
        wdpaProtectedAreas: false,
        primaryForest: false,
        peatlands: false,
        intactForestLandscapes: false,
        treeCoverLoss: 0.5,
        treeCoverGain: 0,
        biomassLoss: 25,
        carbonEmissions: 12
      }
    ];
  }

  private getMockAnalysisResult(): GFWAnalysisResult {
    return {
      alertsCount: 1,
      alerts: this.getMockGLADAlerts(),
      totalTreeCoverLoss: 0.5,
      totalBiomassLoss: 25,
      totalCarbonEmissions: 12,
      protectedAreaOverlap: false,
      primaryForestLoss: false,
      analysisDate: new Date().toISOString()
    };
  }
}