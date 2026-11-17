import type { Accidental, Note, NoteLetter, PitchClass } from './types'

/** Altura de cada letra sem acidente: C=0, D=2, E=4... */
const LETTER_PITCH: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/** Garante que qualquer inteiro (até negativo) vire 0..11. */
export function mod12(n: number): PitchClass {
  return (((n % 12) + 12) % 12) as PitchClass
}

/**
 * Lê uma nota escrita ("F#", "Bb", "c") e devolve `null` se não for uma nota.
 * Aceita letra minúscula porque cifras coladas às vezes vêm assim.
 */
export function parseNote(text: string): Note | null {
  const match = /^([A-Ga-g])([#b]?)$/.exec(text.trim())
  if (!match) return null
  return {
    letter: match[1].toUpperCase() as NoteLetter,
    accidental: match[2] as Accidental,
  }
}

/** Altura (0..11) de uma nota. */
export function pitchClass(note: Note): PitchClass {
  const shift = note.accidental === '#' ? 1 : note.accidental === 'b' ? -1 : 0
  return mod12(LETTER_PITCH[note.letter] + shift)
}

/** Escreve a nota de volta como texto. */
export function noteName(note: Note): string {
  return note.letter + note.accidental
}

/**
 * Converte uma altura em nota escrita.
 * `prefer` decide entre sustenido e bemol: em Fá maior queremos Bb, em Mi maior queremos D#.
 */
export function noteFromPitchClass(pc: number, prefer: 'sharp' | 'flat' = 'sharp'): Note {
  const name = (prefer === 'flat' ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)]
  return parseNote(name)!
}

/** Distância em semitons subindo de `from` até `to` (0..11). */
export function interval(from: Note, to: Note): PitchClass {
  return mod12(pitchClass(to) - pitchClass(from))
}
