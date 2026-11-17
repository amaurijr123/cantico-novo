// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

/** A primeira linha de acordes da cifra, com os espaços reduzidos a um só. */
function chordLine(container: HTMLElement): string {
  return container.querySelector('.chord-line')!.textContent!.replace(/\s+/g, ' ')
}

function ideaButtons() {
  return within(screen.getByRole('list', { name: /Ideias para/ })).getAllByRole('button')
}

describe('App', () => {
  it('abre com a cifra de exemplo, o tom e 5 ideias para a primeira seção', () => {
    render(<App />)
    expect(screen.getByRole('combobox')).toHaveProperty('value', 'G')
    expect(screen.getByRole('heading', { name: 'Ideias para Intro' })).toBeTruthy()
    expect(ideaButtons()).toHaveLength(5)
  })

  it('troca de seção ao clicar no nome dela', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Refrão' }))
    expect(screen.getByRole('heading', { name: 'Ideias para Refrão' })).toBeTruthy()
  })

  it('mostra graus romanos no lugar dos acordes', () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Graus' }))
    expect(chordLine(container)).toBe('I V/3 vi IV')
  })

  it('transpõe meio tom acima', () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Subir meio tom' }))
    expect(chordLine(container)).toBe('Ab Eb/G Fm Db')
  })

  it('as setas do teclado trocam de ideia e de seção', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(ideaButtons()[1].getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Ideias para Verso' })).toBeTruthy()
    expect(ideaButtons()[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('aceita uma cifra nova colada', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Colar outra cifra' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '[Ponte]\nAm  F  C  G\nLetra inventada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Rearmonizar' }))
    expect(screen.getByRole('heading', { name: 'Ideias para Ponte' })).toBeTruthy()
  })

  it('avisa quando o texto não tem acordes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Colar outra cifra' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'só letra' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rearmonizar' }))
    expect(screen.getByText('Não encontrei acordes nesse texto')).toBeTruthy()
  })
})
