const db = require('../models');

exports.logSync = async (user_id, sync_form) => {
    try {
        await db.sync_log.create({
            user_id,
            sync_form, // 'MANUAL' o 'AUTOMATIC'
            date: new Date()
        });
    } catch (error) {
        console.error('Error al guardar en sync_logs:', error);
    }
};