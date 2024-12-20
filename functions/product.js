const db = require('../models');
const { Op } = require('sequelize'); // Asegúrate de importar Op de Sequelize

exports.createShopifyProduct = async (productData, header) => {
    let channel;
    try {
        channel = await db.channel.findOne({
            where: { name: 'shopify' }
        });

        if (!channel) {
            throw new Error('Canal "shopify" no encontrado.');
        }
    } catch (error) {
        console.error('Error al obtener el canal:', error.message);
        throw new Error('Hubo un error al obtener el canal.');
    }

    if (!header || !header.includes('.')) {
        throw new Error('Nombre de la tienda no válido. El encabezado debe contener un punto.');
    }

    const shopName = header.split('.')[0];
    console.log('Nombre de la tienda:', shopName);

    try {
        const credential = await db.credential.findOne({
            where: {
                [Op.or]: [
                    { shopify_domain: shopName },
                    { store_domain: shopName }
                ]
            }
        });

        if (!credential) {
            console.log('No se encontró el dominio en la tabla credential.');
            throw new Error('Dominio no encontrado en las credenciales.');
        }

        const userId = credential.user_id;
        console.log('CANAL', channel.id);

        // Crear el producto
        const newProduct = await db.product.create({
            user_id: userId,
            title: productData.title,
            description: productData.body_html,
            vendor: productData.vendor,
            product_type: productData.product_type,
            template: productData.template_suffix,
            tags: productData.tags,
            status: productData.status
        });

        // Asociar el producto al canal
        await db.channel_product.create({
            product_id: newProduct.id,
            channel_id: channel.id,
            ecommerce_id: productData.id
        });

        // Obtener todas las listas de precios del usuario
        const priceLists = await db.price_list.findAll({
            where: { user_id: userId }
        });

        // Crear variantes y asociarlas con las listas de precios
        for (const variantData of productData.variants) {
            const variant = await db.variant.create({
                product_id: newProduct.id,
                title: variantData.title,
                option_1: variantData.option1,
                option_2: variantData.option2,
                option_3: variantData.option3,
                barcode: variantData.barcode,
                requires_shipping: variantData.requires_shipping,
                inventory_policy: variantData.inventory_policy,
                inventory_quantity: variantData.inventory_quantity,
                inventory_management: variantData.inventory_management,
                fulfillment_service: variantData.fulfillment_service,
                taxable: variantData.taxable,
                weight: variantData.weight,
                weight_unit: variantData.weight_unit,
                image_url: variantData.image_id, // Si tienes imágenes, guárdalas de forma adecuada
                createdAt: new Date(variantData.created_at),
                updatedAt: new Date(variantData.updated_at),
            });

            // Crear los precios asociados a la variante y todas las listas de precios
            for (const priceList of priceLists) {
                await db.price.create({
                    variant_id: variant.id,
                    price_list_id: priceList.id,
                    price: variantData.price,
                    compare_at_price: variantData.compare_at_price,
                    currency: 'COP',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        return { id: newProduct.id, platform: 'Shopify', shopName };

    } catch (error) {
        console.error('Error al crear el producto:', error.message);
        throw new Error('Hubo un error al crear el producto.');
    }
};


exports.createMercadoLibreProduct = async (product) => {
    // Lógica para crear producto de MercadoLibre
    console.log('Creando producto en MercadoLibre:', product);
    // Simula la creación de un producto
    return { id: 2, platform: 'MercadoLibre', ...product };
};


