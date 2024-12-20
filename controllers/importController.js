const db = require('../models');
const axios = require('axios');
const getEncryptedText = require('../utils/encrypt');

exports.importHistoweb = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        // Buscar en la tabla credentials los datos del usuario
        const credentials = await db.credential.findOne({ where: { user_id } });

        if (!credentials) {
            return res.status(404).json({ error: 'No se encontraron credenciales para el usuario especificado.' });
        }

        const { token_histoweb, url_histoweb_products } = credentials;

        if (!token_histoweb || !url_histoweb_products) {
            return res.status(400).json({ error: 'Las credenciales están incompletas.' });
        }

        // Validar si la URL es válida
        try {
            new URL(url_histoweb_products); // Intentar crear un objeto URL
        } catch (err) {
            return res.status(400).json({ error: 'La URL proporcionada no es válida.' });
        }

        const encryptedText = getEncryptedText(token_histoweb);

        const response = await axios.get(url_histoweb_products, {
            headers: { 'ApiSignature': encryptedText },
        });

        const responseBodyProducts = response.data.response_body;

        // Definir cuántos productos deseas traer
        const limit = 2; // Por ejemplo, traer solo los primeros 2 productos
        const productsToProcess = responseBodyProducts.slice(0, limit);

        const allProducts = [];

        for (const product of productsToProcess) {
            const taxable = product.tax_percentage !== 0;
            const price = parseFloat(product.discount_price).toFixed(2); // Convertir a float
            const compareAtPrice = product.regular_price > product.discount_price
                ? parseFloat(product.regular_price).toFixed(2) // Convertir a float
                : null;

            const variant = await db.variant.findOne({
                where: { sku: product.sku },
                include: [{ model: db.product, where: { user_id } }]
            });

            if (!variant) {
                // Producto y variante no existen, crear ambos
                const newProduct = await db.product.create({
                    title: product.name,
                    user_id,
                    tags: product.product_use || '',
                });

                const newVariant = await db.variant.create({
                    product_id: newProduct.id,
                    sku: product.sku,
                    price,
                    compare_at_price: compareAtPrice,
                });

                // Asignar precios en todas las listas de precios
                const priceLists = await db.price_list.findAll({
                    where: { user_id: user_id }
                });

                for (const priceList of priceLists) {
                    await db.price.create({
                        variant_id: newVariant.id,
                        price_list_id: priceList.id,
                        price: price,  // Usamos el precio de la variante
                        compare_at_price: compareAtPrice,
                        currency: 'COP',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                allProducts.push(newProduct);
                continue;
            }

            const existingProduct = variant.product;

            // Solo se actualizan precios en la lista de precios predeterminada
            const defaultPriceList = await db.price_list.findOne({
                where: { user_id: user_id, default: true }
            });

            // Buscar si ya existe un precio para esta variante en la lista de precios predeterminada
            const existingPrice = await db.price.findOne({
                where: { variant_id: variant.id, price_list_id: defaultPriceList.id }
            });

            if (defaultPriceList) {

                if (existingPrice) {
                    // Si existe el precio y es diferente, actualizamos
                    const changes = [];

                    // Compara el precio anterior con el nuevo
                    if (parseFloat(existingPrice.price).toFixed(2) !== price || parseFloat(existingPrice.compare_at_price).toFixed(2) !== compareAtPrice) {
                        if (parseFloat(existingPrice.price).toFixed(2) !== price) {
                            changes.push({
                                field: 'price',
                                oldValue: existingPrice.price,
                                newValue: price,
                            });
                            existingPrice.price = price;
                        }

                        // Compara el compare_at_price anterior con el nuevo
                        if (compareAtPrice && parseFloat(existingPrice.compare_at_price).toFixed(2) !== compareAtPrice) {
                            changes.push({
                                field: 'compare_at_price',
                                oldValue: existingPrice.compare_at_price,
                                newValue: compareAtPrice,
                            });
                            existingPrice.compare_at_price = compareAtPrice;
                        }

                        // Guardar los cambios solo si hay alguna diferencia
                        for (const change of changes) {
                            if (change.oldValue !== change.newValue) {
                                await db.change_log.create({
                                    product_id: existingProduct.id,
                                    variant_id: variant.id,
                                    field: change.field,
                                    oldValue: change.oldValue,
                                    newValue: change.newValue,
                                });
                            }
                        }

                        // Guardar los cambios en la base de datos
                        existingPrice.updatedAt = new Date(); // Marca el tiempo de actualización
                        await existingPrice.save();
                        console.log(`Precio actualizado para el SKU ${product.sku}`);
                    }
                } else {
                    // Si no existe el precio, creamos uno nuevo en la lista de precios predeterminada
                    await db.price.create({
                        variant_id: variant.id,
                        price_list_id: defaultPriceList.id,
                        price: price,
                        compare_at_price: compareAtPrice,
                        currency: 'COP',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    console.log(`Precio creado para el SKU ${product.sku}`);
                }
            }

            // Comparar campos y registrar cambios en change_logs
            const changes = [];

            console.log('Variant:', variant)


            if (existingProduct.title !== product.name) {
                changes.push({
                    field: 'title',
                    oldValue: existingProduct.title,
                    newValue: product.name,
                });
                existingProduct.title = product.name;
            }

            if (parseFloat(existingPrice.price) !== price) {
                changes.push({
                    field: 'price',
                    oldValue: existingPrice.price,
                    newValue: parseFloat(price),
                });
                existingPrice.price = price;
            }

            if (parseFloat(existingPrice.compare_at_price) !== compareAtPrice) {
                changes.push({
                    field: 'compare_at_price',
                    oldValue: existingPrice.compare_at_price,
                    newValue: parseFloat(compareAtPrice),
                });
                existingPrice.compare_at_price = compareAtPrice;
            }

            // Registrar cambios en la tabla change_logs solo si hay alguna diferencia
            for (const change of changes) {
                if (change.oldValue !== change.newValue) {
                    await db.change_log.create({
                        product_id: existingProduct.id,
                        variant_id: variant.id,
                        field: change.field,
                        oldValue: change.oldValue,
                        newValue: change.newValue,
                    });
                }
            }

            console.log('Cambios registrados:', changes);

            // Actualizar registros en la base de datos
            await existingProduct.save();
            await variant.save();

            allProducts.push(existingProduct);
        }

        res.status(200).json({ message: 'Productos procesados correctamente', allProducts });
    } catch (error) {
        console.error('Error al importar productos:', error);

        // Si el error es relacionado con la URL o la solicitud HTTP
        if (error.isAxiosError) {
            return res.status(500).json({ error: 'Error en la solicitud a la API de Histoweb.' });
        }

        // Si hay algún otro tipo de error, devuelve un mensaje genérico
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
