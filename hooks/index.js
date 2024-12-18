const fs = require('fs');
const path = require('path');

module.exports = (db) => {
    const hooksDirectory = __dirname;

    // Leer todos los archivos en la carpeta de hooks
    fs.readdirSync(hooksDirectory)
        .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file.slice(-3) === '.js')
        .forEach(file => {
            const hook = require(path.join(hooksDirectory, file));
            if (typeof hook === 'function') {
                hook(db); // Registrar cada hook, pasando la instancia de `db`
            }
        });
};
