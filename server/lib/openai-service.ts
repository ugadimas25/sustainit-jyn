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
      console.log('Falling back to rule-based analysis due to OpenAI unavailability');
      
      // Fallback analysis when OpenAI is unavailable
      return this.generateFallbackAnalysis(request);
    }
  }
  
  private generateFallbackAnalysis(request: { supplierName: string; formData: any; analysisType: string }) {
    // Rule-based analysis when OpenAI is unavailable
    const formData = request.formData;
    let score = 100;
    const riskFactors = [];
    const complianceGaps = [];
    const mitigationPlan = [];
    
    // Check common compliance fields
    const requiredFields = [
      'namaSupplier', 'alamatSupplier', 'kontakSupplier', 'jenisSupplier',
      'statusLegalitas', 'nomorIzin', 'tanggalBerlaku', 'luasKebun',
      'jumlahPekerjaTetap', 'jumlahPekerjaKontrak'
    ];
    
    let missingFields = 0;
    for (const field of requiredFields) {
      if (!formData[field] || formData[field] === '' || formData[field] === null) {
        missingFields++;
        score -= 8;
      }
    }
    
    if (missingFields > 0) {
      riskFactors.push(`${missingFields} missing required fields`);
      complianceGaps.push({
        category: 'Documentation',
        description: `Missing ${missingFields} required supplier information fields`,
        priority: missingFields > 5 ? 'HIGH' : 'MEDIUM',
        impact: 'Incomplete supplier profile affects risk assessment accuracy'
      });
    }
    
    // Check sustainability documents
    const sustainabilityDocs = ['sertifikatRSPO', 'sertifikatISCC', 'sertifikatISPO'];
    const missingSustainabilityDocs = sustainabilityDocs.filter(doc => !formData[doc] || formData[doc] === 'Tidak Ada');
    
    if (missingSustainabilityDocs.length > 0) {
      score -= missingSustainabilityDocs.length * 15;
      riskFactors.push('Missing sustainability certifications');
      complianceGaps.push({
        category: 'Sustainability',
        description: `Missing certifications: ${missingSustainabilityDocs.join(', ')}`,
        priority: 'HIGH',
        impact: 'Sustainability compliance cannot be verified'
      });
    }
    
    // Check legal compliance
    if (!formData.statusLegalitas || formData.statusLegalitas === 'Tidak Lengkap') {
      score -= 20;
      riskFactors.push('Incomplete legal documentation');
      complianceGaps.push({
        category: 'Legal',
        description: 'Legal documentation is incomplete or missing',
        priority: 'CRITICAL',
        impact: 'Legal compliance status unclear'
      });
    }
    
    // Check environmental compliance
    if (!formData.analisisDampakLingkungan || formData.analisisDampakLingkungan === 'Tidak Ada') {
      score -= 10;
      riskFactors.push('Missing environmental impact analysis');
      complianceGaps.push({
        category: 'Environmental',
        description: 'Environmental impact analysis not provided',
        priority: 'MEDIUM',
        impact: 'Environmental compliance cannot be assessed'
      });
    }
    
    // Generate mitigation plan
    if (complianceGaps.length > 0) {
      mitigationPlan.push({
        phase: 'Immediate (0-30 days)',
        actions: ['Request missing documentation', 'Verify legal status'],
        timeline: '30 days',
        priority: 'HIGH'
      });
      
      mitigationPlan.push({
        phase: 'Short-term (1-3 months)',
        actions: ['Obtain sustainability certifications', 'Complete environmental assessments'],
        timeline: '90 days',
        priority: 'MEDIUM'
      });
    }
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (score < 40) riskLevel = 'CRITICAL';
    else if (score < 60) riskLevel = 'HIGH';
    else if (score < 80) riskLevel = 'MEDIUM';
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    return {
      overallScore: score,
      riskLevel,
      riskFactors,
      complianceGaps,
      mitigationPlan,
      summary: `Rule-based analysis completed for ${request.supplierName}. ${complianceGaps.length} compliance gaps identified with overall score of ${score}/100.`,
      recommendations: [
        'Complete all missing documentation fields',
        'Obtain required sustainability certifications',
        'Ensure legal compliance documentation is up to date',
        'Conduct environmental impact assessment if required'
      ]
    };
  }
}

export const openaiService = new OpenAIService();