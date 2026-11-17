/**
 * Baixo pedal: o baixo fica parado numa nota enquanto os acordes mudam em cima.
 *
 *   C → D → G    vira   C/G → D/G → G      (pedal na tônica)
 *   C → D → G    vira   C/D → D → G        (pedal na dominante, até chegar no I)
 */
import { noteName } from '../notes'
import type { Chord, Idea, Note, Recipe } from '../types'
import { above, idea, isTonic, n, withBass } from './helpers'

/** Põe `note` no baixo dos acordes antes da posição `until`. */
function pedal(trecho: Chord[], note: Note, until: number) {
  const after = trecho.map((chord, i) => (i < until ? withBass(chord, note) : chord))
  const highlight = after.flatMap((chord, i) => (n(chord) !== n(trecho[i]) ? [i] : []))
  return { after, highlight }
}

export const baixoPedal: Recipe = (trecho, tom) => {
  if (trecho.length < 2) return []
  const ideas: Idea[] = []

  const tonicPedal = pedal(trecho, tom.tonic, trecho.length)
  if (tonicPedal.highlight.length >= 2) {
    ideas.push(
      idea(
        'baixo-pedal',
        trecho,
        tonicPedal,
        2,
        `O baixo fica parado no ${noteName(tom.tonic)} enquanto os acordes mudam em cima. Dá uma sensação de chão firme, boa para introduções e finais.`,
      ),
    )
  }

  const fifth = above(tom.tonic, 4, 7)
  const endsOnTonic = isTonic(trecho[trecho.length - 1], tom)
  const dominantPedal = pedal(
    trecho,
    fifth,
    endsOnTonic ? trecho.length - 1 : trecho.length,
  )
  if (dominantPedal.highlight.length >= 1) {
    ideas.push(
      idea(
        'baixo-pedal',
        trecho,
        dominantPedal,
        1.5,
        `O baixo segura o ${noteName(fifth)} (a quinta do tom) e cria expectativa. Quando ele sai, a chegada soa como um alívio.`,
      ),
    )
  }
  return ideas
}
