import { describe, expect, it } from 'vitest'
import { chordName, parseChord } from './chord'
import { keySymbol } from './key'
import { parseNote } from './notes'
import { parseCifra, sectionChords } from './parse'
import { transposeChord, transposeKey, transposeSong } from './transpose'
import type { Key, Song } from './types'
import { fixtures } from '../../tests/fixtures'

function key(symbol: string): Key {
  const minor = symbol.endsWith('m')
  return {
    tonic: parseNote(minor ? symbol.slice(0, -1) : symbol)!,
    mode: minor ? 'menor' : 'maior',
  }
}

/** Transpõe um acorde do tom `from` para o tom `to` e devolve o texto. */
function move(symbol: string, from: string, to: string): string {
  return chordName(transposeChord(parseChord(symbol)!, key(from), key(to)))
}

function allNames(song: Song): string[] {
  return song.sections.flatMap(sectionChords).map(chordName)
}

describe('transposeKey', () => {
  it.each([
    ['G', 2, 'A'],
    ['G', -1, 'F#'],
    ['C', 1, 'Db'],
    ['D', -2, 'C'],
    ['A', 1, 'Bb'],
    ['E', 1, 'F'],
    ['Em', 1, 'Fm'],
    ['Am', 1, 'Bbm'],
    ['Gm', -1, 'F#m'],
    ['G', 12, 'G'],
  ])('%s %i semitons vira %s', (from, semitones, expected) => {
    expect(keySymbol(transposeKey(key(from), semitones))).toBe(expected)
  })
})

describe('transposeChord', () => {
  it('muda fundamental e baixo e mantém o resto do acorde', () => {
    expect(move('D/F#', 'G', 'A')).toBe('E/G#')
    expect(move('C7M(9)', 'G', 'A')).toBe('D7M(9)')
    expect(move('Bm7(b5)/F', 'C', 'D')).toBe('C#m7(b5)/G')
  })

  it('escreve com bemóis em tons de bemol e com sustenidos em tons de sustenido', () => {
    expect(move('B7', 'G', 'F')).toBe('A7')
    expect(move('D/F#', 'G', 'F')).toBe('C/E')
    expect(move('E', 'A', 'Bb')).toBe('F')
    expect(move('C#m7', 'E', 'Eb')).toBe('Cm7')
  })

  it('mantém a função do acorde na grafia (o bVII continua bemol)', () => {
    // Bb é o bVII de Dó. Em Ré, o bVII é C, não B#.
    expect(move('Bb', 'C', 'D')).toBe('C')
    // G#° é o #i° de Sol. Em Sib, o #i° é B°.
    expect(move('G#°', 'G', 'Bb')).toBe('B°')
  })

  it('evita dobrados sustenidos e dobrados bemóis', () => {
    // De Sib para Si, C#° viraria C##°: o app escreve D°.
    expect(move('C#°', 'Bb', 'B')).toBe('D°')
  })

  it('atualiza o `symbol` para o acorde novo', () => {
    const chord = transposeChord(parseChord('Cmaj7')!, key('C'), key('D'))
    expect(chord.symbol).toBe('D7M')
  })
})

describe('transposeSong', () => {
  const song = parseCifra(fixtures[0].text) // Sol maior

  it('transpõe todos os acordes e devolve o tom novo', () => {
    const result = transposeSong(song, key('G'), 2)
    expect(keySymbol(result.key)).toBe('A')
    expect(
      result.song.sections[0].lines[0].chords.map((c) => chordName(c.chord)),
    ).toEqual(['A', 'E/G#', 'F#m', 'D'])
  })

  it('mantém letra, seções e colunas', () => {
    const result = transposeSong(song, key('G'), 2)
    expect(result.song.sections.map((s) => s.name)).toEqual(
      song.sections.map((s) => s.name),
    )
    expect(result.song.sections[1].lines[0].lyric).toBe(song.sections[1].lines[0].lyric)
    expect(result.song.sections[1].lines[0].chords[1].column).toBe(16)
  })

  it('não altera a música original', () => {
    const before = allNames(song)
    transposeSong(song, key('G'), 5)
    expect(allNames(song)).toEqual(before)
  })

  it('transpõe também o "Tom:" escrito na cifra', () => {
    const withKey = parseCifra('Tom: G\n[Refrão]\nG  C\nLetra')
    expect(keySymbol(transposeSong(withKey, key('G'), -2).song.declaredKey!)).toBe('F')
  })

  it.each(fixtures)('$file sobe 5 semitons e volta igual', ({ text, key: k }) => {
    const original = parseCifra(text)
    const from: Key = { tonic: parseNote(k.tonic)!, mode: k.mode }
    const up = transposeSong(original, from, 5)
    const back = transposeSong(up.song, up.key, -5)
    expect(allNames(back.song)).toEqual(allNames(original))
  })
})
