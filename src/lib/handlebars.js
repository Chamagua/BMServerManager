const {format, register} = require('timeago.js');

const helpers = {};

const localeFunc = (number, index, totalSec) => {
    // number: the timeago / timein number;
    // index: the index of array below;
    // totalSec: total seconds between date to be formatted and today's date;
    return [
      ['hace un momento', 'right now'],
      ['hace %s segundos', 'in %s seconds'],
      ['hace 1 minuto', 'in 1 minute'],
      ['hace %s minutos', 'in %s minutes'],
      ['hace 1 hora', 'in 1 hour'],
      ['hace %s horas', 'in %s hours'],
      ['hace 1 dia', 'in 1 day'],
      ['hace %s dias' , 'in %s days'],
      ['hace 1 semana', 'in 1 week'],
      ['hace %s semanas', 'in %s weeks'],
      ['hace 1 mes', 'in 1 month'],
      ['hace %s meses', 'in %s months'],
      ['hace 1 año', 'in 1 year'],
      ['hace %s años', 'in %s years']
    ][index];
  };
  register('es_ES', localeFunc);

helpers.timeago = (timestamp) =>{
    return format(timestamp,'es_ES');
};

helpers.fixed = (numero)=>{
  if(numero){
    return parseFloat(numero).toFixed(2);
  } else {
    return numero;
  }
 
}

helpers.printconsole = (json)=>{
  console.log('********'+json);
}






module.exports = helpers;