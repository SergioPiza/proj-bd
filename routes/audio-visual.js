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
    cpf_audio: 'required|digits:14',
    categoria: 'required',
}

// ----- AUDIO_VISUAL -----
router.get('/', async (req, res) => {
    let audioVisual = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM AUDIO_VISUAL'
    })
        .then(res => audioVisual = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (audioVisual.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('audio-visual/audio-visual', {
        title: 'Áudio-Visuais',
        audioVisuais: audioVisual,
        msg: msg,
        err: err
    })
})

// ----- AUDIO_VISUAL ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('audio-visual/audio-visual_add', {
        title: 'Adicionar Audio-visual',
        msg: msg,
        audioVisual: req.flash('audioVisualBackup') || {}
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
        req.flash('audioVisualBackup', form)
        return res.redirect('/audio-visual/add')
    }

    await bd.query(`INSERT INTO AUDIO_VISUAL (cpf_audio, categoria)
                    VALUES($1, $2)`, [form.cpf_audio, form.categoria])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Audio-visual "${form.cpf_audio}" criada!`));
            res.redirect('/audio-visual')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o audio-visual :( || ${e.routine}`));
            req.flash('audioVisualBackup', form)
            console.log(e)
            return res.redirect('/audio-visual/add')
        })
})

// ----- AUDIO_VISUAL UPDATE -----
router.get('/update/:cpf_audio', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }
    console.log(req.params.cpf_audio)

    let audioVisual = []
    let err = false

    await bd.query('SELECT * FROM AUDIO_VISUAL WHERE cpf_audio=$1', [req.params.cpf_audio])
        .then(res => {
            audioVisual = (res.rows)
        })
        .catch(e => err = true)
    if (audioVisual.length === 0) err = true
    else audioVisual = audioVisual[0]

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o audio-visual "${req.params.cpf_audio}" solicitado :(`));
        return res.redirect('/audio-visual')
    }

    res.render('audio-visual/audio-visual_update', {
        title: 'Atualizar Audio-visual',
        audioVisual: req.flash('audioVisualBackup') || audioVisual,
        msg: msg
    })
})
router.post('/update/:cpf_audio', async (req, res) => {
    let form = req.body
    form.cpf_audio = req.params.cpf_audio
    console.log(form)

    let v = new validator(form, validatorFormEmp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('audioVisualBackup', form)
        return res.redirect('/audio-visual/update/' + req.params.cpf_audio)
    }

    await bd.query(`UPDATE AUDIO_VISUAL 
                    SET categoria=$2
                    WHERE cpf_audio=$1`,
        [form.cpf_audio, form.categoria])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Audio-visual "${req.params.cpf_audio}" alterada!`));
            res.redirect('/audio-visual')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o audio-visual :( || ${e.routine}`));
            req.flash('audioVisualBackup', form)
            console.log(e)
            return res.redirect('/audio-visual/update/' + req.params.cpf_audio)
        })
})

// ----- AUDIO_VISUAL DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM AUDIO_VISUAL 
                    WHERE cpf_audio=$1`, [form.cpf_audio])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Audio-visual "${form.cpf_audio}" apagada!`));
            res.redirect('/audio-visual')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o audio-visual "${form.cpf_audio}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/audio-visual')
        })
})

module.exports = router