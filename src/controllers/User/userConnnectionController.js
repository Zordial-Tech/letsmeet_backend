const pool = require('../../config/dbconfig');
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');
const multer = require('multer');
const upload = multer(); // For handling multipart/form-data
const { haversineDistance } = require('../../utils/location');

exports.sendConnectionRequest = async (req, res) => {
    try {
      const senderId = req.user.id;
      const { receiver_id } = req.body;
  
      if (!receiver_id || receiver_id === senderId) {
        return res.status(400).json({ message: 'Valid receiver_id is required' });
      }
  
      // Check if a connection or request already exists
      const checkQuery = `
        SELECT 1 FROM userconnections
        WHERE 
          (user1_id = $1 AND user2_id = $2)
          OR 
          (user1_id = $2 AND user2_id = $1)
      `;
      const existing = await pool.query(checkQuery, [senderId, receiver_id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Connection or request already exists' });
      }
  
      // Insert the connection request
      const insertQuery = `
        INSERT INTO userconnections (user1_id, user2_id, status, created_at)
        VALUES ($1, $2, 'pending', NOW())
      `;
      await pool.query(insertQuery, [senderId, receiver_id]);
  
      res.status(200).json({ message: 'Connection request sent' });
  
    } catch (error) {
      console.error('Error sending request:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  
  exports.respondToConnectionRequest = async (req, res) => {
    try {
      const receiverId = req.user.id;
      const { action } = req.body; // "approved" or "rejected"
      const { userId: senderId } = req.params;
  
      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }
  
      if (action === 'approved') {
        const updateQuery = `
          UPDATE userconnections
          SET status = 'approved'
          WHERE user1_id = $1 AND user2_id = $2
            AND status = 'pending'
        `;
        await pool.query(updateQuery, [senderId, receiverId]);
        return res.status(200).json({ message: 'Request approved' });
      }
  
      if (action === 'rejected') {
        const deleteQuery = `
          DELETE FROM userconnections
          WHERE user1_id = $1 AND user2_id = $2
            AND status = 'pending'
        `;
        await pool.query(deleteQuery, [senderId, receiverId]);
        return res.status(200).json({ message: 'Request rejected' });
      }
  
    } catch (error) {
      console.error('Error responding to request:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  exports.getPendingConnectionRequests = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          ENCODE(u.photo, 'base64') AS photo_base64,
          u.linkedin_url,
          u.attendees_role AS role
        FROM userconnections uc
        INNER JOIN users u ON u.id = uc.user1_id
        WHERE uc.user2_id = $1
          AND uc.status = 'pending'
      `;
  
      const result = await pool.query(query, [userId]);
  
      res.status(200).json({
        pending_requests: result.rows.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          photo: user.photo_base64,
          linkedin_url: user.linkedin_url,
          role: user.role || 'unknown'
        }))
      });
  
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  