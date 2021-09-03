const mysql = require ('mysql');
const {promisify} =require('util');
const {database} = require('./keys');

//aqui se genera la conexion a la base de datos
const pool = mysql.createPool(database);
//console.log(database);
pool.getConnection((err,connection)=>{
    if(err){
        if (err.code==='PROTOCOL_CONNECTION_LOST'){
            console.error('DATABASE CONNECTION WAS CLOSED');
        }
        else if(err.code === 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }  
        else if(err.code === 'ECONNREFUSED'){
            console.error('DATABASE CONNECTION WAS REFUSED');
        }

        else{
            console.log(err);
        }

        if(connection) connection.release();
        console.log('DB IS CONNECTED')
        return;


    }
});

pool.query = promisify(pool.query);
//Promisify
module.exports = pool;