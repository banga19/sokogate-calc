import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Calculator({ loading, onCalculate }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    area: '',
    materialType: '',
    thickness: 4,
    tileSize: 12,
    roomWidth: '',
    roomHeight: '',
    roomLength: ''
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Auto-calculate area from room dimensions
  useEffect(() => {
    const width = parseFloat(formData.roomWidth) || 0
    const length = parseFloat(formData.roomLength) || 0
    if (width > 0 && length > 0 && !formData.area) {
      setFormData(prev => ({ ...prev, area: (width * length).toFixed(2) }))
    }
  }, [formData.roomWidth, formData.roomLength, formData.area])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!formData.area || formData.area <= 0) {
      setError('Please enter a valid area (greater than 0)')
      return
    }
    if (!formData.materialType) {
      setError('Please select a material type')
      return
    }

    try {
      const data = await onCalculate({
        ...formData,
        area: parseFloat(formData.area),
        thickness: parseFloat(formData.thickness),
        tileSize: parseFloat(formData.tileSize),
        roomWidth: parseFloat(formData.roomWidth) || 0,
        roomHeight: parseFloat(formData.roomHeight) || 0,
        roomLength: parseFloat(formData.roomLength) || 0
      })
      setResult(data.result || data)
    } catch (err) {
      setError(err.message || 'An error occurred during calculation')
    }
  }

  const showTileSize = formData.materialType === 'tiles'
  const showThickness = ['concrete', 'steel', 'gravel'].includes(formData.materialType)

  const getMaterialIcon = (type) => {
    const icons = {
      cement: '🏗️',
      bricks: '🧱',
      concrete: '🏢',
      painting: '🎨',
      tiles: '🧩',
      steel: '⚙️',
      blocks: '🧱',
      gravel: '🪨',
      roofing: '🏠'
    }
    return icons[type] || '📐'
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon accent">
          <span style={{ fontSize: '20px' }}>📐</span>
        </div>
        <div>
          <div className="card-header-title">Project Details</div>
          <div className="card-header-subtitle">Enter your measurements</div>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-error" style={{
              color: 'var(--color-danger)',
              padding: '14px',
              marginBottom: '20px',
              background: 'var(--color-danger-soft)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <line x1="10" y1="6" x2="10" y2="14"/>
                <line x1="10" y1="14" x2="14" y2="10"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="area" className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              Area
              <span className="label-hint">sq ft</span>
            </label>
            <input
              type="number"
              id="area"
              name="area"
              className="form-input"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 500"
              value={formData.area}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M5 21V7l8-4 8 4v14"/>
                <path d="M9 21v-6h6v6"/>
              </svg>
              Room Dimensions
              <span className="label-hint">optional</span>
            </label>
            <div className="input-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  id="roomWidth"
                  name="roomWidth"
                  className="form-input"
                  min="0.1"
                  step="0.01"
                  placeholder="Width (ft)"
                  value={formData.roomWidth}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  id="roomLength"
                  name="roomLength"
                  className="form-input"
                  min="0.1"
                  step="0.01"
                  placeholder="Length (ft)"
                  value={formData.roomLength}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  id="roomHeight"
                  name="roomHeight"
                  className="form-input"
                  min="0.1"
                  step="0.01"
                  placeholder="Height (ft)"
                  value={formData.roomHeight}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="materialType" className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Material Type
            </label>
            <select
              id="materialType"
              name="materialType"
              className="form-select"
              required
              value={formData.materialType}
              onChange={handleChange}
            >
              <option value="" disabled>Select material...</option>
              <optgroup label="Masonry">
                <option value="bricks">Bricks (9" × 4.5")</option>
                <option value="blocks">Concrete Blocks (8" × 8" × 16")</option>
              </optgroup>
              <optgroup label="Concrete &amp; Cement">
                <option value="cement">Cement &amp; Sand Plastering</option>
                <option value="concrete">Concrete Slab (1:2:4 Mix)</option>
                <option value="steel">Reinforcement Steel</option>
              </optgroup>
              <optgroup label="Finishing">
                <option value="tiles">Floor/Wall Tiles</option>
                <option value="painting">Interior Painting</option>
                <option value="roofing">Metal Roofing</option>
              </optgroup>
              <optgroup label="Site Works">
                <option value="gravel">Crushed Stone / Gravel</option>
              </optgroup>
            </select>
          </div>

          {showThickness && (
            <div className="form-group" style={{ animation: 'slideDown 0.3s ease-out' }}>
              <label htmlFor="thickness" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="M6 10h.01M6 14h.01"/>
                </svg>
                Thickness
                <span className="label-hint">inches</span>
              </label>
              <input
                type="number"
                id="thickness"
                name="thickness"
                className="form-input"
                min="1"
                max="24"
                step="0.5"
                value={formData.thickness}
                onChange={handleChange}
                placeholder="e.g. 4 inches"
              />
            </div>
          )}

          {showTileSize && (
            <div className="form-group" style={{ animation: 'slideDown 0.3s ease-out' }}>
              <label htmlFor="tileSize" className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
                Tile Size
              </label>
              <select
                id="tileSize"
                name="tileSize"
                className="form-select"
                value={formData.tileSize}
                onChange={handleChange}
              >
                <option value="6">6" × 6" Mosaic</option>
                <option value="12">12" × 12" Standard</option>
                <option value="18">18" × 18" Large</option>
                <option value="24">24" × 24" XL</option>
              </select>
              <div className="form-hint" style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                10% wastage included automatically
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ position: 'relative' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                  marginRight: '8px'
                }}></span>
                Calculating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                  <path d="M4 10h16M10 4v16"/>
                </svg>
                Calculate Materials
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="card-body" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <div className="result-summary" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="material-type-badge" style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {result.materialType || 'Materials'}
            </span>
          </div>

          <div className="results-grid">
            {result.cement && (
              <div className="result-card">
                <div className="result-icon cement">🏗️</div>
                <div className="result-content">
                  <div className="result-label">Cement</div>
                  <div className="result-value">{result.cement}</div>
                </div>
              </div>
            )}
            {result.sand && (
              <div className="result-card">
                <div className="result-icon">🏖️</div>
                <div className="result-content">
                  <div className="result-label">Sand</div>
                  <div className="result-value">{result.sand}</div>
                </div>
              </div>
            )}
            {result.aggregate && (
              <div className="result-card">
                <div className="result-icon">🪨</div>
                <div className="result-content">
                  <div className="result-label">Aggregate</div>
                  <div className="result-value">{result.aggregate}</div>
                </div>
              </div>
            )}
            {result.bricks && (
              <div className="result-card">
                <div className="result-icon bricks">🧱</div>
                <div className="result-content">
                  <div className="result-label">Bricks</div>
                  <div className="result-value">{result.bricks}</div>
                </div>
              </div>
            )}
            {result.concrete && (
              <div className="result-card">
                <div className="result-icon concrete">🏢</div>
                <div className="result-content">
                  <div className="result-label">Concrete</div>
                  <div className="result-value">{result.concrete}</div>
                </div>
              </div>
            )}
            {result.paint && (
              <div className="result-card">
                <div className="result-icon paint">🎨</div>
                <div className="result-content">
                  <div className="result-label">Paint</div>
                  <div className="result-value">{result.paint}</div>
                </div>
              </div>
            )}
            {result.primer && (
              <div className="result-card">
                <div className="result-icon paint">🖌️</div>
                <div className="result-content">
                  <div className="result-label">Primer</div>
                  <div className="result-value">{result.primer}</div>
                </div>
              </div>
            )}
            {result.tiles && (
              <div className="result-card">
                <div className="result-icon tiles">🧩</div>
                <div className="result-content">
                  <div className="result-label">Tiles</div>
                  <div className="result-value">{result.tiles}</div>
                </div>
              </div>
            )}
            {result.tileArea && (
              <div className="result-card">
                <div className="result-icon tiles">📐</div>
                <div className="result-content">
                  <div className="result-label">Tile Area</div>
                  <div className="result-value">{result.tileArea}</div>
                </div>
              </div>
            )}
            {result.adhesive && (
              <div className="result-card">
                <div className="result-icon">📦</div>
                <div className="result-content">
                  <div className="result-label">Adhesive</div>
                  <div className="result-value">{result.adhesive}</div>
                </div>
              </div>
            )}
            {result.grout && (
              <div className="result-card">
                <div className="result-icon">🧴</div>
                <div className="result-content">
                  <div className="result-label">Grout</div>
                  <div className="result-value">{result.grout}</div>
                </div>
              </div>
            )}
            {result.steel && (
              <div className="result-card">
                <div className="result-icon steel">⚙️</div>
                <div className="result-content">
                  <div className="result-label">Steel</div>
                  <div className="result-value">{result.steel}</div>
                </div>
              </div>
            )}
            {result.wireMesh && (
              <div className="result-card">
                <div className="result-icon">🔗</div>
                <div className="result-content">
                  <div className="result-label">Wire Mesh</div>
                  <div className="result-value">{result.wireMesh}</div>
                </div>
              </div>
            )}
            {result.blocks && (
              <div className="result-card">
                <div className="result-icon blocks">🧱</div>
                <div className="result-content">
                  <div className="result-label">Blocks</div>
                  <div className="result-value">{result.blocks}</div>
                </div>
              </div>
            )}
            {result.gravel && (
              <div className="result-card">
                <div className="result-icon gravel">🪨</div>
                <div className="result-content">
                  <div className="result-label">Gravel</div>
                  <div className="result-value">{result.gravel}</div>
                </div>
              </div>
            )}
            {result.geotextile && (
              <div className="result-card">
                <div className="result-icon">📄</div>
                <div className="result-content">
                  <div className="result-label">Geotextile</div>
                  <div className="result-value">{result.geotextile}</div>
                </div>
              </div>
            )}
            {result.roofingSheets && (
              <div className="result-card">
                <div className="result-icon roofing">🏠</div>
                <div className="result-content">
                  <div className="result-label">Roofing Sheets</div>
                  <div className="result-value">{result.roofingSheets}</div>
                </div>
              </div>
            )}
            {result.screws && (
              <div className="result-card">
                <div className="result-icon">🔩</div>
                <div className="result-content">
                  <div className="result-label">Screws</div>
                  <div className="result-value">{result.screws}</div>
                </div>
              </div>
            )}
            {result.flashing && (
              <div className="result-card">
                <div className="result-icon">📏</div>
                <div className="result-content">
                  <div className="result-label">Flashing</div>
                  <div className="result-value">{result.flashing}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
