# Fluxo 3: Consultar Apontamentos e Verificação de Preenchimento

## Visão Geral

O **Fluxo 3: Consultar Apontamentos e Verificação de Preenchimento** é responsável por consultar os apontamentos de horas registrados nas Ordens de Serviço (OS) e verificar se todas as informações necessárias foram preenchidas corretamente antes de concluir o processo de integração com o SAP.

### Objetivos do Fluxo

- **Consultar apontamentos de horas**: Obter informações detalhadas sobre os apontamentos registrados em uma OS.
- **Verificar preenchimento de campos obrigatórios**: Garantir que todas as informações necessárias estejam presentes e corretas.
- **Preparar dados para integração**: Assegurar que os dados estejam completos e no formato adequado para serem enviados ao SAP.
- **Tratar inconsistências**: Identificar e lidar com quaisquer erros ou dados faltantes antes de prosseguir com a integração.

### Descrição Geral do Fluxo

1. **Obtenção dos Apontamentos**:
   - Consulta os apontamentos de horas registrados na OS, incluindo detalhes como datas, horas, usuários envolvidos e atividades realizadas.

2. **Verificação dos Dados**:
   - Analisa os apontamentos e outros dados da OS para confirmar que todos os campos obrigatórios estão preenchidos.

3. **Atualização dos Dados**:
   - Quando necessário, obtém informações adicionais, como detalhes dos usuários, para completar os dados.

4. **Validação Final**:
   - Realiza uma validação completa dos dados para garantir que estejam prontos para a integração com o SAP.

5. **Encaminhamento ou Tratamento de Erros**:
   - Se os dados estão corretos, encaminha para o fluxo de integração.
   - Se há erros, encaminha para o fluxo de tratamento de erros.

### Fluxo de Dados

![Diagrama do Fluxo 3](../imagens/fluxo3_diagrama.png)

*Nota: O diagrama acima ilustra as principais etapas do Fluxo 3, desde a consulta dos apontamentos até a validação final dos dados.*

