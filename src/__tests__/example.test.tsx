import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

function HelloWorld() {
  return <h1>Hello, World!</h1>
}

test('renders hello world', () => {
  render(<HelloWorld />)
  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading).toHaveTextContent('Hello, World!')
})
