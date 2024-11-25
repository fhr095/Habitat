# Fluxo 2: Transformação de Dados

## Introdução

As transformações de dados no **Fluxo 2** são cruciais para garantir que os payloads enviados ao SAP estejam no formato correto e contenham todas as informações necessárias. Esta seção detalha as principais transformações realizadas durante a preparação dos payloads de criação e fechamento.

## 1. Mapeamento de Campos para Criação de OS

### Componentes Envolvidos

- **Function Node: payload_SAP_Criar**

### Transformações Realizadas

- **Centros de Trabalho**:
  - Extrai o centro de trabalho a partir do campo `quadro_trabalho.descricao`.
  - Se o campo está vazio ou nulo, utiliza um valor padrão (por exemplo, `"PC05"`).

- **Notificador**:
  - Define o nome do notificador da OS.
  - Se o nome do responsável pela abertura não está disponível, utiliza o valor `"CHAMADO"`.

- **Adição de Valores Padrão**:
  - Campos como `grupo_planejamento`, `tipo_ordem` e `numero_pessoal` recebem valores padrão necessários para a criação da OS no SAP.

### Exemplo de Payload Preparado para Criação

```json
{
  "documento_arkmeds": "OS1234",
  "tipo_de_nota": "M2",
  "texto_breve": "Descrição do Problema",
  "equipamento": "EQP001",
  "notificador": "João da Silva",
  "grupo_planejamento": "210",
  "centro_grupo_planejamento": "M100",
  "centro_trabalho": "CT01",
  "centro_centro_trabalho": "M100",
  "tipo_ordem": "PM01",
  "numero_pessoal": "501138"
}
```

## 2. Preparação dos Apontamentos de Horas

### Componentes Envolvidos

- **Function Node: payload_SAP_Fechar**
- **Function Node: apontamentos**
- **HTTP Request Node: get_User_2**

### Transformações Realizadas

- **Formatação de Datas e Horas**:
  - Converte timestamps em formato UNIX para datas e horas legíveis, ajustando o fuso horário conforme necessário.

- **Montagem da Lista de Apontamentos**:
  - Cria uma lista de objetos contendo informações de cada apontamento, incluindo datas, horas, centros de trabalho e números pessoais.

- **Obtenção de Informações dos Usuários**:
  - Para cada apontamento, obtém o número pessoal (RE) e o centro de trabalho do usuário através de requisições à API do Arkmeds.

### Exemplo de Apontamento

```json
{
  "confirm_data_inicio_trabalho": "25/10/2023",
  "confirm_hora_inicio_trabalho": "08:00:00",
  "confirm_data_fim_trabalho": "25/10/2023",
  "confirm_hora_fim_trabalho": "12:00:00",
  "confirm_centro_trabalho": "CT01",
  "confirm_centro_centro_trabalho": "M100",
  "confirm_numero_pessoal": "501138"
}
```

## 3. Montagem do Payload para Fechamento

### Componentes Envolvidos

- **Function Node: payload_SAP_Fechar**

### Transformações Realizadas

- **Agrupamento de Informações**:
  - Combina dados da OS, informações dos apontamentos e detalhes dos usuários para montar o payload completo.

- **Formatação de Campos Textuais**:
  - Constrói descrições detalhadas, como histórico, a partir de campos como `origem_problema`, `problema_relatado` e `descricao_servico`.

- **Tratamento de Campos Nulos ou Vazios**:
  - Verifica campos que podem estar vazios e atribui valores padrão ou deixa em branco, conforme apropriado.

## 4. Validação dos Dados

### Componentes Envolvidos

- **Function Node: verificarPreenchimento**

### Transformações Realizadas

- **Verificação de Campos Obrigatórios**:
  - Confirma a presença e validade de campos essenciais para o SAP.

- **Preparação para Tratamento de Erros**:
  - Se campos obrigatórios estão faltando ou inválidos, registra mensagens de erro específicas para facilitar o diagnóstico.

### Exemplo de Mensagem de Erro

```text
"Erro no Sistema Webhook: Campo(s) sem preenchimento: Prioridade / Data de Fechamento / Número de Registro (RE do Usuário)."
```

## Considerações Importantes

- **Consistência nos Mapeamentos**:
  - As transformações devem manter consistência nos códigos e formatos utilizados para garantir que o SAP processe os payloads corretamente.

- **Atualização de Valores Padrão**:
  - Valores padrão utilizados devem ser revisados periodicamente para garantir que ainda sejam válidos e adequados.

- **Tratamento de Fuso Horário**:
  - Ajustes nos horários devem considerar o fuso horário adequado para evitar inconsistências nas datas e horas registradas.


