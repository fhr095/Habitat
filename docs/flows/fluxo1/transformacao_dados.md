# Fluxo 1: Transformação de Dados

## Introdução

As transformações de dados são essenciais para adequar as informações das OS aos requisitos do SAP. Esta seção detalha as principais transformações realizadas no Fluxo 1, explicando como os dados são manipulados e preparados.

## 1. Ajuste de Campos Especiais

### Problema

- Certos campos recebidos do Arkmeds podem conter caracteres que causam problemas na manipulação de dados (por exemplo, pontos em nomes de campos).

### Solução

- **Renomear campos problemáticos**: Por exemplo, substituir `"os.observacoes"` por `"os_observacoes"`.

### Implementação

- **Função de Ajuste**:
  - Verifica se o campo problemático existe.
  - Renomeia o campo no objeto de dados.

## 2. Formatação de Datas

### Necessidade

- O SAP pode exigir datas em formatos específicos ou separadas em data e hora.

### Transformações

- **Separar data e hora**:
  - De `"25/10/2023 14:30:00"` para:
    - `data_criacao`: `"25/10/2023"`
    - `hora_criacao`: `"14:30:00"`
- **Converter formatos de data**:
  - Ajustar para o padrão ISO 8601 ou outro exigido.

### Implementação

- **Função de Formatação**:
  - Divide a string de data e hora usando espaço como separador.
  - Atribui as partes aos campos correspondentes.

## 3. Mapeamento de Tipos de Serviço e Prioridades

### Necessidade

- O SAP utiliza códigos específicos para tipos de serviço e prioridades.

### Mapeamentos

- **Tipo de Serviço**:
  - `"Manutenção Corretiva"` → `"210"`
  - `"Manutenção Preventiva"` → `"200"`
- **Prioridades**:
  - `"Não urgente"` ou `"Pouco urgente"` → `"3"`
  - `"Urgente"`, `"Muito urgente"` ou `"Emergente"` → `"1"`

### Implementação

- **Função de Mapeamento**:
  - Usa estruturas condicionais para atribuir o código correto com base na descrição recebida.

## 4. Tratamento de Criticidade

### Necessidade

- Representar a criticidade conforme os códigos esperados pelo SAP.

### Transformações

- **Tipo de Criticidade**:
  - `"1"` → `"X"`
  - `"2"` → `"0"`
  - Outros ou `null` → `""` (vazio)

### Implementação

- **Função de Conversão**:
  - Verifica o valor recebido e atribui o código correspondente.
  - Trata casos de valores `null` ou inesperados.

## 5. Adição de Informações Padrão

### Necessidade

- Alguns campos exigidos pelo SAP não estão presentes nos dados do Arkmeds e precisam ser adicionados com valores padrão.

### Campos Adicionados

- `"tipo_de_nota"`: `"M2"`
- `"texto_acao"`: `"Histórico"`
- **Outros campos conforme necessidade**.

### Implementação

- **Função de Inserção**:
  - Adiciona os campos padrão ao objeto de dados antes de encaminhar para o próximo fluxo.

## Exemplo Prático

**Dados Recebidos do Arkmeds**:

```json
{
  "id": 1234,
  "tipo_servico": "Manutenção Corretiva",
  "prioridade": {"descricao": "Urgente"},
  "data_criacao": "25/10/2023 14:30:00",
  "tipo_criticidade": "1",
  "os.observacoes": "Equipamento apresentou falha."
}

## Transformações Aplicadas

### Renomeação de Campo
- `"os.observacoes"` → `"os_observacoes"`

### Formatação de Datas
- `data_criacao` é separada em:
  - `data_criacao`: `"25/10/2023"`
  - `hora_criacao`: `"14:30:00"`

### Mapeamento de Tipo de Serviço
- `"Manutenção Corretiva"` → `"210"`

### Mapeamento de Prioridade
- `"Urgente"` → `"1"`

### Tratamento de Criticidade
- `"1"` → `"X"`

### Adição de Campos Padrão
- `"tipo_de_nota"`: `"M2"`
- `"texto_acao"`: `"Histórico"`

## Dados Preparados para o SAP

```json
{
  "id": 1234,
  "tipo_servico": "210",
  "prioridade": "1",
  "data_criacao": "25/10/2023",
  "hora_criacao": "14:30:00",
  "tipo_criticidade": "X",
  "os_observacoes": "Equipamento apresentou falha.",
  "tipo_de_nota": "M2",
  "texto_acao": "Histórico"
  // ... outros campos necessários
}

