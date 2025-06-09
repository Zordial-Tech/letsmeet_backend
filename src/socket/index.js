const jwt = require('jsonwebtoken');
const pool = require('../config/dbconfig');

module.exports = (io, logger) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // replace with your secret
      socket.userId = decoded.id;  // store userId on socket
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });


  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}, userId: ${socket.userId}`);

    socket.join(`user_${socket.userId}`);

    socket.on('fetch_chat', async ({ peer_id }) => {
      try {
        const userId = socket.userId;
        if (userId === peer_id) return;

        const chatResult = await pool.query(`
          SELECT id FROM chats
          WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
        `, [userId, peer_id]);

        if (chatResult.rowCount === 0) {
          return socket.emit('chat_not_found');
        }

        const chatId = chatResult.rows[0].id;

        const messages = await pool.query(`
          SELECT sender_id, content, sent_at
          FROM messages
          WHERE chat_id = $1
          ORDER BY sent_at ASC
        `, [chatId]);

        socket.emit('chat_data', { chat_id: chatId, messages: messages.rows });

      } catch (err) {
        logger.error('Error in fetch_chat:', err);
        socket.emit('chat_error', { message: 'Failed to fetch chat.' });
      }
    });

    socket.on('send_message', async ({ to, content }) => {
      try {
        const from = socket.userId;
        if (!content?.trim() || from === to) return;

        let chatResult = await pool.query(`
          SELECT id FROM chats
          WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
        `, [from, to]);

        let chatId = chatResult.rows[0]?.id;

        if (!chatId) {
          const newChat = await pool.query(`
            INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id
          `, [from, to]);
          chatId = newChat.rows[0].id;
        }

        const messageResult = await pool.query(`
          INSERT INTO messages (chat_id, sender_id, content, sent_at)
          VALUES ($1, $2, $3, NOW()) RETURNING id, sender_id, content, sent_at
        `, [chatId, from, content]);

        const message = messageResult.rows[0];
        const messagePayload = { chat_id: chatId, ...message };

        socket.emit('message_sent', messagePayload);
        io.to(`user_${to}`).emit('receive_message', messagePayload);

      } catch (err) {
        logger.error('Error in send_message:', err);
        socket.emit('message_error', { message: 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
