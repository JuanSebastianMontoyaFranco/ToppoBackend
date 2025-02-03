const router = require('express').Router();
const clientController = require('../../controllers/clientController');

router.get('/list/user/:user_id', clientController.list);

module.exports = router;