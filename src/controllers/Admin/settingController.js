const pool = require('../../config/dbConfig'); // PostgreSQL connection

exports.checkConnectionStatus = async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT connections_enabled FROM settings LIMIT 1`);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Settings not found" });
        }

        res.json({
            connections_enabled: rows[0].connections_enabled
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.toggleConnectionStatus = async (req, res) => {
    try {
        const { enabled } = req.body;  // JSON input: { "enabled": true } or { "enabled": false }
        
        if (typeof enabled !== "boolean") {
            return res.status(400).json({ error: "Invalid input, 'enabled' must be true or false" });
        }

        await pool.query(`UPDATE settings SET connections_enabled = $1`, [enabled]);

        res.json({
            message: `Connection sending has been ${enabled ? "enabled" : "disabled"} successfully.`,
            connections_enabled: enabled
        });
    } catch (error) {   
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getCheckInDistance = async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT check_in_distance FROM settings LIMIT 1`);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Setting not found" });
        }

        res.json({ check_in_distance: rows[0].check_in_distance });
    } catch (error) {
        console.error("Error fetching check-in distance:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateCheckInDistance = async (req, res) => {
    const { check_in_distance } = req.body;

    if (!Number.isInteger(check_in_distance) || check_in_distance < 0) {
        return res.status(400).json({ error: "Invalid check_in_distance value" });
    }

    try {
        await pool.query(`UPDATE settings SET check_in_distance = $1`, [check_in_distance]);

        res.json({ message: "Check-in distance updated successfully", check_in_distance });
    } catch (error) {
        console.error("Error updating check-in distance:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
