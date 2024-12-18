const axios = require('axios');
const db = require('../models');
const getEncryptedText = require('../utils/encrypt');
const plaintext = process.env.TOKEN;
const encryptedText = getEncryptedText(plaintext);
require('dotenv').config();

exports.create = async (req, res, next) => {
  const url = process.env.URL_CITY_HW;
  const headers = {
    'ApiSignature': encryptedText
  };

  try {
    const response = await axios.get(url, { headers });
    const responseBody = response.data.response_body;

    await createOrUpdateCities(responseBody);

    let totalCiudades = 0;
    for (const departamento of responseBody) {
      if (departamento.departamentos && departamento.departamentos.length > 0) {
        totalCiudades += departamento.departamentos.reduce((count, ciudad) => count + ciudad.ciudades.length, 0);
      }
    }

    res.status(200).json({
      message: 'Ciudades creadas con éxito',
      total: totalCiudades
    });
  } catch (error) {
    res.status(500).send({
      message: '¡Error en el servidor!',
      error: error.message
    });
    next(error);
  }
};


async function createOrUpdateCities(cityData) {
  for (const countryData of cityData) {
    const country_id = countryData.id;
    const country_desc = countryData.description;

    for (const departmentData of countryData.departamentos) {
      const department_id = departmentData.id;
      const department_desc = departmentData.description;

      for (const cityData of departmentData.ciudades) {
        const city_id = cityData.id;
        const city_desc = cityData.description;

        const city = city_desc.substr(0, city_desc.lastIndexOf(' '));

        try {
          const existingCity = await db.all_city.findOne({ where: { city_id } });

          if (existingCity) {
            await db.all_city.update(
              {
                country_id,
                country_desc,
                department_id,
                department_desc,
                city,
              },
              { where: { city_id } }
            );
            console.log('La ciudad ha sido actualizada:', city);
          } else {
            await db.all_city.create({
              country_id,
              country_desc,
              department_id,
              department_desc,
              city_id,
              city_desc,
              city, // Agregar el campo "city" con el valor modificado
            });
            console.log('Ciudad creada con éxito:', city);
          }
        } catch (error) {
          console.error('Error al ingresar la ciudad en la base de datos:', error);
          throw error;
        }
      }
    }
  }
}


exports.list = async (req, res, next) => {
  try {
    const result = await db.all_city.findAll({
      attributes: ['department_desc', 'city_desc'],
      raw: true // Para obtener resultados como objetos de JavaScript puros
    });
    if (result.length !== 0) {
      // Organizar las ciudades por departamento
      const citiesByDepartment = {};
      result.forEach(city => {
        const department = city.department_desc;
        const cityName = city.city_desc; // Extraer el nombre de la ciudad
        const cityData = { city: cityName };
        if (!citiesByDepartment[department]) {
          citiesByDepartment[department] = [cityData];
        } else {
          citiesByDepartment[department].push(cityData);
        }
      });

      res.status(200).json({
        rows: citiesByDepartment
      });
    } else {
      console.log("No se encontraron registros en el sistema.");
      res.status(404).send({
        rows: [],
        total: 0,
        message: 'No hay registros en el sistema.'
      });
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({
      error: '¡Error en el servidor!'
    });
  }
}
