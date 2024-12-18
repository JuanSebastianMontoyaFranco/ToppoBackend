const router = require('express').Router();
const ParameterController = require('../../controllers/parameterController');

router.put('/order/update/user/:user_id', ParameterController.orderParametersUpdate);
router.get('/order/list/user/:user_id', ParameterController.orderParameterlistById);
router.put('/sync/update/user/:user_id', ParameterController.syncParametersUpdate);
router.get('/sync/list/user/:user_id', ParameterController.SyncParameterlistById);

module.exports = router;