const pool = require('../../config/dbconfig'); // PostgreSQL connection
const crypto = require("crypto");
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');


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
        let { first_name, middle_name, last_name, username, email, password, role_id, attendees_role, photo, linkedin_url } = req.body;

        // Normalize empty strings
        if (linkedin_url === "") linkedin_url = null;
        if (photo === "") photo = null;
        if (username === "") username = null;
        if (middle_name === "") middle_name = null;

        // Step 1: Check if the linkedin_url is used by another user (case-insensitive)
        if (linkedin_url) {
            const linkedinCheck = await pool.query(
                `SELECT id FROM Users WHERE LOWER(linkedin_url) = LOWER($1) AND id != $2`,
                [linkedin_url, id]
            );

            if (linkedinCheck.rows.length > 0) {
                return res.status(400).json({ error: "LinkedIn URL already used by another user." });
            }
        }

        // Step 2: Encrypt password if provided
        let encryptedPassword = null;
        if (password) {
            encryptedPassword = encryptPassword(password);
        }

        // Step 3: Update user
        const result = await pool.query(
            `UPDATE Users 
             SET first_name = $1, middle_name = $2, last_name = $3, username = $4, email = $5, 
                 password_hash = COALESCE($6, password_hash), 
                 role_id = $7, attendees_role = $8, linkedin_url = $9, photo = $10, updated_at = NOW() 
             WHERE id = $11 RETURNING *`,
            [
                first_name,
                middle_name,
                last_name,
                username,
                email,
                encryptedPassword,
                role_id,
                attendees_role,
                linkedin_url,
                photo,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        let user = result.rows[0];

        if (encryptedPassword) {
            user.password_hash = decryptPassword(user.password_hash);
        }

        res.json(user);

    } catch (error) {
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error updating user" });
    }
};


// Delete user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // Optional: Validate ID
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        await pool.query('BEGIN');

        // Delete related entries
        await pool.query(`DELETE FROM public.eventattendees WHERE user_id = $1`, [id]);
        await pool.query(`DELETE FROM eventregistrations WHERE user_id = $1`, [id]);
        await pool.query(`DELETE FROM reports WHERE reported_by = $1 OR reported_user = $1`, [id]);
        await pool.query(`DELETE FROM userconnections WHERE user1_id = $1 OR user2_id = $1`, [id]);
        await pool.query(`DELETE FROM qrcodes WHERE user_id = $1`, [id]);
        await pool.query(`DELETE FROM adminlogs WHERE admin_id = $1`, [id]);

        // Delete user
        const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);

        await pool.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully", deletedUser: result.rows[0] });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Delete User Error:", error.message);
        res.status(500).json({ error: error.message });
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

        //Query to get user count per month
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
                u.linkedin_url,
                u.email,
                u.photo,
                u.preference,
                u.attendees_role,
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

    const query = `
      SELECT 
        u.id AS user_id,
        u.first_name,
        u.last_name,
        ur.role_name AS role,
        uc.status,
        TO_CHAR(uc.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM userconnections uc
      JOIN users u 
        ON (
          (uc.user1_id = $1 AND uc.user2_id = u.id) OR 
          (uc.user2_id = $1 AND uc.user1_id = u.id)
        )
      LEFT JOIN userroles ur ON u.role_id = ur.id
      WHERE (
        EXISTS (
          SELECT 1 FROM eventattendees ea1
          WHERE ea1.user_id = uc.user1_id AND ea1.event_id = $2
        )
        AND
        EXISTS (
          SELECT 1 FROM eventattendees ea2
          WHERE ea2.user_id = uc.user2_id AND ea2.event_id = $2
        )
      )
      ORDER BY uc.created_at DESC
    `;

    const result = await pool.query(query, [userId, eventId]);

    res.json({
      user_id: userId,
      event_id: eventId,
      connections: result.rows,
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
         e.name, 
         e.description, 
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


// userController.js

exports.deleteUsers = async (req, res) => {
    const client = await pool.connect();
    try {
      const { ids } = req.body;
  
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Please provide an array of user IDs to delete." });
      }
  
      // Begin transaction
      await client.query('BEGIN');
  
      // Delete from dependent tables - note explicit schema public.*
      await client.query(`DELETE FROM public.eventattendees WHERE user_id = ANY($1)`, [ids]);
      await client.query(`DELETE FROM public.eventregistrations WHERE user_id = ANY($1)`, [ids]);
    //   await client.query(`DELETE FROM public.aiconnections WHERE user_id = ANY($1) OR recommended_user_id = ANY($1)`, [ids]);
      await client.query(`DELETE FROM public.reports WHERE reported_by = ANY($1) OR reported_user = ANY($1)`, [ids]);
      await client.query(`DELETE FROM public.userconnections WHERE user1_id = ANY($1) OR user2_id = ANY($1)`, [ids]);
      await client.query(`DELETE FROM public.adminlogs WHERE admin_id = ANY($1)`, [ids]);
  
      // Delete users themselves
      const deleteResult = await client.query(`DELETE FROM public.users WHERE id = ANY($1) RETURNING id`, [ids]);
  
      await client.query('COMMIT');
  
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ message: "No users found with the provided IDs." });
      }
  
      res.json({ message: `Deleted ${deleteResult.rowCount} user(s) successfully.`, deletedUserIds: deleteResult.rows.map(r => r.id) });
  
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Delete Users Error:", error);
      res.status(500).json({ error: "Error deleting users" });
    } finally {
      client.release();
    }
  };
  

// attedndee-role-list

exports.getAllAttendeeRoles = async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, role_name FROM attendeesrolelist ORDER BY id ASC;');
      res.json({ message: "Roles fetched successfully.", roles: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  
  
  
  
  

// ADD a new role
exports.addAttendeeRole = async (req, res) => {
  const { role_name } = req.body;

  if (!role_name) {
    return res.status(400).json({ error: "Role name is required" });
  }

  try {
    // Step 1: Find the smallest missing ID
    const gapResult = await pool.query(`
      SELECT COALESCE(MIN(t1.id) + 1, 1) AS available_id
      FROM attendeesrolelist t1
      WHERE NOT EXISTS (
        SELECT 1 FROM attendeesrolelist t2 WHERE t2.id = t1.id + 1
      )
    `);

    let availableId = gapResult.rows[0].available_id;

    // Step 2: Check if 1 is missing (edge case when table starts empty or 1 is deleted)
    const checkOne = await pool.query(`SELECT 1 FROM attendeesrolelist WHERE id = 1`);
    if (checkOne.rows.length === 0) {
      availableId = 1;
    }

    // Step 3: Insert using the manually set ID
    const { rows } = await pool.query(
      `INSERT INTO attendeesrolelist (id, role_name) VALUES ($1, $2) RETURNING id AS role_id`,
      [availableId, role_name]
    );

    res.status(201).json({ message: "Role added successfully.", role: rows[0] });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: "Role name or ID already exists." });
    }

    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


// EDIT role if not assigned
exports.editAttendeeRole = async (req, res) => {
    const roleId = req.params.id;
    const { role_name } = req.body;

    if (!role_name) {
        return res.status(400).json({ error: "Role name is required" });
    }

    try {
        const inUse = await pool.query(
            `SELECT 1 FROM users WHERE id = $1 LIMIT 1;`,
            [roleId]
        );

        if (inUse.rowCount > 0) {
            return res.status(400).json({ error: "Cannot edit role. It is currently assigned to users." });
        }

        await pool.query(
            `UPDATE attendeesrolelist SET role_name = $1 WHERE id = $2;`,
            [role_name, roleId]
        );

        res.json({ message: "Role updated successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// DELETE role if not assigned
exports.deleteAttendeeRole = async (req, res) => {
    const roleId = req.params.id;

    try {
        const inUse = await pool.query(
            `SELECT 1 FROM users WHERE id = $1 LIMIT 1;`,
            [roleId]
        );

        if (inUse.rowCount > 0) {
            return res.status(400).json({ error: "Cannot delete role. It is currently assigned to users." });
        }

        await pool.query(
            `DELETE FROM attendeesrolelist WHERE id = $1;`,
            [roleId]
        );

        res.json({ message: "Role deleted successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const allowedStatuses = ['active', 'inactive', 'banned'];
  
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
  
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
      }
  
      const result = await pool.query(
        `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, first_name, last_name, status`,
        [status, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({
        message: `User status updated to ${status}`,
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Update User Status Error:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  