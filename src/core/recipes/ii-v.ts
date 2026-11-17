/**
 * ii–V: antes de um acorde, coloca o ii e o V dele, dois acordes que levam até lá.
 *
 *   G → C    vira   G → Dm7 G7 → C          (alvo maior: ii7 V7)
 *   G → Em   vira   G → F#m7(b5) B7(b9) → Em (alvo menor: iiø V7(b9))
 *
 * Também vale antes do I. No fim do trecho, ii–V–I é a cadência mais forte que existe.
 */
import { triadType } from '../key'
import { pitchClass } from '../notes'
import { romanNumerals } from '../roman'
import type { Recipe } from '../types'
import {
  above,
  build,
  degree,
  idea,
  insertBefore,
  isTonic,
  looksDominant,
  n,
  sameRoot,
} from './helpers'

export const iiV: Recipe = (trecho, tom) => {
  const ideas = []
  for (let i = 1; i < trecho.length; i++) {
    const target = trecho[i]
    const prev = trecho[i - 1]
    const kind = triadType(target)
    if (kind !== 'maior' && kind !== 'menor') continue
    if (sameRoot(prev, target)) continue

    const minorTarget = kind === 'menor'
    const ii = build(above(target.root, 1, 2), minorTarget ? 'meio-diminuto' : 'menor', {
      seventh: '7',
    })
    const v = build(above(target.root, 4, 7), 'maior', {
      seventh: '7',
      extensions: minorTarget ? ['b9'] : [],
    })
    // Já tem metade do caminho: o ii, o V funcionando como dominante, ou um acorde
    // com o V no baixo (Bb/C antes de F já faz o papel do V).
    if (sameRoot(prev, ii) || (sameRoot(prev, v) && looksDominant(prev, tom))) continue
    if (prev.bass && pitchClass(prev.bass) === pitchClass(v.root)) continue

    let score = 2
    if (isTonic(target, tom)) score = i === trecho.length - 1 ? 3 : 2.5
    else if (degree(target, tom) === 5) score = 2.5

    const change = insertBefore(trecho, i, ii, v)
    const graus = romanNumerals(change.after, tom)
      .slice(i, i + 3)
      .join(' ')
    ideas.push(
      idea(
        'ii-v',
        trecho,
        change,
        score,
        `${n(ii)} e ${n(v)} são o ii e o V de ${n(target)} (${graus}): dois acordes que conduzem até ele.`,
      ),
    )
  }
  return ideas
}
