const router = require('express').Router();
const credentialController = require('../../controllers/credentialController');

router.put('/update/user/:user_id', credentialController.update);
router.get('/list/user/:user_id', credentialController.listById);

module.exports = router;