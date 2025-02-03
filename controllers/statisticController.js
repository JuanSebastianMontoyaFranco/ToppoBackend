const db = require('../models');

exports.listById = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        const orderStates = await Promise.all([
            db.order.count({ where: { user_id, state: 0 } }), // Pendientes
            db.order.count({ where: { user_id, state: 1 } }), // Aprobadas
            db.order.count({ where: { user_id, state: 2 } })  // Con errores
        ]);

        const productStatuses = await Promise.all([
            db.product.count({ where: { user_id, status: 'active' } }),   // Active
            db.product.count({ where: { user_id, status: 'draft' } }),    // Draft
            db.product.count({ where: { user_id, status: 'archived' } }) // Archived
        ]);

        res.status(200).json({
            orders: {
                pending: orderStates[0],
                approved: orderStates[1],
                errors: orderStates[2]
            },
            products: {
                active: productStatuses[0],
                draft: productStatuses[1],
                archived: productStatuses[2]
            }
        });
    } catch (error) {
        res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};
