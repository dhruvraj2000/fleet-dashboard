import { useEffect } from 'react';
import { useSystemStore } from '../store/useSystemStore';

export const useWebSocket = () => {
  const addAlert = useSystemStore((state) => state.addAlert);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws/alerts');

    socket.onmessage = (event) => {
      const alertData = JSON.parse(event.data);
      addAlert(alertData);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      // Simple reconnection logic could be added here
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => socket.close();
  }, [addAlert]);
};
