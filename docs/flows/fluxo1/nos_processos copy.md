# Fluxo 1: Informação das Ordens de Serviço (OS)

## Nós e Processos

Este documento detalha cada nó utilizado no Fluxo 1, explicando suas funções e como contribuem para o processamento das Ordens de Serviço.

### Lista de Nós e Descrições

1. **Nó `webhookrelay` (Function Node)**
   - **ID**: `e7395d9dea27d55c`
   - **Função**: Processa o payload recebido pelo Webhook Relay.
   - **Descrição**:
     - Recebe os dados iniciais da OS enviados pelo Arkmeds.
     - Realiza a substituição de `"os.observacoes"` por `"os_observacoes"` no corpo da mensagem para evitar problemas com nomes de campos contendo pontos.
     - Define o tópico da mensagem como `'webhookrelay'`.

2. **Nó `json` (JSON Node)**
   - **ID**: `b5299a710758fbf8`
   - **Função**: Converte o payload de uma string JSON para um objeto JSON.
   - **Descrição**:
     - Garante que os dados estejam no formato JSON adequado para processamento nos próximos nós.

3. **Nó `orderWebHook` (Function Node)**
   - **ID**: `5035fe08c29ec737`
   - **Função**: Prepara os dados do webhook para obter os detalhes da OS.
   - **Descrição**:
     - Verifica se o campo `"os.observacoes"` existe e realiza a substituição necessária.
     - Armazena o payload no objeto `msg.orderWebHook`.
     - Define o tópico da mensagem como `'get_Order'`.

4. **Nó `get_Order` (HTTP Request Node)**
   - **ID**: `09a9bd674942e742`
   - **Função**: Realiza uma requisição HTTP GET à API do Arkmeds para obter detalhes da OS.
   - **Descrição**:
     - Utiliza o ID da OS (`msg.orderWebHook.id`) para construir a URL da requisição.
     - Inclui o token JWT de autenticação nos headers.
     - Recebe os dados completos da OS em `msg.payload`.

5. **Nó `orderRequest` (Function Node)**
   - **ID**: `1a49c2783d2d52e5`
   - **Função**: Processa os dados retornados pela API do Arkmeds.
   - **Descrição**:
     - Armazena os dados da OS em `msg.orderRequest`.
     - Verifica se o campo `numero` está presente e define uma mensagem de erro em `msg.payload.verificacao` se necessário.

6. **Nó `switch` (Switch Node)**
   - **ID**: `8733b31d4d49f1e3`
   - **Função**: Decide o fluxo com base na verificação do número da OS.
   - **Descrição**:
     - Se `msg.payload.verificacao` for nulo, direciona para o nó `orderWebHook Editado`.
     - Caso contrário, direciona para o tratamento de erro.

7. **Nó `orderWebHook Editado` (Function Node)**
   - **ID**: `1a9382724de651ed`
   - **Função**: Realiza transformações adicionais nos dados da OS.
   - **Descrição**:
     - Separa a data e hora de criação e conclusão da OS em campos distintos.
     - Converte os valores de `tipo_servico`, `prioridade` e `tipo_criticidade` para os códigos esperados pelo SAP.

8. **Nó `informacaoPadrao` (Function Node)**
   - **ID**: `eeed2d1a0a259b8d`
   - **Função**: Define informações padrão para integração com o SAP.
   - **Descrição**:
     - Cria o objeto `msg.informacaoPadrao` com valores padrão como `tipo_de_nota`, `tipo_ordem`, `centro_grupo_planejamento`, etc.
     - Define o tópico da mensagem como `'get_User_1'`.

9. **Nós `debug`**
   - **IDs**: Vários (ex.: `c12063e17a1eba5e`, `07e6d4a101079a25`, etc.)
   - **Função**: Auxiliam no monitoramento e depuração do fluxo.
   - **Descrição**:
     - Exibem o conteúdo de mensagens e variáveis em diferentes pontos do fluxo.
     - Podem ser desativados em ambiente de produção para otimizar desempenho.

10. **Nós `link out`**
    - **IDs**: Vários (ex.: `fdc413dc2317b4da`, `6dd750488e297ca9`)
    - **Função**: Encaminham mensagens para outros fluxos ou para tratamento de logs e erros.
    - **Descrição**:
      - Permitem a modularização do fluxo e o reuso de componentes.

*Observação*: Existem outros nós auxiliares, como nós de injeção (`inject`), nós de comentário (`comment`), e nós manuais para testes, que não são parte crítica do fluxo em produção.

---

