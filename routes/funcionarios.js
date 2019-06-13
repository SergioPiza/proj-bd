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
validator.customMessages({
    cpf: 'cpf inválido'
});

const validatorFormFunc = {
    nome: 'required|minLength:5',
    cpf: 'required|digits:14',
    //vinculo: '',
    //tel,
    email: 'required|email',
    //endereco ,
    data_nasc: 'date',
    salario: 'decimal',
}

// ----- FUNCIONARIOS -----
router.get('/', async (req, res) => {
    let func = []
    let err = false

    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    await bd.query({
        //rowMode: 'array',
        text: 'SELECT * FROM funcionario'
    })
        .then(res => func = (res.rows))
        .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    if (func.length === 0) {
        msg.error.content.push('A consulta não retornou nenhum resultado :(')
        err = true
    }

    res.render('funcionarios/funcionarios', {
        title: 'Funcionários',
        funcionarios: func,
        msg: msg,
        err: err
    })
})

// ----- FUNCIONARIOS ADD -----
router.get('/add', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    res.render('funcionarios/funcionarios_add', {
        title: 'Adicionar Funcionário',
        msg: msg,
        funcionario: req.flash('funcBackup') || {}
    })
})
router.post('/add', async (req, res) => {
    let form = req.body

    let v = new validator(form, validatorFormFunc)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs))
        req.flash('funcBackup', form)
        return res.redirect('/funcionarios/add')
    }

    await bd.query(`INSERT INTO funcionario (cpf, nome, email, telefone, endereco, vinculo, data_nasc, salario)
                    VALUES($1, $2, $3, $4, $5, $6, TO_DATE($7, 'YYYY-MM-DD'), $8)`, [form.cpf, form.nome, form.email, form.telefone, form.endereco, form.vinculo, form.data_nasc, form.salario])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Funcionário "${form.cpf}" criado!`));
            res.redirect('/funcionarios')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível inserir o funcionário :( || ${e.routine}`));
            req.flash('funcBackup', form)
            console.log(e)
            return res.redirect('/funcionarios/add')
        })
})

// ----- FUNCIONARIOS UPDATE -----
router.get('/update/:cpf', async (req, res) => {
    let msg = {
        error: req.flash(sendMsg.error) || { content: [] },
        success: req.flash(sendMsg.success) || { content: [] },
        warning: req.flash(sendMsg.warning) || { content: [] }
    }

    let func = []
    let err = false

    await bd.query('SELECT * FROM funcionario WHERE cpf=$1', [req.params.cpf])
        .then(res => func = (res.rows))
        .catch(e => err = true)
    if (func.length === 0) err = true
    else {
        func = func[0]
        try {
            func.data_nasc = new Date(func.data_nasc)
        } catch (e) {
            func.data_nasc = new Date()
        }
        func.data_nasc = func.data_nasc.toISOString().substring(0, 10)
    }

    if (err) {
        req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível encontrar o funcionário "${req.params.cpf}" solicitado :(`));
        return res.redirect('/funcionarios')
    }

    res.render('funcionarios/funcionarios_update', {
        title: 'Atualizar Funcionário',
        funcionario: req.flash('funcBackup') || func,
        msg: msg
    })
})
router.post('/update/:cpf', async (req, res) => {
    let form = req.body
    form.cpf = req.params.cpf

    let v = new validator(form, validatorFormFunc)
    let valid = await v.check();

    if (!valid) {
        let msgs = []
        for (k in v.errors) {
            msgs.push(v.errors[k].message)
        }
        req.flash(sendMsg.error, sendMsg.newMsg(msgs));
        req.flash('funcBackup', form)
        return res.redirect('/funcionarios/update/' + req.params.cpf)
    }

    await bd.query(`UPDATE funcionario 
                    SET nome=$1, email=$2, telefone=$3, endereco=$4, vinculo=$5, data_nasc=TO_DATE($6, 'YYYY-MM-DD'), salario=$7
                    WHERE cpf=$8`, [form.nome, form.email, form.telefone, form.endereco, form.vinculo, form.data_nasc, form.salario, req.params.cpf])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Funcionário "${req.params.cpf}" alterado!`));
            res.redirect('/funcionarios')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível alterar o funcionário :( || ${e.routine}`));
            req.flash('funcBackup', form)
            console.log(e)
            return res.redirect('/funcionarios/update/' + req.params.cpf)
        })
})

// ----- FUNCIONARIOS DELETE -----
router.post('/delete', async (req, res) => {
    let form = req.body
    await bd.query(`DELETE FROM funcionario 
                    WHERE cpf=$1`, [form.cpf])
        .then(r => {
            req.flash(sendMsg.success, sendMsg.newMsg(`Funcionário "${form.cpf}" apagado!`));
            res.redirect('/funcionarios')
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível apagar o funcionário "${form.cpf}"! || ${e.routine}`));
            console.log(e)
            return res.redirect('/funcionarios')
        })
})

module.exports = router