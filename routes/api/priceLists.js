const router = require('express').Router();
const priceListController = require('../../controllers/priceListController');

router.post('/create/user/:user_id', priceListController.create);
router.get('/list/user/:user_id/pricelist/:price_list_id', priceListController.list);

module.exports = router;