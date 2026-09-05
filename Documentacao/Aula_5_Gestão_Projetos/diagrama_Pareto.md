graph TD
    classDef vital fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef comum fill:#e3f2fd,stroke:#1565c0,stroke-width:1px;

    subgraph FIELD_OPS ["FIELD OPS - DIAGRAMAS DE PARETO (REGRA 80/20)"]

        subgraph T1 ["1. Geral / Gargalos Operacionais"]
            G1["Falta de Peças (300)"]:::vital --> G2["Deslocamento Atrasado (280)"]:::vital
            G2 --> G3["Diagnóstico Incorreto (230)"]:::vital
            G3 --> G4["Sincronização Offline (210)"]:::comum
            G4 --> G5["Atraso Geral (190)"]:::comum
            G5 --> G6["Retrabalho (180)"]:::comum
            G6 --> G7["Erro de GPS (140)"]:::comum
            G7 --> G8["Outros (100)"]:::comum
        end

        subgraph T2 ["2. Qualidade e Pós-Atendimento"]
            Q1["Serviço Incompleto (290)"]:::vital --> Q2["Atraso na Chegada (230)"]:::vital
            Q2 --> Q3["Sujeira / Limpeza (180)"]:::comum
            Q3 --> Q4["Erro em Fatura/OS (140)"]:::comum
            Q4 --> Q5["Chamado de Retorno (100)"]:::comum
            Q5 --> Q6["Outros (60)"]:::comum
        end

        subgraph T3 ["3. Logística e Deslocamento"]
            L1["Trânsito Não Previsto (320)"]:::vital --> L2["Rota Não Otimizada (250)"]:::vital
            L2 --> L3["Redistribuição Emergencial (170)"]:::comum
            L3 --> L4["Quebra de Veículo (110)"]:::comum
            L4 --> L5["Dificuldade de Acesso (90)"]:::comum
            L5 --> L6["Outros (60)"]:::comum
        end

        subgraph T4 ["4. Tecnologia e App Mobile"]
            A1["Falha de Sync Offline (280)"]:::vital --> A2["Erro ao Anexar Fotos (210)"]:::vital
            A2 --> A3["Imprecisão do GPS (190)"]:::comum
            A3 --> A4["Consumo de Bateria (130)"]:::comum
            A4 --> A5["Lentidão do App (110)"]:::comum
            A5 --> A6["Outros (80)"]:::comum
        end

    end