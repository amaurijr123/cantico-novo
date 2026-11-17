/**
 * Monta a linha de acordes que fica em cima da letra.
 *
 * Cada acorde tenta ficar na coluna onde estava na cifra original. Se um rótulo
 * ficou mais comprido (C virou C#, ou G virou "V7/vi" no modo graus), o próximo é
 * empurrado para a direita, sempre com pelo menos um espaço entre eles.
 */
export interface Placed {
  label: string
  column: number
}

export interface Segment {
  text: string
  /** Índice do acorde na linha, ou `null` para os espaços entre eles. */
  chord: number | null
}

export function placeLabels(items: Placed[]): Segment[] {
  const segments: Segment[] = []
  let cursor = 0
  items.forEach((item, i) => {
    const minimum = i === 0 ? 0 : cursor + 1
    const start = Math.max(item.column, minimum)
    if (start > cursor) segments.push({ text: ' '.repeat(start - cursor), chord: null })
    segments.push({ text: item.label, chord: i })
    cursor = start + item.label.length
  })
  return segments
}
