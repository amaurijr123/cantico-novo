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

### `src/core/chord.ts`

Transforma texto como `Bm7(b5)/F` em um `Chord` (`parseChord`) e faz o caminho de
volta (`chordName`). Ele aceita várias formas de escrever o mesmo acorde, mas sempre
escreve de um jeito só, a forma padrão do app:

| Você cola              | O app escreve | Por quê                                                        |
| ---------------------- | ------------- | -------------------------------------------------------------- |
| `Cmaj7`, `C7+`, `CM7`  | `C7M`         | Notação brasileira para sétima maior.                          |
| `C°7`, `Cdim`, `Cº`    | `C°`          | No Brasil, `°` já quer dizer o diminuto com sétima.            |
| `Bm7b5`, `Bø`          | `Bm7(b5)`     | Meio-diminuto.                                                 |
| `C+`, `C5+`, `Caug`    | `C(#5)`       | Aumentado.                                                     |
| `D4`, `Dsus`           | `Dsus4`       | Suspenso. Com sétima vira `D7(4)`.                             |
| `C9`, `C(9)`, `Cadd9`  | `C(add9)`     | Sem sétima, a nona é adicionada.                               |
| `A2`                   | `A2`          | Forma do louvor para a nona adicionada; fica como foi escrita. |
| `C7(13,9)`, `C7(9/13)` | `C7(9,13)`    | Tensões em ordem crescente, com vírgula.                       |
| `C6/9`                 | `C6(9)`       | A barra seguida de número não é baixo.                         |

Como funciona, em quatro passos:

1. Separa a fundamental (`B`, `F#`, `Bb`). Precisa ser maiúscula, porque "em" e "e"
   são palavras da letra.
2. Tira o que está entre parênteses e o baixo depois da barra.
3. Lê a qualidade no começo do sufixo (`m`, `°`, `ø`, `+`).
4. Lê o resto em pedaços conhecidos (`7M`, `7`, `sus4`, `9`, `b13`...). Se sobrar
   qualquer coisa estranha, não é acorde e a função devolve `null`.

O teste [chord.test.ts](../src/core/chord.test.ts) lista cada regra como exemplo e
confere que todos os acordes das 8 cifras de exemplo são lidos e reescritos iguais.

Limitações conhecidas: acordes de quinta, como `E5`, ainda não são reconhecidos. E
`G13`, que no jazz quer dizer `G7(9,13)`, é lido como `G(13)`, sem a sétima, porque
segue a mesma regra do `C9`.

### `src/core/parse.ts`

Lê a cifra inteira colada (`parseCifra`) e devolve uma `Song`: as seções, cada uma
com suas linhas, e cada linha com os acordes (e a coluna onde estavam) e a letra.

A regra principal é simples: **uma linha é de acordes quando todas as palavras dela
são acordes**. Basta uma palavra que não seja acorde para a linha ser de letra. Por
isso "E a luz já vem" é letra (o "a" não é acorde), mesmo começando com `E`.

Linha por linha, o leitor decide:

| A linha é... | O que acontece                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `[Refrão]`   | Fecha a seção anterior e abre uma nova. Acordes na mesma linha, como `[Intro] G D Em C`, entram na seção. |
| `Tom: G`     | Vira o `declaredKey` da música, uma pista para o `key.ts`.                                                |
| Acordes      | Ficam esperando a próxima linha. Se for letra, os dois viram um par.                                      |
| Letra        | Junta com os acordes que estavam esperando, ou fica sem acordes.                                          |
| Em branco    | A linha de acordes que estava esperando entra sozinha (é o caso da intro).                                |
| Tablatura    | É ignorada e vira um aviso em `warnings`.                                                                 |

Enfeites como `|`, `(2x)` e `x2` são aceitos numa linha de acordes e descartados.
Antes do primeiro colchete ficam título, autor e "Tom:"; só os acordes que aparecem
ali são guardados, numa seção "Início". Se a cifra não tiver nenhum colchete, tudo
vira uma seção só, chamada "Música". Seções que ficam vazias são descartadas.

`sectionChords(secao)` devolve só os acordes de uma seção, em ordem. É isso que as
receitas vão receber.

## 3. Próximo passo (semanas 3 a 5)

1. ~~`chord.ts`: transformar texto como `Bm7(b5)/F` em um `Chord`, e o caminho de volta.~~
2. ~~`parse.ts`: separar linha de acorde de linha de letra e montar as `Section`s.~~
3. `key.ts`: dar uma nota para cada uma das 24 tonalidades e escolher a melhor.
4. `transpose.ts` e `roman.ts`: transpor e escrever em graus romanos.

Comece sempre pelo teste: escreva o exemplo que você quer que funcione, veja ele
falhar e só então escreva a função.
