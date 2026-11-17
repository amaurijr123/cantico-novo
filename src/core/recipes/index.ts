/**
 * O seletor: roda as 7 receitas num trecho e escolhe as 5 ideias que vão para a tela.
 *
 * 1. Cada receita devolve suas ideias, cada uma com uma pontuação.
 * 2. Fica a melhor ideia de cada receita, para as 5 serem de técnicas diferentes.
 * 3. Entre elas, ficam as 5 de maior pontuação.
 * 4. Se menos de 5 receitas tiverem ideias, completa com a segunda melhor de cada uma.
 *
 * Ideias repetidas (mesmos acordes no final) entram uma vez só.
 */
import { chordName } from '../chord'
import type { Chord, Idea, Key, Recipe, RecipeId } from '../types'
import { baixoPedal } from './baixo-pedal'
import { diminutoPassagem } from './diminuto-passagem'
import { dominanteSecundario } from './dominante-secundario'
import { emprestimoModal } from './emprestimo-modal'
import { iiV } from './ii-v'
import { tensoes } from './tensoes'
import { tritono } from './tritono'

/** As receitas, na ordem usada para desempatar. */
export const RECIPES: Record<RecipeId, Recipe> = {
  'dominante-secundario': dominanteSecundario,
  'ii-v': iiV,
  tritono: tritono,
  'emprestimo-modal': emprestimoModal,
  'diminuto-passagem': diminutoPassagem,
  'baixo-pedal': baixoPedal,
  tensoes: tensoes,
}

/** Nome de cada técnica para mostrar na tela. */
export const RECIPE_NAMES: Record<RecipeId, string> = {
  'dominante-secundario': 'Dominante secundário',
  'ii-v': 'ii–V',
  tritono: 'Substituição de trítono',
  'emprestimo-modal': 'Empréstimo modal',
  'diminuto-passagem': 'Diminuto de passagem',
  'baixo-pedal': 'Baixo pedal',
  tensoes: 'Acordes com tensões',
}

const ORDER = Object.keys(RECIPES) as RecipeId[]

function signature(idea: Idea): string {
  return idea.after.map(chordName).join(' ')
}

/** Todas as ideias de todas as receitas, da maior pontuação para a menor. */
export function allIdeas(trecho: Chord[], tom: Key): Idea[] {
  const ideas = ORDER.flatMap((id) => RECIPES[id](trecho, tom))
  // `sort` é estável: no empate vale a ordem das receitas e a posição no trecho.
  return ideas.sort((a, b) => b.score - a.score)
}

/** As `count` ideias que vão para a tela, de técnicas diferentes sempre que possível. */
export function suggestIdeas(trecho: Chord[], tom: Key, count = 5): Idea[] {
  const ranked = allIdeas(trecho, tom)
  const chosen: Idea[] = []
  const seen = new Set<string>()

  const take = (idea: Idea) => {
    const key = signature(idea)
    if (seen.has(key) || chosen.length >= count) return
    seen.add(key)
    chosen.push(idea)
  }

  // Primeiro, a melhor de cada receita.
  const usedRecipes = new Set<RecipeId>()
  for (const idea of ranked) {
    if (usedRecipes.has(idea.recipe)) continue
    usedRecipes.add(idea.recipe)
    take(idea)
  }
  // Se faltou, completa com as próximas melhores.
  for (const idea of ranked) take(idea)

  return chosen.sort((a, b) => b.score - a.score)
}
