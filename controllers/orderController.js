const db = require('../models');
const { Op } = require('sequelize');
const ordersFunctions = require('../functions/order');
const functions = require('../functions/global');

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
        const transactionId = await ordersFunctions.getTransactionId(req.body.id, req.body.confirmation_number);
        const payment_method = req.body.payment_gateway_names.length > 1
            ? req.body.payment_gateway_names[req.body.payment_gateway_names.length - 1]
            : req.body.payment_gateway_names[0];
        const isSameAddress = req.body.billing_address?.address1 === req.body.shipping_address?.address1;

        if (req.body.payment_gateway_names[0] === "gift_card") {
            const giftCardData = await ordersFunctions.getGiftCardValues(order.id);
            const giftCardAmount = giftCardData.amount;
            const giftCardPaymentId = giftCardData.paymentId;

            console.log('VALOR DE LA TARJETA REGALO:', giftCardAmount);
            console.log('ID DEL MÉTODO DE PAGO TARJETA REGALO:', giftCardPaymentId);
        }
        console.log('VALOR DE LA TARJETA REGALO:', giftCardAmount);

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

            billing_id: functions.removeSpecialCharacters(req.body.billing_address.company),
            billing_first_name: req.body.billing_address.first_name,
            billing_last_name: req.body.billing_address.last_name,
            billing_email: req.body.email,
            billing_phone: req.body.billing_address.phone,
            billing_address_1: req.body.billing_address.address1,
            billing_address_2: req.body.billing_address.address2,
            billing_city_id: await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_id'),
            billing_city: req.body.billing_address.city,
            billing_format_city: await ordersFunctions.searchCity(req.body.billing_address.city.toUpperCase(), req.body.billing_address.province.toUpperCase(), 'city_desc'),
            billing_state: functions.removeSpecialCharacters(req.body.billing_address.province.toUpperCase()),
            billing_country: req.body.billing_address.country.toUpperCase(),

            shipping_id: isSameAddress ? '' : functions.removeSpecialCharacters(req.body.shipping_address.company),
            shipping_first_name: isSameAddress ? '' : req.body.shipping_address.first_name,
            shipping_last_name: isSameAddress ? '' : req.body.shipping_address.last_name,
            shipping_email: isSameAddress ? '' : req.body.email,
            shipping_phone: isSameAddress ? '' : req.body.shipping_address.phone,
            shipping_address_1: isSameAddress ? '' : req.body.shipping_address.address1,
            shipping_address_2: isSameAddress ? '' : req.body.shipping_address.address2,
            shipping_city_id: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_id'),
            shipping_city: isSameAddress ? '' : req.body.shipping_address.city,
            shipping_format_city: isSameAddress ? '' : await ordersFunctions.searchCity(req.body.shipping_address.city.toUpperCase(), req.body.shipping_address.province.toUpperCase(), 'city_desc'),
            shipping_state: isSameAddress ? '' : functions.removeSpecialCharacters(req.body.shipping_address.province.toUpperCase()),
            shipping_country: isSameAddress ? '' : req.body.shipping_address.country.toUpperCase(),

            order_total: req.body.total_price,
            shipping_total: req.body.shipping_lines[0].price,

            cupon_code: cuponCode,

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
    console.log(order_id);
    
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

