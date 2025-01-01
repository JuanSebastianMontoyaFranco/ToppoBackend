/* module.exports = {
    "development": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_NAME,
        "host": process.env.DB_HOST,
        "dialect": process.env.DB_DIALECT,
    }
} */

module.exports = {
    "development": {
        "username": 'admin',
        "password": 'elvecinodelaabueladeoritorion',
        "database": 'toppo',
        "host": 'oritdefault.ccmlpmecr0so.us-east-1.rds.amazonaws.com',
        "dialect": 'mysql',
        "timezone": "-05:00", // Huso horario de Colombia

    },
    "production": {
        "username": 'admin',
        "password": 'elvecinodelaabueladeoritorion',
        "database": 'toppo',
        "host": 'oritdefault.ccmlpmecr0so.us-east-1.rds.amazonaws.com',
        "dialect": 'mysql',
        "timezone": "-05:00", // Huso horario de Colombia
    }
}

