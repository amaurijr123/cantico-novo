# Cântico Novo

Cole uma cifra, escolha um trecho da música e receba **5 ideias de rearmonização**:
dominante secundário, ii–V, substituição de trítono, empréstimo modal, diminuto de
passagem, baixo pedal e acordes com tensões.

A teoria musical é toda feita em código, com regras fixas e testes. IA só entra mais
tarde, para escolher e explicar as ideias.

**Usar agora:** https://amaurijr123.github.io/cantico-novo/

No computador, ↑ e ↓ trocam de ideia, ← e → trocam de seção e G alterna entre
cifra e graus romanos.

Para trazer uma cifra do Cifra Club, clique em **Trazer do Cifra Club** no app e
arraste o favorito para a barra do navegador. Depois é só abrir a cifra no site e
clicar nele.

## Status

| Fase        | O que entrega                                     | Situação |
| ----------- | ------------------------------------------------- | -------- |
| Fundação    | Projeto, testes, CI, fixtures                     | ✅       |
| Ler a cifra | Acordes, seções, tom, graus romanos, transposição | ✅       |
| Receitas    | As 7 técnicas e a escolha das 5 ideias            | ✅       |
| v1          | Interface: colar, escolher seção, ver ideias      | ✅       |
| v2          | Ouvir no piano, teclado na tela, entrada por link | ⏳       |

## Rodando na sua máquina

Precisa do Node 22 ou mais novo.

```bash
npm install
npm run dev        # abre o app em http://localhost:5173/cantico-novo/
npm test           # roda os testes uma vez
npm run test:watch # roda os testes a cada arquivo salvo
npm run check      # tudo o que o CI confere: lint, formatação, tipos, build e testes
```

## Estrutura

```
src/
  core/           teoria musical pura (sem React), toda testada
    types.ts      os tipos: Note, Chord, Key, Section, Idea, Recipe
    notes.ts      notas e alturas: ler "F#", transpor, medir intervalos
    chord.ts      acordes na notação brasileira: ler "Bm7(b5)/F" e escrever de volta
    parse.ts      a cifra inteira: separa acordes da letra e monta as seções
    key.ts        o tom: pontua as 24 tonalidades pelos acordes
    transpose.ts  subir e descer o tom, mantendo a grafia certa (Bb, não A#)
    roman.ts      graus romanos: I V/3 vi IV, V7/vi, ii7/IV
    voicing.ts    em que notas tocar no teclado, com condução de vozes
    recipes/      as 7 técnicas de rearmonização e o seletor das 5 ideias
  ui/             componentes da tela: cifra, ideias, tom e transposição
  App.tsx         a tela principal e os atalhos de teclado
tests/
  fixtures/       8 cifras inventadas no estilo louvor, com o tom e as seções esperados
```

O passo a passo de cada arquivo está em [docs/GUIA.md](docs/GUIA.md).

## Direitos autorais

O app só lê e processa a cifra na sua máquina. Não salva nem republica cifras.
Os exemplos deste repositório são progressões e letras inventadas.

## Licença

[MIT](LICENSE)
