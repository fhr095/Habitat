# Descrição dos Nós

Esta seção detalha os principais nós utilizados nos fluxos do Node-RED, explicando suas funções e configurações essenciais.

## Nós de Entrada

### WebSocket In

- **Função**: Recebe mensagens em tempo real do Arkmeds sobre eventos de OS.
- **Configurações**:
  - URL do servidor WebSocket do Arkmeds.
  - Protocolos e autenticação (se aplicável).
  - Mecanismos de reconexão.

### HTTP In

- **Função**: Expor endpoints REST para receber chamadas do Arkmeds ou outros sistemas.
- **Configurações**:
  - Rotas definidas para os endpoints necessários.
  - Métodos HTTP suportados (GET, POST, etc.).

## Nós de Processamento

### Function Nodes

- **Função**: Executar código JavaScript personalizado para processar e transformar dados.
- **Utilização**:
  - Sanitização de dados.
  - Aplicação de regras de negócio.
  - Formatação de payloads.
- **Considerações**:
  - Manter o código limpo e comentado para facilitar a manutenção.

### Switch Nodes

- **Função**: Roteamento condicional de mensagens baseado em atributos.
- **Utilização**:
  - Decidir o fluxo de mensagens com base em campos específicos.
- **Configurações**:
  - Condições claramente definidas para cada saída.

## Nós de Saída

### HTTP Request

- **Função**: Realizar chamadas HTTP a APIs externas, como a do SAP.
- **Configurações**:
  - URLs dos endpoints do SAP.
  - Métodos HTTP e cabeçalhos necessários.
  - Autenticação e tokens de acesso.
  - Tratamento de respostas e erros.

### WebSocket Out

- **Função**: Enviar mensagens de volta ao Arkmeds ou outros sistemas via WebSocket.
- **Configurações**:
  - URL do servidor de destino.
  - Gerenciamento de conexões.

*Nota: Inclua detalhes adicionais sobre nós específicos utilizados nos fluxos, incluindo quaisquer configurações personalizadas ou críticas para o funcionamento correto do sistema.*

