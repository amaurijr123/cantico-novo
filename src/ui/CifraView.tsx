import type { Key, Song } from '../core/types'
import { sectionLabels, type ViewMode } from './analysis'
import { placeLabels } from './layout'

interface Props {
  song: Song
  songKey: Key
  mode: ViewMode
  selected: number
  onSelect: (index: number) => void
}

/** A cifra inteira, seção por seção, com os acordes (ou graus) em cima da letra. */
export function CifraView({ song, songKey, mode, selected, onSelect }: Props) {
  return (
    <div className="cifra">
      {song.sections.map((section, index) => {
        const labels = sectionLabels(section, songKey, mode)
        const isSelected = index === selected
        return (
          <section
            key={`${section.name}-${index}`}
            className={isSelected ? 'cifra-section is-selected' : 'cifra-section'}
            aria-current={isSelected ? 'true' : undefined}
          >
            <button
              type="button"
              className="section-name"
              onClick={() => onSelect(index)}
            >
              {section.name}
              {isSelected && <span className="section-badge">rearmonizando</span>}
            </button>
            <div className="cifra-lines" onClick={() => onSelect(index)}>
              {section.lines.map((line, lineIndex) => (
                <div className="cifra-line" key={lineIndex}>
                  {line.chords.length > 0 && (
                    <pre className="chord-line">
                      {placeLabels(
                        line.chords.map((placed, i) => ({
                          label: labels[lineIndex][i],
                          column: placed.column,
                        })),
                      ).map((segment, i) =>
                        segment.chord === null ? (
                          segment.text
                        ) : (
                          <span className="chord" key={i}>
                            {segment.text}
                          </span>
                        ),
                      )}
                    </pre>
                  )}
                  {line.lyric !== undefined && (
                    <pre className="lyric-line">{line.lyric}</pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
