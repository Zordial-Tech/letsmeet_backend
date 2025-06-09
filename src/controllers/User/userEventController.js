const pool = require('../../config/dbconfig');
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword } = require('../../utils/cryptoHelper');
const multer = require('multer');
const upload = multer(); // For handling multipart/form-data
const { haversineDistance } = require('../../utils/location');



exports.getAllUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    const settingResult = await pool.query(`SELECT check_in_distance FROM settings LIMIT 1`);
    const checkInDistance = settingResult.rows[0]?.check_in_distance || 100; // fallback: 100 meters

    const eventsQuery = `
      SELECT 
        e.*,
        EXISTS (
          SELECT 1 FROM eventregistrations ea 
          WHERE ea.event_id = e.id AND ea.user_id = $1
        ) AS is_registered
      FROM events e
      WHERE e.end_date_time > NOW()
      ORDER BY e.start_date_time ASC
    `;

    const result = await pool.query(eventsQuery, [userId]);
    const events = result.rows;

    const enrichedEvents = events.map(event => {
      const registered = event.is_registered;
      let checkInAvailable = false;

      if (
        registered &&
        latitude &&
        longitude &&
        event.latitude &&
        event.longitude
      ) {
        const distance = haversineDistance(latitude, longitude, event.latitude, event.longitude);

        const now = new Date();
        const start = new Date(event.start_date_time);
        const end = new Date(event.end_date_time);

        if (distance <= checkInDistance && now >= start && now <= end) {
          checkInAvailable = true;
        }
      }

      return {
        ...event,
        is_registered: registered,
        check_in_available: checkInAvailable
      };
    });

    res.status(200).json({ events: enrichedEvents });

  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


  exports.registerForEvent = async (req, res) => {
    const userId = req.user.id;
    const { event_id } = req.body;
  
    if (!event_id) {
      return res.status(400).json({ message: "event_id is required" });
    }
  
    try {
      const exists = await pool.query(
        `SELECT 1 FROM eventregistrations WHERE user_id = $1 AND event_id = $2`,
        [userId, event_id]
      );
  
      if (exists.rowCount > 0) {
        return res.status(400).json({ message: "Already registered for this event" });
      }

      await pool.query(
        `INSERT INTO eventregistrations (user_id, event_id, registered_at, checked_in)
         VALUES ($1, $2, NOW(), false)`,
        [userId, event_id]
      );
  
      res.status(201).json({ message: "Successfully registered for the event" });
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Server error" });
    }
  };


exports.checkInToEvent = async (req, res) => {
    const userId = req.user.id;
    const { event_id } = req.body;
  
    if (!event_id) {
      return res.status(400).json({ message: "event_id is required" });
    }
  
    try {
      const registration = await pool.query(
        `SELECT * FROM eventregistrations WHERE user_id = $1 AND event_id = $2`,
        [userId, event_id]
      );
  
      if (registration.rowCount === 0) {
        return res.status(400).json({ message: "You are not registered for this event" });
      }
  
      if (registration.rows[0].checked_in) {
        return res.status(400).json({ message: "Already checked in" });
      }
      await pool.query(
        `UPDATE eventregistrations SET checked_in = true WHERE user_id = $1 AND event_id = $2`,
        [userId, event_id]
      );
      await pool.query(
        `INSERT INTO eventattendees (user_id, event_id, check_in_time)
         VALUES ($1, $2, NOW())`,
        [userId, event_id]
      );
     
      res.status(200).json({ message: "Check-in successful" });
    } catch (error) {
      console.error("Error during check-in:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  

  exports.getRegisteredEventsWithConnections = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const eventsQuery = `
        SELECT 
          e.*,
          TRUE as is_registered
        FROM events e
        INNER JOIN eventregistrations er ON er.event_id = e.id
        WHERE er.user_id = $1
        ORDER BY e.start_date_time ASC
      `;
      const result = await pool.query(eventsQuery, [userId]);
      const events = result.rows;
  
      const enrichedEvents = await Promise.all(events.map(async (event) => {
        const eventId = event.id;
  
        const connectionsQuery = `
            SELECT 
              COUNT(*) FILTER (WHERE uc.status = 'approved') AS approved,
              COUNT(*) FILTER (WHERE uc.status = 'pending') AS pending,
              COUNT(*) AS total
            FROM userconnections uc
            INNER JOIN eventattendees ea 
              ON uc.user2_id = ea.user_id
            WHERE uc.user1_id = $2
              AND ea.event_id = $1
          `;
  
        const connResult = await pool.query(connectionsQuery, [eventId, userId]);
        const { approved, pending, total } = connResult.rows[0];
  
        return {
          ...event,
          is_registered: true,
          total_connections: parseInt(total, 10),
          approved_requests: parseInt(approved, 10),
          pending_requests: parseInt(pending, 10),
        };
      }));
  
      res.status(200).json({ events: enrichedEvents });
  
    } catch (error) {
      console.error('Error fetching registered events with connections:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  exports.getUsersFromSharedPastEvents = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const query = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          ENCODE(u.photo, 'base64') AS photo_base64,
          u.linkedin_url,
          u.attendees_role AS role 
        FROM eventattendees ea1
        INNER JOIN eventattendees ea2 ON ea1.event_id = ea2.event_id
        INNER JOIN events e ON ea1.event_id = e.id
        INNER JOIN users u ON u.id = ea2.user_id
        WHERE ea1.user_id = $1
          AND ea2.user_id != $1
          AND e.end_date_time > NOW()
          AND NOT EXISTS (
            SELECT 1 FROM userconnections uc
            WHERE 
              (uc.user1_id = $1 AND uc.user2_id = ea2.user_id)
              OR 
              (uc.user1_id = ea2.user_id AND uc.user2_id = $1)
          )
      `;
  
      const result = await pool.query(query, [userId]);
  
      res.status(200).json({
        attended_users: result.rows.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          photo: user.photo_base64,
          linkedin_url: user.linkedin_url,
          role: user.role
        }))
      });
  
    } catch (error) {
      console.error('Error fetching users from shared events:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  


