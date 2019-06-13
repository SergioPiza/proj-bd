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

const validatorFormEmp = {
    cpf_func: 'required|digits:14',
    funcao: 'required',
}

// ----- FULLTIME -----
router.get('/', async (req, res) => {
    let fulltime = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM FULLTIME'
    })
        .then(res => fulltime = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (fulltime.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('fulltime/fulltime', {
        title: 'Fulltimes',
        fulltimes: fulltime,
        msg: msg,
        err: err
    })
})

// ----- FULLTIME ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('fulltime/fulltime_add', {
        title: 'Adicionar Fulltime',
        msg: msg,
        fulltime: req.flash('fulltimeBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormEmp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('fulltimeBackup', form)
        return res.redirect('/fulltime/add')
    }

    await bd.query(`INSERT INTO FULLTIME (cpf_func, funcao)
                    VALUES($1, $2)`, [form.cpf_func, form.funcao])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Fulltime "${form.cpf_func}" criada!`));
            res.redirect('/fulltime')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o fulltime :( || ${e.routine}`));
            req.flash('fulltimeBackup', form)
            console.log(e)
            return res.redirect('/fulltime/add')
        })
})

// ----- FULLTIME UPDATE -----
router.get('/update/:cpf_func', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }
    console.log(req.params.cpf_func)

    let fulltime = []
    let err = false

    await bd.query('SELECT * FROM FULLTIME WHERE cpf_func=$1', [req.params.cpf_func])
        .then(res => {
            fulltime = (res.rows)
        })
        .catch(e => err = true)
    if (fulltime.length === 0) err = true
    else fulltime = fulltime[0]

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o fulltime "${req.params.cpf_func}" solicitado :(`));
        return res.redirect('/fulltime')
    }

    res.render('fulltime/fulltime_update', {
        title: 'Atualizar Fulltime',
        fulltime: req.flash('fulltimeBackup') || fulltime,
        msg: msg
    })
})
router.post('/update/:cpf_func', async (req, res) => {
    let form = req.body
    form.cpf_func = req.params.cpf_func
    console.log(form)

    let v = new validator(form, validatorFormEmp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('fulltimeBackup', form)
        return res.redirect('/fulltime/update/' + req.params.cpf_func)
    }

    await bd.query(`UPDATE FULLTIME 
                    SET funcao=$2
                    WHERE cpf_func=$1`,
        [form.cpf_func, form.funcao])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Fulltime "${req.params.cpf_func}" alterada!`));
            res.redirect('/fulltime')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o fulltime :( || ${e.routine}`));
            req.flash('fulltimeBackup', form)
            console.log(e)
            return res.redirect('/fulltime/update/' + req.params.cpf_func)
        })
})

// ----- FULLTIME DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM FULLTIME 
                    WHERE cpf_func=$1`, [form.cpf_func])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Fulltime "${form.cpf_func}" apagada!`));
            res.redirect('/fulltime')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o fulltime "${form.cpf_func}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/fulltime')
        })
})

module.exports = router