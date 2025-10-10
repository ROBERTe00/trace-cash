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
  const [detectedExpense, setDetectedExpense] = useState<Omit<Expense, "id"> | null>(null);

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
        setDetectedExpense(expense);
        toast.success("Expense detected! Review and confirm below");
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

  const handleConfirm = () => {
    if (detectedExpense) {
      onExpenseDetected(detectedExpense);
      toast.success(`Added ${detectedExpense.amount}€ to ${detectedExpense.category}!`);
      setDetectedExpense(null);
      setTranscript("");
    }
  };

  const handleCancel = () => {
    setDetectedExpense(null);
    setTranscript("");
  };

  return (
    <Card className="glass-card p-4">
      <div className="space-y-4">
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

        {detectedExpense && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Detected Expense</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{detectedExpense.amount}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{detectedExpense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description:</span>
                <span className="font-medium">{detectedExpense.description}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleConfirm} size="sm" className="flex-1">
                Confirm & Add
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
