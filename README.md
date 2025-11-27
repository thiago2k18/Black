# 📱 AndarBem - App de Caminhada Inteligente

> **Aplicativo móvel completo para rastreamento de caminhadas com GPS, métricas em tempo real e funcionalidades offline.**

![Ionic](https://img.shields.io/badge/Ionic-8.0.0-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-20.0.0-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4.4-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)

---

## 🎯 **Sobre o Projeto**

O **AndarBem** é um aplicativo móvel desenvolvido com **Ionic 8** e **Angular 20** que oferece uma experiência completa para entusiastas de caminhadas. Com rastreamento GPS preciso, métricas em tempo real e funcionalidade offline, o app é perfeito para quem quer monitorar suas atividades físicas de forma inteligente e moderna.

### ✨ **Principais Características**

- 🗺️ **Rastreamento GPS em tempo real** com mapas online e offline
- 📊 **Métricas completas**: distância, tempo, passos, velocidade, calorias
- 📱 **Funciona 100% offline** - sem necessidade de internet
- 📸 **Câmera integrada** para registrar momentos durante a caminhada
- 🔦 **Controle de lanterna** para caminhadas noturnas
- 📈 **Histórico detalhado** de todas as atividades
- 🏆 **Sistema de conquistas** e metas pessoais
- 🎨 **Interface moderna** e responsiva
- 🔄 **Sincronização automática** quando conectado

---

## 🚀 **Funcionalidades Principais**

### 🗺️ **Sistema de Mapas Híbrido**
- **Mapbox** para mapas online com alta qualidade
- **Canvas offline** para funcionar sem internet
- Visualização da rota em tempo real
- Controles de zoom e centralização

### 📊 **Métricas em Tempo Real**
- **Distância percorrida** (GPS de alta precisão)
- **Tempo de atividade** com cronômetro
- **Contagem de passos** (acelerômetro + pedômetro)
- **Velocidade média** e instantânea
- **Calorias queimadas** (cálculo automático)
- **Altitude** (quando disponível)

### 📱 **Experiência Mobile Completa**
- Interface otimizada para dispositivos móveis
- Controles de atividade intuitivos (iniciar/pausar/finalizar)
- Feedback visual e sonoro
- Notificações locais
- Modo escuro automático

### 🔧 **Funcionalidades Avançadas**
- **Detecção automática de movimento** com sensores
- **Sistema de backup offline** com sincronização
- **Câmera integrada** para fotos durante atividades
- **Controle de lanterna** para segurança noturna
- **Guia de voz** para feedback durante exercícios

---

## 🛠️ **Tecnologias e Bibliotecas**

### **Framework Principal**
- **Ionic 8.0.0** - Framework híbrido para desenvolvimento mobile
- **Angular 20.0.0** - Framework web moderno e robusto
- **TypeScript 5.8.0** - Linguagem tipada para JavaScript
- **Capacitor 7.4.4** - Runtime nativo para aplicações web

### **Mapas e Geolocalização**
- **Mapbox GL JS 3.16.0** - Mapas interativos de alta qualidade
- **@capacitor/geolocation 7.1.5** - GPS nativo do dispositivo
- **Canvas HTML5** - Renderização de mapas offline

### **Sensores e Hardware**
- **@capacitor/motion 7.0.1** - Acelerômetro e giroscópio
- **@capacitor/camera 7.0.2** - Câmera nativa do dispositivo
- **@capgo/capacitor-flash 7.1.14** - Controle de lanterna
- **@capacitor/haptics 7.0.2** - Feedback tátil

### **Armazenamento e Dados**
- **@capacitor/preferences 7.0.2** - Armazenamento local persistente
- **LocalStorage API** - Cache de dados offline
- **IndexedDB** - Banco de dados local para grandes volumes

### **Notificações e Comunicação**
- **@capacitor/local-notifications 7.0.3** - Notificações locais
- **@capacitor/push-notifications 7.0.3** - Notificações push
- **@capacitor-community/text-to-speech 6.1.0** - Síntese de voz

### **Interface e UX**
- **Ionicons 7.0.0** - Biblioteca de ícones moderna
- **CSS Grid & Flexbox** - Layout responsivo
- **SCSS** - Pré-processador CSS avançado
- **Animações CSS3** - Transições suaves

### **Conectividade e Rede**
- **@capacitor/network 7.0.2** - Detecção de conectividade
- **RxJS 7.8.0** - Programação reativa
- **HTTP Client** - Requisições para APIs externas

---

## 🏗️ **Arquitetura do Projeto**

### **Estrutura de Pastas**
```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── offline-map/     # Mapa offline em Canvas
│   │   ├── splash-screen/   # Tela de carregamento
│   │   └── theme-toggle/    # Alternador de tema
│   ├── pages/               # Páginas da aplicação
│   │   ├── dashboard/       # Tela inicial
│   │   ├── activity/        # Rastreamento em tempo real
│   │   ├── history/         # Histórico de atividades
│   │   ├── profile/         # Perfil do usuário
│   │   ├── settings/        # Configurações
│   │   ├── maps/            # Visualização de mapas
│   │   ├── achievements/    # Sistema de conquistas
│   │   └── about/           # Sobre o desenvolvedor
│   └── services/            # Serviços da aplicação
│       ├── activity.service.ts      # Gerenciamento de atividades
│       ├── geolocation.service.ts   # GPS e localização
│       ├── pedometer.service.ts     # Contagem de passos
│       ├── accelerometer.service.ts # Sensores de movimento
│       ├── storage.service.ts       # Armazenamento local
│       ├── connectivity.service.ts  # Status de rede
│       ├── auth.service.ts          # Autenticação
│       ├── notification.service.ts  # Notificações
│       ├── voice-guide.service.ts   # Guia de voz
│       └── geo-sync.service.ts      # Sincronização GPS
├── assets/                  # Recursos estáticos
├── environments/            # Configurações de ambiente
└── theme/                   # Temas e estilos globais
```

### **Serviços Principais**

#### 🗺️ **GeolocationService**
- Rastreamento GPS de alta precisão
- Filtros de precisão (±25 metros)
- Fallback para diferentes provedores de localização
- Otimizado para economia de bateria

#### 🚶 **PedometerService & AccelerometerService**
- Detecção inteligente de passos
- Algoritmos de filtragem de ruído
- Classificação de movimento (parado/caminhando/correndo)
- Fallback automático entre sensores

#### 💾 **StorageService**
- Armazenamento offline robusto
- Sincronização automática quando online
- Backup de dados críticos
- Compressão de dados para otimização

#### 🔔 **NotificationService**
- Notificações de progresso
- Lembretes de atividade
- Feedback de conquistas
- Configurações personalizáveis

---

## 🌐 **APIs e Integrações**

### **Mapbox API**
- **Endpoint**: `https://api.mapbox.com/`
- **Funcionalidade**: Mapas vetoriais de alta qualidade
- **Token**: Configurado em `environment.ts`
- **Recursos utilizados**:
  - Tiles de mapa
  - Geocodificação
  - Roteamento
  - Estilos personalizados

### **Supabase (Preparado para integração)**
- **Funcionalidade**: Backend como serviço
- **Recursos preparados**:
  - Autenticação de usuários
  - Banco de dados PostgreSQL
  - Armazenamento de arquivos
  - Sincronização em tempo real

### **APIs Nativas do Dispositivo**
- **GPS/GNSS**: Localização de alta precisão
- **Acelerômetro**: Detecção de movimento
- **Câmera**: Captura de fotos
- **Armazenamento**: Persistência local
- **Notificações**: Sistema nativo de alertas

---

## 📋 **Pré-requisitos**

### **Ambiente de Desenvolvimento**
- **Node.js** 18+ 
- **npm** ou **yarn**
- **Ionic CLI** 7+
- **Angular CLI** 20+
- **Android Studio** (para build Android)
- **Xcode** (para build iOS - apenas macOS)

### **Chaves de API Necessárias**
- **Mapbox Access Token** (gratuito até 50k requisições/mês)
- **Supabase Project** (opcional - para recursos online)

---

## 🚀 **Instalação e Execução**

### **1. Clone o repositório**
```bash
git clone https://github.com/thiago2k18/Black.git
cd Black
```

### **2. Instale as dependências**
```bash
npm install
```

### **3. Configure as variáveis de ambiente**
```bash
# Edite src/environments/environment.ts
# Adicione seu token do Mapbox
```

### **4. Execute no navegador**
```bash
ionic serve
```

### **5. Build para dispositivos móveis**

#### **Android:**
```bash
ionic capacitor add android
ionic capacitor build android
ionic capacitor open android
```

#### **iOS:**
```bash
ionic capacitor add ios
ionic capacitor build ios
ionic capacitor open ios
```

---

## 📱 **Funcionalidades por Tela**

### 🏠 **Dashboard (Início)**
- Resumo das atividades do dia
- Estatísticas gerais do usuário
- Botão principal "Vamos caminhar!"
- Acesso rápido às principais funcionalidades
- Status de sincronização

### 🗺️ **Nova Atividade**
- Mapa em tempo real (online/offline)
- Métricas ao vivo (tempo, distância, passos, velocidade)
- Controles de atividade (iniciar/pausar/finalizar)
- Câmera para registrar momentos
- Controle de lanterna
- Contagem regressiva para início

### 📊 **Histórico**
- Lista de todas as atividades realizadas
- Filtros por data e tipo
- Detalhes completos de cada caminhada
- Opção de remover atividades
- Estatísticas consolidadas

### 👤 **Perfil**
- Informações do usuário
- Avatar personalizável (câmera/galeria)
- Estatísticas pessoais
- Configurações de conta

### ⚙️ **Configurações**
- Unidades de medida (km/mi)
- Notificações
- Tema (claro/escuro)
- Privacidade
- Backup e sincronização

### 🏆 **Conquistas (Metas)**
- Sistema de gamificação
- Metas desbloqueadas e pendentes
- Progresso visual
- Motivação para continuar ativo

---

## 🔧 **Configurações Avançadas**

### **Capacitor Config**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.andarbem.app',
  appName: 'AndarBem',
  plugins: {
    Geolocation: {
      permissions: { location: "always" },
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 3000
    },
    Motion: { interval: 100 },
    Camera: {
      permissions: {
        camera: "camera",
        photos: "photos"
      }
    }
  }
};
```

### **Otimizações de Performance**
- Lazy loading de páginas
- OnPush change detection
- Debounce em operações GPS
- Compressão de dados offline
- Cache inteligente de mapas

---

## 🧪 **Testes e Qualidade**

### **Ferramentas de Teste**
- **Jasmine** - Framework de testes
- **Karma** - Test runner
- **ESLint** - Linting de código
- **TypeScript** - Verificação de tipos

### **Cobertura de Testes**
- Testes unitários para serviços críticos
- Testes de integração para GPS
- Testes de interface para componentes
- Testes de performance para operações offline

---

## 📈 **Roadmap e Melhorias Futuras**

### **Versão 1.1**
- [ ] Integração completa com Supabase
- [ ] Sincronização em tempo real
- [ ] Compartilhamento social de atividades
- [ ] Exportação de dados (GPX, KML)

### **Versão 1.2**
- [ ] Modo escuro automático
- [ ] Widgets para tela inicial
- [ ] Integração com wearables
- [ ] Análises avançadas de performance

### **Versão 2.0**
- [ ] Grupos e desafios entre amigos
- [ ] IA para sugestões personalizadas
- [ ] Rotas recomendadas
- [ ] Integração com apps de saúde

---

## 🤝 **Contribuição**

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

---

## 📄 **Licença**

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 **Desenvolvedor**

**Tiago Ribeiro**
- 📧 Email: rthiagoribeiro866@gmail.com
- 🐙 GitHub: [@thiago2k18](https://github.com/thiago2k18)

---

## 🙏 **Agradecimentos**

- **Ionic Team** - Framework incrível para desenvolvimento híbrido
- **Angular Team** - Framework web robusto e moderno
- **Mapbox** - API de mapas de alta qualidade
- **Capacitor** - Bridge nativo eficiente
- **Comunidade Open Source** - Inspiração e suporte constante

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela! ⭐**

**📱 Desenvolvido com ❤️ para entusiastas de caminhadas**

</div>
