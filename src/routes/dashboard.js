const express = require('express');
const router = express.Router();
const {isLoggedIn} =require('../lib/auth');
var fs = require('fs');
const { opendir,readdir  } = require('fs/promises');
const { exec } = require("child_process");
const URL = 'dashboard';

router.get('/',isLoggedIn, async (req,res)=>{

    var path = '/'
    var files = await getFiles(path);
    var response = { files }

    res.render(`${URL}/${URL}`, response);

});  


router.post('/',isLoggedIn,async (req,res)=>{
    var start = Date.now();
    const obj= req.body;
    var files = await getFiles(obj.directory);

    //console.log(response);
    var end = Date.now();

    var notification=[{
        header: 'Consulta completada',
        icon: "fa-star",
        time: '.',
        message: "tiempo de respuesta "+(end-start)+" ms"
    }];
    req.flash('mensaje',notification);
    var mensaje = req.flash('mensaje');

    res.render(`${URL}/${URL}`, {files,mensaje});

});

router.post('/cmd',isLoggedIn,async (req,res)=>{
    const obj= req.body;
    var cmd = "dir";
    if(obj.cmd == "pc2"){
        cmd = "sh /home/pi/encenderPCwork.sh"
    }

    if(obj.cmd == "pc1"){
        cmd = "sh /home/pi/encenderPChome.sh"
    }

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
 


    
});

getFiles = async (path)=>{
    var arr1 = [];
    try {
        const files =  fs.readdirSync(path.replace(/\/\//g, "/"));
        for (const file of files){
            var realPath = ('/'+path+'/'+file+'/').replace(/\/\//g, "/").replace('//','/');
            //console.log(realPath);
            var test = isDirectory(realPath.replace(/\/\//g, "/"));
            
            var rs = {
                isDir : test,
                path: realPath.replace(/\/\//g, "/"),
                file: file
            }  

            arr1.push(rs);
        }
       
    //console.log(file);
      } catch (err) {
        //console.error(err);
        return arr1;
      }



    return arr1;
}

isDirectory = (path)=>{
    try {
        var test =  fs.lstatSync(path).isDirectory();
        return test;
    }
    catch(e) {
        //console.log(e);
        return false;
    }
}


module.exports = router;