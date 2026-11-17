import { describe, expect, it } from 'vitest'
import { chordName, parseChord } from './chord'
import { fixtures } from '../../tests/fixtures'

/** Lê o acorde e escreve de volta na forma padrão do app. */
function normalize(text: string): string | null {
  const chord = parseChord(text)
  return chord ? chordName(chord) : null
}

describe('parseChord: estrutura', () => {
  it('separa fundamental, qualidade, sétima, tensões e baixo', () => {
    expect(parseChord('Bm7(b5)/F')).toEqual({
      root: { letter: 'B', accidental: '' },
      quality: 'meio-diminuto',
      seventh: '7',
      extensions: [],
      bass: { letter: 'F', accidental: '' },
      symbol: 'Bm7(b5)/F',
    })
  })

  it('guarda tensões em ordem, sem repetir', () => {
    const chord = parseChord('G7(13,9)')!
    expect(chord.seventh).toBe('7')
    expect(chord.extensions).toEqual(['9', '13'])
  })

  it('guarda o texto original em `symbol`', () => {
    expect(parseChord('Cmaj7')!.symbol).toBe('Cmaj7')
  })
})

describe('parseChord + chordName: notação brasileira', () => {
  it.each([
    // Tríades
    ['C', 'C'],
    ['Cm', 'Cm'],
    ['F#m', 'F#m'],
    ['Bb', 'Bb'],
    // Sétimas e sextas
    ['C7', 'C7'],
    ['C7M', 'C7M'],
    ['Cmaj7', 'C7M'],
    ['CM7', 'C7M'],
    ['C7+', 'C7M'],
    ['Cm7', 'Cm7'],
    ['Cm7M', 'Cm7M'],
    ['Cm(7M)', 'Cm7M'],
    ['C6', 'C6'],
    ['Cm6', 'Cm6'],
    ['C6(9)', 'C6(9)'],
    ['C6/9', 'C6(9)'],
  ])('%s vira %s', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })

  it.each([
    // No Brasil, "°" sozinho já indica o diminuto com sétima (tétrade).
    ['G#°', 'G#°'],
    ['G#º', 'G#°'],
    ['G#dim', 'G#°'],
    ['G#°7', 'G#°'],
    ['G#dim7', 'G#°'],
    // Meio-diminuto
    ['Bm7(b5)', 'Bm7(b5)'],
    ['Bm7b5', 'Bm7(b5)'],
    ['Bø', 'Bm7(b5)'],
    ['Bø7', 'Bm7(b5)'],
    // Aumentado
    ['C+', 'C(#5)'],
    ['Caug', 'C(#5)'],
    ['C5+', 'C(#5)'],
    ['C(#5)', 'C(#5)'],
    ['C7(#5)', 'C7(#5)'],
  ])('%s vira %s', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })

  it.each([
    // Suspensos: "D4" é Dsus4 na cifra brasileira; com sétima, o 4 vai entre parênteses.
    ['Dsus4', 'Dsus4'],
    ['Dsus', 'Dsus4'],
    ['D4', 'Dsus4'],
    ['D7(4)', 'D7(4)'],
    ['D7sus4', 'D7(4)'],
    ['G7(4,9)', 'G7(4,9)'],
    ['Dsus2', 'Dsus2'],
    // "2" é a nona adicionada do jeito que o louvor escreve (A2, Eb2). Fica como está.
    ['A2', 'A2'],
    ['Eb2', 'Eb2'],
    // Nona sem sétima é nona adicionada: C9, C(9) e Cadd9 viram C(add9).
    ['C9', 'C(add9)'],
    ['C(9)', 'C(add9)'],
    ['Cadd9', 'C(add9)'],
    ['C(add9)', 'C(add9)'],
  ])('%s vira %s', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })

  it.each([
    // Tensões com sétima, sempre em ordem crescente e separadas por vírgula.
    ['C7(9)', 'C7(9)'],
    ['C7(9,13)', 'C7(9,13)'],
    ['C7(9/13)', 'C7(9,13)'],
    ['C7(13,9)', 'C7(9,13)'],
    ['E7(#9)', 'E7(#9)'],
    ['G7(b9)', 'G7(b9)'],
    ['G7(b9,b13)', 'G7(b9,b13)'],
    ['Em7(9)', 'Em7(9)'],
    ['Em7(11)', 'Em7(11)'],
    ['F7M(9)', 'F7M(9)'],
    ['F7M(#11)', 'F7M(#11)'],
    // "-" e "+" depois do número, como no Cifra Club: 9- é b9, 13- é b13, 11+ é #11.
    ['G#7(9-)', 'G#7(b9)'],
    ['G#7(13-)', 'G#7(b13)'],
    ['G#7(9-/13-)', 'G#7(b9,b13)'],
    ['C7(9+)', 'C7(#9)'],
    ['F7M(11+)', 'F7M(#11)'],
    ['Am7(5-)', 'Am7(b5)'],
    ['G#7(5+)', 'G#7(#5)'],
    // "7+" continua sendo sétima maior.
    ['C7+', 'C7M'],
  ])('%s vira %s', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })

  it.each([
    ['D/F#', 'D/F#'],
    ['Bb/C', 'Bb/C'],
    ['Ebm7/Db', 'Ebm7/Db'],
    ['C7(9/13)/E', 'C7(9,13)/E'],
    ['C6/9/E', 'C6(9)/E'],
  ])('%s vira %s (baixo invertido)', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })
})

describe('parseChord: o que não é acorde', () => {
  it.each([
    '',
    'H',
    'Intro',
    '[Refrão]',
    'N.C.',
    'x2',
    'em',
    'eu',
    'Eu',
    'Cmx',
    'C/H',
    'C7(',
    'Am7)',
    'C77',
    'Cm7M7',
  ])('"%s" devolve null', (text) => {
    expect(parseChord(text)).toBeNull()
  })
})

describe('as cifras de exemplo', () => {
  // Nas fixtures, a letra sempre começa com espaço e a linha de acordes nunca começa.
  const chordLines = fixtures.flatMap(({ file, text }) =>
    text
      .split('\n')
      .filter((line) => line.trim() !== '' && !line.startsWith('[') && !/^\s/.test(line))
      .map((line) => ({ file, line })),
  )

  it.each(chordLines)(
    '$file: "$line" tem só acordes escritos na forma padrão',
    ({ line }) => {
      for (const token of line.trim().split(/\s+/)) {
        expect(normalize(token), token).toBe(token)
      }
    },
  )
})
