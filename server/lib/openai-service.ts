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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
}

export const openaiService = new OpenAIService();