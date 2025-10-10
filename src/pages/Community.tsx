import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Heart, Share2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getInvestments } from "@/lib/storage";

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

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    setPosts(data || []);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) {
      toast.error("Please write something");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to post");
        return;
      }

      const portfolioData = sharePortfolio ? {
        investments: getInvestments().map(inv => ({
          type: inv.type,
          profit: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100).toFixed(1),
        })),
      } : null;

      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        content: newPost,
        is_anonymous: isAnonymous,
        portfolio_data: portfolioData,
      });

      if (error) throw error;

      toast.success("Post shared!");
      setNewPost("");
      setSharePortfolio(false);
      fetchPosts();
    } catch (error) {
      console.error("Error posting:", error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Community Feed</h1>
          <p className="text-muted-foreground">Share insights and learn from others</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span>{posts.length} posts</span>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Share Your Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your financial journey, tips, or ask for advice..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <Label htmlFor="anonymous">Post anonymously</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="share-portfolio"
                  checked={sharePortfolio}
                  onCheckedChange={setSharePortfolio}
                />
                <Label htmlFor="share-portfolio">Share masked portfolio stats</Label>
              </div>
            </div>
            <Button onClick={handlePost} disabled={loading}>
              <Share2 className="h-4 w-4 mr-2" />
              Post
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
                      {post.is_anonymous ? "Anonymous User" : "Community Member"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{post.content}</p>
                  {post.portfolio_data && (
                    <div className="p-3 bg-primary/5 rounded-lg text-sm">
                      <p className="font-medium mb-1">📊 Portfolio Stats:</p>
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
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
