/**
 * Empréstimo modal: usa um acorde do tom homônimo (Sol menor dentro de Sol maior, ou
 * o contrário) para mudar a cor sem mudar de tom.
 *
 * Em tom maior:
 *   C → G          vira   C → Cm → G     (depois do IV, o iv: ar melancólico)
 *   D → G (fim)    vira   F → G          (bVII–I no lugar de V–I, muito usado em louvor)
 *   Em             vira   Eb             (bVI no lugar do vi)
 *
 * Em tom menor:
 *   ... Em (fim)   vira   ... E          (terminar no I maior: terça de picardia)
 *   Am             vira   A              (IV maior no lugar do iv)
 */
import { keyName, triadType } from '../key'
import type { Idea, Recipe } from '../types'
import {
  above,
  build,
  degree,
  idea,
  insertBefore,
  isTonic,
  n,
  replaceAt,
} from './helpers'

export const emprestimoModal: Recipe = (trecho, tom) => {
  const ideas: Idea[] = []
  const homonym = keyName({
    tonic: tom.tonic,
    mode: tom.mode === 'maior' ? 'menor' : 'maior',
  })
  const last = trecho.length - 1

  trecho.forEach((chord, i) => {
    const d = degree(chord, tom)
    const kind = triadType(chord)

    if (tom.mode === 'maior') {
      // IV → iv
      if (d === 5 && kind === 'maior') {
        const next = trecho[i + 1]
        const iv = build(chord.root, 'menor')
        if (next && degree(next, tom) === 5 && triadType(next) === 'menor') return
        ideas.push(
          idea(
            'emprestimo-modal',
            trecho,
            insertBefore(trecho, i + 1, iv),
            3,
            `${n(iv)} é o iv emprestado de ${homonym}. Logo depois do ${n(chord)}, ele dá um ar melancólico antes de seguir.`,
          ),
        )
      }
      // V → I no fim vira bVII → I
      if (d === 7 && kind === 'maior' && i === last - 1 && isTonic(trecho[last], tom)) {
        const bVII = build(above(tom.tonic, 6, 10), 'maior')
        ideas.push(
          idea(
            'emprestimo-modal',
            trecho,
            replaceAt(trecho, i, 1, bVII),
            2.5,
            `${n(bVII)} (bVII) vem de ${homonym} e chega no ${n(trecho[last])} por um caminho mais suave que o ${n(chord)}. Essa cadência é muito comum no louvor.`,
          ),
        )
      }
      // vi → bVI
      if (d === 9 && kind === 'menor') {
        const bVI = build(above(tom.tonic, 5, 8), 'maior')
        ideas.push(
          idea(
            'emprestimo-modal',
            trecho,
            replaceAt(trecho, i, 1, bVI),
            2,
            `${n(bVI)} (bVI) vem de ${homonym} e entra no lugar do ${n(chord)}: mesma posição, cor bem mais dramática.`,
          ),
        )
      }
    } else {
      // i no fim vira I (terça de picardia)
      if (i === last && isTonic(chord, tom)) {
        const I = build(chord.root, 'maior')
        ideas.push(
          idea(
            'emprestimo-modal',
            trecho,
            replaceAt(trecho, i, 1, I),
            2.5,
            `Terminar em ${n(I)} em vez de ${n(chord)}: o acorde maior vem de ${homonym} e deixa o final luminoso (a chamada terça de picardia).`,
          ),
        )
      }
      // iv → IV
      if (d === 5 && kind === 'menor') {
        const IV = build(chord.root, 'maior')
        ideas.push(
          idea(
            'emprestimo-modal',
            trecho,
            replaceAt(trecho, i, 1, IV),
            2,
            `${n(IV)} no lugar de ${n(chord)}: o IV maior vem de ${homonym} e clareia o tom menor por um instante.`,
          ),
        )
      }
    }
  })
  return ideas
}
