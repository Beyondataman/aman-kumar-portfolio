import { isTodo } from '../data/profile'

/** Visible, clearly-labelled placeholder for information still to be supplied. */
export function Todo({ value, inline = false }) {
  if (!isTodo(value)) return value ?? null
  return (
    <span className={`todo ${inline ? 'todo--inline' : ''}`} title="Placeholder — edit src/data/profile.js">
      <span className="todo-tag">to add</span> {value.label}
    </span>
  )
}
