const router = require('express').Router();
const functionController = require('../../controllers/functionsController');

router.get('/encrypt', functionController.encrypt);

module.exports = router;