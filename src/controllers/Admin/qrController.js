const QRCode = require('qrcode');

exports.generateQRCode = async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    const qrData = `EventID:${eventId},UserID:${userId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.json({ qrCode });
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code', error });
  }
};
