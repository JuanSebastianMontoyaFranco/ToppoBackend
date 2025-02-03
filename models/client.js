'use strict';
const { Model, STRING } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class client extends Model {
        static associate(models) {
            client.belongsTo(models.user, { foreignKey: 'user_id' });
        }
    }
    client.init(
        {
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
        },
        {
            sequelize,
            modelName: 'client',
        }
    );

    return client;
};
