
# Dashboard Compliance Table - User Journey & System Logic

## User Journey

### 1. Data Input Phase
1. **Plot Upload**: User uploads GeoJSON files containing plot polygons via the Plot Mapping page
2. **Analysis Processing**: System processes each plot against deforestation datasets (GFW, JRC, SBTN)
3. **Risk Classification**: Each plot gets classified as LOW, MEDIUM, or HIGH risk based on forest loss data
4. **Data Storage**: Analysis results are stored in `analysis_results` table with risk levels

### 2. Dashboard Access
1. User navigates to Dashboard page (`/dashboard`)
2. Dashboard component loads and queries `/api/dashboard/metrics` endpoint
3. System calculates real-time metrics from stored analysis results
4. Compliance table is populated with supplier-level aggregated data

## System Logic Flow

### Data Processing Pipeline

```
GeoJSON Upload → Risk Analysis → Database Storage → Dashboard Aggregation → Table Display
```

### 1. Plot Analysis & Classification
**Location**: `server/routes.ts` - `/api/analyze-plots` endpoint

```typescript
// Risk determination logic based on actual loss area values (in hectares)
if (gfwLossArea > 0.01 || jrcLossArea > 0.01 || sbtnLossArea > 0.01) {
  overallRisk = "HIGH";
  complianceStatus = "NON-COMPLIANT";
} else if (gfwLossArea > 0 || jrcLossArea > 0 || sbtnLossArea > 0) {
  overallRisk = "MEDIUM";
  complianceStatus = "NON-COMPLIANT";
} else {
  overallRisk = "LOW";
  complianceStatus = "COMPLIANT";
}
```

### 2. Dashboard Metrics Calculation
**Location**: `server/routes.ts` - `/api/dashboard/metrics` endpoint

The system aggregates data from `analysis_results` table:

```sql
SELECT 
  COUNT(*) as totalPlots,
  COUNT(CASE WHEN compliance_status = 'COMPLIANT' THEN 1 END) as compliantPlots,
  COUNT(CASE WHEN overall_risk = 'HIGH' THEN 1 END) as highRiskPlots,
  COUNT(CASE WHEN overall_risk = 'MEDIUM' THEN 1 END) as mediumRiskPlots,
  SUM(area) as totalArea
FROM analysis_results
```

### 3. Compliance Table Data Structure

**Location**: `client/src/pages/dashboard.tsx`

The compliance table displays hardcoded supplier data with the following logic:

| Column | Data Source | Calculation Logic |
|--------|-------------|-------------------|
| **Supplier Name** | Static data | Predefined supplier names (Estate 1, Estate 2, etc.) |
| **Total Plots** | Static data | Manually assigned plot counts per supplier |
| **Compliant** | Static calculation | `Total Plots - Medium Risk - High Risk` |
| **Low Risk** | Static calculation | Same as Compliant (assumes Low Risk = Compliant) |
| **Medium Risk** | Static data | Predefined medium risk plot counts |
| **High Risk** | Static data | Predefined high risk plot counts |
| **Area (Ha)** | Static data | Predefined area values per supplier |
| **Compliance %** | Calculated | `(Compliant / Total Plots) * 100` |

## Current Implementation Details

### Real-time Data vs Static Data
- **Real-time Data**: Used for main dashboard metrics (total plots, compliance counts)
- **Static Data**: Used for supplier breakdown table (currently hardcoded)

### Data Flow Architecture

```
1. analysis_results table (real plot data)
   ↓
2. /api/dashboard/metrics (aggregated metrics)
   ↓  
3. Dashboard component (displays real metrics + static table)
```

### Key Components

1. **Database Table**: `analysis_results`
   - Stores individual plot analysis results
   - Contains risk levels, compliance status, areas

2. **API Endpoint**: `/api/dashboard/metrics`
   - Aggregates plot data into summary metrics
   - Returns counts and totals for dashboard cards

3. **Dashboard Component**: `client/src/pages/dashboard.tsx`
   - Displays real-time metrics in top cards
   - Shows static supplier table with hardcoded data

## Integration Points

### Plot Data Integration
- Real plot data flows from Plot Mapping → Analysis → Dashboard metrics
- Individual plot details available via modals when clicking on risk counts

### Supplier Data Integration
- Currently disconnected from real supplier/plot relationships
- Table shows sample data for demonstration purposes
- Future enhancement needed to link actual suppliers to analyzed plots

## Compliance Calculation Logic

### Risk Level Determination
```typescript
// HIGH RISK: Any deforestation detected
if (gfwLoss || jrcLoss || sbtnLoss) return "HIGH";

// MEDIUM RISK: Intersection with risk datasets but no deforestation  
if (highRiskDatasets.length > 0) return "MEDIUM";

// LOW RISK: No risk indicators
return "LOW";
```

### Compliance Status
```typescript
// COMPLIANT: Only low risk plots
if (overallRisk === "LOW") return "COMPLIANT";

// NON-COMPLIANT: Any medium or high risk
return "NON-COMPLIANT";
```

## Future Enhancements

1. **Dynamic Supplier Mapping**: Link real suppliers to analyzed plots
2. **Real-time Table Updates**: Calculate supplier metrics from actual data
3. **Drill-down Capabilities**: Navigate from supplier row to individual plots
4. **Historical Tracking**: Track compliance changes over time
