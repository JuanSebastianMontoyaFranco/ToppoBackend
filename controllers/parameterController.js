
exports.syncParametersUpdate = async (req, res, next) => {
    const { user_id } = req.params;
    try {
      const {
        product_type,
        inventory_quantity,
        price,
        compare_at_price,
        security_inventory,
        serpi_price_list,
        serpi_warehouse,
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
          product_type,
          price,
          compare_at_price,
          inventory_quantity,
          security_inventory,
          serpi_price_list,
          serpi_warehouse,
        }
      });
  
      if (!created) {
        // Si el registro ya existía, actualizarlo
        parameter.security_inventory = security_inventory;
        parameter.product_type = product_type,
          parameter.price = price,
          parameter.compare_at_price = compare_at_price;
        parameter.inventory_quantity = inventory_quantity;
        parameter.serpi_price_list = serpi_price_list,
          parameter.serpi_warehouse = serpi_warehouse
        await parameter.save();
      }
  
      return res.status(200).send(parameter);
    } catch (error) {
      console.error('Error al crear o actualizar los parametros de sincronizacion:', error);
      return res.status(500).send({
        error: '¡Error en el servidor!',
        message: error.message
      });
    }
  }