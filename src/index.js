const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const {database} = require('./keys');
const passport = require('passport');
const multer = require('multer');
//initializations

const app = express();
const upload = multer({
    dest: '../database/images'
})



require('./lib/passport');



app.set('port',process.env.PORT || 4000);
app.set('views',path.join(__dirname,'views'));
app.engine('.hbs',exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'),'layouts'),
    partialsDir: path.join(app.get('views'),'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));


app.set('view engine', '.hbs');

//Middlewares

app.use(session({
    secret: 'inventarioPyxy',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)

}));
app.use(flash());
app.use(morgan('dev'));
//esto es para decirle que solo va aceptar strings no va aceptar imagenes ni eso
app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


//Global Variables
app.use((req,res,next)=>{
    app.locals.exito = req.flash('exito');
    app.locals.mensaje = req.flash('mensaje');
    app.locals.user = req.user;
    next();
})


//Routes
app.use(require('./routes/'));
app.use(require('./routes/authentication'));

app.use('/dashboard',require('./routes/dashboard'));


//Public
app.use(express.static(path.join(__dirname,'public')));


//Starting the server
app.listen(app.get('port'),()=>{
    console.log(`Server on port`, app.get('port'));

})




