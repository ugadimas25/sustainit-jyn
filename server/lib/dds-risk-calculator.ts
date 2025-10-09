/**
 * DDS Risk Calculator Utility
 * Auto-calculates deforestation risk level and legality status from plot analysis results
 */

export interface PlotAnalysisResult {
  plotId: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  complianceStatus: 'COMPLIANT' | 'NON-COMPLIANT';
}

export interface RiskCalculationResult {
  deforestationRiskLevel: 'low' | 'medium' | 'high';
  legalityStatus: 'compliant' | 'non-compliant' | 'under-review';
  complianceScore: string;
}

/**
 * Calculate DDS risk and legality from plot geolocations
 * @param plotGeolocations - Array of plot geolocation strings (format: "plotId:coordinates")
 * @param analysisResults - All available analysis results
 * @returns Risk calculation result with risk level, legality status, and compliance score
 */
export function calculateDdsRiskFromPlots(
  plotGeolocations: string[] | undefined,
  analysisResults: PlotAnalysisResult[]
): RiskCalculationResult | null {
  if (!plotGeolocations || plotGeolocations.length === 0) {
    return null;
  }

  // Extract plot IDs from plotGeolocations array
  const plotIds = plotGeolocations
    .map((geo: string) => {
      const parts = geo.split(':');
      return parts[0]; // First part is plotId
    })
    .filter(Boolean);

  if (plotIds.length === 0) {
    return null;
  }

  console.log(`🔍 Calculating DDS risk for ${plotIds.length} plots...`);

  // Filter relevant analysis results for these plots
  const relevantResults = analysisResults.filter((result) =>
    plotIds.includes(result.plotId)
  );

  if (relevantResults.length === 0) {
    console.log('⚠️ No analysis results found for selected plots');
    return null;
  }

  // Calculate overall risk level (highest risk takes precedence)
  const highRiskCount = relevantResults.filter(
    (r) => r.overallRisk === 'HIGH'
  ).length;
  const mediumRiskCount = relevantResults.filter(
    (r) => r.overallRisk === 'MEDIUM'
  ).length;

  const deforestationRiskLevel =
    highRiskCount > 0 ? 'high' : mediumRiskCount > 0 ? 'medium' : 'low';

  // Calculate legality status
  const nonCompliantCount = relevantResults.filter(
    (r) => r.complianceStatus === 'NON-COMPLIANT'
  ).length;
  const compliantCount = relevantResults.filter(
    (r) => r.complianceStatus === 'COMPLIANT'
  ).length;

  const legalityStatus =
    nonCompliantCount > 0
      ? 'non-compliant'
      : compliantCount === relevantResults.length
        ? 'compliant'
        : 'under-review';

  // Calculate compliance score (percentage of compliant plots)
  const compliancePercentage = (compliantCount / relevantResults.length) * 100;
  const complianceScore = compliancePercentage.toFixed(1);

  console.log(
    `✅ Risk calculated: ${deforestationRiskLevel}, Legality: ${legalityStatus}, Score: ${complianceScore}%`
  );

  return {
    deforestationRiskLevel,
    legalityStatus,
    complianceScore,
  };
}
