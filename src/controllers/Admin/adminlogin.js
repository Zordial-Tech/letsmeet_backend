const pool = require('../../config/dbconfig');
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');

exports.registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { rows: existing } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const encryptedPassword = encryptPassword(password);

    await pool.query(
      "INSERT INTO admins (email, password) VALUES ($1, $2)",
      [email, encryptedPassword]
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, password_hash AS password, role_id 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Check if the role_id is 1 (admin)
    if (user.role_id !== 1) {
      return res.status(403).json({ message: "Access denied. Not an admin." });
    }

    const decryptedPassword = decryptPassword(user.password);

    if (decryptedPassword !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
