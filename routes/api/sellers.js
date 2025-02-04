const router = require('express').Router();
const sellerController = require('../../controllers/sellerController');

router.get('/list/user/:user_id', sellerController.list);

module.exports = router;