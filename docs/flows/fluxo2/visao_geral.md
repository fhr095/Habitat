# Fluxo 2: Payload de Criação e Fechamento

## Visão Geral

O **Fluxo 2: Payload de Criação e Fechamento** é responsável por preparar os dados necessários para a integração com o SAP durante os processos de criação e fechamento de Ordens de Serviço (OS). Ele trata da geração de payloads que serão enviados ao SAP para criar novas ordens ou atualizar o status de ordens existentes.

### Objetivos do Fluxo

- **Preparar payloads para criação de OS no SAP**: Quando uma OS é aberta no Arkmeds, o fluxo prepara os dados necessários para criar uma ordem correspondente no SAP.
- **Preparar payloads para fechamento de OS no SAP**: Quando uma OS é fechada no Arkmeds, o fluxo prepara os dados para atualizar e fechar a ordem correspondente no SAP.
- **Consultar informações adicionais**: Obter informações de usuários e outros dados necessários para completar o payload.
- **Validar e transformar dados**: Garantir que os dados estejam no formato correto e que todas as informações necessárias estejam presentes.

### Descrição Geral do Fluxo

1. **Decisão baseada no estado da OS**: O fluxo verifica o estado final da OS (Aberta ou Fechada) para determinar se deve preparar um payload de criação ou de fechamento.

2. **Preparação do Payload para Criação**:
   - Se a OS está sendo aberta, o fluxo prepara os dados necessários para criar uma nova ordem no SAP.
   - Dados adicionais são obtidos e valores padrão são adicionados onde necessário.

3. **Preparação do Payload para Fechamento**:
   - Se a OS está sendo fechada, o fluxo coleta informações adicionais, como apontamentos de horas e detalhes do usuário.
   - Realiza transformações e validações nos dados antes de preparar o payload para fechamento no SAP.

4. **Encaminhamento do Payload**:
   - Após a preparação, o payload é encaminhado para os fluxos responsáveis por enviar os dados ao SAP.
   - Em caso de erros ou falta de informações, o fluxo trata as inconsistências antes de prosseguir.

### Fluxo de Dados

![Diagrama do Fluxo 2](../imagens/fluxo2_diagrama.png)

*Nota: O diagrama acima ilustra as principais etapas do Fluxo 2, desde a decisão baseada no estado da OS até o encaminhamento dos payloads ao SAP.*
