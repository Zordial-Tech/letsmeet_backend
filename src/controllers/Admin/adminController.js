const User = require('../../models/User');
const Event = require('../../models/Event');
const pool = require("../../config/dbconfig");


exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'banned';
    await user.save();
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error banning user', error });
  }
};

// ✅ Add a new role
exports.addRole = async (req, res) => {
    const { role_name } = req.body;

    if (!role_name || role_name.trim() === "") {
        return res.status(400).json({ error: "Role name is required" });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO attendeesrolelist (role_name) VALUES ($1) RETURNING *`,
            [role_name]
        );

        res.status(201).json({ message: "Role added successfully", role: rows[0] });
    } catch (error) {
        console.error("Error adding role:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Delete a role
exports.deleteRole = async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
    }

    try {
        const { rowCount } = await pool.query(
            `DELETE FROM attendeesrolelist WHERE id = $1`,
            [id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "Role not found" });
        }

        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Get all roles
exports.getRoles = async (req, res) => {
  try {
      const { rows } = await pool.query(`SELECT * FROM attendeesrolelist ORDER BY id ASC`);

      res.json({ roles: rows });
  } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Internal server error" });
  }
};
