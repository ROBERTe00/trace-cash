import { useEffect, useRef } from "react"
import CountUp from "react-countup"

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function CountUpNumber({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  return (
    <span className={className}>
      {prefix}
      <CountUp end={end} duration={duration} decimals={decimals} separator="," />
      {suffix}
    </span>
  )
}

