const pool = require('../../config/dbconfig');
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');
const multer = require('multer');
const upload = multer(); // For handling multipart/form-data
const { haversineDistance } = require('../../utils/location');


exports.getApprovedConnectionsWithLastMessage = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const query = `
        SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        ENCODE(u.photo, 'base64') AS photo_base64,
        u.linkedin_url,
        c.id AS chat_id,
        m.content AS last_message,
        m.sent_at AS last_message_time
        FROM userconnections uc
        INNER JOIN users u 
        ON u.id = CASE 
                    WHEN uc.user1_id = $1 THEN uc.user2_id 
                    ELSE uc.user1_id 
                    END
        LEFT JOIN chats c 
        ON (uc.user1_id = c.user1_id AND uc.user2_id = c.user2_id)
        OR (uc.user1_id = c.user2_id AND uc.user2_id = c.user1_id)
        LEFT JOIN LATERAL (
        SELECT content, sent_at 
        FROM messages 
        WHERE chat_id = c.id 
        ORDER BY sent_at DESC 
        LIMIT 1
        ) m ON true
        WHERE (uc.user1_id = $1 OR uc.user2_id = $1)
        AND uc.status = 'approved'
      `;
  
      const result = await pool.query(query, [userId]);
  
      const connections = result.rows.map(row => ({
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        photo: row.photo_base64,
        linkedin_url: row.linkedin_url,
        chat_id: row.chat_id,
        last_message: row.last_message || null,
        last_message_time: row.last_message_time || null
      }));
  
      res.status(200).json({ connections });
    } catch (error) {
      console.error('Error fetching approved connections:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  exports.getChatWithUser = async (req, res) => {
    const userId = req.user.id;
    const peer_id = parseInt(req.params.peer_id);
  
    if (userId === peer_id) {
      return res.status(400).json({ message: "Cannot fetch chat with yourself." });
    }
  
    try {
      const chatResult = await pool.query(`
        SELECT id FROM chats
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [userId, peer_id]);
  
      if (chatResult.rowCount === 0) {
        return res.status(404).json({ message: "Chat not found" });
      }
  
      const chatId = chatResult.rows[0].id;
  
      const messages = await pool.query(`
        SELECT sender_id, content, sent_at
        FROM messages
        WHERE chat_id = $1
        ORDER BY sent_at ASC
      `, [chatId]);
  
      res.status(200).json({ chat_id: chatId, messages: messages.rows });
    } catch (err) {
      console.error("Error fetching chat:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  

  exports.sendMessageToUser = async (req, res) => {
    const senderId = req.user.id;
    const peer_id = parseInt(req.params.peer_id);
    const { content } = req.body;
  
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Message content cannot be empty." });
    }
  
    if (senderId === peer_id) {
      return res.status(400).json({ message: "You cannot send messages to yourself." });
    }
  
    try {
      // 1. Find or create chat between users
      let chatResult = await pool.query(`
        SELECT id FROM chats
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [senderId, peer_id]);
  
      let chatId;
  
      if (chatResult.rowCount === 0) {
        // Create chat if not found
        const newChat = await pool.query(`
          INSERT INTO chats (user1_id, user2_id)
          VALUES ($1, $2)
          RETURNING id
        `, [senderId, peer_id]);
  
        chatId = newChat.rows[0].id;
      } else {
        chatId = chatResult.rows[0].id;
      }
  
      // 2. Insert the new message
      const messageResult = await pool.query(`
        INSERT INTO messages (chat_id, sender_id, content, sent_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, sender_id, content, sent_at
      `, [chatId, senderId, content]);
  
      const message = messageResult.rows[0];
  
      res.status(201).json({
        chat_id: chatId,
        message: {
          id: message.id,
          sender_id: message.sender_id,
          content: message.content,
          sent_at: message.sent_at
        }
      });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  };

 exports.deleteChat = async (req, res) => {
    const userId = req.user.id;
    const { peer_id } = req.params;
  
    try {
      // 1. Find the chat between the users
      const chatResult = await pool.query(`
        SELECT id FROM chats
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
      `, [userId, peer_id]);
  
      if (chatResult.rowCount === 0) {
        return res.status(404).json({ message: "Chat not found." });
      }
  
      const chatId = chatResult.rows[0].id;
  
      // 2. Delete the chat
      await pool.query(`
        DELETE FROM chats
        WHERE id = $1
      `, [chatId]);
  
      res.status(200).json({ message: "Chat deleted." });
    } catch (err) {
      console.error("Error deleting chat:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  