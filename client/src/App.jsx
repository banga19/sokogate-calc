import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Calculator from './components/Calculator'
import History from './components/History'
import Stats from './components/Stats'
import './App.css'

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE || '/sokogate-calc/sokogate-calc-deploy/api/v1'
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  const fetchCalculations = async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/calculations?page=${page}&limit=${limit}`)
      const data = await res.json()
      if (data.success) {
        setCalculations(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch calculations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/calculations/stats`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const performCalculation = async (formData) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/calculations/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        // Refresh calculations list
        fetchCalculations()
        fetchStats()
        return data.data
      }
      throw new Error(data.error || 'Calculation failed')
    } catch (err) {
      console.error('Calculation error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-wrapper">
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand" aria-label="Sokogate Home">
            <div className="brand-icon">S</div>
            <div className="brand-text">
              <span className="brand-name">Sokogate</span>
              <span className="brand-tagline">Materials Calculator</span>
            </div>
          </Link>
          <nav className="header-nav">
            <Link to="/" className="nav-link">Calculator</Link>
            <Link to="/history" className="nav-link">History</Link>
            <Link to="/stats" className="nav-link">Stats</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={
            <Calculator 
              loading={loading}
              onCalculate={performCalculation}
            />
          }
          />
          <Route path="/history" element={
            <History 
              calculations={calculations}
              loading={loading}
              onRefresh={fetchCalculations}
            />
          }
          />
          <Route path="/stats" element={
            <Stats stats={stats} onRefresh={fetchStats} />
          }
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>© 2026 Sokogate Construction Calculator. Built with React + Express + MongoDB.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
