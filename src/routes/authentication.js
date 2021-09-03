const express = require('express');
const router = express.Router();
const passport = require('passport');
const { route } = require('./productos');
const {isLoggedIn,isNotLoggedIn} =require('../lib/auth');

router.get('/signin',isNotLoggedIn,(req,res)=>{

    res.render('auth/signin');

});

router.post('/signin',isNotLoggedIn, (req,res,next)=>{
    passport.authenticate('local.signin',{
        successRedirect: '/profile',
        failureRedirect: '/signin',
        failureFlash: true
    })(req,res,next);
});

router.get('/signup',isNotLoggedIn,(req,res)=>{

    res.render('auth/signup');

});

router.post('/signup',isNotLoggedIn, passport.authenticate('local.signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup'
}

))

router.get('/profile',isLoggedIn, (req,res)=>{

    res.render('profile')
});


router.get('/logout', (req,res)=>{
    req.logOut();
    res.redirect('/signin');
});

/*
router.post('/signup',(req,res)=>{
    
    console.log(req.body)
    res.send('recibido');

})
*/



module.exports = router;