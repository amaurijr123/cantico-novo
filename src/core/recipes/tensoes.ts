/**
 * Acordes com tensões: mesmos acordes, mais cor. Cada acorde ganha a sétima e a nona
 * que combinam com o papel dele no tom.
 *
 *   G D Em C   vira   G7M(9) D7(9) Em7(9) C7M(9)
 *
 * É a ideia mais "segura": não muda a função de nenhum acorde.
 */
import { triadType } from '../key'
import type { Chord, Key, Recipe } from '../types'
import { build, degree, idea, n } from './helpers'

type Recipe7 = { seventh: '7' | '7M'; extensions: string[] }

/** Para cada grau do campo harmônico: o tipo esperado e o que acrescentar. */
const MAJOR: Record<number, [string, Recipe7]> = {
  0: ['maior', { seventh: '7M', extensions: ['9'] }],
  2: ['menor', { seventh: '7', extensions: ['9'] }],
  4: ['menor', { seventh: '7', extensions: [] }], // o 9 do iii sairia da escala
  5: ['maior', { seventh: '7M', extensions: ['9'] }],
  7: ['maior', { seventh: '7', extensions: ['9'] }],
  9: ['menor', { seventh: '7', extensions: ['9'] }],
}
const MINOR: Record<number, [string, Recipe7]> = {
  0: ['menor', { seventh: '7', extensions: ['9'] }],
  3: ['maior', { seventh: '7M', extensions: ['9'] }],
  5: ['menor', { seventh: '7', extensions: ['9'] }],
  7: ['maior', { seventh: '7', extensions: ['b9'] }],
  8: ['maior', { seventh: '7M', extensions: ['9'] }],
  10: ['maior', { seventh: '7', extensions: ['9'] }],
}

function enrich(chord: Chord, tom: Key): Chord {
  const plainExtensions = chord.extensions.every((e) => e === '2' || e === 'add9')
  if (chord.seventh || !plainExtensions) return chord // já tem cor, fica como está
  const kind = triadType(chord)

  if (chord.quality === 'sus4') {
    return build(chord.root, 'sus4', {
      seventh: '7',
      extensions: ['9'],
      bass: chord.bass,
    })
  }
  if (chord.quality !== 'maior' && chord.quality !== 'menor') return chord

  const table = tom.mode === 'maior' ? MAJOR : MINOR
  const entry = table[degree(chord, tom)]
  const add: Recipe7 =
    entry && entry[0] === kind ? entry[1] : { seventh: '7', extensions: [] } // fora do campo: só a sétima
  return build(chord.root, chord.quality, { ...add, bass: chord.bass })
}

export const tensoes: Recipe = (trecho, tom) => {
  const after = trecho.map((chord) => enrich(chord, tom))
  const highlight = after.flatMap((chord, i) => (n(chord) !== n(trecho[i]) ? [i] : []))
  if (highlight.length === 0) return []
  const examples = highlight
    .slice(0, 3)
    .map((i) => `${n(trecho[i])} → ${n(after[i])}`)
    .join(', ')
  return [
    idea(
      'tensoes',
      trecho,
      { after, highlight },
      2.5,
      `Mesmos acordes, mais cor (${examples}). Não muda a função de nenhum acorde, então é um bom ponto de partida.`,
    ),
  ]
}
