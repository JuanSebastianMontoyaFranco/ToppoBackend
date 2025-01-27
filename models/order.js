'use strict';
const { Model, STRING } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class order extends Model {
        static associate(models) {
            this.hasMany(models.order_item, { foreignKey: 'order_id' });
        }

    }
    order.init(
        {
            order_id: { type: DataTypes.BIGINT, primaryKey: true },
            user_id: DataTypes.INTEGER, //id del usuario 
            ecommerce_id: DataTypes.STRING, // numero de la orden Ex. 35463575476
            invoice_id: DataTypes.STRING, // numero de la factura Ex. 35463575476
            ecommerce_reference: DataTypes.STRING, // de donde viene la orden Ex. shopify
            ecommerce_name: DataTypes.STRING, // nombre de la orden Ex. LSKT1024
            doc_number: DataTypes.INTEGER, // Solo el numero de referencia de la orden Ex. LSKT - 1024
            prefix: DataTypes.STRING, //  Prefijo Ex. PDV
            date_create: DataTypes.STRING, //Fecha de creacion
            date_update: DataTypes.STRING, //Fecha de actualizacion
            payment: DataTypes.STRING, //Tipo de pago Ex. Wompi
            status: DataTypes.STRING, // Estado de la orden Ex. Pagado, Pendiente, Cancelado
            transaction_id: DataTypes.STRING, // Id de la transaccion EX. FBF6F7F7F6, Se extrae de la tabla de transacciones
            customer_ip_address: DataTypes.STRING, // Ip del usuario
            customer_user: DataTypes.BIGINT, // Id del usuario
            billing_id: DataTypes.STRING, // Documento de identidad del usuario de facturacion
            billing_first_name: DataTypes.STRING, // Nombres del usuario de facturacion
            billing_last_name: DataTypes.STRING, // Apellidos del usuario de facturacion
            billing_email: DataTypes.STRING, // Correo del usuario de facturacion
            billing_phone: DataTypes.STRING, // Telefono del usuario de facturacion
            billing_address_1: DataTypes.STRING, // Direccion del usuario de facturacion
            billing_address_2: DataTypes.STRING, // Direccion 2 del usuario de facturacion
            billing_city_id: DataTypes.STRING, // Id de la ciudad del usuario de facturacion
            billing_city: DataTypes.STRING, // Ciudad CON FORMATO del usuario de facturacion
            billing_format_city: STRING, // Ciudad original como llega del usuario de facturacion
            billing_state: DataTypes.STRING, // Departamento del usuario de facturacion
            billing_country: DataTypes.STRING, // Pais del usuario de facturacion EX. CO, US, MX
            shipping_id: DataTypes.STRING, // Documento de identidad del usuario de envio
            shipping_first_name: DataTypes.STRING, // Nombres del usuario de envio
            shipping_last_name: DataTypes.STRING, // Apellidos del usuario de envio
            shipping_email: DataTypes.STRING, // Correo del usuario de envio
            shipping_phone: DataTypes.STRING, // Telefono del usuario de envio
            shipping_address_1: DataTypes.STRING, // Direccion del usuario de envio
            shipping_address_2: DataTypes.STRING, // Direccion 2 del usuario de envio
            shipping_city_id: DataTypes.STRING, // Id de la ciudad del usuario de envio
            shipping_city: DataTypes.STRING, // Ciudad CON FORMATO del usuario de envio
            shipping_format_city: DataTypes.STRING, // Ciudad original como llega del usuario de envio
            shipping_state: DataTypes.STRING, // Departamento del usuario de envio
            shipping_country: DataTypes.STRING, // Pais del usuario de envio EX. CO, US, MX
            branch_id: DataTypes.INTEGER, // Id de la bodega, este si va desde SERPI 
            whorehouse_id: DataTypes.INTEGER, 
            pricelist_id: DataTypes.INTEGER, // Id del precio listado, este si va desde SERPI
            purchase_number: DataTypes.BIGINT, // Numero de orden de la compra, SERPI Ex. 1030
            order_total: DataTypes.FLOAT, // Total de la orden
            shipping_total: DataTypes.FLOAT, // Total de la orden
            note: DataTypes.STRING, // Nota de la orden
            cupon_code: DataTypes.STRING, // Codigo de cupon
            hook: DataTypes.BOOLEAN, // Estado para saber si la orden ya fue enviada
            state: DataTypes.INTEGER, // Estado de la orden en el sistema de facturacion
            code: DataTypes.BIGINT, // Codigo de la orden en el sistema de facturacion
            message: DataTypes.TEXT, // Mensaje de la orden en el sistema de facturacion
        },
        {
            sequelize,
            modelName: 'order',
        }
    );

    return order;
};
