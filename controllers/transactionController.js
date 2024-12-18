const db = require('../models');

exports.create = async (req, res, next) => {
    try {
        const transaction = await db.transaction.create({
            order_id: req.body.order_id,
            transaction_id: req.body.id,
            gateway: req.body.gateway,
            payment_id: req.body.payment_id,
            amount: req.body.amount,
            date_create: req.body.created_at
        });
        console.log('Se creó la transacción con éxito');
        return res.status(200).send({
            message: 'Transaccion creada con éxito.'
        });
    } catch (error) {
        console.error('Error al crear la transacion:', error);
        return res.status(500).send({
            message: 'Hubo un error al crear la transaccion.',
            error: error.message
        });
    }
}