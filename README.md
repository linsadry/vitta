# Fitness OS Pessoal

Sistema pessoal de acompanhamento de saúde e hábitos.  
**Privacidade máxima — todos os dados ficam no seu dispositivo.**

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Interface | HTML + CSS + JS vanilla (sem frameworks) |
| Persistência | IndexedDB + localStorage (local, no device) |
| Offline | Service Worker (PWA) |
| Hospedagem | GitHub Pages ou Cloudflare Pages |
| CI/CD | GitHub Actions (deploy automático) |

---

## Estrutura

```
fitness-os/
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline)
├── _headers                # Cloudflare: security + cache headers
├── _redirects              # Cloudflare: SPA fallback
│
├── css/
│   ├── reset.css           # Reset
│   ├── tokens.css          # Design tokens (paleta Japandi)
│   ├── components.css      # Componentes reutilizáveis
│   ├── screens.css         # Layout por tela
│   └── animations.css      # Keyframes
│
├── js/
│   ├── storage.js          # IndexedDB + localStorage (camada de dados)
│   ├── data.js             # Dados padrão + seed demo
│   ├── utils.js            # Utilitários (datas, DOM, SVG, score)
│   ├── charts.js           # Gráficos (barras, sparkline)
│   ├── router.js           # Navegação entre telas
│   ├── app.js              # Inicialização
│   ├── sw-register.js      # Registro do Service Worker
│   └── screens/
│       ├── dashboard.js    # Tela inicial
│       ├── hydration.js    # Hidratação (interativa)
│       ├── nutrition.js    # Alimentação + IA local
│       ├── workout.js      # Treinos
│       ├── progress.js     # Progresso e medidas
│       └── ai.js           # Assistente IA local
│
└── assets/
    └── icons/
        ├── icon-192.png    # PWA icon (adicionar)
        └── icon-512.png    # PWA icon (adicionar)
```

---

## Deploy — GitHub Pages

### 1. Criar repositório

```bash
cd fitness-os
git init
git add .
git commit -m "feat: initial Fitness OS"
git branch -M main
git remote add origin https://github.com/SEU_USER/fitness-os.git
git push -u origin main
```

### 2. Ativar GitHub Pages

- Settings → Pages → Source: **Deploy from a branch**
- Branch: `main` / Folder: `/ (root)`
- Save → aguardar ~1min → URL: `https://SEU_USER.github.io/fitness-os`

> **Atenção:** para GitHub Pages, o `sw.js` precisa que `start_url` no manifest  
> use o subpath: `"/fitness-os/"`. Ajuste conforme seu repositório.

---

## Deploy — Cloudflare Pages *(recomendado)*

### Vantagens sobre GitHub Pages
- HTTPS com domínio próprio gratuito
- Headers de segurança via `_headers`
- Edge cache global
- Deploy previews por branch

### Passos

1. **Cloudflare Dashboard** → Pages → Create a project
2. Connect to Git → selecionar o repositório `fitness-os`
3. Build settings:
   - Framework preset: **None**
   - Build command: *(vazio)*
   - Build output directory: `/` ou `.`
4. Deploy → URL: `https://fitness-os.pages.dev`

### Domínio personalizado (opcional)
Pages → Custom domains → adicionar seu domínio

---

## Dados locais — Arquitetura de privacidade

```
┌──────────────────────────────────────────────────────┐
│  Dispositivo do usuário                              │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────────┐│
│  │ IndexedDB   │    │ localStorage                 ││
│  │             │    │                              ││
│  │ • Refeições │    │ • Peso (histórico)           ││
│  │ • Treinos   │    │ • Preferências               ││
│  │ • Medidas   │    │ • Score diário               ││
│  │ • Água      │    │ • Hábitos do dia             ││
│  │ • Fotos*    │    │                              ││
│  └─────────────┘    └──────────────────────────────┘│
│                                                      │
│  * Fotos armazenadas como blob local                │
│  ✗ Nenhum dado é enviado a servidores externos      │
└──────────────────────────────────────────────────────┘
```

---

## Ícones PWA

Adicionar em `assets/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Sugestão: gerar via [realfavicongenerator.net](https://realfavicongenerator.net) com fundo `#7A836A` (olive Japandi).

---

## Próximos passos (roadmap)

- [ ] Formulários reais de registro (refeição, treino, peso)
- [ ] Export de dados como JSON
- [ ] Gráficos interativos com toque
- [ ] Integração com Apple Health via Web API (quando disponível)
- [ ] Notificações locais (lembrete de água, treino)
- [ ] Tema escuro automático
