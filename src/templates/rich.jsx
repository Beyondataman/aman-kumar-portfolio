import { Fragment } from 'react'

/**
 * Headline accent syntax: wrap words in *asterisks* to set them in the italic
 * serif accent face. "Analytics *in practice*" → Analytics <em>in practice</em>.
 * A "|" forces a line break.
 */
export function rich(text) {
  if (typeof text !== 'string') return text
  return text.split('|').map((line, li, lines) => (
    <Fragment key={li}>
      {line.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : <Fragment key={i}>{part}</Fragment>
      )}
      {li < lines.length - 1 && <br />}
    </Fragment>
  ))
}

export const pad2 = (n) => String(n).padStart(2, '0')
