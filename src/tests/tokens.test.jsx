import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from '../App'
import fs from 'fs'
import path from 'path'

describe('STORM-FE-001: Customer SPA React 18 + Vite Scaffolding & Vanilla CSS Tokens', () => {
  beforeEach(() => {
    // Mock global fetch for backend health check
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/health') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { uptime: 120, status: 'operational' },
            message: 'StackStorm Backend Operational',
            errors: [],
          }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('AC1: should mount App component without throwing runtime exceptions', async () => {
    let container
    await act(async () => {
      const res = render(<App />)
      container = res.container
    })
    expect(container).toBeTruthy()
    expect(container.querySelector('.storefront-app')).toBeInTheDocument()
  })

  it('AC2: should render brand identity for Dickwella Fashion Corner', async () => {
    await act(async () => {
      render(<App />)
    })
    const brandTitles = screen.getAllByText(/Dickwella Fashion Corner/i)
    expect(brandTitles.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/STACKSTORM/i).length).toBeGreaterThan(0)
  })

  it('AC2: should define required CSS Custom Properties design tokens in tokens.css', () => {
    const tokensPath = path.resolve(__dirname, '../styles/tokens.css')
    const tokensContent = fs.readFileSync(tokensPath, 'utf8')

    // Brand colors
    expect(tokensContent).toContain('--color-primary: #0A192F;')
    expect(tokensContent).toContain('--color-accent: #D4AF37;')
    expect(tokensContent).toContain('--color-surface: #FFFFFF;')

    // Typography
    expect(tokensContent).toContain('--font-heading:')
    expect(tokensContent).toContain('--font-body:')
    expect(tokensContent).toContain('Outfit')
    expect(tokensContent).toContain('Inter')

    // Elevation & Glassmorphism
    expect(tokensContent).toContain('--glass-bg:')
    expect(tokensContent).toContain('--glass-blur: blur(12px);')
    expect(tokensContent).toContain('--shadow-gold:')
  })

  it('AC3: should render core navigation links and action buttons', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByText("Men's Batik")).toBeInTheDocument()
    expect(screen.getByText("Women's Sarees")).toBeInTheDocument()
    expect(screen.getByText("Pure Handlooms")).toBeInTheDocument()
    expect(screen.getByText("Linen Collection")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search catalog/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view wishlist/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view shopping cart/i })).toBeInTheDocument()
  })

  it('AC4: should display all 4 core value proposition pillars', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/Islandwide Delivery/i)).toBeInTheDocument()
    expect(screen.getByText(/100% Artisan Craft/i)).toBeInTheDocument()
    expect(screen.getByText(/30-Day Return Policy/i)).toBeInTheDocument()
    expect(screen.getByText(/Loyalty Rewards/i)).toBeInTheDocument()
  })

  it('AC5: should display signature collections preview with Sri Lankan LKR pricing', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/Signature Collections/i)).toBeInTheDocument()
    expect(screen.getByText(/Signature Linen Batik Shirt/i)).toBeInTheDocument()
    expect(screen.getByText(/Pure Handloom Cotton Saree/i)).toBeInTheDocument()
    expect(screen.getByText('LKR 4,500.00')).toBeInTheDocument()
    expect(screen.getByText('LKR 12,500.00')).toBeInTheDocument()
  })

  it('AC6: should display brand copyright and academic attribution in the footer', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByText(/Dickwella Fashion Corner\. All Rights Reserved/i)).toBeInTheDocument()
    expect(screen.getByText(/Department of Software Engineering/i)).toBeInTheDocument()
  })
})
