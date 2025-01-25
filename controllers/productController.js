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


async function getProducts({ userId, channel, state, page, limit, search, productType, status }) {
    try {
        // Obtener la lista de precios por defecto
        const defaultPriceList = await db.price_list.findOne({
            where: { user_id: userId, default: true },
        });

        if (!defaultPriceList) {
            throw new Error("No se encontró una lista de precios por defecto.");
        }

        // Obtener la última sincronización del usuario en la tabla sync_log
        const lastSync = await db.sync_log.findOne({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
        });

        const lastSyncDate = lastSync ? lastSync.createdAt : null;

        const whereConditions = {
            user_id: userId,
        };

        // Agregar filtros opcionales
        if (search) {
            whereConditions[db.Sequelize.Op.or] = [
                { title: { [db.Sequelize.Op.like]: `%${search}%` } }
            ];
        }

        if (productType) {
            whereConditions.product_type = productType;
        }

        if (status) {
            whereConditions.status = status;
        }

        const includeConditions = [
            {
                model: db.variant,
                include: [
                    {
                        model: db.price,
                        include: [
                            {
                                model: db.price_list,
                                where: { id: defaultPriceList.id },
                            },
                        ],
                        required: false,
                    },
                ],
            },
        ];

        if (channel) {
            //console.log('Canal:', channel);
            includeConditions.push({
                model: db.channel_product,
                where: { channel_id: channel },
                required: true,
            });
        } else {
            console.log('Canal no proporcionado.');
            includeConditions.push({
                model: db.channel_product,
                required: false,
            });
        }

        const offset = (page - 1) * limit;

        let products;
        let total = 0;  // Inicializar `total` en 0 por defecto

        if (state) {
            // Buscar en change_logs si se proporciona "state"
            const changeLogs = await db.change_log.findAll({
                where: {
                    state,
                    createdAt: { [db.Sequelize.Op.gt]: lastSyncDate },
                },
                include: [
                    {
                        model: db.product,
                        where: whereConditions,
                        required: true,
                        include: includeConditions,
                    },
                ],
                limit,
                offset,
            });

            if (!changeLogs || changeLogs.length === 0) {
                return { rows: [], total: 0 };
            }

            products = changeLogs.map(changeLog => changeLog.product);
            total = changeLogs.length;  // Establecer total en la longitud de los cambios
        } else {
            // Buscar directamente en productos
            const { rows, count } = await db.product.findAndCountAll({
                where: whereConditions,
                include: includeConditions,
                limit,
                offset,
            });

            if (!rows || rows.length === 0) {
                return { rows: [], total: 0 };
            }

            products = rows;
            total = count || 0; // Asegura que total se define
        }

        const formattedProducts = products.map(product => {
            //console.log('Tipo de channel:', typeof channel, 'Valor de channel:', channel);
            //console.log('Producto:', product);
            
            const channelProduct = product.channel_products?.find(cp => cp.channel_id === channel);

            //console.log('Channel Products:', product.channel_products);

            console.log(product.variants);
            
            
            return {
                id: product.id,
                ecommerce_id: parseInt(channelProduct?.ecommerce_id) || null,
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

                    console.log(defaultPrice);
                    
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

        formattedProducts.forEach((product, index) => {
            // Suponiendo que `state` es proporcionado a través de los `change_logs`
            if (state === 'create') {
                formattedProducts[index].state = 'create';
            } else if (state === 'update') {
                formattedProducts[index].state = 'update';
            }
        });

        return { rows: formattedProducts, total: total };
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw error;
    }
}

exports.list = async (req, res) => {
    const userId = req.params.user_id; // Usar query en lugar de params
    const channel = parseInt(req.query.channel) || null;
    const state = req.query.state || null;
    const page = parseInt(req.query.page, 10) || 1; // Página predeterminada
    const limit = parseInt(req.query.limit, 10) || 10; // Límite predeterminado
    const search = req.query.search || null;
    const productType = req.query.product_type || null;
    const status = req.query.status || null;

    try {
        const result = await getProducts({ userId, channel, state, page, limit, search, productType, status });
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

exports.detail = async (req, res, next) => {
    const userId = req.params.user_id;
    const product_id = req.query.product_id;

    const defaultPriceList = await db.price_list.findOne({
        where: { user_id: userId, default: true },
    });

    try {
        const product = await db.product.findAndCountAll({
            where: { id: product_id },
            include: [{
                model: db.variant,
                include: [
                    {
                        model: db.price,
                        include: [
                            {
                                model: db.price_list,
                                where: { id: defaultPriceList.id },
                            },
                        ],
                        required: false,
                    },
                ],
            }],
        });
        if (product.count > 0) {
            res.status(200).json({
                rows: product.rows,
                total: product.count
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
}


module.exports.getProducts = getProducts;