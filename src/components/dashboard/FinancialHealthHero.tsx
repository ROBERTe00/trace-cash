import React from 'react';
import { motion } from 'framer-motion';
import { Star, Flame, Target, TrendingUp } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface FinancialHealthHeroProps {
  totalIncome: number;
  savings: number;
  savingsRate: number;
  healthScore: number;
  monthlyProgress: number;
  incomeChange: number;
}

export function FinancialHealthHero({
  totalIncome,
  savings,
  savingsRate,
  healthScore,
  monthlyProgress,
  incomeChange,
}: FinancialHealthHeroProps) {
  const { userLevel } = useGamification();
  const currentLevel = userLevel?.level || 1;
  const streak = userLevel?.current_streak || 0;

  const completedQuests = 3;
  const totalQuests = 5;

  // Calculate level from health score
  const level = Math.floor(healthScore / 25) + 1;
  const levelMax = 4;

  // Progress ring calculation
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Content */}
      <div className="relative p-8 text-white">
        {/* PRIMA RIGA: Saldo + Health Score */}
        <div className="flex justify-between items-start mb-8">
          {/* Saldo */}
          <div>
            <div className="text-sm opacity-80 mb-2">Saldo Totale</div>
            <div className="text-5xl font-bold font-mono mb-2 tracking-tight">
              €{totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 text-green-300 text-sm font-medium">
              <TrendingUp className="w-5 h-5" />
              {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs mese scorso
            </div>
          </div>

          {/* Health Score con Progress Ring */}
          <div className="text-right">
            <div className="text-sm opacity-80 mb-3">Health Score</div>
            <div className="relative inline-block">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="transparent"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ADE80" />
                    <stop offset="100%" stopColor="#22C55E" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-3xl font-bold">{healthScore}</div>
                  <div className="text-sm opacity-70">/100</div>
                </div>
              </div>
            </div>
            <div className="text-xs opacity-70 mt-2">
              • Livello {level}/{levelMax}
            </div>
          </div>
        </div>

        {/* SECONDA RIGA: Barra Progresso Mensile */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="opacity-90 font-medium">Progresso Mensile</span>
            <span className="font-bold">{monthlyProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthlyProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-green-400 h-full rounded-full"
            />
          </div>
        </div>

        {/* TERZA RIGA: Metriche Rapide */}
        <div className="grid grid-cols-3 gap-4">
          {/* Risparmiato */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center cursor-pointer hover:bg-white/15 transition-all"
          >
            <div className="text-xs opacity-70 mb-2">Risparmiato</div>
            <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
          </motion.div>

          {/* Streak */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center cursor-pointer hover:bg-white/15 transition-all"
          >
            <div className="text-xs opacity-70 mb-2 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              Streak
            </div>
            <div className="text-2xl font-bold text-orange-300">
              {streak} giorni 🔥
            </div>
          </motion.div>

          {/* Quest */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center cursor-pointer hover:bg-white/15 transition-all"
          >
            <div className="text-xs opacity-70 mb-2 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />
              Quest
            </div>
            <div className="text-2xl font-bold">
              {completedQuests}/{totalQuests}
            </div>
          </motion.div>
        </div>

        {/* Badge Status */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {healthScore >= 80 && (
            <div className="flex items-center gap-2 bg-green-400/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30">
              <Star className="w-5 h-5 text-green-300" />
              <span className="text-sm font-semibold text-green-300">Ottimo</span>
            </div>
          )}
          {healthScore >= 60 && healthScore < 80 && (
            <div className="flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold text-yellow-300">Buono</span>
            </div>
          )}
          {healthScore < 60 && (
            <div className="flex items-center gap-2 bg-orange-400/20 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-400/30">
              <Target className="w-5 h-5 text-orange-300" />
              <span className="text-sm font-semibold text-orange-300">Da Migliorare</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

