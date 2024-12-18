'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class order_item extends Model {
        static associate(models) {
            order_item.belongsTo(models.order, { foreignKey: 'order_id' });
        }
    }

    // EL 1 ES SERPI 
    // EL 2 ES HISTOWEB

    order_item.init(
        {
            order_id: DataTypes.BIGINT, // Id de la orden, este es como llega de shopify, el mismo de ordenes -AMBOS
            doc_number: DataTypes.INTEGER, // Número de la orden, Ex. 1030, serpi - SERPI
            product_id: DataTypes.STRING, // Id del producto - AMBOS
            sku: DataTypes.STRING, // Sku del item - AMBOS
            item_name: DataTypes.STRING, // Nombre del item - AMBOS
            qty: DataTypes.INTEGER, // Cantidad del item - AMBOS
            option: DataTypes.STRING, // Sucursal o opción del item, si es que tiene - AMBOS, son las opciones EX, sucursal de un procedimiento
            unitary_price_1: DataTypes.DECIMAL,  // Precio unitario sin impuestos - SERPI
            unitary_price_tax_1: DataTypes.DECIMAL, // Precio unitario con impuestos - SERPI
            unitary_price_2: DataTypes.DECIMAL,  // Precio unitario sin impuestos - HISTOWEB
            unitary_price_tax_2: DataTypes.DECIMAL, // Precio unitario con impuestos - HISTOWEB
            discounted_percentage: DataTypes.DECIMAL, // Porcentaje de descuento - SERPI
            discounted_value_1: DataTypes.FLOAT, // Valor de descuento - SERPI
            discounted_value_2: DataTypes.FLOAT, // Valor de descuento - HISTOWEB
            base_price_2: DataTypes.FLOAT, // Precio base de cada item - valor bruto - HISTOWEB
            tax_percentage: DataTypes.FLOAT, // SERPI // Porcentaje del impuesto - SERPI
            tax: DataTypes.DECIMAL, // Precio del impuesto - SERPI
            line_total_1: DataTypes.FLOAT, // Sumatoria de los valores brutos menos los descuentos - SERPI
            line_total_2: DataTypes.FLOAT, // Sumatoria de los items, debe dar el total de la orden - HISTOWEB
            cupon_produc_value: DataTypes.FLOAT, // Cupon en caso de que aplique para productos
            cupon_servic_value: DataTypes.FLOAT, // Cupon en caso de que aplique para servicios
            branch_id: DataTypes.INTEGER, // Sucursal del item - AMBOS
            branch_name: DataTypes.STRING, // Nombre de la sucursal - AMBOS
        },
        {
            sequelize,
            modelName: 'order_item',
        }
    );

    return order_item;
};
