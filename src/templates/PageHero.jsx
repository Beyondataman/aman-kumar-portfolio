import { useRef } from 'react'
import { useReveal, useSplitReveal } from '../motion/anime'
import { rich } from './rich'

/**
 * TEMPLATE — PageHero
 * --------------------------------------------------------------
 * Page/section intro: kicker → big split-text headline → lede → actions.
 *
 *   <PageHero
 *     index="03" kicker="Analytics"
 *     title="Analytics *in practice*"      // *…* = italic serif accent, | = line break
 *     lede="One paragraph of context."
 *     actions={<button className="btn">…</button>}
 *     aside={<SomeMeta />}                  // optional right column (desktop)
 *     size="xl" | "l" | "m"                 // headline scale (default "l")
 *     cue                                   // show a scroll cue
 *     as="h2"                               // heading level (default h1)
 *   />
 *
 * Motion: the headline words slide up from a clip mask (Anime.js splitText),
 * the rest rises in a short stagger. `on="view"` for heroes lower on a page.
 */
export default function PageHero({ as: Tag = 'h1', index, kicker, title, lede, actions, aside, size = 'l', on = 'mount', cue = false, className = '', children }) {
  const root = useRef(null)
  const head = useRef(null)
  useSplitReveal(head, { split: 'words', on, delay: 120 }, [title])
  useReveal(root, { selector: '[data-reveal]', on, delay: 380, step: 90 }, [lede])

  return (
    <header ref={root} className={`t-hero t-hero--${size} ${aside ? 't-hero--aside' : ''} ${className}`}>
      <div className="t-hero-main">
        {kicker && (
          <p className="kicker" data-reveal>
            {index && <span className="mono">{index}</span>}
            {kicker}
          </p>
        )}
        <Tag ref={head} className="t-hero-title" key={title}>{rich(title)}</Tag>
        {lede && <p className="t-hero-lede" data-reveal>{lede}</p>}
        {actions && <div className="t-hero-actions row" data-reveal>{actions}</div>}
        {children}
      </div>
      {aside && <aside className="t-hero-aside" data-reveal>{aside}</aside>}
      {cue && <div className="scroll-cue t-hero-cue" aria-hidden="true"><span className="mono">scroll</span><i /></div>}
    </header>
  )
}
