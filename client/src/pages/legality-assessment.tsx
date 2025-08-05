import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, CheckCircle, Edit, Trash2, Search } from "lucide-react";

export default function LegalityAssessment() {
  const [selectedTemplate, setSelectedTemplate] = useState("eudr_basic");
  const [surveyQuestions, setSurveyQuestions] = useState([
    {
      id: 1,
      question: "Does the plot have valid land title documentation?",
      options: [
        "Yes, with government certification",
        "Yes, but under review", 
        "No documentation"
      ]
    },
    {
      id: 2,
      question: "Was the land cleared after December 31, 2020?",
      options: [
        "No clearing after 2020",
        "Partial clearing after 2020",
        "Full clearing after 2020"
      ]
    }
  ]);

  const { data: surveys } = useQuery({
    queryKey: ["/api/surveys"],
  });

  const { data: plots } = useQuery({
    queryKey: ["/api/plots"],
  });

  const addQuestion = () => {
    const newQuestion = {
      id: surveyQuestions.length + 1,
      question: "New question",
      options: ["Option 1", "Option 2", "Option 3"]
    };
    setSurveyQuestions([...surveyQuestions, newQuestion]);
  };

  const removeQuestion = (id: number) => {
    setSurveyQuestions(surveyQuestions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: number, newQuestion: string) => {
    setSurveyQuestions(surveyQuestions.map(q => 
      q.id === id ? { ...q, question: newQuestion } : q
    ));
  };

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Legality Assessment</h1>
              <p className="text-gray-600 mt-1">Survey builder and legal compliance verification</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-forest text-white hover:bg-forest-dark" data-testid="button-new-survey">
                <Plus className="w-4 h-4 mr-2" />
                New Survey
              </Button>
              <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-bulk-verification">
                <CheckCircle className="w-4 h-4 mr-2" />
                Bulk Verification
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Survey Builder */}
            <div className="lg:col-span-2">
              <Card className="border-neutral-border">
                <CardHeader>
                  <CardTitle>Survey Builder</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Create and manage legality assessment questionnaires</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Survey Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger data-testid="select-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eudr_basic">EUDR Basic Compliance</SelectItem>
                        <SelectItem value="indonesian_law">Indonesian Law Compliance</SelectItem>
                        <SelectItem value="rspo">RSPO Certification</SelectItem>
                        <SelectItem value="custom">Custom Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {surveyQuestions.map((question) => (
                      <Card key={question.id} className="border border-neutral-border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <Input 
                                value={question.question}
                                onChange={(e) => updateQuestion(question.id, e.target.value)}
                                className="font-medium border-none outline-none p-0"
                                data-testid={`input-question-${question.id}`}
                              />
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button variant="ghost" size="sm" data-testid={`button-edit-${question.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeQuestion(question.id)}
                                data-testid={`button-delete-${question.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <RadioGroup>
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={`q${question.id}_option${index}`} id={`q${question.id}_option${index}`} />
                                <Label htmlFor={`q${question.id}_option${index}`} className="text-sm">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    ))}

                    <Button 
                      variant="outline" 
                      className="w-full border-dashed border-2 p-4"
                      onClick={addQuestion}
                      data-testid="button-add-question"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <Button className="bg-forest text-white hover:bg-forest-dark" data-testid="button-save-survey">
                      Save Survey
                    </Button>
                    <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-preview">
                      Preview
                    </Button>
                    <Button variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panels */}
            <div className="space-y-6">
              {/* WDPA Verification Panel */}
              <Card className="border-neutral-border">
                <CardHeader>
                  <CardTitle className="text-base">WDPA Verification</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Protected areas check</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Select Plot</Label>
                    <Select>
                      <SelectTrigger data-testid="select-plot-wdpa">
                        <SelectValue placeholder="Choose plot..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(plots) ? plots.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.plotId}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full bg-professional text-white hover:bg-blue-700 mb-4"
                    data-testid="button-check-wdpa"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Check Against WDPA
                  </Button>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-forest-light bg-opacity-10 border border-forest-light border-opacity-20 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-forest-light mr-2" />
                        <span className="text-sm font-medium text-gray-800">No overlap detected</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Plot is outside protected areas</p>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p><strong>Checked against:</strong></p>
                      <ul className="mt-1 space-y-1">
                        <li>• National Parks (25 km radius)</li>
                        <li>• Wildlife Reserves (50 km radius)</li>
                        <li>• UNESCO World Heritage Sites</li>
                        <li>• Ramsar Wetlands</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Survey Templates */}
              <Card className="border-neutral-border">
                <CardHeader>
                  <CardTitle className="text-base">Survey Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border border-neutral-border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <h4 className="font-medium text-gray-800 text-sm">EUDR Basic</h4>
                      <p className="text-xs text-gray-600 mt-1">12 questions • Land rights, deforestation</p>
                    </div>
                    <div className="p-3 border border-neutral-border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <h4 className="font-medium text-gray-800 text-sm">Indonesian Law</h4>
                      <p className="text-xs text-gray-600 mt-1">8 questions • Local compliance</p>
                    </div>
                    <div className="p-3 border border-neutral-border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <h4 className="font-medium text-gray-800 text-sm">RSPO Standard</h4>
                      <p className="text-xs text-gray-600 mt-1">15 questions • Sustainability criteria</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
