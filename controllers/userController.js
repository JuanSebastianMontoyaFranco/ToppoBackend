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

                const user_id = newUser.id; // Asignar el ID del usuario recién creado

                const defaultPriceList = await db.price_list.findOne({
                    where: { user_id, default: true },
                    include: [
                        {
                            model: db.price,
                            include: [
                                {
                                    model: db.variant,
                                    include: [
                                        {
                                            model: db.product
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

                if (!defaultPriceList) {
                    // Crear la nueva lista de precios
                    const newPriceList = await db.price_list.create({
                        user_id: user_id,
                        default: true,
                        name: 'Lista predeterminada',
                        description: 'Lista predeterminada',
                    });

                    // Crear una condición asociada a la nueva lista de precios
                    const condition = await db.condition.create({
                        price_list_id: newPriceList.id,
                        check_visibility_price: false,
                        check_percentage: req.body.check_percentage || false,
                        percentage: req.body.percentage || 0,
                        check_base_price: false,
                        base_price: 0,
                        check_conditional: false,
                        check_min_qty: false,
                        min_qty: 0,
                        check_min_price: false,
                        min_price: 0,
                    });
                }

                return res.status(200).send({
                    message: 'Usuario y lista de precios creados con éxito. Se ha enviado un correo de confirmación.'
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
            error: error
        });
    }
};


exports.update = async (req, res, next) => {
    const user_id = req.params.user_id;

    try {
        const user = await db.user.update({
            identification: req.body.identification,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            department: req.body.department,
            city: req.body.city,
        }, {
            where: {
                id: user_id
            },
        });

        if (user[0] === 0) {
            return res.status(404).send({
                message: 'Usuario no encontrado.'
            });
        }

        res.status(200).send({
            message: 'Usuario actualizado con éxito.'
        });
    } catch (error) {
        res.status(500).send({
            message: '¡Error en el servidor!',
            error: error
        });
    }
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email) {
        console.log('Error en la autenticación: El email está vacío');
        return res.status(200).json({ message: 'El email es requerido.' });
    }

    if (!password) {
        console.log('Error en la autenticación: La contraseña está vacía.');
        return res.status(200).json({ message: 'La contraseña es requerida.' });
    }

    try {
        let user = await db.user.findOne({ where: { email: email } });
        let isClient = false; // Bandera para saber si es un cliente

        if (!user) {
            user = await db.client.findOne({ where: { billing_email: email } }); // Buscar en la tabla client si no está en user
            isClient = !!user; // Si user es encontrado en client, isClient será true
        }

        if (user) {
            // En clientes, puede que no haya un campo "password", por lo que evitamos errores
            if (!user.password || typeof user.password !== 'string') {
                console.log('Error en la autenticación: Contraseña no encontrada o inválida.');
                return res.status(500).json({ message: 'Contraseña no encontrada o inválida' });
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (passwordIsValid) {
                const token = await tokenServices.encode(user);

                return res.status(200).send({
                    message: 'Bienvenido',
                    token: token,
                    user: {
                        id: user.id,
                        identification: isClient ? user.billing_id : user.identification,
                        first_name: isClient ? user.billing_first_name : user.first_name,
                        last_name: isClient ? user.billing_last_name : user.last_name, // Si client no tiene last_name, se deja vacío
                        email: isClient ? user.billing_email : user.email,
                        phone: isClient ? user.billing_phone : user.phone,
                        address: isClient ? user.billing_address_1 : user.address,
                        department: isClient ? user.billing_state : user.department,
                        city: isClient ? user.billing_city : user.city,
                        role: isClient ? user.role : user.role, // Si es un cliente, su rol será 'client'
                        wholesale: isClient ? false : user.wholesale, // Asumimos que un cliente no es mayorista
                        confirmed: isClient ? true : user.confirmed, // Si un cliente no tiene este campo, asumimos que está confirmado
                        image_url: isClient ? null : user.image_url // Si el cliente no tiene imagen, enviamos null
                    }
                });
            } else {
                console.log('Error en la autenticación: Contraseña incorrecta.');
                return res.status(500).json({ message: 'Contraseña incorrecta' });
            }
        } else {
            console.log('Error en la autenticación: Usuario no encontrado.');
            return res.status(500).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).send({
            message: '¡Error en el servidor!',
            error: error
        });
    }
};
