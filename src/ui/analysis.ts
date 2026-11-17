/**
 * A ponte entre a tela e o `core`: recebe o texto colado e as escolhas da pessoa
 * (tom, transposição, modo de exibição) e devolve tudo pronto para desenhar.
 *
 * Fica fora dos componentes para poder ser testado sem navegador.
 */
import { chordName } from '../core/chord'
import { detectSongKey, type KeyGuess } from '../core/key'
import { pitchClass } from '../core/notes'
import { parseCifra, sectionChords } from '../core/parse'
import { romanNumerals } from '../core/roman'
import { transposeSong } from '../core/transpose'
import type { Chord, Key, Section, Song } from '../core/types'

export type ViewMode = 'cifra' | 'graus'

export interface Analysis {
  /** A música já transposta, do jeito que aparece na tela. */
  song: Song
  /** O tom em que a música está sendo mostrada (depois de transpor). */
  key: Key
  /** O tom original: o detectado ou o que a pessoa escolheu. */
  originalKey: Key
  /** Tons mais prováveis da cifra original, para a pessoa poder trocar. */
  keyOptions: KeyGuess[]
}

/** Quantos tons sugerir na lista de troca de tom. */
const KEY_OPTIONS = 6

function sameKey(a: Key, b: Key): boolean {
  return a.mode === b.mode && pitchClass(a.tonic) === pitchClass(b.tonic)
}

/**
 * Lê a cifra e aplica as escolhas. Devolve `null` se o texto não tiver nenhum acorde.
 * `chosenKey` só vale se estiver entre os tons possíveis da música.
 */
export function analyze(
  text: string,
  options: { chosenKey?: Key; semitones?: number } = {},
): Analysis | null {
  const parsed = parseCifra(text)
  const ranking = detectSongKey(parsed)
  if (ranking.length === 0) return null

  const chosen = options.chosenKey
  const originalKey =
    (chosen && ranking.find((g) => sameKey(g.key, chosen))?.key) ?? ranking[0].key
  const { song, key } = transposeSong(parsed, originalKey, options.semitones ?? 0)

  const keyOptions = ranking.slice(0, KEY_OPTIONS)
  if (!keyOptions.some((g) => sameKey(g.key, originalKey))) {
    keyOptions.push(ranking.find((g) => sameKey(g.key, originalKey))!)
  }
  return { song, key, originalKey, keyOptions }
}

/** Os rótulos de uma lista de acordes: o nome do acorde ou o grau romano. */
export function labelsFor(chords: Chord[], key: Key, mode: ViewMode): string[] {
  return mode === 'graus' ? romanNumerals(chords, key) : chords.map(chordName)
}

/**
 * Os rótulos de cada acorde de uma seção, linha por linha. Os graus são calculados
 * na seção inteira, para o dominante secundário enxergar o acorde da linha seguinte.
 */
export function sectionLabels(section: Section, key: Key, mode: ViewMode): string[][] {
  const flat = labelsFor(sectionChords(section), key, mode)
  let index = 0
  return section.lines.map((line) => line.chords.map(() => flat[index++]))
}
