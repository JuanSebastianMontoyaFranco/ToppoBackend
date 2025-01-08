const db = require('../models');
const axios = require('axios');
const syncFunctions = require('../functions/sync');
const { recursiveEnqueue, recursiveEnqueueUpdate } = require('../functions/aws')

exports.send = async (req, res, next) => {
    const user_id = req?.params?.user_id || req.body.user_id;
    const { create, update, shopify_domain, token_shopify, fromCron = false } = req.body;

    console.log('--- INICIO DEL PROCESO ---');
    console.log('ID de usuario:', user_id);
    console.log('Dominio Shopify:', shopify_domain);
    console.log('Token Shopify:', token_shopify);
    console.log('Productos para crear:', JSON.stringify(create, null, 2));
    console.log('Productos para actualizar:', JSON.stringify(update, null, 2));

    try {
        // Consultar los parámetros del usuario
        //console.log('Consultando parámetros del usuario...');
        const userParameters = await db.sync_parameter.findOne({ where: { user_id } });

        // Verificar si userParameters es undefined
        if (!userParameters) {
            console.log('No se encontraron parámetros para el usuario:', user_id);
            if (!fromCron) {
                return res.status(404).json({ message: 'No se encontraron parámetros para este usuario.' });
            }
            console.log('No se encontraron parámetros para el usuario en cron');
            return; // Si es desde cron, simplemente no respondemos
        }

        const { product_type, price, compare_at_price } = userParameters.dataValues;
        //console.log('Parámetros extraídos:', { product_type, price, compare_at_price });

        // Función para procesar los productos
        //console.log('Procesando productos...');
        const processProducts = (products, isUpdate = false) => {
            if (!products || !Array.isArray(products)) {
                console.log(`Los productos proporcionados no son válidos. Es un valor ${typeof products}.`);
                return [];
            }

            return products.map((product, index) => {
                if (!product) {
                    console.log(`Producto en el índice ${index} es inválido (undefined).`);
                    return {};
                }

                //console.log(`Procesando producto [${index}]:`, JSON.stringify(product, null, 2));

                if (product.variants && Array.isArray(product.variants)) {
                    product.variants = product.variants.map((variant, variantIndex) => {
                        if (!variant) {
                            console.log(`Variante en el índice ${variantIndex} es inválida (undefined).`);
                            return {};
                        }

                        //console.log(`Procesando variante [${index}:${variantIndex}] antes de eliminar campos(${isUpdate ? 'ACTUALIZAR' : 'CREAR'}) :`, JSON.stringify(variant, null, 2));
                        variant.price = String(variant.price);
                        variant.compare_at_price = variant.compare_at_price === null ? null : String(variant.compare_at_price);

                        const fieldsToDelete = [
                            'id',
                            'product_id',
                            'option_1',
                            'option_2',
                            'option_3',
                            'user_id',
                            'image_url',
                            'weight',
                            'weight_unit',
                            'fulfillment_service',
                            'inventory_policy',
                            'taxable',
                            'createdAt',
                            'updatedAt',
                            ...(!price ? ['price'] : []),
                            ...(!compare_at_price ? ['compare_at_price'] : []),
                        ];
                        fieldsToDelete.forEach(field => delete variant[field]);
                        console.log(`Variante después de eliminar campos (${isUpdate ? 'ACTUALIZAR' : 'CREAR'}):`, JSON.stringify(variant, null, 2));

                        return variant;
                    });
                }

                const fieldsToDelete = [
                    'user_id',
                    'ecommerce_id',
                    'vendor',
                    'description',
                    'template',
                    'tags',
                    'createdAt',
                    'updatedAt',
                    ...(!product_type ? ['product_type'] : []),
                ];
                fieldsToDelete.forEach(field => delete product[field]);
                console.log(`Producto después de eliminar campos (${isUpdate ? 'ACTUALIZAR' : 'CREAR'}):`, JSON.stringify(product, null, 2));

                return product;
            });
        };

        // Verificar que create y update sean arrays válidos
        const processedCreate = Array.isArray(create) ? processProducts(create) : [];
        //console.log('Productos procesados para crear:', JSON.stringify(processedCreate, null, 2));
        const processedUpdate = Array.isArray(update) ? processProducts(update, true) : [];
        //console.log('Productos procesados para actualizar:', JSON.stringify(processedUpdate, null, 2));

        if (processedCreate.length > 0) {
            console.log('Encolando productos para crear...');
            await recursiveEnqueue(processedCreate, shopify_domain, token_shopify, 0);
            if (!fromCron) {
                return res.status(200).json({ message: 'Productos encolados exitosamente para creación.' });
            }
            console.log('Productos encolados para creación automaticamente (ejecución cron)');
        }

        if (processedUpdate.length > 0) {
            console.log('Encolando productos para actualizar...');
            // await recursiveEnqueueUpdate(processedUpdate, shopify_domain, token_shopify, 0);
            if (!fromCron) {
                return res.status(200).json({ message: 'Productos encolados exitosamente para actualización.' });
            }
            console.log('Productos encolados para actualización automaticamente (ejecución cron)');
        }

        if (!fromCron) {
            console.log('Registrando proceso manual...');
            await syncFunctions.logSync(user_id, 'Manual');
            return res.status(200).json({ message: 'Proceso completado manualmente.' });
        } else {
            console.log('Proceso completado automaticamente (ejecución cron).');
        }

    } catch (error) {
        console.error('--- ERROR DETECTADO ---');
        console.error('Detalles del error:', error);
        // Responder con mensaje de error si no es cron
        if (!fromCron) {
            return res.status(500).json({
                message: 'Error al ejecutar el proceso.',
                error: error?.message || String(error)
            });
        }

        console.log('Error durante la ejecución desde cron:', error.message || error);
    }
};

