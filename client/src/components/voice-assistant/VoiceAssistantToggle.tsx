import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mic } from "lucide-react";
import { VoiceAssistant } from "./VoiceAssistant";
import { cn } from "@/lib/utils";

export function VoiceAssistantToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className={cn(
            "fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full shadow-lg",
            "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
            "border-2 border-white dark:border-gray-700",
            "transition-all duration-300 hover:scale-110"
          )}
          data-testid="button-voice-assistant-toggle"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white">
              <Mic className="w-2 h-2 text-white m-0.5" />
            </div>
          </div>
        </Button>
      )}
      
      <VoiceAssistant 
        isOpen={isOpen} 
        onToggle={handleToggle}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
      />
    </>
  );
}