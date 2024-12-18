const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

// Especifica la ruta del archivo .env relativa al directorio actual
const envPath = path.resolve(__dirname, '../.env'); // Ajusta la ruta según la ubicación real del archivo .env

// Carga las variables de entorno desde el archivo .env
dotenv.config({ path: envPath });

const plaintext = process.env.TOKEN;

function getEncryptedText(plaintext) {
  // Obtener la fecha actual en la zona horaria de Colombia (Bogotá)
  const date = new Date();
  date.setHours(date.getHours() - 5); // Restar 5 horas para ajustar a Bogotá
  const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '.');

  const secretKey = plaintext.slice(0, 6) + formattedDate;
  const algorithm = 'aes-128-ecb';
  const inputEncoding = 'utf8';
  const outputEncoding = 'base64';

  //console.log(formattedDate);

  function encrypt(text, key) {
    const cipher = crypto.createCipheriv(algorithm, key, '');
    let encrypted = cipher.update(text, inputEncoding, outputEncoding);
    encrypted += cipher.final(outputEncoding);
    return encrypted;
  }

  return encrypt(plaintext, secretKey);
}

const encryptedText = getEncryptedText(plaintext);

//console.log(encryptedText);
module.exports = getEncryptedText;