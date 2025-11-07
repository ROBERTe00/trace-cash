export function toReturns(series: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    const curr = series[i];
    if (prev > 0) r.push((curr - prev) / prev);
  }
  return r;
}

export function stdev(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function annualizeVol(monthlyVol: number): number {
  return monthlyVol * Math.sqrt(12);
}

export function sharpe(monthlyReturns: number[], rfAnnual = 0.01): number {
  if (!monthlyReturns.length) return 0;
  const rfMonthly = Math.pow(1 + rfAnnual, 1 / 12) - 1;
  const excess = monthlyReturns.map(r => r - rfMonthly);
  const meanExcess = excess.reduce((a, b) => a + b, 0) / excess.length;
  const vol = stdev(monthlyReturns);
  if (vol === 0) return 0;
  const sharpeMonthly = meanExcess / vol;
  return sharpeMonthly * Math.sqrt(12);
}

export function maxDrawdown(series: number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of series) {
    peak = Math.max(peak, v);
    if (peak > 0) {
      const dd = (v - peak) / peak;
      mdd = Math.min(mdd, dd);
    }
  }
  return mdd;
}


