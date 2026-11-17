import { describe, expect, it } from 'vitest'
import { baixoPedal } from './baixo-pedal'
import { diminutoPassagem } from './diminuto-passagem'
import { dominanteSecundario } from './dominante-secundario'
import { emprestimoModal } from './emprestimo-modal'
import { iiV } from './ii-v'
import { tensoes } from './tensoes'
import { afterText, best, chords, key, run } from './testing'
import { tritono } from './tritono'

describe('dominante secundário', () => {
  it('coloca o V7 antes do acorde (exemplo do plano)', () => {
    expect(run(dominanteSecundario, 'G Em', 'G')).toEqual(['G B7 Em'])
  })

  it('prefere preparar o vi', () => {
    expect(afterText(best(dominanteSecundario, 'G D/F# Em C', 'G'))).toBe(
      'G D/F# B7 Em C',
    )
  })

  it('não mexe antes do I nem quando o V já está lá', () => {
    expect(run(dominanteSecundario, 'D G', 'G')).toEqual([])
    expect(run(dominanteSecundario, 'B7 Em', 'G')).toEqual([])
  })

  it('escreve com a grafia do tom (Sib maior)', () => {
    expect(run(dominanteSecundario, 'Bb Gm', 'Bb')).toEqual(['Bb D7 Gm'])
  })

  it('explica com o grau', () => {
    expect(best(dominanteSecundario, 'G Em', 'G').explanation).toContain('V7/vi')
  })
})

describe('ii–V', () => {
  it('coloca ii7 e V7 antes de um alvo maior (exemplo do plano)', () => {
    expect(run(iiV, 'G C', 'G')).toEqual(['G Dm7 G7 C'])
  })

  it('usa iiø e V7(b9) antes de um alvo menor', () => {
    expect(run(iiV, 'G Em', 'G')).toEqual(['G F#m7(b5) B7(b9) Em'])
  })

  it('prefere o ii–V–I no fim do trecho', () => {
    expect(afterText(best(iiV, 'G Em C G', 'G'))).toBe('G Em C Am7 D7 G')
  })

  it('não insere ii–V depois de um acorde que já tem o V no baixo', () => {
    // Bb/C já faz o papel do C7 antes do F.
    expect(run(iiV, 'Gm7 Bb/C F', 'F')).not.toContain('Gm7 Bb/C Gm7 C7 F')
  })

  it('funciona em outro tom (Mib)', () => {
    expect(run(iiV, 'Eb Ab', 'Eb')).toEqual(['Eb Bbm7 Eb7 Ab'])
  })
})

describe('substituição de trítono', () => {
  it('troca o dominante pelo substituto (exemplo do plano)', () => {
    expect(run(tritono, 'D7 G', 'G')).toEqual(['Ab7 G'])
  })

  it('conta quais notas os dois têm em comum', () => {
    expect(best(tritono, 'D7 G', 'G').explanation).toContain('F# e C')
  })

  it('troca dominante secundário também', () => {
    expect(run(tritono, 'G E7 Am', 'G')).toEqual(['G Bb7 Am'])
  })

  it('sem dominante, insere o substituto antes de um acorde', () => {
    expect(run(tritono, 'G C', 'G')).toEqual(['G Db7 C'])
  })
})

describe('empréstimo modal', () => {
  it('põe o iv depois do IV', () => {
    expect(run(emprestimoModal, 'C G', 'G')).toEqual(['C Cm G'])
  })

  it('troca o V final pelo bVII', () => {
    expect(run(emprestimoModal, 'G D G', 'G')).toEqual(['G F G'])
  })

  it('troca o vi pelo bVI', () => {
    expect(run(emprestimoModal, 'G Em', 'G')).toEqual(['G Eb'])
  })

  it('em tom menor, termina no I maior', () => {
    expect(run(emprestimoModal, 'Em B7 Em', 'Em')).toEqual(['Em B7 E'])
  })

  it('em tom menor, clareia o iv', () => {
    expect(run(emprestimoModal, 'Em Am Em', 'Em')).toEqual(['Em A Em', 'Em Am E'])
  })

  it('cita o tom de onde veio o acorde', () => {
    expect(best(emprestimoModal, 'C G', 'G').explanation).toContain('Sol menor')
  })
})

describe('diminuto de passagem', () => {
  it('liga dois acordes a um tom de distância (exemplo do plano)', () => {
    expect(run(diminutoPassagem, 'G Am', 'G')).toEqual(['G G#° Am'])
  })

  it('usa o baixo do acorde invertido como ponto de partida', () => {
    expect(run(diminutoPassagem, 'G/B C', 'G')).toEqual([])
    expect(run(diminutoPassagem, 'C/E F#m', 'D')).toEqual(['C/E F° F#m'])
  })

  it('faz IV #iv° I/5 (exemplo do plano)', () => {
    expect(run(diminutoPassagem, 'C G', 'G')).toEqual(['C C#° G/D'])
  })

  it('não faz IV #iv° I/5 quando o IV já tem outro baixo', () => {
    expect(run(diminutoPassagem, 'Bb/C F', 'F')).toEqual([])
  })

  it('funciona em tom com bemóis', () => {
    expect(run(diminutoPassagem, 'Bb Cm', 'Bb')).toEqual(['Bb B° Cm'])
  })
})

describe('baixo pedal', () => {
  it('segura a tônica no baixo (exemplo do plano)', () => {
    expect(run(baixoPedal, 'C D G', 'G')).toEqual(['C/G D/G G', 'C/D D G'])
  })

  it('não sugere nada para um acorde só', () => {
    expect(run(baixoPedal, 'G', 'G')).toEqual([])
  })

  it('destaca só os acordes que mudaram', () => {
    expect(best(baixoPedal, 'C D G', 'G').highlight).toEqual([0, 1])
  })
})

describe('tensões', () => {
  it('enriquece cada acorde conforme o grau', () => {
    expect(run(tensoes, 'G D/F# Em C', 'G')).toEqual(['G7M(9) D7(9)/F# Em7(9) C7M(9)'])
  })

  it('não põe 9 no iii, que sairia da escala', () => {
    expect(run(tensoes, 'Bm', 'G')).toEqual(['Bm7'])
  })

  it('troca o "2" do louvor pela nona completa', () => {
    expect(run(tensoes, 'A2 E', 'A')).toEqual(['A7M(9) E7(9)'])
  })

  it('não mexe em acorde que já tem sétima', () => {
    expect(run(tensoes, 'G7M Am7', 'G')).toEqual([])
  })

  it('em tom menor, o V ganha b9', () => {
    expect(run(tensoes, 'Am E Am', 'Am')).toEqual(['Am7(9) E7(b9) Am7(9)'])
  })

  it('suspenso vira 7(4,9)', () => {
    expect(run(tensoes, 'Dsus4', 'G')).toEqual(['D7(4,9)'])
  })
})

describe('todas as receitas', () => {
  const recipes = [
    dominanteSecundario,
    iiV,
    tritono,
    emprestimoModal,
    diminutoPassagem,
    baixoPedal,
    tensoes,
  ]

  it.each(recipes.map((r) => [r.name, r] as const))(
    '%s não altera o trecho original',
    (_, recipe) => {
      const trecho = chords('G D/F# Em C G')
      const copy = JSON.stringify(trecho)
      recipe(trecho, key('G'))
      expect(JSON.stringify(trecho)).toBe(copy)
    },
  )
})
