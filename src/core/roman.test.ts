import { describe, expect, it } from 'vitest'
import { parseChord } from './chord'
import { parseNote } from './notes'
import { parseCifra, sectionChords } from './parse'
import { romanNumeral, romanNumerals } from './roman'
import type { Chord, Key } from './types'
import { fixtures } from '../../tests/fixtures'

function key(symbol: string): Key {
  const minor = symbol.endsWith('m')
  return {
    tonic: parseNote(minor ? symbol.slice(0, -1) : symbol)!,
    mode: minor ? 'menor' : 'maior',
  }
}

function chords(...symbols: string[]): Chord[] {
  return symbols.map((s) => parseChord(s)!)
}

function one(symbol: string, k: string): string {
  return romanNumeral(parseChord(symbol)!, key(k))
}

describe('romanNumeral: acorde sozinho', () => {
  it.each([
    // Campo harmônico de Sol maior
    ['G', 'I'],
    ['Am', 'ii'],
    ['Bm', 'iii'],
    ['C', 'IV'],
    ['D', 'V'],
    ['Em', 'vi'],
    ['F#m7(b5)', 'viiø'],
    // Sétimas e sextas
    ['G7M', 'I7M'],
    ['Am7', 'ii7'],
    ['D7', 'V7'],
    ['C6', 'IV6'],
    // Suspensos
    ['Dsus4', 'Vsus4'],
    ['D7(4)', 'V7(4)'],
    // Empréstimos e cromáticos
    ['Cm', 'iv'],
    ['F', 'bVII'],
    ['Bb', 'bIII'],
    ['Eb', 'bVI'],
    ['G#°', '#i°'],
    ['C#°', '#iv°'],
    ['D(#5)', 'V+'],
  ])('em Sol, %s é %s', (symbol, expected) => {
    expect(one(symbol, 'G')).toBe(expected)
  })

  it.each([
    ['Em', 'i'],
    ['F#m7(b5)', 'iiø'],
    ['G', 'III'],
    ['Am7', 'iv7'],
    ['Bm', 'v'],
    ['B7', 'V7'],
    ['C', 'VI'],
    ['D', 'VII'],
    ['D#°', 'vii°'],
  ])('em Mi menor, %s é %s', (symbol, expected) => {
    expect(one(symbol, 'Em')).toBe(expected)
  })

  it('não mostra as tensões, só a sétima', () => {
    expect(one('C7M(9)', 'G')).toBe('IV7M')
    expect(one('A2', 'D')).toBe('V')
    expect(one('C(add9)', 'C')).toBe('I')
  })

  it.each([
    ['D/F#', 'G', 'V/3'],
    ['G/D', 'G', 'I/5'],
    ['C/G', 'G', 'IV/5'],
    ['C/Bb', 'F', 'V/7'],
    ['Bb/C', 'F', 'IV/9'],
    ['Bb/F', 'F', 'IV/5'],
  ])(
    '%s em %s é %s (o número diz qual nota do acorde está no baixo)',
    (s, k, expected) => {
      expect(one(s, k)).toBe(expected)
    },
  )
})

describe('romanNumerals: com o contexto do acorde seguinte', () => {
  it('reconhece dominante secundário pelo acorde que ele prepara', () => {
    expect(romanNumerals(chords('G', 'D/F#', 'B7/D#', 'Em', 'C', 'G'), key('G'))).toEqual(
      ['I', 'V/3', 'V7/vi/3', 'vi', 'IV', 'I'],
    )
    expect(romanNumerals(chords('G', 'E7', 'Am', 'D7', 'G'), key('G'))).toEqual([
      'I',
      'V7/ii',
      'ii',
      'V7',
      'I',
    ])
  })

  it('reconhece o ii–V que vai para outro grau', () => {
    expect(romanNumerals(chords('G', 'Dm7', 'G7', 'C'), key('G'))).toEqual([
      'I',
      'ii7/IV',
      'V7/IV',
      'IV',
    ])
    expect(romanNumerals(chords('C', 'Bm7(b5)', 'E7', 'Am'), key('C'))).toEqual([
      'I',
      'iiø/vi',
      'V7/vi',
      'vi',
    ])
  })

  it('V indo para o I continua sendo só V', () => {
    expect(romanNumerals(chords('Am7', 'D7', 'G'), key('G'))).toEqual(['ii7', 'V7', 'I'])
  })

  it('acorde maior do próprio campo indo para outro grau não vira secundário', () => {
    // C vai para F em Sol? C é IV de Sol e F é bVII: não é dominante, é só IV.
    expect(romanNumerals(chords('C', 'F'), key('G'))).toEqual(['IV', 'bVII'])
  })

  it('em tom menor também', () => {
    expect(romanNumerals(chords('Em', 'Am7', 'B7', 'Em'), key('Em'))).toEqual([
      'i',
      'iv7',
      'V7',
      'i',
    ])
    expect(romanNumerals(chords('Em', 'C', 'G', 'D'), key('Em'))).toEqual([
      'i',
      'VI',
      'III',
      'VII',
    ])
  })
})

describe('cifras de exemplo', () => {
  it.each(fixtures)('$file: todo acorde ganha um grau', ({ text, key: k }) => {
    const song = parseCifra(text)
    const tom: Key = { tonic: parseNote(k.tonic)!, mode: k.mode }
    for (const section of song.sections) {
      const graus = romanNumerals(sectionChords(section), tom)
      expect(graus).toHaveLength(sectionChords(section).length)
      for (const grau of graus) expect(grau).toMatch(/^[#b]?[IViv]+/)
    }
  })

  it('o refrão de exemplo em Sol', () => {
    const refrao = parseCifra(fixtures[0].text).sections[2]
    expect(romanNumerals(sectionChords(refrao), key('G'))).toEqual([
      'I',
      'V/3',
      'vi',
      'IV',
      'I',
      'V/3',
      'IV',
      'V',
      'I',
    ])
  })
})
