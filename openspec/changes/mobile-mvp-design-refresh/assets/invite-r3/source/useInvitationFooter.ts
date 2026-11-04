import { useLayoutEffect, useRef } from 'react'

export const useInvitationFooter = (layout: string) => {
  const screen = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = screen.current
    const footer = root?.querySelector<HTMLElement>('[data-invitation-actions]')
    if (!root) { return }
    if (!footer) { root.style.setProperty('--invitation-footer-height','0px'); return }
    const measure = () => {
      root.style.setProperty('--invitation-footer-height', Math.ceil(window.innerHeight - footer.getBoundingClientRect().top + 12) + 'px')
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [layout])

  return screen
}
