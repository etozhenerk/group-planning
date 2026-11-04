import { useLayoutEffect, useRef, useState } from 'react'

export const usePeriodTabs = (period: string, count: number) => {
  const tabs = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const nav = tabs.current
    if (!nav) { return }
    const measure = () => {
      const active = nav.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
      if (active) { setIndicator({ left: active.offsetLeft, width: active.offsetWidth }) }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    nav.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [period, count])
  return { tabs, indicator }
}
