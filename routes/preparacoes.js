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

const validatorFormPrep = {
    cnpj_tec: 'required',
    cpf_ator: 'required',
    data_prepa: 'required|date',
    valor_prep: 'decimal',
}

// ----- PREPARAÇÕES -----
router.get('/', async (req, res) => {
    let prep = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM PREPARACAO'
    })
        .then(res => prep = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (prep.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('preparacoes/preparacoes', {
        title: 'Preparações',
        preparacoes: prep,
        msg: msg,
        err: err
    })
})

// ----- PREPARAÇÕES ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('preparacoes/preparacoes_add', {
        title: 'Adicionar Preparação',
        msg: msg,
        preparacao: req.flash('prepBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormPrep)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('prepBackup', form)
        return res.redirect('/preparacoes/add')
    }

    await bd.query(`INSERT INTO PREPARACAO (cnpj_tec, cpf_ator, data_prepa, valor_prep)
                    VALUES($1, $2, $3, $4)`,
        [form.cnpj_tec, form.cpf_ator, form.data_prepa, form.valor_prep])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Preparação "${form.cnpj_tec} - ${form.cpf_ator} - ${form.data_prepa}" criada!`));
            res.redirect('/preparacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir a preparação :( || ${e.routine}`));
            req.flash('prepBackup', form)
            console.log(e)
            return res.redirect('/preparacoes/add')
        })
})

// ----- PREPARAÇÕES UPDATE -----
router.get('/update/:cnpj_tec/:cpf_ator/:data_prepa', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let prep = []
    let err = false

    await bd.query('SELECT * FROM PREPARACAO WHERE cnpj_tec=$1 AND cpf_ator=$2 AND data_prepa=$3', [req.params.cnpj_tec, req.params.cpf_ator, req.params.data_prepa])
        .then(res => prep = (res.rows))
        .catch(e => err = true)
    if (prep.length === 0) err = true
    else {
        prep = prep[0]
        try {
            prep.data_prepa = new Date(prep.data_prepa)
        } catch (e) {
            prep.data_prepa = new Date()
        }
        prep.data_prepa = prep.data_prepa.toISOString().substring(0, 10)

    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar a preparação "${req.params.cnpj_tec} - ${req.params.cpf_ator} - ${req.params.data_prepa}" solicitada :(`));
        return res.redirect('/preparacoes')
    }

    res.render('preparacoes/preparacoes_update', {
        title: 'Atualizar Preparação',
        preparacao: req.flash('prepBackup') || prep,
        msg: msg
    })
})
router.post('/update/:cnpj_tec/:cpf_ator/:data_prepa', async (req, res) => {
    let form = req.body
    form.cnpj_tec = req.params.cnpj_tec
    form.cpf_ator = req.params.cpf_ator
    form.data_prepa = req.params.data_prepa

    let v = new validator(form, validatorFormPrep)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('prepBackup', form)
        return res.redirect('/preparacoes/update/' + req.params.cnpj_tec + '/' + req.params.cpf_ator + '/' + req.params.data_prepa)
    }

    await bd.query(`UPDATE PREPARACAO 
                    SET valor_prep=$4
                    WHERE cnpj_tec=$1 AND cpf_ator=$2 AND data_prepa=$3`, [req.params.cnpj_tec, req.params.cpf_ator, req.params.data_prepa, form.valor_prep])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Preparação "${form.cnpj_tec} - ${form.cpf_ator} - ${form.data_prepa}" alterada!`));
            res.redirect('/preparacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar a preparação :( || ${e.routine}`));
            req.flash('prepBackup', form)
            console.log(e)
            return res.redirect('/preparacoes/update/' + req.params.nome_arq + '/' + req.params.nome_loc + '/' + req.params.cpf_diretor)
        })
})

// ----- PREPARAÇÕES DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM PREPARACAO 
                    WHERE cnpj_tec=$1 AND cpf_ator=$2 AND data_prepa=$3`, [form.cnpj_tec, form.cpf_ator, form.data_prepa])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Preparação "${form.cnpj_tec} - ${form.cpf_ator} - ${form.data_prepa}" apagado!`));
            res.redirect('/preparacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar a preparação "${form.cnpj_tec} - ${form.cpf_ator} - ${form.data_prepa}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/preparacoes')
        })
})

module.exports = router