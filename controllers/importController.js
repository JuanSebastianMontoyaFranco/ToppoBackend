const db = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');
const getEncryptedText = require('../utils/encrypt');
const auxiliaryFunctions = require('../functions/auxiliary')

exports.importHistoweb = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        // Buscar en la tabla credentials los datos del usuario
        const credentials = await db.credential.findOne({ where: { user_id } });

        if (!credentials) {
            return res.status(404).json({ error: 'No se encontraron credenciales para el usuario especificado.' });
        }

        const { token_histoweb, url_histoweb_products, url_histoweb_services } = credentials;

        if (!token_histoweb || (!url_histoweb_products && !url_histoweb_services)) {
            return res.status(400).json({ error: 'Las credenciales están incompletas.' });
        }

        // Validar si las URLs son válidas
        const urls = [url_histoweb_products, url_histoweb_services].filter(Boolean);
        for (const url of urls) {
            try {
                new URL(url);
            } catch (err) {
                return res.status(400).json({ error: `La URL proporcionada (${url}) no es válida.` });
            }
        }

        const encryptedText = getEncryptedText(token_histoweb);

        // Realizar solicitudes a las URLs
        const responses = await Promise.all(
            urls.map((url) =>
                axios.get(url, { headers: { 'ApiSignature': encryptedText } }).then((response) => ({
                    data: response.data.response_body,
                    type: url === url_histoweb_products ? 'product' : 'service',
                }))
            )
        );

        // Fusionar datos y agregar el tipo
        const allData = responses.flatMap(({ data, type }) =>
            data.map((item) => ({
                ...item,
                type, // Agregar el tipo al ítem
            }))
        );

        // Seleccionar dos productos y dos servicios
        const products = allData.filter(item => item.type === 'product').slice(0, 2);
        const services = allData.filter(item => item.type === 'service').slice(0, 2);
        const selectedData = [...products, ...services];

        const incomingSkus = selectedData.map(item => item.sku);

        const outdatedProducts = await db.product.findAll({
            where: {
                user_id,
                status: { [Op.not]: 'archived' },
                '$variants.sku$': { [Op.notIn]: incomingSkus },
            },
            include: [{ model: db.variant }],
        });

        for (const product of outdatedProducts) {
            await db.change_log.create({
                product_id: product.id,
                variant_id: null,
                field: 'status',
                oldValue: product.status,
                newValue: 'archived',
                state: 'update',
            });
            product.status = 'archived';
            await product.save();
        }

        // Configuración para productos y servicios
        const typeConfig = {
            product: {
                product_type: 'PRODUCTO',
                template: 'product',
                requires_shipping: true,
                inventory_management: 'shopify',
                additionalFields: (item) => ({
                    tags: auxiliaryFunctions.formatTags([item.product_laboratory, item.product_type, item.product_use]),
                }),
            },
            service: {
                product_type: 'SERVICIO',
                template: 'service',
                requires_shipping: false,
                inventory_management: null,
                additionalFields: (item) => ({
                    tags: auxiliaryFunctions.formatTags([item.product_laboratory, item.product_type, item.product_use]),
                }),
            },
        };

        const allProcessedItems = [];

        for (const item of selectedData) {
            const typeKey = item.type; // 'product' o 'service'
            const typeSettings = typeConfig[typeKey];

            const taxable = item.tax_percentage !== 0;
            const price = parseFloat(item.discount_price).toFixed(2);
            const compareAtPrice = item.regular_price > item.discount_price
                ? parseFloat(item.regular_price).toFixed(2)
                : null;

            const variant = await db.variant.findOne({
                where: { sku: item.sku },
                include: [{ model: db.product, where: { user_id } }],
            });

            if (variant) {
                const existingProduct = variant.product;

                // Si el producto está archivado, cambiarlo a "draft"
                if (existingProduct.status === 'archived') {
                    await db.change_log.create({
                        product_id: existingProduct.id,
                        variant_id: variant.id,
                        field: 'status',
                        oldValue: 'archived',
                        newValue: 'draft',
                        state: 'update',
                    });
                    existingProduct.status = 'draft';
                    await existingProduct.save();
                }
                allProcessedItems.push(existingProduct);
                continue;
            }

            if (!variant) {
                // Crear producto y variante
                const newProduct = await db.product.create({
                    title: item.name,
                    user_id,
                    status: 'draft',
                    description: item.product_laboratory || '',
                    product_type: typeSettings.product_type,
                    vendor: item.product_laboratory || '',
                    template: typeSettings.template,
                    ...typeSettings.additionalFields(item),
                });
                const newVariant = await db.variant.create({
                    product_id: newProduct.id,
                    user_id: newProduct.user_id,
                    title: 'Default Title',
                    option_1: 'Default Title',
                    sku: item.sku,
                    barcode: item.barcode,
                    inventory_policy: 'deny',
                    taxable: true,
                    tax_percentage: item.tax_percentage,
                    weight: null,
                    weight_unit: '',
                    inventory_management: typeSettings.inventory_management,
                    inventory_quantity: item.stock_quantity,
                    fulfillment_service: null,
                    price,
                    compare_at_price: compareAtPrice,
                    requires_shipping: typeSettings.requires_shipping,
                });

                await db.change_log.create({
                    product_id: newProduct.id,
                    variant_id: newVariant.id,
                    field: null,
                    oldValue: null,
                    newValue: JSON.stringify({
                        product: {
                            title: newProduct.title,
                            product_type: newProduct.product_type,
                        },
                        variant: {
                            sku: newVariant.sku,
                        },
                    }),
                    state: 'create', // Estado de creación
                });

                // Asignar precios en todas las listas de precios
                const priceLists = await db.price_list.findAll({
                    where: { user_id },
                });

                for (const priceList of priceLists) {
                    await db.price.create({
                        variant_id: newVariant.id,
                        price_list_id: priceList.id,
                        price,
                        compare_at_price: compareAtPrice,
                        currency: 'COP',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                allProcessedItems.push(newProduct);
                continue;
            }

            const existingProduct = variant.product;

            // Actualizar precios en la lista de precios predeterminada
            const defaultPriceList = await db.price_list.findOne({
                where: { user_id, default: true },
            });

            if (defaultPriceList) {
                const existingPrice = await db.price.findOne({
                    where: { variant_id: variant.id, price_list_id: defaultPriceList.id },
                });

                if (existingPrice) {
                    const changes = [];

                    if (parseFloat(existingPrice.price).toFixed(2) !== price) {
                        changes.push({
                            field: 'price',
                            oldValue: existingPrice.price,
                            newValue: parseFloat(price),
                        });
                        existingPrice.price = price;
                    }

                    if (
                        compareAtPrice &&
                        parseFloat(existingPrice.compare_at_price || 0).toFixed(2) !== compareAtPrice
                    ) {
                        changes.push({
                            field: 'compare_at_price',
                            oldValue: existingPrice.compare_at_price,
                            newValue: compareAtPrice,
                        });
                        existingPrice.compare_at_price = compareAtPrice;
                    }

                    if (changes.length > 0) {
                        await Promise.all(
                            changes.map((change) =>
                                db.change_log.create({
                                    product_id: existingProduct.id,
                                    variant_id: variant.id,
                                    price_list_id: defaultPriceList.id,
                                    field: change.field,
                                    oldValue: change.oldValue,
                                    newValue: change.newValue,
                                    state: 'update',
                                })
                            )
                        );

                        existingPrice.updatedAt = new Date();
                        await existingPrice.save();
                    }
                } else {
                    await db.price.create({
                        variant_id: variant.id,
                        price_list_id: defaultPriceList.id,
                        price,
                        compare_at_price: compareAtPrice,
                        currency: 'COP',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }

            const changes = [];

            if (existingProduct.title !== item.name) {
                changes.push({
                    field: 'title',
                    oldValue: existingProduct.title,
                    newValue: item.name,
                });
                existingProduct.title = item.name;
            }

            if (changes.length > 0) {
                await Promise.all(
                    changes.map((change) =>
                        db.change_log.create({
                            product_id: existingProduct.id,
                            variant_id: variant.id,
                            field: change.field,
                            oldValue: change.oldValue,
                            newValue: change.newValue,
                            state: 'update',
                        })
                    )
                );
            }

            await existingProduct.save();
            await variant.save();

            allProcessedItems.push(existingProduct);
        }

        res.status(200).json({ 
            message: 'Datos procesados correctamente', 
            products: allProcessedItems 
        });
    } catch (error) {
        console.error('Error al importar datos:', error);

        if (error.isAxiosError) {
            return res.status(500).json({ error: 'Error en la solicitud a la API de Histoweb.' });
        }

        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

exports.importSerpi = async function (req, res, next) {
    const { user_id } = req.params;

    try {
        // Obtener credenciales y parámetros
        const credentials = await db.credential.findOne({ where: { user_id } });
        const parameters = await db.sync_parameter.findOne({ where: { user_id } });

        if (!credentials) {
            return res.status(404).json({ error: 'No se encontraron credenciales para el usuario especificado.' });
        }

        if (!parameters) {
            return res.status(404).json({ error: 'No se encontraron parámetros para el usuario especificado.' });
        }

        const { token_serpi, secret_key_serpi } = credentials;
        const { price_list_serpi, branch_serpi, security_inventory } = parameters;

        console.log(branch_serpi);
        console.log(price_list_serpi);


        // Definir URLs de las APIs
        let API_article = 'https://apis.serpi.com.co/api/v1/Articulo';
        let API_price_list = 'https://apis.serpi.com.co/api/v1/ListaPrecioDetalle?idListaPrecio=';
        let API_brand = 'https://apis.serpi.com.co/api/v1/Marca';
        let API_article_category = 'https://apis.serpi.com.co/api/v1/CategoriaArticulo';
        let API_line = 'https://apis.serpi.com.co/api/v1/Linea';
        let API_inventory_balance = 'https://apis.serpi.com.co/api/v1/SaldoInventario?fechaCorte=2050-01-01&idBodega=';
        let API_fields_article = 'https://apis.serpi.com.co/api/v1/CamposArticulo';

        // Ajustar URL según las condiciones
        const checkBodegas = 0;
        const checkpricelist = 0;

        if (checkBodegas === 1) {
            API_inventory_balance = 'https://apis.serpi.com.co/api/v1/SaldoInventario?fechaCorte=2050-01-01';
        } else {
            API_inventory_balance += branch_serpi;
        }

        if (checkpricelist === 1) {
            API_price_list = 'https://apis.serpi.com.co/api/v1/ListaPrecioDetalle?idListaPrecio=2';
        } else {
            API_price_list += price_list_serpi;
        }

        const headers = {
            'secretkey': secret_key_serpi,
            'Authorization': `Bearer ${token_serpi}`
        };

        // Realizar las peticiones paralelas para obtener los datos de los productos
        const [
            response_article,
            response_price_list,
            response_brand,
            response_article_category,
            response_line,
            response_inventory_balance,
            response_fields_article
        ] = await Promise.all([
            axios.get(API_article, { headers }).catch(error => { throw new Error('Error al obtener datos de artículos: ' + error.message); }),
            axios.get(API_price_list, { headers }).catch(error => { throw new Error('Error al obtener datos de la lista de precios: ' + error.message); }),
            axios.get(API_brand, { headers }).catch(error => { throw new Error('Error al obtener datos de marcas: ' + error.message); }),
            axios.get(API_article_category, { headers }).catch(error => { throw new Error('Error al obtener datos de categorías de artículos: ' + error.message); }),
            axios.get(API_line, { headers }).catch(error => { throw new Error('Error al obtener datos de líneas: ' + error.message); }),
            axios.get(API_inventory_balance, { headers }).catch(error => { throw new Error('Error al obtener datos de saldo de inventario: ' + error.message); }),
            axios.get(API_fields_article, { headers }).catch(error => { throw new Error('Error al obtener datos de campos de artículos: ' + error.message); })
        ]);

        const data_article = response_article.data.result;
        const data_price_list = response_price_list.data.result;
        const data_brand = response_brand.data.result;
        const data_article_category = response_article_category.data.result;
        const data_line = response_line.data.result;
        const data_inventory_balance = response_inventory_balance.data.result;
        const data_fields_article = response_fields_article.data.result;

        // Filtrar y transformar los productos
        if (Array.isArray(data_article) && data_article.length > 0) {
            const transformedProducts = data_article
                .filter(product => product.exportable)
                .map(product => {
                    const matchingData = data_price_list.find(data => data.id_articulo === product.id);
                    const matchingData2 = data_brand.find(data => data.id === product.idmarca);
                    const matchingData3 = data_article_category.find(data => data.id === product.idcategoria);
                    const matchingData4 = data_line.find(data => data.id === product.idlinea);
                    const matchingData5 = data_inventory_balance.find(data => data.idArticulo === product.id);

                    const isExportable = product.exportable;
                    let inventory = matchingData5 ? matchingData5.saldo : 0;
                    const shipping = product.idlinea == 2;
                    let variant_price = matchingData ? matchingData.precio.toFixed(2) : '0.00';
                    const discount = matchingData ? matchingData.descuento.toFixed(2) : '0.00';

                    // Aplicar seguridad de inventario si corresponde
                    if (security_inventory && inventory === 1) {
                        inventory = 0; // Si se activa la seguridad de inventario, no permitir inventario si es 1
                    }

                    let compare_price = null;
                    if (discount > 0) {
                        compare_price = variant_price;
                        variant_price = (variant_price - (variant_price * (discount / 100))).toFixed(2);
                    }

                    const variant_sku = product.id.toString();
                    const variant_vendor = matchingData2 ? matchingData2.descripcion : "";
                    const variant_category = matchingData3 ? matchingData3.descripcion : "";
                    const linea = matchingData4 ? matchingData4.descripcion : "";

                    const inventory_management =
                        product.idlinea === 1 ? null : product.idlinea === 2 ? "shopify" : "manual";

                    // Obtener las descripciones de los campos personalizados
                    const customFieldDescriptions = Array.isArray(product.camposPersonalizados)
                        ? product.camposPersonalizados.flatMap(([field, values]) => {
                            const campoDetail = data_fields_article.find(data => data.campo.descripcion_campoarticulo === field);
                            if (campoDetail) {
                                return values.map(value => {
                                    const detail = campoDetail.detalle.find(d => Object.keys(d)[0] === value);
                                    return detail ? detail[value] : null;
                                }).filter(desc => desc !== null && desc.toLowerCase() !== 'no aplica');
                            }
                            return [];
                        })
                        : [];

                    const partsToSort = [
                        product.palabrasClave,
                        variant_category,
                        variant_vendor,
                        ...customFieldDescriptions
                    ];

                    // Función para separar y filtrar las etiquetas
                    const splitAndFilter = (part) => {
                        if (part) {
                            const tags = part.split(',').map((tag) => tag.trim());
                            return tags.filter((tag) => tag !== '' && tag.toLowerCase() !== 'no aplica');
                        }
                        return [];
                    };

                    const allTags = partsToSort.flatMap(splitAndFilter);
                    const lowerCaseTags = allTags.map((tag) => tag.toLowerCase());
                    const uniqueTagsArray = [...new Set(lowerCaseTags)];
                    uniqueTagsArray.sort();
                    const sortedTags = uniqueTagsArray.join(', ');

                    if (isExportable) {
                        const priceFloat = parseFloat(variant_price);
                        const comparePrice = parseFloat(compare_price);
                        const compare_at_price = comparePrice > 0 ? comparePrice : null;

                        // Asignar el tipo de producto según el valor de product.idlinea (1 = SERVICIO, 2 = PRODUCTO, 3 = INSUMO)
                        let product_type;
                        switch (product.idlinea) {
                            case 1:
                                product_type = "SERVICIO";
                                break;
                            case 2:
                                product_type = "PRODUCTO";
                                break;
                            case 3:
                                product_type = "INSUMO";
                                break;
                            default:
                                product_type = "OTRO"; // En caso de que no sea ninguno de los valores anteriores
                        }

                        return {
                            user_id: user_id,
                            sync_from: 'SERPI',
                            title: product.descripcion.trimRight(),
                            description: product.descripcionalterna,
                            vendor: variant_vendor,
                            product_type: product_type.toUpperCase(),
                            status: "draft",
                            published_scope: "global",
                            tags: sortedTags,
                            variant: false,
                            discount: discount,
                            published: true,
                            variants: [
                                {
                                    title: "Default Title",
                                    option1: "Default Title",
                                    price: priceFloat,
                                    sku: variant_sku,
                                    barcode: product.barras,
                                    requires_shipping: shipping,
                                    inventory_policy: "deny",
                                    compare_at_price: compare_at_price,
                                    inventory_management: inventory_management,
                                    fulfillment_service: "manual",
                                    inventory_quantity: inventory,
                                    taxable: "true",
                                    weight: '',
                                    weight_unit: '',
                                }
                            ]
                        };
                    } else {
                        return null;
                    }
                }).filter(product => product !== null);

            // Limitar a solo los primeros dos productos
            const selectedData = transformedProducts.slice(0, 2);

            const allProcessedItems = [];

            // Guardar o actualizar los productos y sus variantes
            for (const item of selectedData) {

                console.log("Item antes de buscar variante:", item);

                const variant = await db.variant.findOne({
                    where: { sku: item.variants[0].sku },
                    include: [{ model: db.product, where: { user_id } }],
                });

                if (!variant) {
                    // Crear producto y variante
                    const newProduct = await db.product.create({
                        title: item.title,
                        user_id: item.user_id,
                        product_type: item.product_type,
                    });

                    const newVariant = await db.variant.create({
                        product_id: newProduct.id,
                        user_id: newProduct.user_id,
                        sku: item.variants[0].sku,
                        price: item.variants[0].price,
                        compare_at_price: item.variants[0].compare_at_price,
                        requires_shipping: item.variants[0].requires_shipping,
                    });

                    await db.change_log.create({
                        product_id: newProduct.id,
                        variant_id: newVariant.id,
                        field: null,
                        oldValue: null,
                        newValue: JSON.stringify({
                            product: {
                                title: newProduct.title,
                                product_type: newProduct.product_type,
                            },
                            variant: {
                                sku: newVariant.sku,
                            },
                        }),
                        state: 'create', // Estado de creación
                    });

                    // Asignar precios en todas las listas de precios
                    const priceLists = await db.price_list.findAll({
                        where: { user_id },
                    });

                    for (const priceList of priceLists) {
                        await db.price.create({
                            variant_id: newVariant.id,
                            price_list_id: priceList.id,
                            price: item.variants[0].price,
                            compare_at_price: item.variants[0].compare_at_price,
                            currency: 'COP',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }

                    allProcessedItems.push(newProduct);
                    continue;
                }

                const existingProduct = variant.product;

                // Actualizar precios en la lista de precios predeterminada
                const defaultPriceList = await db.price_list.findOne({
                    where: { user_id, default: true },
                });

                if (defaultPriceList) {
                    const existingPrice = await db.price.findOne({
                        where: { variant_id: variant.id, price_list_id: defaultPriceList.id },
                    });

                    console.log('PRECIO EXISTENTE:', existingPrice);


                    if (existingPrice) {
                        const changes = [];

                        if (parseFloat(existingPrice.price).toFixed(2) !== parseFloat(item.variants[0].price).toFixed(2)) {
                            changes.push({
                                field: 'price',
                                oldValue: existingPrice.price,
                                newValue: item.variants[0].price,
                            });
                            existingPrice.price = item.variants[0].price;
                        }

                        if (
                            item.variants[0].compare_at_price &&
                            parseFloat(existingPrice.compare_at_price || 0).toFixed(2) !== parseFloat(item.variants[0].compare_at_price).toFixed(2)
                        ) {
                            changes.push({
                                field: 'compare_at_price',
                                oldValue: existingPrice.compare_at_price,
                                newValue: item.variants[0].compare_at_price,
                            });
                            existingPrice.compare_at_price = item.variants[0].compare_at_price;
                        }

                        if (changes.length > 0) {
                            await Promise.all(
                                changes.map((change) =>
                                    db.change_log.create({
                                        product_id: existingProduct.id,
                                        variant_id: variant.id,
                                        price_list_id: defaultPriceList.id,
                                        field: change.field,
                                        oldValue: change.oldValue,
                                        newValue: change.newValue,
                                        state: 'update'
                                    })
                                )
                            );

                            existingPrice.updatedAt = new Date();
                            await existingPrice.save();
                        }
                    } else {
                        await db.price.create({
                            variant_id: variant.id,
                            price_list_id: defaultPriceList.id,
                            price,
                            compare_at_price: compareAtPrice,
                            currency: 'COP',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                }

                const changes = [];

                if (existingProduct.title !== item.title) {
                    changes.push({
                        field: 'title',
                        oldValue: existingProduct.title,
                        newValue: item.title,
                    });
                    existingProduct.title = item.title;
                }

                if (changes.length > 0) {
                    await Promise.all(
                        changes.map((change) =>
                            db.change_log.create({
                                product_id: existingProduct.id,
                                variant_id: variant.id,
                                field: change.field,
                                oldValue: change.oldValue,
                                newValue: change.newValue,
                                state: 'update'
                            })
                        )
                    );
                }

                await existingProduct.save();
                await variant.save();

                allProcessedItems.push(existingProduct);

            }
        }

        res.status(200).json({ message: "Importación exitosa" });
    } catch (error) {
        console.error("Error al importar datos:", error);
        res.status(500).json({ error: "Error al importar datos." });
    }
};
