const db = require('../models');
const { Op } = require('sequelize'); // Asegúrate de importar Op de Sequelize

exports.formatTags = (fields) => {
    return fields
        .filter(Boolean) // Filtrar valores no nulos o vacíos
        .map((field) =>
            field
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase()) // Convertir primera letra de cada palabra a mayúscula
        )
        .sort() // Ordenar alfabéticamente
        .join(', '); // Combinar en una sola cadena separada por comas
}