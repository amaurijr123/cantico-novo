import { describe, expect, it } from 'vitest'
import { chordName, parseChord } from '../chord'
import { parseNote } from '../notes'
import { parseCifra, sectionChords } from '../parse'
import type { Key } from '../types'
import { fixtures } from '../../../tests/fixtures'
import { RECIPE_NAMES, RECIPES, suggestIdeas } from '.'
import { afterText, chords, key } from './testing'

describe('suggestIdeas', () => {
  const refrao = chords('G D/F# Em C')
  const ideas = suggestIdeas(refrao, key('G'))

  it('devolve 5 ideias de técnicas diferentes', () => {
    expect(ideas).toHaveLength(5)
    expect(new Set(ideas.map((i) => i.recipe)).size).toBe(5)
  })

  it('vem em ordem de pontuação', () => {
    const scores = ideas.map((i) => i.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('escolhe as ideias esperadas para o exemplo do plano', () => {
    expect(ideas.map(afterText)).toEqual([
      'G D/F# B7 Em C',
      'G D/F# Em C Cm',
      'G D/F# Em Dm7 G7 C',
      'G7M(9) D7(9)/F# Em7(9) C7M(9)',
      'G D/G Em/G C/G',
    ])
  })

  it('completa com a segunda ideia de uma receita quando faltam técnicas', () => {
    // Um acorde só: só as tensões têm ideia.
    expect(suggestIdeas(chords('G'), key('G'))).toHaveLength(1)
    // Duas ideias da mesma receita podem aparecer se não houver outras.
    const few = suggestIdeas(chords('G Em C'), key('G'), 7)
    expect(few.length).toBeGreaterThan(new Set(few.map((i) => i.recipe)).size)
  })

  it('não repete ideias com o mesmo resultado', () => {
    const all = suggestIdeas(chords('G C D G'), key('G'), 20).map(afterText)
    expect(new Set(all).size).toBe(all.length)
  })

  it('toda receita tem nome para a tela', () => {
    expect(Object.keys(RECIPE_NAMES).sort()).toEqual(Object.keys(RECIPES).sort())
  })
})

describe('cifras de exemplo', () => {
  const cases = fixtures.flatMap(({ file, text, key: k }) => {
    const tom: Key = { tonic: parseNote(k.tonic)!, mode: k.mode }
    return parseCifra(text).sections.map((section) => ({
      label: `${file} [${section.name}]`,
      trecho: sectionChords(section),
      tom,
    }))
  })

  it.each(cases)(
    '$label: 5 ideias com acordes válidos e explicação',
    ({ trecho, tom }) => {
      const ideas = suggestIdeas(trecho, tom)
      expect(ideas).toHaveLength(5)
      for (const idea of ideas) {
        expect(idea.explanation.length).toBeGreaterThan(20)
        expect(idea.highlight.length).toBeGreaterThan(0)
        for (const chord of idea.after) {
          // Todo acorde novo é escrito de um jeito que o próprio app sabe ler de volta.
          expect(chordName(parseChord(chordName(chord))!)).toBe(chordName(chord))
        }
        for (const i of idea.highlight) expect(idea.after[i]).toBeDefined()
      }
    },
  )
})
