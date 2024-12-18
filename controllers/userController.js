const bcrypt = require('bcryptjs');
const db = require('../models');

exports.create = async (req, res, next) => {
    try {
        const user = await db.user.findOne({ where: { email: req.body.email } });
        if (user) {
            return res.status(200).send({
                error: 'El correo electrónico ya se encuentra en uso.'
            });
        } else {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
            if (req.body.role === "admin" || req.body.role === "client") {

                const newUser = await db.user.create({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    active: req.body.active,
                    password: req.body.password,
                    phone: req.body.phone,
                    address: req.body.address,
                    department: req.body.department,
                    city: req.body.city,
                    role: req.body.role,
                    wholesale: req.body.wholesale,
                    token: req.body.token,
                    confirmed: req.body.confirmed,
                    image_url: req.body.image_url
                });

                return res.status(200).send({
                    message: 'Usuario creado con éxito. Se ha enviado un correo de confirmación.'
                });
            } else {
                return res.status(400).send({
                    message: 'Rol no permitido'
                });
            }
        }
    } catch (error) {
        return res.status(500).send({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};