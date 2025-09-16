import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RiskAssessment() {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Risk Assessment
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive supplier risk evaluation and compliance assessment
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Coming Soon
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Risk Assessment Framework
              </CardTitle>
              <CardDescription>
                Comprehensive risk evaluation methodology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Assessment Categories</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Environmental Compliance Risk</li>
                    <li>• Legal Documentation Risk</li>
                    <li>• Supply Chain Traceability Risk</li>
                    <li>• Deforestation Risk Assessment</li>
                    <li>• Third-party Verification Risk</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Placeholder Notice */}
        <Card className="mt-6">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Risk Assessment Form Coming Soon
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              The comprehensive risk assessment form will be available shortly. This module will allow you to evaluate 
              suppliers across multiple risk dimensions with AI-powered analysis and compliance recommendations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}