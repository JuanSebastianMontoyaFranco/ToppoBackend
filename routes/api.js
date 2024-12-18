const router = require('express').Router();
const usersRouter = require('./api/users');
const transactionRouter = require('./api/transactions')
const orderRouter = require('./api/orders')
const credentialRouter = require('./api/credentials')
const functionRouter = require('./api/functions')
const parameterRouter = require('./api/parameters')
const cityRouter = require('./api/cities')

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


module.exports = router;