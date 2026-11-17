import { describe, expect, it } from 'vitest'
import {
  interval,
  mod12,
  noteFromPitchClass,
  noteName,
  parseNote,
  pitchClass,
} from './notes'

describe('parseNote', () => {
  it('lê notas naturais, com sustenido e com bemol', () => {
    expect(parseNote('G')).toEqual({ letter: 'G', accidental: '' })
    expect(parseNote('F#')).toEqual({ letter: 'F', accidental: '#' })
    expect(parseNote('Bb')).toEqual({ letter: 'B', accidental: 'b' })
  })

  it('aceita letra minúscula e espaços em volta', () => {
    expect(parseNote(' c# ')).toEqual({ letter: 'C', accidental: '#' })
  })

  it('devolve null para o que não é nota', () => {
    expect(parseNote('H')).toBeNull()
    expect(parseNote('Am')).toBeNull()
    expect(parseNote('')).toBeNull()
  })
})

describe('pitchClass', () => {
  it('dá a mesma altura para notas enarmônicas', () => {
    expect(pitchClass(parseNote('F#')!)).toBe(6)
    expect(pitchClass(parseNote('Gb')!)).toBe(6)
  })

  it('dá a volta na oitava', () => {
    expect(pitchClass(parseNote('Cb')!)).toBe(11)
    expect(pitchClass(parseNote('B#')!)).toBe(0)
  })
})

describe('noteFromPitchClass', () => {
  it('escolhe sustenido ou bemol conforme pedido', () => {
    expect(noteName(noteFromPitchClass(10, 'sharp'))).toBe('A#')
    expect(noteName(noteFromPitchClass(10, 'flat'))).toBe('Bb')
  })

  it('aceita números fora de 0..11', () => {
    expect(noteName(noteFromPitchClass(-1))).toBe('B')
    expect(mod12(14)).toBe(2)
  })
})

describe('interval', () => {
  it('mede semitons subindo', () => {
    // Sol até Si: terça maior (4 semitons), base do dominante secundário B7 em Sol.
    expect(interval(parseNote('G')!, parseNote('B')!)).toBe(4)
    // Ré até Lá bemol: trítono (6), base da substituição D7 -> Ab7.
    expect(interval(parseNote('D')!, parseNote('Ab')!)).toBe(6)
  })
})
