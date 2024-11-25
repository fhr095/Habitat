# Componentes Chave

## Node-RED

- **Descrição**: Plataforma de desenvolvimento baseada em fluxos para integração de hardware e serviços.
- **Papel na Integração**: Centraliza o processamento dos dados, orquestrando os fluxos entre o Arkmeds e o SAP.
- **Características Importantes**:
  - Fluxos configuráveis visualmente.
  - Grande variedade de nós para manipulação de dados.

## Arkmeds

- **Descrição**: Sistema utilizado para gestão de Ordens de Serviço na fábrica.
- **Papel na Integração**: Fonte principal de dados das OS que precisam ser refletidas no SAP.
- **Características Importantes**:
  - Emite notificações em tempo real via WebSocket.
  - Disponibiliza APIs para consulta detalhada das OS.

## SAP

- **Descrição**: Sistema de gestão empresarial amplamente utilizado para gerenciamento de processos de negócios.
- **Papel na Integração**: Recebe as OS criadas ou atualizadas no Arkmeds para manter a sincronização entre os sistemas.
- **Características Importantes**:
  - APIs para criação e fechamento de ordens.
  - Requisitos específicos de formato e validação de dados.

## WebSocket

- **Descrição**: Protocolo de comunicação que permite interações bidirecionais em tempo real entre um cliente e um servidor.
- **Papel na Integração**: Utilizado para receber notificações em tempo real do Arkmeds sobre eventos de OS.
- **Características Importantes**:
  - Baixa latência na comunicação.
  - Necessidade de gerenciamento de conexões persistentes.

## Servidor Autohospedado

- **Descrição**: Ambiente onde a aplicação Node-RED está executando.
- **Papel na Integração**: Hospeda a aplicação que realiza toda a orquestração dos fluxos.
- **Características Importantes**:
  - Controle total sobre o ambiente e recursos.
  - Necessidade de manutenção e monitoramento.

*Nota: Podem ser adicionados outros componentes ou detalhes conforme necessário.*

