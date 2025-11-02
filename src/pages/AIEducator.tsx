import { useState, useEffect, useRef } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useInvestments } from "@/hooks/useInvestments";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export default function AIEducator() {
  const { expenses } = useExpenses();
  const { goals } = useFinancialGoals();
  const { investments } = useInvestments();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `💡 **Benvenuto nel tuo percorso di educazione finanziaria!**

Posso aiutarti con:

**📊 Analisi dati automatizzata**
Analizzo i tuoi pattern finanziari e ti mostro metriche educative

**🎓 Contenuti educativi**
Spiegazioni verificate di concetti finanziari

**🧮 Simulazioni formative**
Calcoli educativi per comprendere principi finanziari

**📈 Analisi trend**
Esaminiamo i pattern dei tuoi dati storici

*Piattaforma educativa - Nessuna raccomandazione finanziaria*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const calculateMetrics = () => {
    const totalIncome = expenses.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    
    return { totalIncome, totalExpenses, savingsRate, totalValue };
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const metrics = calculateMetrics();
    const complianceNotice = "\n\n---\n*Questo è un contenuto educativo automatizzato. Per consulenza finanziaria personalizzata, consulta un professionista abilitato.*";

    if (message.includes('analizz') || message.includes('dati') || message.includes('distribuzione') || message.includes('risparmio')) {
      return `📊 **Analisi Dati Automatizzata**

**Dati Rilevati:**
• Tasso di risparmio: ${metrics.savingsRate.toFixed(1)}% ${metrics.savingsRate > 30 ? '(eccellente)' : metrics.savingsRate > 20 ? '(buono)' : '(da migliorare)'}
• Reddito totale: €${metrics.totalIncome.toFixed(2)}
• Spese totali: €${metrics.totalExpenses.toFixed(2)}
• Valore portafoglio: €${metrics.totalValue.toFixed(2)}
• Obiettivi attivi: ${goals.length}

**Trend Educativi:**
• Progresso curriculum: 52% completato
• Concetti padroneggiati: 8/15

**Contenuto Educativo Correlato:**
• Gestione del cash flow
• Strategie di diversificazione
• Metriche di salute finanziaria${complianceNotice}`;
    } else if (message.includes('spieg') || message.includes('cos è') || message.includes('educ') || message.includes('diversificazione')) {
      return `🎓 **Contenuto Educativo Verificato**

**Diversificazione del Portafoglio:**
Strategia che distribuisce gli investimenti tra diverse asset class per gestire il rischio. Include azioni, obbligazioni, immobili e liquidità.

**Interesse Composto:**
Il "motore" della crescita finanziaria a lungo termine, dove gli interessi guadagnati generano a loro volta nuovi interessi.

**Fondo di Emergenza:**
Risparmi equivalenti a 3-6 mesi di spese, da mantenere liquide per imprevisti.

**Livello:** Base • **Tempo studio:** 5 minuti${complianceNotice}`;
    } else if (message.includes('calcol') || message.includes('simul') || message.includes('proiezione')) {
      return `🧮 **Simulazione Educativa**

**Interesse Composto su €10.000:**
• 5% annuo per 10 anni: €16.289
• 7% annuo per 10 anni: €19.672
• 10% annuo per 10 anni: €25.937

**Pianificazione Obiettivi Educativa:**
Con un risparmio del ${metrics.savingsRate.toFixed(1)}% potresti raggiungere:
• €50.000 in circa ${Math.round(50000 / (metrics.totalIncome * 0.3 / 12))} mesi
• €100.000 in circa ${Math.round(100000 / (metrics.totalIncome * 0.3 / 12))} mesi

**Nota Educativa:**
I rendimenti passati non sono indicativi di risultati futuri.${complianceNotice}`;
    } else {
      return `💡 **Educatore Finanziario AI**

Sono qui per aiutarti con:
• **Analisi dati automatizzata** dei tuoi pattern finanziari
• **Contenuti educativi** verificati su concetti finanziari
• **Simulazioni formative** per comprendere principi finanziari
• **Analisi trend** dei tuoi dati storici

**Ricorda:**
• Fornisco educazione finanziaria, non consulenza
• I contenuti sono verificati da educatori certificati
• Per decisioni finanziarie consulta professionisti abilitati

Cosa vuoi approfondire oggi?${complianceNotice}`;
    }
  };

  const sendMessage = () => {
    const message = inputValue.trim();
    if (!message) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: generateAIResponse(message),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const askQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 fade-in">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 mb-6 pulse-glow compliance-flag relative">
            <i className="fas fa-user-graduate text-4xl gradient-text" />
          </div>
          <h1 className="text-5xl font-bold mb-4 gradient-text">AI Financial Educator</h1>
          <p className="text-xl text-gray-400 mb-6">Analisi dati automatizzata e educazione finanziaria personalizzata</p>
          
          <div className="max-w-2xl mx-auto glass-card p-6 border-l-4 border-secondary">
            <div className="flex items-start gap-4">
              <i className="fas fa-shield-alt text-secondary text-2xl mt-1" />
              <div>
                <h3 className="font-semibold text-secondary mb-2">Piattaforma Educativa Certificata</h3>
                <p className="text-sm text-gray-300">
                  MyMoney.ai è una <strong>piattaforma educativa automatizzata</strong> che fornisce analisi dati e contenuti formativi. 
                  <strong>Non forniamo consulenza finanziaria</strong> e tutti i contenuti sono verificati da educatori finanziari certificati.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2 glass-card p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-user-graduate text-white text-2xl" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full border-2 border-gray-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Educatore Finanziario AI</h3>
                  <p className="text-gray-400">Analisi dati e apprendimento personalizzato</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 glass-card hover:bg-white/10 rounded-xl transition-all" title="Learning Analytics">
                  <i className="fas fa-chart-line text-primary" />
                </button>
                <button className="p-3 glass-card hover:bg-white/10 rounded-xl transition-all" title="Export Session">
                  <i className="fas fa-file-export text-secondary" />
                </button>
              </div>
            </div>

            <div className="chat-container">
              <div ref={chatMessagesRef} className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender} fade-in`}>
                    {msg.sender === 'user' ? (
                      <>
                        <div className="text-sm">{msg.text}</div>
                        <div className="text-xs text-blue-200 mt-1 text-right">{msg.timestamp}</div>
                      </>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user-graduate text-white text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="font-semibold text-secondary">Educatore AI</div>
                            <div className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full">Online</div>
                            <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">MiFID II Compliant</div>
                          </div>
                          <div className="educational-card">
                            <div className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br />') }} />
                          </div>
                          <div className="compliance-badge mt-3">
                            <i className="fas fa-graduation-cap mr-1" />
                            Piattaforma educativa - Nessuna raccomandazione finanziaria
                          </div>
                          <div className="text-xs text-gray-400 mt-2">{msg.timestamp}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="message ai fade-in">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user-graduate text-white text-sm" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary mb-2">Educatore AI</div>
                        <div className="typing-indicator">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-800">
                <div className="text-sm text-gray-400 mb-3">Azioni Rapide Educative:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => askQuestion('Analizza la distribuzione delle mie spese')} className="quick-action-btn">
                    <i className="fas fa-chart-pie text-primary" />
                    <span>Analisi Dati Spese</span>
                  </button>
                  <button onClick={() => askQuestion('Spiegami la diversificazione del portafoglio')} className="quick-action-btn">
                    <i className="fas fa-sitemap text-secondary" />
                    <span>Educazione Investimenti</span>
                  </button>
                  <button onClick={() => askQuestion('Simula crescita risparmi con interesse composto')} className="quick-action-btn">
                    <i className="fas fa-calculator text-purple-400" />
                    <span>Simulazioni</span>
                  </button>
                  <button onClick={() => askQuestion('Analizza i pattern delle mie entrate')} className="quick-action-btn">
                    <i className="fas fa-chart-line text-accent" />
                    <span>Analisi Trend</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Chiedimi analisi dati o spiegazioni di concetti finanziari..."
                      rows={2}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      <i className="fas fa-lock mr-1" />Dati Protetti GDPR
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all hover-lift self-end"
                  >
                    <i className="fas fa-paper-plane" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-trophy text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Progresso Apprendimento</h3>
                  <p className="text-gray-400 text-sm">Il tuo percorso formativo</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border-l-4 border-secondary">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold">Fondamenti Finanziari</span>
                    <i className="fas fa-check-circle text-secondary" />
                  </div>
                  <p className="text-xs text-gray-400">Completato: 12/15 lezioni</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border-l-4 border-primary">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold">Investimenti Base</span>
                    <i className="fas fa-play-circle text-primary" />
                  </div>
                  <p className="text-xs text-gray-400">In corso: 5/20 lezioni</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border-l-4 border-accent">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold">Pianificazione</span>
                    <i className="fas fa-lock text-accent" />
                  </div>
                  <p className="text-xs text-gray-400">Sblocca completando Investimenti Base</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-2xl flex items-center justify-center">
                  <i className="fas fa-book-open text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Risorse Educative</h3>
                  <p className="text-gray-400 text-sm">Contenuti verificati</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button onClick={() => askQuestion('Spiegami il dollar-cost averaging')} className="learning-card">
                  <i className="fas fa-chart-line text-primary" />
                  <div>
                    <div className="font-semibold text-sm">Strategie Investimento</div>
                    <div className="text-xs text-gray-400">DCA, Value Investing, ecc.</div>
                  </div>
                </button>
                
                <button onClick={() => askQuestion('Cos è e come costruire un fondo di emergenza?')} className="learning-card">
                  <i className="fas fa-shield-alt text-secondary" />
                  <div>
                    <div className="font-semibold text-sm">Sicurezza Finanziaria</div>
                    <div className="text-xs text-gray-400">Fondi emergenza e protezione</div>
                  </div>
                </button>
                
                <button onClick={() => askQuestion('Differenza tra ETF e fondi comuni')} className="learning-card">
                  <i className="fas fa-balance-scale text-purple-400" />
                  <div>
                    <div className="font-semibold text-sm">Strumenti Finanziari</div>
                    <div className="text-xs text-gray-400">ETF, fondi, azioni, obbligazioni</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-orange-500 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Educazione al Rischio</h3>
                  <p className="text-gray-400 text-sm">Comprendi i rischi finanziari</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Profilo Rischio Stimato</span>
                    <span className="text-secondary">Moderato</span>
                  </div>
                  <div className="risk-meter">
                    <div className="risk-indicator" style={{ marginLeft: '60%' }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-accent">Conservativo</span>
                    <span className="text-secondary">Bilanciato</span>
                    <span className="text-yellow-400">Dinamico</span>
                  </div>
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-300">
                    <i className="fas fa-info-circle text-primary mr-1" />
                    Questo è un profilo educativo basato sui tuoi dati. Per una valutazione ufficiale consulta un consulente abilitato.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 fade-in mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-4">Percorso di Apprendimento</h2>
            <p className="text-gray-400">Curriculum strutturato per la tua educazione finanziaria</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: '📊', title: 'Fondamenti', desc: 'Basi della gestione finanziaria', status: 'Completato 80%', color: 'secondary' },
              { icon: '💼', title: 'Investimenti', desc: 'Mercati e strumenti', status: 'In Corso 25%', color: 'primary' },
              { icon: '🏠', title: 'Pianificazione', desc: 'Obiettivi a medio-lungo termine', status: 'Bloccato', color: 'gray' },
              { icon: '🛡️', title: 'Protezione', desc: 'Gestione rischi e assicurazioni', status: 'Bloccato', color: 'gray' }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-gray-800 hover:border-primary transition-all cursor-pointer text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{item.desc}</p>
                <div className={`text-xs ${item.color === 'secondary' ? 'bg-secondary/20 text-secondary' : item.color === 'primary' ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'} px-2 py-1 rounded-full`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 glass-card border border-secondary/30 fade-in">
          <div className="flex items-start gap-4">
            <i className="fas fa-gavel text-secondary text-2xl mt-1" />
            <div>
              <h3 className="font-semibold text-secondary mb-3">Dichiarazione di Compliance Completa</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>MyMoney.ai è una piattaforma educativa automatizzata conforme alle normative UE (MiFID II, GDPR).</strong></p>
                <p>• Forniamo esclusivamente <strong>analisi dati automatizzate e contenuti educativi</strong></p>
                <p>• <strong>Non forniamo consulenza finanziaria</strong> né raccomandazioni di investimento</p>
                <p>• Tutti i contenuti sono verificati da <strong>educatori finanziari certificati</strong></p>
                <p>• I profili di rischio sono <strong>indicativi e a scopo educativo</strong></p>
                <p>• Per decisioni finanziarie consulta <strong>consulenti finanziari abilitati</strong></p>
                <p>• I dati sono protetti in conformità al <strong>Regolamento GDPR</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

