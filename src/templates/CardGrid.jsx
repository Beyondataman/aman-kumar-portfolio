import { useRef } from 'react'
import { useReveal } from '../motion/anime'
import { Lift } from '../motion/motion'
import { pad2, rich } from './rich'

/**
 * TEMPLATE — CardGrid + Card
 * --------------------------------------------------------------
 *   <CardGrid
 *     items={[{ id, kicker, title, text, meta, tags, status, onClick | href }]}
 *     columns={3}                // desktop columns; collapses to 2 / 1 on smaller screens
 *     numbered                   // show 01, 02 … on each card
 *     render={(item, i) => …}    // optional custom card body
 *   />
 *
 * Motion: cells rise in a stagger when the grid enters the viewport (Anime.js);
 * each card lifts on hover and presses on tap (Motion). The two never fight
 * over `transform` because Anime animates the cell, Motion the card inside it.
 */
export default function CardGrid({ items, columns = 3, numbered = false, render, className = '' }) {
  const ref = useRef(null)
  useReveal(ref, { selector: ':scope > .t-cell', step: 80, y: 32 }, [items.length])
  return (
    <div ref={ref} className={`t-grid ${className}`} style={{ '--cols': columns }}>
      {items.map((it, i) => (
        <div className="t-cell" key={it.id ?? i}>
          {render ? render(it, i) : <Card {...it} n={numbered ? i + 1 : null} />}
        </div>
      ))}
    </div>
  )
}

export function Card({ kicker, title, text, meta, tags, status, n, onClick, href, children, className = '' }) {
  const interactive = !!(onClick || href)
  const as = onClick ? 'button' : href ? 'a' : 'article'
  const linkProps = href ? { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {}) } : {}
  const body = (
    <>
      <div className="t-card-top">
        {n != null && <span className="t-card-n mono">{pad2(n)}</span>}
        {kicker && <span className="t-card-kicker mono">{kicker}</span>}
        {status && <span className={`t-card-status mono t-card-status--${status.tone ?? 'muted'}`}>{status.label ?? status}</span>}
      </div>
      {title && <h3 className="t-card-title">{rich(title)}</h3>}
      {text && <p className="t-card-text">{text}</p>}
      {tags?.length > 0 && <ul className="tags t-card-tags">{tags.map((t) => <li key={t}>{t}</li>)}</ul>}
      {children}
      {(meta || interactive) && (
        <div className="t-card-foot">
          {meta && <span className="mono muted">{meta}</span>}
          {interactive && <span className="t-card-arrow" aria-hidden="true">↗</span>}
        </div>
      )}
    </>
  )
  if (!interactive) return <article className={`t-card ${className}`}>{body}</article>
  return (
    <Lift as={as} className={`t-card t-card--link ${className}`} onClick={onClick} {...linkProps}>
      {body}
    </Lift>
  )
}
