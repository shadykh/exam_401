'use strict';

//-------------------//
//-------Dependencies
//-------------------//

require('dotenv').config();

const express = require('express');

const pg = require('pg');

const superagent = require('superagent');

const methodOverride = require('method-override');

const cors = require('cors');

const ejs = require('ejs');

const app = express();

const PORT = process.env.PORT || 6987;

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

app.use(express.static('./public'));

app.set('view engine', 'ejs');

// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

//-------------//
//-------Routes
//---------------//
app.get('/', indexHandler);

app.post('/productByPrice', productByPriceHandler);

app.get('/maybellineProducts', maybellineProductsHandler);

app.post('/insertMyProducts', insertMyProductsHandler);

app.get('/myProducts', myProductsHandler);

app.get('/viewDetails/:id', viewDetailsHandler);

app.delete('/delete/:id', deleteHandler);

app.put('/update/:id', updateHandler);

//---------------------//
//-------Routes Handler
//----------------------//

// http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=10&price_less_than=14
function indexHandler(req, res) {
    res.render('pages/index');
}

function productByPriceHandler(req, res) {
    let brand = req.body.brand;
    let greater = req.body.greater;
    let less = req.body.less;

    let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=${brand}&price_greater_than=${greater}&price_less_than=${less}`;

    superagent.get(url)
        .then(result => {
            // console.log("🚀 ~ file: server.js ~ line 65 ~ productByPriceHandler ~ result", result.body);
            res.render('pages/productByPrice', { data: result.body })
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 80 ~ productByPriceHandler ~ err", err);
        })

}
// http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline
function maybellineProductsHandler(req, res) {
    let url = 'http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline'

    superagent.get(url)
        .then(result => {
            let dataArray = result.body.map(element => {
                let newElement = new Product(element);
                return newElement;
            });
            res.render('pages/maybellineProducts', { data: dataArray })
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 94 ~ maybellineProductsHandler ~ err", err);
        })
}

function insertMyProductsHandler(req, res) {
    console.log("🚀 ~ file: server.js ~ line 90 ~ insertMyProductsHandler ~ req", req.body);
    let { name, price, image_link, description } = req.body;
    let SQL = `INSERT INTO products (name, price, image_link, description) VALUES ($1, $2, $3, $4)`
    let safeValues = [name, price, image_link, description];
    client.query(SQL, safeValues)
        .then(results => {
            res.redirect('/myProducts');
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 105 ~ insertMyProductsHandler ~ err", err);
        })
}


function myProductsHandler(req, res) {
    let SQL = `SELECT * FROM products`
    client.query(SQL)
        .then(results => {
            if (results.rows.length === 0) {
                res.render('pages/emptyMyCard');
            } else {
                res.render('pages/myProducts', { data: results.rows });
            }
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 118 ~ myProductsHandler ~ err", err);
        })
}

function viewDetailsHandler(req, res) {
    let id = req.params.id;
    let SQL = `SELECT * FROM products WHERE id=$1`;
    let safeValue = [id];
    client.query(SQL, safeValue)
        .then(results => {
            res.render('pages/productDetails', { data: results.rows[0] });
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 128 ~ viewDetailsHandler ~ err", err);
        })
}

function deleteHandler(req, res) {
    let id = req.params.id;
    let SQL = `DELETE FROM products WHERE id=$1;`;
    let safeValues = [id];
    client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/myProducts');
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 138 ~ deleteHandler ~ err", err);
        })
}

function updateHandler(req, res) {
    let id = req.params.id;
    let { name, price, image_link, description } = req.body;
    let SQL = `UPDATE products SET name=$1, price=$2, image_link=$3, description=$4 WHERE id=$5;`;
    let safeValues = [name, price, image_link, description, id];
    client.query(SQL, safeValues)
        .then(() => {
            res.redirect(`/viewDetails/${id}`);
        })
        .catch(err => {
            console.log("🚀 ~ file: server.js ~ line 155 ~ updateHandler ~ err", err);
        })
}

//--------------------//
//-------Constructor
//-------------------//

function Product(data) {
    this.name = data.name;
    this.price = data.price;
    this.image_link = data.image_link;
    this.description = data.description;
}


//--------------------------//
//-------Check the Connection
//----------------------------//

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Listening on PORT ${PORT}`);
    });
});