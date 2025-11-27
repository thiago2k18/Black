# 📱 AndarBem - App de Caminhada com GPS

> **Aplicativo móvel híbrido para rastreamento de caminhadas com GPS em tempo real, métricas detalhadas e funcionalidade offline completa.**

![Ionic](https://img.shields.io/badge/Ionic-8.0.0-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-20.0.0-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4.4-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)

---

## 🎯 **Status do Projeto**

### ✅ **IMPLEMENTADO E FUNCIONAL**
- 🗺️ **Rastreamento GPS em tempo real** com Mapbox e modo offline
- 📊 **Métricas completas**: distância, tempo, passos, velocidade, calorias
- 📱 **Sistema offline robusto** - funciona sem internet
- 📸 **Câmera integrada** com captura durante atividades
- 🔦 **Controle de lanterna** para caminhadas noturnas
- 📈 **Histórico completo** com todas as atividades salvas
- 🏆 **Sistema de conquistas** gamificado
- 🎨 **Interface responsiva** otimizada para mobile
- 👤 **Sistema de usuário guest** (funciona sem login)
- 🔄 **Sincronização automática** de dados

### 🚧 **EM DESENVOLVIMENTO**
- 🔐 **Telas de Login/Cadastro** (estrutura pronta, precisa de UI)
- 🗄️ **Integração com Supabase** (configuração preparada)
- 🔄 **Sincronização online/offline** (base implementada)
- 📊 **Dashboard avançado** com estatísticas detalhadas

### 📋 **PRÓXIMOS PASSOS**
- 🔐 **Implementar telas de autenticação**
- 🗄️ **Conectar com banco de dados Supabase**
- 🔄 **Sistema de sincronização completo**
- 📱 **Notificações push**
- 🌐 **Compartilhamento social**

---

## 🏗️ **Arquitetura Atual**

### **📁 Estrutura de Componentes**
```
src/app/
├── components/
│   ├── offline-map/         ✅ Mapa Canvas offline
│   ├── splash-screen/       ✅ Tela de carregamento
│   └── theme-toggle/        ✅ Alternador de tema
├── pages/
│   ├── dashboard/           ✅ Tela inicial com estatísticas
│   ├── activity/            ✅ Rastreamento GPS em tempo real
│   ├── history/             ✅ Histórico de atividades
│   ├── profile/             ✅ Perfil do usuário
│   ├── settings/            ✅ Configurações do app
│   ├── maps/                ✅ Visualização de mapas
│   ├── achievements/        ✅ Sistema de conquistas
│   └── about/               ✅ Sobre o desenvolvedor
└── services/
    ├── activity.service.ts          ✅ Gerenciamento de atividades
    ├── geolocation.service.ts       ✅ GPS de alta precisão
    ├── pedometer.service.ts         ✅ Contagem de passos
    ├── accelerometer.service.ts     ✅ Sensores de movimento
    ├── storage.service.ts           ✅ Armazenamento offline
    ├── connectivity.service.ts      ✅ Status de conectividade
    ├── auth.service.ts              🚧 Autenticação (guest mode)
    ├── notification.service.ts      ✅ Notificações locais
    ├── voice-guide.service.ts       ✅ Guia de voz
    └── geo-sync.service.ts          🚧 Sincronização GPS
```

### **🔧 Serviços Implementados**

#### ✅ **GeolocationService**
- GPS de alta precisão (±25m)
- Funciona offline usando satélites
- Fallback automático para diferentes provedores
- Otimizado para economia de bateria

#### ✅ **ActivityService**
- Gerenciamento completo de atividades
- Armazenamento local robusto
- Cálculo automático de métricas
- Sistema de backup offline

#### ✅ **PedometerService + AccelerometerService**
- Detecção inteligente de passos
- Algoritmos de filtragem de ruído
- Fallback automático entre sensores
- Classificação de movimento

#### 🚧 **AuthService (Modo Guest Ativo)**
- Sistema de usuário guest funcional
- Estrutura pronta para login/cadastro
- Integração preparada para Supabase
- Gerenciamento de perfil

---

## 🛠️ **Stack Tecnológico**

### **📱 Frontend Mobile**
- **Ionic 8.0.0** - Framework híbrido multiplataforma
- **Angular 20.0.0** - Framework web moderno
- **TypeScript 5.8.0** - Linguagem tipada
- **SCSS** - Pré-processador CSS avançado

### **🔧 Runtime Nativo**
- **Capacitor 7.4.4** - Bridge para funcionalidades nativas
- **Android SDK** - Build para Android
- **iOS SDK** - Build para iOS (macOS)

### **🗺️ Mapas e Localização**
- **Mapbox GL JS 3.16.0** - Mapas interativos online
- **@capacitor/geolocation 7.1.5** - GPS nativo
- **Canvas HTML5** - Renderização offline

### **📱 Plugins Nativos**
```json
{
  "@capacitor/camera": "7.0.2",           // Câmera nativa
  "@capacitor/motion": "7.0.1",           // Acelerômetro/Giroscópio
  "@capgo/capacitor-flash": "7.1.14",     // Controle de lanterna
  "@capacitor/haptics": "7.0.2",          // Feedback tátil
  "@capacitor/local-notifications": "7.0.3", // Notificações
  "@capacitor/network": "7.0.2",          // Status de rede
  "@capacitor/preferences": "7.0.2"       // Armazenamento local
}
```

### **🎨 Interface e UX**
- **Ionicons 7.0.0** - Biblioteca de ícones
- **CSS Grid & Flexbox** - Layout responsivo
- **Animações CSS3** - Transições suaves
- **RxJS 7.8.0** - Programação reativa

---

## 🌐 **APIs e Integrações**

### ✅ **Mapbox API (Ativa)**
- **Token**: Configurado em `environment.ts`
- **Funcionalidades**:
  - Mapas vetoriais de alta qualidade
  - Tiles customizáveis
  - Geocodificação reversa
  - Estilos de mapa personalizados

### 🚧 **Supabase (Preparado)**
- **Configuração**: `environment.ts` (URLs placeholder)
- **Recursos preparados**:
  - Autenticação JWT
  - Banco PostgreSQL
  - Storage de arquivos
  - Real-time subscriptions

### ✅ **APIs Nativas**
- **GPS/GNSS**: Localização satelital
- **Sensores**: Acelerômetro, giroscópio
- **Câmera**: Captura de fotos/vídeos
- **Storage**: Persistência local
- **Notificações**: Sistema nativo

---

## 📊 **Funcionalidades Detalhadas**

### 🗺️ **Sistema de Rastreamento**
- **GPS em tempo real** com precisão de ±25 metros
- **Mapas híbridos**: Mapbox online + Canvas offline
- **Rota visual** desenhada em tempo real
- **Métricas instantâneas**: distância, velocidade, altitude
- **Modo offline completo** sem necessidade de internet

### 📱 **Interface de Atividade**
- **Contagem regressiva** 3,2,1 para início
- **Controles intuitivos**: iniciar/pausar/finalizar
- **Métricas em tempo real** com design moderno
- **Câmera integrada** para registrar momentos
- **Lanterna** para caminhadas noturnas
- **Resumo detalhado** ao finalizar

### 📈 **Sistema de Dados**
- **Armazenamento offline** robusto
- **Histórico completo** de todas as atividades
- **Estatísticas consolidadas** por período
- **Sistema de conquistas** gamificado
- **Backup automático** quando online

---

## 🚀 **Instalação e Desenvolvimento**

### **1. Pré-requisitos**
```bash
# Instalar Node.js 18+
# Instalar Ionic CLI
npm install -g @ionic/cli

# Instalar Angular CLI
npm install -g @angular/cli
```

### **2. Configuração do Projeto**
```bash
# Clonar repositório
git clone https://github.com/thiago2k18/Black.git
cd Black

# Instalar dependências
npm install

# Configurar environment
# Editar src/environments/environment.ts
# Adicionar token do Mapbox
```

### **3. Execução**
```bash
# Desenvolvimento web
ionic serve

# Build Android
ionic capacitor add android
ionic capacitor run android

# Build iOS (macOS apenas)
ionic capacitor add ios
ionic capacitor run ios
```

---

## 🎯 **Próximos Passos de Desenvolvimento**

### **🔐 Fase 1: Autenticação (Próxima)**
- [ ] Criar telas de Login/Cadastro
- [ ] Integrar com Supabase Auth
- [ ] Implementar fluxo de recuperação de senha
- [ ] Sistema de validação de email

### **🗄️ Fase 2: Banco de Dados**
- [ ] Configurar Supabase Database
- [ ] Criar schema de usuários e atividades
- [ ] Implementar sincronização online/offline
- [ ] Sistema de backup automático

### **📱 Fase 3: Funcionalidades Avançadas**
- [ ] Notificações push
- [ ] Compartilhamento social
- [ ] Exportação de dados (GPX, KML)
- [ ] Análises avançadas de performance

### **🎨 Fase 4: UX/UI Melhorias**
- [ ] Modo escuro automático
- [ ] Animações avançadas
- [ ] Widgets personalizáveis
- [ ] Temas customizáveis

---

## 📋 **Configuração de Ambiente**

### **Environment Variables**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  mapbox: {
    accessToken: 'SEU_TOKEN_MAPBOX_AQUI'
  },
  supabase: {
    url: 'https://seu-projeto.supabase.co',
    anonKey: 'sua-chave-anonima-aqui'
  }
};
```

### **Capacitor Configuration**
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
    }
  }
};
```

---

## 🧪 **Testes e Qualidade**

### **Ferramentas Configuradas**
- ✅ **ESLint** - Linting de código
- ✅ **TypeScript** - Verificação de tipos
- ✅ **Jasmine + Karma** - Testes unitários
- ✅ **Angular Testing** - Testes de componentes

### **Cobertura Atual**
- 🟢 **Serviços críticos** testados
- 🟡 **Componentes** parcialmente testados
- 🔴 **E2E** não implementado ainda

---

## 👨‍💻 **Desenvolvedor**

**Tiago Ribeiro**
- 📧 **Email**: rthiagoribeiro866@gmail.com
- 🐙 **GitHub**: [@thiago2k18](https://github.com/thiago2k18)
- 📱 **Projeto**: AndarBem - App de Caminhada

---

## 📄 **Licença**

Este projeto está sob a licença **MIT**. Livre para uso, modificação e distribuição.

---

<div align="center">

### 🚀 **Status: FUNCIONAL E PRONTO PARA EXPANSÃO**

**O app já funciona completamente offline com todas as funcionalidades principais implementadas!**

**Próximo passo: Integração com banco de dados e sistema de login.**

</div>
