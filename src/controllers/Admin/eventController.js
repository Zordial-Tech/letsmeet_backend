const pool = require('../../config/dbconfig');
const multer = require('multer');
const upload = multer(); 

// Create a new event
exports.createEvent = [
    upload.single('banner'),
  
    async (req, res) => {
      try {
        const {
          name,
          description,
          start_date_time,
          end_date_time,
          latitude,
          longitude,
          venue,
          web_page_url,
          priority,
          status
        } = req.body;
  
        if (!name || !start_date_time || !end_date_time || !venue || !status || !description || !latitude || !longitude) {
          return res.status(400).json({ error: "Missing required fields" });
        }
  
        const bannerBuffer = req.file ? req.file.buffer : null; 
  
        const result = await pool.query(
          `INSERT INTO events 
          (name, description, start_date_time, end_date_time, latitude, longitude, venue, web_page_url, banner, priority, status, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
          [
            name,
            description,
            start_date_time,
            end_date_time,
            latitude,
            longitude,
            venue,
            web_page_url,
            bannerBuffer, 
            priority,
            status
          ]
        );
  
        res.status(201).json({
          message: "Event created successfully",
          event: result.rows[0]
        });
      } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
      }
    }
  ];
// Get all events
exports.getAllEvents = async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM events ORDER BY created_at DESC");
  
      const eventsWithBanner = result.rows.map(event => {
        let base64Banner = null;
        if (event.banner) {
          const mimeType = "image/png";
          base64Banner = `data:${mimeType};base64,${event.banner.toString('base64')}`;
        }
  
        return {
          ...event,
          banner: base64Banner
        };
      });
  
      res.status(200).json(eventsWithBanner);
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Update an event
exports.updateEvent = [
  upload.single('banner'),

  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        description,
        start_date_time,
        end_date_time,
        latitude,
        longitude,
        venue,
        web_page_url,
        priority,
        status
      } = req.body;

      if (!name || !start_date_time || !end_date_time || !venue || !status || !description || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const bannerBuffer = req.file ? req.file.buffer : null;

      const fields = [
        "name = $1",
        "description = $2",
        "start_date_time = $3",
        "end_date_time = $4",
        "latitude = $5",
        "longitude = $6",
        "venue = $7",
        "web_page_url = $8"
      ];

      const values = [
        name,
        description,
        start_date_time,
        end_date_time,
        latitude,
        longitude,
        venue,
        web_page_url
      ];

      if (bannerBuffer) {
        fields.push(`banner = $${values.length + 1}`);
        values.push(bannerBuffer);
      }

      fields.push(`priority = $${values.length + 1}`);
      values.push(priority);

      fields.push(`status = $${values.length + 1}`);
      values.push(status);

      fields.push(`updated_at = NOW()`); 

      const updateQuery = `
        UPDATE events
        SET ${fields.join(', ')}
        WHERE id = $${values.length + 1}
        RETURNING *;
      `;

      values.push(id);

      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Event not found" });
      }

      return res.status(200).json({
        message: "Event updated successfully",
        event: result.rows[0]
      });
    } catch (error) {
      console.error("❌ Error in updateEvent:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }
];



// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Enable/Disable event registration
exports.toggleEventRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 

        const result = await pool.query(
            `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: `Event registration ${status}`, event: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Get checked-in attendees for an event
exports.getEventAttendees = async (req, res) => {
    try {
        const { event_id } = req.params;
        const result = await pool.query(
            `SELECT users.id, users.first_name, users.last_name, users.email, eventattendees.check_in_time, eventattendees.check_out_time
             FROM eventattendees 
             JOIN users ON eventattendees.user_id = users.id
             WHERE eventattendees.event_id = $1`,
            [event_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Get event analytics (total attendees, registrations, check-ins)
exports.getEventAnalytics = async (req, res) => {
    try {
        const { event_id } = req.params;

        const totalRegistrations = await pool.query(
            `SELECT COUNT(*) AS total FROM eventregistrations WHERE event_id = $1`,
            [event_id]
        );

        const totalCheckIns = await pool.query(
            `SELECT COUNT(*) AS total FROM eventattendees WHERE event_id = $1 AND check_in_time IS NOT NULL`,
            [event_id]
        );

        res.status(200).json({
            event_id,
            total_registrations: totalRegistrations.rows[0].total,
            total_check_ins: totalCheckIns.rows[0].total,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.getEventCount = async (req, res) => {
    try {
        console.log("API Called: /count with query:", req.query);
  
        let { year } = req.query;
  
        const currentYear = new Date().getFullYear();
  
        if (year === "current") {
            year = currentYear;
        } else if (year === "previous") {
            year = currentYear - 1;
        } else {
            console.log("Invalid year parameter:", year);
            return res.status(400).json({ error: "Invalid year parameter. Use 'current' or 'previous'." });
        }
  
        console.log("Fetching data for year:", year);
  
        const result = await pool.query(
            `SELECT 
                CAST(EXTRACT(MONTH FROM created_at) AS INTEGER) AS month, 
                COUNT(*) AS total_events
             FROM events 
             WHERE EXTRACT(YEAR FROM created_at) = $1 
             GROUP BY month 
             ORDER BY month`,
            [year]
        );
  
        console.log("Query Result:", result.rows); 
  
        let eventCounts = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            total_events: 0
        }));
  
        result.rows.forEach(row => {
            eventCounts[row.month - 1].total_events = parseInt(row.total_events, 10);
        });
  
        console.log("Final Event Count Data:", eventCounts);
  
        res.json({ year, data: eventCounts });
  
    } catch (error) {
        console.error("Database error:", error);
  
        if (error.code === '22P02') {
            return res.status(400).json({ error: "Invalid data type in query parameters." });
        }
  
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
  };
  
  exports.eventConnectionList = async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT
        e.id AS event_id,
        e.name AS event_name,
        COUNT(DISTINCT LEAST(uc.user1_id, uc.user2_id) || '-' || GREATEST(uc.user1_id, uc.user2_id)) AS total_connections
      FROM events e
      LEFT JOIN eventattendees ea1 ON ea1.event_id = e.id
      LEFT JOIN eventattendees ea2 ON ea2.event_id = e.id AND ea2.user_id != ea1.user_id
      LEFT JOIN userconnections uc 
        ON (
          (uc.user1_id = ea1.user_id AND uc.user2_id = ea2.user_id) OR
          (uc.user1_id = ea2.user_id AND uc.user2_id = ea1.user_id)
        )
        AND uc.status = 'approved'
      GROUP BY e.id, e.name
      ORDER BY e.start_date_time ASC;
      `);
  
      res.json({
        message: "Event connections fetched successfully.",
        events: rows
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  };
  

exports.deleteMassEvents = async (req, res) => {
    const client = await pool.connect();
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "ids must be a non-empty array" });
        }

        await client.query('BEGIN');

        await client.query('DELETE FROM eventattendees WHERE event_id = ANY($1)', [ids]);
        await client.query('DELETE FROM eventregistrations WHERE event_id = ANY($1)', [ids]);
        await client.query('DELETE FROM qrcodes WHERE event_id = ANY($1)', [ids]);

        const result = await client.query('DELETE FROM events WHERE id = ANY($1) RETURNING *', [ids]);

        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No matching events found to delete" });
        }

        res.json({
            message: "Events deleted successfully",
            deletedEvents: result.rows
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("ERROR:", error.message);
        res.status(500).json({ error: "Error deleting events" });
    } finally {
        client.release();
    }
};

exports.getEventsByTimeRange = async (req, res) => {
    const timeRange = req.params.time_range;

    const validRanges = ['this_month', 'last_month', 'this_year', 'last_year'];
    if (!validRanges.includes(timeRange)) {
        return res.status(400).json({ error: "Invalid time_range. Use: this_month, last_month, this_year, last_year." });
    }

    let query = '';
    switch (timeRange) {
        case 'this_month':
            query = `SELECT * FROM events WHERE start_date_time >= date_trunc('month', CURRENT_DATE);`;
            break;
        case 'last_month':
            query = `
                SELECT * FROM events 
                WHERE start_date_time >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                AND start_date_time < date_trunc('month', CURRENT_DATE);
            `;
            break;
        case 'this_year':
            query = `SELECT * FROM events WHERE start_date_time >= date_trunc('year', CURRENT_DATE);`;
            break;
        case 'last_year':
            query = `
                SELECT * FROM events 
                WHERE start_date_time >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year')
                AND start_date_time < date_trunc('year', CURRENT_DATE);
            `;
            break;
    }

    try {
        const result = await pool.query(query);
        res.json({ events: result.rows });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

exports.getUsersWithConnectionsInEvent = async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
  
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
  
    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.middle_name,
          u.last_name,
          COUNT(DISTINCT c.id) AS total_connections
        FROM users u
        JOIN eventattendees ea ON u.id = ea.user_id
        LEFT JOIN userconnections c ON (
          (c.user1_id = u.id AND c.user2_id IN (
            SELECT user_id FROM eventattendees WHERE event_id = $1
          )) OR
          (c.user2_id = u.id AND c.user1_id IN (
            SELECT user_id FROM eventattendees WHERE event_id = $1
          ))
        )
        WHERE ea.event_id = $1
        GROUP BY u.id, u.first_name, u.middle_name, u.last_name;
      `;
  
      const { rows } = await pool.query(query, [eventId]);
  
      res.status(200).json({
        event_id: eventId,
        users: rows
      });
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  