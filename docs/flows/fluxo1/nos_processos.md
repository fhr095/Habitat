# Fluxo 1: Nós e Processos

## Introdução

Esta seção detalha as etapas e grupos de nós envolvidos no **Fluxo 1**, explicando suas funções e como contribuem para o fluxo geral. O objetivo é fornecer uma compreensão clara de como o fluxo opera, destacando os pontos chave e o que é necessário para que cada etapa funcione corretamente.

## Etapa 1: Recepção de Notificações

### Descrição

O fluxo inicia ao receber notificações de eventos relacionados às OS no Arkmeds. Essas notificações podem ser recebidas de duas formas:

- **WebSocket**: Para comunicações em tempo real.
- **Webhook**: Para receber chamadas HTTP quando eventos específicos ocorrem.

### Componentes Principais

- **Recepção via WebSocket**:
  - **Função**: Conectar ao Arkmeds para receber notificações em tempo real.
  - **Necessidades**:
    - **Endereço do WebSocket**: Fornecido pelo Arkmeds.
    - **Configurações de Autenticação**: Se necessário.
- **Recepção via Webhook**:
  - **Função**: Receber notificações HTTP POST enviadas pelo Arkmeds.
  - **Necessidades**:
    - **Endpoint HTTP**: Configurado para receber as chamadas.
    - **Segurança**: Verificar assinaturas ou tokens para garantir a autenticidade.

### Funcionamento

- **Processo Correto**:
  - O Arkmeds envia uma notificação quando uma OS é criada ou atualizada.
  - O fluxo captura essa notificação e extrai as informações básicas da OS (por exemplo, ID da OS).
- **Considerações**:
  - Garantir que a conexão WebSocket esteja estável.
  - O endpoint HTTP deve estar acessível e seguro.

## Etapa 2: Processamento Inicial dos Dados

### Descrição

Após receber a notificação, os dados brutos podem precisar de ajustes iniciais antes de serem utilizados.

### Componentes Principais

- **Pré-processamento dos Dados**:
  - **Função**: Ajustar formatos, corrigir nomes de campos, e preparar os dados para a próxima etapa.
  - **Necessidades**:
    - **Conversão de Formatos**: Por exemplo, converter strings JSON em objetos.
    - **Correção de Nomes de Campos**: Renomear campos que possam causar conflitos (e.g., substituir "os.observacoes" por "os_observacoes").

### Funcionamento

- **Processo Correto**:
  - Os dados são convertidos para um formato adequado (por exemplo, de string para objeto JSON).
  - Campos problemáticos são ajustados para evitar erros futuros.
- **Considerações**:
  - Verificar a integridade dos dados recebidos.
  - Manter um registro das transformações aplicadas.

## Etapa 3: Obtenção de Detalhes da OS

### Descrição

A notificação inicial pode não conter todas as informações necessárias. Portanto, é feita uma consulta à API do Arkmeds para obter detalhes completos da OS.

### Componentes Principais

- **Requisição HTTP à API do Arkmeds**:
  - **Função**: Obter informações detalhadas da OS usando seu ID.
  - **Necessidades**:
    - **Endpoint da API**: URL para acessar os detalhes da OS.
    - **Autenticação**: Token ou credenciais necessárias para acessar a API.

### Funcionamento

- **Processo Correto**:
  - Usando o ID da OS, uma requisição GET é feita à API do Arkmeds.
  - A resposta contém todos os detalhes necessários sobre a OS.
- **Considerações**:
  - Garantir que o token de autenticação esteja válido.
  - Tratar possíveis erros na resposta da API (e.g., OS não encontrada).

## Etapa 4: Transformações e Validações dos Dados

### Descrição

Os dados obtidos precisam ser transformados e validados para atender aos requisitos do SAP.

### Componentes Principais

- **Transformações de Dados**:
  - **Função**: Ajustar formatos de datas, mapear valores, e preparar os dados para o SAP.
  - **Exemplos**:
    - **Formatação de Datas**: Separar data e hora, converter formatos.
    - **Mapeamento de Tipos de Serviço e Prioridades**: Converter descrições textuais em códigos numéricos.
- **Validações de Dados**:
  - **Função**: Garantir que todos os campos necessários estejam presentes e válidos.
  - **Necessidades**:
    - **Verificação de Campos Obrigatórios**: Como número da OS, tipo de serviço, prioridade.
    - **Validação de Formatos**: Datas, números, textos.

### Funcionamento

- **Processo Correto**:
  - Aplicar as transformações conforme as regras de negócio.
  - Validar que os dados estão completos e corretos.
- **Considerações**:
  - Tratar casos em que dados obrigatórios estejam faltando.
  - Manter consistência nos códigos mapeados.

## Etapa 5: Encaminhamento dos Dados Processados

### Descrição

Após o processamento, os dados estão prontos para serem enviados aos fluxos subsequentes ou, em caso de erros, para tratamento adequado.

### Componentes Principais

- **Roteamento Condicional**:
  - **Função**: Decidir o próximo passo com base nas validações.
  - **Necessidades**:
    - **Condições Definidas**: Se há erros, encaminhar para tratamento; se não, prosseguir.
- **Encaminhamento para Fluxos Subsequentes**:
  - **Função**: Enviar os dados para integração com o SAP.
- **Encaminhamento para Tratamento de Erros**:
  - **Função**: Tratar erros identificados durante o processamento.

### Funcionamento

- **Processo Correto**:
  - Se os dados estão válidos, encaminhar para o fluxo de integração.
  - Se há erros, registrar e encaminhar para o fluxo de tratamento de erros.
- **Considerações**:
  - Implementar logs para monitorar o fluxo.
  - Notificar equipes responsáveis em caso de erros críticos.

## Exemplo de Processo Correto com Dados de Entrada Manual

Para ilustrar como o fluxo opera corretamente, considere o seguinte exemplo:

1. **Recepção de Notificação**:
   - Recebemos uma notificação indicando que a OS com ID `1234` foi criada.

2. **Processamento Inicial**:
   - Ajustamos o campo `"os.observacoes"` para `"os_observacoes"`.

3. **Consulta de Detalhes da OS**:
   - Fazemos uma requisição à API do Arkmeds para obter os detalhes da OS `1234`.

4. **Transformações e Validações**:
   - **Formatação de Datas**:
     - `data_criacao`: "25/10/2023 14:30:00" → separada em `data_criacao`: "25/10/2023" e `hora_criacao`: "14:30:00".
   - **Mapeamento de Tipo de Serviço**:
     - "Manutenção Corretiva" → código "210".
   - **Validação**:
     - Verificamos que o número da OS está presente.

5. **Encaminhamento**:
   - Como todas as validações passaram, encaminhamos os dados para o fluxo que integra com o SAP.

## Necessidades para o Funcionamento Correto

- **Credenciais Atualizadas**: Tokens e chaves de acesso devem estar atualizados.
- **Conectividade**: Acesso estável à API do Arkmeds e ao SAP.
- **Configurações Corretas**: Endpoints e parâmetros de requisições devem estar corretos.
- **Regras de Negócio Definidas**: Transformações e mapeamentos devem seguir as regras estabelecidas.

