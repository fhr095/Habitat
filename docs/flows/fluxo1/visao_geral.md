# Fluxo 1: Informação das Ordens de Serviço (OS)

## Visão Geral

O **Fluxo 1: Informação das OS** é responsável por receber notificações sobre eventos de Ordens de Serviço (OS) do Arkmeds e preparar esses dados para integração com o SAP. O fluxo processa, transforma e valida as informações, garantindo que estejam no formato adequado para os processos subsequentes.

### Objetivos do Fluxo

- **Receber notificações de eventos das OS**: Capturar em tempo real quando uma OS é criada ou atualizada no Arkmeds.
- **Obter detalhes completos da OS**: Consultar a API do Arkmeds para obter informações detalhadas sobre a OS.
- **Processar e validar dados**: Realizar transformações e validações necessárias para adequar os dados aos requisitos do SAP.
- **Encaminhar dados para fluxos subsequentes**: Preparar e enviar os dados processados para os próximos passos da integração.

### Descrição Geral do Fluxo

1. **Recepção de Notificações**: O fluxo inicia ao receber uma notificação do Arkmeds, seja via WebSocket ou Webhook.

2. **Processamento Inicial**: Os dados recebidos são pré-processados para ajustar formatos e corrigir possíveis inconsistências.

3. **Consulta Detalhada da OS**: Uma chamada é feita à API do Arkmeds para obter informações completas da OS.

4. **Transformações e Validações**: Aplicam-se regras de negócio para transformar e validar os dados conforme os requisitos do SAP.

5. **Encaminhamento**: Os dados processados são enviados para os fluxos que realizam a integração com o SAP ou para tratamento de erros, se necessário.

### Fluxo de Dados

![Diagrama do Fluxo 1](../imagens/fluxo1_diagrama.png)

*Nota: O diagrama acima ilustra as principais etapas do fluxo, desde a recepção da notificação até o encaminhamento dos dados processados.*

