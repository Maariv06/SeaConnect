// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketIo.on('connect', () => {
      console.log('🔌 Socket connected:', socketIo.id);
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socketIo.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const joinAuction = (auctionId) => {
    if (socket && isConnected) {
      socket.emit('join-auction', auctionId);
      console.log(`Joined auction room: ${auctionId}`);
    }
  };

  const leaveAuction = (auctionId) => {
    if (socket && isConnected) {
      socket.emit('leave-auction', auctionId);
      console.log(`Left auction room: ${auctionId}`);
    }
  };

  const placeBid = (auctionId, bidData) => {
    if (socket && isConnected) {
      socket.emit('place-bid', { auctionId, ...bidData });
    }
  };

  const onNewBid = (callback) => {
    if (socket) {
      socket.on('new-bid', callback);
    }
  };

  const onAuctionUpdate = (callback) => {
    if (socket) {
      socket.on('auction-update', callback);
    }
  };

  const onBidError = (callback) => {
    if (socket) {
      socket.on('bid-error', callback);
    }
  };

  const onAuctionEnded = (callback) => {
    if (socket) {
      socket.on('auction-ended', callback);
    }
  };

  const removeListeners = () => {
    if (socket) {
      socket.removeAllListeners();
    }
  };

  const value = {
    socket,
    isConnected,
    joinAuction,
    leaveAuction,
    placeBid,
    onNewBid,
    onAuctionUpdate,
    onBidError,
    onAuctionEnded,
    removeListeners
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};