/**
 * Voicing: em que notas do teclado tocar cada acorde.
 *
 * - Mão esquerda: só o baixo (a fundamental, ou a nota depois da barra em "D/F#"),
 *   entre E2 e D#3.
 * - Mão direita: o acorde fechado, com 3 ou 4 notas dentro de pouco mais de uma
 *   oitava, perto do Dó central.
 *
 * Entre um acorde e o próximo, a mão direita escolhe a inversão que anda menos
 * (condução de vozes): notas em comum ficam paradas e as outras andam o mínimo.
 *
 * As notas usam a notação internacional: C4 é o Dó central (MIDI 60).
 */
import { mod12, noteName, pitchClass, shiftNote, noteFromPitchClass } from './notes'
import type { Chord, Note } from './types'

export interface KeyboardNote {
  /** Número MIDI: 60 é o Dó central. */
  midi: number
  /** Nome com oitava, como "F#4". */
  name: string
}

export interface Voicing {
  left: KeyboardNote[]
  right: KeyboardNote[]
}

/** Um som do acorde: distância em semitons e em letras a partir da fundamental. */
interface Tone {
  semitones: number
  letters: number
}

const T = (semitones: number, letters: number): Tone => ({ semitones, letters })

const ROOT = T(0, 0)
const MAJOR_THIRD = T(4, 2)
const MINOR_THIRD = T(3, 2)

const EXTENSION_TONES: Record<string, Tone> = {
  b9: T(1, 1),
  '9': T(2, 1),
  add9: T(2, 1),
  '2': T(2, 1),
  '#9': T(3, 1),
  '11': T(5, 3),
  '#11': T(6, 3),
  b13: T(8, 5),
  '13': T(9, 5),
}

/** Faixas de cada mão, em MIDI. */
const BASS_LOW = 40 // E2
const RIGHT_LOW = 57 // A3
const RIGHT_HIGH = 79 // G5
const RIGHT_CENTER = 64 // E4: onde a mão direita começa quando não há acorde anterior

/** Os sons que a mão direita toca, já escolhidos (3 ou 4). */
function upperTones(chord: Chord): Tone[] {
  const third = (() => {
    switch (chord.quality) {
      case 'menor':
      case 'diminuto':
      case 'meio-diminuto':
        return MINOR_THIRD
      case 'sus4':
        return T(5, 3)
      case 'sus2':
        return T(2, 1)
      default:
        return MAJOR_THIRD
    }
  })()

  const fifth = (() => {
    switch (chord.quality) {
      case 'diminuto':
      case 'meio-diminuto':
        return T(6, 4)
      case 'aumentado':
        return T(8, 4)
      default:
        return T(7, 4)
    }
  })()

  const seventh = (() => {
    switch (chord.seventh) {
      case '7':
        return T(10, 6)
      case '7M':
        return T(11, 6)
      case '6':
        return T(9, 5)
      case '°7':
        return T(9, 6)
      default:
        return null
    }
  })()

  const extensions = chord.extensions
    .map((e) => EXTENSION_TONES[e])
    .filter((t): t is Tone => t !== undefined)
  const ninth = extensions.find((t) => t.letters === 1)
  const thirteenth = extensions.find((t) => t.letters === 5)
  const eleventh = extensions.find((t) => t.letters === 3)

  if (!seventh) {
    // Tríade: fundamental, terça e quinta, mais a nona se houver (add9, "2").
    return [ROOT, ...(ninth ? [ninth] : []), third, fifth]
  }
  // Tétrade: terça e sétima sempre. A nona entra no lugar da fundamental (o baixo já
  // toca a fundamental) e a 13ª no lugar da quinta, para caber em 4 notas.
  const tones = [ninth ?? ROOT, third, thirteenth ?? fifth, seventh]
  if (eleventh && !ninth) tones[0] = eleventh
  return tones
}

/** Escreve a nota com a letra certa para o acorde (F# em Ré maior, não Gb). */
function spell(chord: Chord, tone: Tone): Note {
  return (
    shiftNote(chord.root, tone.letters, tone.semitones) ??
    noteFromPitchClass(pitchClass(chord.root) + tone.semitones)
  )
}

function keyboardNote(midi: number, note: Note): KeyboardNote {
  // B#3 é o mesmo som que C4: a oitava segue a letra, não o som.
  const shift = note.accidental === '#' ? 1 : note.accidental === 'b' ? -1 : 0
  const octave = Math.floor((midi - shift) / 12) - 1
  return { midi, name: `${noteName(note)}${octave}` }
}

/** O baixo da mão esquerda. */
function bassVoicing(chord: Chord): KeyboardNote[] {
  const note = chord.bass ?? chord.root
  const midi = BASS_LOW + mod12(pitchClass(note) - BASS_LOW)
  return [keyboardNote(midi, note)]
}

/** Todas as formas de empilhar os sons em posição fechada dentro da faixa da mão direita. */
function rightCandidates(chord: Chord): KeyboardNote[][] {
  const tones = upperTones(chord).map((tone) => ({
    pc: mod12(pitchClass(chord.root) + tone.semitones),
    note: spell(chord, tone),
  }))
  // Ordem dentro da oitava, a partir da nota mais grave de cada inversão.
  const sorted = [...tones].sort((a, b) => a.pc - b.pc)
  const candidates: KeyboardNote[][] = []
  for (let start = 0; start < sorted.length; start++) {
    const order = [...sorted.slice(start), ...sorted.slice(0, start)]
    for (let octave = 3; octave <= 5; octave++) {
      let previous = (octave + 1) * 12 + order[0].pc - 1
      const notes = order.map(({ pc, note }) => {
        const midi = previous + 1 + mod12(pc - (previous + 1))
        previous = midi
        return keyboardNote(midi, note)
      })
      const low = notes[0].midi
      const high = notes[notes.length - 1].midi
      if (low >= RIGHT_LOW && high <= RIGHT_HIGH) candidates.push(notes)
    }
  }
  return candidates
}

function center(notes: KeyboardNote[]): number {
  return notes.reduce((sum, n) => sum + n.midi, 0) / notes.length
}

/** Quanto a mão direita anda de um acorde para o outro (menor é melhor). */
function movement(from: KeyboardNote[], to: KeyboardNote[]): number {
  // Cada nota nova vai até a nota mais próxima do acorde anterior.
  const cost = to.reduce(
    (sum, note) => sum + Math.min(...from.map((f) => Math.abs(f.midi - note.midi))),
    0,
  )
  return cost + Math.abs(center(from) - center(to)) // evita a mão "subir" aos poucos
}

/** O voicing de um acorde, perto de `previous` se houver. */
export function voiceChord(chord: Chord, previous?: Voicing): Voicing {
  const candidates = rightCandidates(chord)
  const score = (notes: KeyboardNote[]) =>
    previous ? movement(previous.right, notes) : Math.abs(center(notes) - RIGHT_CENTER)
  const right = candidates.reduce((best, c) => (score(c) < score(best) ? c : best))
  return { left: bassVoicing(chord), right }
}

/** Os voicings de uma sequência, cada um conduzido a partir do anterior. */
export function voiceProgression(chords: Chord[]): Voicing[] {
  const voicings: Voicing[] = []
  for (const chord of chords)
    voicings.push(voiceChord(chord, voicings[voicings.length - 1]))
  return voicings
}
