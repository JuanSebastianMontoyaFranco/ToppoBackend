const db = require('../models');
const axios = require('axios');
const syncFunctions = require('../functions/sync');

exports.send = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        await syncFunctions.logSync(user_id, 'Manual', 'Correcto');
        res.status(200).json({ message: 'Proceso completado manualmente.' });
    } catch (error) {
        await syncFunctions.logSync(user_id, 'Manual', 'Error');
        res.status(500).json({ message: 'Error al ejecutar el proceso manual.', error: error.message });
    }
};