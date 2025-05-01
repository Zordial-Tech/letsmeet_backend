const pool = require('../../config/dbConfig');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const userSecretKey = "yourCustomSecretKey!123"; // Can be any length
const secretKey = crypto.createHash("sha256").update(userSecretKey).digest("base64").substring(0, 32); // Fixed 32-byte key

const encryptPassword = (password) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + encrypted; // IV + encrypted
};

const decryptPassword = (encryptedPassword) => {
  try {
    const iv = Buffer.from(encryptedPassword.substring(0, 32), "hex");
    const encryptedData = encryptedPassword.substring(32);
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption Failed:", error.message);
    return null;
  }
};

exports.registerUser = async (req, res) => {
  const { first_name, last_name, email, password, linkedin_url, role_id,attendees_role, preference } = req.body;

try {
  const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userExists.rows.length > 0) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const encryptedPassword = encryptPassword(password); // Use your encryption method here

  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, linkedin_url, role_id,attendees_role, preference)
     VALUES ($1, $2, $3, $4, $5, $6,$7,$8) RETURNING id`,
    [first_name, last_name, email, encryptedPassword, linkedin_url, role_id,attendees_role, preference]
  );

  res.status(201).json({ message: 'User registered', userId: result.rows[0].id });

} catch (error) {
  console.error('Register Error:', error);
  res.status(500).json({ message: 'Server error' });
}
};


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
        u.status, -- ✅ Fixed column
        u.role_id,
        r.role_name,
        u.created_at,
        u.updated_at,
        u.attendees_role,
        u.linkedin_url,
        u.block_status,
        u.preference
      FROM users u
      LEFT JOIN userroles r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        description,
        start_date_time,
        end_date_time,
        latitude,
        longitude,
        venue,
        web_page_url,
        banner,
        priority
      FROM events
      WHERE start_date_time > NOW()
      ORDER BY start_date_time ASC
    `;

    const result = await pool.query(query);

    res.status(200).json({ upcoming_events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAttendedEvents = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date_time,
        e.end_date_time,
        e.latitude,
        e.longitude,
        e.venue,
        e.web_page_url,
        e.banner,
        e.priority
      FROM events e
      JOIN eventattendees ea ON e.id = ea.event_id
      WHERE ea.user_id = $1
      ORDER BY e.start_date_time ASC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({ attended_events: result.rows });
  } catch (error) {
    console.error('Error fetching attended events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerForEvent = async (req, res) => {
  const userId = req.user.id;
  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    // Check if already registered
    const check = await pool.query(
      'SELECT * FROM eventregistrations WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Insert into eventregistrations
    await pool.query(
      `INSERT INTO eventregistrations (user_id, event_id, registered_at, checked_in)
       VALUES ($1, $2, NOW(), false)`,
      [userId, event_id]
    );

    res.status(201).json({ message: 'Successfully registered for the event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/eventController.js

exports.checkLocation = async (req, res) => {
  const userId = req.user.id;
  const { event_id, latitude, longitude } = req.body;

  if (!event_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const regCheck = await pool.query(
      'SELECT * FROM eventregistrations WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );

    if (regCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not registered for this event' });
    }

    const eventData = await pool.query(
      'SELECT latitude, longitude FROM events WHERE id = $1',
      [event_id]
    );

    if (eventData.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventLat = eventData.rows[0].latitude;
    const eventLon = eventData.rows[0].longitude;

    const distance = calculateDistance(latitude, longitude, eventLat, eventLon);

    if (distance <= 0.5) {
      return res.json({ message: '✅ You are within 500 meters of the event. Would you like to mark attendance?' });
    }

    // Don't send anything if far away
    return res.status(204).send(); // No content
  } catch (err) {
    console.error('Error checking location:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// location

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

exports.markAttendance = async (req, res) => {
  const userId = req.user.id;
  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({ message: 'Missing event ID' });
  }

  try {
    const regCheck = await pool.query(
      'SELECT * FROM eventregistrations WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );

    if (regCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not registered for this event' });
    }

    await pool.query(
      'INSERT INTO eventattendees (user_id, event_id) VALUES ($1, $2)',
      [userId, event_id]
    );

    await pool.query(
      'UPDATE eventregistrations SET checked_in = TRUE WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );

    res.status(200).json({ message: 'Attendance marked successfully!' });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
