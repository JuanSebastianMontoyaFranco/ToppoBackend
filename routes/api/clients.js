const router = require('express').Router();
const clientController = require('../../controllers/clientController');

router.get('/list/user/:user_id', clientController.list);
router.post('/create', clientController.create);
router.get('/detail', clientController.detail);

module.exports = router;