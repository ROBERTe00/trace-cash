import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Heart, Share2, Users, Trophy, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getInvestments, getExpenses } from "@/lib/storage";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { PrivacyConsent } from "@/components/PrivacyConsent";
import { MotivationalInsights } from "@/components/MotivationalInsights";
import { TemplateSharing } from "@/components/TemplateSharing";
import { z } from "zod";

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(1000, "Post is too long (max 1000 characters)").trim(),
  is_anonymous: z.boolean(),
  portfolio_data: z.any().nullable(),
});

interface Post {
  id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  portfolio_data?: any;
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sharePortfolio, setSharePortfolio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Calculate user metrics for leaderboard
  const investments = getInvestments();
  const expenses = getExpenses();
  const portfolioValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  const portfolioReturn = investments.length > 0
    ? investments.reduce((sum, inv) => 
        sum + ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100), 0
      ) / investments.length
    : 0;
  
  // Mock percentile - in production this would be calculated from aggregated data
  const userPercentile = portfolioValue > 100000 ? 15 : portfolioValue > 50000 ? 35 : portfolioValue > 25000 ? 55 : 75;

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts_public")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
      return;
    }

    setPosts(data || []);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to post");
        setLoading(false);
        return;
      }

      const portfolioData = sharePortfolio ? {
        investments: getInvestments().map(inv => ({
          type: inv.type,
          profit: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100).toFixed(1),
        })),
      } : null;

      // Validate input
      const validation = postSchema.safeParse({
        content: newPost,
        is_anonymous: isAnonymous,
        portfolio_data: portfolioData,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        content: validation.data.content,
        is_anonymous: validation.data.is_anonymous,
        portfolio_data: validation.data.portfolio_data,
      });

      if (error) throw error;

      toast.success("Post shared!");
      setNewPost("");
      setSharePortfolio(false);
      fetchPosts();
    } catch (error) {
      console.error("Failed to post");
      toast.error("Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("community_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (!error) {
        toast.success("Liked!");
        fetchPosts();
      }
    } catch (error) {
      console.error("Error liking:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Community Hub</h1>
          <p className="text-muted-foreground">Confronta, impara e cresci con la community</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
            <Users className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm lg:text-base">12.5k utenti attivi</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
            <Trophy className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm lg:text-base">Top {userPercentile}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Classifica
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Insight AI
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Share2 className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="feed" className="gap-2">
            <Users className="h-4 w-4" />
            Feed ({posts.length})
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LeaderboardWidget
                userPercentile={hasConsented ? userPercentile : undefined}
                userPortfolio={hasConsented ? portfolioValue : undefined}
                userReturn={hasConsented ? portfolioReturn : undefined}
              />
            </div>
            <div>
              <PrivacyConsent onConsentChange={setHasConsented} />
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {hasConsented ? (
            <MotivationalInsights
              userPercentile={userPercentile}
              userPortfolio={portfolioValue}
              userReturn={portfolioReturn}
            />
          ) : (
            <Card className="glass-card p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Consenso Richiesto</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Attiva la condivisione dati nella tab Classifica per ricevere insight personalizzati 
                basati sui benchmark della community.
              </p>
              <Button onClick={() => document.querySelector('[value="leaderboard"]')?.dispatchEvent(new Event('click'))}>
                Vai alle Impostazioni Privacy
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <TemplateSharing />
        </TabsContent>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-6">

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Condividi la Tua Esperienza</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Condividi il tuo percorso finanziario, suggerimenti o chiedi consigli..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={4}
          />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous" className="text-sm">Pubblica in modo anonimo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="share-portfolio"
                  checked={sharePortfolio}
                  onCheckedChange={setSharePortfolio}
                />
                <Label htmlFor="share-portfolio" className="text-sm">Condividi statistiche portfolio</Label>
              </div>
            </div>
            <Button onClick={handlePost} disabled={loading} className="w-full sm:w-auto">
              <Share2 className="h-4 w-4 mr-2" />
              Pubblica
            </Button>
          </div>
        </CardContent>
      </Card>

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="glass-card hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 bg-primary/10">
                      <div className="text-primary font-bold">
                        {post.is_anonymous ? "?" : "U"}
                      </div>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {post.is_anonymous ? "Utente Anonimo" : "Membro Community"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <p className="text-sm">{post.content}</p>
                      {post.portfolio_data && (
                        <div className="p-3 bg-primary/5 rounded-lg text-sm">
                          <p className="font-medium mb-1">📊 Statistiche Portfolio:</p>
                          <div className="flex gap-4">
                            {post.portfolio_data.investments?.map((inv: any, i: number) => (
                              <span key={i} className="text-muted-foreground">
                                {inv.type}: {inv.profit}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Rispondi
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
