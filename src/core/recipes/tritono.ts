/**
 * Substituição de trítono: troca um dominante pelo dominante que fica a um trítono
 * dele. Os dois têm as mesmas duas notas de tensão (a terça e a sétima trocam de
 * lugar), mas o substituto chega no alvo descendo meio tom.
 *
 *   D7 → G   vira   Ab7 → G
 *
 * Se o trecho não tem nenhum dominante, a receita põe o substituto antes de um acorde:
 *   G → C    vira   G → Db7 → C
 */
import { triadType } from '../key'
import type { Recipe } from '../types'
import {
  above,
  build,
  idea,
  insertBefore,
  looksDominant,
  n,
  replaceAt,
  resolvesTo,
  sameRoot,
} from './helpers'
import { noteName } from '../notes'

export const tritono: Recipe = (trecho, tom) => {
  const ideas = []

  // 1. Trocar dominantes que já existem.
  for (let i = 0; i < trecho.length - 1; i++) {
    const dominant = trecho[i]
    const target = trecho[i + 1]
    if (!looksDominant(dominant, tom) || !resolvesTo(dominant, target)) continue

    const sub = build(above(target.root, 1, 1), 'maior', { seventh: '7' })
    const third = noteName(above(dominant.root, 2, 4))
    const seventh = noteName(above(dominant.root, 6, 10))
    ideas.push(
      idea(
        'tritono',
        trecho,
        replaceAt(trecho, i, 1, sub),
        3,
        `${n(sub)} entra no lugar de ${n(dominant)}: os dois têm as mesmas notas de tensão (${third} e ${seventh}), mas o ${n(sub)} desce meio tom até o ${n(target)}. É o som mais "jazz" da lista.`,
      ),
    )
  }
  if (ideas.length > 0) return ideas

  // 2. Sem dominantes: põe o substituto antes de um acorde.
  for (let i = 1; i < trecho.length; i++) {
    const target = trecho[i]
    const kind = triadType(target)
    if ((kind !== 'maior' && kind !== 'menor') || sameRoot(trecho[i - 1], target))
      continue
    const sub = build(above(target.root, 1, 1), 'maior', { seventh: '7' })
    if (sameRoot(trecho[i - 1], sub)) continue
    ideas.push(
      idea(
        'tritono',
        trecho,
        insertBefore(trecho, i, sub),
        1.5,
        `${n(sub)} chega no ${n(target)} descendo meio tom. Faz o papel de dominante, com som de jazz.`,
      ),
    )
  }
  return ideas
}
