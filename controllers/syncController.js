const db = require('../models');
const axios = require('axios');
const syncFunctions = require('../functions/sync');
const { recursiveEnqueue, recursiveEnqueueUpdate } = require('../functions/aws')
const { Op } = require("sequelize");

exports.send = async (req, res, next) => {
    const user_id = req?.params?.user_id || req.body.user_id;
    const { create, update, fromCron = false } = req.body;

    console.log('--- INICIO DEL PROCESO ---');
    console.log('ID de usuario:', user_id);

    const userCredentials = await db.credential.findOne({ where: { user_id: user_id } });

    if (!userCredentials) {
        console.log('No se encontraron credenciales para el usuario:', user_id);
        if (!fromCron) {
            return res.status(404).json({ message: 'No se encontraron credenciales para este usuario.' });
        }
        console.log('No se encontraron credenciales para el usuario en cron');
        return; // Si es desde cron, simplemente no respondemos
    }

    const { shopify_domain, token_shopify } = userCredentials.dataValues;

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

        const { title, product_type, price, compare_at_price, tags, vendor, description } = userParameters.dataValues;
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
                        //console.log(`Variante después de eliminar campos (${isUpdate ? 'ACTUALIZAR' : 'CREAR'}):`, JSON.stringify(variant, null, 2));

                        return variant;
                    });
                }

                const fieldsToDelete = [
                    'user_id',
                    ...(!vendor ? ['vendor'] : []),
                    ...(!description ? ['description'] : []),
                    'template',
                    ...(isUpdate && tags === false ? ['tags'] : []),
                    ...(!title ? ['title'] : []),
                    ...(!product_type ? ['product_type'] : []),
                    'createdAt',
                    'updatedAt',
                ];
                fieldsToDelete.forEach(field => delete product[field]);
                //console.log(`Producto después de eliminar campos (${isUpdate ? 'ACTUALIZAR' : 'CREAR'}):`, JSON.stringify(product, null, 2));

                return product;
            });
        };

        // Verificar que create y update sean arrays válidos
        const processedCreate = Array.isArray(create) ? processProducts(create) : [];
        console.log('Productos procesados para crear:', JSON.stringify(processedCreate, null, 2));
        const processedUpdate = Array.isArray(update) ? processProducts(update, true) : [];
        //console.log('Productos procesados para actualizar:', JSON.stringify(processedUpdate, null, 2));

        if (processedCreate.length > 0) {
            console.log('Encolando productos para crear...');
            console.log('Productos a encolar:', processedCreate);
            await recursiveEnqueue(processedCreate, shopify_domain, token_shopify, 0);
            if (!fromCron) {
                await syncFunctions.logSync(user_id, 'Manual');
                return res.status(200).json({ message: 'Productos encolados exitosamente para creación.' });
            }
            console.log('Productos encolados para creación automaticamente (ejecución cron)');
        }

        if (processedUpdate.length > 0) {
            console.log('Encolando productos para actualizar...');
            console.log('Productos a encolar:', processedUpdate);
            //console.log('Variantes a encolar:', processedUpdate.variants);
            await recursiveEnqueueUpdate(processedUpdate, shopify_domain, token_shopify, 0);
            if (!fromCron) {
                await syncFunctions.logSync(user_id, 'Manual');
                return res.status(200).json({ message: 'Productos encolados exitosamente para actualización.' });
            }
            console.log('Productos encolados para actualización automaticamente (ejecución cron)');
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

exports.changeRecords = async (req, res) => {
    const { user_id } = req.params; // user_id obtenido de los parámetros de la solicitud
    const { state, field, fromDate, toDate } = req.query;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const whereCondition = {
            ...(state ? { state: state } : {}),
            ...(field ? { field: field } : {}),
            ...(fromDate
                ? { createdAt: { [Op.gte]: new Date(`${fromDate}T00:00:00.000Z`) } } // Desde la fecha dada en adelante
                : {}),
            ...(toDate
                ? { createdAt: { [Op.lte]: new Date(`${toDate}T23:59:59.999Z`) } } // Hasta la fecha dada
                : {}),
        };

        // Consultar los registros de change_log asociados al user_id
        const changeLogs = await db.change_log.findAll({
            limit: limit,
            offset: offset,
            where: whereCondition,
            order: [['createdAt', 'DESC']], // Ordenar por fecha de creación descendente
            include: [
                {
                    model: db.product,
                    required: true, // Asegura que solo se incluyan registros con coincidencia en product
                    where: { user_id },
                    include: [
                        {
                            model: db.variant, // Incluye las variantes asociadas al producto
                            required: true,
                            where: { user_id },
                        },
                    ],
                },
                {
                    model: db.price_list, // Información adicional de price_list
                    required: false,
                },
                {
                    model: db.channel, // Información adicional de channel
                    required: false,
                },
            ],
        });

        const totalRecords = await db.change_log.count({
            where: whereCondition,
        });

        // Verifica si hay resultados
        if (changeLogs.length > 0) {
            return res.status(200).json({
                rows: changeLogs,
                total: totalRecords,
            });
        } else {
            return res.status(200).json({
                rows: [],
                total: 0,
                message: 'No se encontraron registros de cambios asociados al usuario.',
            });
        }
    } catch (error) {
        console.error('Error en la consulta de registros:', error);
        return res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};


exports.syncRecords = async (req, res) => {
    const { user_id } = req.params; // user_id obtenido de los parámetros de la solicitud
    const { sync_form, fromDate, toDate } = req.query;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const whereCondition = {
            ...(sync_form ? { sync_form: sync_form } : {}),
            ...(fromDate
                ? { createdAt: { [Op.gte]: new Date(`${fromDate}T00:00:00.000Z`) } } // Desde la fecha dada en adelante
                : {}),
            ...(toDate
                ? { createdAt: { [Op.lte]: new Date(`${toDate}T23:59:59.999Z`) } } // Hasta la fecha dada
                : {}),
        };

        // Consultar los registros de change_log asociados al user_id
        const syncLogs = await db.sync_log.findAll({
            limit: limit,
            offset: offset,
            where: whereCondition,
            order: [['createdAt', 'DESC']],
        });

        const totalRecords = await db.sync_log.count({
            where: whereCondition,
        });

        // Verifica si hay resultados
        if (syncLogs.length > 0) {
            return res.status(200).json({
                rows: syncLogs,
                total: totalRecords,
            });
        } else {
            return res.status(200).json({
                rows: [],
                total: 0,
                message: 'No se encontraron registros de sincronización asociados al usuario.',
            });
        }
    } catch (error) {
        console.error('Error en la consulta de registros:', error);
        return res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};