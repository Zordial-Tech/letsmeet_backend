const Connection = require('../../models/connection.js');
const pool = require('../../config/dbconfig'); // PostgreSQL connection

exports.sendConnectionRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    await Connection.create({ senderId, receiverId, status: 'pending' });

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending request', error });
  }
};

exports.acceptConnection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Connection.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    await request.save();
    res.json({ message: 'Connection accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting connection', error });
  }
};

exports.getAllConnections = async (req, res) => {
  try {
      const result = await pool.query(
          `SELECT 
              uc.id AS connection_id,
              u1.id AS user1_id,
              u1.first_name AS user1_first_name,
              u1.last_name AS user1_last_name,
              r1.role_name AS user1_role,
              u2.id AS user2_id,
              u2.first_name AS user2_first_name,
              u2.last_name AS user2_last_name,
              r2.role_name AS user2_role,
              uc.status,
              TO_CHAR(uc.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
          FROM userconnections uc
          JOIN users u1 ON uc.user1_id = u1.id
          LEFT JOIN userroles r1 ON u1.role_id = r1.id
          JOIN users u2 ON uc.user2_id = u2.id
          LEFT JOIN userroles r2 ON u2.role_id = r2.id
          ORDER BY uc.created_at DESC`
      );

      res.json(result.rows);

  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

exports.getUserConnectionsRanking = async (req, res) => {
  try {
      let { user_id } = req.params; // User ID from params

      const query = `
          SELECT 
              u.id AS user_id,
              u.first_name || ' ' || u.last_name AS full_name,
              COUNT(uc.id) AS total_connections
          FROM users u
          LEFT JOIN userconnections uc 
              ON (u.id = uc.user1_id OR u.id = uc.user2_id)
          GROUP BY u.id
          ORDER BY total_connections DESC;
      `;

      const result = await pool.query(query);

      // If user_id is provided, filter for that specific user
      if (user_id) {
          const user = result.rows.find(row => row.user_id == user_id);
          if (!user) {
              return res.status(404).json({ error: "User not found or has no connections." });
          }
          return res.json(user);
      }

      res.json(result.rows);

  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

exports.getConnectionCount = async (req, res) => {
  try {
      const { year } = req.query;

      // Get the actual year value
      let selectedYear;
      if (year === "current") {
          selectedYear = new Date().getFullYear();
      } else if (year === "previous") {
          selectedYear = new Date().getFullYear() - 1;
      } else {
          return res.status(400).json({ error: "Invalid year parameter. Use 'current' or 'previous'." });
      }

      const { rows } = await pool.query(
          `SELECT 
              EXTRACT(MONTH FROM created_at) AS month,
              COUNT(*) AS total_connections
           FROM userconnections
           WHERE EXTRACT(YEAR FROM created_at) = $1
           GROUP BY month
           ORDER BY month ASC`,  
          [selectedYear]
      );

      // Initialize all months with zero connections
      let connectionCounts = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total_connections: 0
      }));

      // Update months that have data
      rows.forEach(row => {
          connectionCounts[row.month - 1].total_connections = parseInt(row.total_connections, 10);
      });

      // Prepare response
      res.json({
          year: selectedYear,
          data: connectionCounts
      });

  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Internal server error" });
  }
};
