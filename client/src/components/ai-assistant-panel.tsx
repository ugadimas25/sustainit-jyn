import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Send, Loader2, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  insights?: string[];
}

interface AIAssistantPanelProps {
  plotData?: any[];
  alertData?: any[];
  selectedPlot?: any;
  selectedAlert?: any;
  filters?: any;
}

export function AIAssistantPanel({ 
  plotData = [], 
  alertData = [], 
  selectedPlot, 
  selectedAlert, 
  filters 
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your EUDR monitoring AI assistant. I can help analyze your plantation data, deforestation alerts, and compliance status. Ask me anything about your monitoring data!',
      timestamp: new Date(),
      suggestions: [
        'What are the main compliance risks?',
        'Analyze recent deforestation alerts',
        'Show me high-risk areas'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Get AI summary on load
  const { data: aiSummary } = useQuery({
    queryKey: ['/api/ai/summary', plotData.length, alertData.length],
    queryFn: async () => {
      if (plotData.length === 0 && alertData.length === 0) return null;
      const response = await apiRequest('POST', '/api/ai/summary', {
        plotData,
        alertData
      });
      return response.json();
    },
    enabled: plotData.length > 0 || alertData.length > 0
  });

  const analysisMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/ai/analyze', {
        query,
        plotData,
        alertData,
        context: {
          selectedPlot,
          selectedAlert,
          filters
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions,
        insights: data.insights
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error analyzing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    analysisMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 p-4">
        {/* AI Summary */}
        {aiSummary && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  EUDR Summary
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {aiSummary}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-[300px]">
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="ml-4 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <Lightbulb className="h-3 w-3" />
                      Key Insights
                    </div>
                    {message.insights.map((insight, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="ml-4 space-y-1">
                    <div className="text-xs font-medium text-green-600 mb-1">
                      Suggested Questions:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => handleSuggestionClick(suggestion)}
                          data-testid={`button-suggestion-${index}`}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {analysisMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your data...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your EUDR data..."
            className="flex-1"
            data-testid="input-ai-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || analysisMutation.isPending}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => handleSuggestionClick('What are the main compliance risks in my data?')}
            data-testid="button-quick-risks"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Risks
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => handleSuggestionClick('Analyze recent deforestation trends')}
            data-testid="button-quick-trends"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Trends
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => handleSuggestionClick('Show compliance recommendations')}
            data-testid="button-quick-recommendations"
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            Tips
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}