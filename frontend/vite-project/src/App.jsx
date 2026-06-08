import React from 'react';
import FleetMap from './components/FleetMap';
import FleetOverviewPanel from './components/FleetOverviewPanel';
import TripListPanel from './components/TripListPanel';
import TripDetailView from './components/TripDetailView';
import LiveEventFeed from './components/LiveEventFeed';
import SimulationControlBar from './components/SimulationControlBar';
import './App.css';

function App() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <h1>FLEET<span>TRACK</span></h1>
        </div>
        <SimulationControlBar />
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