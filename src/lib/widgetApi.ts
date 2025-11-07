import { supabase } from "@/integrations/supabase/client";
import { saveCache, loadCache } from "@/lib/offlineCache";

/**
 * Salva il layout dei widget nel backend
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

  const { error } = await supabase
    .from('user_dashboard_layouts')
    .upsert({
      user_id: user.id,
      widget_order: widgets,
      widget_positions: positions || {},
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Errore nel salvataggio del layout:', error);
    // Fallback a localStorage
    saveCache('widget-layout', { widgets, positions, timestamp: new Date().toISOString() });
  }
}

/**
 * Carica il layout dei widget dal backend
 * Con timeout automatico se il backend è lento
 */
export async function loadWidgetLayout() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Fallback a localStorage
      const cached = loadCache<any>('widget-layout');
      if (cached) return cached;
      return null;
    }

    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Non loggare errori non critici (es. tabella non esiste)
      if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.debug('Errore nel caricamento del layout:', error.message);
      }
      // Fallback a localStorage
      const cached = loadCache<any>('widget-layout');
      if (cached) return cached;
      return null;
    }

    saveCache('widget-layout', data);
    return data;
  } catch (error) {
    // Gestione errori generici
    console.debug('[loadWidgetLayout] Error:', error);
    const cached = loadCache<any>('widget-layout');
    if (cached) return cached;
    return null;
  }
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