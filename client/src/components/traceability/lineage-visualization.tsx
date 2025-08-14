import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Factory, Truck, Ship, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface LineageNode {
  id: string;
  type: string;
  name: string;
  data: any;
  coordinates?: { latitude: number; longitude: number };
  riskLevel?: string;
  certifications?: string[];
  distance?: number;
}

interface LineageEdge {
  source: string;
  target: string;
  type: string;
  quantity?: number;
  date?: string;
  metadata?: any;
}

interface LineageResult {
  entityId: string;
  entityType: string;
  depth: number;
  totalNodes: number;
  nodes: LineageNode[];
  edges: LineageEdge[];
  riskAssessment?: {
    overallRisk: string;
    riskFactors: any[];
    compliance: {
      eudrCompliant: boolean;
      rspoCompliant: boolean;
      issues: string[];
    };
  };
}

interface LineageVisualizationProps {
  entityId: string;
  entityType: string;
  direction: 'forward' | 'backward' | 'full';
}

export function LineageVisualization({ entityId, entityType, direction }: LineageVisualizationProps) {
  const [lineageData, setLineageData] = useState<LineageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (entityId && entityType) {
      fetchLineageData();
    }
  }, [entityId, entityType, direction]);

  const fetchLineageData = async () => {
    setLoading(true);
    try {
      const query = `
        query GetLineage($entityId: ID!, $entityType: String!) {
          ${direction === 'forward' ? 'traceForward' : direction === 'backward' ? 'traceBackward' : 'getFullLineage'}(
            entityId: $entityId, 
            entityType: $entityType
          ) {
            entityId
            entityType
            depth
            totalNodes
            nodes {
              id
              type
              name
              data
              coordinates { latitude longitude }
              riskLevel
              certifications
              distance
            }
            edges {
              source
              target
              type
              quantity
              date
              metadata
            }
            riskAssessment {
              overallRisk
              riskFactors {
                type
                severity
                description
                entityId
              }
              compliance {
                eudrCompliant
                rspoCompliant
                issues
              }
            }
          }
        }
      `;

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { entityId, entityType }
        })
      });

      const result = await response.json();
      const operation = direction === 'forward' ? 'traceForward' : direction === 'backward' ? 'traceBackward' : 'getFullLineage';
      setLineageData(result.data[operation]);
    } catch (error) {
      console.error('Error fetching lineage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'plot': return <MapPin className="w-4 h-4" />;
      case 'facility': return <Factory className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      case 'shipment': return <Ship className="w-4 h-4" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderLineageTree = () => {
    if (!lineageData) return null;

    // Group nodes by level for better visualization
    const nodesByLevel = new Map<number, LineageNode[]>();
    lineageData.nodes.forEach(node => {
      const level = node.data.level || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

    return (
      <div className="space-y-8">
        {levels.map((level, levelIndex) => (
          <div key={level} className="relative">
            <div className="flex items-center justify-center mb-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Level {level}
              </Badge>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {nodesByLevel.get(level)!.map((node, nodeIndex) => (
                <div key={node.id} className="relative">
                  <Card 
                    className={`w-64 cursor-pointer transition-all hover:shadow-md ${
                      selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedNode(node)}
                    data-testid={`lineage-node-${node.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getNodeIcon(node.type)}
                          <span className="text-sm font-medium capitalize">{node.type}</span>
                        </div>
                        {node.riskLevel && (
                          <Badge className={getRiskColor(node.riskLevel)}>
                            {node.riskLevel}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium text-sm mb-2" data-testid={`node-name-${node.id}`}>
                        {node.name}
                      </h4>
                      
                      {node.coordinates && (
                        <p className="text-xs text-gray-600 mb-1">
                          📍 {node.coordinates.latitude.toFixed(4)}, {node.coordinates.longitude.toFixed(4)}
                        </p>
                      )}
                      
                      {node.distance !== undefined && (
                        <p className="text-xs text-gray-600 mb-1">
                          📏 {node.distance.toFixed(1)} km
                        </p>
                      )}
                      
                      {node.certifications && node.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {node.certifications.map(cert => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Connection lines */}
                  {levelIndex < levels.length - 1 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                      <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Tracing lineage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {lineageData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" data-testid="total-nodes">
                {lineageData.totalNodes}
              </div>
              <p className="text-xs text-gray-600">Total Entities</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" data-testid="total-depth">
                {lineageData.depth}
              </div>
              <p className="text-xs text-gray-600">Chain Depth</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" data-testid="total-edges">
                {lineageData.edges.length}
              </div>
              <p className="text-xs text-gray-600">Connections</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${
                lineageData.riskAssessment?.overallRisk === 'low' ? 'text-green-600' :
                lineageData.riskAssessment?.overallRisk === 'medium' ? 'text-yellow-600' :
                lineageData.riskAssessment?.overallRisk === 'high' ? 'text-orange-600' :
                'text-red-600'
              }`} data-testid="overall-risk">
                {lineageData.riskAssessment?.overallRisk?.toUpperCase() || 'UNKNOWN'}
              </div>
              <p className="text-xs text-gray-600">Overall Risk</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Assessment */}
      {lineageData?.riskAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                {lineageData.riskAssessment.compliance.eudrCompliant ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">EUDR Compliant</span>
              </div>
              
              <div className="flex items-center gap-2">
                {lineageData.riskAssessment.compliance.rspoCompliant ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">RSPO Certified</span>
              </div>
            </div>
            
            {lineageData.riskAssessment.riskFactors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Risk Factors:</h4>
                {lineageData.riskAssessment.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{factor.type}</p>
                      <p className="text-xs text-gray-600">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lineage Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Lineage</CardTitle>
        </CardHeader>
        <CardContent>
          {renderLineageTree()}
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {selectedNode.type}</p>
                  <p><strong>Name:</strong> {selectedNode.name}</p>
                  <p><strong>ID:</strong> {selectedNode.id}</p>
                  {selectedNode.riskLevel && (
                    <p><strong>Risk Level:</strong> {selectedNode.riskLevel}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Additional Data</h4>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}