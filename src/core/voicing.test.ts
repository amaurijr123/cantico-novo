import { describe, expect, it } from 'vitest'
import { chordName, parseChord } from './chord'
import { parseCifra, sectionChords } from './parse'
import { suggestIdeas } from './recipes'
import { voiceChord, voiceProgression, type Voicing } from './voicing'
import { parseNote } from './notes'
import { fixtures } from '../../tests/fixtures'

function names(v: Voicing): { left: string; right: string } {
  return {
    left: v.left.map((n) => n.name).join(' '),
    right: v.right.map((n) => n.name).join(' '),
  }
}

function voice(symbol: string): { left: string; right: string } {
  return names(voiceChord(parseChord(symbol)!))
}

function progression(text: string): string[] {
  return voiceProgression(text.split(' ').map((s) => parseChord(s)!)).map(
    (v) => names(v).right,
  )
}

describe('voiceChord: um acorde sozinho', () => {
  it('tríade: baixo na esquerda, acorde fechado na direita perto do Dó central', () => {
    expect(voice('G')).toEqual({ left: 'G2', right: 'B3 D4 G4' })
    expect(voice('C')).toEqual({ left: 'C3', right: 'C4 E4 G4' })
  })

  it('baixo invertido vai para a mão esquerda', () => {
    expect(voice('D/F#').left).toBe('F#2')
    expect(voice('Bb/C').left).toBe('C3')
  })

  it('escreve as notas com a letra certa do acorde', () => {
    expect(voice('D').right).toBe('D4 F#4 A4')
    expect(voice('Eb').right).toBe('Bb3 Eb4 G4')
    expect(voice('G#°').right).toBe('B3 D4 F4 G#4')
  })

  it('tétrades: terça e sétima sempre, a nona no lugar da fundamental', () => {
    expect(voice('G7')).toEqual({ left: 'G2', right: 'B3 D4 F4 G4' })
    expect(voice('C7M(9)').right).toBe('B3 D4 E4 G4')
    expect(voice('Am7').right).toBe('C4 E4 G4 A4')
  })

  it('13ª no lugar da quinta', () => {
    expect(voice('G7(13)').right).toBe('B3 E4 F4 G4')
  })

  it('meio-diminuto, diminuto e aumentado', () => {
    expect(voice('Bm7(b5)').right).toBe('B3 D4 F4 A4')
    expect(voice('C(#5)').right).toBe('C4 E4 G#4')
  })

  it('suspensos e nona adicionada', () => {
    expect(voice('Dsus4').right).toBe('D4 G4 A4')
    expect(voice('A2').right).toBe('B3 C#4 E4 A4')
  })
})

describe('voiceProgression: condução de vozes', () => {
  it('mantém as notas em comum paradas', () => {
    // G para C: o G4 fica, o B3 sobe para C4, o D4 sobe para E4.
    expect(progression('G C')).toEqual(['B3 D4 G4', 'C4 E4 G4'])
  })

  it('ii–V–I anda pouco', () => {
    // C e A ficam; E desce para D e G para F#; depois C desce para B e A para G.
    expect(progression('Am7 D7 G7M')).toEqual([
      'C4 E4 G4 A4',
      'C4 D4 F#4 A4',
      'B3 D4 F#4 G4',
    ])
  })

  it('a mão direita não sobe nem desce sem parar numa progressão longa', () => {
    const chords = 'G D Em C G D Em C G D Em C G D Em C'
    const centers = voiceProgression(chords.split(' ').map((s) => parseChord(s)!)).map(
      (v) => v.right.reduce((s, n) => s + n.midi, 0) / v.right.length,
    )
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(7)
  })
})

describe('todas as cifras de exemplo e as ideias geradas', () => {
  const chords = fixtures.flatMap(({ text, key }) => {
    const tom = { tonic: parseNote(key.tonic)!, mode: key.mode }
    return parseCifra(text).sections.flatMap((section) => {
      const trecho = sectionChords(section)
      return [trecho, ...suggestIdeas(trecho, tom).map((idea) => idea.after)]
    })
  })

  it('todo acorde tem voicing dentro das faixas das mãos', () => {
    for (const list of chords) {
      for (const [i, v] of voiceProgression(list).entries()) {
        const label = chordName(list[i])
        expect(v.left, label).toHaveLength(1)
        expect(v.left[0].midi, label).toBeGreaterThanOrEqual(40)
        expect(v.left[0].midi, label).toBeLessThanOrEqual(51)
        expect(v.right.length, label).toBeGreaterThanOrEqual(3)
        expect(v.right[0].midi, label).toBeGreaterThanOrEqual(57)
        expect(v.right[v.right.length - 1].midi, label).toBeLessThanOrEqual(79)
      }
    }
  })
})
