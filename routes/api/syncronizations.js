const router = require('express').Router();
const syncController = require('../../controllers/syncController');

router.post('/send', syncController.send);

module.exports = router;