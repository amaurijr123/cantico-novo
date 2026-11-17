/**
 * Diminuto de passagem: um acorde diminuto que liga dois acordes, fazendo o baixo
 * subir de meio em meio tom.
 *
 *   G → Am    vira   G → G#° → Am         (baixo G, G#, A)
 *   C → G     vira   C → C#° → G/D        (IV #iv° I/5, muito usado no gospel)
 */
import { pitchClass, mod12, noteName } from '../notes'
import { triadType } from '../key'
import type { Recipe } from '../types'
import {
  above,
  bassNote,
  build,
  degree,
  idea,
  isTonic,
  n,
  replaceAt,
  withBass,
} from './helpers'

export const diminutoPassagem: Recipe = (trecho, tom) => {
  const ideas = []
  for (let i = 0; i < trecho.length - 1; i++) {
    const from = trecho[i]
    const to = trecho[i + 1]
    const kindTo = triadType(to)

    // IV → I vira IV → #iv° → I/5
    const isIV = degree(from, tom) === 5 && triadType(from) === tom.mode && !from.bass
    if (isIV && isTonic(to, tom) && !to.bass) {
      const dim = build(above(tom.tonic, 3, 6), 'diminuto')
      const fifth = above(tom.tonic, 4, 7)
      const change = replaceAt(trecho, i + 1, 1, dim, withBass(to, fifth))
      const path = [from.root, dim.root, fifth].map(noteName).join(' → ')
      ideas.push(
        idea(
          'diminuto-passagem',
          trecho,
          change,
          3,
          `O baixo sobe ${path}: o ${n(dim)} leva ao ${n(change.after[i + 2])}, movimento muito usado no gospel.`,
        ),
      )
      continue
    }

    // Baixo subindo um tom: coloca o diminuto no meio.
    if (kindTo !== 'maior' && kindTo !== 'menor') continue
    if (to.bass) continue
    const start = bassNote(from)
    if (mod12(pitchClass(to.root) - pitchClass(start)) !== 2) continue
    const dim = build(above(start, 0, 1), 'diminuto')
    const path = [start, dim.root, to.root].map(noteName).join(' → ')
    ideas.push(
      idea(
        'diminuto-passagem',
        trecho,
        replaceAt(trecho, i + 1, 0, dim),
        3,
        `${n(dim)} fica entre ${n(from)} e ${n(to)}: o baixo sobe de meio em meio tom (${path}).`,
      ),
    )
  }
  return ideas
}
