import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

interface VoiceExpenseInputProps {
  onExpenseDetected: (expense: Omit<Expense, "id">) => void;
}

export const VoiceExpenseInput = ({ onExpenseDetected }: VoiceExpenseInputProps) => {
  const { t, formatCurrency } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedExpense, setDetectedExpense] = useState<Omit<Expense, "id"> | null>(null);
  const recognitionRef = useRef<any>(null);

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
      toast.error(t("voice.notSupported"));
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info(t("voice.listening") + " " + t("voice.speak"));
    };

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error(t("voice.errorRecognizing"));
      setIsListening(false);
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        setIsListening(false);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      
      const expense = parseVoiceCommand(transcript);
      if (expense) {
        setDetectedExpense(expense);
        toast.success(t("voice.detected"));
      } else {
        toast.error(t("voice.error"));
      }
    }
  };

  const handleConfirm = () => {
    if (detectedExpense) {
      onExpenseDetected(detectedExpense);
      toast.success(`${t("voice.added")} ${formatCurrency(detectedExpense.amount)} ${t("voice.to")} ${detectedExpense.category}!`);
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
          {isListening ? (
            <Button
              onClick={stopListening}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <MicOff className="h-5 w-5 animate-pulse" />
              {t("voice.stop")}
            </Button>
          ) : (
            <Button
              onClick={startListening}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Mic className="h-5 w-5" />
              {t("voice.start")}
            </Button>
          )}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {transcript || t("voice.tryExample")}
            </p>
          </div>
        </div>

        {detectedExpense && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{t("voice.detectedExpense")}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("amount")}:</span>
                <span className="font-medium">{formatCurrency(detectedExpense.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("category")}:</span>
                <span className="font-medium">{detectedExpense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("description")}:</span>
                <span className="font-medium">{detectedExpense.description}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleConfirm} size="sm" className="flex-1">
                {t("voice.confirmAdd")}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
