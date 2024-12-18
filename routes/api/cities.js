const router = require('express').Router();
const CityController = require('../../controllers/cityController');

router.post('/create',  CityController.create);
router.get('/list',  CityController.list);

module.exports = router;