import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageCircle,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function VoiceAssistant({ isOpen, onToggle, onMinimize, isMinimized }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Character animation states
  const [eyeState, setEyeState] = useState<'normal' | 'blink' | 'wink'>('normal');
  const [mouthState, setMouthState] = useState<'closed' | 'talking' | 'smile'>('closed');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setEyeState('normal');
        setMouthState('closed');
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Character animation intervals
    const eyeInterval = setInterval(() => {
      if (!isListening && !isSpeaking) {
        setEyeState(Math.random() > 0.9 ? 'blink' : 'normal');
        setTimeout(() => setEyeState('normal'), 150);
      }
    }, 2000);

    return () => {
      clearInterval(eyeInterval);
    };
  }, [isListening, isSpeaking, toast]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Microphone Error",
          description: "Please check your microphone permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setMouthState('talking');
    
    try {
      const newConversation = [...conversation, { role: 'user' as const, content: text }];
      
      const response = await fetch('/api/voice-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          conversation: newConversation,
          context: 'EUDR compliance assistance'
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const responseData = await response.json();
      const assistantMessage = responseData.message;
      setResponse(assistantMessage);
      
      const updatedConversation = [...newConversation, { role: 'assistant' as const, content: assistantMessage }];
      setConversation(updatedConversation);

      // Convert text to speech
      await speakText(assistantMessage);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      setResponse(errorMessage);
      await speakText(errorMessage);
      
      toast({
        title: "Processing Error",
        description: "Unable to process your voice input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setMouthState('smile');
      setTimeout(() => setMouthState('closed'), 2000);
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        setIsSpeaking(true);
        setMouthState('talking');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        
        // Try to use a female voice for friendlier interaction
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Zira')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        utterance.onend = () => {
          setIsSpeaking(false);
          setMouthState('closed');
          resolve();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setMouthState('closed');
          resolve();
        };

        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setMouthState('closed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 transition-all duration-300",
      isMinimized ? "w-16 h-16" : "w-80 h-96"
    )}>
      <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-gray-700 shadow-xl">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              {!isMinimized && (
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">EUDR Assistant</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Ask me anything!</p>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {!isMinimized && onMinimize && (
                <Button variant="ghost" size="sm" onClick={onMinimize} className="h-6 w-6 p-0">
                  <Minimize2 className="h-3 w-3" />
                </Button>
              )}
              {isMinimized && onMinimize && (
                <Button variant="ghost" size="sm" onClick={onMinimize} className="h-6 w-6 p-0">
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Character Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {/* Character face */}
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full relative overflow-hidden border-4 border-white shadow-lg">
                    {/* Eyes */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className={cn(
                        "w-3 h-3 bg-black rounded-full transition-all duration-150",
                        eyeState === 'blink' && "h-0.5",
                        eyeState === 'wink' && "h-0.5"
                      )} />
                      <div className={cn(
                        "w-3 h-3 bg-black rounded-full transition-all duration-150",
                        eyeState === 'blink' && "h-0.5"
                      )} />
                    </div>
                    
                    {/* Mouth */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      {mouthState === 'closed' && (
                        <div className="w-3 h-1 bg-black rounded-full" />
                      )}
                      {mouthState === 'talking' && (
                        <div className="w-4 h-4 bg-black rounded-full animate-pulse" />
                      )}
                      {mouthState === 'smile' && (
                        <div className="w-4 h-2 border-b-2 border-black rounded-full" />
                      )}
                    </div>

                    {/* Speaking indicator */}
                    {isSpeaking && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse">
                          <Volume2 className="w-3 h-3 text-white m-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Listening indicator */}
                    {isListening && (
                      <div className="absolute -top-2 -left-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse">
                          <Mic className="w-3 h-3 text-white m-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversation Display */}
              <div className="flex-1 overflow-y-auto mb-3 space-y-2 min-h-0">
                {conversation.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                    Hi! I'm your EUDR compliance assistant. Press the mic button and ask me anything about deforestation regulations, supply chain compliance, or plot management!
                  </div>
                )}
                
                {conversation.slice(-3).map((msg, index) => (
                  <div key={index} className={cn(
                    "p-2 rounded-lg text-xs",
                    msg.role === 'user' 
                      ? "bg-blue-500 text-white ml-4" 
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-4"
                  )}>
                    {msg.content}
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-4 p-2 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant={isListening ? "destructive" : "default"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing || isSpeaking}
                  className="flex-1"
                  data-testid="button-voice-listen"
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                  {isListening ? "Stop" : "Talk"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  data-testid="button-voice-stop"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}