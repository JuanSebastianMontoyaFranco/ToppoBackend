const router = require('express').Router();
const usersRouter = require('./api/users');
const transactionRouter = require('./api/transactions')
const orderRouter = require('./api/orders')
const credentialRouter = require('./api/credentials')
const functionRouter = require('./api/functions')
const parameterRouter = require('./api/parameters')
const cityRouter = require('./api/cities')
const productRouter = require('./api/products')
const priceListRouter = require('./api/priceLists')
const importRouter = require('./api/imports')
const syncRouter = require('./api/syncronizations')
// Users
router.use('/user', usersRouter);

// Transactions
router.use('/transaction', transactionRouter)

// Orders
router.use('/order', orderRouter)

// Credentials
router.use('/credential', credentialRouter)

// Functions
router.use('/function', functionRouter)

// Parameters
router.use('/parameter', parameterRouter)

// Cities
router.use('/city', cityRouter)

// Products
router.use('/product', productRouter)

// Price List
router.use('/pricelist', priceListRouter)

// Import
router.use('/import', importRouter)

// Syncronization
router.use('/sync', syncRouter)


module.exports = router;