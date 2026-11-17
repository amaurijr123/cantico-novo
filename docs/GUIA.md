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
tom certo e quais seções existem. O `parse.ts` é testado contra as seções e o
`key.ts` contra o tom de cada uma.

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

### `src/core/key.ts`

Descobre o tom pelos acordes. Em vez de escolher um tom só, `detectKey` dá pontos
para as 24 tonalidades (12 maiores e 12 menores) e devolve todas em ordem. A tela
mostra a primeira e deixa você trocar, porque às vezes a dúvida é real: Sol maior e
Mi menor usam exatamente os mesmos acordes.

Os pontos, para cada acorde da música:

| Situação                         | Pontos | Exemplo em Sol maior |
| -------------------------------- | ------ | -------------------- |
| Pertence ao campo harmônico      | +1     | `Am` é o ii          |
| É o acorde do tom                | +1     | cada `G`             |
| É dominante com sétima no V grau | +1     | `D7`                 |
| A fundamental nem está na escala | −0,5   | `G#°`, `Bb`          |

E para a música inteira: +2 se começa no acorde do tom, +2 se termina nele e +4 se
o tom é o mesmo escrito na cifra (`Tom: G`).

O campo harmônico menor inclui o V maior da escala menor harmônica. É ele que
desempata relativos: em `Em C G D B7 Em`, o `B7` só pertence a Mi menor.

Acordes suspensos contam como maiores, porque fazem o mesmo papel (`Asus4` resolve
em `A`). Em acorde invertido vale a fundamental, não o baixo: `F/G` é IV em Dó.

`detectSongKey(musica)` junta todos os acordes da música e usa o `Tom:` como pista.
`keyName` escreve "Si bemol maior" e `keySymbol` escreve "Bb".

### `src/core/transpose.ts`

Sobe ou desce a música alguns semitons. A conta das alturas é só somar, mas a
**grafia** precisa de cuidado: a transposição anda com as letras junto. De Sol para
Lá sobe uma letra, então `D/F#` vira `E/G#`. Isso mantém a função de cada acorde:

| Acorde | Função | De  | Para | Vira           |
| ------ | ------ | --- | ---- | -------------- |
| `Bb`   | bVII   | Dó  | Ré   | `C` (não `B#`) |
| `G#°`  | #i°    | Sol | Sib  | `B°`           |
| `B7`   | V7/vi  | Sol | Fá   | `A7`           |

Quando andar com as letras daria dobrado sustenido ou dobrado bemol (`C##`), o app
usa a nota equivalente, escrita com # ou b conforme a armadura do tom novo.

- `transposeKey(tom, semitons)` dá o tom novo com a grafia usual (Bb maior, F# menor).
- `transposeChord(acorde, de, para)` leva um acorde de um tom para outro.
- `transposeSong(musica, tom, semitons)` devolve uma música nova e o tom novo. A
  original não muda, e a letra e as colunas ficam iguais.

### `src/core/roman.ts`

Escreve cada acorde pelo grau dele no tom. Maiúscula é acorde maior; minúscula é
menor ou diminuto.

| Em Sol maior        | Grau                | O que quer dizer                                |
| ------------------- | ------------------- | ----------------------------------------------- |
| `G`, `Em`, `C`      | `I`, `vi`, `IV`     | Campo harmônico                                 |
| `Am7`, `D7`, `G7M`  | `ii7`, `V7`, `I7M`  | Com a sétima. Tensões como 9 e 13 ficam de fora |
| `F#m7(b5)`, `D(#5)` | `viiø`, `V+`        | Meio-diminuto e aumentado                       |
| `Cm`, `F`, `Eb`     | `iv`, `bVII`, `bVI` | Emprestados do tom menor                        |
| `G#°`, `C#°`        | `#i°`, `#iv°`       | Diminutos de passagem                           |
| `D/F#`, `G/D`       | `V/3`, `I/5`        | O número diz qual nota do acorde está no baixo  |

`romanNumeral(acorde, tom)` olha o acorde sozinho. `romanNumerals(acordes, tom)`
olha também o acorde seguinte, e assim reconhece duas coisas:

- **Dominante secundário**: um acorde maior que resolve uma quarta acima, num grau
  que não é o I. Em `G B7 Em`, o `B7` é `V7/vi`.
- **ii–V para outro grau**: o acorde menor logo antes de um dominante secundário.
  Em `G Dm7 G7 C`, fica `I ii7/IV V7/IV IV`.

O botão Cifra / Graus da tela vai usar `romanNumerals` em cada seção.

### `src/core/recipes/`

As 7 técnicas de rearmonização, uma por arquivo. Todas têm a mesma forma:

```ts
type Recipe = (trecho: Chord[], tom: Key) => Idea[]
```

Cada `Idea` traz os acordes de antes (`before`) e de depois (`after`), as posições
dos acordes novos (`highlight`, para a tela destacar), uma frase explicando o que
mudou (`explanation`) e uma pontuação (`score`).

| Receita                   | O que faz                                     | Exemplo em Sol        |
| ------------------------- | --------------------------------------------- | --------------------- |
| `dominante-secundario.ts` | Põe o V7 antes de um acorde que não é o I     | `G Em` → `G B7 Em`    |
| `ii-v.ts`                 | Põe o ii e o V antes de um acorde             | `G C` → `G Dm7 G7 C`  |
| `tritono.ts`              | Troca um dominante pelo que fica a um trítono | `D7 G` → `Ab7 G`      |
| `emprestimo-modal.ts`     | Usa acordes do tom homônimo (iv, bVII, bVI)   | `C G` → `C Cm G`      |
| `diminuto-passagem.ts`    | Liga dois acordes com um diminuto no meio     | `G Am` → `G G#° Am`   |
| `baixo-pedal.ts`          | Segura a tônica ou a quinta no baixo          | `C D G` → `C/G D/G G` |
| `tensoes.ts`              | Acrescenta sétima e nona conforme o grau      | `C` → `C7M(9)`        |

Algumas regras para as receitas não atrapalharem a música:

- Não insere o que já está lá: se o acorde de antes já é o V do alvo, o dominante
  secundário e o ii–V pulam aquele ponto. Um acorde com o V no baixo (`Bb/C` antes
  de `F`) também conta como V.
- O alvo menor ganha `iiø` e `V7(b9)` no ii–V, porque soa mais natural no menor.
- Nas tensões, o iii fica só com a sétima (a nona sairia da escala), e acordes que já
  têm sétima ficam como estão.
- Os acordes novos são escritos com a letra certa (`B7` em Sol, `Ab7` como
  substituto de `D7`), evitando grafias raras como `E#` e `Cb`.

**O seletor** ([index.ts](../src/core/recipes/index.ts)): `suggestIdeas(trecho, tom)`
roda as 7 receitas, fica com a melhor ideia de cada uma e devolve as 5 de maior
pontuação. Assim as 5 ideias são de técnicas diferentes. Se menos de 5 receitas
tiverem algo a sugerir, completa com a segunda melhor ideia de cada uma.

O arquivo `testing.ts` só tem atalhos para os testes, como `run(receita, 'G Em', 'G')`.

### A interface (`src/App.tsx` e `src/ui/`)

A tela só chama o `core`; nenhuma regra de música mora nos componentes.

| Arquivo             | O que faz                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ui/analysis.ts`    | Recebe o texto e as escolhas (tom, transposição, cifra ou graus) e devolve tudo pronto para desenhar. Testado sem navegador. |
| `ui/layout.ts`      | Monta a linha de acordes em cima da letra. Se um rótulo cresce (`G` vira `V7/vi`), empurra o próximo para não encostar.      |
| `ui/exemplo.ts`     | A cifra inventada que aparece quando o app abre.                                                                             |
| `ui/Toolbar.tsx`    | Tom da cifra (dá para trocar se o detectado estiver errado), transpor e Cifra / Graus.                                       |
| `ui/CifraView.tsx`  | A cifra inteira. Clicar numa seção escolhe o trecho para rearmonizar.                                                        |
| `ui/IdeasPanel.tsx` | As 5 ideias, com "antes" e "depois" e os acordes novos destacados. A ideia escolhida mostra a explicação.                    |
| `App.tsx`           | Guarda o estado da tela e liga os atalhos de teclado.                                                                        |

Atalhos: ↑ e ↓ trocam de ideia, ← e → trocam de seção, G alterna cifra e graus. Eles
não funcionam enquanto você digita no campo da cifra.

O `App.test.tsx` testa a tela de verdade num navegador simulado (jsdom): abrir com
o exemplo, trocar de seção, ver graus, transpor, usar as setas e colar outra cifra.

### Publicação

O `.github/workflows/deploy.yml` publica o app no GitHub Pages a cada push na `main`,
depois de rodar os testes. Para funcionar, o GitHub Pages precisa estar ligado no
repositório com a origem "GitHub Actions" (Settings → Pages → Source).

## 3. Próximo passo (semanas 11 a 14): som e link

A v1 está pronta. A v2 traz:

1. Tone.js com piano amostrado: ouvir o trecho original e a ideia escolhida.
2. `voicing.ts`: baixo na mão esquerda e acorde fechado na direita.
3. Teclado desenhado na tela acendendo as notas.
4. Entrada por link (com uma função serverless pequena).
