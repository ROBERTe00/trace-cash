import { supabase } from "@/integrations/supabase/client";

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
    localStorage.setItem('mymoney-dashboard-layout', JSON.stringify({
      widgets,
      positions,
      timestamp: new Date().toISOString()
    }));
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
    localStorage.setItem('mymoney-dashboard-layout', JSON.stringify({
      widgets,
      positions,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Carica il layout dei widget dal backend
 */
export async function loadWidgetLayout() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Fallback a localStorage
    const saved = localStorage.getItem('mymoney-dashboard-layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Errore nel caricamento del layout:', error);
    // Fallback a localStorage
    const saved = localStorage.getItem('mymoney-dashboard-layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  return data;
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
