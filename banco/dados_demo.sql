-- Dados de demonstração para o trabalho final (rode depois do dump.sql e de subir a API uma vez,
-- para o Hibernate criar as tabelas novas). Pode rodar mais de uma vez sem duplicar.
USE pw4;
SET NAMES utf8mb4;

INSERT INTO bairros (nome, cidade, estado, cep_inicial, cep_final)
SELECT * FROM (SELECT 'Medianeira' n, 'Panambi' c, 'RS' e, '98280-000' i, '98289-999' f UNION ALL
               SELECT 'Arco-Íris', 'Panambi', 'RS', '98280-000', '98289-999' UNION ALL
               SELECT 'Zona Norte', 'Panambi', 'RS', '98280-000', '98289-999' UNION ALL
               SELECT 'Planalto', 'Panambi', 'RS', '98280-000', '98289-999') novos
WHERE NOT EXISTS (SELECT 1 FROM bairros b WHERE b.nome = novos.n);

INSERT INTO tipos_imoveis (nome, descricao)
SELECT * FROM (SELECT 'Casa' n, 'Residência térrea ou sobrado com terreno próprio' d UNION ALL
               SELECT 'Sala comercial', 'Espaço para escritório ou consultório' UNION ALL
               SELECT 'Terreno', 'Lote sem construção' UNION ALL
               SELECT 'Kitnet', 'Unidade compacta, ideal para estudantes') novos
WHERE NOT EXISTS (SELECT 1 FROM tipos_imoveis t WHERE t.nome = novos.n);

-- Segundo cliente (mesma senha do cliente.jwt: Senha@123), para testar ofertas concorrentes
INSERT INTO usuarios (nome, email, senha, tipo)
SELECT 'Cliente Dois', 'cliente2.jwt@teste.com', senha, 'CLIENTE' FROM usuarios
WHERE email = 'cliente.jwt@teste.com'
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'cliente2.jwt@teste.com');

-- Imóveis variados (bairro, tipo, finalidade e preço) para filtros e ordenação
INSERT INTO imoveis (titulo, descricao, preco_venda, preco_aluguel, finalidade, status, dormitorios, banheiros, garagem,
                     area_total, area_construida, endereco, numero, cep, caracteristicas, destaque,
                     tipo_imovel_id, bairro_id, usuario_id)
SELECT d.titulo, d.descricao, d.pv, d.pa, d.fin, 'DISPONIVEL', d.dorm, d.ban, d.gar, d.at, d.ac, d.ender, d.num, d.cep, d.carac, d.dest,
       (SELECT MIN(id) FROM tipos_imoveis WHERE nome = d.tipo),
       (SELECT MIN(id) FROM bairros WHERE nome = d.bairro),
       (SELECT id FROM usuarios WHERE email = 'admin.jwt@teste.com')
FROM (
  SELECT 'Sobrado moderno na Medianeira' titulo, 'Sobrado com acabamento de alto padrão, sala ampla e espaço gourmet.' descricao,
         1250000.00 pv, NULL pa, 'VENDA' fin, 4 dorm, 3 ban, 2 gar, 320.00 at, 260.00 ac, 'Rua das Palmeiras' ender, '1500' num, '98280-000' cep,
         'Espaço gourmet, Lareira, Jardim' carac, b'1' dest, 'Casa' tipo, 'Medianeira' bairro UNION ALL
  SELECT 'Apartamento mobiliado na Medianeira', 'Apartamento mobiliado, pronto para morar, perto do comércio.',
         NULL, 3800.00, 'ALUGUEL', 2, 2, 1, 85.00, 85.00, 'Av. Brasil', '1200', '98280-000', 'Mobiliado, Academia, Portaria 24h', b'1', 'Apartamento', 'Medianeira' UNION ALL
  SELECT 'Kitnet perto da universidade', 'Kitnet compacta e bem iluminada, ideal para estudantes.',
         NULL, 950.00, 'ALUGUEL', 1, 1, 0, 28.00, 28.00, 'Rua dos Estudantes', '300', '98280-000', 'Mobiliada, Internet inclusa', b'0', 'Kitnet', 'Arco-Íris' UNION ALL
  SELECT 'Casa com quintal no Arco-Íris', 'Casa térrea com quintal grande e churrasqueira.',
         680000.00, NULL, 'VENDA', 3, 2, 2, 360.00, 180.00, 'Rua dos Ipês', '820', '98280-000', 'Churrasqueira, Quintal, Edícula', b'0', 'Casa', 'Arco-Íris' UNION ALL
  SELECT 'Sala comercial no Centro', 'Sala comercial com recepção, em prédio com elevador.',
         NULL, 1800.00, 'ALUGUEL', 0, 1, 1, 45.00, 45.00, 'Rua XV de Novembro', '700', '98280-000', 'Elevador, Ar-condicionado', b'0', 'Sala comercial', 'Centro' UNION ALL
  SELECT 'Apartamento 3 quartos na Zona Norte', 'Apartamento com sacada e churrasqueira, condomínio com lazer.',
         520000.00, NULL, 'VENDA', 3, 2, 2, 98.00, 98.00, 'Av. Presidente Vargas', '3000', '98280-000', 'Sacada, Piscina, Salão de festas', b'1', 'Apartamento', 'Zona Norte' UNION ALL
  SELECT 'Casa para alugar na Zona Norte', 'Casa de dois quartos em rua tranquila.',
         NULL, 2200.00, 'ALUGUEL', 2, 1, 1, 200.00, 90.00, 'Rua das Acácias', '150', '98280-000', 'Quintal, Área de serviço', b'0', 'Casa', 'Zona Norte' UNION ALL
  SELECT 'Terreno no Planalto', 'Terreno plano, pronto para construir, em região tranquila.',
         390000.00, NULL, 'VENDA', 0, 0, 0, 480.00, 0.00, 'Rua Sete de Setembro', '5000', '98280-000', 'Plano, Esquina', b'0', 'Terreno', 'Planalto' UNION ALL
  SELECT 'Chácara urbana no Planalto', 'Casa ampla com pomar e área verde.',
         980000.00, NULL, 'VENDA', 4, 3, 4, 1500.00, 280.00, 'Rua dos Pinheiros', '90', '98280-000', 'Pomar, Piscina, Churrasqueira', b'1', 'Casa', 'Planalto' UNION ALL
  SELECT 'Apartamento compacto no Centro', 'Um quarto, ótimo para quem trabalha no centro.',
         NULL, 1400.00, 'ALUGUEL', 1, 1, 0, 40.00, 40.00, 'Rua Marechal Deodoro', '450', '98280-000', 'Próximo ao transporte público', b'0', 'Apartamento', 'Centro'
) d
WHERE NOT EXISTS (SELECT 1 FROM imoveis i WHERE i.titulo = d.titulo);
