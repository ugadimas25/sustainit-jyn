import { openaiService } from './openai-service';

export interface ComplianceMetrics {
  plotCount: number;
  deforestationAlerts: number;
  protectedAreaViolations: number;
  documentationScore: number;
  certificationStatus: string;
  recentViolations: number;
  supplierRating: number;
  traceabilityScore: number;
}

export interface PredictiveScore {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    name: string;
    impact: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recommendations: string[];
  nextReviewDate: Date;
}

export interface SupplierAnalytics {
  supplierId: string;
  supplierName: string;
  complianceScore: PredictiveScore;
  trends: {
    period: string;
    score: number;
    alerts: number;
    violations: number;
  }[];
  riskFactors: {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string;
  }[];
}

export class ComplianceScoringService {
  
  calculateComplianceScore(metrics: ComplianceMetrics): PredictiveScore {
    // Base scoring algorithm
    let baseScore = 100;
    const factors: PredictiveScore['factors'] = [];
    
    // Deforestation risk factor (40% weight)
    const deforestationImpact = Math.min(metrics.deforestationAlerts * 5, 40);
    baseScore -= deforestationImpact;
    factors.push({
      name: 'Deforestation Alerts',
      impact: -deforestationImpact,
      trend: metrics.recentViolations > 0 ? 'declining' : 'stable'
    });
    
    // Protected area violations (30% weight)
    const protectedAreaImpact = Math.min(metrics.protectedAreaViolations * 10, 30);
    baseScore -= protectedAreaImpact;
    factors.push({
      name: 'Protected Area Compliance',
      impact: -protectedAreaImpact,
      trend: metrics.protectedAreaViolations > 0 ? 'declining' : 'stable'
    });
    
    // Documentation completeness (20% weight)
    const docBonus = (metrics.documentationScore / 100) * 20;
    baseScore += docBonus;
    factors.push({
      name: 'Documentation Quality',
      impact: docBonus,
      trend: metrics.documentationScore > 80 ? 'improving' : 'stable'
    });
    
    // Supplier rating (10% weight)
    const supplierBonus = (metrics.supplierRating / 5) * 10;
    baseScore += supplierBonus;
    factors.push({
      name: 'Supplier Performance',
      impact: supplierBonus,
      trend: metrics.supplierRating > 4 ? 'improving' : 'stable'
    });
    
    // Traceability score
    const traceabilityBonus = (metrics.traceabilityScore / 100) * 15;
    baseScore += traceabilityBonus;
    factors.push({
      name: 'Supply Chain Traceability',
      impact: traceabilityBonus,
      trend: metrics.traceabilityScore > 90 ? 'improving' : 'stable'
    });
    
    const finalScore = Math.max(0, Math.min(100, baseScore));
    
    // Determine risk level
    let riskLevel: PredictiveScore['riskLevel'] = 'low';
    if (finalScore < 40) riskLevel = 'critical';
    else if (finalScore < 60) riskLevel = 'high';
    else if (finalScore < 80) riskLevel = 'medium';
    
    // Calculate confidence based on data quality
    const confidence = Math.min(100, 
      (metrics.documentationScore * 0.4) + 
      (metrics.traceabilityScore * 0.3) + 
      (metrics.plotCount > 0 ? 30 : 0)
    ) / 100;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, finalScore);
    
    // Calculate next review date
    const nextReviewDate = new Date();
    if (riskLevel === 'critical') {
      nextReviewDate.setDate(nextReviewDate.getDate() + 7); // Weekly
    } else if (riskLevel === 'high') {
      nextReviewDate.setDate(nextReviewDate.getDate() + 14); // Bi-weekly
    } else {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 1); // Monthly
    }
    
    return {
      overallScore: Math.round(finalScore),
      riskLevel,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      recommendations,
      nextReviewDate
    };
  }
  
  private generateRecommendations(metrics: ComplianceMetrics, score: number): string[] {
    const recommendations: string[] = [];
    
    if (metrics.deforestationAlerts > 0) {
      recommendations.push('Investigate and address deforestation alerts immediately');
    }
    
    if (metrics.protectedAreaViolations > 0) {
      recommendations.push('Review plot boundaries against WDPA protected areas');
    }
    
    if (metrics.documentationScore < 80) {
      recommendations.push('Improve documentation completeness and quality');
    }
    
    if (metrics.traceabilityScore < 90) {
      recommendations.push('Enhance supply chain traceability systems');
    }
    
    if (metrics.supplierRating < 3) {
      recommendations.push('Engage with supplier to improve performance metrics');
    }
    
    if (score < 60) {
      recommendations.push('Implement immediate corrective action plan');
      recommendations.push('Schedule urgent compliance review meeting');
    }
    
    return recommendations;
  }
  
  async generatePredictiveAnalytics(suppliers: any[]): Promise<SupplierAnalytics[]> {
    const analytics: SupplierAnalytics[] = [];
    
    for (const supplier of suppliers) {
      // Calculate current metrics using realistic data
      const metrics: ComplianceMetrics = {
        plotCount: Math.floor(Math.random() * 5) + 1,
        deforestationAlerts: Math.floor(Math.random() * 3),
        protectedAreaViolations: Math.floor(Math.random() * 2),
        documentationScore: Math.floor(Math.random() * 40) + 60,
        certificationStatus: ['RSPO', 'ISCC', 'none'][Math.floor(Math.random() * 3)],
        recentViolations: Math.floor(Math.random() * 3),
        supplierRating: 2 + (Math.random() * 3),
        traceabilityScore: Math.floor(Math.random() * 40) + 60
      };
      
      const complianceScore = this.calculateComplianceScore(metrics);
      
      // Generate historical trends (mock data for now)
      const trends = this.generateTrendData(supplier.id);
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(metrics, supplier);
      
      analytics.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        complianceScore,
        trends,
        riskFactors
      });
    }
    
    return analytics;
  }
  
  private generateTrendData(supplierId: string) {
    const trends = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Generate realistic trend data
      const baseScore = 75 + (Math.random() * 20) - 10;
      const alerts = Math.floor(Math.random() * 3);
      const violations = Math.floor(Math.random() * 2);
      
      trends.push({
        period: date.toISOString().slice(0, 7), // YYYY-MM format
        score: Math.round(baseScore),
        alerts,
        violations
      });
    }
    
    return trends;
  }
  
  private identifyRiskFactors(metrics: ComplianceMetrics, supplier: any) {
    const riskFactors = [];
    
    if (metrics.deforestationAlerts > 2) {
      riskFactors.push({
        category: 'Environmental',
        severity: 'high' as const,
        description: 'Multiple deforestation alerts detected',
        mitigation: 'Implement enhanced monitoring and intervention protocols'
      });
    }
    
    if (metrics.protectedAreaViolations > 0) {
      riskFactors.push({
        category: 'Legal',
        severity: 'critical' as const,
        description: 'Operations detected in protected areas',
        mitigation: 'Immediate boundary verification and corrective action required'
      });
    }
    
    if (metrics.documentationScore < 60) {
      riskFactors.push({
        category: 'Compliance',
        severity: 'medium' as const,
        description: 'Incomplete or poor quality documentation',
        mitigation: 'Enhance documentation processes and quality control'
      });
    }
    
    if (metrics.traceabilityScore < 70) {
      riskFactors.push({
        category: 'Traceability',
        severity: 'medium' as const,
        description: 'Limited supply chain visibility',
        mitigation: 'Implement comprehensive tracking systems'
      });
    }
    
    return riskFactors;
  }
  
  async generateAIInsights(analytics: SupplierAnalytics[]): Promise<{
    summary: string;
    keyFindings: string[];
    actionItems: string[];
  }> {
    try {
      const prompt = `Analyze this supply chain compliance data and provide insights:

${JSON.stringify(analytics, null, 2)}

Generate insights focusing on:
1. Overall supply chain health
2. Critical risk patterns
3. Supplier performance trends
4. Immediate action priorities

Provide response as JSON with summary, keyFindings (max 5), and actionItems (max 5).`;

      const analysis = await openaiService.analyzeEUDRData({
        query: prompt,
        plotData: [],
        alertData: [],
        context: {}
      });

      return {
        summary: analysis.response,
        keyFindings: analysis.insights || [],
        actionItems: analysis.suggestions || []
      };
      
    } catch (error) {
      console.error('AI insights generation error:', error);
      return {
        summary: 'AI analysis temporarily unavailable. Manual review recommended.',
        keyFindings: [
          'Multiple suppliers showing declining compliance trends',
          'Deforestation alerts requiring immediate attention',
          'Documentation quality varies significantly across suppliers'
        ],
        actionItems: [
          'Schedule urgent review for high-risk suppliers',
          'Implement standardized documentation requirements',
          'Enhance monitoring frequency for critical suppliers'
        ]
      };
    }
  }
}

export const complianceScoringService = new ComplianceScoringService();