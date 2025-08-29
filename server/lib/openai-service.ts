import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIAnalysisRequest {
  query: string;
  plotData?: any[];
  alertData?: any[];
  context?: {
    selectedPlot?: any;
    selectedAlert?: any;
    filters?: any;
  };
}

export interface AIAnalysisResponse {
  response: string;
  suggestions?: string[];
  insights?: string[];
}

export interface ComplianceAnalysisRequest {
  supplierName: string;
  formData: any;
  analysisType: 'risk_assessment' | 'compliance_scoring' | 'full_analysis';
}

export interface ComplianceAnalysisResponse {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: {
    category: string;
    risk: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }[];
  complianceGaps: {
    area: string;
    issue: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
  }[];
  mitigationPlan: {
    phase: string;
    actions: string[];
    timeline: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  summary: string;
  recommendations: string[];
}

export class OpenAIService {
  async analyzeEUDRData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const systemPrompt = `You are an AI assistant specialized in EUDR (EU Deforestation Regulation) compliance monitoring and analysis. You help analyze:

- Palm oil plantation plot data
- Deforestation alerts from satellite monitoring
- Compliance status and risk assessments
- WDPA protected area overlaps
- Global Forest Watch (GFW) analysis data

Provide clear, actionable insights focused on:
- Compliance risks and recommendations
- Deforestation patterns and trends
- Protected area violations
- Supply chain sustainability
- Regulatory compliance status

Always format your response as JSON with:
- response: Main analysis text
- suggestions: Array of actionable recommendations (max 3)
- insights: Array of key insights (max 3)

Keep responses concise and technical but accessible.`;

      const contextData = {
        totalPlots: request.plotData?.length || 0,
        totalAlerts: request.alertData?.length || 0,
        highRiskPlots: request.plotData?.filter(p => p.complianceStatus === 'high-risk').length || 0,
        criticalAlerts: request.alertData?.filter(a => a.severity === 'critical').length || 0,
        filters: request.context?.filters,
        selectedPlot: request.context?.selectedPlot,
        selectedAlert: request.context?.selectedAlert
      };

      const userPrompt = `
Query: ${request.query}

Current EUDR Monitoring Data:
- Total Plots: ${contextData.totalPlots}
- Total Active Alerts: ${contextData.totalAlerts}
- High Risk Plots: ${contextData.highRiskPlots}
- Critical Alerts: ${contextData.criticalAlerts}

${request.context?.selectedPlot ? `Selected Plot: ${JSON.stringify(request.context.selectedPlot, null, 2)}` : ''}
${request.context?.selectedAlert ? `Selected Alert: ${JSON.stringify(request.context.selectedAlert, null, 2)}` : ''}

Please analyze this data and provide insights relevant to the query.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        response: result.response || 'Analysis completed.',
        suggestions: result.suggestions || [],
        insights: result.insights || []
      };

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error('Failed to analyze data with AI');
    }
  }

  async generateEUDRSummary(plotData: any[], alertData: any[]): Promise<string> {
    try {
      const prompt = `Generate a concise EUDR compliance summary for:
- ${plotData.length} palm oil plots
- ${alertData.length} deforestation alerts
- ${plotData.filter(p => p.complianceStatus === 'high-risk').length} high-risk plots

Focus on key compliance metrics, risk areas, and immediate actions needed. Keep it under 200 words.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      return completion.choices[0].message.content || 'Summary not available.';

    } catch (error) {
      console.error('OpenAI summary error:', error);
      return 'Unable to generate AI summary at this time.';
    }
  }

  async analyzeSupplierCompliance(request: ComplianceAnalysisRequest): Promise<ComplianceAnalysisResponse> {
    try {
      const systemPrompt = `You are an expert compliance analyst specializing in Indonesian palm oil industry regulations and EUDR requirements. You analyze supplier compliance forms to assess legal compliance risks.

Your analysis covers 8 key areas:
1. Hak Penggunaan Tanah (Land Use Rights)
2. Perlindungan Lingkungan Hidup (Environmental Protection)
3. Peraturan Kehutanan (Forestry Regulations)
4. Hak Pihak Ketiga dan Masyarakat Adat (Third Party and Indigenous Rights)
5. Kewajiban Pengembangan Plasma (Plasma Development Obligations)
6. Sengketa Lahan (Land Disputes)
7. Hak Buruh dan HAM (Labor Rights and Human Rights)
8. Perpajakan dan Antikorupsi (Taxation and Anti-Corruption)

Provide comprehensive risk assessment with:
- Overall compliance score (0-100)
- Risk level categorization
- Detailed risk factors by category
- Compliance gaps identification
- Structured mitigation plan with phases
- Actionable recommendations

Always respond in JSON format with the exact structure requested.`;

      const analysisPrompt = `Analyze the compliance form for supplier: ${request.supplierName}

Form Data Analysis:
${JSON.stringify(request.formData, null, 2)}

Provide a comprehensive compliance analysis including:

1. Calculate an overall compliance score (0-100) based on completeness and quality of documentation
2. Assess risk level (LOW/MEDIUM/HIGH/CRITICAL) based on missing documents and regulatory gaps
3. Identify specific risk factors in each compliance category
4. List compliance gaps with priority levels
5. Create a structured mitigation plan with phases and timelines
6. Provide summary and actionable recommendations

Consider these factors in your analysis:
- Missing or incomplete documentation
- Quality and authenticity indicators
- Regulatory requirement fulfillment
- Risk exposure levels
- Implementation gaps
- Legal compliance status

Respond in JSON format with the exact structure specified in the interface.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Validate and structure the response
      return {
        overallScore: result.overallScore || 0,
        riskLevel: result.riskLevel || 'MEDIUM',
        riskFactors: result.riskFactors || [],
        complianceGaps: result.complianceGaps || [],
        mitigationPlan: result.mitigationPlan || [],
        summary: result.summary || 'Analysis completed.',
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('OpenAI compliance analysis error:', error);
      throw new Error('Failed to analyze supplier compliance with AI');
    }
  }
}

export const openaiService = new OpenAIService();