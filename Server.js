/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Amardeep Singh Brar
Student ID: 172282220
Date: 2024-06-15
Vercel Web App URL: https://web-322-azure.vercel.app/shop
GitHub Repository URL: https://github.com/asbrar35/WEB_322

********************************************************************************/

const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const exphbs = require('express-handlebars');
const streamifier = require('streamifier');
const storeService = require('./store-service');
const app = express();
const port = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'dbmm8yadl',
    api_key: '765779334181859',
    api_secret: '2JfXLHuqwD3y1kNMk4Gj-YGUADQ',
    secure: true
});

const upload = multer();

const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active"' : '') +
                '><a href="' + url + '">' +
                options.fn(this) +
                '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
});

app.engine('.hbs', hbs.engine);

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

        let item = items[0];

        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = [];

        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }

    res.render("shop", { data: viewData });
});

app.get('/items', (req, res) => {
    let filterCategory = req.query.category;
    let queryPromise;

    if (filterCategory) {
        queryPromise = storeService.getItemsByCategory(filterCategory);
    } else {
        queryPromise = storeService.getAllItems();
    }

    queryPromise
        .then(data => {
            if (data.length > 0) {
                res.render('items', { items: data });
            } else {
                res.render('items', { message: "no results" });
            }
        })
        .catch(err => {
            res.render('items', { message: "no results" });
        });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            if (data.length > 0) {
                res.render('categories', { categories: data });
            } else {
                res.render('categories', { message: "no results" });
            }
        })
        .catch(err => {
            res.render('categories', { message: "no results" });
        });
});

app.get('/items/add', (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render('addItem', { categories });
        })
        .catch(err => {
            console.error('Error loading categories:', err);
            res.status(500).send('Error loading categories');
        });
});

app.post('/items/add', upload.single('featureImage'), (req, res) => {
    const { title, price, body, category, published } = req.body;

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req)
            .then((uploaded) => {
                processItem(uploaded.url);
            })
            .catch((error) => {
                console.error('Error uploading image to Cloudinary:', error);
                processItem('');
            });
    } else {
        processItem('');
    }

    function processItem(imageUrl) {
        const newItem = {
            title: title,
            price: parseFloat(price),
            body: body,
            category: parseInt(category),
            published: published === 'on',
            featureImage: imageUrl
        };

        storeService.addItem(newItem)
            .then(() => {
                res.redirect('/items');
            })
            .catch((error) => {
                res.status(500).json({ message: "Error adding item: " + error });
            });
    }
});

app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.use((req, res, next) => {
    res.status(404).render('404');
});

storeService.initialize()
    .then(() => {
        app.listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    })
    .catch(err => {
        console.log(err);
    });

module.exports = app;
