const router = require('express').Router();
const orderController = require('../../controllers/orderController');

router.post('/create', orderController.create);

module.exports = router;