import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle, Eye, Database, FileCheck, Server } from 'lucide-react';
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
      color: 'text-green-600',
    },
    {
      icon: Lock,
      label: 'End-to-End Encryption',
      description: 'Your data is encrypted using AES-256 encryption',
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      label: 'ISO 27001',
      description: 'International standard for information security management',
      color: 'text-purple-600',
    },
    {
      icon: Eye,
      label: 'Privacy First',
      description: 'Zero-knowledge architecture - we cannot see your data',
      color: 'text-indigo-600',
    },
    {
      icon: Database,
      label: 'Row Level Security',
      description: 'Enterprise-grade database security with RLS policies',
      color: 'text-orange-600',
    },
    {
      icon: FileCheck,
      label: 'Audit Logging',
      description: 'Complete audit trail of all data access and modifications',
      color: 'text-red-600',
    },
    {
      icon: Server,
      label: 'EU Data Center',
      description: 'Your data is stored in secure EU data centers',
      color: 'text-teal-600',
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
                className={`flex items-center gap-1 px-3 py-1.5 cursor-help hover:bg-muted/50 transition-colors ${badge.color}`}
              >
                <badge.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{badge.label}</span>
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
