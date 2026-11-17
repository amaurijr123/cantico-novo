/**
 * Lê uma cifra colada como texto e devolve a música separada em seções.
 *
 * O formato esperado é o mais comum na internet: uma linha de acordes, com a linha
 * de letra logo embaixo, e as seções marcadas entre colchetes ([Intro], [Refrão]).
 */
import { parseChord } from './chord'
import type { Chord, CifraLine, Key, PlacedChord, Section, Song } from './types'

/** "[Refrão]" ou "[Intro] G D Em C". O que vem depois do colchete pode ser acordes. */
const HEADER_RE = /^\s*\[([^\]]+)\]\s*(.*)$/

/** "Tom: G" no topo da cifra. */
const KEY_RE = /^\s*tom\s*:\s*(\S+)\s*$/i

/** Linha de tablatura, como "E|---3---2---0---|". */
const TAB_RE = /^\s*[A-Ga-g][#b]?\s*\|[-0-9\s|hpbrx/\\~()]*$/

/** Enfeites que podem aparecer numa linha de acordes sem serem acordes: "|", "(2x)", "x2". */
const DECORATION_RE = /^(\|+|:?\|\|?:?|-+|\(?\d+x\)?|\(?x\d+\)?)$/i

/** Lê os acordes de uma linha com a coluna de cada um, ou `null` se não for linha de acordes. */
function readChordLine(line: string): PlacedChord[] | null {
  const placed: PlacedChord[] = []
  for (const match of line.matchAll(/\S+/g)) {
    const token = match[0]
    if (DECORATION_RE.test(token)) continue
    const chord = parseChord(token)
    if (!chord) return null // uma palavra que não é acorde já faz a linha ser de letra
    placed.push({ chord, column: match.index })
  }
  return placed.length > 0 ? placed : null
}

/** Diz se a linha só tem acordes (e enfeites como "|" e "(2x)"). */
export function isChordLine(line: string): boolean {
  return readChordLine(line) !== null
}

/** Todos os acordes de uma seção, em ordem, sem as posições. */
export function sectionChords(section: Section): Chord[] {
  return section.lines.flatMap((line) => line.chords.map((placed) => placed.chord))
}

/** Lê "G" ou "Em" como tonalidade. */
function readKey(text: string): Key | undefined {
  const chord = parseChord(text)
  if (!chord) return undefined
  return { tonic: chord.root, mode: chord.quality === 'menor' ? 'menor' : 'maior' }
}

/** Espaço de largura zero, separadores invisíveis e marca de ordem de bytes. */
const INVISIBLE = new RegExp(
  `[${[0x200b, 0x200c, 0x200d, 0x2060, 0xfeff].map((c) => String.fromCharCode(c)).join('')}]`,
  'g',
)
const NO_BREAK_SPACE = new RegExp(String.fromCharCode(0xa0), 'g')

/**
 * Limpa caracteres que os sites colocam no texto e que não aparecem na tela:
 * o Cifra Club, por exemplo, começa cada linha com um "espaço de largura zero"
 * (U+200B), que faria "[Refrão]" e "D  Bm7" deixarem de ser reconhecidos.
 * Espaço que não quebra linha (U+00A0) vira espaço comum.
 */
export function cleanText(text: string): string {
  return text.replace(INVISIBLE, '').replace(NO_BREAK_SPACE, ' ').replace(/\r\n?/g, '\n')
}

export function parseCifra(text: string): Song {
  const rawLines = cleanText(text).split('\n')
  const hasHeaders = rawLines.some((line) => HEADER_RE.test(line))

  const sections: Section[] = []
  const warnings: string[] = []
  let declaredKey: Key | undefined

  // Antes do primeiro colchete fica a seção "Início" (ou "Música", se não houver colchetes).
  let current: Section = { name: hasHeaders ? 'Início' : 'Música', lines: [] }
  let isPreamble = hasHeaders
  let tabLines = 0
  /** Linha de acordes esperando para ver se a próxima linha é a letra dela. */
  let pending: PlacedChord[] | null = null

  const flushPending = () => {
    if (pending) current.lines.push({ chords: pending })
    pending = null
  }

  const closeSection = () => {
    flushPending()
    if (tabLines > 0) {
      const plural = tabLines === 1 ? 'linha' : 'linhas'
      warnings.push(
        `Tablatura ignorada na seção "${current.name}" (${tabLines} ${plural}).`,
      )
    }
    // No preâmbulo, linhas sem acordes são título, autor etc. e ficam de fora.
    if (isPreamble) current.lines = current.lines.filter((line) => line.chords.length > 0)
    if (current.lines.length > 0) sections.push(current)
    tabLines = 0
  }

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd()

    const header = HEADER_RE.exec(line)
    if (header) {
      closeSection()
      current = { name: header[1].trim(), lines: [] }
      isPreamble = false
      const inlineChords = readChordLine(header[2])
      if (inlineChords) pending = inlineChords
      continue
    }

    const keyMatch = KEY_RE.exec(line)
    if (keyMatch) {
      declaredKey = readKey(keyMatch[1]) ?? declaredKey
      continue
    }

    if (line.trim() === '') {
      flushPending()
      continue
    }

    if (TAB_RE.test(line)) {
      flushPending()
      tabLines++
      continue
    }

    const chords = readChordLine(line)
    if (chords) {
      flushPending() // duas linhas de acordes seguidas: a primeira fica sem letra
      pending = chords
      continue
    }

    // Linha de letra: fica com os acordes de cima, se houver.
    const cifraLine: CifraLine = { chords: pending ?? [], lyric: line }
    pending = null
    current.lines.push(cifraLine)
  }
  closeSection()

  const song: Song = { sections, warnings }
  if (declaredKey) song.declaredKey = declaredKey
  return song
}
