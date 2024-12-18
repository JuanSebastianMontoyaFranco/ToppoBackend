const router = require('express').Router();
const transactionController = require('../../controllers/transactionController');

router.post('/create', transactionController.create);

module.exports = router;