import { useEffect, useState } from 'react'
import { profile, home } from '../../data/profile'

/**
 * Fixed top bar: name on the left, section links on the right (the active
 * one is underlined), the Analytics Hall as the last link. On phones the
 * links move into a full-screen menu.
 */
export default function Nav({ active, onJump, onHall, scrolled, hidden }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  const jump = (id) => { setOpen(false); onJump(id) }

  return (
    <>
      <header className={`h-nav ${scrolled ? 'is-scrolled' : ''} ${hidden ? 'is-hidden' : ''}`}>
        <button className="h-nav-name" onClick={() => jump('home')}>{profile.name.toUpperCase()}</button>
        <nav className="h-nav-links" aria-label="Sections">
          {home.nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'is-active' : ''}
              onClick={(e) => { e.preventDefault(); jump(n.id) }}>{n.label}</a>
          ))}
          <button className="h-nav-hall" onClick={onHall}>Analytics Hall ↗</button>
        </nav>
        <button className={`h-burger ${open ? 'is-open' : ''}`} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <i /><i />
        </button>
      </header>
      <div className={`h-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {home.nav.map((n, i) => (
          <a key={n.id} href={`#${n.id}`} style={{ '--i': i }} tabIndex={open ? 0 : -1}
            onClick={(e) => { e.preventDefault(); jump(n.id) }}>{n.label}</a>
        ))}
        <button style={{ '--i': home.nav.length }} tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); onHall() }}>Analytics Hall ↗</button>
      </div>
    </>
  )
}
