import { chordName } from '../core/chord'
import { RECIPE_NAMES } from '../core/recipes'
import type { Chord, Idea, Key } from '../core/types'
import { voiceProgression } from '../core/voicing'
import { labelsFor, type ViewMode } from './analysis'

interface Props {
  sectionName: string
  ideas: Idea[]
  songKey: Key
  mode: ViewMode
  selected: number
  onSelect: (index: number) => void
}

function ChordRow({
  chords,
  songKey,
  mode,
  highlight = [],
}: {
  chords: Chord[]
  songKey: Key
  mode: ViewMode
  highlight?: number[]
}) {
  const labels = labelsFor(chords, songKey, mode)
  return (
    <span className="chord-row">
      {labels.map((label, i) => (
        <span key={i} className={highlight.includes(i) ? 'chip is-new' : 'chip'}>
          {label}
        </span>
      ))}
    </span>
  )
}

/** Em que notas tocar cada acorde da ideia: baixo na esquerda, acorde na direita. */
function KeyboardTable({ idea }: { idea: Idea }) {
  const voicings = voiceProgression(idea.after)
  return (
    <table className="keyboard-table">
      <caption>No teclado</caption>
      <thead>
        <tr>
          <th scope="col">Acorde</th>
          <th scope="col">Mão esquerda</th>
          <th scope="col">Mão direita</th>
        </tr>
      </thead>
      <tbody>
        {idea.after.map((chord, i) => (
          <tr key={i} className={idea.highlight.includes(i) ? 'is-new' : undefined}>
            <th scope="row">{chordName(chord)}</th>
            <td>{voicings[i].left.map((n) => n.name).join(' ')}</td>
            <td>{voicings[i].right.map((n) => n.name).join(' ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** As 5 ideias para a seção escolhida. */
export function IdeasPanel({
  sectionName,
  ideas,
  songKey,
  mode,
  selected,
  onSelect,
}: Props) {
  if (ideas.length === 0) {
    return (
      <p className="empty">
        A seção {sectionName} tem poucos acordes para rearmonizar. Escolha outra seção à
        esquerda.
      </p>
    )
  }
  return (
    <ol className="ideas" aria-label={`Ideias para ${sectionName}`}>
      {ideas.map((idea, index) => {
        const isSelected = index === selected
        return (
          <li key={index}>
            <button
              type="button"
              className={isSelected ? 'idea is-selected' : 'idea'}
              aria-pressed={isSelected}
              onClick={() => onSelect(index)}
            >
              <span className="idea-name">{RECIPE_NAMES[idea.recipe]}</span>
              <span className="idea-row">
                <span className="idea-label">antes</span>
                <ChordRow chords={idea.before} songKey={songKey} mode={mode} />
              </span>
              <span className="idea-row">
                <span className="idea-label">depois</span>
                <ChordRow
                  chords={idea.after}
                  songKey={songKey}
                  mode={mode}
                  highlight={idea.highlight}
                />
              </span>
              {isSelected && <span className="idea-why">{idea.explanation}</span>}
            </button>
            {isSelected && <KeyboardTable idea={idea} />}
          </li>
        )
      })}
    </ol>
  )
}
