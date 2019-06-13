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

const validatorFormUtil = {
    cpf_audiovisu: 'required|digits:14',
    id_equipa: 'required|integer',
    data_uti: 'required|date'
}

// ----- UTILIZAÇÕES -----
router.get('/', async (req, res) => {
    let util = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM UTILIZACAO'
    })
        .then(res => util = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (util.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('utilizacoes/utilizacoes', {
        title: 'Utilizações',
        utilizacoes: util,
        msg: msg,
        err: err
    })
})

// ----- UTILIZAÇÕES ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('utilizacoes/utilizacoes_add', {
        title: 'Adicionar Utilização',
        msg: msg,
        utilizacao: req.flash('utilBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormUtil)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('utilBackup', form)
        return res.redirect('/utilizacoes/add')
    }

    await bd.query(`INSERT INTO UTILIZACAO (cpf_audiovisu, id_equipa, data_uti)
                    VALUES($1, $2, $3)`,
        [form.cpf_audiovisu, form.id_equipa, form.data_uti])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Utilização "${form.cpf_audiovisu} - ${form.id_equipa} - ${form.data_uti} criada!`));
            res.redirect('/utilizacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir a utilização :( || ${e.routine}`));
            req.flash('utilBackup', form)
            console.log(e)
            return res.redirect('/utilizacoes/add')
        })
})

// ----- UTILIZAÇÕES UPDATE -----
router.get('/update/:cpf_audiovisu/:id_equipa/:data_uti', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let util = []
    let err = false

    await bd.query('SELECT * FROM UTILIZACAO WHERE cpf_audiovisu=$1 AND id_equipa=$2 AND data_uti=$3', [req.params.cpf_audiovisu, req.params.id_equipa, req.params.data_uti])
        .then(res => util = (res.rows))
        .catch(e => err = true)
    if (util.length === 0) err = true
    else {
        util = util[0]
        try {
            util.data_uti = new Date(util.data_uti)
        } catch (e) {
            util.data_uti = new Date()
        }
        util.data_uti = util.data_uti.toISOString().substring(0, 10)

    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar a utilização solicitado :(`));
        return res.redirect('/utilizacoes')
    }

    res.render('utilizacoes/utilizacoes_update', {
        title: 'Atualizar Utilização',
        utilizacao: req.flash('utilBackup') || util,
        msg: msg
    })
})
router.post('/update/:cpf_audiovisu/:id_equipa/:data_uti', async (req, res) => {
    let form = req.body
    form.cpf_audiovisu = req.params.cpf_audiovisu
    form.id_equipa = req.params.id_equipa
    form.data_uti = req.params.data_uti

    req.flash(sendMsg.warning, sendMsg.newMsg(`Utilizações não podem ser alteradas no momento!`));
    res.redirect('/utilizacoes')


    // let v = new validator(form, validatorFormUtil)
    // let valid = await v.check();

    // if (!valid) {
    //     let msgs = []
    //     for (k in v.errors) {
    //         msgs.push(v.errors[k].message)
    //     }
    //     req.flash(sendMsg.error, sendMsg.newMsg(msgs));
    //     req.flash('utilBackup', form)
    //     return res.redirect('/utilizacoes/update/' + req.params.cnpj_tecnico + '/' + req.params.cpf_actor + '/' + req.params.nome_utilizacao)
    // }

    // await bd.query(`UPDATE UTILIZACAO 
    //                 SET -------
    //                 WHERE cnpj_tecnico=$1 AND cpf_actor=$2 AND nome_utilizacao=$3`,
    //     [req.params.cnpj_tecnico, req.params.cpf_actor, req.params.nome_utilizacao])
    //     .then(r => {
    //         req.flash(sendMsg.success, sendMsg.newMsg(`Utilização "${form.cnpj_tecnico} - ${form.cpf_actor} - ${form.nome_utilizacao}" alterada!`));
    //         res.redirect('/utilizacoes')
    //     })
    //     .catch(e => {
    //         req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o utilização :( || ${e.routine}`));
    //         req.flash('utilBackup', form)
    //         console.log(e)
    //         return res.redirect('/utilizacoes/update/' + req.params.cnpj_tecnico + '/' + req.params.cpf_actor + '/' + req.params.nome_utilizacao)
    //     })
})

// ----- UTILIZAÇÕES DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM UTILIZACAO 
                    WHERE cpf_audiovisu=$1 AND id_equipa=$2 AND data_uti=$3`, [form.cpf_audiovisu, form.id_equipa, form.data_uti])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Utilização "${form.cpf_audiovisu} - ${form.id_equipa} - ${form.data_uti}" apagada!`));
            res.redirect('/utilizacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar a utilização "${form.cpf_audiovisu} - ${form.id_equipa} - ${form.data_uti}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/utilizacoes')
        })
})

module.exports = router