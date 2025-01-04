const db = require('../models');
const productsFunctions = require('../functions/product');

exports.create = async (req, res) => {
    const shopifyHeader = req.get('X-Shopify-Shop-Domain');
    const mercadolibreHeader = req.get('X-Shopify-Shop-Domain');
    const productData = req.body;

    try {
        let result;

        if (shopifyHeader) {
            result = await productsFunctions.createShopifyProduct(productData, shopifyHeader);
        } else if (mercadolibreHeader) {
            result = await productsFunctions.createMercadoLibreProduct(productData, mercadolibreHeader);
        } else {
            return res.status(400).send({
                message: 'Plataforma no soportada o encabezado faltante.',
            });
        }

        console.log('Producto creado con éxito:', result);
        return res.status(200).send({
            message: 'Producto creado con éxito.',
            product: result,
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        return res.status(500).send({
            message: 'Hubo un error al crear el producto.',
            error: error.message,
        });
    }
};


exports.list = async (req, res) => {
    const userId = req.params.user_id;
    const channelId = req.params.channel_id; // Puede ser undefined si no está presente

    try {
        // Configurar la consulta base
        const query = {
            where: { user_id: userId }, // Usamos el parámetro userId
            include: [
                {
                    model: db.variant,
                    include: [
                        {
                            model: db.price,
                            required: true,
                        }
                    ]
                }
            ]
        };

        // Agregar el filtro de canal solo si channelId está definido
        if (channelId) {
            query.include.push({
                model: db.channel_product,
                where: { channel_id: channelId }, // Usamos el parámetro channelId
                required: true, // Solo traer productos asociados al canal
            });
        } else {
            query.include.push({
                model: db.channel_product,
                required: false, // No es obligatorio que haya una asociación con el canal
            });
        }

        // Filtrar productos por usuario y opcionalmente por canal
        const products = await db.product.findAll(query);

        // Si no se encuentran productos
        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No se encontraron productos para el usuario especificado.' });
        }

        // Formatear la respuesta
        const formattedProducts = products.map(product => {
            // Obtener el ecommerce_id del canal asociado si aplica
            const channelProduct = product.channel_products?.find(cp => cp.channel_id === channelId);

            return {
                id: product.id,
                title: product.title,
                ecommerce_id: channelProduct?.ecommerce_id || null, // Asignar el ecommerce_id si existe
                variants: product.variants.map(variant => ({
                    variant_id: variant.id,
                    title: variant.title,
                    prices: variant.prices.map(price => ({
                        price_list_id: price.price_list_id,
                        price: price.price,
                        compare_at_price: price.compare_at_price,
                        currency: price.currency,
                    })),
                })),
            };
        });

        // Devolver los productos
        return res.status(200).json({
            rows: formattedProducts,
            total: formattedProducts.length
        });
    } catch (error) {
        console.error('Error al listar productos:', error.message);
        return res.status(500).json({ message: 'Hubo un error al listar los productos.' });
    }
};

exports.update = async (req, res) => {

}


module.exports.getProducts = getProducts; // Exportar la función
