import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";

interface VoiceExpenseInputProps {
  onExpenseDetected: (expense: Omit<Expense, "id">) => void;
}

export const VoiceExpenseInput = ({ onExpenseDetected }: VoiceExpenseInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const parseVoiceCommand = (text: string): Omit<Expense, "id"> | null => {
    // Simple parsing logic for voice commands
    // Example: "add 50 euros food expense" or "spent 30 on transport"
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:euro|euros|€)?/i);
    const categoryKeywords: Record<string, Expense["category"]> = {
      "food": "Food & Dining",
      "dining": "Food & Dining",
      "restaurant": "Food & Dining",
      "grocery": "Food & Dining",
      "transport": "Transportation",
      "taxi": "Transportation",
      "uber": "Transportation",
      "shopping": "Shopping",
      "clothes": "Shopping",
      "entertainment": "Entertainment",
      "movie": "Entertainment",
      "healthcare": "Healthcare",
      "doctor": "Healthcare",
      "bills": "Bills & Utilities",
      "rent": "Rent",
      "other": "Other"
    };

    let category: Expense["category"] = "Other";
    const lowerText = text.toLowerCase();
    
    for (const [keyword, cat] of Object.entries(categoryKeywords)) {
      if (lowerText.includes(keyword)) {
        category = cat;
        break;
      }
    }

    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1]);
    
    return {
      type: "Expense",
      amount,
      category,
      description: `Voice: ${text}`,
      date: new Date().toISOString().split('T')[0],
      recurring: false,
    };
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now!");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      
      const expense = parseVoiceCommand(text);
      if (expense) {
        onExpenseDetected(expense);
        toast.success(`Got it! ${expense.amount}€ on ${expense.category} 🎉`);
      } else {
        toast.error("Couldn't understand the command. Try: 'Add 50 euros food expense'");
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error("Error recognizing speech. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={startListening}
          disabled={isListening}
          variant={isListening ? "default" : "outline"}
          size="lg"
          className="gap-2"
        >
          {isListening ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Listening...
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Voice Input
            </>
          )}
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {transcript || "Try: 'Add 50 euros food expense' or 'Spent 30 on transport'"}
          </p>
        </div>
      </div>
    </Card>
  );
}
