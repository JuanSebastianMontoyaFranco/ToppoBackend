const db = require('../models');
const { Op } = require('sequelize');
const ordersFunctions = require('../functions/order');
const globalFunctions = require('../functions/global');

exports.create = async (req, res, next) => {
    let giftCardAmount = 0;
    let cuponCode = req.body.discount_codes.length > 0
        ? req.body.discount_codes[Math.min(req.body.discount_codes.length - 1, 1)].code
        : "";

    if (req.body.discount_applications.length > 0) {
        cuponCode = req.body.discount_applications[0].title;
    }

    cuponCode = cuponCode.startsWith("FX") ? "" : cuponCode;

    try {
        const userId = await ordersFunctions.getUserId(req.body.order_status_url);
        const billing_id = globalFunctions.removeSpecialCharacters(req.body.billing_address.company);
        const transactionId = await ordersFunctions.getTransactionId(req.body.id, req.body.confirmation_number);
        const shipping_total = req.body.shipping_lines?.length
            ? req.body.shipping_lines[0].price
            : 0;

        const payment_method = req.body.payment_gateway_names.length > 1
            ? req.body.payment_gateway_names[req.body.payment_gateway_names.length - 1]
            : req.body.payment_gateway_names[0];

        const isSameAddress = req.body.billing_address?.address1 &&
            (req.body.shipping_address?.address1
                ? req.body.billing_address.address1 === req.body.shipping_address.address1
                : true);

        const defaultPriceList = await db.price_list.findOne({
            where: { user_id: userId, default: true },
        });

        if (!defaultPriceList) {
            throw new Error("No se encontró una lista de precios por defecto.");
        }

        if (isSameAddress) {
            console.log("Las direcciones son iguales.");
        } else {
            console.log("Las direcciones no son iguales.");
        }

        if (req.body.payment_gateway_names[0] === "gift_card") {
            const giftCardData = await ordersFunctions.getGiftCardValues(order.id);
            const giftCardAmount = giftCardData.amount;
            const giftCardPaymentId = giftCardData.paymentId;

            console.log('VALOR DE LA TARJETA REGALO:', giftCardAmount);
            console.log('ID DEL MÉTODO DE PAGO TARJETA REGALO:', giftCardPaymentId);
        }
        console.log('VALOR DE LA TARJETA REGALO:', giftCardAmount);


        let client = await db.client.findOne({ where: { billing_id } });

        if (!client) {
            // Crear cliente si no existe
            client = await db.client.create({
                billing_id,
                user_id: userId,
                price_list_id: defaultPriceList.id,
                seller_id: 0,
                role: 'client',
                customer_ip_address: req.body.browser_ip,
                customer_user: req.body.customer.id,
                billing_first_name: req.body.billing_address.first_name,
                billing_last_name: req.body.billing_address.last_name,
                billing_email: req.body.email,
                billing_phone: req.body.billing_address.phone,
                billing_address_1: req.body.billing_address.address1,
                billing_address_2: req.body.billing_address.address2,
                billing_city_id: await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_id'),
                billing_city: req.body.billing_address.city,
                billing_state: globalFunctions.removeSpecialCharacters(req.body.billing_address.province.toUpperCase()),
                billing_country: req.body.billing_address.country.toUpperCase()
            });
        }

        const order = await db.order.create({
            order_id: req.body.id,
            user_id: userId,
            ecommerce_id: req.body.id,
            invoice_id: 0,
            ecommerce_reference: 'shopify',
            ecommerce_name: req.body.name,
            doc_number: req.body.order_number,
            prefix: 'Por definir',
            date_create: req.body.created_at,
            date_update: req.body.updated_at,
            payment: payment_method,
            status: req.body.financial_status,
            transaction_id: transactionId,
            customer_ip_address: req.body.browser_ip,
            customer_user: req.body.customer.id,

            billing_id,
            billing_first_name: req.body.billing_address.first_name,
            billing_last_name: req.body.billing_address.last_name,
            billing_email: req.body.email,
            billing_phone: req.body.billing_address.phone,
            billing_address_1: req.body.billing_address.address1,
            billing_address_2: req.body.billing_address.address2,
            billing_city_id: await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_id'),
            billing_city: req.body.billing_address.city,
            billing_format_city: await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_desc_2'),
            billing_state: globalFunctions.removeSpecialCharacters(req.body.billing_address.province.toUpperCase()),
            billing_country: req.body.billing_address.country.toUpperCase(),

            shipping_id: isSameAddress ? '' : globalFunctions.removeSpecialCharacters(req.body.shipping_address.company),
            shipping_first_name: isSameAddress ? '' : req.body.shipping_address.first_name,
            shipping_last_name: isSameAddress ? '' : req.body.shipping_address.last_name,
            shipping_email: isSameAddress ? '' : req.body.email,
            shipping_phone: isSameAddress ? '' : req.body.shipping_address.phone,
            shipping_address_1: isSameAddress ? '' : req.body.shipping_address.address1,
            shipping_address_2: isSameAddress ? '' : req.body.shipping_address.address2,
            shipping_city_id: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_id'),
            shipping_city: isSameAddress ? '' : req.body.shipping_address.city,
            shipping_format_city: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_desc_2'),
            shipping_state: isSameAddress ? '' : globalFunctions.removeSpecialCharacters(req.body.shipping_address.province.toUpperCase()),
            shipping_country: isSameAddress ? '' : req.body.shipping_address.country.toUpperCase(),

            order_total: req.body.total_price,
            shipping_total: shipping_total,

            cupon_code: cuponCode,

            hook: false,
            state: 0,
            code: 9999,
            message: 'Sin Procesar',
        });

        const update_line_items = await ordersFunctions.getBranch(req.body.line_items, userId);

        for (const lineItem of update_line_items) {

            const variant = await ordersFunctions.getVariant(lineItem.sku, userId);

            variant.compare_at_price = await ordersFunctions.getCompareAtPrice(variant.id, userId);

            const naturalDiscountValue =  // Descuento entre el precio de comparación y precio de venta
                variant.compare_at_price !== null && variant.compare_at_price > lineItem.price
                    ? variant.compare_at_price - lineItem.price
                    : 0;

            const naturalDiscountPercentage =
                naturalDiscountValue > 0
                    ? (naturalDiscountValue / variant.compare_at_price) * 100
                    : 0;

            let extraDiscount = 0;

            if (lineItem.discount_allocations && lineItem.discount_allocations.length > 0) {
                extraDiscount = parseFloat(lineItem.discount_allocations[0].amount);
            }

            const discountOutsideShopify = naturalDiscountPercentage / 100;
            const undiscountedPrice = variant.compare_at_price > 0 ? variant.compare_at_price : lineItem.price;
            const totalDiscounts = parseFloat(lineItem.total_discount) + extraDiscount;
            const discount = discountOutsideShopify + (totalDiscounts / (undiscountedPrice * lineItem.quantity));
            const unitary = undiscountedPrice / 1.19;
            const grossValue = unitary * lineItem.quantity;
            const discountValue = grossValue * discount;
            const subtotal_1 = grossValue - discountValue;
            const subtotal_2 = ((parseFloat(lineItem.price) * parseFloat(lineItem.quantity)));
            const tax = (grossValue * (1 - discount)) * 0.19;


            await db.order_item.create({
                order_id: req.body.id,
                doc_number: req.body.order_number,
                product_id: lineItem.id,
                sku: lineItem.sku,
                item_name: lineItem.name,
                qty: lineItem.quantity,
                unitary_price_1: unitary,
                unitary_price_tax_1: undiscountedPrice,
                unitary_price_2: unitary,
                unitary_price_tax_2: undiscountedPrice,
                discounted_percentage: discount * 100,
                discounted_value_1: parseFloat(discountValue),
                discounted_value_2: naturalDiscountValue,
                base_price_2: parseFloat(lineItem.price),
                tax_percentage: parseFloat(lineItem.tax_lines[0]?.rate * 100 || 0),
                tax: tax,
                line_total_1: subtotal_1,
                line_total_2: subtotal_2,
                branch_id: lineItem.branch_id,
                branch_name: lineItem.branch_name,
            });
        }

        console.log('Orden creada con éxito');
        return res.status(200).send({
            message: 'Orden creada con éxito.',
            order_id: order.id
        });
    } catch (error) {
        console.error('Error al crear la orden:', error);
        return res.status(500).send({
            message: 'Hubo un error al crear la orden.',
            error: error.message
        });
    }
};


exports.list = async (req, res, next) => {
    const { user_id } = req.params;
    const { state } = req.query;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const searchCondition = search ? {
            [Op.or]: [
                { ecommerce_id: { [Op.like]: `%${search}%` } },
                { billing_first_name: { [Op.like]: `%${search}%` } },
                { billing_last_name: { [Op.like]: `%${search}%` } },
                { shipping_first_name: { [Op.like]: `%${search}%` } },
                { shipping_last_name: { [Op.like]: `%${search}%` } }

            ]
        } : {};

        const whereCondition = {
            user_id: user_id,
            ...searchCondition,
            ...(state ? { state: state } : {}),
        };

        const orders = await db.order.findAndCountAll({
            limit: limit,
            offset: offset,
            where: whereCondition,
            order: [['date_create', 'DESC']], // Ordenar por fecha de creación descendente
            include: [
                {
                    model: db.order_item
                }
            ]
        });


        const totalOrders = await db.order.count({
            where: whereCondition,
        });

        if (orders.count > 0) {
            // Agregar datos del cliente dentro de cada orden
            const ordersWithClient = orders.rows.map(order => ({
                ...order.toJSON(), // Convierte la instancia de Sequelize a un objeto plano
                client: {
                    name: order.billing_first_name,
                    email: order.billing_email
                }
            }));

            res.status(200).json({
                rows: ordersWithClient,
                total: totalOrders
            });
        } else {
            res.status(200).send({
                rows: [],
                total: 0,
                message: 'Aún no has agregado ordenes.'
            });
        }
    } catch (error) {
        console.error('Error en la consulta de ordenes:', error);
        return res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};


exports.detail = async (req, res, next) => {
    const order_id = req.query.order_id;

    try {
        const order = await db.order.findAndCountAll({
            where: { order_id: order_id },
            include: [{
                model: db.order_item,
            }],
        });
        if (order.count > 0) {
            res.status(200).json({
                rows: order.rows,
                total: order.count
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


exports.update = async (req, res, next) => {
    try {

        const isSameAddress = req.body.billing_address?.address1 === req.body.shipping_address?.address1;

        const payment_method = req.body.payment_gateway_names.length > 1
            ? req.body.payment_gateway_names[req.body.payment_gateway_names.length - 1]
            : req.body.payment_gateway_names[0];

        const existingOrder = await db.order.findOne({
            where: { order_id: req.body.id },
        });

        const transactionId = await ordersFunctions.getTransactionId(req.body.id, req.body.confirmation_number);

        if (!existingOrder) {
            return res.status(404).send({
                error: 'La orden no existe en la base de datos.',
            });
        }

        await existingOrder.update({
            date_create: req.body.created_at,
            date_update: req.body.updated_at,
            status: req.body.financial_status,
            payment: payment_method,
            transaction_id: transactionId,

            billing_id: isSameAddress ? globalFunctions.removeSpecialCharacters(req.body.shipping_address.company || '') : globalFunctions.removeSpecialCharacters(req.body.billing_address.company),
            billing_first_name: isSameAddress ? req.body.shipping_address.first_name : req.body.billing_address.first_name,
            billing_last_name: isSameAddress ? req.body.shipping_address.last_name : req.body.billing_address.last_name,
            billing_email: req.body.email,
            billing_phone: isSameAddress ? req.body.shipping_address.phone : req.body.billing_address.phone,
            billing_address_1: isSameAddress ? req.body.shipping_address.address1 : req.body.billing_address.address1,
            billing_address_2: isSameAddress ? req.body.shipping_address.address2 : req.body.billing_address.address2,

            billing_city_id: isSameAddress ?
                await await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_id')
                : await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_id'),
            billing_city: isSameAddress ? req.body.shipping_address.city : req.body.billing_address.city,
            billing_format_city: isSameAddress ?
                await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_desc_2')
                : await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_desc_2'),
            billing_state: isSameAddress ? req.body.shipping_address.province.toUpperCase() : req.body.billing_address.province.toUpperCase(),
            billing_country: isSameAddress ? req.body.shipping_address.country.toUpperCase() : req.body.billing_address.country.toUpperCase(),

            shipping_id: isSameAddress ? '' : globalFunctions.removeSpecialCharacters(req.body.shipping_address.company),
            shipping_first_name: isSameAddress ? '' : req.body.shipping_address.first_name,
            shipping_last_name: isSameAddress ? '' : req.body.shipping_address.last_name,
            shipping_email: isSameAddress ? '' : req.body.email,
            shipping_phone: isSameAddress ? '' : req.body.shipping_address.phone,
            shipping_address_1: isSameAddress ? '' : req.body.shipping_address.address1,
            shipping_address_2: isSameAddress ? '' : req.body.shipping_address.address2,
            shipping_city_id: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_id'),
            shipping_city: isSameAddress ? '' : req.body.shipping_address.city,
            shipping_format_city: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_desc_2'),
            shipping_state: isSameAddress ? '' : req.body.shipping_address.province.toUpperCase(),
            shipping_country: isSameAddress ? '' : req.body.shipping_address.country.toUpperCase(),

        });
        await existingOrder.save();

        console.log('Órden actualizada con éxito');
        return res.status(200).json({
            message: 'Órden actualizada con éxito'
        })
    } catch (error) {
        console.error('Error en la función updateOrder:', error);
        return res.status(500).json({
            error: 'Error actualizando la orden',
            message: error.message
        });
    }
}


exports.updateState = async (req, res, next) => {
    try {
        const existingOrder = await db.order.findOne({
            where: { order_id: req.body.order_ref },
        });

        if (!existingOrder) {
            return { status: 404, message: 'La orden no existe en la base de datos.' };
        }

        await existingOrder.update({
            code: req.body.response_code,
            message: req.body.response_message,
            state: req.body.state,
            invoice_id: req.body.order_id
        });
        await existingOrder.save();
        console.log('Órden actualizada con éxito');
        return res.status(200).json({
            message: 'Órden actualizada con éxito'
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar la órden:',
            error: error
        });
    }
};


exports.modify = async (req, res, next) => {
    const { order_id } = req.params;
    const { billing_id, billing_state,
        billing_format_city, shipping_id,
        shipping_state, shipping_format_city,
        state, code, message
    } = req.body;

    try {
        // Encuentra la orden por order_id
        const order = await db.order.findOne({
            where: { order_id: order_id }
        });

        // Si no se encuentra la orden, responde con error
        if (!order) {
            return res.status(404).send({
                error: 'Orden no encontrada.'
            });
        }

        // Construir dinámicamente el objeto de actualización
        const fieldsToUpdate = {};

        if (billing_id) fieldsToUpdate.billing_id = billing_id;
        if (billing_state) fieldsToUpdate.billing_state = billing_state;
        if (billing_format_city) {
            fieldsToUpdate.billing_format_city = billing_format_city;
            fieldsToUpdate.billing_city_id = await ordersFunctions.searchCity(billing_format_city, 'city_id');
        }
        if (shipping_id) fieldsToUpdate.shipping_id = shipping_id;
        if (shipping_state) fieldsToUpdate.shipping_state = shipping_state;
        if (shipping_format_city) {
            fieldsToUpdate.shipping_format_city = shipping_format_city;
            fieldsToUpdate.shipping_city_id = await ordersFunctions.searchCity(shipping_format_city, 'city_id');
        }

        if (state !== undefined) fieldsToUpdate.state = state;
        if (code !== undefined) fieldsToUpdate.code = code;
        if (message !== undefined) fieldsToUpdate.message = message;

        // Actualiza los campos dinámicos
        if (Object.keys(fieldsToUpdate).length > 0) {
            await order.update(fieldsToUpdate);
        }

        // Responde con el objeto actualizado
        res.status(200).json({
            message: 'Orden actualizada correctamente.',
            updatedFields: fieldsToUpdate, // Devuelve los campos actualizados
        });
    } catch (error) {
        console.error('Error en la actualización:', error);
        res.status(500).send({
            error: '¡Error en el servidor!'
        });
        next(error);
    }
};


exports.listHistoweb = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        const whereClause = {
            state: 0,
            status: 'paid',
        };

        // Agregar filtro por user_id si se proporciona
        if (user_id) {
            whereClause.user_id = user_id;
        }

        const orders = await db.order.findAll({
            order: [['date_create', 'DESC']],
            where: whereClause,
            include: {
                model: db.order_item,
            },
            limit: 1000,
        });

        const result = await Promise.all(
            orders.map(async (order) => {
                const orderData = {
                    order_ref: order.order_id.toString(),
                    id_shopify: order.ecommerce_name,
                    order_date: globalFunctions.formatDate2(order.date_create),
                    paid_date: globalFunctions.formatDate2(order.date_update),
                    order_status: order.status === "paid" ? "wwc_processing" : order.status,
                    payment_method: order.payment === "Wompi"
                        ? "wompi_wwp"
                        : order.payment === "Addi Payment"
                            ? "addi"
                            : order.payment,
                    transaction_id: order.transaction_id,
                    //customer_ip_address: order.customer_ip_address,
                    //customer_user: order.customer_user,
                    billing_cedula: order.billing_id,
                    billing_first_name: order.billing_first_name,
                    billing_last_name: order.billing_last_name,
                    billing_email: order.billing_email,
                    billing_phone: order.billing_phone,
                    billing_address_1: order.billing_address_1,
                    billing_address_2: order.billing_address_2,
                    billing_city_id: parseInt(order.billing_city_id),
                    billing_city_name: order.billing_format_city,
                    billing_typedcity: order.billing_city,
                    //billing_state: order.billing_state,
                    //billing_country: order.billing_country,
                    shipping_first_name: order.shipping_first_name,
                    shipping_last_name: order.shipping_last_name,
                    shipping_address_1: order.shipping_address_1,
                    shipping_address_2: order.shipping_address_2,
                    shipping_city_id: parseInt(order.shipping_city_id ? order.shipping_city_id : 0),
                    shipping_city_name: order.shipping_format_city,
                    shipping_typedcity: order.shipping_city,
                    //shipping_state: order.shipping_state,
                    //shipping_country: order.shipping_country,
                    shipping_notes: "",
                    order_total: order.order_total,
                    cupon_code: order.cupon_code,
                    order_items: [],
                };

                if (order.order_items && order.order_items.length > 0) {
                    await Promise.all(
                        order.order_items.map(async (item) => {
                            orderData.order_items.push({
                                item_id: item.product_id,
                                item_sku: item.sku,
                                item_name: item.item_name,
                                branch_id: item.branch_id || 0,
                                branch_name: item.branch_name || "",
                                unitario_coniva: parseInt(item.unitary_price_tax_2),
                                valor_dcto: item.discounted_value_2,
                                valor_bruto: item.base_price_2,
                                qty: item.qty,
                                line_total: item.line_total_2,
                                cupon_produc_value: 0,
                                cupon_servic_value: 0,
                            });
                        })
                    );
                }

                return orderData;
            })
        );

        return res.status(200).json({ orders: result });
    } catch (error) {
        console.error('Error en la consulta de órdenes:', error);
        return res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};


exports.listSerpi = async (req, res, next) => {
    const { user_id } = req.params;
    try {
        // Obtiene las órdenes junto con sus detalles (order_items)
        const orders = await db.order.findAll({
            where: {
                user_id: user_id
            },
            include: [{
                model: db.order_item, // Relación con la tabla order_items
            }]
        });

        if (orders.length !== 0) {
            const formattedOrders = orders.map(order => {
                // Construye la estructura formasPago
                const formasPago = [
                    {
                        idFormaPago: order.payment === "Wompi" ? 11 : 7,
                        valorPago: parseFloat(order.order_total),
                        fechaPago: globalFunctions.formatDate(order.date_create),
                        codigoAutorizacion: order.transaction_id,
                        codigoTransaccion: order.order_id.toString(),
                    }
                ];

                // Inicializa el array de detalles
                let detalles = order.order_items.map(item => ({
                    idArticulo: parseFloat(item.sku),
                    cantidad: item.qty,
                    valorUnitario: parseFloat(item.unitary_price_1),
                    porcdescuento: parseFloat(item.discounted_percentage),
                    descuentovalor: item.discounted_value_1,
                    porcImpuesto: item.tax_percentage,
                    subtotal: item.line_total_1.toString(),
                    impuesto: parseFloat(item.tax)
                }));

                // Agrega el detalle del envío si shipping_total es mayor que 0
                if (parseFloat(order.shipping_total) > 0) {
                    detalles.push({
                        idArticulo: 1,
                        cantidad: 1,
                        valorUnitario: parseFloat(order.shipping_total),
                        porcdescuento: 0,
                        descuentovalor: 0,
                        porcImpuesto: 0,
                        subtotal: Math.round(order.shipping_total).toString(),
                        impuesto: 0
                    });
                }

                // Retorna la orden con la estructura personalizada
                return {
                    prefijo: 'PDV',
                    numeroDoc: order.doc_number,
                    fechaDocumento: globalFunctions.formatDate(order.date_create),
                    nitTerceroEnc: order.billing_id,
                    nitVendedor: '999999999',
                    idSucursal: null,
                    idBodega: 1,
                    idListaPrecio: 1,
                    numOrdenCompra: order.doc_number.toString(),
                    comentario: null,
                    celular: order.billing_phone,
                    metodopago: order.payment,
                    estadopago: order.status === 'paid' ? 'Pagado' : order.payment,
                    detalles,
                    formasPago,
                };
            });

            res.status(200).json({
                orders: formattedOrders,
            });
        } else {
            res.status(200).send({
                orders: [],
                total: 0,
                message: 'Aún no tienes órdenes guardadas.'
            });
        }

    } catch (error) {
        console.error('Error en la consulta de órdenes:', error);
        return res.status(500).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};



exports.sendHookHistoweb = async (req, res) => {
    const { user_id } = req.params;

    try {
        const credentials = await db.credential.findOne({
            where: { user_id: user_id },
        });

        if (!credentials || !credentials.hook_histoweb) {
            return res.status(500).json({ error: 'No se encontraron credenciales o URL para el usuario' });
        }

        const response = await fetch(credentials.hook_histoweb, {
            method: 'POST',
            timeout: 300000,
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Error en la solicitud: ${response.statusText}` });
        }

        res.status(200).json({ message: 'La solicitud se completó correctamente.' });
    } catch (error) {
        console.error('Error durante la solicitud POST:', error);
        res.status(500).json({ error: 'Hubo un error al procesar la solicitud.' });
    }
};
