  const Sequelize = require('sequelize');
  var sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'Hf2gap7IxBTr', {
    host: 'ep-holy-resonance-a5e9582f.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    itemDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(err => reject("unable to sync the database"));
    });
};

module.exports.getAllItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category } })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

const { gte } = Sequelize.Op;
module.exports.getItemsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                itemDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { id } })
            .then(data => resolve(data[0]))
            .catch(err => reject("no results returned"));
    });
};

module.exports.addItem = (itemData) => {
    itemData.published = (itemData.published) ? true : false;
    for (let prop in itemData) {
        if (itemData[prop] === "") {
            itemData[prop] = null;
        }
    }
    itemData.itemDate = new Date();
    return new Promise((resolve, reject) => {
        Item.create(itemData)
            .then(() => resolve())
            .catch(err => reject("unable to create item"));
    });
};

module.exports.getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true, category } })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.addCategory = (categoryData) => {
    for (let prop in categoryData) {
        if (categoryData[prop] === "") {
            categoryData[prop] = null;
        }
    }
    return new Promise((resolve, reject) => {
        Category.create(categoryData)
            .then(() => resolve())
            .catch(err => reject("unable to create category"));
    });
};

module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id } })
            .then(() => resolve())
            .catch(err => reject("unable to delete category"));
    });
};

module.exports.deleteItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id } })
            .then(() => resolve())
            .catch(err => reject("unable to delete item"));
    });
};
