/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Amardeep Singh Brar
Student ID: 172282220
Date: 2024-06-15
Vercel Web App URL: https://web-322-azure.vercel.app/shop
GitHub Repository URL: https://github.com/asbrar35/WEB_322

********************************************************************************/

const express = require('express');
const path = require('path');
const pg = require("pg");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const exphbs = require('express-handlebars');
const streamifier = require('streamifier');
const storeService = require('./store-service');
const itemData = require('./store-service'); 
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
          throw new Error("The 'equal' helper requires exactly 2 parameters.");
        if (lvalue == rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function(dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
      }
    }
});

app.engine('.hbs', hbs.engine);

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

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
        if (!req.query.category) {
            items = await itemData.getPublishedItems();
        } else {
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        let item = items[0];
        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await itemData.getCategories();
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
        if (!req.query.category) {
            items = await itemData.getPublishedItems();
        } else {
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.item = await itemData.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await itemData.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results";
    }
    res.render("shop", { data: viewData });
});

app.get('/items', (req, res) => {
    storeService.getAllItems().then((data) => {
        if (data.length === 0) {
            res.render("items", { message: "No items found" });
        } else {
            res.render("items", { items: data });
        }
    }).catch((err) => {
        res.render("items", { message: "Error fetching items: " + err });
    });
});

app.get('/categories', (req, res) => {
    storeService.getCategories().then((data) => {
        if (data.length === 0) {
            res.render("categories", { message: "No categories found" });
        } else {
            res.render("categories", { categories: data });
        }
    }).catch((err) => {
        res.render("categories", { message: "Error fetching categories: " + err });
    });
});

app.get('/categories/add', (req, res) => {
    res.render("addCategory");
});

app.get('/items/add', (req, res) => {
    storeService.getCategories().then((data) => {
        res.render('addItem', { categories: data });
    }).catch((err) => {
        res.render('addItem', { categories: [], message: "Error fetching categories for item: " + err });
    });
});

app.get('/items/delete/:id', (req, res) => {
    storeService.deleteItemById(req.params.id).then(() => {
        res.redirect('/items');
    }).catch((err) => {
        res.status(500).send("Error removing item or item not found: " + err);
    });
});

app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.status(500).send("Error adding category: " + err);
    });
});

app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id).then(() => {
        res.redirect('/categories');
    }).catch((err) => {
        res.status(500).send("Error removing category or category not found: " + err);
    });
});

app.post('/items/add', (req, res) => {
    const { title, price, body, category, published } = req.body;

    processItem();

    function processItem() {
        const newItem = {
            title: title,
            price: parseFloat(price),
            body: body,
            category: parseInt(category),
            published: published === 'on', 
            itemDate: new Date(),
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
        console.log("Error initializing store service: " + err);
    });

module.exports = app;
