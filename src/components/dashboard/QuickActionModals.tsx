import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ArrowUpRight, ArrowDownLeft, Repeat, Plus } from "lucide-react";
import { toast } from "sonner";

interface QuickActionModalsProps {
  activeModal: 'send' | 'request' | 'exchange' | 'topup' | null;
  onClose: () => void;
}

export const QuickActionModals = ({ activeModal, onClose }: QuickActionModalsProps) => {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSubmit = (action: string) => {
    toast.success(`${action} action completed`, {
      description: `Amount: $${amount}`,
    });
    setAmount("");
    setRecipient("");
    onClose();
  };

  return (
    <>
      {/* Send Modal */}
      <Dialog open={activeModal === 'send'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Send Money</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="send-recipient">Recipient</Label>
              <Input
                id="send-recipient"
                placeholder="Enter name or account"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="send-amount">Amount (AUD)</Label>
              <Input
                id="send-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Send")}
            >
              Send ${amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Modal */}
      <Dialog open={activeModal === 'request'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Request Money</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="request-from">Request from</Label>
              <Input
                id="request-from"
                placeholder="Enter name or email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="request-amount">Amount (AUD)</Label>
              <Input
                id="request-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Request")}
            >
              Request ${amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exchange Modal */}
      <Dialog open={activeModal === 'exchange'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Exchange Currency</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exchange-from">From</Label>
              <Input
                id="exchange-from"
                placeholder="AUD"
                defaultValue="AUD"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="exchange-to">To</Label>
              <Input
                id="exchange-to"
                placeholder="USD, EUR, GBP..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="exchange-amount">Amount</Label>
              <Input
                id="exchange-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Exchange")}
            >
              Exchange ${amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Up Modal */}
      <Dialog open={activeModal === 'topup'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Top Up Account</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topup-method">Payment Method</Label>
              <Input
                id="topup-method"
                placeholder="Credit Card, Bank Transfer..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="topup-amount">Amount (AUD)</Label>
              <Input
                id="topup-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Top Up")}
            >
              Add ${amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
