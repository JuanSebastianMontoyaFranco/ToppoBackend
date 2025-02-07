const db = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

exports.create = async (req, res, next) => {
    try {
        const client = await db.client.findOne({ where: { billing_email: req.body.email } });
        if (client) {
            return res.status(409).send({
                message: 'El correo electrónico ya se encuentra en uso.'
            });
        }

        req.body.password = bcrypt.hashSync(req.body.password, 10);

        await db.client.create({
            user_id: req.body.user_id,
            price_list_id: req.body.price_list_id,
            seller_id: req.body.seller_id,
            billing_id: req.body.identification,
            billing_first_name: req.body.first_name,
            billing_last_name: req.body.last_name,
            billing_email: req.body.email,
            billing_phone: req.body.phone,
            billing_address_1: req.body.address,
            billing_state: req.body.department,
            billing_city: req.body.city,
            password: req.body.password,
            role: 'client',
        });

        return res.status(201).send({
            message: 'Cliente creado con éxito.'
        });

    } catch (error) {
        return res.status(500).send({
            message: '¡Error en el servidor!',
            error: error.message
        });
    }
};


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
            role: 'client',
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
                rows: [],
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

exports.detail = async (req, res, next) => {
    const client_id = req.query.client_id;

    try {
        // Buscar cliente con la relación a price_list
        const client = await db.client.findAndCountAll({
            where: { id: client_id },
            include: [
                {
                    model: db.price_list,
                    as: 'price_list',
                    attributes: ['name']
                }
            ]
        });

        if (client.count > 0) {
            // Obtener los datos y agregar seller_name manualmente
            const rows = await Promise.all(client.rows.map(async (c) => {
                let seller_name = null;

                // Si seller_id existe, buscar el nombre en la base de datos
                if (c.seller_id) {
                    const seller = await db.client.findOne({
                        where: { id: c.seller_id },
                        attributes: ['billing_first_name']
                    });

                    seller_name = seller ? seller.billing_first_name : null;
                }

                console.log(c.seller_id);


                return {
                    ...c.toJSON(),
                    seller_name,
                    price_list_name: c.price_list ? c.price_list.name : null
                };
            }));

            res.status(200).json({
                rows,
                total: client.count
            });
        } else {
            res.status(200).send({
                rows: [],
                total: 0,
                error: 'No hay registros en el sistema.'
            });
        }
    } catch (error) {
        res.status(500).send({
            error: '¡Error en el servidor!'
        });
        next(error);
    }
};
