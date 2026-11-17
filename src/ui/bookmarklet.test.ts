// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseCifra } from '../core/parse'
import {
  bookmarkletCode,
  bookmarkletHref,
  extractCifra,
  readCifraFromHash,
} from './bookmarklet'

/**
 * Uma página parecida com a de um site de cifras: cabeçalho, o tom, a cifra num <pre>
 * com os acordes em <b> e uma tablatura no meio. Conteúdo inventado.
 */
const PAGE = `
  <header><h1>Site de Cifras</h1><pre>menu</pre></header>
  <h1>Canção Inventada</h1>
  <h2>Autor Inventado</h2>
  <div><span id="cifra_tom">Tom: <a href="#">Em</a></span></div>
  <div class="cifra_cnt"><pre>[Intro] <b>Em</b>  <b>C</b>  <b>G</b>  <b>D</b>

[Primeira Parte]
<b>Em</b>            <b>C</b>
A noite é longa
<b>G</b>             <b>D</b>
E a luz já vem

<span class="tablatura">E|---3---2---0---|</span>

[Refrão]
<b>C</b>        <b>D</b>        <b>Em</b>
Tu me ouviste, Senhor</pre></div>
`

function page(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('extractCifra', () => {
  it('pega o maior <pre> da página e a linha do tom', () => {
    const text = extractCifra(page(PAGE))!
    expect(text.startsWith('Tom: Em\n\n[Intro] Em  C  G  D')).toBe(true)
    expect(text).toContain('Em            C\nA noite é longa')
  })

  it('o texto extraído é lido pelo app com seções, tom e aviso de tablatura', () => {
    const song = parseCifra(extractCifra(page(PAGE))!)
    expect(song.sections.map((s) => s.name)).toEqual([
      'Intro',
      'Primeira Parte',
      'Refrão',
    ])
    expect(song.declaredKey?.mode).toBe('menor')
    expect(song.warnings).toHaveLength(1)
  })

  it('funciona sem a linha do tom', () => {
    expect(extractCifra(page('<pre>G  D\nLetra</pre>'))).toBe('G  D\nLetra')
  })

  it('devolve null se a página não tiver cifra', () => {
    expect(extractCifra(page('<p>Nada aqui</p>'))).toBeNull()
    expect(extractCifra(page('<pre>   </pre>'))).toBeNull()
  })
})

describe('o favorito', () => {
  const APP = 'https://exemplo.github.io/cantico-novo/'

  it('é um endereço javascript:', () => {
    expect(bookmarkletHref(APP).startsWith('javascript:')).toBe(true)
  })

  it('abre o app numa aba nova com a cifra da página', () => {
    document.body.innerHTML = PAGE
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    new Function(bookmarkletCode(APP))()
    expect(open).toHaveBeenCalledOnce()
    const [url, target] = open.mock.calls[0]
    expect(target).toBe('_blank')
    expect(String(url).startsWith(APP + '#cifra=')).toBe(true)
    expect(readCifraFromHash(new URL(String(url)).hash)).toBe(extractCifra(document))
  })

  it('avisa quando a página não tem cifra', () => {
    document.body.innerHTML = '<p>Página sem cifra</p>'
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    new Function(bookmarkletCode(APP))()
    expect(alert).toHaveBeenCalledOnce()
    expect(open).not.toHaveBeenCalled()
  })
})

describe('readCifraFromHash', () => {
  it('lê a cifra que veio no endereço', () => {
    expect(readCifraFromHash('#cifra=' + encodeURIComponent('G  D\nLetra'))).toBe(
      'G  D\nLetra',
    )
  })

  it('ignora endereços sem cifra ou quebrados', () => {
    expect(readCifraFromHash('')).toBeNull()
    expect(readCifraFromHash('#outra-coisa')).toBeNull()
    expect(readCifraFromHash('#cifra=')).toBeNull()
    expect(readCifraFromHash('#cifra=%E0%A4%A')).toBeNull()
  })
})
