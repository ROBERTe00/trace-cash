import { supabase } from "@/integrations/supabase/client";
import { saveCache, loadCache } from "@/lib/offlineCache";

/**
 * Salva il layout dei widget nel backend
 * NOTA: La tabella user_dashboard_layouts non esiste ancora nel database
 * Questa funzionalità è attualmente disabilitata
 */
export async function saveWidgetLayout(
  widgets: string[], 
  positions?: Record<string, number>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Fallback a localStorage se non autenticato
    saveCache('widget-layout', { widgets, positions, timestamp: new Date().toISOString() });
    return;
  }

  // TODO: Abilitare quando la tabella user_dashboard_layouts sarà creata
  // const { error } = await supabase
  //   .from('user_dashboard_layouts')
  //   .upsert({
  //     user_id: user.id,
  //     widget_order: widgets,
  //     widget_positions: positions || {},
  //     updated_at: new Date().toISOString()
  //   }, {
  //     onConflict: 'user_id'
  //   });

  // Per ora salva solo in localStorage
  saveCache('widget-layout', { widgets, positions, timestamp: new Date().toISOString() });
}

/**
 * Carica il layout dei widget dal backend
 * NOTA: La tabella user_dashboard_layouts non esiste ancora nel database
 */
export async function loadWidgetLayout() {
  // Per ora usa solo localStorage
  return loadCache('widget-layout');
}

/**
 * Genera nuovi insights tramite AI
 */
export async function generateAIInsights() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
    body: { user_id: user.id }
  });

  if (error) throw error;
  return data;
}

/**
 * Esporta dati del widget in formato CSV
 */
export function exportWidgetDataToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Esporta dati del widget in formato PDF (richiede jsPDF)
 */
export async function exportWidgetDataToPDF(data: any[], filename: string) {
  // TODO: Implementare con jsPDF
  console.log('Export PDF da implementare:', { data, filename });
}

/**
 * Salva un grafico generato dall'AI nella dashboard
 */
export async function saveChartToDashboard(
  chartConfig: any,
  chartMetadata: {
    title: string;
    type: string;
    timeframe: string;
    symbols?: string[];
    prompt?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Devi essere autenticato per salvare grafici');
  }

  // Salva in localStorage come fallback
  const savedCharts = JSON.parse(localStorage.getItem('mymoney-saved-charts') || '[]');
  const newChart = {
    id: `chart-${Date.now()}`,
    userId: user.id,
    config: chartConfig,
    metadata: chartMetadata,
    createdAt: new Date().toISOString()
  };
  
  savedCharts.push(newChart);
  localStorage.setItem('mymoney-saved-charts', JSON.stringify(savedCharts));

  // TODO: Salvare anche in Supabase se esiste tabella saved_charts
  console.log('[widgetApi] Chart saved:', newChart.id);
  
  return newChart;
}

/**
 * Carica i grafici salvati dell'utente
 */
export async function loadSavedCharts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const savedCharts = JSON.parse(localStorage.getItem('mymoney-saved-charts') || '[]');
  return savedCharts.filter((chart: any) => chart.userId === user.id);
}

/**
 * Elimina un grafico salvato
 */
export async function deleteSavedChart(chartId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const savedCharts = JSON.parse(localStorage.getItem('mymoney-saved-charts') || '[]');
  const filtered = savedCharts.filter((chart: any) => chart.id !== chartId || chart.userId !== user.id);
  localStorage.setItem('mymoney-saved-charts', JSON.stringify(filtered));
}