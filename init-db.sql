-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de imóveis
CREATE TABLE IF NOT EXISTS imoveis (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(9),
    tipo VARCHAR(50) NOT NULL, -- casa, apartamento, etc.
    quartos INTEGER,
    banheiros INTEGER,
    vagas_garagem INTEGER,
    area_m2 NUMERIC(10,2),
    valor_aluguel NUMERIC(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_proprietario INTEGER REFERENCES usuarios(id)
);

-- Tabela de fotos dos imóveis
CREATE TABLE IF NOT EXISTS fotos_imoveis (
    id SERIAL PRIMARY KEY,
    id_imovel INTEGER REFERENCES imoveis(id) ON DELETE CASCADE,
    url_imagem TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    capa BOOLEAN DEFAULT false
);

-- Tabela de agendamentos de visita
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    id_imovel INTEGER REFERENCES imoveis(id),
    id_cliente INTEGER REFERENCES usuarios(id),
    data_hora TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, confirmado, cancelado, realizado
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_imoveis_cidade ON imoveis(cidade);
CREATE INDEX idx_imoveis_valor ON imoveis(valor_aluguel);
CREATE INDEX idx_imoveis_disponivel ON imoveis(disponivel);

-- Usuário administrador padrão (senha: admin123 - deve ser alterada após o primeiro login)
INSERT INTO usuarios (nome, email, senha, ativo)
VALUES ('Administrador', 'admin@casanamao.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MH/qjop0QpQ1VgFiaDrnN9fGjXlQ4.S', true)
ON CONFLICT (email) DO NOTHING;
