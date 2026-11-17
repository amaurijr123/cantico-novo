/**
 * Ler e escrever acordes na notação brasileira (a mesma do Cifra Club).
 *
 * `parseChord` aceita várias formas de escrever o mesmo acorde (Cmaj7, C7+, C7M).
 * `chordName` sempre escreve de um jeito só, a "forma padrão" do app:
 *
 *   C  Cm  C7  C7M  Cm7  Cm7M  C6  C6(9)
 *   C°            diminuto (no Brasil, "°" já quer dizer a tétrade com sétima diminuta)
 *   Cm7(b5)       meio-diminuto
 *   C(#5)         aumentado
 *   Csus4  C7(4)  suspenso; com sétima, o 4 vai entre parênteses
 *   C2            nona adicionada no estilo louvor (fica como foi escrito)
 *   C(add9)       nona adicionada; C9 e C(9) viram isto, porque sem sétima o 9 é "add"
 *   C7(9,13)      tensões em ordem crescente, separadas por vírgula
 *   C7(b9,b13)    tensões alteradas; "C7(9-/13-)" também é lido assim
 *   C/E           baixo invertido
 */
import { noteName, parseNote } from './notes'
import type { Chord, ChordQuality } from './types'

/** Começo do sufixo que define a qualidade. `m(?!aj)` evita confundir com "maj7". */
const QUALITY_RE = /^(m(?!aj)|-|°|º|dim|ø|\+|aug)/

/**
 * Pedaços que podem aparecer depois da qualidade ou entre parênteses.
 * A ordem importa: as formas mais longas vêm antes ("7M" antes de "7", "b13" antes de "13").
 */
const TOKEN_RE =
  /^(7M|maj7|M7|7\+|7|6|sus4|sus2|sus|add9|add11|b13|13|#11|11|b9|#9|9|b5|#5|5\+|4|2)/

/** Ordem em que as tensões são escritas dentro dos parênteses. */
const EXTENSION_ORDER = [
  '4',
  'b5',
  '#5',
  'add9',
  'b9',
  '9',
  '#9',
  '11',
  '#11',
  'b13',
  '13',
]

const NOTE_RE = /^[A-G][#b]?$/

/**
 * Lê um acorde escrito, como "Bm7(b5)/F", e devolve `null` se o texto não for um acorde.
 * A fundamental precisa de letra maiúscula: "em" e "e" são palavras, não acordes.
 */
export function parseChord(text: string): Chord | null {
  const symbol = text.trim()
  const rootMatch = /^([A-G][#b]?)(.*)$/.exec(symbol)
  if (!rootMatch) return null
  const root = parseNote(rootMatch[1])!
  // "9-" e "13-" querem dizer b9 e b13; "11+" quer dizer #11 (jeito comum no Brasil).
  // Só vale para 5, 9, 11 e 13: "7+" continua sendo sétima maior.
  let rest = rootMatch[2].replace(
    /(^|[^\d])(5|9|11|13)([+-])/g,
    (_, before: string, degree: string, sign: string) =>
      `${before}${sign === '-' ? 'b' : '#'}${degree}`,
  )

  // 1. Tira o que está entre parênteses: "(9,13)" e "(9/13)" viram ["9", "13"].
  const tokens: string[] = []
  const parenTokens: string[] = []
  rest = rest.replace(/\(([^()]*)\)/g, (_, inner: string) => {
    parenTokens.push(...inner.split(/[,/]/).map((t) => t.trim()))
    return ''
  })
  if (/[()]/.test(rest)) return null // parêntese sem par

  // 2. Baixo invertido: "/F#". Se depois da barra vier número, é "6/9", não baixo.
  let bass: Chord['bass']
  const slash = rest.lastIndexOf('/')
  if (slash >= 0) {
    const after = rest.slice(slash + 1)
    rest = rest.slice(0, slash)
    if (NOTE_RE.test(after)) {
      bass = parseNote(after)!
    } else if (/^\d+$/.test(after)) {
      parenTokens.push(after)
    } else {
      return null
    }
    if (rest.includes('/')) {
      // Sobrou outra barra, como em "C6/9/E": a de dentro só pode ser "6/9".
      const inner = /^(.*)\/(\d+)$/.exec(rest)
      if (!inner) return null
      rest = inner[1]
      parenTokens.push(inner[2])
    }
  }

  // 3. Qualidade no começo do sufixo.
  const qualityMatch = QUALITY_RE.exec(rest)
  const qualityText = qualityMatch?.[1] ?? ''
  rest = rest.slice(qualityText.length)

  // 4. O resto do sufixo precisa ser só pedaços conhecidos.
  while (rest.length > 0) {
    const match = TOKEN_RE.exec(rest)
    if (!match) return null
    tokens.push(match[1])
    rest = rest.slice(match[1].length)
  }
  for (const token of parenTokens) {
    const match = TOKEN_RE.exec(token)
    if (!match || match[1] !== token) return null
    tokens.push(token)
  }

  return interpret(root, qualityText, tokens, bass, symbol)
}

/** Junta qualidade e pedaços num `Chord`, aplicando as convenções brasileiras. */
function interpret(
  root: Chord['root'],
  qualityText: string,
  tokens: string[],
  bass: Chord['bass'],
  symbol: string,
): Chord | null {
  let quality: ChordQuality = 'maior'
  if (qualityText === 'm' || qualityText === '-') quality = 'menor'
  else if (['°', 'º', 'dim'].includes(qualityText)) quality = 'diminuto'
  else if (qualityText === 'ø') quality = 'meio-diminuto'
  else if (qualityText === '+' || qualityText === 'aug') quality = 'aumentado'

  let seventh: Chord['seventh']
  const extensions = new Set<string>()

  const setSeventh = (value: NonNullable<Chord['seventh']>): boolean => {
    if (seventh !== undefined) return false // duas sétimas, como em "C77"
    seventh = value
    return true
  }

  for (const token of tokens) {
    switch (token) {
      case '7M':
      case 'maj7':
      case 'M7':
      case '7+':
        if (!setSeventh('7M')) return null
        break
      case '7':
        if (!setSeventh(quality === 'diminuto' ? '°7' : '7')) return null
        break
      case '6':
        if (!setSeventh('6')) return null
        break
      case 'sus':
      case 'sus4':
        quality = 'sus4'
        break
      case 'sus2':
        quality = 'sus2'
        break
      case '4':
        // "D4" é Dsus4. Num acorde menor, "Am4" é a 11ª adicionada.
        if (quality === 'maior' || quality === 'sus4') quality = 'sus4'
        else extensions.add('11')
        break
      case '#5':
      case '5+':
        quality = 'aumentado'
        break
      case 'add11':
        extensions.add('11')
        break
      default:
        extensions.add(token) // 2, add9, 9, b9, #9, 11, #11, 13, b13, b5
    }
  }

  // m7(b5) é meio-diminuto; m(b5) sem sétima é diminuto.
  if (quality === 'menor' && extensions.has('b5')) {
    extensions.delete('b5')
    quality = seventh === '7' ? 'meio-diminuto' : 'diminuto'
  }

  // Diminuto e meio-diminuto sempre têm sétima.
  if (quality === 'diminuto') {
    if (seventh !== undefined && seventh !== '°7') return null
    seventh = '°7'
  }
  if (quality === 'meio-diminuto') {
    if (seventh !== undefined && seventh !== '7') return null
    seventh = '7'
  }

  // Sem sétima (ou sexta), o 9 é nona adicionada. Com sétima, "add9" é só 9.
  if (seventh === undefined && extensions.delete('9')) extensions.add('add9')
  if (seventh !== undefined && extensions.delete('add9')) extensions.add('9')

  const ordered = [...extensions].sort(
    (a, b) => EXTENSION_ORDER.indexOf(a) - EXTENSION_ORDER.indexOf(b),
  )

  const chord: Chord = { root, quality, extensions: ordered, symbol }
  if (seventh !== undefined) chord.seventh = seventh
  if (bass !== undefined) chord.bass = bass
  return chord
}

/** Escreve o acorde na forma padrão do app. */
export function chordName(chord: Chord): string {
  let text = noteName(chord.root)
  const paren: string[] = []

  switch (chord.quality) {
    case 'menor':
      text += 'm'
      break
    case 'meio-diminuto':
      text += 'm'
      paren.push('b5')
      break
    case 'diminuto':
      text += '°'
      break
    case 'aumentado':
      paren.push('#5')
      break
  }

  if (chord.seventh !== undefined && chord.seventh !== '°7') text += chord.seventh

  if (chord.quality === 'sus4') {
    if (chord.seventh !== undefined) paren.push('4')
    else text += 'sus4'
  }
  if (chord.quality === 'sus2') text += 'sus2'

  for (const extension of chord.extensions) {
    if (extension === '2') text += '2'
    else paren.push(extension)
  }

  if (paren.length > 0) {
    paren.sort((a, b) => EXTENSION_ORDER.indexOf(a) - EXTENSION_ORDER.indexOf(b))
    text += `(${paren.join(',')})`
  }

  if (chord.bass !== undefined) text += '/' + noteName(chord.bass)
  return text
}
