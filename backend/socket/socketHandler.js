const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join role-based rooms
    socket.on('joinRoom', (role) => {
      socket.join(role);
      console.log(`User joined room: ${role}`);
    });

    // Kitchen updates item status
    socket.on('updateItemStatus', (data) => {
      io.emit('orderStatusUpdated', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
