import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ComplianceBadges() {
  const badges = [
    {
      icon: Shield,
      label: 'GDPR Compliant',
      description: 'Full compliance with European data protection regulations',
      color: 'bg-green-500',
    },
    {
      icon: Lock,
      label: 'End-to-End Encryption',
      description: 'Your data is encrypted using AES-256 encryption',
      color: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Secure Connection',
      description: 'TLS 1.3 encrypted communication',
      color: 'bg-purple-500',
    },
    {
      icon: Eye,
      label: 'Privacy First',
      description: 'Zero-knowledge architecture - we cannot see your data',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <Tooltip key={index}>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-3 py-1.5 cursor-help"
              >
                <badge.icon className="h-3 w-3" />
                {badge.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
