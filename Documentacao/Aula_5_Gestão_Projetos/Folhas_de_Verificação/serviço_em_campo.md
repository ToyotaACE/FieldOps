# Folhas de Verificação — FieldOps

## Gestão de Serviços e Operações de Campo

### Objetivo

As Folhas de Verificação têm como objetivo padronizar a coleta de dados das operações de campo do projeto **FieldOps**, permitindo registrar falhas e não conformidades durante a execução dos serviços.

Os dados coletados poderão posteriormente alimentar análises como:

**Folha de Verificação → Pareto → Ishikawa → Plano de Ação → Monitoramento**

---

# 1. Folha de Verificação — Inspeção Prévia e Execução do Serviço em Campo

### Objetivo

Verificar se o técnico possui todas as condições necessárias para executar a Ordem de Serviço corretamente.

| Item de Verificação | Status (Conforme / Não Conforme / N/A) | Frequência de Falhas (Contagem) | Ação Corretiva Imediata |
|---|---|---:|---|
| Peças necessárias disponíveis | Conforme / Não Conforme / N/A | 0 | Separar ou solicitar peças |
| Ferramentas adequadas disponíveis | Conforme / Não Conforme / N/A | 0 | Providenciar ferramenta adequada |
| Diagnóstico prévio disponível | Conforme / Não Conforme / N/A | 0 | Solicitar informações adicionais |
| Ordem de serviço corretamente preenchida | Conforme / Não Conforme / N/A | 0 | Corrigir informações da OS |
| Autorização do cliente confirmada | Conforme / Não Conforme / N/A | 0 | Confirmar autorização |
| Endereço e localização conferidos | Conforme / Não Conforme / N/A | 0 | Atualizar endereço/localização |
| EPIs necessários disponíveis | Conforme / Não Conforme / N/A | 0 | Providenciar EPI |
| Condições para execução verificadas | Conforme / Não Conforme / N/A | 0 | Comunicar impedimento |
| Serviço executado conforme procedimento | Conforme / Não Conforme / N/A | 0 | Corrigir execução |
| Evidências do serviço registradas | Conforme / Não Conforme / N/A | 0 | Registrar fotos/evidências |

### Fluxo de decisão

```mermaid
graph TD
    A["Início da inspeção"] --> B["Preencher folha de verificação"]
    B --> C{"Todos os itens estão conformes?"}

    C -->|Sim| D["Executar serviço"]
    C -->|Não| E["Registrar não conformidade"]

    E --> F{"Pode corrigir imediatamente?"}

    F -->|Sim| G["Executar ação corretiva"]
    G --> H["Registrar correção"]
    H --> B

    F -->|Não| I["Comunicar responsável"]
    I --> J["Registrar impedimento na OS"]
    J --> K["Reprogramar ou direcionar atendimento"]

    D --> L["Registrar execução"]
    L --> M["Finalizar folha"]
```

---

# 2. Folha de Verificação — Controle de Qualidade e Pós-Atendimento

### Objetivo

Garantir que o serviço esteja completamente concluído antes do encerramento da Ordem de Serviço, reduzindo retrabalho, reclamações e chamados de garantia.

| Item de Verificação | Status (Conforme / Não Conforme / N/A) | Frequência de Falhas (Contagem) | Ação Corretiva Imediata |
|---|---|---:|---|
| Serviço executado integralmente | Conforme / Não Conforme / N/A | 0 | Realizar etapa pendente |
| Equipamento/serviço funcionando corretamente | Conforme / Não Conforme / N/A | 0 | Realizar teste ou correção |
| Teste final realizado | Conforme / Não Conforme / N/A | 0 | Repetir teste |
| Local de atendimento limpo | Conforme / Não Conforme / N/A | 0 | Realizar limpeza |
| Materiais e ferramentas recolhidos | Conforme / Não Conforme / N/A | 0 | Recolher materiais |
| Fotos do serviço concluído anexadas | Conforme / Não Conforme / N/A | 0 | Registrar novas fotos |
| Assinatura/aceite do cliente coletado | Conforme / Não Conforme / N/A | 0 | Solicitar aceite |
| Observações finais registradas | Conforme / Não Conforme / N/A | 0 | Complementar informações |
| OS encerrada corretamente | Conforme / Não Conforme / N/A | 0 | Corrigir dados da OS |
| Cliente informado sobre conclusão | Conforme / Não Conforme / N/A | 0 | Realizar comunicação |

### Fluxo de decisão

```mermaid
graph TD
    A["Início da inspeção final"] --> B["Preencher checklist de qualidade"]
    B --> C{"Todos os itens estão conformes?"}

    C -->|Sim| D["Realizar teste final"]
    C -->|Não| E["Registrar não conformidade"]

    E --> F{"Correção pode ser feita no local?"}

    F -->|Sim| G["Realizar correção"]
    G --> H["Revalidar serviço"]
    H --> B

    F -->|Não| I["Registrar pendência"]
    I --> J["Comunicar responsável"]
    J --> K["Programar retorno"]

    D --> L{"Cliente aprovou o serviço?"}

    L -->|Sim| M["Coletar assinatura/aceite"]
    M --> N["Encerrar OS"]

    L -->|Não| E

    N --> O["Finalizar folha de verificação"]
```

---

# 3. Folha de Verificação — Check-in Logístico e Inspeção do Veículo/Frota

### Objetivo

Identificar problemas no veículo, equipamentos e recursos antes do início das rotas, reduzindo atrasos, paradas e custos operacionais.

| Item de Verificação | Status (Conforme / Não Conforme / N/A) | Frequência de Falhas (Contagem) | Ação Corretiva Imediata |
|---|---|---:|---|
| Quilometragem registrada | Conforme / Não Conforme / N/A | 0 | Registrar quilometragem atual |
| Nível de combustível adequado | Conforme / Não Conforme / N/A | 0 | Abastecer veículo |
| Pneus em condições adequadas | Conforme / Não Conforme / N/A | 0 | Solicitar inspeção/manutenção |
| Freios funcionando corretamente | Conforme / Não Conforme / N/A | 0 | Retirar veículo de operação |
| Luzes e sinalização funcionando | Conforme / Não Conforme / N/A | 0 | Corrigir ou solicitar manutenção |
| EPIs disponíveis no veículo | Conforme / Não Conforme / N/A | 0 | Repor EPIs |
| Ferramentas e equipamentos disponíveis | Conforme / Não Conforme / N/A | 0 | Repor equipamentos |
| Documentação do veículo válida | Conforme / Não Conforme / N/A | 0 | Regularizar documentação |
| Veículo limpo e organizado | Conforme / Não Conforme / N/A | 0 | Realizar limpeza/organização |
| Avarias externas registradas | Conforme / Não Conforme / N/A | 0 | Registrar ocorrência |
| Equipamentos de emergência disponíveis | Conforme / Não Conforme / N/A | 0 | Providenciar equipamento |

### Fluxo de decisão

```mermaid
graph TD
    A["Início do check-in"] --> B["Inspecionar veículo e equipamentos"]
    B --> C["Preencher folha de verificação"]

    C --> D{"Veículo está apto para operação?"}

    D -->|Sim| E["Liberar veículo"]
    E --> F["Registrar quilometragem e combustível"]
    F --> G["Iniciar rota"]

    D -->|Não| H["Registrar não conformidade"]
    H --> I{"Falha pode ser corrigida imediatamente?"}

    I -->|Sim| J["Realizar correção"]
    J --> C

    I -->|Não| K["Comunicar responsável pela frota"]
    K --> L["Bloquear veículo"]
    L --> M["Solicitar veículo substituto"]

    M --> G
```

---

# 4. Folha de Verificação — Auditoria de Funcionamento do App Mobile

### Objetivo

Monitorar a confiabilidade do aplicativo utilizado pelos técnicos durante os atendimentos, principalmente em situações de operação offline.

| Item de Verificação | Status (Conforme / Não Conforme / N/A) | Frequência de Falhas (Contagem) | Ação Corretiva Imediata |
|---|---|---:|---|
| Login realizado normalmente | Conforme / Não Conforme / N/A | 0 | Reiniciar app ou validar acesso |
| OS carregada corretamente | Conforme / Não Conforme / N/A | 0 | Atualizar dados da OS |
| Modo offline funcionando | Conforme / Não Conforme / N/A | 0 | Registrar operação localmente |
| Dados salvos durante modo offline | Conforme / Não Conforme / N/A | 0 | Salvar novamente |
| Sincronização realizada após conexão | Conforme / Não Conforme / N/A | 0 | Executar nova sincronização |
| GPS apresentou localização correta | Conforme / Não Conforme / N/A | 0 | Reativar localização |
| Fotos anexadas corretamente | Conforme / Não Conforme / N/A | 0 | Repetir upload |
| Aplicativo apresentou travamento | Conforme / Não Conforme / N/A | 0 | Reiniciar aplicativo |
| Consumo de bateria adequado | Conforme / Não Conforme / N/A | 0 | Ativar economia de bateria |
| Notificações recebidas corretamente | Conforme / Não Conforme / N/A | 0 | Verificar permissões |
| OS encerrada e sincronizada | Conforme / Não Conforme / N/A | 0 | Reprocessar sincronização |

### Fluxo de decisão

```mermaid
graph TD
    A["Início da auditoria do App"] --> B["Abrir aplicativo"]
    B --> C["Executar testes de funcionamento"]
    C --> D{"Aplicativo funcionando normalmente?"}

    D -->|Sim| E["Executar OS normalmente"]
    E --> F["Verificar sincronização"]
    F --> G{"Dados sincronizados?"}

    G -->|Sim| H["Finalizar auditoria"]
    G -->|Não| I["Registrar falha de sincronização"]

    D -->|Não| J["Identificar tipo de falha"]
    J --> K{"É possível corrigir no dispositivo?"}

    K -->|Sim| L["Executar correção"]
    L --> M["Testar novamente"]
    M --> D

    K -->|Não| N["Registrar incidente"]
    N --> O["Comunicar suporte de TI"]

    O --> P{"Operação pode continuar offline?"}

    P -->|Sim| Q["Continuar atendimento offline"]
    Q --> R["Sincronizar posteriormente"]
    R --> H

    P -->|Não| S["Registrar impedimento na OS"]
    S --> T["Acionar suporte"]
    T --> H

    I --> R
```

---

# Integração das Folhas com a Análise de Dados

As quatro folhas devem gerar dados estruturados para permitir a análise posterior das ocorrências.

## Fluxo de coleta e análise

```mermaid
graph TD
    A["Coleta em Campo"] --> B["Folhas de Verificação"]

    B --> C["Registro de Não Conformidades"]

    C --> D["Banco de Dados FieldOps"]

    D --> E["Consolidação das Ocorrências"]

    E --> F["Diagrama de Pareto"]

    F --> G["Identificação das Causas Vitais"]

    G --> H["Diagrama de Ishikawa"]

    H --> I["Identificação das Causas-Raiz"]

    I --> J["Plano de Ação"]

    J --> K["Implementação das Melhorias"]

    K --> L["Monitoramento dos KPIs"]

    L --> D
```

## Indicadores que podem ser gerados

| Indicador | Fonte | Objetivo |
|---|---|---|
| Taxa de não conformidade | Folhas de verificação | Medir falhas operacionais |
| Falhas por Ordem de Serviço | OS / Checklist | Identificar serviços problemáticos |
| First Time Fix Rate | Execução em campo | Medir resolução na primeira visita |
| Tempo médio de deslocamento | Logística | Avaliar eficiência das rotas |
| Taxa de falha de sincronização | App Mobile | Medir confiabilidade do aplicativo |
| Taxa de retrabalho | Qualidade | Identificar serviços que precisam ser refeitos |
| NPS | Pós-atendimento | Avaliar satisfação do cliente |
| Chamados de garantia | Pós-atendimento | Monitorar falhas após conclusão |
| Disponibilidade da frota | Logística | Avaliar impacto de veículos indisponíveis |

## Ciclo de Melhoria Contínua

**Coletar → Medir → Analisar → Identificar causa → Corrigir → Monitorar → Melhorar**

Esse ciclo permite que o FieldOps transforme as ocorrências registradas pelos técnicos em **dados para tomada de decisão e melhoria contínua dos processos de campo**.