const express = require('express')
const connect = require('./../connect')

// Conectando à base de dados
const {
    Pool
} = require('pg')
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

const validatorFormTransp = {
    cnpj_transporte: 'required|digits:18',
    cpf_funcionario: 'required|digits:14',
    data_trans: 'required|date',
    hora_chegada: 'required',
    hora_saida: 'required',
    valor_trans: 'decimal'
}

// ----- TRANSPORTES -----
router.get('/', async (req, res) => {
    let transp = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || {
            content: []
        },
        success: req.flash(sendMsg.success) || {
            content: []
        },
        warning: req.flash(sendMsg.warning) || {
            content: []
        }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM TRANSPORTA'
    })
        .then(res => transp = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (transp.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('transportes/transportes', {
        title: 'Transportes',
        transportes: transp,
        msg: msg,
        err: err
    })
})

// ----- TRANSPORTES ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || {
            content: []
        },
        success: req.flash(sendMsg.success) || {
            content: []
        },
        warning: req.flash(sendMsg.warning) || {
            content: []
        }
    }

    res.render('transportes/transportes_add', {
        title: 'Adicionar Transporte',
        msg: msg,
        transporte: req.flash('transpBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormTransp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('transpBackup', form)
        return res.redirect('/transportes/add')
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

    await bd.query(`INSERT INTO TRANSPORTA (cnpj_transporte, cpf_funcionario, data_trans, hora_chegada, hora_saida, valor_trans, carro)
                    VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [form.cnpj_transporte, form.cpf_funcionario, form.data_trans, form.hora_chegada, form.hora_saida, form.valor_trans, form.carro])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Transporte "${form.cnpj_transporte}" criado!`));
            res.redirect('/transportes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o transporte :( || ${e.routine}`));
            req.flash('transpBackup', form)
            console.log(e)
            return res.redirect('/transportes/add')
        })
})

// ----- TRANSPORTES UPDATE -----
router.get('/update/:cnpj_transporte/:cpf_funcionario/:data_trans', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || {
            content: []
        },
        success: req.flash(sendMsg.success) || {
            content: []
        },
        warning: req.flash(sendMsg.warning) || {
            content: []
        }
    }

    let transp = []
    let err = false

    await bd.query('SELECT * FROM TRANSPORTA WHERE cnpj_transporte=$1 AND cpf_funcionario=$2 AND data_trans=$3',
        [req.params.cnpj_transporte, req.params.cpf_funcionario, req.params.data_trans])
        .then(res => transp = (res.rows))
        .catch(e => err = true)
    if (transp.length === 0) err = true
    else {
        transp = transp[0]
        try {
            transp.hora_chegada = transp.hora_chegada.substring(0, 5)
            transp.hora_saida = transp.hora_saida.substring(0, 5)
            transp.data_trans = new Date(transp.data_trans)
        } catch (e) {
            transp.data_trans = new Date()
        }

        transp.data_trans = transp.data_trans.toISOString().substring(0, 10)

    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o transporte solicitado :(`));
        return res.redirect('/transportes')
    }

    res.render('transportes/transportes_update', {
        title: 'Atualizar Transporte',
        transporte: req.flash('transpBackup') || transp,
        msg: msg
    })
})
router.post('/update/:cnpj_transporte/:cpf_funcionario/:data_trans', async (req, res) => {
    console.log(12345)
    let form = req.body
    form.cnpj_transporte = req.params.cnpj_transporte
    form.cpf_funcionario = req.params.cpf_funcionario
    form.data_trans = req.params.data_trans
    console.log(form)

    let v = new validator(form, validatorFormTransp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('transpBackup', form)
        return res.redirect('/transportes/update/' + encodeURIComponent(form.cnpj_transporte) + '/' + form.cpf_funcionario + '/' + form.data_trans)
    }

    console.log([req.params.cnpj_transporte, req.params.cpf_funcionario, req.params.data_trans, form.hora_chegada, form.hora_saida, form.valor_trans, form.carro])
    //cnpj_transporte, cpf_funcionario, data_trans, hora_chegada, hora_saida, valor_trans, carro
    await bd.query(`UPDATE TRANSPORTA 
                    SET hora_chegada=$4, hora_saida=$5, valor_trans=$6, carro=$7
                    WHERE cnpj_transporte=$1 AND cpf_funcionario=$2 AND data_trans=$3`,
        [req.params.cnpj_transporte, req.params.cpf_funcionario, req.params.data_trans, form.hora_chegada, form.hora_saida, form.valor_trans, form.carro])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Transporte "${form.cnpj_transporte} - ${form.cpf_funcionario} - ${form.data_trans}" alterado!`));
            res.redirect('/transportes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o transporte "${form.cnpj_transporte} - ${form.cpf_funcionario} - ${form.data_trans}" :( || ${e.routine}`));
            req.flash('transpBackup', form)
            console.log(e)
            return res.redirect('/transportes/update/' + encodeURIComponent(form.cnpj_transporte) + '/' + form.cpf_funcionario + '/' + form.data_trans)
        })
})

// ----- TRANSPORTES DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM TRANSPORTA 
                    WHERE cnpj_transporte=$1 AND cpf_funcionario=$2 AND data_trans=$3`, [form.cnpj_transporte, form.cpf_funcionario, form.data_trans])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Transporte "${form.cnpj_transporte} - ${form.cpf_funcionario} - ${form.data_trans}" apagado!`));
            res.redirect('/transportes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o transporte "${form.cnpj_transporte} - ${form.cpf_funcionario} - ${form.data_trans}" ! || ${e.routine}`));
            console.log(e)
            return res.redirect('/transportes')
        })
})

module.exports = router