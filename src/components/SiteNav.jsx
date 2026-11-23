import { useEffect, useState } from 'react'
import { profile } from '../data/profile'

/**
 * Fixed top bar used on every v2 page: name on the left, links on the right
 * (the active one is underlined), one outlined call-to-action at the end.
 * On phones the links move into a full-screen menu.
 *
 *   links: [{ id, label, onClick, active }]   cta: { label, onClick }
 */
export default function SiteNav({ links, cta, onName, scrolled = true, hidden = false }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  const run = (fn) => { setOpen(false); fn?.() }

  return (
    <>
      <header className={`h-nav ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
        <button className="h-nav-name" onClick={() => run(onName)}>{profile.name.toUpperCase()}</button>
        <nav className="h-nav-links" aria-label="Site">
          {links.map((l) => (
            <a key={l.id} href={l.href ?? `#${l.id}`} className={l.active ? 'is-active' : ''} aria-current={l.active ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); run(l.onClick) }}>{l.label}</a>
          ))}
          {cta && <button className="h-nav-hall" onClick={() => run(cta.onClick)}>{cta.label}</button>}
        </nav>
        <button className={`h-burger ${open ? 'is-open' : ''}`} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <i /><i />
        </button>
      </header>
      <div className={`h-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {links.map((l, i) => (
          <a key={l.id} href={l.href ?? `#${l.id}`} style={{ '--i': i }} tabIndex={open ? 0 : -1}
            onClick={(e) => { e.preventDefault(); run(l.onClick) }}>{l.label}</a>
        ))}
        {cta && <button style={{ '--i': links.length }} tabIndex={open ? 0 : -1} onClick={() => run(cta.onClick)}>{cta.label}</button>}
      </div>
    </>
  )
}

/** Links for pages other than the home page. */
export function pageLinks(go, active) {
  return [
    { id: 'home', label: 'Home', href: '/', onClick: () => go('/', { state: { resume: true } }) },
    { id: 'analytics', label: 'Analytics', href: '/analytics', active: active === 'analytics', onClick: () => go('/analytics') },
    { id: 'hall', label: 'Analytics Hall', href: '/hall', active: active === 'hall', onClick: () => go('/hall') },
    { id: 'contact', label: 'Contact', href: '/#contact', onClick: () => go('/', { state: { scrollTo: 'contact' } }) },
  ]
}
