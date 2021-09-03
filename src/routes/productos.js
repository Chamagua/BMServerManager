//importaciones
const express = require('express');
const router = express.Router();
const {getItems,getActualDate} = require('../lib/helpers');
const pool = require('../database');
const {isLoggedIn} =require('../lib/auth');
const {upload} = require('../lib/multer');
var fs = require('fs')

//Variables Globales
const URL = 'productos';
const recordsByPage = 5;
const columnas = `nombre,codigoBarras,id`;//columnas a tomcar en cuenta para la buscqueda
let properties = {
    single : 'producto',
    URL:URL,
    textoBusqueda : 'Cod. Barras o Nombre'
}
let pageNumber =1;
let searchText = '';

let pages_session=null;
let items_session=null;

router.get('/',isLoggedIn, async (req,res)=>{
    properties.elemento = null;
    res.redirect(`/${URL}/page/1/?search_text=$`);
}); 

router.get('/page/:pageNumber',isLoggedIn, async (req,res,done)=>{
    pageNumber = req.params.pageNumber;
    searchText = req.query.search_text;
    if(req.session.retaceo){
       
        //actualizar consulta
        var actualizar = (!(req.session.actual_page==pageNumber)||(req.session.before == 'update'));
        if(searchText!='$') actualizar = true;
        req.session.actual_page = pageNumber;
        var extraFilter = req.session.retaceo?`id_retaceo=${req.session.retaceo.id}`:'';
    
        let {items,pages} = await getItems(columnas,searchText,pageNumber,recordsByPage,URL,'productos',extraFilter,pages_session,items_session,true)
        pages_session=pages;
        items_session = items;
    
        //req.session.retaceo = null;
        items = setCalculosRetaceo(items,req.session.retaceo);
        items = getImages(items);
    
       
        req.session.before = 'consultar';
        properties.retaceo = req.session.retaceo;
    
    
        var notification=[{
            header: 'Fallo',
            icon: "fa-times",
            time: '.',
            message: "Usuario o contraseña incorrectas"
        }];
        
        let mensaje= req.flash('mensaje',notification);
        res.render(`${URL}/${URL}`, {items,URL,properties,pages,mensaje});
    }
    else {
        properties.textoBusqueda = 'Numero factura';
        let {items,pages} = await getItems('numfactura,proveedor',searchText,pageNumber,recordsByPage,URL,'retaceos',null,null,null,true)
        let mensaje= req.flash('mensaje',notification);
        res.render(`${URL}/${URL}`, {items,URL,properties,pages,mensaje});
    }

});

router.get(`/delete/:id`,isLoggedIn,async (req,res)=>{
    if(req.session.retaceo){
        const {id} = req.params;
        const producto = await pool.query(`SELECT * FROM ${URL}  WHERE ID = ?`,[id]);
        let images = JSON.parse(producto[0].foto1);
    
        try {
            if(images){
                images.forEach(element => {
                    fs.unlinkSync(element.path);
                });
            }
        } catch (error) {
            console.log(error);
        }
    
        await pool.query(`DELETE FROM ${URL} WHERE ID = ?`,[id]);
    
        res.redirect(`/${URL}/page/1/?search_text=`+searchText);
    } else {
        const {id} = req.params;
        const retaceo = await pool.query(`SELECT * FROM retaceos  WHERE ID = ?`,[id]);
        if(!retaceo){
            console.log('nel')
            res.redirect(`/${URL}/page/1/?search_text=`+searchText);
        }
        await pool.query(`DELETE FROM retaceos WHERE ID = ?`,[id]);
        res.redirect(`/${URL}/page/1/?search_text=`+searchText);
    }

});

router.get(`/edit/:id`,isLoggedIn,async (req,res)=>{
    if(req.session.retaceo){
        //obtener ID del item a modificar
        const {id} = req.params;
        //obtener los valores de la BD
        
        const producto = await pool.query(`SELECT * FROM ${URL}  WHERE ID = ?`,[id]);
        var extraFilter = req.session.retaceo?`id_retaceo=${req.session.retaceo.id}`:'';
        let {items,pages} = await getItems(columnas,searchText,pageNumber,recordsByPage,URL,'productos',extraFilter,pages_session,items_session,true)
        pages_session=pages;
        items_session=items;
        items = setCalculosRetaceo(items,req.session.retaceo);
        items = getImages(items);
        //Enonctrar el Indice del seeleccionado en la lista
        const encontrado = items.find(item => item.id == id);
        const index = items.indexOf(encontrado);

        //agregar un flag del seleccionado y volver a meterlo en la lista
        encontrado.selectFlag = 'true';
        items[index] = encontrado;
        properties.elemento = producto[0]
        properties.retaceo = req.session.retaceo;
        req.session.before = 'update';
        res.render(`${URL}/${URL}`,{items,pages,properties,URL})
    } else {
        const {id} = req.params;
        const retaceo = await pool.query(`SELECT * FROM retaceos  WHERE ID = ?`,[id]);
        let {items,pages} = await getItems('numfactura,proveedor',searchText,pageNumber,recordsByPage,URL,'retaceos',null,null,null,true);
        const encontrado = items.find(item => item.id == id);
        const index = items.indexOf(encontrado);
        //agregar un flag del seleccionado y volver a meterlo en la lista
        encontrado.selectFlag = 'true';
        items[index] = encontrado;
        properties.elemento = retaceo[0]
        properties.retaceo = req.session.retaceo;
        req.session.before = 'update';
        res.render(`${URL}/${URL}`,{items,pages,properties,URL})
    }




});
//muy importante los name del formulario deben ser igual a los nombres en la BD
router.post('/add',isLoggedIn,upload.array('foto1'),async (req,res)=>{
   
    const obj= req.body;
    obj.user_id = parseInt(req.user.id);
    obj.id_retaceo = parseInt(req.session.retaceo.id);
    //EDITAR
    if(obj.id){
        //si selecciona imagenes para editar borras las anteriores y pone la nueva
        try {
            if(req.files.length>0){
                const producto = await pool.query(`SELECT * FROM ${URL}  WHERE ID = ?`,[obj.id]);
                let images = JSON.parse(producto[0].foto1);
            
                if(images){
                    images.forEach(element => {
                        fs.unlinkSync(element.path);
                    });
                }
                obj.foto1 = JSON.stringify(req.files)
            } 
        } catch (error) {
            console.log(error);
            obj.foto1 = JSON.stringify(req.files)

        }
        
        //actauliza la BD
        await pool.query(`UPDATE ${URL} set ? WHERE id = ?`,[obj,obj.id]);
        properties.cuenta =1;
        properties.notification=[{
            header: obj.nombre,
            icon: "fa-commenting",
            time: getActualDate('hour'),
            message: "Registro actualizado"
        }]
        delete properties.elemento;
    } 
    //GUARDAR
    else {
        obj.foto1 = JSON.stringify(req.files)
        obj.id =0;
        await pool.query(`INSERT INTO productos SET ?`,[obj]);
        properties.cuenta =1;
        properties.notification=[{
            header: obj.nombre,
            icon: "fa-commenting",
            time: getActualDate('hour'),
            message: "Registro almacenado"
        }]
    }

    res.redirect(`/${URL}/`);
    
});


//RETACEO

router.post('/addRetaceo',isLoggedIn,async (req,res)=>{

    const obj= req.body;
    obj.fecfactura =null;
    obj.total = getTotalRetaceo(obj);
    //EDITAR
    
    if(obj.id){
        //si selecciona imagenes para editar borras las anteriores y pone la nueva
        
        //actauliza la BD
        await pool.query(`UPDATE retaceos set ? WHERE id = ?`,[obj,obj.id]);

    } 
    //GUARDAR
    else {
        obj.id =0;
        var exp = await pool.query(`INSERT INTO retaceos SET ?`,[obj]);
        obj.id=exp.insertId
    }
    req.session.retaceo = obj;

    res.redirect(`/${URL}/`);
    
});


router.get('/volver',isLoggedIn, async (req,res,done)=>{
    properties.elemento = null;
    properties.retaceo = null;
    req.session.retaceo = null;
    res.redirect(`/${URL}/`);
});
router.get('/finalizar',isLoggedIn, async (req,res,done)=>{
    properties.elemento = null;
    properties.retaceo = null;
    req.session.retaceo = null;
    res.redirect(`/${URL}/`);
});

setCalculosRetaceo = (items,retaceo)=>{

    
    var sum_total_del_costo_total_fob = 0.00;
    var sum_total_flete_internacional = 0.00;
    var sum_total_costo_total_cif = 0.00;
    var sum_agente_aduanal = 0.00;
    var sum_dai = 0.00;
    var sum_cepa = 0.00;
    var sum_flete_interno = 0.00;
    var sum_cargadores_y_otros = 0.00;
    var sum_total_de_gastos = 0.00;
    var sum_costo_total = 0.00;
    var sum_costo_unitario = 0.00;
    var sum_cuadre_cu_unidad = 0.00;
    

    items.forEach((item,index)=>{
        item.costo_total_fob = item.cantidad * item.precio;
        sum_total_del_costo_total_fob = sum_total_del_costo_total_fob + item.costo_total_fob;
    })
    
    items.forEach((item,index)=>{
         item.flete_internacional       =  item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.fleteinter;
         sum_total_flete_internacional  = sum_total_flete_internacional + item.flete_internacional ;
         item.costo_total_cif           = item.costo_total_fob + item.flete_internacional;
         sum_total_costo_total_cif      = sum_total_costo_total_cif + item.costo_total_cif;
         item.agente_aduanal            = item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.tramaduanal;
         sum_agente_aduanal             = sum_agente_aduanal + item.agente_aduanal;
         item.dai                       = item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.dai;
         sum_dai                        = sum_dai + item.dai;
         item.cepa                      = item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.cepa;
         sum_cepa                       = sum_cepa + item.cepa ;
         item.flete_interno             = item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.fleteinterno;
         sum_flete_interno              = sum_flete_interno + item.flete_interno;
         item.cargadores_y_otros        = item.costo_total_fob/sum_total_del_costo_total_fob*retaceo.cargadoresyotrs;
         sum_cargadores_y_otros         = sum_cargadores_y_otros + item.cargadores_y_otros;

         item.total_gastos =    item.agente_aduanal + item.dai  + item.cepa  + item.flete_interno  +  item.cargadores_y_otros;
         //console.log(`item.agente_aduanal ${item.agente_aduanal} + item.dai ${item.dai}  + item.cepa ${item.cepa}  + item.flete_interno ${item.flete_interno}  +  item.cargadores_y_otros ${item.cargadores_y_otros};`)
        sum_total_de_gastos = sum_total_de_gastos + item.total_gastos;
        

         item.costo_total               = item.total_gastos + item.costo_total_cif;
         sum_costo_total                = sum_costo_total + item.costo_total;
         item.costo_unitario            = item.costo_total/item.cantidad;
         //console.log(`cu: ${item.costo_unitario} tot_gasto: ${item.total_de_gastos} cantidad: ${item.cantidad}`);
         sum_costo_unitario             = sum_costo_unitario + item.costo_unitario;
         item.cuadre_cu_unidad          = item.costo_unitario * item.cantidad;
         sum_cuadre_cu_unidad           = sum_cuadre_cu_unidad + item.cuadre_cu_unidad;
        
    })

    return items;
}

getImages = (items)=>{//Obtiene las imagenes agrupadas por el numero de multiplo
    if(items){
        items.forEach(  (element1,index) => {
            if(element1.foto1){
                let images = JSON.parse(element1.foto1);
    
                var i=0;
                var k=0;
                let multiplo = 3;
                if(images.length>(multiplo*2))
                {
                    multiplo = multiplo*2;
                }
    
                let grupo = [];      
    
                while(i<images.length){
                    var bandera2 = true;
                    let auxImages = [];
                    var j=0;
                    while(bandera2 && i<images.length){
                        
                        var ruta = images[i].path
                    try {
                        var data = fs.readFileSync(ruta);
                        auxImages[j] = 'data:'+images[i].mimetype+';base64,'+Buffer.from(data).toString('base64');
                                                   
                        i++;
                        j++;
    
                        if((i%multiplo)==0){
                            bandera2=false;
                        } 
                    } catch (error) {
                        bandera2=false;
                        i=images.length;
                        console.log(error);
                        return items;
                    }
                        
    
                    }
                    grupo[k]=auxImages;
                    k++;
                }
                
                items[index].grupo = grupo;
            }
        });
    }
    

    return items;
}

getTotalRetaceo = (retaceo)=>{
    var total = 0.00;
    total = total+(retaceo.fleteinter?parseFloat(retaceo.fleteinter):0.00);
    total = total+(retaceo.tramaduanal?parseFloat(retaceo.tramaduanal):0.00);
    total = total+(retaceo.dai?parseFloat(retaceo.dai):0.00);
    total = total+(retaceo.cepa?parseFloat(retaceo.cepa):0.00);
    total = total+(retaceo.fleteinterno?parseFloat(retaceo.fleteinterno):0.00);
    total = total+(retaceo.cargadoresyotrs?parseFloat(retaceo.cargadoresyotrs):0.00);

    return total;

}








///////////////////////////////////////
/// API EXPRESSION NOT IN USE FOR NOW
/////////////////////////////////////

router.get('/api',isLoggedIn, async (req,res)=>{
    //const productos = await pool.query('SELECT * FROM productos');
    //console.log(productos);

    //layouts/productos
    res.json({test:"asdfasdf"});
});

module.exports = router;


