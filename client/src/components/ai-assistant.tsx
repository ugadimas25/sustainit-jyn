import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Sparkles, CheckCircle, AlertCircle, FileCheck, Lightbulb, Zap } from "lucide-react";

interface CompletionSuggestion {
  field: string;
  value: string;
  confidence: number;
  reasoning: string;
}

interface DocumentValidation {
  isValid: boolean;
  completeness: number;
  missingFields: string[];
  recommendations: string[];
  complianceIssues: string[];
}

interface ComplianceSummary {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: string[];
  nextSteps: string[];
}

interface AIAssistantProps {
  farmerData: any;
  onApplySuggestion?: (field: string, value: string) => void;
  onValidationComplete?: (validation: DocumentValidation) => void;
}

export function AIAssistant({ farmerData, onApplySuggestion, onValidationComplete }: AIAssistantProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'validation' | 'compliance'>('suggestions');
  const [suggestions, setSuggestions] = useState<CompletionSuggestion[]>([]);
  const [validation, setValidation] = useState<DocumentValidation | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);

  // AI Completions Mutation
  const completionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/suggest-completions', data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      setActiveTab('suggestions');
    }
  });

  // Document Validation Mutation
  const validationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/validate-document', data);
      return await res.json();
    },
    onSuccess: (data: DocumentValidation) => {
      setValidation(data);
      setActiveTab('validation');
      onValidationComplete?.(data);
    }
  });

  // Compliance Summary Mutation
  const complianceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/compliance-summary', data);
      return await res.json();
    },
    onSuccess: (data: ComplianceSummary) => {
      setComplianceSummary(data);
      setActiveTab('compliance');
    }
  });

  const handleGetCompletions = () => {
    setShowDialog(true);
    completionsMutation.mutate(farmerData);
  };

  const handleValidateDocument = () => {
    setShowDialog(true);
    validationMutation.mutate(farmerData);
  };

  const handleGetComplianceSummary = () => {
    setShowDialog(true);
    complianceMutation.mutate(farmerData);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'text-green-600';
    if (completeness >= 70) return 'text-yellow-600';
    if (completeness >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetCompletions}
          disabled={completionsMutation.isPending}
          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          data-testid="button-ai-completions"
        >
          {completionsMutation.isPending ? (
            <div className="flex items-center gap-1">
              <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>AI Complete</span>
            </div>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleValidateDocument}
          disabled={validationMutation.isPending}
          className="bg-purple-50 hover:bg-purple-100 border-purple-200"
          data-testid="button-ai-validation"
        >
          {validationMutation.isPending ? (
            <div className="flex items-center gap-1">
              <div className="animate-spin h-3 w-3 border border-purple-600 border-t-transparent rounded-full" />
              <span>Validating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              <span>AI Validate</span>
            </div>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGetComplianceSummary}
          disabled={complianceMutation.isPending}
          className="bg-green-50 hover:bg-green-100 border-green-200"
          data-testid="button-ai-compliance"
        >
          {complianceMutation.isPending ? (
            <div className="flex items-center gap-1">
              <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>AI Summary</span>
            </div>
          )}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI-Powered Legal Document Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'suggestions' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('suggestions')}
                data-testid="tab-suggestions"
              >
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Auto-Completions
                </div>
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'validation' 
                    ? 'border-purple-600 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('validation')}
                data-testid="tab-validation"
              >
                <div className="flex items-center gap-1">
                  <FileCheck className="h-4 w-4" />
                  Document Validation
                </div>
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'compliance' 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('compliance')}
                data-testid="tab-compliance"
              >
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Compliance Summary
                </div>
              </button>
            </div>

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold">AI-Suggested Completions</h3>
                </div>
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.field}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    suggestion.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                                    suggestion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <p className="font-medium text-gray-900 mb-1">
                                Suggested value: <span className="text-blue-600">{suggestion.value}</span>
                              </p>
                              <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onApplySuggestion?.(suggestion.field, suggestion.value)}
                              className="ml-4"
                              data-testid={`button-apply-${index}`}
                            >
                              Apply
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No suggestions available. Click "AI Complete" to get intelligent field completions.
                  </div>
                )}
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === 'validation' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Document Validation Results</h3>
                </div>
                {validation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {validation.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            Validation Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge 
                            variant={validation.isValid ? "default" : "destructive"}
                            className="text-sm"
                          >
                            {validation.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Completeness</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getCompletenessColor(validation.completeness).includes('green') ? 'bg-green-600' : 
                                  getCompletenessColor(validation.completeness).includes('yellow') ? 'bg-yellow-600' :
                                  getCompletenessColor(validation.completeness).includes('orange') ? 'bg-orange-600' : 'bg-red-600'}`}
                                style={{ width: `${validation.completeness}%` }}
                              />
                            </div>
                            <span className={`font-semibold ${getCompletenessColor(validation.completeness)}`}>
                              {validation.completeness}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {validation.missingFields.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-red-600">Missing Fields</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {validation.missingFields.map((field, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {validation.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-blue-600">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {validation.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {validation.complianceIssues.length > 0 && (
                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-red-600">Compliance Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {validation.complianceIssues.map((issue, index) => (
                              <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No validation results available. Click "AI Validate" to analyze document completeness.
                  </div>
                )}
              </div>
            )}

            {/* Compliance Summary Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">EUDR Compliance Analysis</h3>
                </div>
                {complianceSummary ? (
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Overall Risk Assessment</CardTitle>
                          <Badge className={`${getRiskLevelColor(complianceSummary.riskLevel)} border`}>
                            {complianceSummary.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{complianceSummary.summary}</p>
                      </CardContent>
                    </Card>

                    {complianceSummary.keyFindings.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Key Findings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {complianceSummary.keyFindings.map((finding, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {complianceSummary.nextSteps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-orange-600">Recommended Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {complianceSummary.nextSteps.map((step, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-orange-600 mt-1 font-bold">→</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No compliance analysis available. Click "AI Summary" to get EUDR compliance insights.
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}