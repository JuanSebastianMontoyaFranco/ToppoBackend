const router = require('express').Router();
const usersRouter = require('./api/users');
const transactionRouter = require('./api/transactions')

// Users
router.use('/user', usersRouter);

// Transactions
router.use('/transaction', transactionRouter)

module.exports = router;