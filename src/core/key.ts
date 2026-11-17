/**
 * Descobre o tom de uma música pelos acordes.
 *
 * Cada uma das 24 tonalidades (12 maiores e 12 menores) ganha pontos, e a lista volta
 * ordenada da mais provável para a menos. A interface mostra a primeira e deixa a
 * pessoa trocar, porque relativos (Sol maior e Mi menor) usam os mesmos acordes.
 *
 * Como os pontos são dados, para cada acorde da música:
 *
 *   +1   o acorde pertence ao campo harmônico do tom (fundamental e qualidade certas)
 *   +1   ele é o próprio acorde do tom (o I ou o i): o tom costuma aparecer muito
 *   +1   ele é dominante com sétima no V grau (D7 em Sol, B7 em Mi menor)
 *   −0,5 a fundamental nem está na escala do tom
 *
 * E, para a música inteira:
 *
 *   +2   o primeiro acorde é o acorde do tom
 *   +2   o último acorde é o acorde do tom
 *   +4   o tom é o mesmo escrito na cifra ("Tom: G")
 *
 * O tom escrito na cifra também vence quando chega a 85% da pontuação do primeiro
 * colocado. Numa música longa, os +4 sozinhos quase não pesam.
 */
import { noteFromPitchClass, noteName, pitchClass, mod12 } from './notes'
import type { Chord, Key, Mode, Note, Song } from './types'
import { sectionChords } from './parse'

export interface KeyGuess {
  key: Key
  score: number
}

/** O "tipo" de tríade que importa para o campo harmônico. */
export type TriadType = 'maior' | 'menor' | 'diminuto'

/** Graus do campo harmônico: distância do tom em semitons e tipo de tríade. */
interface Degree {
  interval: number
  type: TriadType
}

const MAJOR_FIELD: Degree[] = [
  { interval: 0, type: 'maior' }, // I
  { interval: 2, type: 'menor' }, // ii
  { interval: 4, type: 'menor' }, // iii
  { interval: 5, type: 'maior' }, // IV
  { interval: 7, type: 'maior' }, // V
  { interval: 9, type: 'menor' }, // vi
  { interval: 11, type: 'diminuto' }, // vii°
]

/** Menor natural mais o V maior e o vii° da menor harmônica, muito usados. */
const MINOR_FIELD: Degree[] = [
  { interval: 0, type: 'menor' }, // i
  { interval: 2, type: 'diminuto' }, // ii°
  { interval: 3, type: 'maior' }, // III
  { interval: 5, type: 'menor' }, // iv
  { interval: 7, type: 'menor' }, // v
  { interval: 7, type: 'maior' }, // V (harmônica)
  { interval: 8, type: 'maior' }, // VI
  { interval: 10, type: 'maior' }, // VII
  { interval: 11, type: 'diminuto' }, // vii° (harmônica)
]

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10, 11] // natural + a sensível da harmônica

/** Grafia padrão de cada tom quando a cifra não dá pista: Bb maior, não A# maior. */
const MAJOR_TONIC_PREFERS_FLAT = new Set([1, 3, 5, 8, 10]) // Db Eb F Ab Bb
const MINOR_TONIC_PREFERS_FLAT = new Set([3, 10]) // Ebm Bbm

const POINTS = {
  diatonic: 1,
  tonicChord: 1,
  dominantSeventh: 1,
  outsideScale: -0.5,
  firstIsTonic: 2,
  lastIsTonic: 2,
  declared: 4,
}

/** Maior, menor ou diminuto: o tipo de tríade que importa para o campo harmônico. */
export function triadType(chord: Chord): TriadType | null {
  switch (chord.quality) {
    case 'maior':
    case 'sus2':
    case 'sus4':
      return 'maior' // suspensos fazem o papel do acorde maior (Asus4 resolve em A)
    case 'menor':
      return 'menor'
    case 'diminuto':
    case 'meio-diminuto':
      return 'diminuto'
    case 'aumentado':
      return null
  }
}

/** Distância, em semitons, da tônica do tom até a fundamental do acorde. */
function degreeOf(chord: Chord, tonic: number): number {
  return mod12(pitchClass(chord.root) - tonic)
}

function isTonicChord(chord: Chord, tonic: number, mode: Mode): boolean {
  return degreeOf(chord, tonic) === 0 && triadType(chord) === mode
}

function scoreKey(chords: Chord[], tonic: number, mode: Mode, hint?: Key): number {
  const field = mode === 'maior' ? MAJOR_FIELD : MINOR_FIELD
  const scale = mode === 'maior' ? MAJOR_SCALE : MINOR_SCALE
  let score = 0

  for (const chord of chords) {
    const degree = degreeOf(chord, tonic)
    const type = triadType(chord)
    if (field.some((d) => d.interval === degree && d.type === type)) {
      score += POINTS.diatonic
    } else if (!scale.includes(degree)) {
      score += POINTS.outsideScale
    }
    if (isTonicChord(chord, tonic, mode)) score += POINTS.tonicChord
    if (degree === 7 && type === 'maior' && chord.seventh === '7') {
      score += POINTS.dominantSeventh
    }
  }

  if (isTonicChord(chords[0], tonic, mode)) score += POINTS.firstIsTonic
  if (isTonicChord(chords[chords.length - 1], tonic, mode)) score += POINTS.lastIsTonic
  if (hint && hint.mode === mode && pitchClass(hint.tonic) === tonic) {
    score += POINTS.declared
  }
  return score
}

/** Escolhe como escrever a tônica: como aparece na cifra, ou a grafia usual do tom. */
function spellTonic(tonic: number, mode: Mode, chords: Chord[], hint?: Key): Note {
  if (hint && pitchClass(hint.tonic) === tonic) return hint.tonic
  const seen = chords.find((c) => pitchClass(c.root) === tonic)
  if (seen) return seen.root
  return defaultTonic(tonic, mode)
}

/** Grafia usual da tônica de um tom: Bb maior (não A#), F# menor (não Gb). */
export function defaultTonic(tonic: number, mode: Mode): Note {
  const flats = mode === 'maior' ? MAJOR_TONIC_PREFERS_FLAT : MINOR_TONIC_PREFERS_FLAT
  return noteFromPitchClass(tonic, flats.has(mod12(tonic)) ? 'flat' : 'sharp')
}

/**
 * Dá nota para as 24 tonalidades e devolve todas, da mais provável para a menos.
 * Em caso de empate, maior vem antes de menor.
 */
export function detectKey(chords: Chord[], options: { hint?: Key } = {}): KeyGuess[] {
  if (chords.length === 0) return []
  const guesses: KeyGuess[] = []
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const mode of ['maior', 'menor'] as const) {
      guesses.push({
        key: { tonic: spellTonic(tonic, mode, chords, options.hint), mode },
        score: scoreKey(chords, tonic, mode, options.hint),
      })
    }
  }
  // `sort` é estável: no empate fica a ordem de criação (Dó maior, Dó menor, Dó# maior...).
  guesses.sort((a, b) => b.score - a.score)

  // O tom escrito na cifra foi escolhido por quem tirou a música. Se ele estiver perto
  // do primeiro colocado, ele vence: a diferença costuma ser só a dúvida entre relativos.
  const hint = options.hint
  if (hint) {
    const index = guesses.findIndex(
      (g) =>
        g.key.mode === hint.mode && pitchClass(g.key.tonic) === pitchClass(hint.tonic),
    )
    if (index > 0 && guesses[index].score >= guesses[0].score * DECLARED_KEY_MARGIN) {
      guesses.unshift(...guesses.splice(index, 1))
    }
  }
  return guesses
}

/** O tom escrito vence se tiver pelo menos esta fração da pontuação do primeiro. */
const DECLARED_KEY_MARGIN = 0.85

/** O tom da música inteira, usando todos os acordes e o "Tom:" escrito, se houver. */
export function detectSongKey(song: Song): KeyGuess[] {
  return detectKey(song.sections.flatMap(sectionChords), { hint: song.declaredKey })
}

const SOLFEGE: Record<Note['letter'], string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
}

/** "Sol maior", "Fá sustenido menor", "Si bemol maior". */
export function keyName(key: Key): string {
  const accidental =
    key.tonic.accidental === '#'
      ? ' sustenido'
      : key.tonic.accidental === 'b'
        ? ' bemol'
        : ''
  return `${SOLFEGE[key.tonic.letter]}${accidental} ${key.mode}`
}

/** "G", "Em", "Bb": o tom escrito como cifra. */
export function keySymbol(key: Key): string {
  return noteName(key.tonic) + (key.mode === 'menor' ? 'm' : '')
}
