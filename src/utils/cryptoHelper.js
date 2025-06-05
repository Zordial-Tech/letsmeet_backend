const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const userSecretKey = "yourCustomSecretKey!123"; // Can be any length
const secretKey = crypto.createHash("sha256").update(userSecretKey).digest("base64").substring(0, 32); // Fixed 32-byte key

// Encrypt Password
const encryptPassword = (password) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + encrypted; // Store IV with encrypted data
};

// Decrypt Password
const decryptPassword = (encryptedPassword) => {
    try {
        const iv = Buffer.from(encryptedPassword.substring(0, 32), "hex"); // Extract IV
        const encryptedData = encryptedPassword.substring(32); // Extract encrypted data
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
        let decrypted = decipher.update(encryptedData, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "Decryption Error";
    }
};

module.exports = { encryptPassword, decryptPassword };
