import { useEffect, useRef, useState } from 'react'
import { bookmarkletHref } from './bookmarklet'

/** Endereço do próprio app, para o favorito saber onde abrir a cifra. */
function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

/** Painel que ensina a instalar o favorito "Abrir no Cântico Novo". */
export function BookmarkletHelp({ onClose }: { onClose: () => void }) {
  const link = useRef<HTMLAnchorElement>(null)
  const [clicked, setClicked] = useState(false)

  // O React bloqueia "javascript:" no href, então o endereço entra direto no elemento.
  useEffect(() => {
    link.current?.setAttribute('href', bookmarkletHref(appUrl()))
  }, [])

  return (
    <section className="bookmarklet" aria-labelledby="favorito-titulo">
      <div className="panel-head">
        <h2 id="favorito-titulo">Trazer a cifra do Cifra Club</h2>
        <button type="button" className="button ghost" onClick={onClose}>
          Fechar
        </button>
      </div>
      <ol className="steps">
        <li>
          Arraste este botão para a barra de favoritos do navegador:{' '}
          <a
            ref={link}
            className="bookmarklet-link"
            onClick={(event) => {
              event.preventDefault()
              setClicked(true)
            }}
          >
            Abrir no Cântico Novo
          </a>
        </li>
        <li>Abra a cifra no Cifra Club, como você já faz.</li>
        <li>Clique no favorito. O Cântico Novo abre numa aba nova, já com a cifra.</li>
      </ol>
      {clicked && (
        <p className="warning">
          Esse botão não funciona com clique aqui. Arraste para a barra de favoritos e
          clique nele quando estiver na página da cifra.
        </p>
      )}
      <p className="muted">
        O favorito só lê o texto que já está na sua tela e o leva direto para o app, sem
        passar por nenhum servidor. Se não funcionar em algum site, copie a cifra e use
        "Colar outra cifra".
      </p>
    </section>
  )
}
