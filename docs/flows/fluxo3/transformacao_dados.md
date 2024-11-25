# Fluxo 3: Nós e Processos

## Introdução

Esta seção detalha os principais nós e processos envolvidos no **Fluxo 3**, explicando suas funções e como contribuem para a consulta de apontamentos e verificação do preenchimento dos dados antes da integração com o SAP.

## Etapa 1: Obtenção dos Apontamentos de Horas

### Componentes Principais

- **Function Node: apontamentos**
  - **Função**: Processa os apontamentos de horas registrados na OS e prepara para consulta de informações adicionais.

- **Loop de Processamento**:
  - **Função**: Itera sobre cada apontamento registrado para processar individualmente.

### Funcionamento

- **Processo Correto**:
  - Extrai a lista de apontamentos da OS.
  - Prepara uma estrutura de controle (`msg.apontamentos`) para gerenciar a iteração sobre os apontamentos.
- **Considerações**:
  - Garantir que todos os apontamentos sejam processados.
  - Manter o controle adequado dos índices durante a iteração.

## Etapa 2: Consulta de Informações dos Usuários

### Componentes Principais

- **HTTP Request Node: get_User_2**
  - **Função**: Obtém informações detalhadas dos usuários relacionados aos apontamentos.
  - **Necessidades**:
    - IDs dos usuários extraídos dos apontamentos.
    - Autenticação válida para acessar a API do Arkmeds.

### Funcionamento

- **Processo Correto**:
  - Para cada apontamento, faz uma requisição à API para obter informações do usuário.
  - Atualiza os dados do apontamento com as informações obtidas, como número pessoal (RE) e centro de trabalho.
- **Considerações**:
  - Tratar possíveis falhas na requisição, como usuários não encontrados.
  - Garantir que as informações sejam corretamente associadas aos apontamentos correspondentes.

## Etapa 3: Verificação do Preenchimento dos Campos

### Componentes Principais

- **Function Node: verificarPreenchimento**
  - **Função**: Verifica se todos os campos obrigatórios estão preenchidos nos apontamentos e na OS.
  - **Necessidades**:
    - Dados completos dos apontamentos e da OS.
- **Switch Node**
  - **Função**: Decide o fluxo com base na presença de erros.

### Funcionamento

- **Processo Correto**:
  - Analisa cada campo obrigatório nos dados.
  - Identifica campos faltantes ou inválidos e registra mensagens de erro detalhadas.
- **Considerações**:
  - Assegurar que todos os campos críticos para o SAP sejam verificados.
  - Manter as mensagens de erro claras para facilitar a correção.

## Etapa 4: Encaminhamento dos Dados ou Tratamento de Erros

### Componentes Principais

- **Link Nodes**
  - **Função**: Encaminham a mensagem para o fluxo de integração ou para o tratamento de erros.

### Funcionamento

- **Se não há erros**:
  - O fluxo prossegue para a integração com o SAP.
- **Se há erros**:
  - A mensagem é encaminhada para o fluxo de tratamento de erros para as ações apropriadas.

## Notas Adicionais

- **Gerenciamento de Estados**:
  - O fluxo utiliza variáveis de estado (`msg.apontamentos`) para controlar o processo iterativo.
- **Autenticação**:
  - Requisições à API do Arkmeds requerem autenticação válida.
- **Logs e Monitoramento**:
  - É importante registrar logs das operações para facilitar o monitoramento e a depuração.
