// Deterministic rule engine for portfolio risk assessment
// This runs BEFORE AI to enforce hard rules that AI cannot contradict

export interface Portfolio {
  crypto_allocation?: number;
  bonds_allocation?: number;
  cash_balance?: number;
  equities_allocation?: number;
  assets?: Array<{
    name: string;
    weight: number;
    value: number;
    type: string;
  }>;
}

export interface RuleResult {
  risk_level: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  risk_label: "Low" | "Moderate" | "High" | "Critical";
  diversification: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
  liquidity_warning: boolean;
  notes: string[];
  score: number;
  mandatory_actions: string[];
}

export function evaluatePortfolioRules(portfolio: Portfolio): RuleResult {
  const result: RuleResult = {
    risk_level: "Medium",
    risk_label: "Low",
    diversification: "Good",
    liquidity_warning: false,
    notes: [],
    score: 0,
    mandatory_actions: [],
  };

  const {
    crypto_allocation = 0,
    bonds_allocation = 0,
    cash_balance = 0,
    equities_allocation = 0,
    assets = [],
  } = portfolio;

  // 1️⃣ CRITICAL: Crypto Exposure Rules (These MUST be enforced)
  if (crypto_allocation > 70) {
    result.risk_level = "Very High";
    result.score += 5;
    result.notes.push("⚠️ CRITICAL: Excessive crypto exposure (>70%).");
    result.mandatory_actions.push(
      "MANDATORY: Reduce crypto allocation to below 20% immediately. Diversify into ETFs, bonds, and cash."
    );
  } else if (crypto_allocation > 50) {
    result.risk_level = "High";
    result.score += 4;
    result.notes.push("⚠️ HIGH RISK: Crypto allocation exceeds 50%.");
    result.mandatory_actions.push(
      "MANDATORY: Reduce crypto allocation to below 30%. Consider diversified ETFs and bonds."
    );
  } else if (crypto_allocation > 30) {
    result.risk_level = "High";
    result.score += 3;
    result.notes.push("⚠️ Elevated crypto exposure (>30%).");
    result.mandatory_actions.push(
      "RECOMMENDED: Reduce crypto allocation to 20-25% for better risk management."
    );
  }

  // 2️⃣ Diversification Rules
  if (assets.length > 0) {
    const largestAsset = Math.max(...assets.map((a) => a.weight || 0));
    
    if (largestAsset > 50) {
      result.diversification = "Very Poor";
      result.notes.push(`⚠️ CRITICAL: Single asset concentration > 50% (${largestAsset.toFixed(1)}%).`);
      result.score += 4;
      result.mandatory_actions.push(
        "MANDATORY: Reduce single asset concentration below 30%. Diversify across multiple assets."
      );
    } else if (largestAsset > 40) {
      result.diversification = "Poor";
      result.notes.push(`⚠️ High concentration in one asset (${largestAsset.toFixed(1)}%).`);
      result.score += 3;
      result.mandatory_actions.push(
        "RECOMMENDED: Reduce concentration to below 30% for better diversification."
      );
    } else if (largestAsset > 30) {
      result.diversification = "Fair";
      result.notes.push(`Concentration above recommended threshold (${largestAsset.toFixed(1)}%).`);
      result.score += 2;
    } else if (assets.length >= 5) {
      result.diversification = "Excellent";
      result.notes.push("✅ Well-diversified portfolio across multiple assets.");
    }
  }

  // 3️⃣ Liquidity Rules
  if (cash_balance < 5) {
    result.liquidity_warning = true;
    result.notes.push(
      `⚠️ LOW LIQUIDITY: Cash balance < 5% (${cash_balance.toFixed(1)}%). Risk of inability to cover short-term costs.`
    );
    result.score += 3;
    result.mandatory_actions.push(
      "RECOMMENDED: Maintain at least 5-10% cash reserves for emergencies and short-term needs."
    );
  } else if (cash_balance < 10) {
    result.notes.push(
      `Low cash reserves (${cash_balance.toFixed(1)}%). Consider building emergency fund.`
    );
    result.score += 1;
  }

  // 4️⃣ Balance between asset classes
  const total = crypto_allocation + bonds_allocation + equities_allocation + cash_balance;
  if (total < 95 || total > 105) {
    result.notes.push(
      `⚠️ Asset allocation imbalance detected (Total: ${total.toFixed(1)}%). Verify weighting accuracy.`
    );
    result.score += 1;
  }

  // 5️⃣ Conservative vs Aggressive Balance
  if (bonds_allocation > 50 && crypto_allocation < 10) {
    result.risk_level = "Low";
    result.notes.push("✅ Conservative portfolio with strong bond allocation.");
  } else if (bonds_allocation < 10 && equities_allocation > 60) {
    result.risk_level = "High";
    result.notes.push("⚠️ Aggressive equity-heavy portfolio. Consider adding bonds for stability.");
    result.score += 2;
  }

  // 6️⃣ Risk Score Normalization
  if (result.score >= 8) {
    result.risk_label = "Critical";
  } else if (result.score >= 5) {
    result.risk_label = "High";
  } else if (result.score >= 3) {
    result.risk_label = "Moderate";
  } else {
    result.risk_label = "Low";
  }

  return result;
}

// Helper function to format rule results for AI prompt injection
export function formatRulesForAI(ruleResult: RuleResult): string {
  let prompt = `\n\n=== DETERMINISTIC PORTFOLIO RULES (AI MUST NOT CONTRADICT) ===\n`;
  prompt += `Risk Level: ${ruleResult.risk_level}\n`;
  prompt += `Risk Label: ${ruleResult.risk_label}\n`;
  prompt += `Diversification: ${ruleResult.diversification}\n`;
  prompt += `Risk Score: ${ruleResult.score}/10\n`;
  
  if (ruleResult.liquidity_warning) {
    prompt += `⚠️ LIQUIDITY WARNING ACTIVE\n`;
  }
  
  if (ruleResult.notes.length > 0) {
    prompt += `\nRule Engine Findings:\n`;
    ruleResult.notes.forEach((note) => {
      prompt += `- ${note}\n`;
    });
  }
  
  if (ruleResult.mandatory_actions.length > 0) {
    prompt += `\n🚨 MANDATORY ACTIONS (AI MUST ENFORCE):\n`;
    ruleResult.mandatory_actions.forEach((action) => {
      prompt += `- ${action}\n`;
    });
  }
  
  prompt += `\n=== END DETERMINISTIC RULES ===\n\n`;
  prompt += `YOU MUST incorporate these deterministic findings into your analysis and recommendations. These are hard rules based on financial safety principles.\n`;
  
  return prompt;
}
