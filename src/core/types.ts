/**
 * Tipos centrais do app. Tudo em `core/` é teoria musical pura:
 * sem React, sem navegador, só dados entrando e saindo de funções.
 */

/** As sete letras das notas, na notação usada nas cifras. */
export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

/** Sustenido, bemol ou nenhum dos dois. */
export type Accidental = '' | '#' | 'b'

/** Uma nota escrita, como "F#" ou "Bb". F# e Gb são notas diferentes aqui. */
export interface Note {
  letter: NoteLetter
  accidental: Accidental
}

/**
 * Altura sem oitava, de 0 (Dó) a 11 (Si). F# e Gb têm a mesma altura (6).
 * É o que usamos para fazer contas: transpor, medir intervalos, comparar acordes.
 */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** A "cara" básica do acorde, antes de sétimas e tensões. */
export type ChordQuality =
  | 'maior'
  | 'menor'
  | 'diminuto'
  | 'meio-diminuto'
  | 'aumentado'
  | 'sus2'
  | 'sus4'

/** Um acorde já entendido, por exemplo "Bm7(b5)/F" ou "C7M(9)". */
export interface Chord {
  root: Note
  quality: ChordQuality
  /** Sétima ou sexta: "7" (menor), "7M" (maior), "6" ou "°7" (diminuta). */
  seventh?: '7' | '7M' | '6' | '°7'
  /** Tensões e adições, como "9", "11", "b13", "add9". */
  extensions: string[]
  /** Baixo diferente da fundamental, como o "F#" de "D/F#". */
  bass?: Note
  /** Como o acorde estava escrito na cifra original. */
  symbol: string
}

export type Mode = 'maior' | 'menor'

/** Uma tonalidade, como Sol maior ou Mi menor. */
export interface Key {
  tonic: Note
  mode: Mode
}

/** Um acorde e a posição (coluna) dele sobre a linha de letra. */
export interface PlacedChord {
  chord: Chord
  column: number
}

/** Um par "linha de acordes" + "linha de letra". A letra pode faltar (ex.: intro). */
export interface CifraLine {
  chords: PlacedChord[]
  lyric?: string
}

/** Um bloco da música: Intro, Verso, Refrão, Ponte... */
export interface Section {
  name: string
  lines: CifraLine[]
}

/** A cifra inteira depois de lida. */
export interface Song {
  sections: Section[]
  /** Tom escrito no topo da cifra ("Tom: G"), quando existe. Serve de pista para o key.ts. */
  declaredKey?: Key
  /** Coisas que o leitor ignorou de propósito, como tablaturas, para mostrar ao usuário. */
  warnings: string[]
}

/** Identificador de cada técnica de rearmonização. */
export type RecipeId =
  | 'dominante-secundario'
  | 'ii-v'
  | 'tritono'
  | 'emprestimo-modal'
  | 'diminuto-passagem'
  | 'baixo-pedal'
  | 'tensoes'

/** Uma sugestão de rearmonização para um trecho. */
export interface Idea {
  recipe: RecipeId
  before: Chord[]
  after: Chord[]
  /** Posições, em `after`, dos acordes novos ou mudados. A tela destaca esses. */
  highlight: number[]
  /** Frase curta, em linguagem simples, explicando o que mudou. */
  explanation: string
  /** O quanto a ideia costuma soar bem nesse lugar. O seletor usa para escolher as 5. */
  score: number
}

/** Toda receita tem esta forma: recebe o trecho e o tom, devolve zero ou mais ideias. */
export type Recipe = (trecho: Chord[], tom: Key) => Idea[]
