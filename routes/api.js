const router = require('express').Router();
const UsersRouter = require('./api/users');

//USERS
router.use('/user', UsersRouter);

module.exports = router;