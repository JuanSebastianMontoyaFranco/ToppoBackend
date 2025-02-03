const router = require('express').Router();
const syncController = require('../../controllers/syncController');

router.post('/send/user/:user_id', syncController.send);
router.get('/list/change/record/user/:user_id', syncController.changeRecords);
router.get('/list/sync/record/user/:user_id', syncController.syncRecords);

module.exports = router;