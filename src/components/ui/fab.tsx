import { Plus, Receipt, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: Receipt,
      label: "Nuova Spesa",
      onClick: () => {
        navigate("/transactions?action=add-expense");
        setIsOpen(false);
      },
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      icon: TrendingUp,
      label: "Nuovo Investimento",
      onClick: () => {
        navigate("/investments?action=add");
        setIsOpen(false);
      },
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: Target,
      label: "Nuovo Obiettivo",
      onClick: () => {
        navigate("/goals?action=create");
        setIsOpen(false);
      },
      color: "bg-blue-500 hover:bg-blue-600",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      <div className="fixed bottom-20 right-4 md:bottom-6 z-50 flex flex-col-reverse gap-3">
        {isOpen && (
          <>
            {actions.map((action, index) => (
              <div
                key={action.label}
                className="flex items-center gap-3 animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards"
                }}
              >
                <span className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg border">
                  {action.label}
                </span>
                <Button
                  size="lg"
                  className={cn(
                    "rounded-full w-12 h-12 shadow-lg text-white",
                    action.color
                  )}
                  onClick={action.onClick}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </>
        )}

        {/* Main FAB */}
        <Button
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-2xl gradient-primary transition-transform duration-200",
            isOpen ? "rotate-45" : "rotate-0"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Quick actions"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </div>
    </>
  );
};
