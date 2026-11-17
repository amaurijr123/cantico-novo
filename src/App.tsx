import { noteFromPitchClass, noteName, parseNote, pitchClass } from './core/notes'

// Tela provisória: só prova que a interface já enxerga o `core`.
// A interface de verdade (colar cifra, seções, 5 ideias) chega nas semanas 9 e 10.
const tom = parseNote('G')!
const escala = [0, 2, 4, 5, 7, 9, 11].map((passo) =>
  noteName(noteFromPitchClass(pitchClass(tom) + passo)),
)

function App() {
  return (
    <main>
      <p className="label">Em construção</p>
      <h1>reharm</h1>
      <p>Cole uma cifra, escolha um trecho e receba 5 ideias de rearmonização.</p>
      <p className="mono">Escala de Sol maior: {escala.join('  ')}</p>
    </main>
  )
}

export default App
