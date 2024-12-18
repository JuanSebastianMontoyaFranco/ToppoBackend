const { v4: uuidv4, parse: uuidParse } = require('uuid');
const axios = require('axios');
const db = require('../models');

exports.removeSpecialCharacters = (text) => {
  // Reemplaza tildes, diacríticos, puntos y espacios
  return text.normalize("NFD").replace(/[\u0300-\u036f,.\s]/g, "");
};


exports.generateId = () => {
  const uuid = uuidv4(); // Genera un UUID v4
  const uuidBigInt = uuidParse(uuid); // Convierte el UUID a BigInt
  return uuidBigInt.toString(); // Devuelve el UUID como cadena
};


exports.formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

exports.formatDate2 = (dateString) => {
const date = new Date(dateString);

// Obtén los componentes de la fecha
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes comienza en 0
const day = String(date.getDate()).padStart(2, '0');
const hours = String(date.getHours()).padStart(2, '0');
const minutes = String(date.getMinutes()).padStart(2, '0');
const seconds = String(date.getSeconds()).padStart(2, '0');

// Construye la cadena en el formato deseado
return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}

exports.fetchData = async (url, headers) => {
  try {
    const response = await axios.get(url, { headers });
    return response.data.result;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
  }
};

exports.searchCity = async (cityName, returnField) => {
  console.log('CIUDAD EN LA FUNCION:', cityName);
  
  try {
    // Logueamos los criterios de búsqueda antes de ejecutarla
    console.log('Buscando con ciudad:', cityName);

    const city = await db.all_city.findOne({
      where: {
        city_desc: cityName,
      },
    });

    if (city) {
      console.log('ENTRA EN EL IF DE LA FUNCION, ciudad encontrada:', city);
      return city[returnField];
    } else {
      console.log('ENTRA EN EL ELSE, no se encontró la ciudad. Usando el valor original:', cityName);
      return cityName; // Retorna el nombre original de la ciudad si no se encuentra
    }

  } catch (error) {
    console.log('ENTRA EN EL ERROR');
    console.error('Error finding city description:', error);
    throw error;
  }
}