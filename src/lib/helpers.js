const pool = require('../database');
const bcrypt = require('bcryptjs')

function getPages(recordsByPage,totalRecords,URL,pageNumber,searchText){

    searchText = searchText?`?search_text=${searchText}`:'?search_text=$';

    const numPages = Math.ceil(totalRecords/recordsByPage);
    var pages = [];

    var anterior = {}
    var siguiente = {}
    for(var i=1;i<=numPages;i++){

            var page = {
                link: `/${URL}/page/${i}/${searchText}`,
                numero: i,
                habilitado: i==pageNumber?true:false
             }
            
        pages[i]=page;
    }
    pages[0]={};

    pageActual = pages.find(item => item.habilitado==true);

    //PAGINA ANTERIOR
    anterior = pageActual.numero==1?{
        link: `#`,
        habilitado: 'disabled',
        before:true
    }:{
        link: `/${URL}/page/${(pageActual.numero-1)}/${searchText}`,
        habilitado:'enabled',
        before:true
    }

    //PAGINA SIGUIENTE
    siguiente = pageActual.numero==numPages?{
        link: `#`,
        habilitado: 'disabled',
        next:true
    }:{
        link: `/${URL}/page/${(pageActual.numero+1)}/${searchText}`,
        habilitado:'enabled',
        next:true
    }

    pages[0]=anterior;
    pages[numPages+1]=siguiente;

    return pages;

}

async function getItems(columnas,searchText,pageNumber,recordsByPage,URL,tabla,extraFilter,pages,items,actualizar){

    searchText= searchText=='$'||!searchText?'':searchText;
    var extra = extraFilter?'and '+extraFilter:'';
    if(!items){
        actualizar = true;
    }
    if(actualizar){
        //datos para pagineo
        
        const counterAux = await pool.query(`SELECT count(*) as counter FROM ${tabla} WHERE CONCAT(${columnas}) LIKE '%${searchText}%' ${extra}`);
        const totalRecords = counterAux[0].counter==0?1:counterAux[0].counter; 
        pages = getPages(recordsByPage,totalRecords,URL,pageNumber,searchText);
    }else{
        console.log('omito consulta paginas')
    }

    if(actualizar){
        var query = `SELECT * FROM ${tabla} WHERE CONCAT(${columnas}) LIKE '%${searchText}%' ${extra} limit ${(((pageNumber-1)*recordsByPage))},${recordsByPage}`;
        console.log(query)
        items = await pool.query(query);
    } else{
        console.log('omito consulta de items')
    }

    return {items,pages};
} 





function getActualDate(format){
let date_ob = new Date();

// current date
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);

// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
let year = date_ob.getFullYear();

// current hours
let hours = date_ob.getHours();

// current minutes
let minutes = date_ob.getMinutes();

// current seconds
let seconds = date_ob.getSeconds();

switch (format){
    case 'full': 
        return date+month+year+' '+hours+minutes+seconds;
    case 'hour':
        return hours+':'+minutes+':'+seconds
}

return '';


}

async function encryptPassword(password){
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password,salt);
    return hash;

};

async function matchPassword(password,savedPassword){
    
    try {
        return await bcrypt.compare(password,savedPassword);

    } catch (error) {
        console.log(e);
    }

} 

 
module.exports = {getItems,getActualDate,encryptPassword,matchPassword,getPages};