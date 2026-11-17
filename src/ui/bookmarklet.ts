/**
 * O favorito "Abrir no Cântico Novo".
 *
 * O Cifra Club bloqueia acessos automáticos, então o app não busca a página sozinho.
 * Em vez disso, a pessoa abre a cifra normalmente no próprio navegador e clica num
 * favorito (bookmarklet). O favorito lê o texto que já está na tela e abre o app numa
 * aba nova, com a cifra no endereço depois do "#".
 *
 * Nada passa por servidor: o que vem depois do "#" nunca é enviado pela internet.
 */

/** A marca no endereço que diz "aqui vem uma cifra": .../cantico-novo/#cifra=... */
const HASH_PREFIX = '#cifra='

/**
 * Roda dentro da página da cifra, no navegador da pessoa.
 *
 * Não pode usar nada de fora desta função (nem imports, nem constantes do arquivo),
 * porque ela vira texto dentro do favorito.
 *
 * Pega o maior bloco `<pre>` da página (é onde os sites de cifra põem acordes e
 * letra) e, se achar, a linha "Tom: G".
 */
export function extractCifra(doc: Document): string | null {
  let best = ''
  doc.querySelectorAll('pre').forEach((pre) => {
    const text = pre.textContent || ''
    if (text.trim().length > best.trim().length) best = text
  })
  if (!best.trim()) return null

  let tom = ''
  doc.querySelectorAll('span, div, p, b, strong').forEach((el) => {
    const text = (el.textContent || '').trim()
    if (!tom && /^tom\s*:\s*[A-G][#b]?m?$/i.test(text)) tom = text
  })
  return (tom ? tom + '\n\n' : '') + best
}

/** O código JavaScript do favorito, que abre `appUrl` com a cifra da página. */
export function bookmarkletCode(appUrl: string): string {
  return (
    '(function(){' +
    `var t=(${extractCifra.toString()})(document);` +
    "if(!t){alert('Não encontrei a cifra nesta página. Copie o texto e cole no Cântico Novo.');return}" +
    `window.open(${JSON.stringify(appUrl + HASH_PREFIX)}+encodeURIComponent(t),'_blank')` +
    '})()'
  )
}

/** O endereço do favorito, pronto para pôr no `href` do link que a pessoa arrasta. */
export function bookmarkletHref(appUrl: string): string {
  return 'javascript:' + encodeURIComponent(bookmarkletCode(appUrl))
}

/** Lê a cifra que veio pelo favorito, se o endereço tiver uma. */
export function readCifraFromHash(hash: string): string | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const text = decodeURIComponent(hash.slice(HASH_PREFIX.length))
    return text.trim() ? text : null
  } catch {
    return null // endereço cortado ou mal formado
  }
}
