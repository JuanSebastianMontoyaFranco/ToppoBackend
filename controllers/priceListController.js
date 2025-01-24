const db = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
    const user_id = req.params.user_id;

    try {
        // Buscar la lista de precios por defecto del usuario
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
            return res.status(404).send({ message: 'No se encontró una lista de precios por defecto para el usuario.' });
        }

        // Crear la nueva lista de precios
        const newPriceList = await db.price_list.create({
            user_id: user_id,
            default: req.body.default,
            name: req.body.name,
            description: req.body.description,
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

        // Crear nuevos precios basados en los de la lista por defecto
        const newPrices = defaultPriceList.prices.map(price => {
            let adjustedPrice = price.price;

            // Aplicar descuento por porcentaje si está habilitado
            if (condition.check_percentage) {
                adjustedPrice = adjustedPrice * (1 - condition.percentage / 100);
            }

            return {
                price_list_id: newPriceList.id,
                variant_id: price.variant_id,
                price: adjustedPrice,
                compare_at_price: price.compare_at_price, // Puedes ajustar este también si es necesario
                currency: price.currency
            };
        });

        // Insertar los nuevos precios en la base de datos
        await db.price.bulkCreate(newPrices);

        return res.status(200).send({
            message: 'Lista de precios creada correctamente con precios ajustados',
            price_list_id: newPriceList.id,
        });

    } catch (error) {
        console.error('Error al crear la lista de precios o los precios asociados:', error.message);
        return res.status(500).send({
            message: 'Hubo un error al crear la lista de precios o los precios asociados.',
            error: error.message,
        });
    }
};


exports.list = async (req, res) => {
    const { price_list_id, user_id } = req.params;

    try {
        // Buscar la lista de precios con los productos, variantes y precios asociados
        const priceList = await db.price_list.findOne({
            where: { id: price_list_id },
            include: [
                {
                    model: db.condition, // Incluir las condiciones asociadas a la lista de precios
                    where: { price_list_id }, // Asegurarse de que las condiciones pertenezcan a la lista de precios
                    required: true, // Solo incluir las condiciones si existen
                },
                {
                    model: db.price,
                    include: [
                        {
                            model: db.variant,
                            include: [
                                {
                                    model: db.product,
                                    where: { user_id }, // Filtrar productos por usuario
                                    required: true, // Asegura que solo se incluyan productos relacionados
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // Si no se encuentra la lista de precios
        if (!priceList) {
            return res.status(404).json({ message: 'No se encontró la lista de precios especificada.' });
        }

        // Formatear la respuesta
        const formattedResponse = {
            price_list_id: priceList.id,
            price_list_name: priceList.name,
            conditions: priceList.conditions,
            products: []
        };

        // Organizar los productos y variantes
        const productMap = {};

        priceList.prices.forEach(price => {
            const product = price.variant.product;
            const variant = price.variant;

            // Agregar producto si no existe en el mapa
            if (!productMap[product.id]) {
                productMap[product.id] = {
                    product_id: product.id,
                    product_title: product.title,
                    variants: []
                };
                formattedResponse.products.push(productMap[product.id]);
            }

            // Buscar o agregar la variante
            const existingVariant = productMap[product.id].variants.find(v => v.variant_id === variant.id);
            if (!existingVariant) {
                productMap[product.id].variants.push({
                    variant_id: variant.id,
                    variant_title: variant.title,
                    prices: []
                });
            }

            // Agregar el precio a la variante
            const variantToUpdate = productMap[product.id].variants.find(v => v.variant_id === variant.id);
            variantToUpdate.prices.push({
                price: price.price,
                compare_at_price: price.compare_at_price,
                currency: price.currency
            });
        });

        return res.status(200).json(formattedResponse);
    } catch (error) {
        console.error('Error al listar productos por lista de precios:', error.message);
        return res.status(500).json({ message: 'Hubo un error al listar los productos.' });
    }
};

exports.listByUser = async (req, res) => {
    const { user_id } = req.params;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const searchCondition = search
            ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                ],
            }
            : {};

        const whereCondition = {
            user_id: user_id,
            ...searchCondition,
        };

        const pricelist = await db.price_list.findAll({
            limit: limit,
            offset: offset,
            where: whereCondition,
        });

        const totalPriceList = await db.price_list.count({
            where: whereCondition,
        });

        // Formatear la respuesta
        if (pricelist.length > 0) {
            res.status(200).json({
                rows: pricelist,
                total: totalPriceList,
            });
        } else {
            res.status(200).send({
                data: [],
                total: 0,
                message: 'Aún no has agregado órdenes.',
            });
        }
    } catch (error) {
        console.error('Error en la consulta de órdenes:', error);
        return res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message,
        });
    }
};
