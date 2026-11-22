/** CHAPTER 5 — the entrance to the Analytics Hall (a separate destination: /hall). */
export default function Portal({ ref, enterHall }) {
  return (
    <section ref={ref} className="ch ch-portal" id="portal" aria-labelledby="portal-title">
      <div className="sticky portal-stage">
        <p className="kicker"><span className="mono">05</span> A door in the story</p>
        <button className="portal-cta" onClick={() => enterHall({ dive: true })} aria-describedby="portal-sub">
          <span id="portal-title" className="portal-title">ENTER THE<br />ANALYTICS HALL</span>
          <span className="portal-arrow" aria-hidden="true">→</span>
        </button>
        <p id="portal-sub" className="portal-sub">
          Explore companies, investigate business performance, and discover the stories hidden inside data.
        </p>
        <p className="portal-note mono muted">Separate space · your place in the story is saved</p>
      </div>
    </section>
  )
}
