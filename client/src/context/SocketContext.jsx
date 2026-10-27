import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socket from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [latestSlotUpdate, setLatestSlotUpdate] = useState(null);
  const [locationSnapshots, setLocationSnapshots] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const joinedLocations = useRef(new Set());

  useEffect(() => {
    if (!token) {
      joinedLocations.current.clear();
      socket.disconnect();
      setIsConnected(false);
      return undefined;
    }

    socket.auth = {};

    function onConnect() {
      setIsConnected(true);
      // Custom rooms are not persisted by Socket.IO across reconnects.
      // Rejoin and ask the server for the authoritative current state.
      joinedLocations.current.forEach((locationId) => {
        socket.emit('joinLocation', locationId);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onSlotStatusChanged(data) {
      setLatestSlotUpdate(data);
      if (data.locationId) {
        setLocationSnapshots((prev) => {
          const current = prev[data.locationId] || [];
          return {
            ...prev,
            [data.locationId]: current.map((slot) =>
              String(slot._id) === String(data.slotId) ? { ...slot, status: data.newStatus, expectedFreeTime: data.expectedFreeTime } : slot
            ),
          };
        });
      }
    }

    function onLocationSnapshot(data) {
      if (data?.locationId) {
        setLocationSnapshots((prev) => ({ ...prev, [data.locationId]: data.slots || [] }));
      }
    }

    function onHandoverAnnounced(data) {
      setToastMessage({ title: 'New Space Handover Available!', message: `Slot ${data.slotNumber} is expected to be free shortly!`, type: 'info' });
    }

    function onHandoverCompleted(data) {
      setToastMessage({ title: 'Handover Completed!', message: `Slot ${data.slotNumber} is now vacant and available.`, type: 'success' });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('slotStatusChanged', onSlotStatusChanged);
    socket.on('locationSnapshot', onLocationSnapshot);
    socket.on('handoverAnnounced', onHandoverAnnounced);
    socket.on('handoverCompleted', onHandoverCompleted);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('slotStatusChanged', onSlotStatusChanged);
      socket.off('locationSnapshot', onLocationSnapshot);
      socket.off('handoverAnnounced', onHandoverAnnounced);
      socket.off('handoverCompleted', onHandoverCompleted);
    };
  }, [token]);

  const joinLocationRoom = (locationId) => {
    if (!locationId || !token) return;
    joinedLocations.current.add(String(locationId));
    if (socket.connected) socket.emit('joinLocation', locationId);
  };

  const leaveLocationRoom = (locationId) => {
    if (!locationId) return;
    joinedLocations.current.delete(String(locationId));
    if (socket.connected) socket.emit('leaveLocation', locationId);
  };

  const refreshLocation = (locationId) => {
    if (locationId && socket.connected) socket.emit('requestLocationState', locationId);
  };

  const clearToast = () => setToastMessage(null);

  return (
    <SocketContext.Provider value={{
      socket, isConnected, latestSlotUpdate, locationSnapshots, toastMessage,
      clearToast, joinLocationRoom, leaveLocationRoom, refreshLocation,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
