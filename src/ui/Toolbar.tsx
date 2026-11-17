import { keyName, keySymbol, type KeyGuess } from '../core/key'
import type { Key } from '../core/types'
import type { ViewMode } from './analysis'

interface Props {
  originalKey: Key
  currentKey: Key
  keyOptions: KeyGuess[]
  onChooseKey: (key: Key) => void
  semitones: number
  onTranspose: (semitones: number) => void
  mode: ViewMode
  onMode: (mode: ViewMode) => void
}

/** Tom, transposição e o botão Cifra / Graus. */
export function Toolbar(props: Props) {
  const { originalKey, currentKey, keyOptions, semitones, mode } = props
  const sign = semitones > 0 ? '+' : ''
  return (
    <div className="toolbar">
      <label className="field">
        <span className="field-label">Tom da cifra</span>
        <select
          id="tom"
          value={keySymbol(originalKey)}
          onChange={(event) => {
            const guess = keyOptions.find((g) => keySymbol(g.key) === event.target.value)
            if (guess) props.onChooseKey(guess.key)
          }}
        >
          {keyOptions.map((guess, i) => (
            <option key={keySymbol(guess.key)} value={keySymbol(guess.key)}>
              {keyName(guess.key)}
              {i === 0 ? ' (detectado)' : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span className="field-label">Transpor</span>
        <div className="stepper">
          <button
            type="button"
            aria-label="Descer meio tom"
            onClick={() => props.onTranspose(semitones - 1)}
          >
            −½
          </button>
          <output aria-live="polite">
            {semitones === 0
              ? keySymbol(currentKey)
              : `${keySymbol(currentKey)} (${sign}${semitones})`}
          </output>
          <button
            type="button"
            aria-label="Subir meio tom"
            onClick={() => props.onTranspose(semitones + 1)}
          >
            +½
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Mostrar</span>
        <div className="segmented" role="group" aria-label="Mostrar acordes como">
          <button
            type="button"
            aria-pressed={mode === 'cifra'}
            onClick={() => props.onMode('cifra')}
          >
            Cifra
          </button>
          <button
            type="button"
            aria-pressed={mode === 'graus'}
            onClick={() => props.onMode('graus')}
          >
            Graus
          </button>
        </div>
      </div>
    </div>
  )
}
