import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Search, ExternalLink, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  impact_score?: number;
  category?: string;
}

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "markets" | "policy">("all");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 3600000); // refresh every hour
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-filtered-news", {
        body: { category: "finance" },
      });

      if (error) throw error;

      setArticles(data?.articles || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch news:", error);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ? true :
      filter === "high" ? (article.impact_score || 0) >= 8 :
      filter === "markets" ? article.category?.includes("market") :
      filter === "policy" ? article.category?.includes("policy") :
      true;
    
    return matchesSearch && matchesFilter;
  });

  const getImpactColor = (score?: number) => {
    if (!score) return "bg-muted";
    if (score >= 8) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (score >= 6) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-green-500/10 text-green-500 border-green-500/20";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-background border border-blue-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Newspaper className="icon-card text-blue-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Market News & Insights</h1>
                <p className="text-muted-foreground mt-1">Stay updated with financial markets</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="icon-button" />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Filter Bar */}
      <Card className="glass-card sticky top-20 z-30 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="icon-button absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("high")}
              >
                High Impact (8+)
              </Button>
              <Button
                variant={filter === "markets" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("markets")}
              >
                Markets
              </Button>
              <Button
                variant={filter === "policy" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("policy")}
              >
                Policy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <Card
              key={index}
              className="glass-card hover-lift group cursor-pointer overflow-hidden"
              onClick={() => window.open(article.url, "_blank")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  {article.impact_score && (
                    <Badge className={getImpactColor(article.impact_score)}>
                      Impact: {article.impact_score}
                    </Badge>
                  )}
                  <ExternalLink className="icon-button opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {article.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{article.source}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <Card className="glass-card p-12 text-center">
          <Newspaper className="icon-hero text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search term</p>
        </Card>
      )}
    </div>
  );
}
