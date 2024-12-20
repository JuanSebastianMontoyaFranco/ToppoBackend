const db = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
    const user_id = req.params.user_id;

    try {
        const priceList = await db.price_list.create({
            user_id: user_id,
            default: req.body.default,
            name: req.body.name,
            description: req.body.description,
        });

        return res.status(200).send({
            message: 'Lista creada correctamente'
        });

    } catch (error) {
        return res.status(500).send({
            message: 'Error creando la lista de precios',
            error: error
        });
    }
}


exports.list = async (req, res) => {
    const { price_list_id, user_id } = req.params;

    try {
        // Buscar la lista de precios con los productos, variantes y precios asociados
        const priceList = await db.price_list.findOne({
            where: { id: price_list_id },
            include: [
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
