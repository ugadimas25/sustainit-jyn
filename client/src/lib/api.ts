import { apiRequest } from "./queryClient";

// Global Forest Watch API Integration
export const gfwApi = {
  // Check deforestation for a specific plot
  checkDeforestation: async (plotId: string, coordinates: any) => {
    const response = await apiRequest("POST", "/api/gfw/check-deforestation", {
      plotId,
      coordinates
    });
    return response.json();
  },

  // Get GLAD alerts for a region
  getGladAlerts: async (bbox: number[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({
      bbox: bbox.join(','),
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    
    const response = await apiRequest("GET", `/api/gfw/glad-alerts?${params}`);
    return response.json();
  },

  // Test GFW API connection
  testConnection: async () => {
    const response = await apiRequest("POST", "/api/gfw/test-connection");
    return response.json();
  },

  // Update GFW monitoring settings
  updateSettings: async (settings: {
    alertFrequency: string;
    confidenceThreshold: string;
    bufferZone: number;
  }) => {
    const response = await apiRequest("POST", "/api/gfw/settings", settings);
    return response.json();
  }
};

// World Database on Protected Areas (WDPA) API Integration
export const wdpaApi = {
  // Check if plot overlaps with protected areas
  checkProtectedAreas: async (plotId: string, coordinates: any) => {
    const response = await apiRequest("POST", "/api/wdpa/check-protected-areas", {
      plotId,
      coordinates
    });
    return response.json();
  },

  // Get protected areas in a region
  getProtectedAreas: async (bbox: number[]) => {
    const params = new URLSearchParams({
      bbox: bbox.join(',')
    });
    
    const response = await apiRequest("GET", `/api/wdpa/protected-areas?${params}`);
    return response.json();
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/suppliers");
    return response.json();
  },

  create: async (supplier: any) => {
    const response = await apiRequest("POST", "/api/suppliers", supplier);
    return response.json();
  },

  update: async (id: string, supplier: any) => {
    const response = await apiRequest("PUT", `/api/suppliers/${id}`, supplier);
    return response.json();
  }
};

// Plots API
export const plotsApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/plots");
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiRequest("GET", `/api/plots/${id}`);
    return response.json();
  },

  create: async (plot: any) => {
    const response = await apiRequest("POST", "/api/plots", plot);
    return response.json();
  },

  update: async (id: string, plot: any) => {
    const response = await apiRequest("PUT", `/api/plots/${id}`, plot);
    return response.json();
  },

  getDocuments: async (plotId: string) => {
    const response = await apiRequest("GET", `/api/plots/${plotId}/documents`);
    return response.json();
  },

  getAlerts: async (plotId: string) => {
    const response = await apiRequest("GET", `/api/plots/${plotId}/alerts`);
    return response.json();
  }
};

// Documents API
export const documentsApi = {
  create: async (document: any) => {
    const response = await apiRequest("POST", "/api/documents", document);
    return response.json();
  },

  update: async (id: string, document: any) => {
    const response = await apiRequest("PUT", `/api/documents/${id}`, document);
    return response.json();
  },

  verify: async (id: string, status: string, notes?: string) => {
    const response = await apiRequest("PUT", `/api/documents/${id}/verify`, {
      verificationStatus: status,
      notes
    });
    return response.json();
  }
};

// Alerts API
export const alertsApi = {
  getRecent: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest("GET", `/api/alerts${params}`);
    return response.json();
  },

  update: async (id: string, alert: any) => {
    const response = await apiRequest("PUT", `/api/alerts/${id}`, alert);
    return response.json();
  },

  resolve: async (id: string, notes: string) => {
    const response = await apiRequest("PUT", `/api/alerts/${id}/resolve`, {
      status: "resolved",
      investigationNotes: notes
    });
    return response.json();
  }
};

// Mills API
export const millsApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/mills");
    return response.json();
  }
};

// Deliveries API
export const deliveriesApi = {
  create: async (delivery: any) => {
    const response = await apiRequest("POST", "/api/deliveries", delivery);
    return response.json();
  },

  getByPlot: async (plotId: string) => {
    const response = await apiRequest("GET", `/api/deliveries/plot/${plotId}`);
    return response.json();
  },

  getByMill: async (millId: string) => {
    const response = await apiRequest("GET", `/api/deliveries/mill/${millId}`);
    return response.json();
  }
};

// Shipments API
export const shipmentsApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/shipments");
    return response.json();
  },

  create: async (shipment: any) => {
    const response = await apiRequest("POST", "/api/shipments", shipment);
    return response.json();
  },

  getTraceability: async (shipmentId: string) => {
    const response = await apiRequest("GET", `/api/shipments/${shipmentId}/traceability`);
    return response.json();
  }
};

// DDS Reports API
export const ddsReportsApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/dds-reports");
    return response.json();
  },

  create: async (report: any) => {
    const response = await apiRequest("POST", "/api/dds-reports", report);
    return response.json();
  },

  generate: async (id: string, format: 'pdf' | 'xml') => {
    const response = await apiRequest("POST", `/api/dds-reports/${id}/generate`, { format });
    return response.json();
  },

  download: async (id: string, format: 'pdf' | 'xml' = 'pdf') => {
    const response = await apiRequest("GET", `/api/dds-reports/${id}/download?format=${format}`);
    return response.blob();
  },

  update: async (id: string, report: any) => {
    const response = await apiRequest("PUT", `/api/dds-reports/${id}`, report);
    return response.json();
  }
};

// Surveys API
export const surveysApi = {
  getAll: async () => {
    const response = await apiRequest("GET", "/api/surveys");
    return response.json();
  },

  create: async (survey: any) => {
    const response = await apiRequest("POST", "/api/surveys", survey);
    return response.json();
  },

  getTemplates: async () => {
    const response = await apiRequest("GET", "/api/surveys/templates");
    return response.json();
  }
};

// Survey Responses API
export const surveyResponsesApi = {
  create: async (response: any) => {
    const response_data = await apiRequest("POST", "/api/survey-responses", response);
    return response_data.json();
  },

  getByPlot: async (plotId: string) => {
    const response = await apiRequest("GET", `/api/survey-responses/plot/${plotId}`);
    return response.json();
  }
};

// Dashboard API
export const dashboardApi = {
  getMetrics: async () => {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  },

  getComplianceTrends: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const response = await apiRequest("GET", `/api/dashboard/compliance-trends${params}`);
    return response.json();
  }
};

// File Upload API
export const fileUploadApi = {
  uploadDocument: async (file: File, plotId?: string, supplierId?: string, documentType?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (plotId) formData.append('plotId', plotId);
    if (supplierId) formData.append('supplierId', supplierId);
    if (documentType) formData.append('documentType', documentType);

    const response = await fetch('/api/upload/document', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  uploadPolygons: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/polygons', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }
};
