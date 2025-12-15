
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const activeUsers = new Map();
  const roomUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on('user:join', ({ walletAddress, username }) => {
      activeUsers.set(socket.id, { walletAddress, username, socketId: socket.id });
      socket.walletAddress = walletAddress;
      socket.username = username;

      console.log(`👤 User ${username} (${walletAddress}) joined`);
      io.emit('users:update', Array.from(activeUsers.values()));
    });

    socket.on('room:join', ({ roomId, walletAddress, username }) => {
      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);

      io.to(roomId).emit('room:user-joined', {
        roomId,
        user: { walletAddress, username, socketId: socket.id }
      });

      console.log(`📩 ${username} joined room: ${roomId}`);
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);

      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
      }

      io.to(roomId).emit('room:user-left', {
        roomId,
        user: { socketId: socket.id, username: socket.username }
      });

      console.log(`📤 ${socket.username} left room: ${roomId}`);
    });

    socket.on('message:send', ({ roomId, message, senderAddress, senderName }) => {
      const messageData = {
        id: `${Date.now()}-${socket.id}`,
        roomId,
        content: message,
        senderAddress,
        senderName,
        timestamp: new Date().toISOString()
      };
      io.to(roomId).emit('message:received', messageData);

      console.log(`💬 Message in room ${roomId}: ${message.substring(0, 50)}...`);
    });
    socket.on('typing:start', ({ roomId, username }) => {
      socket.to(roomId).emit('typing:user', { username, isTyping: true });
    });

    socket.on('typing:stop', ({ roomId, username }) => {
      socket.to(roomId).emit('typing:user', { username, isTyping: false });
    });

    socket.on('webrtc:offer', ({ roomId, offer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc:offer', {
        offer,
        fromSocketId: socket.id,
        fromUsername: socket.username
      });
    });

    socket.on('webrtc:answer', ({ roomId, answer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc:answer', {
        answer,
        fromSocketId: socket.id
      });
    });

    socket.on('webrtc:ice-candidate', ({ candidate, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        candidate,
        fromSocketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          io.to(roomId).emit('room:user-left', {
            roomId,
            user: { socketId: socket.id, username: socket.username }
          });
        }
      });

      io.emit('users:update', Array.from(activeUsers.values()));

      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 DecentGigs Server Ready!');
      console.log('='.repeat(60));
      console.log(`📡 Next.js: http://${hostname}:${port}`);
      console.log(`💬 Socket.IO: Connected`);
      console.log(`🌐 Network: Cardano Preprod`);
      console.log('='.repeat(60) + '\n');
    });
});
