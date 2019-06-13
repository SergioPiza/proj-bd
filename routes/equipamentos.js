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

const validatorFormEquip = {
    id_equip: 'integer|required',
}

// ----- EQUIPAMENTOS -----
router.get('/', async (req, res) => {
    let equip = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM EQUIPAMENTO'
    })
        .then(res => equip = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (equip.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('equipamentos/equipamentos', {
        title: 'Equipamentos',
        equipamentos: equip,
        msg: msg,
        err: err
    })
})

// ----- EQUIPAMENTOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('equipamentos/equipamentos_add', {
        title: 'Adicionar Equipamento',
        msg: msg,
        equipamento: req.flash('equipBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormEquip)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('equipBackup', form)
        return res.redirect('/equipamentos/add')
    }

    await bd.query(`INSERT INTO EQUIPAMENTO (id_equip, tipo, modelo, especificacao)
                    VALUES($1, $2, $3, $4)`,
        [form.id_equip, form.tipo, form.modelo, form.especificacao])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Equipamento "${form.id_equip}" criado!`));
            res.redirect('/equipamentos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o equipamento :( || ${e.routine}`));
            req.flash('equipBackup', form)
            console.log(e)
            return res.redirect('/equipamentos/add')
        })
})

// ----- EQUIPAMENTOS UPDATE -----
router.get('/update/:id_equip', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let equip = []
    let err = false

    await bd.query('SELECT * FROM EQUIPAMENTO WHERE id_equip=$1', [req.params.id_equip])
        .then(res => equip = (res.rows))
        .catch(e => err = true)
    if (equip.length === 0) err = true
    else {
        equip = equip[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o equipamento solicitado :(`));
        return res.redirect('/equipamentos')
    }

    res.render('equipamentos/equipamentos_update', {
        title: 'Atualizar Equipamento',
        equipamento: req.flash('equipBackup') || equip,
        msg: msg
    })
})
router.post('/update/:id_equip', async (req, res) => {
    let form = req.body
    form.id_equip = req.params.id_equip

    let v = new validator(form, validatorFormEquip)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('equipBackup', form)
        return res.redirect('/equipamentos/update/' + req.params.id_equip)
    }

    await bd.query(`UPDATE EQUIPAMENTO 
                    SET tipo=$2, modelo=$3, especificacao=$4
                    WHERE id_equip=$1`,
        [req.params.id_equip, form.tipo, form.modelo, form.especificacao])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Equipamento "${form.id_equip}" alterado!`));
            res.redirect('/equipamentos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o equipamento :( || ${e.routine}`));
            req.flash('equipBackup', form)
            console.log(e)
            return res.redirect('/equipamentos/update/' + req.params.id_equip)
        })
})

// ----- EQUIPAMENTOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM EQUIPAMENTO 
                    WHERE id_equip=$1`, [form.id_equip])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Equipamento "${form.id_equip}" apagado!`));
            res.redirect('/equipamentos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o equipamento "${form.id_equip}" ! || ${e.routine}`));
            console.log(e)
            return res.redirect('/equipamentos')
        })
})

module.exports = router