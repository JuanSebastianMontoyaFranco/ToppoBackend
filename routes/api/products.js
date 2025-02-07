const router = require('express').Router();
const productController = require('../../controllers/productController');

router.post('/create', productController.create);
router.get('/list/user/:user_id', productController.list);
router.post('/update', productController.update);
router.get('/detail/user/:user_id', productController.detail);
router.get('/catalog/list/pricelist/:price_list_id', productController.catalog);

module.exports = router;