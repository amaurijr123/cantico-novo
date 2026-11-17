/**
 * Dominante secundário: antes de um acorde, coloca o V7 dele.
 *
 *   G → Em   vira   G → B7 → Em      (B7 é o V7 de Em: V7/vi)
 *
 * Funciona antes de qualquer acorde maior ou menor que não seja o I (antes do I, o
 * V7 é o dominante comum, que fica com a receita do ii–V).
 */
import { triadType } from '../key'
import { romanNumerals } from '../roman'
import type { Recipe } from '../types'
import { above, build, degree, idea, insertBefore, isTonic, n, sameRoot } from './helpers'

/** Alvos que soam mais naturais: vi, ii e iii no maior; VI, III e iv no menor. */
function scoreFor(targetDegree: number, mode: 'maior' | 'menor'): number {
  const favorites: Record<number, number> =
    mode === 'maior' ? { 9: 3, 2: 2.5, 4: 2 } : { 8: 2.5, 3: 2.5, 5: 2.5 }
  return favorites[targetDegree] ?? 2
}

export const dominanteSecundario: Recipe = (trecho, tom) => {
  const ideas = []
  for (let i = 1; i < trecho.length; i++) {
    const target = trecho[i]
    const prev = trecho[i - 1]
    const kind = triadType(target)
    if ((kind !== 'maior' && kind !== 'menor') || isTonic(target, tom)) continue
    if (sameRoot(prev, target)) continue

    const dominant = build(above(target.root, 4, 7), 'maior', { seventh: '7' })
    if (sameRoot(prev, dominant)) continue // o acorde de antes já é o V dele

    const change = insertBefore(trecho, i, dominant)
    const grau = romanNumerals(change.after, tom)[i]
    ideas.push(
      idea(
        'dominante-secundario',
        trecho,
        change,
        scoreFor(degree(target, tom), tom.mode),
        `${n(dominant)} é o V7 de ${n(target)} (${grau}): cria tensão logo antes e "empurra" a música para o ${n(target)}.`,
      ),
    )
  }
  return ideas
}
