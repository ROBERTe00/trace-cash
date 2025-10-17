import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!NEWS_API_KEY || !LOVABLE_API_KEY) {
      throw new Error("Missing required API keys");
    }

    console.log("Fetching news from NewsAPI...");

    // Fetch from NewsAPI
    const newsRes = await fetch(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`
    );

    if (!newsRes.ok) {
      const errorText = await newsRes.text();
      console.error("NewsAPI error:", newsRes.status, errorText);
      throw new Error(`NewsAPI failed: ${newsRes.status}`);
    }

    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    console.log(`Fetched ${articles.length} articles, scoring with AI...`);

    // AI Scoring for high-impact (>= 6)
    const scoredArticles = [];

    for (const article of articles.slice(0, 10)) {
      try {
        const prompt = `Rate the financial market impact of this news on a scale of 0-10. Only respond with a number.\n\nTitle: ${article.title}\nDescription: ${article.description}`;
        
        const startTime = Date.now();
        const scoreRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "Score news impact on financial markets 0-10. Output ONLY a number. High-impact: Fed decisions, major geopolitical events, tech earnings surprises, major policy changes."
              },
              {
                role: "user",
                content: `Title: "${article.title}". Description: "${article.description || 'No description'}"`
              }
            ],
          }),
        });

        if (!scoreRes.ok) {
          if (scoreRes.status === 429) {
            console.warn("Rate limit hit, using default score");
            continue;
          }
          if (scoreRes.status === 402) {
            console.warn("Payment required, using default score");
            continue;
          }
          console.error("AI scoring error:", scoreRes.status);
          continue;
        }

        const scoreData = await scoreRes.json();
        const latency = Date.now() - startTime;
        const scoreText = scoreData.choices[0]?.message?.content?.trim() || "0";
        const score = parseInt(scoreText.match(/\d+/)?.[0] || "0");

        // Log to ai_audit_logs
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const authHeader = req.headers.get('Authorization');
          const token = authHeader?.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            await supabase.from('ai_audit_logs').insert({
              user_id: user.id,
              feature: 'news_impact_scoring',
              ai_model: 'google/gemini-2.5-flash',
              input_prompt: prompt,
              ai_raw_response: scoreText,
              ui_summary: `Impact score: ${score}`,
              latency_ms: latency,
              success: true
            });
          }
        } catch (logError) {
          console.error('Failed to log AI audit:', logError);
        }

        if (score >= 6) {
          scoredArticles.push({
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage,
            source: article.source,
            publishedAt: article.publishedAt,
            impactScore: score,
          });
        }
      } catch (error) {
        console.error("Error scoring article:", error);
        // Continue to next article
      }
    }

    console.log(`Found ${scoredArticles.length} high-impact articles`);

    // Return top 5
    const topNews = scoredArticles
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5);

    return new Response(JSON.stringify({ news: topNews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in fetch-filtered-news:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', news: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
