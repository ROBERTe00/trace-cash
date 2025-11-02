import { useEffect } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Goals() {
  const data = {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Fondo Emergenza',
        data: [12000, 13500, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000],
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Auto Nuova',
        data: [8000, 10000, 12000, 14000, 15750, 17500, 19250, 21000, 22750, 24500, 26250, 28000],
        borderColor: '#7B2FF7',
        backgroundColor: 'rgba(123, 47, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Acquisto Casa',
        data: [15000, 16250, 17500, 18750, 20000, 21250, 22500, 23750, 25000, 26250, 27500, 28750],
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: any) => '€' + (Number(value) / 1000) + 'k'
        }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  } as const;

  useEffect(() => {
    // animate progress bars on mount
    const bars = document.querySelectorAll('.goal-card .bg-gradient-to-r');
    bars.forEach((bar) => {
      const el = bar as HTMLElement;
      const width = el.style.width;
      el.style.width = '0%';
      setTimeout(() => {
        el.style.width = width;
      }, 300);
    });
  }, []);

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 gradient-text">I Tuoi Obiettivi Finanziari</h1>
            <p className="text-gray-400 text-lg">Pianifica, traccia e raggiungi i tuoi traguardi finanziari</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 glass-card hover:bg-white/10 transition-all hover-lift">
              <i className="fas fa-plus mr-2" />
              Nuovo Obiettivo
            </button>
            <button className="px-6 py-3 glass-card hover:bg-white/10 transition-all hover-lift">
              <i className="fas fa-chart-line mr-2" />
              Progress Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 fade-in">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">4</div>
            <div className="text-gray-400">Obiettivi Attivi</div>
            <div className="text-sm text-secondary mt-2">+1 questo mese</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">€78,450</div>
            <div className="text-gray-400">Valore Totale Obiettivi</div>
            <div className="text-sm text-primary mt-2">€45,000 raggiunti</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">57%</div>
            <div className="text-gray-400">Progresso Medio</div>
            <div className="text-sm text-secondary mt-2">+12% questo mese</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-accent mb-2">2</div>
            <div className="text-gray-400">Obiettivi Completati</div>
            <div className="text-sm text-accent mt-2">Ultimo: Fondo Emergenza</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2 glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">Obiettivi in Corso</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <i className="fas fa-filter text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <i className="fas fa-sort text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Goal cards markup shortened for brevity but maintains style */}
              <div className="goal-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-home text-purple-400 text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">Acquisto Prima Casa</h4>
                        <span className="goal-category category-long">
                          <i className="fas fa-calendar-alt" /> Lungo Termine
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Acconto per appartamento di €100,000</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                    <i className="fas fa-ellipsis-v text-gray-400" />
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progresso: 45%</span>
                    <span className="text-secondary">In linea con la pianificazione</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 fade-in">
              <h3 className="text-xl font-semibold mb-6">Progresso Complessivo</h3>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <svg className="w-40 h-40" viewBox="0 0 120 120">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
                    <circle className="text-secondary" strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" strokeDasharray="326.56" strokeDashoffset="140" transform="rotate(-90 60 60)" />
                    <text x="60" y="65" textAnchor="middle" className="text-2xl font-bold fill-white">57%</text>
                    <text x="60" y="85" textAnchor="middle" className="text-xs fill-gray-400">Completato</text>
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Obiettivi Completati</span>
                  <span className="font-semibold text-secondary">2/6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">In Progresso</span>
                  <span className="font-semibold text-primary">4/6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">In Ritardo</span>
                  <span className="font-semibold text-accent">1/6</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Proiezione Obiettivi</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <i className="fas fa-expand" />
                </button>
              </div>
            </div>
            <div className="h-80">
              <Chart type="line" data={data} options={options} />
            </div>
          </div>

          <div className="glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Piano di Risparmio</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <i className="fas fa-sliders-h" />
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Risparmio Mensile Attuale</span>
                  <span className="font-semibold text-secondary">€1,250</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Necessario per Obiettivi</span>
                  <span className="font-semibold text-primary">€1,920</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <i className="fas fa-lightbulb text-blue-400 text-lg mt-1" />
                  <div>
                    <div className="font-semibold text-blue-400 mb-1">Raccomandazione</div>
                    <div className="text-sm text-gray-300">Per raggiungere tutti i tuoi obiettivi, considera di aumentare il risparmio mensile di €670 o estendere alcune scadenze.</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-all text-center">
                  <div className="text-sm font-semibold">Aumenta Risparmio</div>
                  <div className="text-xs text-gray-400">+€670/mese</div>
                </button>
                <button className="p-3 bg-secondary/20 text-secondary rounded-xl hover:bg-secondary/30 transition-all text-center">
                  <div className="text-sm font-semibold">Modifica Scadenze</div>
                  <div className="text-xs text-gray-400">Ripianifica</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-trophy text-white text-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Obiettivi Raggiunti</h3>
              <p className="text-gray-400">Celebra i tuoi successi finanziari!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-green-400 text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Fondo Emergenza</h4>
                  <p className="text-sm text-gray-400">Completato il 15 Gen 2024</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">€15,000</div>
                <div className="text-sm text-gray-400">6 mesi di spese coperti</div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-laptop text-blue-400 text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Workstation</h4>
                  <p className="text-sm text-gray-400">Completato il 5 Nov 2023</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">€2,500</div>
                <div className="text-sm text-gray-400">Setup professionale completo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


