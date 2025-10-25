# Libreria Grafici e Componenti Finanziari

Questa libreria contiene componenti grafici avanzati e gratuiti per dashboard finanziari.

## Componenti Installati

### 1. AnimatedFeatureCard
**Percorso:** `src/components/ui/animated-feature-card.tsx`

Card animata con effetti hover avanzati, adatta per feature highlighting.

**Props:**
- `icon`: React node per l'icona
- `title`: Titolo della card
- `description`: Descrizione
- `href`: Link opzionale
- `highlightColor`: Colore tema (blue, green, purple, orange)

**Esempio:**
```tsx
import { AnimatedFeatureCard } from "@/components/ui/animated-feature-card"
import { TrendingUp } from "lucide-react"

<AnimatedFeatureCard
  icon={<TrendingUp className="h-6 w-6" />}
  title="Analisi Performance"
  description="Monitora le tue finanze in tempo reale"
  highlightColor="blue"
/>
```

### 2. MiniChart
**Percorso:** `src/components/charts/MiniChart.tsx`

Mini grafico ad area compatta per dashboard.

**Props:**
- `data`: Array di dati con date e valori
- `color`: Colore del grafico
- `height`: Altezza del grafico

### 3. StatCard
**Percorso:** `src/components/charts/StatCard.tsx`

Card statistiche con grafico integrato.

**Props:**
- `title`: Titolo della statistica
- `value`: Valore principale
- `change`: Variazione percentuale
- `changeType`: Tipo di variazione (positive, negative, neutral)
- `icon`: Icona Lucide
- `chartData`: Dati per il mini grafico
- `color`: Colore tema

**Esempio:**
```tsx
import { StatCard } from "@/components/charts/StatCard"
import { DollarSign } from "lucide-react"

<StatCard
  title="Entrate Mensili"
  value="€12,450"
  change="+12.5%"
  changeType="positive"
  icon={DollarSign}
  chartData={monthlyData}
  color="#10b981"
/>
```

### 4. ProgressRing
**Percorso:** `src/components/charts/ProgressRing.tsx`

Anello di progresso circolare animato.

**Props:**
- `progress`: Valore 0-100
- `size`: Dimensione dell'anello
- `strokeWidth`: Spessore del tratto
- `color`: Colore del progresso
- `trackColor`: Colore dello sfondo
- `showLabel`: Mostra etichetta
- `label`: Testo etichetta

**Esempio:**
```tsx
import { ProgressRing } from "@/components/charts/ProgressRing"

<ProgressRing
  progress={75}
  size={120}
  color="#3b82f6"
  label="Obiettivo"
/>
```

### 5. Sparkline
**Percorso:** `src/components/charts/Sparkline.tsx`

Mini grafico a linea per trend veloci.

**Props:**
- `data`: Array di dati
- `color`: Colore della linea
- `height`: Altezza
- `showDots`: Mostra punti sui dati

### 6. TrendIndicator
**Percorso:** `src/components/charts/TrendIndicator.tsx`

Indicatore di trend con freccia e percentuale.

**Props:**
- `value`: Valore percentuale del trend
- `showIcon`: Mostra icona freccia

**Esempio:**
```tsx
import { TrendIndicator } from "@/components/charts/TrendIndicator"

<TrendIndicator value={15.5} />
// Mostra: ↑ 15.5% in verde
```

### 7. CountUp
**Percorso:** `src/components/ui/count-up.tsx`

Contatore animato per numeri.

**Props:**
- `end`: Valore finale
- `duration`: Durata animazione
- `prefix`: Prefisso (es. "€")
- `suffix`: Suffisso (es. "%")
- `decimals`: Decimali

**Esempio:**
```tsx
import { CountUpNumber } from "@/components/ui/count-up"

<CountUpNumber end={1234.56} prefix="€" decimals={2} />
```

## Librerie Installate

- **react-countup**: Animazioni numeriche
- **react-number-format**: Formattazione numeri
- **aos**: Animate On Scroll library
- **recharts**: Già presente, libreria grafici avanzata

## Utilizzo Combinato

Esempio di dashboard completa:

```tsx
import { StatCard } from "@/components/charts/StatCard"
import { TrendIndicator } from "@/components/charts/TrendIndicator"
import { CountUpNumber } from "@/components/ui/count-up"
import { DollarSign, TrendingUp } from "lucide-react"

<div className="grid grid-cols-3 gap-4">
  <StatCard
    title="Bilancio Totale"
    value={<CountUpNumber end={125000} prefix="€" />}
    change={<TrendIndicator value={8.5} />}
    changeType="positive"
    icon={DollarSign}
    chartData={balanceChartData}
  />
  
  <StatCard
    title="Entrate Mensili"
    value={<CountUpNumber end={8500} prefix="€" />}
    change={<TrendIndicator value={-2.3} />}
    changeType="negative"
    icon={TrendingUp}
    chartData={incomeChartData}
  />
</div>
```

## Colori Supportati

I componenti supportano questi colori:
- `blue`: #3b82f6
- `green`: #10b981
- `purple`: #8b5cf6
- `orange`: #f59e0b
- `red`: #ef4444

## Note

Tutti i componenti sono:
- ✅ Completamente gratuiti
- ✅ TypeScript supportato
- ✅ Dark mode compatibili
- ✅ Responsive
- ✅ Performance ottimizzate
- ✅ Animazioni fluide

## Prossimi Passi

Puoi integrare questi componenti nel tuo dashboard esistente o crearne di nuovi combinando i componenti disponibili.

