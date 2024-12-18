const router = require('express').Router();
const userController = require('../../controllers/userController');

router.post('/create', userController.create);

module.exports = router;