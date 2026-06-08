import React, { useState } from 'react';
import FleetMap from './components/FleetMap';
import FleetOverviewPanel from './components/FleetOverviewPanel';
import TripListPanel from './components/TripListPanel';
import TripDetailView from './components/TripDetailView';
import LiveEventFeed from './components/LiveEventFeed';
import SimulationControlBar from './components/SimulationControlBar';
import './App.css';
import OnboardingTour from './components/OnboardingTour';

function App() {
  const [tourRun, setTourRun] = useState(() => {
    try { return window.localStorage.getItem('seenTour') !== 'true'; } catch (e) { return false; }
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <h1>FLEET<span>TRACK</span></h1>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <SimulationControlBar />
          <button className="btn btn-reset" onClick={() => setTourRun(true)} aria-label="Show tour">Help</button>
        </div>
        <OnboardingTour run={tourRun} onClose={() => setTourRun(false)} />
      </header>

      <main className="dashboard-main">
        <div className="left-column">
          <FleetOverviewPanel />
          <TripListPanel />
        </div>

        <div className="center-column">
          <div className="map-wrapper">
            <FleetMap />
          </div>
          <TripDetailView />
        </div>

        <div className="right-column">
          <LiveEventFeed />
        </div>
      </main>
    </div>
  );
}

export default App;