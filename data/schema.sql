DROP TABLE IF EXISTS products;

CREATE TABLE products(
    id serial PRIMARY KEY,
    name VARCHAR,
    price VARCHAR,
    image_link VARCHAR,
    description VARCHAR
);