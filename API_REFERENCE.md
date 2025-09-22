
# API Reference Documentation

This document provides comprehensive API reference for the KPN EUDR Platform, including REST endpoints, GraphQL queries, request/response formats, and integration examples.

## 🌐 Base Configuration

### Environment URLs
- **Development**: `http://localhost:5000`
- **Production**: `https://yourdomain.com`

### Authentication
All API endpoints (except public ones) require authentication via session cookies.

```javascript
// Login to get session
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password })
});
```

## 🔐 Authentication Endpoints

### POST /api/auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user@example.com",
    "role": "admin"
  }
}
```

### POST /api/auth/logout
Destroy user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/user
Get current authenticated user information.

**Response:**
```json
{
  "id": 1,
  "username": "user@example.com",
  "role": "admin",
  "lastLogin": "2024-01-15T10:30:00Z"
}
```

## 📊 Dashboard Endpoints

### GET /api/dashboard/metrics
Get key performance indicators for dashboard.

**Query Parameters:**
- `supplier_id` (optional): Filter by specific supplier
- `date_from` (optional): Start date for metrics (ISO 8601)
- `date_to` (optional): End date for metrics (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPlots": 156,
    "compliantPlots": 142,
    "highRiskPlots": 8,
    "activeAlerts": 3,
    "suppliersCount": 24,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### GET /api/dashboard/compliance-chart
Get compliance trend data for charts.

**Query Parameters:**
- `period` (optional): `"7d" | "30d" | "90d" | "1y"` (default: "30d")
- `supplier_id` (optional): Filter by supplier

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["2024-01-01", "2024-01-02", "..."],
    "compliant": [85, 87, 89, 92],
    "nonCompliant": [15, 13, 11, 8],
    "pending": [5, 3, 2, 1]
  }
}
```

### GET /api/dashboard/risk-summary
Get risk analysis summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "riskDistribution": {
      "low": 120,
      "medium": 28,
      "high": 8
    },
    "criticalAlerts": [
      {
        "id": 1,
        "type": "deforestation",
        "severity": "high",
        "plotId": "PLOT-001",
        "detectedAt": "2024-01-15T09:15:00Z"
      }
    ],
    "trendAnalysis": {
      "direction": "improving",
      "changePercent": 5.2
    }
  }
}
```

## 🗺️ Plots Management Endpoints

### GET /api/plots
List all plots with optional filtering.

**Query Parameters:**
- `supplier_id` (optional): Filter by supplier
- `status` (optional): `"active" | "inactive" | "under_review"`
- `risk_level` (optional): `"low" | "medium" | "high"`
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "plots": [
      {
        "id": 1,
        "plotId": "PLOT-001",
        "supplierId": 5,
        "name": "Main Estate Block A",
        "area": "25.7",
        "status": "active",
        "riskLevel": "low",
        "coordinates": {
          "type": "Polygon",
          "coordinates": [[[lon, lat], [lon, lat], ...]]
        },
        "lastAssessment": "2024-01-10T14:30:00Z",
        "createdAt": "2023-12-01T10:00:00Z"
      }
    ],
    "total": 156,
    "hasMore": true
  }
}
```

### GET /api/plots/:id
Get specific plot details.

**Path Parameters:**
- `id`: Plot ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "plotId": "PLOT-001",
    "supplierId": 5,
    "supplier": {
      "id": 5,
      "name": "PT Example Estate",
      "type": "estate"
    },
    "name": "Main Estate Block A",
    "area": "25.7",
    "status": "active",
    "coordinates": {
      "type": "Polygon",
      "coordinates": [[[lon, lat], [lon, lat], ...]]]
    },
    "riskAssessment": {
      "overallRisk": "low",
      "deforestationRisk": "low",
      "legalityRisk": "low",
      "lastAssessed": "2024-01-10T14:30:00Z"
    },
    "alerts": [
      {
        "id": 12,
        "type": "glad",
        "severity": "medium",
        "detectedAt": "2024-01-14T08:20:00Z",
        "status": "under_investigation"
      }
    ],
    "documents": [
      {
        "id": 45,
        "type": "land_certificate",
        "fileName": "land_cert_plot_001.pdf",
        "uploadedAt": "2024-01-05T16:00:00Z"
      }
    ]
  }
}
```

### POST /api/plots
Create new plot.

**Request Body:**
```json
{
  "plotId": "PLOT-002",
  "supplierId": 5,
  "name": "New Block B",
  "area": "15.3",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "plotId": "PLOT-002",
    "supplierId": 5,
    "name": "New Block B",
    "area": "15.3",
    "status": "active",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### PUT /api/plots/:id
Update existing plot.

**Path Parameters:**
- `id`: Plot ID

**Request Body:** (partial update supported)
```json
{
  "name": "Updated Block Name",
  "status": "under_review"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "plotId": "PLOT-001",
    "name": "Updated Block Name",
    "status": "under_review",
    "updatedAt": "2024-01-15T11:15:00Z"
  }
}
```

### DELETE /api/plots/:id
Delete plot (soft delete).

**Path Parameters:**
- `id`: Plot ID

**Response:**
```json
{
  "success": true,
  "message": "Plot deleted successfully"
}
```

### POST /api/plots/bulk-upload
Upload multiple plots via GeoJSON or KML file.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (GeoJSON or KML file, max 100MB)
- Field: `supplierId` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 25,
    "created": 23,
    "updated": 2,
    "errors": [],
    "summary": {
      "totalArea": "456.8",
      "plotIds": ["PLOT-003", "PLOT-004", "..."]
    }
  }
}
```

## 📋 EUDR Assessments Endpoints

### GET /api/eudr-assessments
List EUDR compliance assessments.

**Query Parameters:**
- `supplier_id` (optional): Filter by supplier
- `status` (optional): `"draft" | "review" | "approved" | "rejected"`
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": 1,
        "supplierType": "estate",
        "supplierName": "PT Example Estate",
        "supplierId": "EST-001",
        "status": "approved",
        "complianceScore": 92.5,
        "lastUpdated": "2024-01-10T14:30:00Z",
        "assessedBy": "auditor@example.com"
      }
    ],
    "total": 15
  }
}
```

### GET /api/eudr-assessments/:id
Get specific EUDR assessment details.

**Path Parameters:**
- `id`: Assessment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "supplierType": "estate",
    "supplierName": "PT Example Estate",
    "supplierId": "EST-001",
    "status": "approved",
    "complianceScore": 92.5,
    "landTenure": {
      "tenureType": "owned",
      "landArea": "1250.5",
      "documents": ["land_cert.pdf"]
    },
    "environmental": {
      "permitType": "environmental_permit",
      "permitNumber": "ENV-2023-001",
      "documents": ["env_permit.pdf"]
    },
    "forest": {
      "forestManagementPlan": true,
      "certificationNumber": "FSC-001",
      "documents": ["forest_cert.pdf"]
    },
    "thirdPartyRights": {
      "indigenousConsultation": true,
      "communityAgreements": true,
      "documents": ["community_agreement.pdf"]
    },
    "laborRights": {
      "fairWagePolicy": true,
      "workerSafetyProgram": true,
      "documents": ["labor_policy.pdf"]
    },
    "humanRights": {
      "antiDiscriminationPolicy": true,
      "grievanceMechanism": true,
      "documents": ["hr_policy.pdf"]
    },
    "taxAntiCorruption": {
      "taxCompliance": true,
      "antiCorruptionPolicy": true,
      "documents": ["tax_cert.pdf"]
    },
    "otherLaws": {
      "additionalCompliance": "All local regulations followed",
      "documents": ["other_docs.pdf"]
    },
    "createdAt": "2024-01-05T10:00:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
}
```

### POST /api/eudr-assessments
Create or update EUDR assessment.

**Request Body:**
```json
{
  "supplierType": "estate",
  "supplierName": "PT New Estate",
  "supplierId": "EST-002",
  "landTenure": {
    "tenureType": "owned",
    "landArea": "850.0"
  },
  "environmental": {
    "permitType": "environmental_permit",
    "permitNumber": "ENV-2024-001"
  }
  // ... other assessment fields
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "supplierType": "estate",
    "supplierName": "PT New Estate",
    "supplierId": "EST-002",
    "status": "draft",
    "complianceScore": 75.0,
    "createdAt": "2024-01-15T11:30:00Z"
  }
}
```

## 🚨 Deforestation Monitoring Endpoints

### GET /api/alerts
Get deforestation alerts.

**Query Parameters:**
- `plot_id` (optional): Filter by plot
- `status` (optional): `"active" | "investigating" | "resolved" | "false_positive"`
- `severity` (optional): `"low" | "medium" | "high" | "critical"`
- `date_from` (optional): Start date filter
- `date_to` (optional): End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "plotId": "PLOT-001",
        "alertType": "glad",
        "severity": "high",
        "detectedAt": "2024-01-14T08:20:00Z",
        "coordinates": [longitude, latitude],
        "confidence": 0.85,
        "area": "2.3",
        "status": "under_investigation",
        "notes": "Field verification scheduled",
        "assignedTo": "field_officer@example.com"
      }
    ],
    "total": 15,
    "summary": {
      "active": 8,
      "resolved": 5,
      "investigating": 2
    }
  }
}
```

### GET /api/alerts/gfw/:plotId
Get Global Forest Watch analysis for specific plot.

**Path Parameters:**
- `plotId`: Plot identifier

**Query Parameters:**
- `start_date` (optional): Analysis start date (YYYY-MM-DD)
- `end_date` (optional): Analysis end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "plotId": "PLOT-001",
    "analysisDate": "2024-01-15T12:00:00Z",
    "forestLoss": {
      "totalArea": "5.2",
      "lossEvents": [
        {
          "date": "2024-01-10",
          "area": "2.1",
          "confidence": "high",
          "coordinates": [[lon, lat], [lon, lat]]
        }
      ]
    },
    "gladAlerts": [
      {
        "date": "2024-01-14",
        "confidence": 0.92,
        "coordinates": [longitude, latitude]
      }
    ],
    "summary": {
      "riskLevel": "high",
      "alertCount": 3,
      "lastUpdate": "2024-01-15T12:00:00Z"
    }
  }
}
```

### POST /api/alerts/verify
Verify or resolve deforestation alert.

**Request Body:**
```json
{
  "alertId": 1,
  "status": "resolved",
  "verificationNotes": "Field verification confirmed natural tree fall, not deforestation",
  "verifiedBy": "field_officer@example.com",
  "evidence": ["field_photo_1.jpg", "field_photo_2.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": 1,
    "status": "resolved",
    "verifiedAt": "2024-01-15T13:00:00Z",
    "verifiedBy": "field_officer@example.com"
  }
}
```

### GET /api/multilayer-analysis
Get comprehensive multilayer analysis from external API.

**Query Parameters:**
- `coordinates`: GeoJSON polygon coordinates (required)
- `datasets`: Comma-separated list: `"GFW,JRC,SBTN"` (optional, default: all)

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "ML-001",
    "coordinates": {...},
    "results": {
      "GFW": {
        "forestLoss": "3.2",
        "alerts": 5,
        "riskScore": 0.75
      },
      "JRC": {
        "forestCover": "85.3",
        "degradation": "2.1",
        "riskScore": 0.68
      },
      "SBTN": {
        "naturalLands": "90.2",
        "biodiversityRisk": "medium",
        "riskScore": 0.72
      }
    },
    "overallRisk": "medium",
    "recommendations": [
      "Implement enhanced monitoring in identified risk areas",
      "Conduct field verification of detected changes"
    ],
    "generatedAt": "2024-01-15T14:00:00Z"
  }
}
```

## 📄 File Management Endpoints

### POST /api/files/upload
Upload documents (PDFs, images).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (max 10MB for documents)
- Field: `type` (optional): Document category
- Field: `entityId` (optional): Associated entity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "FILE-001",
    "fileName": "document.pdf",
    "fileSize": 2048576,
    "contentType": "application/pdf",
    "uploadedAt": "2024-01-15T15:00:00Z",
    "url": "/api/files/FILE-001"
  }
}
```

### GET /api/files/:id
Download uploaded file.

**Path Parameters:**
- `id`: File identifier

**Response:** Binary file content with appropriate headers.

### DELETE /api/files/:id
Delete uploaded file.

**Path Parameters:**
- `id`: File identifier

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🏗️ Supply Chain Endpoints

### GET /api/supply-chain/lineage/:entityId
Get full supply chain lineage.

**Path Parameters:**
- `entityId`: Entity identifier

**Query Parameters:**
- `entityType`: `"plot" | "facility" | "shipment"`
- `direction`: `"upstream" | "downstream" | "both"` (default: "both")

**Response:**
```json
{
  "success": true,
  "data": {
    "entityId": "PLOT-001",
    "entityType": "plot",
    "lineage": {
      "nodes": [
        {
          "id": "PLOT-001",
          "type": "plot",
          "name": "Main Estate Block A",
          "level": 0
        },
        {
          "id": "MILL-001",
          "type": "mill",
          "name": "Central Processing Mill",
          "level": 1
        }
      ],
      "edges": [
        {
          "source": "PLOT-001",
          "target": "MILL-001",
          "type": "TRANSFER",
          "quantity": "25.7",
          "date": "2024-01-10T10:00:00Z"
        }
      ]
    },
    "massBalance": {
      "totalInput": "25.7",
      "totalOutput": "23.8",
      "efficiency": 92.6
    }
  }
}
```

### POST /api/supply-chain/events
Record supply chain event.

**Request Body:**
```json
{
  "eventType": "TRANSFER",
  "sourceId": "PLOT-001",
  "destinationId": "MILL-001",
  "productType": "fresh_fruit_bunches",
  "quantity": "10.5",
  "eventDate": "2024-01-15T09:00:00Z",
  "documentation": ["transport_receipt.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "EVT-001",
    "eventType": "TRANSFER",
    "recordedAt": "2024-01-15T16:00:00Z",
    "massBalanceValid": true
  }
}
```

## 🎯 GraphQL API

The platform also provides a GraphQL endpoint at `/graphql` for complex queries.

### Schema Overview

```graphql
type Query {
  getFullLineage(entityId: String!, entityType: String!): LineageResult
  getSupplierTiers(millId: ID): [SupplierTier]
  getRiskAssessment(entityId: String!): RiskAssessment
  getComplianceSummary(filters: ComplianceFilters): ComplianceSummary
}

type Mutation {
  createEvent(input: EventInput!): Event
  updateRiskAssessment(id: ID!, input: RiskAssessmentInput!): RiskAssessment
}
```

### Example Queries

#### Get Full Supply Chain Lineage

```graphql
query GetLineage($entityId: String!, $entityType: String!) {
  getFullLineage(entityId: $entityId, entityType: $entityType) {
    entityId
    entityType
    totalNodes
    nodes {
      id
      type
      name
      riskLevel
      certifications
      coordinates {
        latitude
        longitude
      }
    }
    edges {
      source
      target
      type
      quantity
      date
    }
    riskAssessment {
      overallRisk
      riskFactors {
        type
        severity
        description
      }
      compliance {
        eudrCompliant
        rspoCompliant
      }
    }
  }
}
```

#### Get Supplier Performance

```graphql
query GetSupplierPerformance($millId: ID) {
  getSupplierTiers(millId: $millId) {
    id
    supplier {
      name
      supplierType
      location {
        country
        region
      }
    }
    tierLevel
    performanceScore
    riskRating
    certifications {
      type
      issuer
      validUntil
    }
    recentEvents {
      type
      date
      quantity
    }
  }
}
```

## 🔌 Webhook Endpoints

### POST /api/webhooks/gfw-alerts
Receive Global Forest Watch alerts (for external systems).

**Request Body:**
```json
{
  "alertType": "glad",
  "coordinates": [longitude, latitude],
  "detectedAt": "2024-01-15T08:00:00Z",
  "confidence": 0.89,
  "area": 0.25
}
```

### POST /api/webhooks/compliance-update
Receive compliance status updates.

**Request Body:**
```json
{
  "entityId": "PLOT-001",
  "entityType": "plot",
  "complianceStatus": "non_compliant",
  "reason": "Deforestation detected",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

## 🛠️ Utility Endpoints

### GET /api/health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T16:30:00Z",
  "services": {
    "database": "connected",
    "storage": "available",
    "externalApis": "operational"
  }
}
```

### GET /api/version
Get API version information.

**Response:**
```json
{
  "version": "1.0.0",
  "buildDate": "2024-01-15",
  "features": ["eudr", "traceability", "monitoring"],
  "apiVersion": "v1"
}
```

## ❌ Error Handling

All API endpoints follow consistent error response format:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "validation": ["List of validation errors"]
  },
  "timestamp": "2024-01-15T16:45:00Z"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `DUPLICATE_RESOURCE` (409)
- `EXTERNAL_API_ERROR` (502)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "plotId": "Plot ID is required",
    "coordinates": "Invalid polygon geometry"
  },
  "timestamp": "2024-01-15T16:45:00Z"
}
```

**Authentication Error:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED",
  "timestamp": "2024-01-15T16:45:00Z"
}
```

## 🚀 Rate Limiting

API endpoints are rate-limited based on user authentication:

- **Authenticated users**: 1000 requests per hour
- **Public endpoints**: 100 requests per hour per IP
- **File upload endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642176000
```

## 📱 SDKs and Integration Examples

### JavaScript/Node.js Example

```javascript
class EUDRPlatformAPI {
  constructor(baseURL, sessionCookie) {
    this.baseURL = baseURL;
    this.sessionCookie = sessionCookie;
  }

  async makeRequest(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookie,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPlots(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.makeRequest(`/api/plots?${queryString}`);
  }

  async createPlot(plotData) {
    return this.makeRequest('/api/plots', {
      method: 'POST',
      body: JSON.stringify(plotData)
    });
  }

  async uploadGeoJSON(file, supplierId) {
    const formData = new FormData();
    formData.append('file', file);
    if (supplierId) formData.append('supplierId', supplierId);

    return this.makeRequest('/api/plots/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}

// Usage example
const api = new EUDRPlatformAPI('https://yourdomain.com', 'session_cookie');

// Get all plots
const plots = await api.getPlots({ status: 'active' });

// Create new plot
const newPlot = await api.createPlot({
  plotId: 'PLOT-003',
  name: 'New Plot',
  area: '12.5',
  coordinates: { /* GeoJSON polygon */ }
});
```

### Python Example

```python
import requests
import json

class EUDRPlatformAPI:
    def __init__(self, base_url, session_cookie):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Cookie': session_cookie
        })

    def get_plots(self, **filters):
        response = self.session.get(f"{self.base_url}/api/plots", params=filters)
        response.raise_for_status()
        return response.json()

    def create_eudr_assessment(self, assessment_data):
        response = self.session.post(
            f"{self.base_url}/api/eudr-assessments",
            json=assessment_data
        )
        response.raise_for_status()
        return response.json()

    def get_deforestation_alerts(self, **filters):
        response = self.session.get(f"{self.base_url}/api/alerts", params=filters)
        response.raise_for_status()
        return response.json()

# Usage example
api = EUDRPlatformAPI('https://yourdomain.com', 'session_cookie')

# Get high-risk plots
high_risk_plots = api.get_plots(risk_level='high')

# Get recent alerts
recent_alerts = api.get_deforestation_alerts(
    date_from='2024-01-01',
    status='active'
)
```

---

This API reference provides comprehensive documentation for integrating with the KPN EUDR Platform. For additional support or clarification on specific endpoints, refer to the main system documentation or contact the development team.
