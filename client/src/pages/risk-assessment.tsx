import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, FileText, Calculator, MapPin, FileCheck, Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Enhanced Risk Assessment form schema based on Indonesian methodology
const riskAssessmentSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierType: z.enum(['estate', 'mill', 'trader', 'smallholder']).optional(),
  assessmentPeriod: z.string().min(1, 'Assessment period is required'),
  assessor: z.string().min(1, 'Assessor name is required'),
  reviewDate: z.string().optional(),
  notes: z.string().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium')
});

// Enhanced Risk Item schema for comprehensive risk factors
const riskItemSchema = z.object({
  itemName: z.string(),
  category: z.enum(['spatial', 'legal', 'operational', 'financial', 'environmental', 'social']),
  subcategory: z.string().optional(),
  riskLevel: z.enum(['tinggi', 'sedang', 'rendah']),
  probability: z.number().min(1).max(5), // 1-5 scale for probability
  impact: z.number().min(1).max(5), // 1-5 scale for impact
  parameter: z.string(),
  riskValue: z.number().min(1).max(25), // probability * impact
  weight: z.number().min(0).max(100),
  inherentRisk: z.number().min(1).max(25),
  controlEffectiveness: z.number().min(1).max(5), // Control effectiveness rating
  residualRisk: z.number().min(1).max(25),
  mitigationDescription: z.string().optional(),
  mitigationActions: z.array(z.string()).default([]),
  actionOwner: z.string().optional(),
  targetDate: z.string().optional(),
  mitigationStatus: z.enum(['not_started', 'in_progress', 'completed', 'overdue']).default('not_started'),
  mitigationRequired: z.boolean().default(false),
  regulatoryRequirement: z.string().optional(),
  evidenceRequired: z.array(z.string()).default([])
});

type RiskAssessmentData = z.infer<typeof riskAssessmentSchema>;
type RiskItemData = z.infer<typeof riskItemSchema>;

interface RiskScoring {
  overallScore: number;
  riskClassification: string;
  spatialRiskScore?: number;
  legalRiskScore?: number;
  operationalRiskScore?: number;
  financialRiskScore?: number;
  environmentalRiskScore?: number;
  socialRiskScore?: number;
  inherentRiskScore?: number;
  residualRiskScore?: number;
  riskTrend?: 'increasing' | 'stable' | 'decreasing';
  controlMaturity?: number;
  actionItemsCount?: number;
  criticalIssuesCount?: number;
}

export default function RiskAssessment() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('spatial');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [scoring, setScoring] = useState<RiskScoring>({ overallScore: 0, riskClassification: 'high' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<RiskAssessmentData>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      supplierName: '',
      assessmentPeriod: new Date().getFullYear().toString() + '-Q1',
      notes: ''
    }
  });

  // Fetch existing risk assessments
  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['/api/risk-assessments'],
    enabled: true
  });

  // Fetch assessment items if an assessment is selected
  const { data: assessmentItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['/api/risk-assessments', selectedAssessmentId, 'items'],
    enabled: !!selectedAssessmentId
  });

  // Create new risk assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: RiskAssessmentData) => {
      return await apiRequest('POST', '/api/risk-assessments', {
        body: JSON.stringify({
          ...data,
          status: 'Draft',
          assessorName: 'KPN Compliance Administrator' // TODO: Get from user context
        })
      });
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk-assessments'] });
      setSelectedAssessmentId(data.id);
      
      // Initialize Excel-based risk template
      try {
        const templateResponse = await apiRequest('POST', `/api/risk-assessments/${data.id}/init-excel-template`);
        
        if (templateResponse.scoring) {
          setScoring(templateResponse.scoring);
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/risk-assessments', data.id, 'items'] });
        
        toast({
          title: "Assessment Created",
          description: "Risk assessment created with Excel-based template",
        });
      } catch (error) {
        console.error('Failed to initialize template:', error);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create risk assessment",
        variant: "destructive"
      });
    }
  });

  // Update risk item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RiskItemData> }) => {
      return await apiRequest('PUT', `/api/risk-assessment-items/${id}`, {
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      if (selectedAssessmentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/risk-assessments', selectedAssessmentId, 'items'] });
        recalculateScoring();
      }
    }
  });

  // Recalculate scoring when items change
  const recalculateScoring = async () => {
    if (!selectedAssessmentId) return;
    
    try {
      const scoringResponse = await apiRequest('GET', `/api/risk-assessments/${selectedAssessmentId}/score`);
      setScoring(scoringResponse);
    } catch (error) {
      console.error('Failed to recalculate scoring:', error);
    }
  };

  // Handle form submission
  const onSubmit = (data: RiskAssessmentData) => {
    createAssessmentMutation.mutate(data);
  };

  // Get risk level badge color
  const getRiskBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'rendah':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
      case 'sedang':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
      case 'tinggi':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get risk level display text
  const getRiskDisplayText = (level: string) => {
    const mappings: Record<string, string> = {
      'tinggi': 'High',
      'sedang': 'Medium', 
      'rendah': 'Low',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return mappings[level.toLowerCase()] || level;
  };

  // Filter items by category
  const spatialItems = assessmentItems.filter((item: any) => item.category === 'spatial');
  const nonSpatialItems = assessmentItems.filter((item: any) => item.category === 'non_spatial');

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Risk Assessment - Excel Methodology
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive supplier risk evaluation based on KPNPLT-SST methodology
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedAssessmentId && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Overall Risk Score</div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskBadgeColor(scoring.riskClassification)}>
                      {getRiskDisplayText(scoring.riskClassification)}
                    </Badge>
                    <span className="text-lg font-bold">{scoring.overallScore.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              <Button 
                onClick={() => setLocation('/supply-chain-workflow')}
                variant="outline"
                data-testid="button-back-workflow"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workflow
              </Button>
            </div>
          </div>
        </div>

        {!selectedAssessmentId ? (
          /* Create New Assessment */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Create Risk Assessment
                </CardTitle>
                <CardDescription>
                  Start a new comprehensive risk assessment using Excel methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter supplier name" {...field} data-testid="input-supplier-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assessmentPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment Period</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2024-Q1" {...field} data-testid="input-assessment-period" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Assessment notes and remarks" {...field} data-testid="textarea-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createAssessmentMutation.isPending}
                      data-testid="button-create-assessment"
                    >
                      {createAssessmentMutation.isPending ? 'Creating...' : 'Create Assessment'}
                      <Shield className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Existing Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Existing Assessments
                </CardTitle>
                <CardDescription>
                  Continue working on previous risk assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssessments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading assessments...</p>
                  </div>
                ) : assessments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No assessments found</p>
                    <p className="text-sm text-gray-500">Create your first risk assessment to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments.slice(0, 5).map((assessment: any) => (
                      <div 
                        key={assessment.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedAssessmentId(assessment.id)}
                        data-testid={`card-assessment-${assessment.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{assessment.supplierName}</h3>
                            <p className="text-sm text-gray-600">{assessment.assessmentPeriod}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskBadgeColor(assessment.riskClassification || 'high')}>
                              {getRiskDisplayText(assessment.riskClassification || 'High')}
                            </Badge>
                            {assessment.overallScore && (
                              <span className="text-sm font-medium">{Number(assessment.overallScore).toFixed(1)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Assessment Detail View */
          <div className="space-y-6">
            {/* Risk Assessment Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="spatial" data-testid="tab-spatial">
                    <MapPin className="w-4 h-4 mr-2" />
                    Spatial Risk Analysis
                  </TabsTrigger>
                  <TabsTrigger value="non-spatial" data-testid="tab-non-spatial">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Non-Spatial Risk Analysis
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => setSelectedAssessmentId(null)}
                    variant="outline"
                    data-testid="button-back-assessments"
                  >
                    ← Back to Assessments
                  </Button>
                </div>
              </div>

              {/* Spatial Risk Analysis Tab */}
              <TabsContent value="spatial">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Spatial Risk Analysis (Section I)
                    </CardTitle>
                    <CardDescription>
                      Geographic and environmental risk assessment based on Excel methodology
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingItems ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading risk items...</p>
                      </div>
                    ) : spatialItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No spatial risk items found</p>
                        <p className="text-sm text-gray-500">Risk items should be automatically created</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {spatialItems.map((item: any) => (
                          <div key={item.id} className="border rounded-lg p-6 bg-white" data-testid={`item-${item.id}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Risk Item Info */}
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Risk Item</Label>
                                <p className="font-medium text-lg">{item.itemName}</p>
                                <Badge className={getRiskBadgeColor(item.riskLevel)}>
                                  {getRiskDisplayText(item.riskLevel)}
                                </Badge>
                              </div>

                              {/* Risk Parameter */}
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Parameter</Label>
                                <p className="text-sm text-gray-600">{item.parameter}</p>
                              </div>

                              {/* Scoring */}
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Scoring</Label>
                                <div className="space-y-1">
                                  <p className="text-sm"><strong>Risk Value:</strong> {item.riskValue}</p>
                                  <p className="text-sm"><strong>Weight:</strong> {Number(item.weight).toFixed(0)}%</p>
                                  <p className="text-sm"><strong>Score:</strong> {Number(item.finalScore * 100).toFixed(1)}%</p>
                                </div>
                              </div>

                              {/* Risk Level Selector */}
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Update Risk Level</Label>
                                <Select 
                                  value={item.riskLevel} 
                                  onValueChange={(value) => {
                                    const riskValueMap: Record<string, number> = {
                                      'tinggi': 1,
                                      'sedang': 2,
                                      'rendah': 3
                                    };
                                    
                                    const newRiskValue = riskValueMap[value];
                                    const weight = Number(item.weight);
                                    const calculatedRisk = weight * newRiskValue;
                                    const normalizedScore = calculatedRisk / 300; // Max possible score
                                    const finalScore = normalizedScore;
                                    
                                    updateItemMutation.mutate({
                                      id: item.id,
                                      updates: {
                                        riskLevel: value as any,
                                        riskValue: newRiskValue,
                                        normalizedScore,
                                        finalScore
                                      }
                                    });
                                  }}
                                  data-testid={`select-risk-level-${item.id}`}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tinggi">High Risk</SelectItem>
                                    <SelectItem value="sedang">Medium Risk</SelectItem>
                                    <SelectItem value="rendah">Low Risk</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Mitigation */}
                            {item.mitigationDescription && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Label className="text-sm font-semibold text-blue-900">Mitigation Strategy</Label>
                                <p className="text-sm text-blue-800 mt-1">{item.mitigationDescription}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Non-Spatial Risk Analysis Tab */}
              <TabsContent value="non-spatial">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      Non-Spatial Risk Analysis
                    </CardTitle>
                    <CardDescription>
                      Legal, certification, and operational risk assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {nonSpatialItems.length === 0 ? (
                      <div className="text-center py-8">
                        <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Non-spatial risk analysis coming soon</p>
                        <p className="text-sm text-gray-500">Focus on spatial risk analysis for now</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {nonSpatialItems.map((item: any) => (
                          <div key={item.id} className="border rounded-lg p-6 bg-white">
                            {/* Similar structure to spatial items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Risk Item</Label>
                                <p className="font-medium text-lg">{item.itemName}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Risk Level</Label>
                                <Badge className={getRiskBadgeColor(item.riskLevel)}>
                                  {getRiskDisplayText(item.riskLevel)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Risk Score Summary */}
            {selectedAssessmentId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Risk Assessment Summary
                  </CardTitle>
                  <CardDescription>
                    Overall risk classification based on Excel methodology
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{scoring.overallScore.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                      <Progress value={scoring.overallScore} className="mt-2" />
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`${getRiskBadgeColor(scoring.riskClassification)} text-lg px-4 py-2`}>
                        {getRiskDisplayText(scoring.riskClassification)}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-2">Risk Classification</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">
                        <div><strong>Threshold:</strong></div>
                        <div>Low: ≥67% | Medium: 61-67% | High: &lt;61%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}