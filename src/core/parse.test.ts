import { describe, expect, it } from 'vitest'
import { chordName } from './chord'
import { isChordLine, parseCifra, sectionChords } from './parse'
import type { Section } from './types'
import { fixtures } from '../../tests/fixtures'

/** Os acordes de uma seção como texto, para comparar fácil. */
function names(section: Section): string[] {
  return sectionChords(section).map(chordName)
}

describe('isChordLine', () => {
  it.each([
    'G  D/F#  Em  C',
    '   Asus4  A',
    'G | D | Em | C',
    '| G  D/F# | Em  C |',
    'G  D  (2x)',
    'C  G  x2',
    'Bm7(b5)  E7(b9)  Am',
  ])('"%s" é linha de acordes', (line) => {
    expect(isChordLine(line)).toBe(true)
  })

  it.each([
    '',
    '   ',
    '  Quando o dia nasce',
    'E a resposta veio',
    'A graça de Deus',
    'Em teu nome eu venho',
    'Tom: G',
    '(2x)',
    '| |',
    'E|---3---2---0---|',
  ])('"%s" não é linha de acordes', (line) => {
    expect(isChordLine(line)).toBe(false)
  })
})

describe('parseCifra: cifras de exemplo', () => {
  it.each(fixtures)('$file tem as seções esperadas', ({ text, sections }) => {
    expect(parseCifra(text).sections.map((s) => s.name)).toEqual(sections)
  })

  it.each(fixtures)('$file não gera avisos', ({ text }) => {
    expect(parseCifra(text).warnings).toEqual([])
  })

  it('junta cada linha de acordes com a letra de baixo e guarda a coluna', () => {
    const song = parseCifra(fixtures[0].text)
    const verso = song.sections[1]
    expect(verso.lines[0]).toEqual({
      chords: [
        { chord: expect.objectContaining({ symbol: 'G' }), column: 0 },
        { chord: expect.objectContaining({ symbol: 'D/F#' }), column: 16 },
      ],
      lyric: '  Quando o dia nasce',
    })
    expect(verso.lines).toHaveLength(4)
  })

  it('linha de acordes sem letra embaixo vira linha só de acordes', () => {
    const intro = parseCifra(fixtures[0].text).sections[0]
    expect(intro.lines).toHaveLength(1)
    expect(intro.lines[0].lyric).toBeUndefined()
    expect(names(intro)).toEqual(['G', 'D/F#', 'Em', 'C'])
  })

  it('sectionChords devolve os acordes da seção em ordem', () => {
    const refrao = parseCifra(fixtures[0].text).sections[2]
    expect(names(refrao)).toEqual(['G', 'D/F#', 'Em', 'C', 'G', 'D/F#', 'C', 'D', 'G'])
  })
})

describe('parseCifra: formato colado do site', () => {
  const pasted = [
    'Canção Inventada',
    'Autor Inventado',
    '',
    'Tom: Em',
    '',
    '[Intro] Em  C  G  D',
    '',
    '[Primeira Parte]',
    'Em            C',
    'A noite é longa',
    'G             D',
    'E a luz já vem',
    '',
    '[Solo]',
    'E|---3---2---0---|',
    'B|---0---3---1---|',
    '',
    '[Refrão]',
    'C        D        Em',
    'Tu me ouviste, Senhor',
    'C  D  (2x)',
  ].join('\r\n')

  const song = parseCifra(pasted)

  it('ignora título e autor antes da primeira seção', () => {
    expect(song.sections.map((s) => s.name)).toEqual([
      'Intro',
      'Primeira Parte',
      'Refrão',
    ])
  })

  it('lê o tom escrito no topo', () => {
    expect(song.declaredKey).toEqual({
      tonic: { letter: 'E', accidental: '' },
      mode: 'menor',
    })
  })

  it('aceita acordes na mesma linha do [Intro]', () => {
    expect(names(song.sections[0])).toEqual(['Em', 'C', 'G', 'D'])
  })

  it('não confunde letra que começa com "A" ou "E" com acordes', () => {
    const lyrics = song.sections[1].lines.map((l) => l.lyric)
    expect(lyrics).toEqual(['A noite é longa', 'E a luz já vem'])
  })

  it('ignora tablatura, descarta a seção vazia e avisa', () => {
    expect(song.sections.some((s) => s.name === 'Solo')).toBe(false)
    expect(song.warnings).toEqual(['Tablatura ignorada na seção "Solo" (2 linhas).'])
  })

  it('ignora marcas de repetição como (2x)', () => {
    expect(names(song.sections[2])).toEqual(['C', 'D', 'Em', 'C', 'D'])
  })
})

describe('parseCifra: casos de borda', () => {
  it('sem nenhuma seção marcada, tudo vira uma seção "Música"', () => {
    const song = parseCifra('G       D\nSó uma linha\nEm  C')
    expect(song.sections).toHaveLength(1)
    expect(song.sections[0].name).toBe('Música')
    expect(names(song.sections[0])).toEqual(['G', 'D', 'Em', 'C'])
  })

  it('acordes antes da primeira seção ficam numa seção "Início"', () => {
    const song = parseCifra('G  D  Em  C\n\n[Verso]\nC  G\nTexto')
    expect(song.sections.map((s) => s.name)).toEqual(['Início', 'Verso'])
  })

  it('letra sem acordes em cima é guardada com lista de acordes vazia', () => {
    const song = parseCifra('[Verso]\nG\nPrimeira\nSegunda sem acorde')
    expect(song.sections[0].lines).toEqual([
      { chords: [expect.objectContaining({ column: 0 })], lyric: 'Primeira' },
      { chords: [], lyric: 'Segunda sem acorde' },
    ])
  })

  it('texto vazio dá música vazia', () => {
    expect(parseCifra('')).toEqual({ sections: [], warnings: [] })
  })
})
