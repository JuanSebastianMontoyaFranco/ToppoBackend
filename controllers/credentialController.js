const db = require('../models');


exports.update = async (req, res, next) => {
    const { user_id } = req.params;

    try {
        const {
            master,
            store_domain,
            domain_shopify,
            token_shopify,
            token_serpi,
            secret_key_serpi,
            token_histoweb,
            url_histoweb_products,
            url_histoweb_services,
            hook_histoweb,
            sync_time
        } = req.body;

        if (!user_id) {
            return res.status(200).send({
                error: '¡Error en el cliente!',
                message: 'El campo user_id es obligatorio.'
            });
        }

        const [credential, created] = await db.credential.findOrCreate({
            where: { user_id },
            defaults: {
                master,
                store_domain,
                domain_shopify,
                token_shopify,
                token_serpi,
                secret_key_serpi,
                token_histoweb,
                url_histoweb_products,
                url_histoweb_services,
                hook_histoweb,
                sync_time
            }
        });

        if (!created) {
            // Si el registro ya existía, actualizarlo
            credential.master = master,
                credential.store_domain = store_domain,
                credential.domain_shopify = domain_shopify;
            credential.token_shopify = token_shopify;
            credential.token_serpi = token_serpi;
            credential.secret_key_serpi = secret_key_serpi;
            credential.token_histoweb = token_histoweb,
                credential.url_histoweb_products = url_histoweb_products,
                credential.url_histoweb_services = url_histoweb_services,
                credential.hook_histoweb = hook_histoweb,
                await credential.save();
        }

        console.log('Creación/actualización con éxito.');
        return res.status(200).send({
            message: 'Creación/actualización con éxito.'
        });
    } catch (error) {
        console.error('Error al crear o actualizar las credenciales:', error);
        return res.status(500).send({
            message: '¡Error en el servidor!',
            error: error.message
        });
    }
};

exports.listById = async (req, res, next) => {
    const { user_id } = req.params;
    try {
        const credentials = await db.credential.findAll({
            where: {
                user_id: user_id
            }
        });

        if (credentials.length !== 0) {
            res.status(200).json({
                rows: credentials
            });
        } else {
            res.status(200).send({
                rows: [],
                total: 0,
                message: 'Aun no tienes credenciales guardadas.'
            });
        }
    } catch (error) {
        console.error('Error en la consulta de las credenciales:', error);
        return res.status(200).json({
            error: '¡Error en el servidor!',
            message: error.message
        });
    }
};
