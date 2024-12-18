const getEncryptedText = require('../utils/encrypt');

exports.encrypt = async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const encryptedText = getEncryptedText(token);
        res.json({ token: encryptedText });
    } catch (error) {
        console.error('Error encrypting token:', error);
        res.status(500).json({ error: 'Failed to encrypt the token' });
    }
}