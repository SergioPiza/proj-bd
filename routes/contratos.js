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
validator.customMessages({
    id: 'CPF inválido'
});

const validatorFormCont = {
    id: 'required',
    cpf_mkt: 'required|digits:14',
    cnpj_cliente: 'required|digits:18',
    data_contra: 'required|date',
}

// ----- CONTRATOS -----
router.get('/', async (req, res) => {
    let cont = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM CONTRATO'
    })
        .then(res => cont = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (cont.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('contratos/contratos', {
        title: 'Contratos',
        contratos: cont,
        msg: msg,
        err: err
    })
})

// ----- CONTRATOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('contratos/contratos_add', {
        title: 'Adicionar Contrato',
        msg: msg,
        contrato: req.flash('contBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormCont)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('contBackup', form)
        return res.redirect('/contratos/add')
    }



    await bd.query(`INSERT INTO CONTRATO (id, cpf_mkt, cnpj_cliente, data_contra, publico, tema, valor)
                    VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [form.id, form.cpf_mkt, form.cnpj_cliente, form.data_contra, form.publico, form.tema, form.valor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Contrato "${form.id}" criado!`));
            res.redirect('/contratos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o contrato :( || ${e.routine}`));
            req.flash('contBackup', form)
            console.log(e)
            return res.redirect('/contratos/add')
        })
})

// ----- CONTRATOS UPDATE -----
router.get('/update/:id', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let cont = []
    let err = false

    await bd.query('SELECT * FROM CONTRATO WHERE id=$1', [req.params.id])
        .then(res => cont = (res.rows))
        .catch(e => err = true)
    if (cont.length === 0) err = true
    else {
        cont = cont[0]

        try {
            cont.data_contra = new Date(cont.data_contra)
        } catch (e) {
            cont.data_contra = new Date()
        }
        cont.data_contra = cont.data_contra.toISOString().substring(0, 10)
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o contrato "${req.params.id}" solicitado :(`));
        return res.redirect('/contratos')
    }

    res.render('contratos/contratos_update', {
        title: 'Atualizar Contrato',
        contrato: req.flash('contBackup') || cont,
        msg: msg
    })
})
router.post('/update/:id', async (req, res) => {
    let form = req.body
    form.id = req.params.id

    let v = new validator(form, validatorFormCont)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('contBackup', form)
        return res.redirect('/contratos/update/' + req.params.id)
    }

    await bd.query(`UPDATE CONTRATO 
                    SET data_contra=$2, publico=$3, tema=$4, valor=$5
                    WHERE id=$1`, [req.params.id, form.data_contra, form.publico, form.tema, form.valor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Contrato "${req.params.id}" alterado!`));
            res.redirect('/contratos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o contrato :( || ${e.routine}`));
            req.flash('contBackup', form)
            console.log(e)
            return res.redirect('/contratos/update/' + req.params.id)
        })
})

// ----- CONTRATOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM CONTRATO 
                    WHERE id=$1`, [form.id])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Contrato "${form.id}" apagado!`));
            res.redirect('/contratos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o contrato "${form.id}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/contratos')
        })
})

module.exports = router