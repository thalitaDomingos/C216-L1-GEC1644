const restify = require('restify');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres', // Usuário do banco de dados
    host: process.env.POSTGRES_HOST || 'db', // Este é o nome do serviço do banco de dados no Docker Compose
    database: process.env.POSTGRES_DB || 'professores',
    password: process.env.POSTGRES_PASSWORD || 'password', // Senha do banco de dados
    port: process.env.POSTGRES_PORT || 5432,
  });

// iniciar o servidor
var server = restify.createServer({
    name: 'pratica-4',
});

// Iniciando o banco de dados
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS professores');
        await pool.query('CREATE TABLE IF NOT EXISTS professores (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, disciplina VARCHAR(255) NOT NULL, e_mail VARCHAR(255) NOT NULL)');
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o banco de dados, tentando novamente em 5 segundos:', error);
        setTimeout(initDatabase, 5000);
    }
}
// Middleware para permitir o parsing do corpo da requisição
server.use(restify.plugins.bodyParser());

// Endpoint para inserir um novo professor
server.post('/api/v1/professor/inserir', async (req, res, next) => {
    const { nome, disciplina, email } = req.body;

    try {
        const result = await pool.query(
          'INSERT INTO professores (nome, disciplina, e_mail) VALUES ($1, $2, $3) RETURNING *',
          [nome, disciplina, email]
        );
        res.send(201, result.rows[0]);
        console.log('Professor inserido com sucesso:', result.rows[0]);
      } catch (error) {
        console.error('Erro ao inserir professor:', error);
        res.send(500, { message: 'Erro ao inserir professor' });
      }
    return next();
});

// Endpoint para listar todos os professores
server.get('/api/v1/professor/listar', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT * FROM professores');
      res.send(result.rows);
      console.log('professores encontrados:', result.rows);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.send(500, { message: 'Erro ao listar professores' });
    }
    return next();
  });

// Endpoint para atualizar um professor existente
server.post('/api/v1/professor/atualizar', async (req, res, next) => {
    const { id, nome, disciplina, email } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE professores SET nome = $1, disciplina = $2, e_mail = $3 WHERE id = $4 RETURNING *',
        [nome, disciplina, email, id]
      );
      if (result.rowCount === 0) {
        res.send(404, { message: 'Professor não encontrado' });
      } else {
        res.send(200, result.rows[0]);
        console.log('Professor atualizado com sucesso:', result.rows[0]);
      }
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
      res.send(500, { message: 'Erro ao atualizar professor' });
    }
  
    return next();
  });

// Endpoint para excluir um professor pelo ID
server.post('/api/v1/professor/excluir', async (req, res, next) => {
    const { id } = req.body;
  
    try {
      const result = await pool.query('DELETE FROM professores WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        res.send(404, { message: 'Professor não encontrado' });
      } else {
        res.send(200, { message: 'Professor excluído com sucesso' });
        console.log('Professor excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
      res.send(500, { message: 'Erro ao excluir professor' });
    }
  
    return next();
});
// endpoint para resetar o banco de dados
server.del('/api/v1/database/reset', async (req, res, next) => {
    try {
      await pool.query('DROP TABLE IF EXISTS professores');
      await pool.query('CREATE TABLE professores (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, disciplina VARCHAR(255) NOT NULL, e_mail VARCHAR(255) NOT NULL)');
      res.send(200, { message: 'Banco de dados resetado com sucesso' });
      console.log('Banco de dados resetado com sucesso');
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      res.send(500, { message: 'Erro ao resetar o banco de dados' });
    }
  
    return next();
});
// iniciar o servidor
var port = process.env.PORT || 5000;
// configurando o CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});
server.listen(port, function() {
    console.log('Servidor iniciado', server.name, ' na url http://localhost:' + port);
    // Iniciando o banco de dados
    console.log('Iniciando o banco de dados');
    initDatabase();
});
