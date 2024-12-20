const router = require('express').Router();
const importController = require('../../controllers/importController');

router.post('/histoweb/user/:user_id', importController.importHistoweb);

module.exports = router;