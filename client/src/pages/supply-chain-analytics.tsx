import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  BarChart3,
  Target,
  Brain,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Shield,
  Leaf,
  Users,
  MapPin,
  FileText
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface ComplianceScore {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    name: string;
    impact: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  recommendations: string[];
  nextReviewDate: string;
}

interface SupplierAnalytics {
  supplierId: string;
  supplierName: string;
  complianceScore: ComplianceScore;
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

export default function SupplyChainAnalyticsPage() {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery<{
    suppliers: SupplierAnalytics[];
    insights: {
      summary: string;
      keyFindings: string[];
      actionItems: string[];
    };
  }>({
    queryKey: ['/api/supply-chain/analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/supply-chain/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  const pieData = analytics?.suppliers.map((supplier, index) => ({
    name: supplier.supplierName,
    value: supplier.complianceScore.overallScore,
    risk: supplier.complianceScore.riskLevel,
    color: ['#22c55e', '#eab308', '#f97316', '#ef4444'][index % 4]
  })) || [];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analyzing supply chain data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="h-6 w-6 text-blue-600" />
                  Supply Chain Analytics
                </h1>
                <p className="text-gray-600 mt-1">Predictive compliance scoring and risk assessment</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32" data-testid="select-time-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="12months">12 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* AI Insights Summary */}
            {analytics?.insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 text-blue-600" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{analytics.insights.summary}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Key Findings
                      </h4>
                      <ul className="space-y-1">
                        {analytics.insights.keyFindings.map((finding, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <div className="h-1 w-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-1">
                        {analytics.insights.actionItems.map((action, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <div className="h-1 w-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                  <Users className="h-4 w-4 mr-2" />
                  Supplier Scores
                </TabsTrigger>
                <TabsTrigger value="trends" data-testid="tab-trends">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="risks" data-testid="tab-risks">
                  <Shield className="h-4 w-4 mr-2" />
                  Risk Factors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Overall Metrics */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Score Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Compliance Score Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={analytics?.suppliers || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="supplierName" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="complianceScore.overallScore" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Risk Level Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Risk Level Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Summary Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(analytics?.suppliers.reduce((acc, s) => acc + s.complianceScore.overallScore, 0) / (analytics?.suppliers.length || 1)) || 0}
                          </div>
                          <div className="text-xs text-gray-600">Average Compliance Score</div>
                        </div>

                        <div className="space-y-2">
                          {['critical', 'high', 'medium', 'low'].map(level => {
                            const count = analytics?.suppliers.filter(s => s.complianceScore.riskLevel === level).length || 0;
                            return (
                              <div key={level} className="flex items-center justify-between text-xs">
                                <span className="capitalize">{level} Risk</span>
                                <Badge variant="outline" className={getRiskColor(level)}>
                                  {count}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Next Reviews</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {analytics?.suppliers
                          .sort((a, b) => new Date(a.complianceScore.nextReviewDate || Date.now()).getTime() - new Date(b.complianceScore.nextReviewDate || Date.now()).getTime())
                          .slice(0, 3)
                          .map(supplier => (
                            <div key={supplier.supplierId} className="flex items-center justify-between text-xs">
                              <span className="truncate">{supplier.supplierName}</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">
                                  {new Date(supplier.complianceScore.nextReviewDate || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="suppliers">
                <div className="grid gap-4">
                  {analytics?.suppliers.map(supplier => (
                    <Card key={supplier.supplierId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{supplier.supplierName}</CardTitle>
                          <Badge className={getRiskColor(supplier.complianceScore.riskLevel)}>
                            {getRiskIcon(supplier.complianceScore.riskLevel)}
                            <span className="ml-1 capitalize">{supplier.complianceScore.riskLevel}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Score Display */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Compliance Score</span>
                              <span className="text-sm font-medium">{supplier.complianceScore.overallScore}/100</span>
                            </div>
                            <Progress value={supplier.complianceScore.overallScore} className="h-2" />
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600">Confidence</div>
                            <div className="text-sm font-medium">{Math.round(supplier.complianceScore.confidence * 100)}%</div>
                          </div>
                        </div>

                        {/* Contributing Factors */}
                        <div>
                          <h4 className="text-xs font-medium mb-2">Contributing Factors</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {supplier.complianceScore.factors.map((factor, index) => (
                              <div key={index} className="text-xs flex items-center justify-between">
                                <span className="text-gray-600">{factor.name}</span>
                                <div className="flex items-center gap-1">
                                  {getTrendIcon(factor.trend)}
                                  <span className={factor.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {factor.impact >= 0 ? '+' : ''}{factor.impact}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {supplier.complianceScore.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium mb-1">Recommendations</h4>
                            <ul className="space-y-1">
                              {supplier.complianceScore.recommendations.slice(0, 3).map((rec, index) => (
                                <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                                  <div className="h-1 w-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Compliance Score Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        {analytics?.suppliers.map((supplier, index) => (
                          <Line
                            key={supplier.supplierId}
                            data={supplier.trends}
                            type="monotone"
                            dataKey="score"
                            stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                            name={supplier.supplierName}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risks">
                <div className="grid gap-4">
                  {analytics?.suppliers.map(supplier => (
                    <Card key={supplier.supplierId}>
                      <CardHeader>
                        <CardTitle className="text-sm">{supplier.supplierName} - Risk Factors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {supplier.riskFactors.length > 0 ? (
                          <div className="space-y-3">
                            {supplier.riskFactors.map((risk, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={getRiskColor(risk.severity)}>
                                    {risk.category}
                                  </Badge>
                                  <Badge variant="outline" className={getRiskColor(risk.severity)}>
                                    {risk.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-700 mb-2">{risk.description}</p>
                                <p className="text-xs text-blue-600 font-medium">{risk.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-4">No significant risk factors identified</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}