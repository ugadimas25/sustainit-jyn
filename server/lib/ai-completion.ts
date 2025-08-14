import OpenAI from "openai";

// Define the FarmerData interface based on our farmer data structure
interface FarmerData {
  id: string;
  respondentSerialNumber: string;
  dataCollectionOfficer: string;
  farmerName: string;
  nationalId: string;
  birthPlaceDate: string;
  sex: string;
  education: string;
  province: string;
  regencyCity: string;
  district: string;
  village: string;
  farmerAddress: string;
  farmPlotNumber: string;
  landTenure: string;
  landDocumentNumber: string;
  landAreaPerDocument?: number;
  croppingPattern: string;
  mainCommodity: string;
  otherCommodities?: string;
  plantedArea?: number;
  yearPlanted: string;
  yearReplanted?: string;
  standingTrees?: number;
  annualProduction: number;
  productivity: number;
  seedSource: string;
  landType: string;
  fertilizerType: string;
  salesPartner: string;
  organizationName: string;
  groupNumber: string;
  organizationCommodities: string;
  organizationAddress: string;
  coordinates?: Array<{ longitude: string; latitude: string }>;
  dataStatus: string;
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CompletionSuggestion {
  field: string;
  value: string;
  confidence: number;
  reasoning: string;
}

export interface DocumentValidation {
  isValid: boolean;
  completeness: number;
  missingFields: string[];
  recommendations: string[];
  complianceIssues: string[];
}

export class AICompletionService {
  // Auto-complete missing farmer information based on existing data
  async suggestCompletions(partialData: Partial<FarmerData>): Promise<CompletionSuggestion[]> {
    try {
      const prompt = `
You are an AI assistant specializing in Indonesian agricultural compliance and EUDR (European Union Deforestation Regulation) documentation. 

Analyze the following partial farmer data and suggest logical completions for missing fields based on:
1. Indonesian agricultural practices
2. Palm oil cultivation standards
3. EUDR compliance requirements
4. Regional agricultural patterns

Partial farmer data:
${JSON.stringify(partialData, null, 2)}

Provide suggestions in JSON format with this structure:
{
  "suggestions": [
    {
      "field": "fieldName",
      "value": "suggested_value",
      "confidence": 0.85,
      "reasoning": "Explanation of why this value makes sense"
    }
  ]
}

Focus on logical, realistic suggestions based on:
- Indonesian agricultural regions and their typical crops
- Standard palm oil cultivation practices
- Common land tenure patterns in Indonesia
- Typical farmer organization structures
- Realistic production metrics for the region

Only suggest values for fields that are currently empty or incomplete. Be conservative with confidence scores.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in Indonesian agricultural compliance and EUDR documentation. Provide accurate, realistic suggestions based on authentic agricultural practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Error generating AI completions:', error);
      return [];
    }
  }

  // Validate document completeness and compliance
  async validateDocument(farmerData: Partial<FarmerData>): Promise<DocumentValidation> {
    try {
      const prompt = `
Analyze this farmer data for EUDR compliance and document completeness:

${JSON.stringify(farmerData, null, 2)}

Evaluate based on:
1. EUDR requirements for palm oil supply chain documentation
2. Indonesian agricultural regulation compliance (STDB requirements)
3. Data completeness for legal cultivation certification
4. Geospatial and land tenure verification needs

Provide validation results in JSON format:
{
  "isValid": boolean,
  "completeness": percentage_0_to_100,
  "missingFields": ["field1", "field2"],
  "recommendations": ["specific improvement suggestions"],
  "complianceIssues": ["potential legal or regulatory concerns"]
}

Focus on critical EUDR requirements:
- Land tenure documentation
- Geospatial plot verification
- Deforestation-free cultivation proof
- Supply chain traceability
- Legal cultivation status
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are an expert in EUDR compliance and Indonesian agricultural regulations. Provide thorough validation based on actual legal requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{"isValid": false, "completeness": 0}');
      return {
        isValid: result.isValid || false,
        completeness: Math.min(100, Math.max(0, result.completeness || 0)),
        missingFields: result.missingFields || [],
        recommendations: result.recommendations || [],
        complianceIssues: result.complianceIssues || []
      };
    } catch (error) {
      console.error('Error validating document:', error);
      return {
        isValid: false,
        completeness: 0,
        missingFields: [],
        recommendations: ['Unable to validate document due to technical error'],
        complianceIssues: ['Document validation service unavailable']
      };
    }
  }

  // Generate compliance summary and recommendations
  async generateComplianceSummary(farmerData: FarmerData): Promise<{
    summary: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFindings: string[];
    nextSteps: string[];
  }> {
    try {
      const prompt = `
Generate a compliance summary for this farmer data in the context of EUDR (EU Deforestation Regulation):

${JSON.stringify(farmerData, null, 2)}

Analyze:
1. EUDR compliance status
2. Documentation completeness
3. Risk assessment for deforestation/legal issues
4. Supply chain traceability readiness

Provide analysis in JSON format:
{
  "summary": "Comprehensive summary of compliance status",
  "riskLevel": "low|medium|high|critical",
  "keyFindings": ["Important observations about the data"],
  "nextSteps": ["Specific actions recommended"]
}

Consider:
- Land tenure legality
- GPS coordinate validation
- Production data consistency
- Documentation gaps
- Regulatory compliance
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an EUDR compliance expert. Provide professional risk assessment and actionable recommendations."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{"summary": "Analysis unavailable"}');
      return {
        summary: result.summary || 'Analysis unavailable',
        riskLevel: result.riskLevel || 'medium',
        keyFindings: result.keyFindings || [],
        nextSteps: result.nextSteps || []
      };
    } catch (error) {
      console.error('Error generating compliance summary:', error);
      return {
        summary: 'Unable to generate compliance summary due to technical error',
        riskLevel: 'medium',
        keyFindings: [],
        nextSteps: ['Retry compliance analysis', 'Manual review recommended']
      };
    }
  }

  // Generate smart field suggestions based on context
  async getFieldSuggestions(fieldName: string, currentValue: string, context: Partial<FarmerData>): Promise<string[]> {
    try {
      const prompt = `
Provide realistic suggestions for the field "${fieldName}" with current value "${currentValue}" in the context of Indonesian palm oil farming.

Context data:
${JSON.stringify(context, null, 2)}

Generate 3-5 appropriate suggestions based on:
1. Indonesian agricultural standards
2. Regional farming practices  
3. EUDR compliance requirements
4. Industry best practices

Return JSON format:
{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in Indonesian agricultural practices. Provide realistic, regionally-appropriate suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Error getting field suggestions:', error);
      return [];
    }
  }
}

export const aiCompletionService = new AICompletionService();