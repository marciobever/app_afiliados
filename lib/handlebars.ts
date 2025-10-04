import Handlebars from 'handlebars'
// helpers básicos
Handlebars.registerHelper('indexPlus1', (idx:number)=> idx+1)
Handlebars.registerHelper('priceNice', (cents:number)=> (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}))
Handlebars.registerHelper('timestampBR', ()=> new Date().toLocaleString('pt-BR'))
export default Handlebars
