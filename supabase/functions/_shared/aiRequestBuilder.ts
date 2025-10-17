// AI Request Builder with Rule Engine Integration
// Centralizes AI API calls, rule evaluation, and audit logging

import { evaluatePortfolioRules, formatRulesForAI, Portfolio, RuleResult } from './ruleEngine.ts';

export interface AIRequestConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPrompt: string;
}

export interface AIResponse {
  summary: string;
  rawResponse: any;
  ruleResult: RuleResult | null;
  latency: number;
}

export interface AuditLogData {
  userId: string;
  feature: string;
  aiModel: string;
  temperature: number;
  inputPrompt: string;
  aiRawResponse: string;
  uiSummary: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

/**
 * Generate AI summary with rule engine integration
 * @param portfolio Portfolio data for rule evaluation (optional)
 * @param config AI request configuration
 * @param openaiApiKey OpenAI API key
 * @returns AI response with rule results
 */
export async function generateAISummary(
  portfolio: Portfolio | null,
  config: AIRequestConfig,
  openaiApiKey: string
): Promise<AIResponse> {
  let ruleResult: RuleResult | null = null;
  let enhancedSystemPrompt = config.systemPrompt;
  let enhancedUserPrompt = config.userPrompt;

  // Run rule engine if portfolio provided
  if (portfolio) {
    ruleResult = evaluatePortfolioRules(portfolio);
    const rulesPrompt = formatRulesForAI(ruleResult);
    
    console.log('Rule Engine Result:', JSON.stringify(ruleResult, null, 2));
    
    // Prepend rules to user prompt
    enhancedUserPrompt = rulesPrompt + config.userPrompt;
  }

  const messages = [
    { role: "system", content: enhancedSystemPrompt },
    { role: "user", content: enhancedUserPrompt }
  ];

  const aiPayload = {
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages
  };

  const startTime = Date.now();
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(aiPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;
  const summary = data?.choices?.[0]?.message?.content || "AI response unavailable.";

  return {
    summary,
    rawResponse: data,
    ruleResult,
    latency
  };
}

/**
 * Log AI request to audit logs
 * @param supabase Supabase client
 * @param logData Audit log data
 */
export async function logAIRequest(
  supabase: any,
  logData: AuditLogData
): Promise<void> {
  try {
    await supabase.from("ai_audit_logs").insert({
      user_id: logData.userId,
      feature: logData.feature,
      ai_model: logData.aiModel,
      temperature: logData.temperature,
      input_prompt: logData.inputPrompt,
      ai_raw_response: logData.aiRawResponse,
      ui_summary: logData.uiSummary,
      latency_ms: logData.latencyMs,
      success: logData.success,
      error: logData.error || null,
    });
  } catch (error) {
    console.error('Failed to log AI audit:', error);
  }
}

/**
 * Complete AI request with rule engine and logging
 * Convenience function that combines generateAISummary and logAIRequest
 */
export async function executeAIRequest(
  portfolio: Portfolio | null,
  config: AIRequestConfig,
  openaiApiKey: string,
  supabase: any,
  userId: string,
  feature: string
): Promise<AIResponse> {
  const response = await generateAISummary(portfolio, config, openaiApiKey);

  // Prepare audit log data
  const inputPrompt = portfolio && response.ruleResult
    ? `RULE ENGINE: ${JSON.stringify(response.ruleResult)}\n\nPROMPT: ${config.userPrompt}`
    : config.userPrompt;

  const uiSummary = portfolio && response.ruleResult
    ? JSON.stringify({ summary: response.summary, rule_engine: response.ruleResult })
    : response.summary;

  await logAIRequest(supabase, {
    userId,
    feature,
    aiModel: config.model,
    temperature: config.temperature,
    inputPrompt,
    aiRawResponse: JSON.stringify(response.rawResponse),
    uiSummary,
    latencyMs: response.latency,
    success: true,
  });

  return response;
}
