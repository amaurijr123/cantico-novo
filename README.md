# reharm

> Nome provisório.

Cole uma cifra, escolha um trecho da música e receba **5 ideias de rearmonização**:
dominante secundário, ii–V, substituição de trítono, empréstimo modal, diminuto de
passagem, baixo pedal e acordes com tensões.

A teoria musical é toda feita em código, com regras fixas e testes. IA só entra mais
tarde, para escolher e explicar as ideias.

## Status

| Fase        | O que entrega                                     | Situação |
| ----------- | ------------------------------------------------- | -------- |
| Fundação    | Projeto, testes, CI, fixtures                     | ✅       |
| Ler a cifra | Acordes, seções, tom, graus romanos, transposição | ⏳       |
| Receitas    | As 7 técnicas e a escolha das 5 ideias            |          |
| v1          | Interface: colar, escolher seção, ver ideias      |          |
| v2          | Ouvir no piano, teclado na tela, entrada por link |          |

## Rodando na sua máquina

Precisa do Node 22 ou mais novo.

```bash
npm install
npm run dev        # abre o app em http://localhost:5173/reharm/
npm test           # roda os testes uma vez
npm run test:watch # roda os testes a cada arquivo salvo
npm run check      # tudo o que o CI confere: lint, formatação, tipos, build e testes
```

## Estrutura

```
src/
  core/        teoria musical pura (sem React), toda testada
    types.ts   os tipos: Note, Chord, Key, Section, Idea, Recipe
    notes.ts   notas e alturas: ler "F#", transpor, medir intervalos
  App.tsx      interface (provisória)
tests/
  fixtures/    8 cifras inventadas no estilo louvor, com o tom e as seções esperados
```

O passo a passo de cada arquivo está em [docs/GUIA.md](docs/GUIA.md).

## Direitos autorais

O app só lê e processa a cifra na sua máquina. Não salva nem republica cifras.
Os exemplos deste repositório são progressões e letras inventadas.

## Licença

[MIT](LICENSE)
