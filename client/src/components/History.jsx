import React, { useState, useEffect } from 'react'

export default function History({ calculations, loading, onRefresh }) {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [allCalculations, setAllCalculations] = useState([])
  const [filter, setFilter] = useState('')
  const limit = 10

  useEffect(() => {
    setAllCalculations(calculations)
  }, [calculations])

  useEffect(() => {
    fetchHistory()
  }, [page, filter])

  const fetchHistory = async () => {
    try {
      const query = new URLSearchParams({ page, limit })
      if (filter) query.append('materialType', filter)
      
      const res = await fetch(`/sokogate-calc/sokogate-calc-deploy/api/v1/calculations?${query}`)
      const data = await res.json()
      
      if (data.success) {
        if (page === 1) {
          setAllCalculations(data.data)
        } else {
          setAllCalculations(prev => page === 1 ? data.data : 
            [...prev, ...data.data.filter(c => !prev.find(pc => pc._id === c._id))])
        }
        setTotalPages(data.pagination.pages)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(p => p + 1)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return
    
    try {
      const res = await fetch(`/sokogate-calc/sokogate-calc-deploy/api/v1/calculations/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setAllCalculations(prev => prev.filter(c => c._id !== id))
        onRefresh()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const formatValue = (val) => {
    if (!val) return '-'
    if (typeof val === 'string' && val.length > 50) {
      return val.substring(0, 50) + '...'
    }
    return val
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">
          <span style={{ fontSize: '20px' }}>📜</span>
        </div>
        <div>
          <div className="card-header-title">Calculation History</div>
          <div className="card-header-subtitle">Past calculations stored in database</div>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '200px' }}
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Materials</option>
            <option value="cement">Cement</option>
            <option value="bricks">Bricks</option>
            <option value="concrete">Concrete</option>
            <option value="painting">Painting</option>
            <option value="tiles">Tiles</option>
            <option value="steel">Steel</option>
            <option value="blocks">Blocks</option>
            <option value="gravel">Gravel</option>
            <option value="roofing">Roofing</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => { setPage(1); onRefresh(); fetchHistory(); }}
          >
            Refresh
          </button>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              if (window.confirm('Delete all calculation history?')) {
                try {
                  await fetch('/sokogate-calc/sokogate-calc-deploy/api/v1/calculations', {
                    method: 'DELETE'
                  })
                  setAllCalculations([])
                  onRefresh()
                } catch (err) {
                  console.error('Failed to delete all:', err)
                }
              }
            }}
          >
            Clear All
          </button>
        </div>

        {loading && allCalculations.length === 0 ? (
          <div className="empty-state">
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #f1f5f9',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p>Loading history...</p>
          </div>
        ) : allCalculations.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <h3>No History Yet</h3>
            <p>Perform some calculations to see them here</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '12px', color: '#64748b', fontSize: '14px' }}>
              Showing {allCalculations.length} of {totalPages > 0 ? 'all available' : '0'} calculations
            </div>
            {allCalculations.map((calc) => (
              <div key={calc._id} className="result-card" style={{ position: 'relative' }}>
                <div className="result-icon generic">🏷️</div>
                <div className="result-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="result-label">{calc.result?.materialType || calc.materialType}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(calc.calculatedAt).toLocaleString()} • Area: {calc.area} sq ft
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(calc._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '18px'
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                    {calc.result && Object.entries(calc.result).filter(([k]) => !['materialType', 'roomWidth', 'roomHeight', 'roomLength'].includes(k)).slice(0, 3).map(([key, val]) => (
                      <span key={key} style={{ fontSize: '13px', color: '#64748b' }}>
                        <strong>{key}:</strong> {formatValue(val)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {page < totalPages && (
              <button
                className="btn btn-secondary btn-block"
                onClick={handleLoadMore}
                style={{ marginTop: '16px' }}
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
