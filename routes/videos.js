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

const validatorFormVid = {
    nome_arquivo: 'required',
    nome_rot: 'required',
    cpf_diretor: 'required',
    id_contrato: 'required',
    data_lanca: 'date',
    data_grava: 'date'
}

// ----- VÍDEOS -----
router.get('/', async (req, res) => {
    let vid = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM VIDEO'
    })
        .then(res => vid = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (vid.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('videos/videos', {
        title: 'Vídeos',
        videos: vid,
        msg: msg,
        err: err
    })
})

// ----- VÍDEOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('videos/videos_add', {
        title: 'Adicionar Vídeo',
        msg: msg,
        video: req.flash('vidBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormVid)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('vidBackup', form)
        return res.redirect('/videos/add')
    }

    /**	NOME_ARQUIVO VARCHAR(40),
        NOME_ROT VARCHAR(20),
        CPF_DIRETOR CHAR(14),
        ID_CONTRATO INT,
    
        DURACAO VARCHAR(6),
        IDIOMA VARCHAR(10),
        DATA_LANCA DATE,
        DATA_GRAVA DATE,
     */

    await bd.query(`INSERT INTO VIDEO (nome_arquivo, nome_rot, cpf_diretor, id_contrato, duracao, idioma, data_lanca, data_grava)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [form.nome_arquivo, form.nome_rot, form.cpf_diretor, form.id_contrato, form.duracao, form.idioma, form.data_lanca, form.data_grava])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Vídeo "${form.nome_arquivo} - ${form.nome_rot} - ${form.cpf_diretor} - ${form.id_contrato}" criado!`));
            res.redirect('/videos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o vídeo :( || ${e.routine}`));
            req.flash('vidBackup', form)
            console.log(e)
            return res.redirect('/videos/add')
        })
})

// ----- VÍDEOS UPDATE -----
router.get('/update/:nome_arquivo/:nome_rot/:cpf_diretor/:id_contrato', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let vid = []
    let err = false

    await bd.query('SELECT * FROM VIDEO WHERE nome_arquivo=$1 AND nome_rot=$2 AND cpf_diretor=$3 AND id_contrato=$4', [req.params.nome_arquivo, req.params.nome_rot, req.params.cpf_diretor, req.params.id_contrato])
        .then(res => vid = (res.rows))
        .catch(e => err = true)
    if (vid.length === 0) err = true
    else {
        vid = vid[0]
        try {
            vid.data_lanca = new Date(vid.data_lanca)
        } catch (e) {
            vid.data_lanca = new Date()
        }
        try {
            vid.data_grava = new Date(vid.data_grava)
        } catch (e) {
            vid.data_grava = new Date()
        }
        vid.data_grava = vid.data_grava.toISOString().substring(0, 10)
        vid.data_lanca = vid.data_lanca.toISOString().substring(0, 10)

    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o vídeo solicitado :(`));
        return res.redirect('/videos')
    }

    res.render('videos/videos_update', {
        title: 'Atualizar Vídeo',
        video: req.flash('vidBackup') || vid,
        msg: msg
    })
})
router.post('/update/:nome_arquivo/:nome_rot/:cpf_diretor/:id_contrato', async (req, res) => {
    let form = req.body
    form.nome_arquivo = req.params.nome_arquivo
    form.nome_rot = req.params.nome_rot
    form.cpf_diretor = req.params.cpf_diretor
    form.id_contrato = req.params.id_contrato

    let v = new validator(form, validatorFormVid)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('vidBackup', form)
        return res.redirect('/videos/update/' + req.params.nome_arquivo + '/' + req.params.nome_rot + '/' + req.params.cpf_diretor + '/' + req.params.id_contrato)
    }

    await bd.query(`UPDATE VIDEO 
                    SET duracao=$5, idioma=$6, data_lanca=$7, data_grava=$8
                    WHERE nome_arquivo=$1 AND nome_rot=$2 AND cpf_diretor=$3 AND id_contrato=$4`,
        [req.params.nome_arquivo, req.params.nome_rot, req.params.cpf_diretor, req.params.id_contrato, form.duracao, form.idioma, form.data_lanca, form.data_grava])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Vídeo "${form.nome_arquivo} - ${form.nome_rot} - ${form.cpf_diretor} - ${form.id_contrato}" alterado!`));
            res.redirect('/videos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o vídeo :( || ${e.routine}`));
            req.flash('vidBackup', form)
            console.log(e)
            return res.redirect('/videos/update/' + req.params.nome_arquivo + '/' + req.params.nome_rot + '/' + req.params.cpf_diretor + '/' + req.params.id_contrato)
        })
})

// ----- VÍDEOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM VIDEO 
                    WHERE nome_arquivo=$1 AND nome_rot=$2 AND cpf_diretor=$3 AND id_contrato=$4`, [form.nome_arquivo, form.nome_rot, form.cpf_diretor, form.id_contrato])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Vídeo "${form.nome_arquivo} - ${form.nome_rot} - ${form.cpf_diretor} - ${form.id_contrato}" apagado!`));
            res.redirect('/videos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o vídeo "${form.nome_arquivo} - ${form.nome_rot} - ${form.cpf_diretor} - ${form.id_contrato}" ! || ${e.routine}`));
            console.log(e)
            return res.redirect('/videos')
        })
})

module.exports = router