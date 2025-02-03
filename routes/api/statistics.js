const router = require('express').Router();
const statisticController = require('../../controllers/statisticController');

router.get('/list/user/:user_id', statisticController.listById);

module.exports = router;