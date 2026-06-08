import React, { memo } from 'react';
import { useFleetStore } from '../store/useFleetStore';

const MetricCard = memo(({ label, value, className = '' }) => (
  <div className={`metric-card ${className}`}>
    <span className="label">{label}</span>
    <span className={`value ${className.replace('wide', '').trim()}`}>{value}</span>
  </div>
));

MetricCard.displayName = 'MetricCard';

const FleetOverviewPanel = () => {
  const { fleetMetrics } = useFleetStore();

  return (
    <div className="panel overview-panel">
      <h2>Fleet Overview</h2>
      <div className="metrics-grid">
        <MetricCard label="Total Trips" value={fleetMetrics.totalTrips} />
        <MetricCard label="Active" value={fleetMetrics.activeTrips} className="active" />
        <MetricCard label="Completed" value={fleetMetrics.completedTrips} className="success" />
        <MetricCard label="Cancelled" value={fleetMetrics.cancelledTrips} className="error" />
        
        <div className="metric-card wide" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <span className="label">Progress Distribution</span>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '0.5rem',
            gap: '0.5rem' 
          }}>
            {Object.entries(fleetMetrics.progressDistribution).map(([range, count]) => (
              <div key={range} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{range}</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <MetricCard label="Avg Fleet Speed" value={`${fleetMetrics.avgFleetSpeed.toFixed(1)} km/h`} className="wide" />
      </div>
    </div>
  );
};

export default FleetOverviewPanel;
