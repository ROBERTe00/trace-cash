import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: { name: string };
  publishedAt: string;
  impactScore: number;
}

export const NewsSection = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ["filtered-news"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-filtered-news");
      if (error) throw error;
      return data.news as NewsArticle[];
    },
    refetchInterval: 1000 * 60 * 60, // Refresh hourly
    staleTime: 1000 * 60 * 30, // Consider stale after 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!news || news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            📰 High-Impact Financial News
          </h3>
          <p className="text-sm text-muted-foreground">AI-filtered market-moving events</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No high-impact news at the moment. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          📰 High-Impact Financial News
        </h3>
        <p className="text-sm text-muted-foreground">AI-filtered market-moving events (refreshes hourly)</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {news.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 border rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="flex items-start gap-3">
              {article.urlToImage && (
                <img 
                  src={article.urlToImage} 
                  alt="" 
                  className="w-20 h-20 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span>{article.source.name}</span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={article.impactScore >= 8 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    Impact: {article.impactScore}/10
                  </Badge>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
