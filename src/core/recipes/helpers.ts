/**
 * Ferramentas que todas as receitas usam: montar acordes novos com a grafia certa,
 * saber o grau de um acorde e inserir acordes numa sequência.
 */
import { chordName } from '../chord'
import { triadType } from '../key'
import { mod12, noteFromPitchClass, pitchClass, shiftNote } from '../notes'
import type { Chord, ChordQuality, Idea, Key, Note, RecipeId } from '../types'

/**
 * Nota a `letters` letras e `semitones` semitons de outra, com a letra certa.
 * Ex.: a quinta de Mi é `above(E, 4, 7)` = Si; o bII de Sol é `above(G, 1, 1)` = Láb.
 */
export function above(note: Note, letters: number, semitones: number): Note {
  const target = pitchClass(note) + semitones
  const result = shiftNote(note, letters, semitones)
  // Na cifra, E#, B#, Fb e Cb confundem mais do que ajudam: vira F, C, E e B.
  if (!result || RARE.has(result.letter + result.accidental)) {
    return noteFromPitchClass(target, 'sharp')
  }
  return result
}

const RARE = new Set(['E#', 'B#', 'Fb', 'Cb'])

/** Monta um acorde e já preenche o `symbol`. Baixo igual à fundamental é descartado. */
export function build(
  root: Note,
  quality: ChordQuality,
  options: { seventh?: Chord['seventh']; extensions?: string[]; bass?: Note } = {},
): Chord {
  const chord: Chord = { root, quality, extensions: options.extensions ?? [], symbol: '' }
  if (options.seventh) chord.seventh = options.seventh
  if (options.bass && pitchClass(options.bass) !== pitchClass(root))
    chord.bass = options.bass
  chord.symbol = chordName(chord)
  return chord
}

/** O mesmo acorde com outro baixo (ou sem baixo, se for a própria fundamental). */
export function withBass(chord: Chord, bass: Note): Chord {
  return build(chord.root, chord.quality, {
    seventh: chord.seventh,
    extensions: chord.extensions,
    bass,
  })
}

/** Distância em semitons da tônica até a fundamental do acorde. */
export function degree(chord: Chord, key: Key): number {
  return mod12(pitchClass(chord.root) - pitchClass(key.tonic))
}

/** O acorde é o próprio acorde do tom (G em Sol maior, Em em Mi menor)? */
export function isTonic(chord: Chord, key: Key): boolean {
  return degree(chord, key) === 0 && triadType(chord) === key.mode
}

/** Os dois acordes têm a mesma fundamental? */
export function sameRoot(a: Chord, b: Chord): boolean {
  return pitchClass(a.root) === pitchClass(b.root)
}

/** `b` está uma quarta acima de `a` (a resolução natural de um dominante)? */
export function resolvesTo(a: Chord, b: Chord): boolean {
  return mod12(pitchClass(b.root) - pitchClass(a.root)) === 5
}

/** Nota do baixo: a do baixo invertido, se houver, senão a fundamental. */
export function bassNote(chord: Chord): Note {
  return chord.bass ?? chord.root
}

/** Acorde maior com cara de dominante: tem sétima, é o V, ou é maior fora do campo. */
export function looksDominant(chord: Chord, key: Key): boolean {
  if (chord.quality !== 'maior') return false
  if (chord.seventh === '7') return true
  const d = degree(chord, key)
  const diatonicMajors = key.mode === 'maior' ? [0, 5, 7] : [3, 7, 8, 10]
  return d === 7 || !diatonicMajors.includes(d)
}

/** Insere acordes antes da posição `index`. Devolve a lista nova e o que destacar. */
export function insertBefore(
  list: Chord[],
  index: number,
  ...chords: Chord[]
): { after: Chord[]; highlight: number[] } {
  return {
    after: [...list.slice(0, index), ...chords, ...list.slice(index)],
    highlight: chords.map((_, i) => index + i),
  }
}

/** Troca os acordes a partir da posição `index` pelos acordes dados. */
export function replaceAt(
  list: Chord[],
  index: number,
  count: number,
  ...chords: Chord[]
): { after: Chord[]; highlight: number[] } {
  return {
    after: [...list.slice(0, index), ...chords, ...list.slice(index + count)],
    highlight: chords.map((_, i) => index + i),
  }
}

/** Monta a ideia. */
export function idea(
  recipe: RecipeId,
  before: Chord[],
  change: { after: Chord[]; highlight: number[] },
  score: number,
  explanation: string,
): Idea {
  return { recipe, before, ...change, score, explanation }
}

/** Nome curto do acorde, para usar nas explicações. */
export const n = chordName
