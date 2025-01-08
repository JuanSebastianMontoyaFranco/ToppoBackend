const cron = require('node-cron');
const db = require('../../models');
const syncFunctions = require('../../functions/sync');
const { getProducts } = require('../../controllers/productController');
const { send } = require('../../controllers/syncController'); // Importa tu función sendProducts

//MINUTO: * * * * *
//5 MINUTOS: */5 * * * *
//HORA: 0 * * * *
//30 MIN DE CADA HORA
cron.schedule('* * * * *', async () => {
    try {
        const usersToSync = await db.sync_parameter.findAll({
            where: { sync_status: 1 },
            attributes: ['user_id'],
        });

        console.log('USUARIOS A SINCRONIZAR:', usersToSync);
        

        for (const user of usersToSync) {
            const userId = user.user_id;

            const createResult = await getProducts({ userId, state: 'create' });
            console.log('RESULTADO CREAR:', createResult);

            const updateResult = await getProducts({ userId, state: 'update' });
            console.log('RESULTADO ACTUALIZAR:', updateResult);

            const create = createResult.rows;
            const update = updateResult.rows;

            console.log(update);


            if (create.length > 0 || update.length > 0) {
                const userCredentials = await db.credential.findOne({ where: { user_id: userId } });
                if (userCredentials) {
                    const { shopify_domain, token_shopify } = userCredentials.dataValues;

                    console.log('DOMINIO ENVIADO:', shopify_domain);
                    console.log('TOKEN ENVIADO:', token_shopify);

                    //await syncFunctions.logSync(userId, 'Automatic');

                    // Llama a send con el parámetro fromCron
                    await send({
                        body: {
                            create: create || [],
                            update: update || [],
                            shopify_domain: shopify_domain || '',
                            user_id: userId,
                            token_shopify: token_shopify || '',
                            fromCron: true,
                        },
                    });
                }
            } else {
                console.log(`No hay productos para actualizar para el usuario ${userId}`);
            }
        }
    } catch (error) {
        console.error('Error en el cron job:', error);
    }
});
