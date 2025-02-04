const db = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const searchCondition = search ? {
            [Op.or]: [
                { billing_email: { [Op.like]: `%${search}%` } },
                { billing_first_name: { [Op.like]: `%${search}%` } },
                { billing_last_name: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const whereCondition = {
            user_id: user_id,
            ...searchCondition
        };

        // Buscar clientes
        const clients = await db.client.findAll({
            limit: limit,
            offset: offset,
            where: whereCondition,
            client: [['createdAt', 'DESC']],
        });

        // Contar el total de registros sin `findAndCountAll`
        const totalClients = await db.client.count({
            where: whereCondition,
        });

        if (clients.length > 0) {
            res.status(200).json({
                rows: clients,
                total: totalClients
            });
        } else {
            res.status(200).send({
                rows: null,
                total: 0,
                message: 'Aún no has agregado clientes.'
            });
        }
    } catch (error) {
        console.error('Error en la consulta de clientes:', error);
        return res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};
