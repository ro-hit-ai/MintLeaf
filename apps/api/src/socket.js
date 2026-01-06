// apps/api/src/socket.js
const logger = require("./lib/logger");
let ioInstance = null;

function initSocket(io) {
  ioInstance = io;
  
  // Add actual socket event handlers
  io.on('connection', (socket) => {
    const userInfo = socket.user ? `${socket.user._id} (${socket.user.email})` : 'Unknown';
    logger.info(`🔌 Socket connected: ${socket.id}, User: ${userInfo}`);
    
    // Debug: Log all socket events (optional - disable in production)
    if (process.env.NODE_ENV !== 'production') {
      socket.onAny((event, ...args) => {
        // Filter out noisy events
        const noisyEvents = ['ticket:comment', 'ping', 'pong'];
        if (!noisyEvents.includes(event)) {
          logger.debug(`📡 [${socket.id}] Event: ${event}`, args.length > 0 ? args[0] : '');
        }
      });
    }
    
    // Join ticket room (MATCHES FRONTEND "join-ticket")
    socket.on('join-ticket', (ticketId) => {
      if (!ticketId) {
        logger.warn(`⚠️ join-ticket called without ticketId from socket ${socket.id}`);
        return;
      }
      
      // Validate ticketId format
      if (!/^[0-9a-fA-F]{24}$/.test(ticketId)) {
        logger.warn(`⚠️ Invalid ticketId format from socket ${socket.id}: ${ticketId}`);
        socket.emit('ticket:join-error', { error: 'Invalid ticket ID format' });
        return;
      }
      
      socket.join(`ticket:${ticketId}`);
      logger.info(`🎯 Socket ${socket.id} joined ticket:${ticketId}`);
      
      // Send acknowledgement back to client
      socket.emit('ticket:joined', { 
        ticketId, 
        success: true,
        timestamp: new Date().toISOString()
      });
    });
    
    // Leave ticket room (MATCHES FRONTEND "leave-ticket")
    socket.on('leave-ticket', (ticketId) => {
      if (!ticketId) {
        logger.warn(`⚠️ leave-ticket called without ticketId from socket ${socket.id}`);
        return;
      }
      
      socket.leave(`ticket:${ticketId}`);
      logger.info(`🎯 Socket ${socket.id} left ticket:${ticketId}`);
      
      socket.emit('ticket:left', { 
        ticketId, 
        success: true,
        timestamp: new Date().toISOString()
      });
    });
    
    // User joins their personal room
    socket.on('join-user', () => {
      if (socket.user?._id) {
        socket.join(`user:${socket.user._id}`);
        logger.info(`👤 Socket ${socket.id} joined user:${socket.user._id}`);
        socket.emit('user:joined', { userId: socket.user._id, success: true });
      }
    });
    
    // Join agents room
    socket.on('join-agents', () => {
      if (socket.user?.role === 'admin' || socket.user?.role === 'agent') {
        socket.join('agents');
        logger.info(`👥 Socket ${socket.id} joined agents room`);
        socket.emit('agents:joined', { success: true });
      }
    });
    
    // Test endpoint for debugging
    socket.on('ping', (data) => {
      logger.debug('🏓 Ping received:', { socketId: socket.id, data });
      socket.emit('pong', { 
        ...data, 
        serverTime: Date.now(),
        socketId: socket.id 
      });
    });
    
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id}, Reason: ${reason}`);
      
      // Clean up user-specific rooms
      if (socket.user?._id) {
        socket.leave(`user:${socket.user._id}`);
      }
      socket.leave('agents');
    });
    
    socket.on('error', (error) => {
      logger.error(`❌ Socket error on ${socket.id}:`, error);
    });
  });
}

function getSocket() {
  if (!ioInstance) {
    logger.warn("⚠️ getSocket() used before initSocket()");
  }
  return ioInstance;
}

// Helper function to emit to ticket room
function emitToTicket(ticketId, event, data) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot emit - Socket.IO not initialized");
    return false;
  }
  
  if (!ticketId) {
    logger.warn("⚠️ Cannot emit - No ticketId provided");
    return false;
  }
  
  const room = `ticket:${ticketId}`;
  
  // Log detailed info for ticket:comment events
  if (event === 'ticket:comment') {
    logger.info(`📡 Emitting ${event} to ${room}`, {
      ticketId,
      commentId: data?._id?.substring(0, 8),
      reply: data?.reply,
      replyEmail: data?.replyEmail,
      fromAgent: data?.fromAgent,
      userId: data?.userId?._id || data?.userId,
      textPreview: data?.text?.substring(0, 50)
    });
  } else {
    logger.debug(`📡 Emitting ${event} to ${room}`, {
      ticketId,
      dataType: typeof data,
      dataId: data?._id || 'unknown'
    });
  }
  
  ioInstance.to(room).emit(event, data);
  return true;
}

// Emit to specific user
function emitToUser(userId, event, data) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot emit - Socket.IO not initialized");
    return false;
  }
  
  if (!userId) {
    logger.warn("⚠️ Cannot emit - No userId provided");
    return false;
  }
  
  const room = `user:${userId}`;
  logger.debug(`📡 Emitting ${event} to ${room}`);
  
  ioInstance.to(room).emit(event, data);
  return true;
}

// Emit to all agents
function emitToAgents(event, data) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot emit - Socket.IO not initialized");
    return false;
  }
  
  logger.debug(`📡 Emitting ${event} to agents room`);
  ioInstance.to("agents").emit(event, data);
  return true;
}

// Emit to everyone
function emitToAll(event, data) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot emit - Socket.IO not initialized");
    return false;
  }
  
  logger.info(`📡 Emitting ${event} to all connected clients`);
  ioInstance.emit(event, data);
  return true;
}

// Get connected clients in a room
function getClientsInRoom(roomName) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot get clients - Socket.IO not initialized");
    return [];
  }
  
  const room = ioInstance.sockets.adapter.rooms.get(roomName);
  return room ? Array.from(room) : [];
}

// Check if socket is connected to a room
function isSocketInRoom(socketId, roomName) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot check room - Socket.IO not initialized");
    return false;
  }
  
  const room = ioInstance.sockets.adapter.rooms.get(roomName);
  return room ? room.has(socketId) : false;
}

// Get all rooms for a socket
function getSocketRooms(socketId) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot get rooms - Socket.IO not initialized");
    return [];
  }
  
  const socket = ioInstance.sockets.sockets.get(socketId);
  return socket ? Array.from(socket.rooms) : [];
}

// Check if room exists
function roomExists(roomName) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot check room - Socket.IO not initialized");
    return false;
  }
  
  const room = ioInstance.sockets.adapter.rooms.get(roomName);
  return !!room;
}

// Get count of clients in a room
function getRoomClientCount(roomName) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot get room count - Socket.IO not initialized");
    return 0;
  }
  
  const room = ioInstance.sockets.adapter.rooms.get(roomName);
  return room ? room.size : 0;
}

// Broadcast to multiple rooms
function emitToRooms(roomNames, event, data) {
  if (!ioInstance) {
    logger.warn("⚠️ Cannot emit - Socket.IO not initialized");
    return false;
  }
  
  if (!Array.isArray(roomNames) || roomNames.length === 0) {
    logger.warn("⚠️ Cannot emit - No rooms provided");
    return false;
  }
  
  logger.debug(`📡 Emitting ${event} to ${roomNames.length} rooms`);
  
  roomNames.forEach(roomName => {
    ioInstance.to(roomName).emit(event, data);
  });
  
  return true;
}

module.exports = { 
  initSocket, 
  getSocket,
  emitToTicket,
  emitToUser,
  emitToAgents,
  emitToAll,
  getClientsInRoom,
  isSocketInRoom,
  getSocketRooms,
  roomExists,
  getRoomClientCount,
  emitToRooms
};