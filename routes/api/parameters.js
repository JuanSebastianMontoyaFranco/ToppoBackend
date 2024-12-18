const router = require('express').Router();
const ParameterController = require('../../controllers/parameterController');

router.put('/update/user/:user_id', ParameterController.syncParametersUpdate);
//router.get('/list/user/:user_id', ParameterController.SyncParameterlistById);
//router.put('/order/update/user/:user_id', ParameterController.orderParametersUpdate);
//router.get('/order/list/user/:user_id', ParameterController.orderParameterlistById);

module.exports = router;