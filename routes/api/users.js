const router = require('express').Router();
const userController = require('../../controllers/userController');

router.post('/create', userController.create);
router.post('/login', userController.login);
router.put('/update/user/:user_id', userController.update);

module.exports = router;