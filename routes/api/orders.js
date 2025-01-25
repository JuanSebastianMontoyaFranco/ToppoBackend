const router = require('express').Router();
const orderController = require('../../controllers/orderController');

router.post('/create', orderController.create);
router.get('/list/user/:user_id', orderController.list);
router.get('/detail', orderController.detail);
router.get('/list/histoweb/user/:user_id', orderController.listHistoweb);


module.exports = router;