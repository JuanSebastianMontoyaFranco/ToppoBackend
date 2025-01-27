
module.exports = (db) => {
    const { user } = db;

    user.afterCreate(async (orderInstance, options) => {
        console.log(`Hook de User`);

    });
};

