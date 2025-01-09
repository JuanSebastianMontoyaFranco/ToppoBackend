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

async function getProducts({ userId, channelId, state }) {
    try {
        // Obtener la lista de precios por defecto
        const defaultPriceList = await db.price_list.findOne({
            where: { default: true }, // Suponiendo que tienes un campo que marca la lista por defecto
        });

        if (!defaultPriceList) {
            throw new Error("No se encontró una lista de precios por defecto.");
        }

        // Obtener la última sincronización del usuario en la tabla sync_log
        const lastSync = await db.sync_log.findOne({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']], // Ordenar por la fecha de creación, descendente
        });

        const lastSyncDate = lastSync ? lastSync.createdAt : null;

        if (state) {
            // Si el campo state está presente, realizar la búsqueda en change_logs
            const changeLogs = await db.change_log.findAll({
                where: {
                    state: state, // Filtrar por "create" o "update"
                    createdAt: { [db.Sequelize.Op.gt]: lastSyncDate }, // Fecha superior a la última sincronización
                },
                include: [
                    {
                        model: db.product,
                        where: { user_id: userId }, // Filtrar por usuario
                        required: true,
                        include: [
                            {
                                model: db.variant,
                                include: [
                                    {
                                        model: db.price,
                                        include: [
                                            {
                                                model: db.price_list,
                                                where: { id: defaultPriceList.id }, // Usar la lista de precios por defecto
                                            },
                                        ],
                                        required: false,
                                    },
                                ],
                            },
                            ...(channelId
                                ? [{
                                    model: db.channel_product,
                                    where: { channel_id: channelId },
                                    required: true,
                                }]
                                : []),
                        ],
                    },
                ],
            });

            console.log(changeLogs.length);


            if (!changeLogs || changeLogs.length === 0) {
                return { rows: [], total: 0 };
            }

            // Formatear la respuesta
            const formattedProducts = changeLogs.map(changeLog => {
                const product = changeLog.product;
                const channelProduct = product.channel_products?.find(
                    cp => cp.channel_id === channelId
                );

                return {
                    id: product.id,
                    ecommerce_id: channelProduct?.ecommerce_id || null, // Recuperar ecommerce_id
                    title: product.title,
                    description: product.description,
                    vendor: product.vendor,
                    product_type: product.product_type,
                    template: product.template,
                    tags: product.tags,
                    status: product.status,
                    variants: product.variants.map(variant => {
                        const defaultPrice = variant.prices.find(
                            price => price.price_list_id === defaultPriceList.id
                        );
                        return {
                            variant_id: variant.id,
                            sku: variant.sku,
                            title: variant.title,
                            option_1: variant.option_1,
                            option_2: variant.option_2,
                            option_3: variant.option_3,
                            barcode: variant.barcode,
                            requires_shipping: variant.requires_shipping,
                            inventory_policy: variant.inventory_policy,
                            inventory_management: variant.inventory_management,
                            inventory_quantity: variant.inventory_quantity,
                            fullfillment_service: variant.fullfillment_service,
                            taxable: variant.taxable,
                            tax_percentage: variant.tax_percentage,
                            weight: variant.weight,
                            weight_unit: variant.weight_unit,
                            image_url: variant.image_url,
                            price: defaultPrice ? defaultPrice.price : null,
                            compare_at_price: defaultPrice ? defaultPrice.compare_at_price : null,
                        };
                    }),
                };
            });

            return { rows: formattedProducts, total: formattedProducts.length };
        } else {
            // Consulta base
            const query = {
                where: { user_id: userId },
                include: [
                    {
                        model: db.variant,
                        include: [
                            {
                                model: db.price,
                                include: [
                                    {
                                        model: db.price_list,
                                        where: { id: defaultPriceList.id }, // Usar la lista de precios por defecto
                                    },
                                ],
                                required: false,
                            },
                        ],
                    },
                ],
            };

            if (channelId) {
                query.include.push({
                    model: db.channel_product,
                    where: { channel_id: channelId },
                    required: true,
                });
            } else {
                query.include.push({
                    model: db.channel_product,
                    required: false,
                });
            }

            const products = await db.product.findAll(query);

            if (!products || products.length === 0) {
                return { rows: [], total: 0 };
            }

            const formattedProducts = products.map(product => {
                const channelProduct = product.channel_products?.find(cp => cp.channel_id === channelId);
                return {
                    id: product.id,
                    title: product.title,
                    ecommerce_id: channelProduct?.ecommerce_id || null,
                    variants: product.variants.map(variant => {
                        const defaultPrice = variant.prices.find(
                            price => price.price_list_id === defaultPriceList.id
                        );
                        return {
                            variant_id: variant.id,
                            title: variant.title,
                            price: defaultPrice ? defaultPrice.price : null, // Mostrar el precio o null si no hay default
                        };
                    }),
                };
            });

            return { rows: formattedProducts, total: formattedProducts.length };
        }
    } catch (error) {
        console.error('Error al obtener productos:', error.message);
        throw error;
    }
}

exports.list = async (req, res) => {
    const userId = req.params.user_id;
    const channelId = req.body.channel_id || null; // Manejar channel_id opcional
    const state = req.body.state;

    try {
        const result = await getProducts({ userId, channelId, state });
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error al listar productos:', error.message);
        return res.status(500).json({ message: 'Hubo un error al listar los productos.' });
    }
};


exports.update = async (req, res) => {
    try {
        const channelProduct = await db.channel_product.findOne({
            where: { ecommerce_id: req.body.id }
        });

        if (!channelProduct) {
            console.log(`Producto con ecommerce_id ${req.body.id} no encontrado.`);
            return res.status(404).send({
                message: 'Producto no encontrado en channel_product.',
            });
        }

        const product = await db.product.findOne({
            where: { id: channelProduct.product_id }
        });

        if (!product) {
            console.log(`Producto con ID ${channelProduct.product_id} no encontrado en la tabla product.`);
            return res.status(404).send({
                message: 'Producto relacionado no encontrado en la tabla product.',
            });
        }
        
        await product.update({
            status: req.body.status,
        });

        // Buscar y actualizar las variantes relacionadas en la tabla variant
        const variants = await db.variant.findAll({
            where: { product_id: product.id }
        });

        if (variants && Array.isArray(req.body.variants)) {
            for (const variant of req.body.variants) {
                // Buscar la variante existente por ID
                const existingVariant = variants.find(v => v.id === variant.id);

                if (existingVariant) {
                    // Actualizar el campo barcode de la variante
                    await existingVariant.update({
                        barcode: variant.barcode,
                    });
                } else {
                    console.log(`Variante con ID ${variant.id} no encontrada.`);
                }
            }
        }

        console.log('Producto y variantes actualizados con éxito.');
        return res.status(200).send({
            message: 'Producto y variantes actualizados con éxito.',
        });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        return res.status(500).send({
            message: 'Hubo un error al actualizar el producto.',
            error: error.message,
        });
    }
};


module.exports.getProducts = getProducts;