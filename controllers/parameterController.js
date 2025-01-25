const db = require('../models');
const axios = require('axios');

exports.orderParametersUpdate = async (req, res, next) => {
  const { user_id } = req.params;
  try {
    const {
      main,
      active,
      branch_id_default,
      branch_name_default
    } = req.body;

    if (!user_id) {
      return res.status(200).send({
        error: '¡Error en el cliente!',
        message: 'El campo user_id es obligatorio.'
      });
    }

    const [parameter, created] = await db.order_parameter.findOrCreate({
      where: { user_id },
      defaults: {
        main,
        active,
        branch_id_default,
        branch_name_default
      }
    });

    if (!created) {
      // Si el registro ya existía, actualizarlo
      parameter.main = main;
      parameter.active = active,
        parameter.branch_id_default = branch_id_default,
        parameter.branch_name_default = branch_name_default;
      await parameter.save();
    }

    console.log('Creación/actualización con éxito.');
    return res.status(200).send({
      message: 'Creación/actualización con éxito.'
    });
  } catch (error) {
    console.error('Error al crear o actualizar los parametros de sincronizacion:', error);
    return res.status(500).send({
      message: '¡Error en el servidor!',
      error: error.message
    });
  }
}


exports.orderParameterlistById = async (req, res, next) => {
  const { user_id } = req.params;
  try {
    const parameters = await db.order_parameter.findAll({
      where: {
        user_id: user_id
      }
    });
    if (parameters.length !== 0) {
      res.status(200).json({
        rows: parameters
      });
    } else {
      res.status(200).send({
        rows: [],
        total: 0,
        message: 'Aun no tienes parametros guardados.'
      });
    }
  } catch (error) {
    console.error('Error en la consulta de los parametros:', error);
    return res.status(200).json({
      error: '¡Error en el servidor!',
      message: error.message
    });
  }
};


exports.syncParametersUpdate = async (req, res, next) => {
  const { user_id } = req.params;
  try {
    const {
      sync_status,
      security_inventory,
      product_type,
      price,
      compare_at_price,
      tags,
      vendor,
      description,
      price_list_serpi,
      branch_serpi,
    } = req.body;

    if (!user_id) {
      return res.status(200).send({
        error: '¡Error en el cliente!',
        message: 'El campo user_id es obligatorio.'
      });
    }

    const [parameter, created] = await db.sync_parameter.findOrCreate({
      where: { user_id },
      defaults: {
        sync_status,
        security_inventory,
        product_type,
        price,
        compare_at_price,
        tags,
        vendor,
        description,
        price_list_serpi,
        branch_serpi,
      }
    });

    if (!created) {
      // Si el registro ya existía, actualizarlo
      parameter.sync_status = sync_status;
      parameter.security_inventory = security_inventory;
      parameter.product_type = product_type,
        parameter.price = price,
        parameter.compare_at_price = compare_at_price,
        parameter.tags = tags,
        parameter.vendor = vendor,
        parameter.description = description,
        parameter.price_list_serpi = price_list_serpi,
        parameter.branch_serpi = branch_serpi
      await parameter.save();
    }

    console.log('Creación/actualización con éxito.');
    return res.status(200).send({
      message: 'Creación/actualización con éxito.'
    });
  } catch (error) {
    console.error('Error al crear o actualizar los parametros de sincronizacion:', error);
    return res.status(500).send({
      message: '¡Error en el servidor!',
      error: error.message
    });
  }
}


exports.SyncParameterlistById = async (req, res, next) => {
  const { user_id } = req.params;
  try {
    const parameters = await db.sync_parameter.findAll({
      where: {
        user_id: user_id
      }
    });
    if (parameters.length !== 0) {
      res.status(200).json({
        rows: parameters
      });
    } else {
      res.status(200).send({
        rows: [],
        total: 0,
        message: 'Aun no tienes parametros guardados.'
      });
    }
  } catch (error) {
    console.error('Error en la consulta de los parametros:', error);
    return res.status(200).json({
      error: '¡Error en el servidor!',
      message: error.message
    });
  }
};
