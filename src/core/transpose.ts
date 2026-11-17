/**
 * Transpor: subir ou descer a música inteira alguns semitons.
 *
 * A conta das alturas é simples (somar semitons). O cuidado está na grafia: em Fá
 * maior o certo é Bb, não A#. Por isso a transposição anda com as letras junto:
 * de Sol para Lá sobe uma letra, então F# vira G#, Bb (o bVII de Dó) vira C em Ré,
 * e cada acorde mantém a função que tinha no tom original.
 *
 * Só quando isso daria dobrado sustenido ou dobrado bemol (C## ou Fbb) o app usa a
 * nota equivalente, escrita com # ou b conforme a armadura do tom novo.
 */
import { chordName } from './chord'
import { defaultTonic } from './key'
import { letterIndex, mod12, noteFromPitchClass, pitchClass, shiftNote } from './notes'
import type { Chord, Key, Note, Song } from './types'

/** Tônicas maiores com bemóis na armadura: F, Bb, Eb, Ab, Db. */
const FLAT_MAJOR_TONICS = new Set([5, 10, 3, 8, 1])

/** Notas fora da escala em Dó maior / Lá menor, do jeito mais comum: C# Eb F# Ab Bb. */
const MIXED_SPELLING: Record<number, string> = { 1: '#', 3: 'b', 6: '#', 8: 'b', 10: 'b' }

/** Se o tom usa sustenidos, bemóis ou nenhum dos dois (Dó maior e Lá menor). */
function keyAccidentals(key: Key): 'sharp' | 'flat' | 'mixed' {
  if (key.tonic.accidental === '#') return 'sharp'
  if (key.tonic.accidental === 'b') return 'flat'
  // A armadura de um tom menor é a do relativo maior, três semitons acima.
  const relativeMajor = mod12(pitchClass(key.tonic) + (key.mode === 'menor' ? 3 : 0))
  if (relativeMajor === 0) return 'mixed'
  return FLAT_MAJOR_TONICS.has(relativeMajor) ? 'flat' : 'sharp'
}

/** Escreve uma altura do jeito que o tom pede. */
export function spellInKey(pc: number, key: Key): Note {
  const style = keyAccidentals(key)
  if (style === 'mixed')
    return noteFromPitchClass(pc, MIXED_SPELLING[mod12(pc)] === 'b' ? 'flat' : 'sharp')
  return noteFromPitchClass(pc, style)
}

/** Move uma nota `letterSteps` letras e `semitones` semitons, sem dobrados. */
function moveNote(note: Note, letterSteps: number, semitones: number, to: Key): Note {
  return (
    shiftNote(note, letterSteps, semitones) ??
    spellInKey(pitchClass(note) + semitones, to)
  )
}

/** Distância em letras e em semitons entre as tônicas de dois tons. */
function distance(from: Key, to: Key): { letters: number; semitones: number } {
  return {
    letters: letterIndex(to.tonic) - letterIndex(from.tonic),
    semitones: pitchClass(to.tonic) - pitchClass(from.tonic),
  }
}

/** O tom alguns semitons acima (positivo) ou abaixo (negativo), com a grafia usual. */
export function transposeKey(key: Key, semitones: number): Key {
  return {
    tonic: defaultTonic(pitchClass(key.tonic) + semitones, key.mode),
    mode: key.mode,
  }
}

/** Leva um acorde do tom `from` para o tom `to`, mantendo a função dele. */
export function transposeChord(chord: Chord, from: Key, to: Key): Chord {
  const { letters, semitones } = distance(from, to)
  const moved: Chord = { ...chord, root: moveNote(chord.root, letters, semitones, to) }
  if (chord.bass) moved.bass = moveNote(chord.bass, letters, semitones, to)
  moved.symbol = chordName(moved)
  return moved
}

/**
 * Transpõe a música inteira. `from` é o tom atual (o detectado ou o escolhido).
 * Devolve uma música nova; a original não muda.
 *
 * As colunas dos acordes ficam iguais. Se um acorde ficar mais comprido (C vira C#),
 * a tela é que cuida de não deixar um acorde encostar no outro.
 */
export function transposeSong(
  song: Song,
  from: Key,
  semitones: number,
): { song: Song; key: Key } {
  const to = transposeKey(from, semitones)
  const sections = song.sections.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({
      ...line,
      chords: line.chords.map((placed) => ({
        ...placed,
        chord: transposeChord(placed.chord, from, to),
      })),
    })),
  }))
  const result: Song = { ...song, sections }
  if (song.declaredKey) {
    const { letters, semitones: shift } = distance(from, to)
    result.declaredKey = {
      mode: song.declaredKey.mode,
      tonic: moveNote(song.declaredKey.tonic, letters, shift, to),
    }
  }
  return { song: result, key: to }
}
