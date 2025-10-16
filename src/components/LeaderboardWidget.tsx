import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  id: string;
  anonymous_name: string;
  total_points: number;
  level: number;
  rank: number;
  achievements_count: number;
}

export const LeaderboardWidget = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard-top'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('period', 'all_time')
        .order('rank', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-background">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">🏆 Leaderboard</h3>
      </div>
      
      <div className="space-y-3">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                entry.rank === 1 
                  ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20' 
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                
                <div>
                  <p className="font-medium">{entry.anonymous_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {entry.level} · {entry.achievements_count} achievements
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-primary">{entry.total_points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Leaderboard is empty</p>
            <p className="text-xs">Be the first to climb the ranks!</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Keep tracking to climb the leaderboard!</span>
        </div>
      </div>
    </Card>
  );
};
