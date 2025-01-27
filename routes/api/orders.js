const router = require('express').Router();
const orderController = require('../../controllers/orderController');

router.post('/create', orderController.create);
router.get('/list/user/:user_id', orderController.list);
router.get('/detail', orderController.detail);
router.post('/update', orderController.update)
router.put('/update/state', orderController.updateState)
router.put('/modify/:order_id', orderController.modify)


// Histoweb
router.get('/list/histoweb/user/:user_id', orderController.listHistoweb);
router.post('/hook/histoweb/user/:user_id', orderController.sendHookHistoweb);

// Serpi
router.get('/list/serpi/user/:user_id', orderController.listSerpi);

module.exports = router;