import { describe, expect, it } from 'vitest'
import { parseChord } from './chord'
import { detectKey, detectSongKey, keyName, keySymbol } from './key'
import { parseNote } from './notes'
import { parseCifra } from './parse'
import type { Chord, Key } from './types'
import { fixtures } from '../../tests/fixtures'

function chords(...symbols: string[]): Chord[] {
  return symbols.map((s) => parseChord(s)!)
}

function key(tonic: string, mode: Key['mode']): Key {
  return { tonic: parseNote(tonic)!, mode }
}

/** O tom mais provável, escrito curto ("G", "Em"). */
function best(list: Chord[], hint?: Key): string {
  return keySymbol(detectKey(list, { hint })[0].key)
}

describe('detectKey', () => {
  it('acha o tom de uma progressão simples', () => {
    expect(best(chords('G', 'D', 'Em', 'C', 'G'))).toBe('G')
    expect(best(chords('C', 'F', 'G7', 'C'))).toBe('C')
  })

  it('desempata relativo maior e menor pelo começo, fim e dominante', () => {
    // Mesmos acordes de Sol maior, mas começa e termina em Em e tem o B7 (V de Mi menor).
    expect(best(chords('Em', 'C', 'G', 'D', 'B7', 'Em'))).toBe('Em')
    // Começa em Am e só passa pelo resto: Lá menor, não Dó maior.
    expect(best(chords('Am', 'F', 'C', 'G'))).toBe('Am')
  })

  it('usa a fundamental, não o baixo, em acordes invertidos', () => {
    // F/G e Bb/C são IV sobre o baixo do V: continuam contando como IV.
    expect(best(chords('F', 'Bb/F', 'F', 'C/E', 'Dm7', 'Bb/C', 'F'))).toBe('F')
  })

  it('aceita acordes de fora do tom sem se perder', () => {
    // Cm é empréstimo modal e G#° é diminuto de passagem: o tom continua Sol.
    expect(best(chords('G', 'G#°', 'Am7', 'D7', 'C', 'Cm', 'G'))).toBe('G')
  })

  it('escreve o tom com bemol ou sustenido como na cifra', () => {
    expect(best(chords('Bb', 'F/A', 'Gm7', 'Eb2', 'F', 'Bb'))).toBe('Bb')
    expect(best(chords('F#m', 'D', 'A', 'E', 'C#7', 'F#m'))).toBe('F#m')
  })

  it('o tom escrito na cifra ("Tom:") desempata casos em dúvida', () => {
    const list = chords('Am', 'F', 'C', 'G')
    expect(best(list, key('C', 'maior'))).toBe('C')
  })

  it('devolve as 24 tonalidades em ordem, da mais provável para a menos', () => {
    const ranking = detectKey(chords('G', 'D', 'Em', 'C', 'G'))
    expect(ranking).toHaveLength(24)
    const scores = ranking.map((g) => g.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('sem acordes, não chuta nada', () => {
    expect(detectKey([])).toEqual([])
  })
})

describe('detectSongKey: cifras de exemplo', () => {
  it.each(fixtures)('$file está em $key.tonic $key.mode', ({ text, key: expected }) => {
    const [top] = detectSongKey(parseCifra(text))
    expect(top.key).toEqual(key(expected.tonic, expected.mode))
  })

  it('usa o "Tom:" escrito no topo como pista', () => {
    const song = parseCifra('Tom: C\n\n[Refrão]\nAm  F  C  G\nLetra inventada')
    expect(keySymbol(detectSongKey(song)[0].key)).toBe('C')
  })
})

describe('keyName e keySymbol', () => {
  it.each([
    [key('G', 'maior'), 'Sol maior', 'G'],
    [key('E', 'menor'), 'Mi menor', 'Em'],
    [key('Bb', 'maior'), 'Si bemol maior', 'Bb'],
    [key('F#', 'menor'), 'Fá sustenido menor', 'F#m'],
    [key('C', 'maior'), 'Dó maior', 'C'],
    [key('D', 'maior'), 'Ré maior', 'D'],
    [key('A', 'menor'), 'Lá menor', 'Am'],
  ])('%o se chama "%s" e se escreve "%s"', (k, name, symbol) => {
    expect(keyName(k)).toBe(name)
    expect(keySymbol(k)).toBe(symbol)
  })
})
