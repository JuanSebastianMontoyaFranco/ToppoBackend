const router = require('express').Router();
const syncController = require('../../controllers/syncController');

router.post('/send/user/:user_id', syncController.send);

module.exports = router;