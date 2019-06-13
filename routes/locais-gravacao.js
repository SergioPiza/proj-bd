const express = require('express')
const connect = require('./../connect')

// Conectando à base de dados
const { Pool } = require('pg')
const bd = new Pool(connect.onlinebd)

const router = express.Router()
const sendMsg = require('./../sendMsg')

const validator = require('node-input-validator')
validator.messages({
    required: ':attribute é necessário.',
    email: 'E-mail inválido.',
    decimal: 'O campo :attribute deve ser um número válido.',
    date: 'Campo :attribute inválido.',
    digits: 'Campo :attribute inválido.',
});

const validatorFormLocalGrav = {
    nome_local: 'required',
    valor_local: 'decimal',
}

// ----- LOCAIS DE GRAVAÇÃO -----
router.get('/', async (req, res) => {
    let localGrav = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM LOCAL_GRAVACAO'
    })
        .then(res => localGrav = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (localGrav.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('locais-gravacao/locais-gravacao', {
        title: 'Locais de Gravação',
        locaisGravacao: localGrav,
        msg: msg,
        err: err
    })
})

// ----- LOCAIS DE GRAVAÇÃO ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('locais-gravacao/locais-gravacao_add', {
        title: 'Adicionar Local de Gravação',
        msg: msg,
        localGravacao: req.flash('localGravBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormLocalGrav)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('localGravBackup', form)
        return res.redirect('/locais-gravacao/add')
    }



    await bd.query(`INSERT INTO LOCAL_GRAVACAO (nome_local, valor_local, endereco_local, tipo_amb)
                    VALUES($1, $2, $3, $4)`,
        [form.nome_local, form.valor_local, form.endereco_local, form.tipo_amb])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Local de Gravação "${form.nome_local}" criado!`));
            res.redirect('/locais-gravacao')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o local de gravação :( || ${e.routine}`));
            req.flash('localGravBackup', form)
            console.log(e)
            return res.redirect('/locais-gravacao/add')
        })
})

// ----- LOCAIS DE GRAVAÇÃO UPDATE -----
router.get('/update/:nome_local', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let localGrav = []
    let err = false

    await bd.query('SELECT * FROM LOCAL_GRAVACAO WHERE nome_local=$1', [req.params.nome_local])
        .then(res => localGrav = (res.rows))
        .catch(e => err = true)
    if (localGrav.length === 0) err = true
    else {
        localGrav = localGrav[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o local de gravação "${req.params.nome_local}" solicitado :(`));
        return res.redirect('/locais-gravacao')
    }

    res.render('locais-gravacao/locais-gravacao_update', {
        title: 'Atualizar Local de Gravação',
        localGravacao: req.flash('localGravBackup') || localGrav,
        msg: msg
    })
})
router.post('/update/:nome_local', async (req, res) => {
    let form = req.body
    form.nome_local = req.params.nome_local

    let v = new validator(form, validatorFormLocalGrav)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('localGravBackup', form)
        return res.redirect('/locais-gravacao/update/' + req.params.nome_local)
    }

    await bd.query(`UPDATE LOCAL_GRAVACAO 
                    SET valor_local=$2, endereco_local=$3, tipo_amb=$4
                    WHERE nome_local=$1`, [req.params.nome_local, form.valor_local, form.endereco_local, form.tipo_amb])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Local de gravação "${req.params.nome_local}" alterado!`));
            res.redirect('/locais-gravacao')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o local de gravação :( || ${e.routine}`));
            req.flash('localGravBackup', form)
            console.log(e)
            return res.redirect('/locais-gravacao/update/' + req.params.nome_local)
        })
})

// ----- LOCAIS DE GRAVAÇÃO DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM LOCAL_GRAVACAO 
                    WHERE nome_local=$1`, [form.nome_local])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Local de gravação "${form.nome_local}" apagado!`));
            res.redirect('/locais-gravacao')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o local de gravação "${form.nome_local}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/locais-gravacao')
        })
})

module.exports = router