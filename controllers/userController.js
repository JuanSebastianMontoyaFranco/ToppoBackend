const bcrypt = require('bcryptjs');
const db = require('../models');
const tokenServices = require('../services/token');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
    try {
        const user = await db.user.findOne({ where: { email: req.body.email } });
        if (user) {
            return res.status(200).send({
                message: 'El correo electrónico ya se encuentra en uso.'
            });
        } else {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
            if (req.body.role === "admin" || req.body.role === "client" || req.body.role === "seller") {

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
            message: '¡Error en el servidor!',
            error: error.message
        });
    }
};


exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email) {
        console.log('Error en la autenticación: El email está vacío');
        return res.status(200).json({
            message: 'El email es requerido.'
        });
    }

    if (!password) {
        console.log('Error en la autenticación: La contraseña está vacía.');
        return res.status(200).json({
            message: 'La contraseña es requerida.'
        });
    }

    try {
        const user = await db.user.findOne({ where: { email: email } });
        if (user) {
            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (passwordIsValid) {
                const token = await tokenServices.encode(user);

                return res.status(200).send({
                    message: 'Bienvenido',
                    token: token,
                    user: {
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        department: user.department,
                        city: user.city,
                        role: user.role,
                        wholesale: user.wholesale,
                        confirmed: user.confirmed,
                        image_url: user.image_url
                    }
                });
            } else {
                console.log('Error en la autenticación: Contraseña incorrecta.');
                return res.status(500).json({
                    message: 'Contraseña incorrecta'
                });
            }
        } else {
            console.log('Error en la autenticación: Usuario no encontrado.');
            return res.status(500).json({
                message: 'Usuario no encontrado.'
            });
        }
    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).send({
            message: '¡Error en el servidor!',
            error: error.message
        });
    }
};