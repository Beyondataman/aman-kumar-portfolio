import { useStore } from '../lib/store'

export default function ChapterIndicator({ chapters, onJump }) {
  const chapter = useStore((s) => s.chapter)
  const cur = chapters[chapter] ?? chapters[0]
  return (
    <nav className="chapter-indicator" aria-label="Story chapters">
      <div className="ci-current" aria-live="polite">
        <span className="mono">{cur.n} / {String(chapters.length).padStart(2, '0')}</span>
        <span className="ci-title">{cur.title}</span>
      </div>
      <ol className="ci-ticks">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <button
              className={`ci-tick ${i === chapter ? 'is-active' : ''} ${i < chapter ? 'is-past' : ''}`}
              onClick={() => onJump(i)}
              aria-label={`Go to chapter ${c.n}: ${c.title}`}
              aria-current={i === chapter ? 'step' : undefined}
            />
          </li>
        ))}
      </ol>
    </nav>
  )
}
