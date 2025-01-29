const axios = require('axios');
const globalFunctions = require('../functions/global')

module.exports = (db) => {
    const { order, order_item, order_parameter, credential } = db;

    const createClient = async (clientData, headers) => {
        try {
            const url = 'https://apis.serpi.com.co/api/v1/Tercero';
            const response = await axios.post(url, clientData, { headers });
            const responseData = response.data;

            console.log('Respuesta del cliente:', responseData);

            // Verificar si hay errores en el campo `errors`
            if (responseData.errors && responseData.errors.length > 0) {
                const formattedErrors = responseData.errors.join('; ');
                return {
                    success: false,
                    errors: responseData.errors,
                    message: `Errores al crear cliente: ${formattedErrors}`,
                };
            }

            // Verificar si el campo `success` es `true` y no hay errores
            if (responseData.success && (!responseData.errors || responseData.errors.length === 0)) {
                return {
                    success: true,
                    data: responseData,
                    message: responseData.message || 'Cliente creado exitosamente.',
                };
            }

            // Si no es un caso manejado explícito, devolver un mensaje genérico
            return {
                success: false,
                message: responseData.message || 'No se pudo crear el cliente. Respuesta inesperada.',
            };
        } catch (error) {
            console.error('Error al crear el cliente:', error.message);

            // Manejo de errores externos (errores de red, etc.)
            if (axios.isAxiosError(error) && error.response?.data) {
                return {
                    success: false,
                    message: error.response.data.message || 'Error desconocido en la API.',
                    errors: error.response.data.errors || [],
                };
            }

            return {
                success: false,
                message: error.message || 'Error desconocido.',
            };
        }
    };

    order.afterUpdate(async (orderInstance, options) => {
        console.log(`Hook de Order ejecutado para la orden: ${orderInstance.order_id}`);

        setTimeout(async () => {
            let clientError = null;
            let clientSuccessMessage = null;
            let orderError = null;
            let state = 2;
            let code = 404;

            try {

                const credentials = await credential.findOne({
                    where: { user_id: orderInstance.user_id },
                });

                if (!credentials) {
                    console.error(`No se encontraron credenciales para el usuario: ${orderInstance.user_id}`);
                    return;
                }

                const { token_serpi, secret_key_serpi } = credentials;

                if (!token_serpi || !secret_key_serpi) {
                    console.error(`Credenciales incompletas para el usuario: ${orderInstance.user_id}`);
                    return;
                }

                const parameters = await order_parameter.findOne({
                    where: { user_id: orderInstance.user_id },
                });

                if (!parameters || parameters.main !== 1) {
                    if (parameters && parameters.main === 2) {

                        const credentials = await credential.findOne({
                            where: { user_id: orderInstance.user_id },
                        });

                        if (!credentials) {
                            console.error(`No se encontraron credenciales para el usuario: ${orderInstance.user_id}`);
                            return;
                        }

                        const { hook_histoweb } = credentials;
                        const url = hook_histoweb;

                        console.log('POST A', hook_histoweb);

                        axios.post(url)
                            .then(() => {
                                console.log(`POST realizado correctamente para la orden: ${orderInstance.order_id}`);
                            })
                            .catch(() => {
                                console.log(`Error al realizar el POST para la orden: ${orderInstance.order_id}`);
                            });
                    } else {
                        console.log(`No se debe enviar la orden: ${orderInstance.order_id}`);
                    }
                    return;
                }

                const items = await order_item.findAll({
                    where: { order_id: orderInstance.order_id },
                });

                if (items.length === 0) {
                    console.log(`No se encontraron items para la orden: ${orderInstance.order_id}`);
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${token_serpi}`,
                    secretkey: secret_key_serpi,
                };

                const clientData = {
                    tipoidentidad: 'CC',
                    identificacion: orderInstance.billing_id,
                    dv: 0,
                    tipopersona: 2,
                    primernombre: orderInstance.billing_first_name,
                    segundonombre: null,
                    primerapellido: orderInstance.billing_last_name,
                    segundoapellido: null,
                    nombrecompleto: orderInstance.billing_first_name + orderInstance.billing_last_name,
                    razonsocial: null,
                    escliente: true,
                    esproveedor: false,
                    esempleado: false,
                    esvendedor: false,
                    esotro: false,
                    escobrador: false,
                    cumple_dia: null,
                    cumplea_mes: null,
                    cumplea_ano: null,
                    genero: null,
                    direccion: orderInstance.billing_address_1,
                    direccion2: orderInstance.billing_address_2,
                    telefono: null,
                    ext: null,
                    movil: orderInstance.billing_phone,
                    pais: orderInstance.billing_country,
                    departamento: orderInstance.billing_state,
                    ciudad: orderInstance.billing_city,
                    codciudad: orderInstance.billing_city_id,
                    zona: null,
                    email: orderInstance.billing_email,
                    activo: true,
                    cupocredito: "0",
                    periodopago: 0,
                    codigociiu: null,
                    descuentoventa: null,
                    categoriatercero: 1,
                    formapago: 11,
                    listaprecios: 1,
                    grupoventas: 1,
                    grupocompras: 10,
                    vendedor: '999999999',
                    cobrador: null,
                    fechacreacion: globalFunctions.formatDate(orderInstance.date_create),
                    regimen: 1,
                    banco: null,
                    tipo_cuenta: null,
                    cuenta_bancaria: null,
                    limite_credito: null,
                    camposPersonalizados: {},
                    responsable: null,
                };

                try {
                    const clientResult = await createClient([clientData], headers);
                    clientSuccessMessage = clientResult.message;
                } catch (error) {
                    clientError = error.message;
                    console.error(`Error al crear el cliente para la orden ${orderInstance.order_id}:`, clientError);
                }


                const message = clientError
                    ? `Cliente: ${clientError}. Orden enviada correctamente`
                    : clientSuccessMessage
                        ? `Cliente: ${clientSuccessMessage}. Orden enviada correctamente`
                        : 'Orden enviada correctamente';

                const detalles = items.map(item => ({
                    idArticulo: parseFloat(item.sku),
                    cantidad: item.qty,
                    valorUnitario: parseFloat(item.unitary_price_1),
                    porcdescuento: parseFloat(item.discounted_percentage),
                    descuentovalor: item.discounted_value_1,
                    porcImpuesto: item.tax_percentage,
                    subtotal: item.line_total_1.toString(),
                    impuesto: parseFloat(item.tax)
                }));

                await order.update(
                    { message },
                    { where: { order_id: orderInstance.order_id } }
                );

                const formasPago = [
                    {
                        idFormaPago: orderInstance.payment === "Wompi" ? 11 : 7,
                        valorPago: parseFloat(orderInstance.order_total),
                        fechaPago: globalFunctions.formatDate(orderInstance.date_create),
                        codigoAutorizacion: orderInstance.transaction_id,
                        codigoTransaccion: orderInstance.order_id.toString(),
                    }
                ];

                if (parseFloat(orderInstance.shipping_total) > 0) {
                    detalles.push({
                        idArticulo: 1,
                        cantidad: 1,
                        valorUnitario: parseFloat(orderInstance.shipping_total),
                        porcdescuento: 0,
                        descuentovalor: 0,
                        porcImpuesto: 0,
                        subtotal: Math.round(orderInstance.shipping_total).toString(),
                        impuesto: 0
                    });
                }

                const transformedOrder = {
                    prefijo: 'PDV',
                    numeroDoc: orderInstance.doc_number,
                    fechaDocumento: globalFunctions.formatDate(orderInstance.date_create),
                    nitTerceroEnc: orderInstance.billing_id,
                    nitVendedor: '999999999',
                    idSucursal: null,
                    idBodega: 1,
                    idListaPrecio: 1,
                    numOrdenCompra: orderInstance.doc_number.toString(),
                    comentario: null,
                    celular: orderInstance.billing_phone,
                    metodopago: orderInstance.payment,
                    estadopago: orderInstance.status === 'paid' ? 'Pagado' : orderInstance.payment,
                    detalles,
                    formasPago
                };

                console.log('ORDEN', JSON.stringify(transformedOrder));

                const url = 'https://apis.serpi.com.co/api/v1/PedidoVenta';
                const response = await axios.post(url, [transformedOrder], { headers });
                console.log('Orden enviada exitosamente:', response.data);

                if (response.data.errors && response.data.errors.length > 0) {
                    const errorMessages = response.data.errors.join('; ');
                    orderError = `Errores en la orden: ${errorMessages}`;
                    console.error(orderError);
                } else {
                    state = 1;
                    code = 200;
                }
            } catch (error) {
                orderError = `Error inesperado: ${error.response?.data || error.message}`;
                console.error(orderError);
            }

            const message = clientError
                ? orderError
                    ? `Error cliente: ${clientError}. Error orden: ${orderError}`
                    : `Error cliente: ${clientError}. Orden enviada correctamente.`
                : clientSuccessMessage
                    ? orderError
                        ? `Cliente: ${clientSuccessMessage}. Error orden: ${orderError}`
                        : `Cliente: ${clientSuccessMessage}. Orden enviada correctamente.`
                    : orderError
                        ? `Error orden: ${orderError}`
                        : 'Orden enviada correctamente';

            await order.update(
                { message, state, code, hook: true },
                { where: { order_id: orderInstance.order_id } }
            );
        }, 2000);
    });


    order.afterCreate(async (orderInstance, options) => {
        console.log(`Hook de Order ejecutado para la orden: ${orderInstance.order_id}`);

        if (orderInstance.hook) {
            console.log(`La orden ${orderInstance.order_id} ya fue enviada. No se ejecutará la lógica de envío.`);
            return;
        }

        console.log('la orden no ha sido enviada');


        setTimeout(async () => {
            let clientError = null;
            let clientSuccessMessage = null;
            let orderError = null;
            let state = 2;
            let code = 404;

            try {

                const clientParam = await db.client_parameter.findOne({
                    where: { user_id: orderInstance.user_id }
                });

                const skipClientData = clientParam && clientParam.check_client;

                const orderClientNit = clientParam ? clientParam.client_nit : orderInstance.billing_id;
                const orderSellerNit = clientParam ? clientParam.seller_nit : '999999999';
                const orderPrefix = clientParam ? clientParam.prefix : 'PDV';
                const paymentMethodId = clientParam ? clientParam.payment_method : (orderInstance.payment === "Wompi" ? 11 : 7);

                const parameters = await db.order_parameter.findOne({
                    where: { user_id: orderInstance.user_id },
                });

                const syncParameters = await db.sync_parameter.findOne({
                    where: { user_id: orderInstance.user_id },
                });

                const price_list_serpi = syncParameters ? syncParameters.price_list_serpi : 1

                if (!parameters || parameters.main !== 1) {
                    if (parameters && parameters.main === 2) {

                        const credentials = await credential.findOne({
                            where: { user_id: orderInstance.user_id },
                        });

                        console.log('CREDENTIALS EN HISTOWEB:', credentials);

                        if (!credentials) {
                            console.error(`No se encontraron credenciales para el usuario: ${orderInstance.user_id}`);
                            return;
                        }

                        const { hook_histoweb } = credentials;
                        const url = hook_histoweb;

                        console.log('POST A', hook_histoweb);

                        axios.post(url)
                            .then(() => {
                                console.log(`POST realizado correctamente para la orden: ${orderInstance.order_id}`);
                            })
                            .catch(() => {
                                console.log(`Error al realizar el POST para la orden: ${orderInstance.order_id}`);
                            });
                    } else {
                        console.log(`No se debe enviar la orden: ${orderInstance.order_id}`);
                    }
                    return;
                }

                const items = await order_item.findAll({
                    where: { order_id: orderInstance.order_id },
                });

                if (items.length === 0) {
                    console.log(`No se encontraron items para la orden: ${orderInstance.order_id}`);
                    return;
                }

                const credentials = await credential.findOne({
                    where: { user_id: orderInstance.user_id },
                });

                if (!credentials) {
                    console.error(`No se encontraron credenciales para el usuario: ${orderInstance.user_id}`);
                    return;
                }

                const { token_serpi, secret_key_serpi } = credentials;

                if (!token_serpi || !secret_key_serpi) {
                    console.error(`Credenciales incompletas para el usuario: ${orderInstance.user_id}`);
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${token_serpi}`,
                    secretkey: secret_key_serpi,
                };

                if (!skipClientData) {
                    console.log('Se mandan los datos del cliente');
                    const clientData = {
                        tipoidentidad: 'CC',
                        identificacion: orderInstance.billing_id,
                        dv: 0,
                        tipopersona: 2,
                        primernombre: orderInstance.billing_first_name,
                        segundonombre: null,
                        primerapellido: orderInstance.billing_last_name,
                        segundoapellido: null,
                        nombrecompleto: orderInstance.billing_first_name + orderInstance.billing_last_name,
                        razonsocial: null,
                        escliente: true,
                        esproveedor: false,
                        esempleado: false,
                        esvendedor: false,
                        esotro: false,
                        escobrador: false,
                        cumple_dia: null,
                        cumplea_mes: null,
                        cumplea_ano: null,
                        genero: null,
                        direccion: orderInstance.billing_address_1,
                        direccion2: orderInstance.billing_address_2,
                        telefono: null,
                        ext: null,
                        movil: orderInstance.billing_phone,
                        pais: orderInstance.billing_country,
                        departamento: orderInstance.billing_state,
                        ciudad: orderInstance.billing_city,
                        codciudad: orderInstance.billing_city_id,
                        zona: null,
                        email: orderInstance.billing_email,
                        activo: true,
                        cupocredito: "0",
                        periodopago: 0,
                        codigociiu: null,
                        descuentoventa: null,
                        categoriatercero: 1,
                        formapago: 11,
                        listaprecios: 1,
                        grupoventas: 1,
                        grupocompras: 10,
                        vendedor: '999999999',
                        cobrador: null,
                        fechacreacion: globalFunctions.formatDate(orderInstance.date_create),
                        regimen: 1,
                        banco: null,
                        tipo_cuenta: null,
                        cuenta_bancaria: null,
                        limite_credito: null,
                        camposPersonalizados: {},
                        responsable: null,
                    };

                    try {
                        const clientResult = await createClient([clientData], headers);
                        clientSuccessMessage = clientResult.message;
                    } catch (error) {
                        clientError = error.message || "Error desconocido al crear cliente.";
                        console.error(`Error al crear el cliente para la orden ${orderInstance.order_id}:`, clientError);
                    }
                } else {
                    console.log('No se mandan los datos del cliente');

                }

                const message = clientError
                    ? `Cliente: ${clientError}. Orden enviada correctamente`
                    : clientSuccessMessage
                        ? `Cliente creado: ${clientSuccessMessage}. Orden enviada correctamente`
                        : 'Orden enviada correctamente';

                const detalles = items.map(item => ({
                    idArticulo: parseFloat(item.sku),
                    cantidad: item.qty,
                    valorUnitario: parseFloat(item.unitary_price_1),
                    porcdescuento: parseFloat(item.discounted_percentage),
                    descuentovalor: item.discounted_value_1,
                    porcImpuesto: item.tax_percentage,
                    subtotal: item.line_total_1.toString(),
                    impuesto: parseFloat(item.tax)
                }));

                await order.update(
                    { message },
                    { where: { order_id: orderInstance.order_id } }
                );

                const formasPago = [
                    {
                        idFormaPago: paymentMethodId,
                        valorPago: parseFloat(orderInstance.order_total),
                        fechaPago: globalFunctions.formatDate(orderInstance.date_create),
                        codigoAutorizacion: orderInstance.transaction_id,
                        codigoTransaccion: orderInstance.order_id.toString(),
                    }
                ];

                if (parseFloat(orderInstance.shipping_total) > 0) {
                    detalles.push({
                        idArticulo: 1,
                        cantidad: 1,
                        valorUnitario: parseFloat(orderInstance.shipping_total),
                        porcdescuento: 0,
                        descuentovalor: 0,
                        porcImpuesto: 0,
                        subtotal: Math.round(orderInstance.shipping_total).toString(),
                        impuesto: 0
                    });
                }

                const transformedOrder = {
                    prefijo: orderPrefix,
                    numeroDoc: orderInstance.doc_number,
                    fechaDocumento: globalFunctions.formatDate(orderInstance.date_create),
                    nitTerceroEnc: orderClientNit,
                    nitVendedor: orderSellerNit,
                    idSucursal: null,
                    idBodega: 1,
                    idListaPrecio: price_list_serpi,
                    numOrdenCompra: orderInstance.doc_number.toString(),
                    comentario: null,
                    celular: orderInstance.billing_phone,
                    metodopago: orderInstance.payment,
                    estadopago: orderInstance.status === 'paid' ? 'Pagado' : orderInstance.payment,
                    detalles,
                    formasPago
                };

                console.log('ORDEN', JSON.stringify(transformedOrder));

                const url = 'https://apis.serpi.com.co/api/v1/PedidoVenta';
                const response = await axios.post(url, [transformedOrder], { headers });
                console.log('Orden enviada exitosamente:', response.data);

                if (response.data.errors && response.data.errors.length > 0) {
                    const errorMessages = response.data.errors.join('; ');
                    orderError = `Errores en la orden: ${errorMessages}`;
                    console.error(orderError);
                } else {
                    state = 1;
                    code = 200;
                }
            } catch (error) {
                orderError = `Error inesperado: ${error.response?.data || error.message}`;
                console.error(orderError);
            }

            const message = clientError
                ? orderError
                    ? `Error cliente: ${clientError}. Error orden: ${orderError}`
                    : `Error cliente: ${clientError}. Orden enviada correctamente.`
                : clientSuccessMessage
                    ? orderError
                        ? `Cliente: ${clientSuccessMessage}. Error orden: ${orderError}`
                        : `Cliente: ${clientSuccessMessage}. Orden enviada correctamente.`
                    : orderError
                        ? `Error orden: ${orderError}`
                        : 'Orden enviada correctamente';

            await order.update(
                { message, state, code, hook: true },
                { where: { order_id: orderInstance.order_id } }
            );
        }, 2000);
    });
};