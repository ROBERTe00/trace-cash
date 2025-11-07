// Centralized Chart.js registration to avoid multiple registrations
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  RadialLinearScale,
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';

let chartRegistered = false;

export const registerChartJS = () => {
  if (!chartRegistered) {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      RadialLinearScale, // Necessario per grafici Radar
      PointElement,
      LineElement,
      BarElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );
    chartRegistered = true;
    console.log('[ChartRegistry] Chart.js registered');
  }
};

// Lazy loader per Chart.js (per future ottimizzazioni)
export const loadChartJS = async () => {
  if (typeof window === 'undefined') return null;
  
  registerChartJS();
  
  // Dynamic import dei componenti react-chartjs-2 quando necessario
  const chartComponents = await import('react-chartjs-2');
  
  return { ChartJS, ...chartComponents };
};
