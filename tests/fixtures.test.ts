import { describe, expect, it } from 'vitest'
import { fixtureFiles, fixtures } from './fixtures'

describe('fixtures', () => {
  it('toda cifra .txt tem a resposta esperada cadastrada', () => {
    expect(fixtureFiles.sort()).toEqual(fixtures.map((f) => f.file).sort())
  })

  it.each(fixtures)('$file tem as seções cadastradas, na ordem', ({ text, sections }) => {
    const found = [...text.matchAll(/^\[(.+)\]\s*$/gm)].map((m) => m[1])
    expect(found).toEqual(sections)
  })
})
