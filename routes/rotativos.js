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
    cpf_rotativo: 'CPF inválido'
});

const validatorFormRot = {
    cpf_rotativo: 'required|digits:14',
    categoria: 'required',
    bco_horas: 'decimal',
}

// ----- ROTATIVOS -----
router.get('/', async (req, res) => {
    let rot = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM ROTATIVO'
    })
        .then(res => rot = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (rot.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('rotativos/rotativos', {
        title: 'Rotativos',
        rotativos: rot,
        msg: msg,
        err: err
    })
})

// ----- ROTATIVOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('rotativos/rotativos_add', {
        title: 'Adicionar Rotativo',
        msg: msg,
        rotativo: req.flash('rotBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormRot)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('rotBackup', form)
        return res.redirect('/rotativos/add')
    }

    await bd.query(`INSERT INTO ROTATIVO (cpf_rotativo, categoria, bco_horas, setor)
                    VALUES($1, $2, $3, $4)`, [form.cpf_rotativo, form.categoria, form.bco_horas, form.setor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Rotativo "${form.cpf_rotativo}" criado!`));
            res.redirect('/rotativos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o rotativo :( || ${e.routine}`));
            req.flash('rotBackup', form)
            console.log(e)
            return res.redirect('/rotativos/add')
        })
})

// ----- ROTATIVOS UPDATE -----
router.get('/update/:cpf_rotativo', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let rot = []
    let err = false

    await bd.query('SELECT * FROM ROTATIVO WHERE cpf_rotativo=$1', [req.params.cpf_rotativo])
        .then(res => rot = (res.rows))
        .catch(e => err = true)
    if (rot.length === 0) err = true
    else {
        rot = rot[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o rotativo "${req.params.cpf_rotativo}" solicitado :(`));
        return res.redirect('/rotativos')
    }

    res.render('rotativos/rotativos_update', {
        title: 'Atualizar Rotativo',
        rotativo: req.flash('rotBackup') || rot,
        msg: msg
    })
})
router.post('/update/:cpf_rotativo', async (req, res) => {
    let form = req.body
    form.cpf_rotativo = req.params.cpf_rotativo

    let v = new validator(form, validatorFormRot)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('rotBackup', form)
        return res.redirect('/rotativos/update/' + req.params.cpf_rotativo)
    }

    //                      cpf_rotativo, categoria, bco_horas, setor
    await bd.query(`UPDATE ROTATIVO 
                    SET categoria=$2, bco_horas=$3, setor=$4
                    WHERE cpf_rotativo=$1`, [req.params.cpf_rotativo, form.categoria, form.bco_horas, form.setor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Rotativo "${req.params.cpf_rotativo}" alterado!`));
            res.redirect('/rotativos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o rotativo :( || ${e.routine}`));
            req.flash('rotBackup', form)
            console.log(e)
            return res.redirect('/rotativos/update/' + req.params.cpf_rotativo)
        })
})

// ----- ROTATIVOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM ROTATIVO 
                    WHERE cpf_rotativo=$1`, [form.cpf_rotativo])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Rotativo "${form.cpf_rotativo}" apagado!`));
            res.redirect('/rotativos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o rotativo "${form.cpf_rotativo}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/rotativos')
        })
})

module.exports = router