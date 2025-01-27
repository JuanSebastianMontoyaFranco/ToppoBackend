const router = require('express').Router();
const syncController = require('../../controllers/syncController');

router.post('/send/user/:user_id', syncController.send);
router.get('/list/record/user/:user_id', syncController.list);

module.exports = router;