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

const validatorFormServ = {
    cpf_actor: 'required|digits:14',
    cnpj_tecnico: 'required|digits:18',
    nome_servico: 'required'
}

// ----- SERVIÇOS -----
router.get('/', async (req, res) => {
    let serv = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM SERVICO'
    })
        .then(res => serv = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (serv.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('servicos/servicos', {
        title: 'Serviços',
        servicos: serv,
        msg: msg,
        err: err
    })
})

// ----- SERVIÇOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('servicos/servicos_add', {
        title: 'Adicionar Serviço',
        msg: msg,
        servico: req.flash('servBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormServ)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('servBackup', form)
        return res.redirect('/servicos/add')
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

    await bd.query(`INSERT INTO SERVICO (cnpj_tecnico, cpf_actor, nome_servico)
                    VALUES($1, $2, $3)`,
        [form.cnpj_tecnico, form.cpf_actor, form.nome_servico])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Serviço "${form.nome_arquivo} - ${form.nome_rot} - ${form.cpf_diretor} - ${form.id_contrato}" criado!`));
            res.redirect('/servicos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o serviço :( || ${e.routine}`));
            req.flash('servBackup', form)
            console.log(e)
            return res.redirect('/servicos/add')
        })
})

// ----- SERVIÇOS UPDATE -----
router.get('/update/:cnpj_tecnico/:cpf_actor/:nome_servico', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let serv = []
    let err = false

    await bd.query('SELECT * FROM SERVICO WHERE cnpj_tecnico=$1 AND cpf_actor=$2 AND nome_servico=$3', [req.params.cnpj_tecnico, req.params.cpf_actor, req.params.nome_servico])
        .then(res => serv = (res.rows))
        .catch(e => err = true)
    if (serv.length === 0) err = true
    else {
        serv = serv[0]
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o serviço solicitado :(`));
        return res.redirect('/servicos')
    }

    res.render('servicos/servicos_update', {
        title: 'Atualizar Serviço',
        servico: req.flash('servBackup') || serv,
        msg: msg
    })
})
router.post('/update/:cnpj_tecnico/:cpf_actor/:nome_servico', async (req, res) => {
    let form = req.body
    form.cnpj_tecnico = req.params.cnpj_tecnico
    form.cpf_actor = req.params.cpf_actor
    form.nome_servico = req.params.nome_servico

    req.flash(sendMsg.warning, sendMsg.newMsg(`Serviços não podem ser alterados no momento!`));
    res.redirect('/servicos')


    // let v = new validator(form, validatorFormServ)
    // let valid = await v.check();

    // if (!valid) {
    //     let msgs = []
    //     for (k in v.errors) {
    //         msgs.push(v.errors[k].message)
    //     }
    //     req.flash(sendMsg.error, sendMsg.newMsg(msgs));
    //     req.flash('servBackup', form)
    //     return res.redirect('/servicos/update/' + req.params.cnpj_tecnico + '/' + req.params.cpf_actor + '/' + req.params.nome_servico)
    // }

    // await bd.query(`UPDATE SERVICO 
    //                 SET -------
    //                 WHERE cnpj_tecnico=$1 AND cpf_actor=$2 AND nome_servico=$3`,
    //     [req.params.cnpj_tecnico, req.params.cpf_actor, req.params.nome_servico])
    //     .then(r => {
    //         req.flash(sendMsg.success, sendMsg.newMsg(`Serviço "${form.cnpj_tecnico} - ${form.cpf_actor} - ${form.nome_servico}" alterado!`));
    //         res.redirect('/servicos')
    //     })
    //     .catch(e => {
    //         req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o serviço :( || ${e.routine}`));
    //         req.flash('servBackup', form)
    //         console.log(e)
    //         return res.redirect('/servicos/update/' + req.params.cnpj_tecnico + '/' + req.params.cpf_actor + '/' + req.params.nome_servico)
    //     })
})

// ----- SERVIÇOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM SERVICO 
                    WHERE cnpj_tecnico=$1 AND cpf_actor=$2 AND nome_servico=$3`, [form.cnpj_tecnico, form.cpf_actor, form.nome_servico])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Serviço "${form.cnpj_tecnico} - ${form.cpf_actor} - ${form.nome_servico}" apagado!`));
            res.redirect('/servicos')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o serviço "${form.cnpj_tecnico} - ${form.cpf_actor} - ${form.nome_servico}" ! || ${e.routine}`));
            console.log(e)
            return res.redirect('/servicos')
        })
})

module.exports = router