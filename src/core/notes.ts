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

const LETTERS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** Posição da letra na sequência C D E F G A B (C = 0). */
export function letterIndex(note: Note): number {
  return LETTERS.indexOf(note.letter)
}

/**
 * Anda `letterSteps` letras e `semitones` semitons a partir de uma nota, escrevendo o
 * resultado com a letra certa: de Mi, 4 letras e 7 semitons acima é Si (a quinta);
 * de Sol, 1 letra e 1 semitom acima é Láb (não Sol#).
 *
 * Devolve `null` quando o resultado precisaria de dobrado sustenido ou dobrado bemol.
 */
export function shiftNote(
  note: Note,
  letterSteps: number,
  semitones: number,
): Note | null {
  const index = (((letterIndex(note) + letterSteps) % 7) + 7) % 7
  const target = mod12(pitchClass(note) + semitones)
  const offset = mod12(target - LETTER_PITCH[LETTERS[index]])
  const accidental = offset === 0 ? '' : offset === 1 ? '#' : offset === 11 ? 'b' : null
  return accidental === null ? null : { letter: LETTERS[index], accidental }
}
