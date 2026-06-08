import React from 'react';
import Joyride from 'react-joyride';

const steps = [
  {
    target: '.brand h1',
    content: 'Welcome to FleetTrack — this is the app name and brand.',
  },
  {
    target: '.control-bar',
    content: 'Use these controls to start/pause/reset the simulation and change speed.',
  },
  {
    target: '.map-wrapper',
    content: 'This map shows live vehicle positions and updates in real time.',
  },
  {
    target: '.trip-list',
    content: 'Here are active trips; click any trip to view details and follow it on the map.',
  },
  {
    target: '.event-log',
    content: 'Event feed shows recent telemetry and events for quick debugging.',
  },
];

export default function OnboardingTour({ run, onClose }) {
  return (
    <Joyride
      steps={steps}
      run={!!run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      disableOverlayClose={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#38bdf8',
        },
      }}
      callback={(data) => {
        const { status } = data;
        if (status === 'finished' || status === 'skipped') {
          try { window.localStorage.setItem('seenTour', 'true'); } catch (e) {}
          onClose && onClose();
        }
      }}
    />
  );
}
