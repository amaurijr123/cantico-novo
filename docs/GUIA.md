# Guia do projeto

Este guia explica para que serve cada arquivo, na ordem em que vale a pena ler.

## 1. Os arquivos de configuração

| Arquivo                    | Para que serve                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`             | Lista as bibliotecas do projeto e os comandos (`npm run dev`, `npm test`...).                                                        |
| `package-lock.json`        | Trava a versão exata de cada biblioteca. Não se edita à mão.                                                                         |
| `vite.config.ts`           | Configura o Vite (servidor e build) e o Vitest (testes). O `base` é o caminho no GitHub Pages.                                       |
| `tsconfig.json`            | Ponto de entrada do TypeScript. Só aponta para os dois abaixo.                                                                       |
| `tsconfig.app.json`        | Regras do TypeScript para o código do app (`src/`) e os testes (`tests/`). `strict: true` deixa o compilador exigente, e isso é bom. |
| `tsconfig.node.json`       | Regras para o `vite.config.ts`, que roda no Node e não no navegador.                                                                 |
| `eslint.config.js`         | O ESLint aponta erros comuns no código.                                                                                              |
| `.prettierrc.json`         | O Prettier formata o código sozinho: sem ponto e vírgula, aspas simples.                                                             |
| `.gitattributes`           | Força quebras de linha no padrão Unix, para o Windows e o CI concordarem.                                                            |
| `.github/workflows/ci.yml` | A cada push, o GitHub roda lint, formatação, build e testes.                                                                         |
| `index.html`               | A página que o navegador abre. Ela só carrega o `src/main.tsx`.                                                                      |

## 2. O código

### `src/core/types.ts`

O dicionário do projeto. Antes de escrever qualquer lógica, ele diz o que é uma nota,
um acorde, um tom, uma seção e uma ideia. Pontos de TypeScript que aparecem aqui:

- **União de textos** (`'C' | 'D' | ...`): o compilador recusa `'H'` como nota.
- **`interface`**: o formato de um objeto. `Chord` tem `root`, `quality`, `extensions`...
- **Campo opcional** (`bass?: Note`): nem todo acorde tem baixo invertido.
- **Tipo de função** (`Recipe`): toda receita recebe `(trecho, tom)` e devolve `Idea[]`.

### `src/core/notes.ts`

A primeira peça de teoria. A ideia central é a **altura** (`PitchClass`): Dó é 0,
Dó# é 1, até Si, que é 11. Com números, transpor é somar, e um intervalo é uma
subtração. O `mod12` faz a conta "dar a volta" depois do Si.

`F#` e `Gb` têm a mesma altura (6), mas são escritas diferentes. Por isso
`noteFromPitchClass` pergunta se você prefere sustenido ou bemol: em Sib maior o
certo é `Eb`, não `D#`.

### `src/core/notes.test.ts`

Cada `it(...)` é um exemplo que precisa continuar funcionando. Rode
`npm run test:watch`, mude um número no `notes.ts` e veja o teste quebrar. Esse é o
jeito mais rápido de entender o que cada função faz.

### `tests/fixtures/`

Oito cifras inventadas no estilo louvor. O `index.ts` diz, para cada uma, qual é o
tom certo e quais seções existem. Hoje o teste só confere as seções com uma busca
simples. Quando `parse.ts` e `key.ts` existirem, eles vão ser testados contra essas
mesmas respostas.

### `src/App.tsx` e `src/main.tsx`

`main.tsx` liga o React à página. `App.tsx` é a tela, por enquanto só um aviso de
"em construção" que usa o `core` para escrever a escala de Sol.

## 3. Próximo passo (semanas 3 a 5)

1. `chord.ts`: transformar texto como `Bm7(b5)/F` em um `Chord`, e o caminho de volta.
2. `parse.ts`: separar linha de acorde de linha de letra e montar as `Section`s.
3. `key.ts`: dar uma nota para cada uma das 24 tonalidades e escolher a melhor.
4. `transpose.ts` e `roman.ts`: transpor e escrever em graus romanos.

Comece sempre pelo teste: escreva o exemplo que você quer que funcione, veja ele
falhar e só então escreva a função.
