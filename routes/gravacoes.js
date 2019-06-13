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

const validatorFormGrav = {
    nome_loc: 'required',
    valor_local: 'decimal',
}

// ----- GRAVAÇÕES -----
router.get('/', async (req, res) => {
    let grav = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM GRAVACAO'
    })
        .then(res => grav = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (grav.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('gravacoes/gravacoes', {
        title: 'Gravações',
        gravacoes: grav,
        msg: msg,
        err: err
    })
})

// ----- GRAVAÇÕES ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('gravacoes/gravacoes_add', {
        title: 'Adicionar Gravação',
        msg: msg,
        gravacao: req.flash('gravBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormGrav)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('gravBackup', form)
        return res.redirect('/gravacoes/add')
    }


    await bd.query(`INSERT INTO GRAVACAO (nome_loc, nome_arq, cpf_diretor, nome_rot, id_contrato, data_gravacao, hora_chegada, hora_saida, valor)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [form.nome_loc, form.nome_arq, form.cpf_diretor, form.nome_rot, form.id_contrato, form.data_gravacao, form.hora_chegada, form.hora_saida, form.valor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Gravação "${form.nome_loc} - ${form.nome_arq} - ${form.cpf_diretor}" criada!`));
            res.redirect('/gravacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir a gravação :( || ${e.routine}`));
            req.flash('gravBackup', form)
            console.log(e)
            return res.redirect('/gravacoes/add')
        })
})

// ----- GRAVAÇÕES UPDATE -----
router.get('/update/:nome_arq/:nome_loc/:cpf_diretor', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let grav = []
    let err = false

    await bd.query('SELECT * FROM GRAVACAO WHERE nome_loc=$1 AND nome_arq=$2 AND cpf_diretor=$3', [req.params.nome_loc, req.params.nome_arq, req.params.cpf_diretor])
        .then(res => grav = (res.rows))
        .catch(e => err = true)
    if (grav.length === 0) err = true
    else {
        grav = grav[0]
        try {
            grav.hora_chegada = grav.hora_chegada.substring(0, 5)
            grav.hora_saida = grav.hora_saida.substring(0, 5)
            grav.data_gravacao = new Date(grav.data_gravacao)
        } catch (e) {
            grav.data_gravacao = new Date()
        }
        grav.data_gravacao = grav.data_gravacao.toISOString().substring(0, 10)

    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar a gravação "${form.nome_loc} - ${form.nome_arq} - ${form.cpf_diretor}" solicitada :(`));
        return res.redirect('/gravacoes')
    }

    res.render('gravacoes/gravacoes_update', {
        title: 'Atualizar Gravação',
        gravacao: req.flash('gravBackup') || grav,
        msg: msg
    })
})
router.post('/update/:nome_arq/:nome_loc/:cpf_diretor', async (req, res) => {
    let form = req.body
    form.nome_loc = req.params.nome_loc
    form.nome_arq = req.params.nome_arq
    form.cpf_diretor = req.params.cpf_diretor

    let v = new validator(form, validatorFormGrav)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('gravBackup', form)
        return res.redirect('/gravacoes/update/' + req.params.nome_arq + '/' + req.params.nome_loc + '/' + req.params.cpf_diretor)
    }

    await bd.query(`UPDATE GRAVACAO 
                    SET nome_rot=$4, id_contrato=$5, data_gravacao=$6, hora_chegada=$7, hora_saida=$8, valor=$9
                    WHERE nome_loc=$1 AND nome_arq=$2 AND cpf_diretor=$3`, [req.params.nome_loc, req.params.nome_arq, req.params.cpf_diretor, form.nome_rot, form.id_contrato, form.data_gravacao, form.hora_chegada, form.hora_saida, form.valor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Gravação "${form.nome_loc} - ${form.nome_arq} - ${form.cpf_diretor}" alterada!`));
            res.redirect('/gravacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar a gravação :( || ${e.routine}`));
            req.flash('gravBackup', form)
            console.log(e)
            return res.redirect('/gravacoes/update/' + req.params.nome_arq + '/' + req.params.nome_loc + '/' + req.params.cpf_diretor)
        })
})

// ----- GRAVAÇÕES DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM GRAVACAO 
                    WHERE nome_loc=$1 AND nome_arq=$2 AND cpf_diretor=$3`, [form.nome_loc, form.nome_arq, form.cpf_diretor])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Gravação "${form.nome_loc}" apagado!`));
            res.redirect('/gravacoes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar a gravação "${form.nome_loc}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/gravacoes')
        })
})

module.exports = router