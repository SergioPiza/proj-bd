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

const validatorFormPart = {
    cpf_rota: 'required|digits:14',
    nome_arq: 'required',
    cpf_diretor: 'required|digits:14',
    id_contrato: 'required|integer',
    nome_rot: 'required',
    tempo: 'required'
}

// ----- PARTICIPAÇÕES -----
router.get('/', async (req, res) => {
    let part = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM PARTICIPA'
    })
        .then(res => part = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (part.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('participacoes/participacoes', {
        title: 'Participações',
        participacoes: part,
        msg: msg,
        err: err
    })
})

// ----- PARTICIPAÇÕES ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('participacoes/participacoes_add', {
        title: 'Adicionar Participação',
        msg: msg,
        participacao: req.flash('partBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormPart)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('partBackup', form)
        return res.redirect('/participacoes/add')
    }

    await bd.query(`INSERT INTO PARTICIPA (cpf_rota, nome_arq, cpf_diretor, id_contrato, nome_rot, tempo)
                    VALUES($1, $2, $3, $4, $5, $6)`,
        [form.cpf_rota, form.nome_arq, form.cpf_diretor, form.id_contrato, form.nome_rot, form.tempo])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Participação "${form.cpf_rota} - ${form.nome_arq} criada!`));
            res.redirect('/participacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir a participação :( || ${e.routine}`));
            req.flash('partBackup', form)
            console.log(e)
            return res.redirect('/participacoes/add')
        })
})

// ----- PARTICIPAÇÕES UPDATE -----
router.get('/update/:cpf_rota/:nome_arq', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let part = []
    let err = false

    await bd.query('SELECT * FROM PARTICIPA WHERE cpf_rota=$1 AND nome_arq=$2', [req.params.cpf_rota, req.params.nome_arq])
        .then(res => part = (res.rows))
        .catch(e => err = true)
    if (part.length === 0) err = true
    else {
        part = part[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar a participação solicitada :(`));
        return res.redirect('/participacoes')
    }

    res.render('participacoes/participacoes_update', {
        title: 'Atualizar Participação',
        participacao: req.flash('partBackup') || part,
        msg: msg
    })
})
router.post('/update/:cpf_rota/:nome_arq', async (req, res) => {
    let form = req.body
    form.cpf_rota = req.params.cpf_rota
    form.nome_arq = req.params.nome_arq

    let v = new validator(form, validatorFormPart)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('partBackup', form)
        return res.redirect('/participacoes/update/' + req.params.cpf_rota + '/' + req.params.nome_arq)
    }
    //cpf_rota, nome_arq, cpf_diretor, id_contrato, nome_rot, tempo
    await bd.query(`UPDATE PARTICIPA 
                    SET cpf_diretor=$3, id_contrato=$4, nome_rot=$5, tempo=$6
                    WHERE cpf_rota=$1 AND nome_arq=$2`,
        [req.params.cpf_rota, req.params.nome_arq, form.cpf_diretor, form.id_contrato, form.nome_rot, form.tempo])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Participação "${form.cpf_rota} - ${form.nome_arq}" alterada!`));
            res.redirect('/participacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar a participação :( || ${e.routine}`));
            req.flash('partBackup', form)
            console.log(e)
            return res.redirect('/participacoes/update/' + req.params.cpf_rota + '/' + req.params.nome_arq)
        })
})

// ----- PARTICIPAÇÕES DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM PARTICIPA 
                    WHERE cpf_rota=$1 AND nome_arq=$2`, [form.cpf_rota, form.nome_arq])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Participação "${form.cpf_rota} - ${form.nome_arq}" apagada!`));
            res.redirect('/participacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar a participação "${form.cpf_rota} - ${form.nome_arq}" ! || ${e.routine}`));
            console.log(e)
            return res.redirect('/participacoes')
        })
})

module.exports = router