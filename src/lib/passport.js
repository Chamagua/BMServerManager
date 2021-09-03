const passport =    require('passport');
const LocalStrategy =    require('passport-local').Strategy;
const pool = require('../database');
const {encryptPassword,matchPassword} = require('./helpers')


passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true

}, async (req,username,password,done) => {
    const query = `SELECT * FROM users WHERE username = '${username}'`
    let properties = {}
           
    const rows = await pool.query(query);

    if(rows.length>0){
        const user = rows[0];
        const validPassword = await matchPassword(password,user.password);
        if(validPassword){
           notification=[{
                header: 'Exito',
                icon: "fa-star",
                time: '.',
                message: "Inicio de sesion"
            }];
            req.flash('mensaje',notification);
            var mensaje = req.flash('mensaje');
            done(null,user,req.flash('mensaje',notification))
        }
        else{
            var notification=[{
                header: 'Fallo',
                icon: "fa-times",
                time: '.',
                message: "Usuario o contraseña incorrectas"
            }];
           done(null,false,req.flash('mensaje',notification))
        }
    }
    else{
        var notification=[{
            header: 'Fallo',
            icon: "fa-times",
            time: '.',
            message: "Usuario o contraseña incorrectas"
        }];
        return done(null,false,req.flash('mensaje',notification))
    }

}));


passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true

}, async (req,username,password,done)=>{
    const {fullname} = req.body;
    const empresa_id = 1;
    var newUser = {
        username,
        password,
        fullname,
        empresa_id
    }

    newUser.password = await encryptPassword(password);
    //console.log(newUser);
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    //console.log(result);
    newUser.id  = result.insertId;
    //console.log(newUser);
    return done(null,newUser);

}
));


passport.serializeUser((user,done)=>{
    //console.log(user);
    done(null,user);

});

passport.deserializeUser(async(user,done)=>{
    const query =  `SELECT * FROM users WHERE id = ${user.id}`;
    //const query =  `SELECT * FROM users WHERE id =11`;
    //console.log(user);
    const rows = await pool.query(query);
    done(null,rows[0]);
})
