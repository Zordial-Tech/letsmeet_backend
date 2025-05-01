const pool = require('../../config/dbconfig'); // PostgreSQL connection
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const userSecretKey = "yourCustomSecretKey!123"; // Can be any length
const secretKey = crypto.createHash("sha256").update(userSecretKey).digest("base64").substring(0, 32); // Fixed 32-byte key

// Encrypt Password
const encryptPassword = (password) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + encrypted; // Store IV with encrypted data
};

// Decrypt Password
const decryptPassword = (encryptedPassword) => {
    try {
        const iv = Buffer.from(encryptedPassword.substring(0, 32), "hex"); // Extract IV
        const encryptedData = encryptedPassword.substring(32); // Extract encrypted data
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "Decryption Error";
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const { first_name, middle_name, last_name, username, email, password, role_id, attendees_role, photo, linkedin_url } = req.body;

        console.log("🔹 Incoming Request:", req.body);

        if (!first_name || !last_name || !email || !password || !role_id || !attendees_role || !linkedin_url) {
            console.log("Missing fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if role exists
        const roleCheck = await pool.query("SELECT id FROM UserRoles WHERE id = $1", [role_id]);
        if (roleCheck.rows.length === 0) {
            console.log("Invalid role_id:", role_id);
            return res.status(400).json({ error: "Invalid role_id" });
        }

        const encryptedPassword = encryptPassword(password);
        console.log("🔹 Password Encrypted Successfully");

        const result = await pool.query(
            `INSERT INTO Users (first_name, middle_name, last_name, username, email, password_hash, photo, role_id, attendees_role, linkedin_url, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW()) 
             RETURNING *`,
            [first_name, middle_name || null, last_name, username || null, email, encryptedPassword, photo || null, role_id, attendees_role, linkedin_url]
        );

        console.log("User Created Successfully:", result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: error.message || "Error creating user" });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

        let user = result.rows[0];
        user.password_hash = decryptPassword(user.password_hash); // Decrypt before sending

        res.json(user);
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error fetching user" });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, middle_name, last_name, username, email, password, role_id, attendees_role, photo, linkedin_url } = req.body;

        let encryptedPassword = null;
        if (password) {
            encryptedPassword = encryptPassword(password);
        }

        const result = await pool.query(
            `UPDATE Users 
             SET first_name = $1, middle_name = $2, last_name = $3, username = $4, email = $5, password_hash = COALESCE($6, password_hash), 
                 role_id = $7, attendees_role = $8, linkedin_url = $9, photo = $10, updated_at = NOW() 
             WHERE id = $11 RETURNING *`,
            [first_name, middle_name || null, last_name, username || null, email, encryptedPassword, role_id, attendees_role, linkedin_url, photo || null, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

        let user = result.rows[0];
        user.password_hash = decryptPassword(user.password_hash); // Decrypt before sending

        res.json(user);
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error updating user" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error deleting user" });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Users');

        const users = result.rows.map(user => ({
            ...user,
            password_hash: decryptPassword(user.password_hash) // Decrypt passwords
        }));

        res.json(users);
    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error fetching users" });
    }
};

exports.getUserCount = async (req, res) => {
    try {
        let { year } = req.query;

        // Get the current year
        const currentYear = new Date().getFullYear();

        // Convert "current" and "previous" to actual numbers
        if (year === "current") {
            year = currentYear;
        } else if (year === "previous") {
            year = currentYear - 1;
        } else {
            return res.status(400).json({ error: "Invalid year parameter. Use 'current' or 'previous'." });
        }

        // ✅ Query to get user count per month
        const result = await pool.query(
            `SELECT 
                CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) AS month,
                COUNT(*) AS total_users
             FROM users
             WHERE EXTRACT(YEAR FROM created_at) = $1
             GROUP BY month
             ORDER BY month`,
            [year]
        );

        // Create a default array for all 12 months, setting users to 0 initially
        let userCounts = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            total_users: 0
        }));

        // Fill in the actual user data where available
        result.rows.forEach(row => {
            userCounts[row.month - 1].total_users = parseInt(row.total_users, 10);
        });

        console.log("User count per month:", userCounts);

        // Return structured response
        res.json({ year, data: userCounts });

    } catch (error) {
        console.error("Database error:", error);

        // Handle PostgreSQL errors
        if (error.code === '22P02') {
            return res.status(400).json({ error: "Invalid data type in query parameters." });
        }

        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

  exports.getUserStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id AS user_id,
                u.first_name,
                u.last_name,
                COUNT(DISTINCT ea.event_id) AS total_attended_events,
                COUNT(DISTINCT CASE WHEN uc.status IN ('approved', 'requested', 'pending') THEN uc.id END) AS total_connections
            FROM users u
            LEFT JOIN eventattendees ea ON u.id = ea.user_id
            LEFT JOIN userconnections uc ON u.id = uc.user1_id OR u.id = uc.user2_id
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY u.id;
        `);

        res.json({
            data: result.rows
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.getUserConnectionsInAttendedEvents = async (req, res) => {
    try {
        const { userId } = req.params;

        // Query to get all attended events and their total connections
        const result = await pool.query(
            `SELECT ea.event_id, 
                    COUNT(uc.id) AS total_connections
             FROM eventattendees ea
             LEFT JOIN userconnections uc 
                 ON (uc.user1_id = $1 OR uc.user2_id = $1)
                 AND uc.created_at >= (SELECT start_date_time FROM events WHERE id = ea.event_id)
                 AND uc.created_at <= (SELECT end_date_time FROM events WHERE id = ea.event_id)
             WHERE ea.user_id = $1
             GROUP BY ea.event_id
             ORDER BY ea.event_id`,
            [userId]
        );

        res.json({
            user_id: userId,
            events: result.rows.map(row => ({
                event_id: row.event_id,
                total_connections: parseInt(row.total_connections, 10) || 0
            }))
        });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.getUserEventConnections = async (req, res) => {
    try {
        const { userId, eventId } = req.params;

        // Fetch user connections in a specific event
        const result = await pool.query(
            `SELECT 
                u.id AS user_id,
                u.first_name,
                u.last_name,
                ur.role_name AS role,
                uc.status,
                TO_CHAR(uc.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
            FROM userconnections uc
            JOIN users u ON (uc.user1_id = u.id OR uc.user2_id = u.id)
            LEFT JOIN userroles ur ON u.role_id = ur.id
            WHERE (uc.user1_id = $1 OR uc.user2_id = $1)
            AND u.id != $1
            AND uc.created_at >= (SELECT start_date_time FROM events WHERE id = $2)
            AND uc.created_at <= (SELECT end_date_time FROM events WHERE id = $2)
            ORDER BY uc.created_at DESC`,
            [userId, eventId]
        );

        res.json({
            user_id: userId,
            event_id: eventId,
            connections: result.rows
        });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.getAllUsersblcokedStatus = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id AS user_id, 
                    CONCAT(first_name, ' ', last_name) AS user_name, 
                    block_status 
             FROM users;`
        );

        res.json({ message: "Users fetched successfully.", users: rows });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.setUserBlockStatus = async (req, res) => {
    try {
        const { id } = req.body;
        const { block_status } = req.body; // Expecting 'blocked' or 'unblocked'

        // Validate input
        if (!["blocked", "unblocked"].includes(block_status)) {
            return res.status(400).json({ error: "Invalid status. Use 'blocked' or 'unblocked'." });
        }

        // Check if user exists
        const userCheck = await pool.query(`SELECT id FROM users WHERE id = $1;`, [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        // Update block status
        await pool.query(`UPDATE users SET block_status = $1 WHERE id = $2;`, [block_status, id]);

        res.json({ message: `User ${id} is now ${block_status}.`, new_status: block_status });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};
exports.getAttendedEventsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate user
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch events attended by the user using eventattendees table
    const events = await pool.query(
      `SELECT 
         e.id, 
         e.name_text, 
         e.description_text, 
         e.start_date_time, 
         e.end_date_time, 
         e.status
       FROM eventattendees ea
       JOIN events e ON ea.event_id = e.id
       WHERE ea.user_id = $1`,
      [userId]
    );

    res.status(200).json({
      message: 'Attended events fetched successfully',
      events: events.rows
    });

  } catch (error) {
    console.error('Error fetching attended events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getAttendedEventsByUser = async (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    const result = await pool.query(
      `SELECT e.*
       FROM events e
       JOIN eventattendees ea ON e.id = ea.event_id
       WHERE ea.user_id = $1`,
      [userId]
    );

    res.status(200).json({ events: result.rows });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events' });
  }
};
