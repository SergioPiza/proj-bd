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

const validatorFormRot = {
    id_contrato: 'required',
    cpf_roteirista: 'required|digits:14',
    nome_roteiro: 'required',
    qtd_rotativos: 'integer',
}

// ----- ROTEIROS -----
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
        text: 'SELECT * FROM ROTEIRO'
    })
        .then(res => rot = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (rot.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('roteiros/roteiros', {
        title: 'Roteiros',
        roteiros: rot,
        msg: msg,
        err: err
    })
})

// ----- ROTEIROS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('roteiros/roteiros_add', {
        title: 'Adicionar Roteiro',
        msg: msg,
        roteiro: req.flash('rotBackup') || {}
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
        return res.redirect('/roteiros/add')
    }

    await bd.query(`INSERT INTO ROTEIRO (id_contrato, cpf_roteirista, nome_roteiro, descricao, qtd_rotativos)
                    VALUES($1, $2, $3, $4, $5)`,
        [form.id_contrato, form.cpf_roteirista, form.nome_roteiro, form.descricao, form.qtd_rotativos])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Roteiro "${form.id_contrato}" criado!`));
            res.redirect('/roteiros')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o roteiro :( || ${e.routine}`));
            req.flash('rotBackup', form)
            console.log(e)
            return res.redirect('/roteiros/add')
        })
})

// ----- ROTEIROS UPDATE -----
router.get('/update/:id_contrato/:nome_roteiro', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let rot = []
    let err = false

    await bd.query('SELECT * FROM ROTEIRO WHERE id_contrato=$1 AND nome_roteiro=$2', [req.params.id_contrato, req.params.nome_roteiro])
        .then(res => rot = (res.rows))
        .catch(e => err = true)
    if (rot.length === 0) err = true
    else {
        rot = rot[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o roteiro "${req.params.id_contrato} - ${req.params.nome_roteiro}" solicitado :(`));
        return res.redirect('/roteiros')
    }

    res.render('roteiros/roteiros_update', {
        title: 'Atualizar Roteiro',
        roteiro: req.flash('rotBackup') || rot,
        msg: msg
    })
})
router.post('/update/:id_contrato/:nome_roteiro', async (req, res) => {
    let form = req.body
    form.id_contrato = req.params.id_contrato
    form.nome_roteiro = req.params.nome_roteiro

    let v = new validator(form, validatorFormRot)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('rotBackup', form)
        return res.redirect('/roteiros/update/' + req.params.id_contrato + '/' + req.params.nome_roteiro)
    }

    await bd.query(`UPDATE ROTEIRO 
                    SET cpf_roteirista=$3, descricao=$4, qtd_rotativos=$5
                    WHERE id_contrato=$1 AND nome_roteiro=$2`, [req.params.id_contrato, form.nome_roteiro, form.cpf_roteirista, form.descricao, form.qtd_rotativos])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Roteiro "${req.params.id_contrato} - ${req.params.nome_roteiro}" alterado!`));
            res.redirect('/roteiros')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o roteiro :( || ${e.routine}`));
            req.flash('rotBackup', form)
            console.log(e)
            return res.redirect('/roteiros/update/' + req.params.id_contrato + '/' + req.params.nome_roteiro)
        })
})

// ----- ROTEIROS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM ROTEIRO 
                    WHERE id_contrato=$1 AND nome_roteiro=$2`, [form.id_contrato, form.nome_roteiro])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Roteiro "${form.id_contrato} - ${form.nome_roteiro}" apagado!`));
            res.redirect('/roteiros')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o roteiro "${form.id_contrato} - ${form.nome_roteiro}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/roteiros')
        })
})

module.exports = router