import { useEffect, useRef } from "react"
import { Line, LineChart, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
  showDots?: boolean
}

export function Sparkline({
  data,
  color = "#3b82f6",
  height = 40,
  showDots = false,
}: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={showDots}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

