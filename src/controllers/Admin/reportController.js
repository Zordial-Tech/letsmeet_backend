const pool = require('../../config/dbconfig');

exports.getReports = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reports");
    const reports = result.rows;

    res.status(200).json({ reports });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'in_progress', 'complete'];
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}` });
    }

    const result = await pool.query(
      "UPDATE reports SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report status updated successfully', report: result.rows[0] });
  } catch (error) {
    console.error("Update Report Status Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};




