/** Atalhos para os testes das receitas. Não é usado pelo app. */
import { chordName, parseChord } from '../chord'
import { parseNote } from '../notes'
import type { Chord, Idea, Key, Recipe } from '../types'

/** "G D/F# Em" vira uma lista de acordes. */
export function chords(text: string): Chord[] {
  return text.split(/\s+/).map((s) => parseChord(s)!)
}

/** "G" vira Sol maior, "Em" vira Mi menor. */
export function key(symbol: string): Key {
  const minor = symbol.endsWith('m')
  return {
    tonic: parseNote(minor ? symbol.slice(0, -1) : symbol)!,
    mode: minor ? 'menor' : 'maior',
  }
}

/** Os acordes depois da ideia, como texto: "G B7 Em". */
export function afterText(idea: Idea): string {
  return idea.after.map(chordName).join(' ')
}

/** Roda a receita e devolve o resultado de cada ideia como texto. */
export function run(recipe: Recipe, progression: string, tom: string): string[] {
  return recipe(chords(progression), key(tom)).map(afterText)
}

/** A ideia de maior pontuação da receita (a que o seletor escolheria). */
export function best(recipe: Recipe, progression: string, tom: string): Idea {
  const ideas = recipe(chords(progression), key(tom))
  return [...ideas].sort((a, b) => b.score - a.score)[0]
}
