const restify = require('restify');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres', // Usuário do banco de dados
    host: process.env.POSTGRES_HOST || 'db', // Este é o nome do serviço do banco de dados no Docker Compose
    database: process.env.POSTGRES_DB || 'times',
    password: process.env.POSTGRES_PASSWORD || 'password', // Senha do banco de dados
    port: process.env.POSTGRES_PORT || 5432,
  });

// iniciar o servidor
var server = restify.createServer({
    name: 'projeto-c216',
});

// Iniciando o banco de dados
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS times');
        await pool.query('CREATE TABLE IF NOT EXISTS times (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, jogador1 VARCHAR(255) NOT NULL, jogador2 VARCHAR(255) NOT NULL, jogador3 VARCHAR(255) NOT NULL, jogador4 VARCHAR(255) NOT NULL, jogador5 VARCHAR(255) NOT NULL)');
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o banco de dados, tentando novamente em 5 segundos:', error);
        setTimeout(initDatabase, 5000);
    }
}
// Middleware para permitir o parsing do corpo da requisição
server.use(restify.plugins.bodyParser());

// Endpoint para inserir um novo time
server.post('/api/v1/time/inserir', async (req, res, next) => {
    const { nome, jogador1, jogador2, jogador3, jogador4, jogador5 } = req.body;

    try {
        const result = await pool.query(
          'INSERT INTO times (nome, jogador1, jogador2, jogador3, jogador4, jogador5) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [nome, jogador1, jogador2, jogador3, jogador4, jogador5]
        );
        res.send(201, result.rows[0]);
        console.log('Time inserido com sucesso:', result.rows[0]);
      } catch (error) {
        console.error('Erro ao inserir time:', error);
        res.send(500, { message: 'Erro ao inserir time' });
      }
    return next();
});

// Endpoint para listar todos os times
server.get('/api/v1/time/listar', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT * FROM times');
      res.send(result.rows);
      console.log('Times encontrados:', result.rows);
    } catch (error) {
      console.error('Erro ao listar os times:', error);
      res.send(500, { message: 'Erro ao listar os times' });
    }
    return next();
  });

// Endpoint para atualizar um time existente
server.post('/api/v1/time/atualizar', async (req, res, next) => {
    const { id, nome, jogador1, jogador2, jogador3, jogador4, jogador5 } = req.body;
  
    try {
      const result = await pool.query(
        'UPDATE times SET nome = $1, jogador1 = $2, jogador2 = $3, jogador3 = $4, jogador4 = $5, jogador5 = $6 WHERE id = $7 RETURNING *',
        [nome, jogador1, jogador2, jogador3, jogador4, jogador5, id]
      );
      if (result.rowCount === 0) {
        res.send(404, { message: 'Time não encontrado' });
      } else {
        res.send(200, result.rows[0]);
        console.log('Time atualizado com sucesso:', result.rows[0]);
      }
    } catch (error) {
      console.error('Erro ao atualizar um time:', error);
      res.send(500, { message: 'Erro ao atualizar um time' });
    }
  
    return next();
  });

// Endpoint para excluir um time pelo ID
server.post('/api/v1/time/excluir', async (req, res, next) => {
    const { id } = req.body;
  
    try {
      const result = await pool.query('DELETE FROM times WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        res.send(404, { message: 'Time não encontrado' });
      } else {
        res.send(200, { message: 'Time foi excluído com sucesso' });
        console.log('Time foi excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir o time:', error);
      res.send(500, { message: 'Erro ao excluir o time' });
    }
  
    return next();
});

// endpoint para resetar o banco de dados
server.del('/api/v1/database/reset', async (req, res, next) => {
    try {
      await pool.query('DROP TABLE IF EXISTS times');
      await pool.query('CREATE TABLE times (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, jogador1 VARCHAR(255) NOT NULL, jogador2 VARCHAR(255) NOT NULL, jogador3 VARCHAR(255) NOT NULL, jogador4 VARCHAR(255) NOT NULL, jogador5 VARCHAR(255) NOT NULL)');
      res.send(200, { message: 'Banco de dados resetado com sucesso' });
      console.log('Banco de dados resetado com sucesso');
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      res.send(500, { message: 'Erro ao resetar o banco de dados' });
    }
  
    return next();
});

// Função para embaralhar a ordem das equipes
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Função para gerar todas as combinações de partidas entre os times
function generateMatches(teams) {
  const shuffledTeams = shuffleArray([...teams]); // Embaralhar as equipes
  const matches = [];

  for (let i = 0; i < shuffledTeams.length; i++) {
      for (let j = i + 1; j < shuffledTeams.length; j++) {
          matches.push([shuffledTeams[i], shuffledTeams[j]]);
      }
  }

  return matches;
}

// Endpoint para sortear todas as combinações de partidas entre os times
server.post('/api/v1/time/partida', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM times');
    const teams = result.rows;

    console.log('Times obtidos do banco de dados:', teams);

    if (teams.length < 2) {
      res.send(400, { message: 'Número insuficiente de times para sortear partidas' });
      return next();
    }

    const matches = generateMatches(teams);
    console.log('Todas as partidas geradas:', matches);
    res.send(200, { matches });
  } catch (error) {
    console.error('Erro ao gerar partidas:', error);
    res.send(500, { message: 'Erro ao gerar partidas' });
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
