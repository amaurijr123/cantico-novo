import { describe, expect, it } from 'vitest'
import { keySymbol } from '../core/key'
import { parseNote } from '../core/notes'
import { analyze, sectionLabels } from './analysis'
import { EXEMPLO } from './exemplo'
import { placeLabels } from './layout'

describe('analyze', () => {
  it('lê a cifra de exemplo e acha o tom', () => {
    const result = analyze(EXEMPLO)!
    expect(keySymbol(result.key)).toBe('G')
    expect(result.song.sections.map((s) => s.name)).toEqual(['Intro', 'Verso', 'Refrão'])
  })

  it('transpõe a música e o tom juntos', () => {
    const result = analyze(EXEMPLO, { semitones: 2 })!
    expect(keySymbol(result.key)).toBe('A')
    expect(keySymbol(result.originalKey)).toBe('G')
    expect(sectionLabels(result.song.sections[0], result.key, 'cifra')).toEqual([
      ['A', 'E/G#', 'F#m', 'D'],
    ])
  })

  it('aceita outro tom escolhido pela pessoa', () => {
    const emMenor = { tonic: parseNote('E')!, mode: 'menor' as const }
    const result = analyze(EXEMPLO, { chosenKey: emMenor })!
    expect(keySymbol(result.key)).toBe('Em')
    expect(result.keyOptions.map((g) => keySymbol(g.key))).toContain('Em')
  })

  it('ignora um tom escolhido que não existe na lista (fica o detectado)', () => {
    const result = analyze('[Verso]\nC  G\nLetra', {
      chosenKey: { tonic: parseNote('C')!, mode: 'maior' },
    })!
    expect(keySymbol(result.key)).toBe('C')
  })

  it('devolve null se não houver nenhum acorde', () => {
    expect(analyze('só letra\nsem acordes')).toBeNull()
    expect(analyze('')).toBeNull()
  })
})

describe('sectionLabels', () => {
  const result = analyze(EXEMPLO)!

  it('em modo graus, calcula os graus da seção inteira', () => {
    expect(sectionLabels(result.song.sections[2], result.key, 'graus')).toEqual([
      ['I', 'V/3', 'vi', 'IV'],
      ['I', 'V/3', 'IV', 'V', 'I'],
    ])
  })

  it('linha só de letra fica sem rótulos', () => {
    const song = analyze('[Verso]\nG\nUm\nDois')!
    expect(sectionLabels(song.song.sections[0], song.key, 'cifra')).toEqual([['G'], []])
  })
})

describe('placeLabels', () => {
  it('põe cada acorde na coluna original', () => {
    expect(
      placeLabels([
        { label: 'G', column: 0 },
        { label: 'D/F#', column: 8 },
      ]),
    ).toEqual([
      { text: 'G', chord: 0 },
      { text: '       ', chord: null },
      { text: 'D/F#', chord: 1 },
    ])
  })

  it('empurra o próximo quando o rótulo cresce, deixando um espaço', () => {
    const segments = placeLabels([
      { label: 'V7/vi/3', column: 0 },
      { label: 'vi', column: 4 },
    ])
    expect(segments.map((s) => s.text).join('')).toBe('V7/vi/3 vi')
  })

  it('aceita linha vazia', () => {
    expect(placeLabels([])).toEqual([])
  })
})
