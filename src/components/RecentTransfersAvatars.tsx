import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";

interface RecentTransfer {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const recentTransfers: RecentTransfer[] = [
  { id: "1", name: "Marco Rossi", initials: "MR", color: "bg-purple-500" },
  { id: "2", name: "Laura Bianchi", initials: "LB", color: "bg-green-500" },
  { id: "3", name: "Giovanni Verdi", initials: "GV", color: "bg-primary" },
  { id: "4", name: "Sofia Neri", initials: "SN", color: "bg-orange-500" },
  { id: "5", name: "Alessandro Gialli", initials: "AG", color: "bg-pink-500" },
];

export const RecentTransfersAvatars = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trasferimenti Recenti</h3>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <TooltipProvider>
          {recentTransfers.map((transfer) => (
            <Tooltip key={transfer.id}>
              <TooltipTrigger asChild>
                <button className="flex-shrink-0 hover:scale-110 transition-transform">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                    <AvatarFallback className={`${transfer.color} text-white font-semibold`}>
                      {transfer.initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{transfer.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex-shrink-0 hover:scale-110 transition-transform">
                <Avatar className="h-14 w-14 border-2 border-dashed border-muted-foreground/50 bg-muted/50">
                  <AvatarFallback className="bg-transparent">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Aggiungi nuovo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
