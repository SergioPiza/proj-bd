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
validator.customMessages({
    id: 'CPF inválido'
});

const validatorFormCont = {
    id: 'required',
    cpf_mkt: 'required|digits:14',
    cnpj_cliente: 'required|digits:18',
    data_contra: 'required|date',
}

// ----- CONSULTAS -----
router.get('/', async (req, res) => {
    let cont = []
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

    // await bd.query({
    //         //rowMode: 'array',
    //         text: 'SELECT * FROM CONTRATO'
    //     })
    //     .then(res => cont = (res.rows))
    //     .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    // if (cont.length === 0) {
    //     msg.error.content.push('A consulta não retornou nenhum resultado :(')
    //     err = true
    // }

    res.render('consultas/consultas', {
        title: 'Consultas Personalizadas',
        contratos: cont,
        msg: msg,
        err: err
    })
})

router.post('/:id_consulta', async (req, res) => {
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
    let err = false
    let form = req.body
    let id_consulta = parseInt(req.params.id_consulta)
    let query = ''
    let result = []
    let params = []

    switch (id_consulta) {
        case 1:
            query = `select count(*) from utilizacao u 
                        where u.CPF_AUDIOVISU='111.111.111-77' 
                            AND extract('MONTH' from u.DATA_UTI)='06'`
            params = []

        case 2:
            query = `SELECT F.NOME 
                        FROM FUNCIONARIO F 
                            JOIN FULLTIME FU 
                                ON FU.FUNCAO=UPPER($1) AND F.CPF = FU.CPF_FUNC`
            params = [form.funcao]
            break

        case 3:
            query = `SELECT EMP.NOME, R.NOME_ROTEIRO, R.DESCRICAO 
                        FROM EMP_CLIENTE EMP JOIN CONTRATO C  ON C.TEMA=UPPER($1) AND EMP.CNPJ_CLI = C.CNPJ_CLIENTE 
                            JOIN ROTEIRO R 
                                ON C.ID = R.ID_CONTRATO`
            params = [form.tema]
            break

        case 4:
            query = `SELECT QTD_ROTATIVOS FROM ROTEIRO
                        WHERE NOME_ROTEIRO=UPPER($1) AND ID_CONTRATO=$2`
            params = [form.nome_roteiro, form.id_contrato]
            break

        case 5:
            query = `SELECT DATA_LANCA, DATA_GRAVA FROM VIDEO
                        WHERE NOME_ROT=UPPER($1)`
            params = [form.nome_rot]
            break

        case 6:
            query = `SELECT SUM(F.SALARIO) FROM FUNCIONARIO F
                        JOIN FULLTIME FU
                            ON F.CPF = FU.CPF_FUNC`
            params = []
            break

        case 7:
            query = `SELECT F.NOME, V.NOME_ROT
                        FROM ROTATIVO R
                            LEFT JOIN FUNCIONARIO F
                                ON R.CPF_ROTATIVO = F.CPF
                            JOIN PARTICIPA P 
                                ON P.CPF_ROTA = F.CPF
                            JOIN VIDEO V
                                ON P.NOME_ARQ = V.NOME_ARQUIVO`
            params = []
            break

        default:
            query = form.query
            break
    }

    await bd.query(query, params)

        .then(r => {
            console.log(r.rows)

            if (r.rows.length < 1) {
                req.flash(sendMsg.warning, sendMsg.newMsg(`A consulta não retornou nenhum resultado!`))
                return res.redirect('/consultas')
            } else {

                res.render('consultas/consultas', {
                    title: 'Consultas',
                    consultas: r.rows,
                    msg: msg,
                    err: err
                })
            }
        })
        .catch(e => {
            req.flash(sendMsg.error, sendMsg.newMsg(`Não foi possível fazer a consulta :( || ${e.routine}`));
            console.log(e)
            return res.redirect('/consultas')
        })


    // await bd.query({
    //         //rowMode: 'array',
    //         text: text
    //     })
    //     .then(res => result = (res.rows))
    //     .catch(e => msg.error.content.push('Näo foi possível completar a query :('))

    // res.render('consultas/consultas', {
    //     title: 'Consultas',
    //     consultas: result,
    //     msg: msg,
    //     err: err
    // })
})

// ----- CONSULTA 2 -----
router.get('/:id_consulta', async (req, res) => {
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

    let id_consulta = parseInt(req.params.id_consulta)


    res.render('consultas/' + id_consulta, {
        title: 'Consulta',
        msg: msg
    })
})


module.exports = router