import { useEffect, useMemo, useState } from 'react'
import { keyName } from './core/key'
import { sectionChords } from './core/parse'
import { suggestIdeas } from './core/recipes'
import type { Key } from './core/types'
import { analyze, type ViewMode } from './ui/analysis'
import { readCifraFromHash } from './ui/bookmarklet'
import { BookmarkletHelp } from './ui/BookmarkletHelp'
import { CifraView } from './ui/CifraView'
import { EXEMPLO } from './ui/exemplo'
import { IdeasPanel } from './ui/IdeasPanel'
import { Toolbar } from './ui/Toolbar'

/** Elementos onde as setas do teclado já têm outro uso. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )
}

/** Cifra que chegou pelo favorito, no endereço depois do "#". */
function cifraFromAddress(): string | null {
  return readCifraFromHash(window.location.hash)
}

/** Tira a cifra do endereço, para ela não ficar no histórico nem voltar ao recarregar. */
function clearAddress() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

function App() {
  const [fromLink, setFromLink] = useState(() => cifraFromAddress() !== null)
  const [text, setText] = useState(() => cifraFromAddress() ?? EXEMPLO)
  const [draft, setDraft] = useState(text)
  const [showHelp, setShowHelp] = useState(false)
  const [editing, setEditing] = useState(false)
  const [chosenKey, setChosenKey] = useState<Key>()
  const [semitones, setSemitones] = useState(0)
  const [mode, setMode] = useState<ViewMode>('cifra')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [ideaIndex, setIdeaIndex] = useState(0)

  const analysis = useMemo(
    () => analyze(text, { chosenKey, semitones }),
    [text, chosenKey, semitones],
  )
  const sections = analysis?.song.sections ?? []
  const current = Math.min(sectionIndex, Math.max(sections.length - 1, 0))
  const section = sections[current]

  const ideas = useMemo(
    () => (analysis && section ? suggestIdeas(sectionChords(section), analysis.key) : []),
    [analysis, section],
  )

  const selectSection = (index: number) => {
    setSectionIndex(index)
    setIdeaIndex(0)
  }

  // A cifra veio pelo favorito: limpa o endereço. Se outra chegar com o app aberto
  // nesta aba, carrega ela também.
  useEffect(() => {
    if (fromLink) clearAddress()
    const onHash = () => {
      const incoming = cifraFromAddress()
      if (incoming === null) return
      clearAddress()
      setText(incoming)
      setDraft(incoming)
      setChosenKey(undefined)
      setSemitones(0)
      setSectionIndex(0)
      setIdeaIndex(0)
      setEditing(false)
      setFromLink(true)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir o app
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (editing || isTyping(event.target) || event.ctrlKey || event.metaKey) return
      if (event.key === 'ArrowDown') {
        setIdeaIndex((i) => Math.min(i + 1, ideas.length - 1))
      } else if (event.key === 'ArrowUp') {
        setIdeaIndex((i) => Math.max(i - 1, 0))
      } else if (event.key === 'ArrowRight') {
        setSectionIndex(Math.min(current + 1, sections.length - 1))
        setIdeaIndex(0)
      } else if (event.key === 'ArrowLeft') {
        setSectionIndex(Math.max(current - 1, 0))
        setIdeaIndex(0)
      } else if (event.key.toLowerCase() === 'g') {
        setMode((m) => (m === 'cifra' ? 'graus' : 'cifra'))
      } else {
        return
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, ideas.length, current, sections.length])

  const applyDraft = () => {
    setFromLink(false)
    setText(draft)
    setChosenKey(undefined)
    setSemitones(0)
    selectSection(0)
    setEditing(false)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Cântico Novo</h1>
          <p>Cole uma cifra, escolha uma seção e receba 5 ideias de rearmonização.</p>
        </div>
        {!editing && (
          <div className="header-actions">
            <button
              type="button"
              className="button ghost"
              aria-expanded={showHelp}
              onClick={() => setShowHelp((v) => !v)}
            >
              Trazer do Cifra Club
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setDraft(text)
                setEditing(true)
              }}
            >
              Colar outra cifra
            </button>
          </div>
        )}
      </header>

      {showHelp && !editing && <BookmarkletHelp onClose={() => setShowHelp(false)} />}
      {fromLink && !editing && analysis && (
        <p className="notice">Cifra trazida pelo favorito. Nada dela foi salvo.</p>
      )}

      {editing ? (
        <section className="editor" aria-label="Colar cifra">
          <label htmlFor="cifra-texto" className="field-label">
            Cole a cifra com os acordes em cima da letra e as seções entre colchetes, como
            [Verso] e [Refrão].
          </label>
          <textarea
            id="cifra-texto"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            autoFocus
          />
          <div className="editor-actions">
            <button type="button" className="button primary" onClick={applyDraft}>
              Rearmonizar
            </button>
            <button type="button" className="button" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => setDraft(EXEMPLO)}
            >
              Usar o exemplo
            </button>
          </div>
        </section>
      ) : !analysis ? (
        <section className="empty-state">
          <h2>Não encontrei acordes nesse texto</h2>
          <p>
            Confira se os acordes estão numa linha só deles, em cima da letra, como na
            cifra de exemplo.
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => {
              setDraft(text)
              setEditing(true)
            }}
          >
            Editar a cifra
          </button>
        </section>
      ) : (
        <>
          <Toolbar
            originalKey={analysis.originalKey}
            currentKey={analysis.key}
            keyOptions={analysis.keyOptions}
            onChooseKey={setChosenKey}
            semitones={semitones}
            onTranspose={setSemitones}
            mode={mode}
            onMode={setMode}
          />
          <main className="workspace">
            <div className="panel">
              <div className="panel-head">
                <h2>Cifra</h2>
                <span className="muted">{keyName(analysis.key)}</span>
              </div>
              <CifraView
                song={analysis.song}
                songKey={analysis.key}
                mode={mode}
                selected={current}
                onSelect={selectSection}
              />
              {analysis.song.warnings.map((warning) => (
                <p className="warning" key={warning}>
                  {warning}
                </p>
              ))}
            </div>
            <div className="panel">
              <div className="panel-head">
                <h2>Ideias para {section?.name}</h2>
                <span className="muted">{ideas.length} ideias</span>
              </div>
              <IdeasPanel
                sectionName={section?.name ?? ''}
                ideas={ideas}
                songKey={analysis.key}
                mode={mode}
                selected={Math.min(ideaIndex, Math.max(ideas.length - 1, 0))}
                onSelect={setIdeaIndex}
              />
            </div>
          </main>
          <footer className="hints">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> trocam de ideia
            </span>
            <span>
              <kbd>←</kbd> <kbd>→</kbd> trocam de seção
            </span>
            <span>
              <kbd>G</kbd> alterna cifra e graus
            </span>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
