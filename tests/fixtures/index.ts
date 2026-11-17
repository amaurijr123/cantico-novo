/**
 * Cifras de exemplo usadas nos testes.
 *
 * Todas são progressões e letras inventadas para este repositório, no estilo do
 * louvor contemporâneo (sus, add9, baixo invertido). Nenhuma música real é
 * copiada aqui, porque o projeto não guarda nem republica cifras.
 *
 * Cada arquivo .txt vem com a resposta certa: o tom e as seções que o leitor de
 * cifras deve encontrar. Assim, quando o `parse.ts` e o `key.ts` existirem,
 * os testes já sabem o que conferir.
 */
import type { Mode } from '../../src/core/types'

export interface Fixture {
  file: string
  text: string
  /** Tom esperado, escrito como na cifra: "G", "Bb", "Em". */
  key: { tonic: string; mode: Mode }
  sections: string[]
  /** O que esta cifra testa que as outras não testam. */
  covers: string
}

const EXPECTED: Omit<Fixture, 'text'>[] = [
  {
    file: '01-sol-basico.txt',
    key: { tonic: 'G', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'I V vi IV com baixo invertido simples (D/F#)',
  },
  {
    file: '02-re-sus.txt',
    key: { tonic: 'D', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'sus4 resolvendo, add9 entre parênteses',
  },
  {
    file: '03-mi-baixo-invertido.txt',
    key: { tonic: 'E', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'acordes "2" (A2), baixo com sustenido (B/D#)',
  },
  {
    file: '04-do-add9.txt',
    key: { tonic: 'C', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'tensões entre parênteses (F7M(9)), acorde sobre baixo do V (F/G)',
  },
  {
    file: '05-la-ponte.txt',
    key: { tonic: 'A', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão', 'Ponte'],
    covers: 'quatro seções, incluindo Ponte',
  },
  {
    file: '06-sib-bemois.txt',
    key: { tonic: 'Bb', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'tom com bemóis; o transpositor deve escrever Eb, não D#',
  },
  {
    file: '07-mi-menor.txt',
    key: { tonic: 'E', mode: 'menor' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'tom menor com os mesmos acordes de Sol maior; o B7 desempata',
  },
  {
    file: '08-fa-sus-baixo.txt',
    key: { tonic: 'F', mode: 'maior' },
    sections: ['Intro', 'Verso', 'Refrão'],
    covers: 'baixo pedal (Bb/F, C/Bb) e IV sobre V (Bb/C)',
  },
]

const files = import.meta.glob<string>('./*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const fixtures: Fixture[] = EXPECTED.map((expected) => {
  const text = files[`./${expected.file}`]
  if (text === undefined) throw new Error(`Fixture não encontrada: ${expected.file}`)
  return { ...expected, text }
})

/** Nomes de todos os arquivos .txt da pasta, para conferir se nenhum ficou sem resposta. */
export const fixtureFiles = Object.keys(files).map((path) => path.slice(2))
