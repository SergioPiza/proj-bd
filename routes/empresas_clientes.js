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
    nome: 'required|minLength:3',
    cnpj_cli: 'required|digits:18',
    //vinculo: '',
    //tel,
    email: 'required|email',
    //endereco ,
    data_nasc: 'date',
    salario: 'decimal',
}

// ----- EMPRESA CLIENTE -----
router.get('/', async (req, res) => {
    let emp = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM EMP_CLIENTE'
    })
        .then(res => emp = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (emp.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('empresas/empresas_clientes', {
        title: 'Empresas',
        empresas: emp,
        msg: msg,
        err: err
    })
})

// ----- EMPRESA CLIENTE ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('empresas_clientes_add', {
        title: 'Adicionar Empresa',
        msg: msg,
        empresa: req.flash('empBackup') || {}
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
        req.flash('empBackup', form)
        return res.redirect('/empresas/clientes/add')
    }

    await bd.query(`INSERT INTO EMP_CLIENTE (cnpj_cli, nome, interesse, telefone, email, endereco)
                    VALUES($1, $2, $3, $4, $5, $6)`, [form.cnpj_cli, form.nome, form.interesse, form.telefone, form.email, form.endereco])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Empresa "${form.cnpj_cli}" criada!`));
            res.redirect('/empresas/clientes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir a empresa :( || ${e.routine}`));
            req.flash('empBackup', form)
            console.log(e)
            return res.redirect('/empresas/clientes/add')
        })
})

// ----- EMPRESA CLIENTE UPDATE -----
router.get('/update/:cnpj_cli([^/]+/[^/]+)', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }
    console.log(req.params.cnpj_cli)

    let emp = []
    let err = false

    await bd.query('SELECT * FROM EMP_CLIENTE WHERE cnpj_cli=$1', [req.params.cnpj_cli])
        .then(res => {
            emp = (res.rows)
            console.log(emp)
        })
        .catch(e => err = true)
    if (emp.length === 0) err = true
    else emp = emp[0]

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar a empresa "${req.params.cnpj_cli}" solicitada :(`));
        return res.redirect('/empresas/clientes')
    }

    res.render('empresas/empresas_clientes_update', {
        title: 'Atualizar Empresa',
        empresa: req.flash('empBackup') || emp,
        msg: msg
    })
})
router.post('/update/:cnpj_cli([^/]+/[^/]+)', async (req, res) => {
    let form = req.body
    form.cnpj_cli = req.params.cnpj_cli
    console.log(form)

    let v = new validator(form, validatorFormEmp)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('empBackup', form)
        return res.redirect('/empresas/clientes/update/' + req.params.cnpj_cli)
    }

    await bd.query(`UPDATE EMP_CLIENTE 
                    SET nome=$2, interesse=$3, telefone=$4, email=$5, endereco=$6
                    WHERE cnpj_cli=$1`,
        [form.cnpj_cli, form.nome, form.interesse, form.telefone, form.email, form.endereco])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Empresa "${req.params.cnpj_cli}" alterada!`));
            res.redirect('/empresas/clientes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar a empresa :( || ${e.routine}`));
            req.flash('empBackup', form)
            console.log(e)
            return res.redirect('/empresas/clientes/update/' + req.params.cnpj_cli)
        })
})

// ----- EMPRESA CLIENTE DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM EMP_CLIENTE 
                    WHERE cnpj_cli=$1`, [form.cnpj_cli])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Empresa "${form.cnpj_cli}" apagada!`));
            res.redirect('/empresas/clientes')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar a empresa "${form.cnpj_cli}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/empresas/clientes')
        })
})

module.exports = router