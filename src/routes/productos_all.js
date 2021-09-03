const express = require('express');
const router = express.Router();
const {getItems,getActualDate, getPages} = require('../lib/helpers');
const pool = require('../database');
const {isLoggedIn} =require('../lib/auth');
var fs = require('fs');
const { create } = require('domain');
//Variables Globales
const URL = 'productos_all';
const recordsByPage = 30;
const columnas = `nombre,codigoBarras,id`;//columnas a tomcar en cuenta para la buscqueda
let properties = {
    single : 'producto',
    URL:URL,
    textoBusqueda : 'Cod. Barras o Nombre'
}
let pageNumber =1;
let searchText = '';


router.get('/page/:pageNumber',isLoggedIn, async (req,res,next)=>{

    pageNumber = req.params.pageNumber;
    searchText = req.query.search_text;
    var start = Date.now();
        //actualizar consulta
        req.session.actual_page = pageNumber;

        let {items,pages} = await getItems(columnas,searchText,pageNumber,recordsByPage,URL,'productos','',null,null,true)
       
        //req.session.retaceo = null;
        
        var productos =  items;

        var query = `SELECT * FROM retaceos`;
        console.log(query)
        var retaceos =  await pool.query(query);

        productos = setCalculosRetaceo2(productos,retaceos);

        var end = Date.now();

        productos = getImages(productos);
        var notification=[{
            header: 'Consulta completada',
            icon: "fa-star",
            time: '.',
            message: "tiempo de respuesta "+(end-start)+" ms"
        }];
        req.flash('mensaje',notification);
        var mensaje = req.flash('mensaje');
        
        res.render(`productos/productos_list_all`, {productos,URL,properties,pages,mensaje});
        
});

create; (req,res,next)=>{
    console.log('test');
}

setCalculosRetaceo2 = (items,retaceos)=>{

    
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
        var retaceo = retaceos.find(xx => xx.id == item.id_retaceo);
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
                        //console.log(error);
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


module.exports =  router;