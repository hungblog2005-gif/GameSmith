import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Prevent real network calls / side effects in all providers ─────────────
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: null, loading: false }),
}))
vi.mock('../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: () => ({ items: [], total: 0 }),
}))
vi.mock('../context/UserDataContext', () => ({
  UserDataProvider: ({ children }) => children,
  useUserData: () => ({}),
}))
vi.mock('../context/LanguageContext', () => ({
  LanguageProvider: ({ children }) => children,
  useLanguage: () => ({ language: 'en' }),
}))
vi.mock('../layouts/MainLayout', () => ({
  default: ({ children }) => <div data-testid="main-layout">{children}</div>,
}))
vi.mock('../hooks/useSocket', () => ({ default: () => null }))

// ── Prevent framer-motion from animating in tests ──────────────────────────
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }) => <div {...props}>{children}</div> }),
}))

import App from '../App'

describe('App (smoke)', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('main-layout')).toBeInTheDocument()
  })
})
