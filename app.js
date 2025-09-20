//Importar o modulo express
const express = require('express');

//Importar módulo express-fileupload
const fileupload = require('express-fileupload');

//Importar módulo express-handlebars
const { engine } = require('express-handlebars');

//Importar módulo MySQL
const mysql = require('mysql2');

//Importar File Systems
const fs = require('fs');

//App 
const app = express();

//Abilitadno o upload dos arquivos
app.use(fileupload());

//Adicionar BootStrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

//Adcionar CSS do form
app.use('/styles', express.static('./styles'));

//Referenciar a página de imagens
app.use('/imagens', express.static('./imagens'));

//Configuração do express-handlebars
app.engine('handlebars', engine({
    helpers: {
        //Função auxiliar paravericifar igualdade
        condicionalIgualdade: function(parametro1, parametro2, options){
            return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

//Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//Configuração de conexão
const conexao = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'awds',
    database:'db_mysql_end_nodejs'
});

//Teste de conexão
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão efetuado com secesso!');
});



//Rota principal
app.get('/', function(req, res){
    //SQL
    let sql = 'SELECT * FROM produtos';

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno});
    });
});

//Rota principal contendo a situação
app.get('/:situacao', function(req, res){
    //SQL
    let sql = 'SELECT * FROM produtos';

    //Executar comando SQL
    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {produtos:retorno, situacao:req.params.situacao});
    });
});

//Rota de cadastro
app.post('/cadastrar', function(req, res){
    try{
        //Obter os dados que serão utilizados para o cadastro
        let nome = req.body.nome;
        let valor = req.body.valor;
        let imagem = req.files.imagem.name;

        //Validas o nome o produto e o valor
        if(nome == '' || valor == '' || isNaN(valor)){
            res.redirect('/falhaCadastro');
        }else{
            //SQL
            let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES ('${nome}', ${valor}, '${imagem}')`;

            //Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                //Caso ocorra algum erro
                if(erro) throw erro;

                //Case feito o cadastro
                req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
                console.log(retorno);
            });

            //Retornar para a rota principal
            res.redirect('/okCadastro'); 
        }
    }catch(erro){
        res.redirect('/falhaCadastro');
    }
});

//Rota de remoção
app.get('/remover/:codigo&:imagem', function(req, res){
    // Tratamento de exeção
    try{ 
        //SQL
        let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

        //Executar sql
        conexao.query(sql, function(erro, retorno){
            //Casso falhe o comando SQL
            if(erro) throw erro;

            //Caso funcione
            fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem)=> {
                console.log('Falha ao remover imagem!');
            })
        });

        //Redirecionamento
        res.redirect('/okRemover');
    }catch(erro){
        res.redirect('/falhaRemover');
    }
});

//Rota para redirecionar para o formulário de alteração
app.get('/formularioEditar/:codigo', function(req, res){

    //SQL
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    //Executar o comando SQL 
    conexao.query(sql, function(erro, retorno){
        //Caso haja falha no camando SQL
        if(erro) throw erro;

        //Caso consiga executar o comando SQL
        res.render('formularioEditar', {produto:retorno[0]});
    });
    
});


//Rota para editar produtos
app.post('/editar', function(req, res){

    //Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;

    //Validas o nome o produto e o valor
    if(nome == '' || valor == '' || isNaN(valor)){
        res.redirect('/falhaCadastro');
    }else{
        //Definir o tipo de edição
        try{
            //Objeto a imagem
            let imagem = req.files.imagem   ;

            //Comando SQL
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${imagem.name}' WHERE codigo=${codigo}`;

            //Executar comando SQL 
            conexao.query(sql, function(erro, retorno){

                //Caso falhe o mamando SQL
                if(erro) throw erro;

                //Remover imagem antiga
                fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem)=>{
                    console.log('Falha ao remover a imagem');
                });

                // Cadatrar nova imgem
                imagem.mv(__dirname+/imagens/+imagem.name);
            });

        }catch(erro){

            // Comando SQL
            let sql = `UPDATE produtos SET nome='${nome}', valor=${valor} WHERE codigo=${codigo}`;

            // Executar comando SQL
            conexao.query(sql, function(erro, retorno){
                // Caso não funcione o comando SQL
                if(erro) throw erro;
            });
        }

        //Redirecionamento
        res.redirect('/okEdicao')
    }


});

// Servidor
app.listen(6969);