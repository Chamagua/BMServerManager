CREATE DATABASE database_inventario;

USE database_inventario;

CREATE TABLE users(
    id INT(11) not null,
    username VARCHAR(16) not null,
    password VARCHAR(60) not null,
    fullname VARCHAR(100) not null,


);

ALTER TABLE USERS 
    add PRIMARY KEY(id);

ALTER TABLE USERS
    MODIFY id int(11) not null AUTO_INCREMENT, AUTO_INCREMENT=1;

DESCRIBE USERS;