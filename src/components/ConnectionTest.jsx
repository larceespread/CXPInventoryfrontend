// src/components/ConnectionStatus.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/config';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      await api.get('/health', { timeout: 3000 });
      setStatus('connected');
    } catch (error) {
      setStatus('disconnected');
    }
    setLastChecked(new Date());
  };

  const statusColors = {
    connected: '#10b981',
    disconnected: '#ef4444',
    checking: '#f59e0b'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 12px',
      background: '#f3f4f6',
      borderRadius: '20px',
      fontSize: '12px'
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: statusColors[status],
        animation: status === 'checking' ? 'pulse 1.5s infinite' : 'none'
      }} />
      <span>
        {status === 'connected' && 'Connected to server'}
        {status === 'disconnected' && 'Disconnected'}
        {status === 'checking' && 'Checking connection...'}
      </span>
      {lastChecked && (
        <span style={{ color: '#6b7280', marginLeft: '4px' }}>
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;