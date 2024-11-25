# Fluxo 2: Nós e Processos

## Introdução

Esta seção detalha os principais nós e processos envolvidos no **Fluxo 2**, explicando suas funções e como contribuem para a preparação dos payloads de criação e fechamento para integração com o SAP.

## Etapa 1: Decisão Baseada no Estado da OS

### Descrição

- **Componente Principal**: **Switch Node**
  - **Função**: Avalia o estado final da OS (`msg.orderWebHook.estado_final`) para decidir o caminho do fluxo.

### Funcionamento

- **Se o estado é "Aberta"**:
  - O fluxo segue para a preparação do payload de criação.
- **Se o estado é "Fechada"**:
  - O fluxo segue para a preparação do payload de fechamento.

## Etapa 2: Preparação do Payload para Criação

### Componentes Principais

- **Function Node: payload_SAP_Criar**
  - **Função**: Monta o payload com os dados necessários para criar uma nova ordem no SAP.
  - **Necessidades**:
    - Dados da OS obtidos do Arkmeds.
    - Informações padrão necessárias pelo SAP.
  - **Transformações**:
    - Ajuste de campos conforme os requisitos do SAP.
    - Adição de valores padrão onde necessário.

### Funcionamento

- **Processo Correto**:
  - Extrai os dados relevantes da OS.
  - Mapeia e transforma os campos conforme exigido pelo SAP.
  - Prepara o payload para ser enviado ao SAP.

## Etapa 3: Preparação do Payload para Fechamento

### Componentes Principais

- **HTTP Request Node: get_User_1**
  - **Função**: Obtém informações do usuário responsável pela OS.
  - **Necessidades**:
    - ID do usuário (`msg.orderRequest.responsavel`).
    - Autenticação válida para acessar a API do Arkmeds.

- **Function Node: payload_SAP_Fechar**
  - **Função**: Monta o payload com os dados necessários para fechar a ordem no SAP.
  - **Necessidades**:
    - Dados da OS e informações adicionais obtidas.
    - Apontamentos de horas e detalhes dos usuários envolvidos.

### Funcionamento

- **Processo Correto**:
  - Obtém informações adicionais necessárias, como dados do usuário e apontamentos.
  - Realiza transformações e validações nos dados.
  - Prepara o payload completo para fechamento da OS no SAP.

## Etapa 4: Consulta de Apontamentos e Usuários

### Componentes Principais

- **Function Node: apontamentos**
  - **Função**: Gera a lista de apontamentos de horas e prepara para consultar informações dos usuários envolvidos.

- **HTTP Request Node: get_User_2**
  - **Função**: Obtém informações dos usuários relacionados aos apontamentos de horas.

### Funcionamento

- **Processo Iterativo**:
  - Para cada apontamento de horas, o fluxo:
    - Obtém o ID do usuário.
    - Faz uma requisição para obter os detalhes do usuário.
    - Atualiza o payload com as informações obtidas.
  - Repete o processo até que todos os apontamentos tenham sido processados.

## Etapa 5: Validação e Verificação do Preenchimento

### Componentes Principais

- **Function Node: verificarPreenchimento**
  - **Função**: Verifica se todos os campos obrigatórios foram preenchidos corretamente antes de enviar o payload ao SAP.
  - **Necessidades**:
    - Dados completos e transformados da OS e apontamentos.

### Funcionamento

- **Processo de Validação**:
  - Verifica a presença e validade de cada campo necessário.
  - Em caso de campos faltantes ou inválidos, registra uma mensagem de erro.
  - Decide se o fluxo pode prosseguir ou se deve encaminhar para tratamento de erros.

## Etapa 6: Encaminhamento e Tratamento de Erros

### Componentes Principais

- **Switch Node**
  - **Função**: Decide se o fluxo deve prosseguir para o envio ao SAP ou se deve tratar erros.
- **Link Nodes**
  - **Função**: Encaminham o fluxo para outros subfluxos, como o de tratamento de erros ou logging.

### Funcionamento

- **Se não há erros**:
  - O payload é encaminhado para o fluxo que realiza a integração com o SAP.
- **Se há erros**:
  - A mensagem é encaminhada para o fluxo de tratamento de erros, onde ações corretivas podem ser tomadas.

## Notas Adicionais

- **Autenticação**: As requisições HTTP para a API do Arkmeds devem incluir tokens de autenticação válidos. Certifique-se de manter esses tokens seguros e atualizados.
- **Iterações**: O fluxo lida com listas de apontamentos e usuários, utilizando estruturas de loop para processar múltiplos itens.
- **Dados Padrão**: Valores padrão são utilizados em alguns campos para garantir compatibilidade com o SAP.
