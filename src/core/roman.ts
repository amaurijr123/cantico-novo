/**
 * Graus romanos: escrever cada acorde pela função dele no tom.
 *
 * Em Sol maior, `G D/F# Em C` vira `I V/3 vi IV`. Maiúscula é acorde maior,
 * minúscula é menor ou diminuto. Assim a mesma progressão se escreve igual em
 * qualquer tom, e dá para ver o "esqueleto" da música.
 *
 *   vi, ii7, I7M, V7      grau e sétima (as tensões, como 9 e 13, ficam de fora)
 *   vii°, viiø, V+        diminuto, meio-diminuto, aumentado
 *   bVII, bIII, iv        acordes emprestados do tom menor
 *   #iv°, #i°             diminutos de passagem
 *   V/3, I/5, V/7         baixo invertido: o número diz qual nota do acorde está no baixo
 *   V7/vi, ii7/IV         dominante secundário e ii–V que preparam outro grau
 */
import { mod12, pitchClass } from './notes'
import type { Chord, Key } from './types'

/** Nome do grau, em maiúsculas, para cada distância da tônica que pertence à escala. */
const MAJOR_DEGREES: Record<number, string> = {
  0: 'I',
  2: 'II',
  4: 'III',
  5: 'IV',
  7: 'V',
  9: 'VI',
  11: 'VII',
}
const MINOR_DEGREES: Record<number, string> = {
  0: 'I',
  2: 'II',
  3: 'III',
  5: 'IV',
  7: 'V',
  8: 'VI',
  10: 'VII',
}

/**
 * Graus fora da escala: [nome se for diminuto, nome nos outros casos].
 * Diminutos de passagem sobem (#iv°), empréstimos descem (bVII).
 */
const MAJOR_CHROMATIC: Record<number, [string, string]> = {
  1: ['#I', 'bII'],
  3: ['#II', 'bIII'],
  6: ['#IV', 'bV'],
  8: ['#V', 'bVI'],
  10: ['#VI', 'bVII'],
}
const MINOR_CHROMATIC: Record<number, [string, string]> = {
  1: ['#I', 'bII'],
  4: ['#III', '#III'],
  6: ['#IV', 'bV'],
  9: ['#VI', '#VI'],
  11: ['VII', '#VII'], // o vii° da menor harmônica se escreve sem o #
}

/** Qual nota do acorde está no baixo, pela distância até a fundamental. */
function bassLabel(chord: Chord, interval: number): string {
  switch (interval) {
    case 1:
      return 'b9'
    case 2:
      return '9'
    case 3:
    case 4:
      return '3'
    case 5:
      return '4'
    case 6:
      return chord.quality === 'diminuto' || chord.quality === 'meio-diminuto'
        ? '5'
        : '#4'
    case 7:
      return '5'
    case 8:
      return chord.quality === 'aumentado' ? '5' : 'b6'
    case 9:
      return chord.seventh === '°7' ? '7' : '6'
    default:
      return '7' // 10 e 11
  }
}

function isLowerCase(chord: Chord): boolean {
  return ['menor', 'diminuto', 'meio-diminuto'].includes(chord.quality)
}

function degreeOf(chord: Chord, key: Key): number {
  return mod12(pitchClass(chord.root) - pitchClass(key.tonic))
}

/** Só o grau, com maiúscula ou minúscula: "vi", "bVII", "#iv". */
function baseNumeral(chord: Chord, key: Key): string {
  const degree = degreeOf(chord, key)
  const scale = key.mode === 'maior' ? MAJOR_DEGREES : MINOR_DEGREES
  const chromatic = key.mode === 'maior' ? MAJOR_CHROMATIC : MINOR_CHROMATIC
  const isDim = chord.quality === 'diminuto' || chord.quality === 'meio-diminuto'
  const name = scale[degree] ?? chromatic[degree][isDim ? 0 : 1]
  return isLowerCase(chord) ? name.toLowerCase() : name
}

/** O que vem depois do grau: °, ø, +, sétima e suspensão. */
function suffix(chord: Chord): string {
  let text = ''
  if (chord.quality === 'diminuto') text += '°'
  if (chord.quality === 'meio-diminuto') text += 'ø'
  if (chord.quality === 'aumentado') text += '+'
  if (chord.seventh && chord.seventh !== '°7' && chord.quality !== 'meio-diminuto') {
    text += chord.seventh
  }
  if (chord.quality === 'sus4') text += chord.seventh ? '(4)' : 'sus4'
  if (chord.quality === 'sus2') text += 'sus2'
  return text
}

function inversion(chord: Chord): string {
  if (!chord.bass) return ''
  return '/' + bassLabel(chord, mod12(pitchClass(chord.bass) - pitchClass(chord.root)))
}

/** O grau de um acorde sozinho, sem olhar para os vizinhos. */
export function romanNumeral(chord: Chord, key: Key): string {
  return baseNumeral(chord, key) + suffix(chord) + inversion(chord)
}

/** O acorde maior que está no campo harmônico do tom, nesse grau? */
function isDiatonicMajor(chord: Chord, key: Key): boolean {
  const degree = degreeOf(chord, key)
  const majors = key.mode === 'maior' ? [0, 5, 7] : [3, 7, 8, 10]
  return majors.includes(degree)
}

/** Acorde com cara de dominante: maior com sétima, ou maior que não é do campo. */
function looksDominant(chord: Chord, key: Key): boolean {
  if (chord.quality !== 'maior') return false
  return chord.seventh === '7' || !isDiatonicMajor(chord, key)
}

/** `next` está uma quarta acima (ou quinta abaixo) de `chord`? É a resolução natural. */
function resolvesTo(chord: Chord, next: Chord): boolean {
  return mod12(pitchClass(next.root) - pitchClass(chord.root)) === 5
}

/**
 * Os graus de uma sequência de acordes, olhando o acorde seguinte para reconhecer
 * dominantes secundários (`V7/vi`) e o ii–V que leva a outro grau (`ii7/IV V7/IV`).
 */
export function romanNumerals(chords: Chord[], key: Key): string[] {
  const labels = chords.map((chord) => romanNumeral(chord, key))

  // 1. Dominantes secundários: preparam um acorde que não é o I.
  const secondaryTarget: (string | null)[] = chords.map((chord, i) => {
    const next = chords[i + 1]
    if (!next || !looksDominant(chord, key) || !resolvesTo(chord, next)) return null
    if (degreeOf(next, key) === 0) return null // V indo para o I é só V
    return baseNumeral(next, key)
  })
  secondaryTarget.forEach((target, i) => {
    if (target) labels[i] = 'V' + suffix(chords[i]) + '/' + target + inversion(chords[i])
  })

  // 2. O ii que vem antes de um dominante secundário: "ii7/IV" antes de "V7/IV".
  chords.forEach((chord, i) => {
    const target = secondaryTarget[i + 1]
    const isMinorLike = chord.quality === 'menor' || chord.quality === 'meio-diminuto'
    if (!target || !isMinorLike || !resolvesTo(chord, chords[i + 1])) return
    labels[i] = 'ii' + suffix(chord) + '/' + target + inversion(chord)
  })

  return labels
}
