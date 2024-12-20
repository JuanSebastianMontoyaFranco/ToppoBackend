const router = require('express').Router();
const productController = require('../../controllers/productController');

router.post('/create', productController.create);
router.get('/list/user/:user_id', productController.list);

module.exports = router;