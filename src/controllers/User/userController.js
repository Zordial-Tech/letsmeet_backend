const pool = require('../../config/dbconfig');
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');
const multer = require('multer');
const upload = multer(); 


exports.registerUser = [
  upload.single('photo'),

  async (req, res) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      linkedin_url,
      role_id,
      attendees_role,
      preference
    } = req.body;

    try {
      const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const encryptedPassword = encryptPassword(password);

      const photo = req.file ? req.file.buffer : null;

      const result = await pool.query(
        `INSERT INTO users 
        (first_name, middle_name, last_name, email, password_hash, linkedin_url, role_id, attendees_role, preference, photo) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          first_name,
          middle_name || null,
          last_name,
          email,
          encryptedPassword,
          linkedin_url,
          role_id,
          attendees_role,
          preference,
          photo
        ]
      );

      res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
    } catch (error) {
      console.error('Register Error:', error);
      res.status(500).json({ message: 'Internal server error', details: error.message });
    }
  }
];


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

try {
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = userRes.rows[0];
  const decryptedPassword = decryptPassword(user.password_hash);

  if (decryptedPassword !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.status(200).json({ message: 'Login successful', token });

} catch (error) {
  console.error('Login Error:', error);
  res.status(500).json({ message: 'Server error' });
}
};


exports.getUserRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT role_name FROM attendeesrolelist');
    const roles = result.rows.map(r => r.role_name);

    res.status(200).json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.username,
        u.email,
        u.status,
        u.role_id,
        r.role_name,
        u.created_at,
        u.updated_at,
        u.attendees_role,
        u.linkedin_url,
        u.block_status,
        u.preference,
        u.photo
      FROM users u
      LEFT JOIN userroles r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    let base64Photo = null;
    if (user.photo) {
      const mimeType = "image/png";
      base64Photo = `data:${mimeType};base64,${user.photo.toString('base64')}`;
    }

    res.status(200).json({
      user: {
        ...user,
        photo: base64Photo
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.editUserProfile = [
  upload.single('photo'), 

  async (req, res) => {
    const userId = req.user.id;

    const {
      first_name,
      middle_name,
      last_name,
      email,
      password,
      linkedin_url,
      role_id,
      attendees_role,
      preference
    } = req.body;

    try {
      const existingEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }

      const encryptedPassword = password ? encryptPassword(password) : null;

      const photo = req.file ? req.file.buffer : null;

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (first_name) { updateFields.push(`first_name = $${paramIndex++}`); updateValues.push(first_name); }
      if (middle_name !== undefined) { updateFields.push(`middle_name = $${paramIndex++}`); updateValues.push(middle_name); }
      if (last_name) { updateFields.push(`last_name = $${paramIndex++}`); updateValues.push(last_name); }
      if (email) { updateFields.push(`email = $${paramIndex++}`); updateValues.push(email); }
      if (encryptedPassword) { updateFields.push(`password_hash = $${paramIndex++}`); updateValues.push(encryptedPassword); }
      if (linkedin_url) { updateFields.push(`linkedin_url = $${paramIndex++}`); updateValues.push(linkedin_url); }
      if (role_id) { updateFields.push(`role_id = $${paramIndex++}`); updateValues.push(role_id); }
      if (attendees_role) { updateFields.push(`attendees_role = $${paramIndex++}`); updateValues.push(attendees_role); }
      if (preference) { updateFields.push(`preference = $${paramIndex++}`); updateValues.push(preference); }
      if (photo) { updateFields.push(`photo = $${paramIndex++}`); updateValues.push(photo); }

      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      updateValues.push(userId);

      const updateQuery = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await pool.query(updateQuery, updateValues);

      res.status(200).json({ message: 'User profile updated successfully' });

    } catch (error) {
      console.error('Edit Profile Error:', error);
      res.status(500).json({ message: 'Internal server error', details: error.message });
    }
  }
];


