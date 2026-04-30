import React, { useEffect } from 'react'

export default function Stats({ stats, onRefresh }) {
  useEffect(() => {
    onRefresh()
  }, [])

  const statCards = [
    {
      label: 'Total Calculations',
      value: stats?.totalCalculations || 0,
      icon: '📊'
    },
    {
      label: 'Most Used Material',
      value: stats?.byMaterialType?.[0]?._id?.toUpperCase() || 'N/A',
      subValue: stats?.byMaterialType?.[0]?.count + ' times',
      icon: '🏆'
    },
    {
      label: 'Material Types',
      value: (stats?.byMaterialType?.length || 0), 
      icon: '🧰'
    }
  ]

  const materialStats = stats?.byMaterialType || []

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">
          <span style={{ fontSize: '20px' }}>📈</span>
        </div>
        <div>
          <div className="card-header-title">Statistics</div>
          <div className="card-header-subtitle">Usage analytics from database</div>
        </div>
      </div>
      <div className="card-body">
        <div className="stats-grid">
          {statCards.map((stat, i) => (
            <div key={i} className="stat-card">
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              {stat.subValue && (
                <div style={{ fontSize: '12px', color: 'var(--color-accent)', marginTop: '4px' }}>
                  {stat.subValue}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Calculations by Material Type
          </h3>
          {materialStats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {materialStats.map((stat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '120px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {stat._id}
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f1f5f9', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max((stat.count / Math.max(...materialStats.map(s => s.count))) * 100, 5)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {stat.count}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', minWidth: '30px' }}>
                    {stat.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 24px' }}>
              <p>No calculation data yet</p>
            </div>
          )}
        </div>

        {stats?.recentCalculations?.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Recent Calculations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentCalculations.map((calc) => (
                <div key={calc._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', marginRight: '8px' }}>
                      {calc.result?.materialType || calc.materialType}
                    </span>
                    <span style={{ color: '#64748b' }}>
                      {calc.area} sq ft
                    </span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {new Date(calc.calculatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary btn-block"
          onClick={onRefresh}
          style={{ marginTop: '24px' }}
        >
          Refresh Stats
        </button>
      </div>
    </div>
  )
}
