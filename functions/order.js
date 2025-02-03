const db = require('../models');

exports.searchCity = async (cityName, departmentDesc, returnField) => {
    console.log('Ciudad en funcion searchCity:', cityName);
    console.log('Departamento en funcion searchCity:', departmentDesc);

    // Remover comas, tildes y el punto final del nombre del departamento
    let cleanDepartmentDesc = departmentDesc
        .replace(/,/g, '')  // Elimina las comas
        .normalize('NFD')    // Normaliza los caracteres con tildes
        .replace(/[\u0300-\u036f]/g, ''); // Elimina los diacríticos (tildes)

    // Remover el punto solo si está al final de la cadena
    if (cleanDepartmentDesc.endsWith('.')) {
        cleanDepartmentDesc = cleanDepartmentDesc.slice(0, -1);
    }

    console.log('DEPARTAMENTO EN LA FUNCION (LIMPIO):', cleanDepartmentDesc);

    try {
        // Logueamos los criterios de búsqueda antes de ejecutarla
        console.log('Buscando con ciudad:', cityName, 'y departamento:', cleanDepartmentDesc);

        const city = await db.all_city.findOne({
            where: {
                city: cityName,
                department_desc: cleanDepartmentDesc, // Usamos el nombre del departamento sin comas, tildes ni punto final
            },
        });

        if (city) {
            console.log('ENTRA EN EL IF DE LA FUNCION, ciudad encontrada:', city);
            return city[returnField];
        } else {
            console.log('ENTRA EN EL ELSE, no se encontró la ciudad. Usando el valor original:', cityName);
            return cityName; // Retorna el nombre original de la ciudad si no se encuentra
        }

    } catch (error) {
        console.log('ENTRA EN EL ERROR');
        console.error('Error finding city description:', error);
        throw error;
    }
}



const extractDomain = (url) => {
    console.log('URL que recbe en la funcion:', url);

    try {
        // Usar URL constructor para extraer el dominio
        const { hostname } = new URL(url);
        return hostname;
    } catch (error) {
        console.error('Error al extraer el dominio:', error);
        throw new Error('URL inválida');
    }
};

exports.getUserId = async (orderStatusUrl) => {
    try {
        // Extraer dominio desde la URL
        const domain = extractDomain(orderStatusUrl);

        console.log('Dominio extraído:', domain);

        // Buscar el dominio en la tabla store_domain
        const store = await db.credential.findOne({
            where: {
                store_domain: domain, // Campo `domain` debe coincidir con el dominio extraído
            },
        });

        if (store) {
            console.log('Dominio encontrado!',);
            return store.user_id; // Retorna el user_id asociado al dominio
        } else {
            console.log('Dominio no encontrado en la tabla store_domain');
            return null; // Devuelve null si no encuentra el dominio
        }
    } catch (error) {
        console.error('Error al obtener user_id desde store_domain:', error);
        throw error;
    }
};

exports.getTransactionId = async (orderId, confirmationNumber) => {
    try {
        const transaction = await db.transaction.findOne({
            where: {
                order_id: orderId,
            },
            order: [['date_create', 'DESC']],
            limit: 1,
        });

        if (transaction) {
            console.log('Transacción encontrada:', transaction);
            return transaction.payment_id;
        }
        console.log('Transacción no encontrada, usando confirmation_number:', confirmationNumber);
        return confirmationNumber;
    } catch (error) {
        console.log('Error al obtener el ID de transacción');
        throw error;
    }
};

exports.getVariant = async (sku, userId) => {

    console.log('Sku en funcion getVariant:', sku);

    try {
        const variant = await db.variant.findOne({
            where: {
                sku: sku,
                user_id: userId,
            },
        });

        if (variant) {
            console.log('Variant encontrado:', variant);
            return variant;
        }

        console.log('Variant no encontrado para SKU:', sku);
        return null;
    } catch (error) {
        console.error('Error al buscar el variant:', error);
        throw error;
    }
};

exports.getGiftCardValues = async (orderId) => {
    console.log('ENTRA EN FUNCION GIFTCARD');
    console.log('ORDER ID PARA BUSCAR GIFTCARD', orderId);

    try {
        const transaction = await db.order_transaction.findOne({
            where: {
                order_id: orderId,
                gateway: 'gift_card' // Filtra por el campo gateway
            },
            attributes: ['amount', 'payment_id'], // Trae los campos amount y payment_id
            order: [['date_create', 'DESC']] // Si hay varias, toma la más reciente
        });

        if (transaction) {
            return {
                amount: transaction.amount,
                paymentId: transaction.payment_id,
            };
        }

        return { amount: 0, paymentId: null }; // Valores por defecto si no se encuentra transacción
    } catch (error) {
        console.error(`Error fetching gift card amount for order ${orderId}:`, error);
        return { amount: 0, paymentId: null }; // Valores por defecto en caso de error
    }
};


exports.getBranch = async (items, userId) => {
    console.log('Entra en getBranch');
    console.log('Usuario en getBranch', userId);

    //console.log('Items en getBranch', items);

    try {
        const parameter = await db.order_parameter.findOne({ where: { user_id: userId } });

        if (!parameter) {
            throw new Error('No se encontró un parámetro de orden para este usuario');
        }

        for (let item of items) {
            if (item.variant_inventory_management === null) {
                // Actualiza branch_id y branch_name con los valores por defecto
                item.branch_id = parameter.branch_id_default;
                item.branch_name = parameter.branch_name_default;
            }
        }

        return items;
    } catch (error) {
        console.error('Error actualizando los items:', error);
        throw error;
    }
};

exports.getCompareAtPrice = async (variantId, userId) => {
    try {
        // Obtener la lista de precios por defecto del usuario
        const priceList = await db.price_list.findOne({
            where: { user_id: userId, default: true },
        });

        if (!priceList) {
            throw new Error('No se encontró una lista de precios por defecto para el usuario.');
        }

        // Obtener el precio de comparación de la tabla price
        const price = await db.price.findOne({
            where: { price_list_id: priceList.id, variant_id: variantId }, // Ajusta el campo "sku" si tiene otro nombre
        });

        return price ? price.compare_at_price : null; // Retorna el precio si existe
    } catch (error) {
        console.error('Error al obtener compare_at_price:', error);
        return null; // Manejo de errores, retorna null si hay problemas
    }
}


