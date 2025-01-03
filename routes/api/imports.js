const router = require('express').Router();
const importController = require('../../controllers/importController');

router.post('/histoweb/user/:user_id', importController.importHistoweb);
router.post('/serpi/user/:user_id', importController.importSerpi);

module.exports = router;