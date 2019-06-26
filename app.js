const express = require('express')
const bodyParser = require('body-parser')
const path = require('path');
const connect = require('./connect')

const app = express()


// Conectando à base de dados
const {
    Pool
} = require('pg')
const bd = new Pool(connect.onlinebd)

// Iniciando Body Parser
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

// Setando pasta pública (para css/imagens/etc)
app.use(express.static(path.join(__dirname, '/public')));

// Setando as views do app usando pug.js
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Plugins para mensagens de notificação
const sendMsg = require('./sendMsg')
const session = require('express-session')
const flash = require('req-flash')
app.use(session({
    secret: 'pasdojaspdkaspofjaspodk',
    resave: false,
    saveUninitialized: true
}))
app.use(flash())

const fs = require('fs');
const directoryPath = path.join(__dirname, 'routes');
let menuItems = []
fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (file) {
        file = file.split('.')[0]
        menuItems.push(file)
    });
});

app.use(function (req, res, next) {
    res.locals = {
        menuItems: menuItems
    };
    next();
});


app.get('/', (req, res) => res.render('consultas/consultas'))


let funcionarios = require('./routes/funcionarios')
app.use('/funcionarios', funcionarios)

let empresas_artisticas = require('./routes/empresas_artisticas')
app.use('/empresas/artisticas', empresas_artisticas)

let empresas_transportes = require('./routes/empresas_transportes')
app.use('/empresas/transportes', empresas_transportes)

let empresas_clientes = require('./routes/empresas_clientes')
app.use('/empresas/clientes', empresas_clientes)

let fulltimes = require('./routes/fulltime')
app.use('/fulltime', fulltimes)

let audioVisuais = require('./routes/audio-visual')
app.use('/audio-visual', audioVisuais)

let rotativos = require('./routes/rotativos')
app.use('/rotativos', rotativos)

let contratos = require('./routes/contratos')
app.use('/contratos', contratos)

let roteiros = require('./routes/roteiros')
app.use('/roteiros', roteiros)

let locaisGravacao = require('./routes/locais-gravacao')
app.use('/locais-gravacao', locaisGravacao)

let gravacoes = require('./routes/gravacoes')
app.use('/gravacoes', gravacoes)

let preparacoes = require('./routes/preparacoes')
app.use('/preparacoes', preparacoes)

let videos = require('./routes/videos')
app.use('/videos', videos)

let servicos = require('./routes/servicos')
app.use('/servicos', servicos)

let equipamentos = require('./routes/equipamentos')
app.use('/equipamentos', equipamentos)

let utilizacoes = require('./routes/utilizacoes')
app.use('/utilizacoes', utilizacoes)

let participacoes = require('./routes/participacoes')
app.use('/participacoes', participacoes)

let transportes = require('./routes/transportes')
app.use('/transportes', transportes)

let consultas = require('./routes/consultas')
app.use('/consultas', consultas)


const PORT = process.env.PORT || 5000

app.listen(PORT, console.log(`Server started on port ${PORT}`))