import { useLayoutEffect, useRef } from 'react'

export const useCreateFooter = (created: boolean) => {
  const screen = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = screen.current
    const footer = root?.querySelector<HTMLElement>('[data-create-actions]')
    if (!root || !footer) { return }
    const measure = () => {
      root.style.setProperty('--create-footer-height', Math.ceil(window.innerHeight - footer.getBoundingClientRect().top + 12) + 'px')
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [created])

  return screen
}
