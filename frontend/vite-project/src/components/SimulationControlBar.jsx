import React from 'react';
import { useFleetStore } from '../store/useFleetStore';
import { SocketService } from '../services/SocketService';

const SimulationControlBar = () => {
  const { simulationStatus } = useFleetStore();

  return (
    <div className="control-bar">
      <div className="control-group">
        <button 
          className={`btn ${simulationStatus.running ? 'btn-pause' : 'btn-start'}`}
          onClick={() => simulationStatus.running ? SocketService.pauseSimulation() : SocketService.startSimulation()}
        >
          {simulationStatus.running ? 'Pause Simulation' : 'Start Simulation'}
        </button>
        <button className="btn btn-reset" onClick={() => SocketService.resetSimulation()}>
          Reset
        </button>
      </div>

      <div className="control-group">
        <span className="label">Simulation Speed:</span>
        {[1, 5, 10].map(speed => (
          <button 
            key={speed} 
            className={`btn-speed ${simulationStatus.speed === speed ? 'active' : ''}`}
            onClick={() => SocketService.setSimulationSpeed(speed)}
          >
            {speed}x
          </button>
        ))}
      </div>

      <div className="status-indicator">
        <span className={`dot ${simulationStatus.running ? 'dot-active' : 'dot-idle'}`}></span>
        <span>{simulationStatus.running ? 'LIVE' : 'PAUSED'}</span>
      </div>
    </div>
  );
};

export default SimulationControlBar;
