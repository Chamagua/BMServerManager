const express = require('express');
const router = express.Router();
const {isLoggedIn} =require('../lib/auth');
var fs = require('fs')
const { exec } = require("child_process");
const URL = 'dashboard';

router.get('/',isLoggedIn, async (req,res)=>{


    res.render(`${URL}/${URL}`);

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

    res.redirect(`/${URL}/`);
    
});


module.exports = router;