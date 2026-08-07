# Pipeline Expo → iPhone, privado e gratuito

**Instalar e atualizar o GuiGym no meu iPhone (iOS 26), de qualquer lugar do mundo, sem Expo Go, sem App Store, sem Mac e sem pagar o Apple Developer.**

> Documento de engenharia — viabilidade, arquitetura e plano faseado.
> Autor do plano: Claude (a pedido de Ricardo). Data: 2026-08-04.
> Status: **DRAFT para revisão.** Nada foi aplicado. Nenhuma decisão irreversível foi tomada.

---

## 0. Sumário executivo (leia isto primeiro)

**Veredito: é possível — mas com 4 limitações que a Apple impõe e que NÃO dá para remover no plano gratuito.** Nenhuma delas quebra o seu objetivo; todas mudam a *rotina*.

O seu fluxo desejado existe e é real:

```
VS Code → git push → GitHub Actions (runner macOS) → IPA unsigned
        → GitHub Releases + "fonte" JSON → SideStore no iPhone
        → assina no próprio aparelho com seu Apple ID grátis → instala/atualiza (dados preservados)
        → SideStore renova sozinho a cada 7 dias, no próprio iPhone
```

Com as suas 3 respostas (iOS **26**, **100% gratuito**, doc em **Markdown**), o desenho está fechado assim:

- **TrollStore está fora.** Ele daria instalação *permanente* (sem os 7 dias), mas a Apple corrigiu o furo (CoreTrust) a partir do iOS 17.0.1 — e segue corrigido no 18 e no 26. Seu aparelho não é elegível. Isso é decisivo e muda tudo: no iOS 26 gratuito **não existe** instalação permanente. Todo caminho gratuito passa por **re-assinatura periódica**.
- **O assinador é o SideStore, rodando no próprio iPhone.** Ele resigna o app com um certificado de desenvolvedor gerado a partir do seu Apple ID grátis. O GitHub só gera o `.ipa` **sem assinatura**; quem assina é o telefone, na hora de instalar e a cada refresh.
- **O computador só é necessário uma vez** (no setup inicial: parear o iPhone e instalar o SideStore). Depois disso o refresh é 100% no aparelho. Você reencosta num computador apenas se atualizar/resetar o iOS (o pareamento quebra).

**As 4 limitações do Apple ID grátis (impostas pela Apple, não contornáveis sem pagar):**

| # | Limitação | Efeito prático no seu caso | Contorno |
|---|-----------|----------------------------|----------|
| 1 | Certificado dura **7 dias** | O app "expira" e precisa ser re-assinado a cada 7 dias | SideStore faz isso sozinho no aparelho (precisa de Wi-Fi) |
| 2 | Máximo **3 apps** ativos ao mesmo tempo (incluindo o próprio SideStore) | Sobram 2 slots além do SideStore | **LiveContainer** roda seu app "dentro" dele e não gasta slot |
| 3 | **10 App IDs por semana** | Só incomoda em setup/troca de bundle id; no uso normal você reusa o mesmo | Não trocar de bundle id à toa |
| 4 | Refresh exige **Wi‑Fi** (+ a VPN local do SideStore) — **não funciona só no 4G/5G** | Em viagem, precisa de *algum* Wi‑Fi a cada <7 dias | Roteador de viagem / hotspot de um segundo aparelho |

E uma quinta, que não é limite de conta mas de plataforma: **iOS não builda no Windows.** Precisa de macOS/Xcode em algum lugar — resolvido de graça pelo **runner macOS do GitHub Actions**.

**Recomendação honesta (você pediu 100% grátis, e o plano respeita isso):** comece gratuito. Mas registre desde já que os **US$99/ano** eliminam as limitações #1 e #2 de uma vez (certificado de **1 ano** em vez de 7 dias, e fim do limite de 3 apps). Se o ritual de 7 dias te incomodar depois de algumas semanas, é o único gasto que remove ~90% do atrito recorrente. Sem empurrar — está detalhado na Seção 8 para você decidir com números.

---

## 1. As regras da Apple (o que é "lei da física" e o que dá para contornar)

Antes de arquitetar qualquer coisa, é preciso separar **o que é imposição da Apple** (imutável sem pagar ou sem exploit) do que é **escolha de ferramenta** (contornável com engenharia).

### 1.1 Imposto pela Apple no Apple ID grátis

- **Expiração de 7 dias do certificado/perfil de desenvolvimento.** Um Apple ID grátis emite um certificado de *free provisioning* que vale 7 dias; um Apple Developer pago vale 365 dias. Isto é da Apple, não do SideStore. ([Apple Developer — free vs paid](https://bitrig.com/blog/apple-developer-program-free-vs-paid), [SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **3 apps ativos simultâneos** por Apple ID grátis (o SideStore conta como um deles). ([SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **~10 App IDs novos por semana.** Cada bundle id distinto que você registra conta; reusar o mesmo não gasta. ([SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **Sem push notifications e sem in‑app purchase** com free provisioning. (Você marcou que não precisa disso.) ([free vs paid](https://bitrig.com/blog/apple-developer-program-free-vs-paid))
- **Máx. 3 dispositivos** no free vs 100 no pago. Irrelevante para 1 iPhone. ([free vs paid](https://bitrig.com/blog/apple-developer-program-free-vs-paid))

### 1.2 Imposto pela plataforma (independe de conta)

- **Build de iOS exige macOS + Xcode.** Não existe build de `.ipa` nativo no Windows. Contorno: runner macOS na nuvem (GitHub Actions).
- **Todo app precisa estar assinado para o iOS carregar.** Um `.ipa` "unsigned" não instala sozinho — ele precisa de um assinador no device (SideStore) que aplique um certificado válido antes do iOS aceitar.

### 1.3 Limitação da ferramenta (SideStore), não da Apple

- **Refresh precisa de Wi‑Fi + a VPN local** ("LocalDevVPN"); hoje não funciona só com dados móveis (issues [#1022](https://github.com/SideStore/SideStore/issues/1022) e [#1237](https://github.com/SideStore/SideStore/issues/1237)). Pode mudar em versões futuras, mas hoje é assim.
- **Pareamento quebra ao atualizar/resetar o iOS** — aí precisa refazer o pairing com um computador. ([Pairing File](https://docs.sidestore.io/docs/advanced/pairing-file))

### 1.4 O que a Apple corrigiu e você não pode mais usar

- **TrollStore (instalação permanente).** Explorava um bug do **CoreTrust** para instalar IPAs assinados de forma permanente, com entitlements arbitrários, sem expiração e sem refresh. **Corrigido a partir do iOS 17.0.1** e sem retorno no 18/26. Só funciona em iOS **14.0–16.6.1** (com faixas por chip) e **17.0** exato. Seu iOS 26 **não** é elegível. ([TrollStore GitHub](https://github.com/opa334/TrollStore), [The Apple Wiki](https://theapplewiki.com/wiki/TrollStore))

> **Implicação forte:** se algum dia você tiver um iPhone secundário travado em iOS ≤ 17.0, ele vira o cenário perfeito (permanente, sem 7 dias, sem computador depois do setup). Para o aparelho atual em iOS 26, esqueça TrollStore.

---

## 2. Por que os caminhos que você descartou (e alguns que parecem tentadores) ficam de fora

- **Expo Go** — descartado por você, e correto: é sandbox de desenvolvimento, não "seu app instalado".
- **PWA** — descartado por você. Fora do escopo.
- **App Store** — você não quer, e nem precisa (uso pessoal).
- **AltStore "clássico"** — funciona, mas depende do **AltServer** rodando num computador na **mesma rede** para re-assinar a cada 7 dias. Isso **viola** o seu requisito "sem computador ligado". O **SideStore** nasceu exatamente para remover essa dependência: faz o refresh no próprio iPhone. Por isso ele, e não o AltStore, é a base do plano.
- **AltStore PAL / marketplaces alternativos (DMA da União Europeia)** — só funcionam em território da UE e, para *distribuir seu próprio app*, exigem que o desenvolvedor entre no programa pago da Apple e pague a Core Technology Fee. Não é um caminho gratuito nem global. Menciono para completude; não é para você.
- **EAS Build (nuvem da Expo)** — ótimo, mas é orientado a builds **assinados** com credenciais (pressupõe conta de desenvolvedor e gestão de certificados). Para o seu fluxo, o que queremos é o **oposto**: um `.ipa` **unsigned** que o SideStore assina no device. O GitHub Actions entrega isso de graça e com controle total. (EAS continua sendo plano B se o Actions te der trabalho.)

---

## 3. Arquitetura recomendada

### 3.1 Diagrama do fluxo

```
┌────────────┐   git push    ┌────────────────────────┐
│  VS Code   │ ───────────▶  │  GitHub (repositório)  │
│ (Windows)  │               └───────────┬────────────┘
└────────────┘                           │ dispara workflow
                                         ▼
                          ┌──────────────────────────────┐
                          │  GitHub Actions — runner macOS │
                          │  expo prebuild → xcodebuild    │
                          │  (CODE_SIGNING_ALLOWED=NO)     │
                          │  empacota Payload/ → .ipa      │
                          └───────────┬───────────────────┘
                                      │ publica
                                      ▼
                    ┌──────────────────────────────────────┐
                    │ GitHub Releases (.ipa UNSIGNED)        │
                    │ + fonte AltSource JSON (versão nova)   │
                    └───────────┬──────────────────────────┘
                                │ SideStore lê a fonte
                                ▼
                    ┌──────────────────────────────────────┐
                    │  iPhone (iOS 26) — SideStore          │
                    │  assina NO APARELHO com Apple ID grátis│
                    │  instala/atualiza (dados preservados)  │
                    │  refresh automático a cada 7 dias      │
                    └──────────────────────────────────────┘
```

### 3.2 Quem faz o quê, e quando (o ponto que mais confunde)

- **O GitHub gera um `.ipa` SEM ASSINATURA.** É literalmente o seu app compilado (`.app`) dentro de uma pasta `Payload/`, zipado. Não tem certificado válido, não instala sozinho.
- **A assinatura acontece no iPhone, feita pelo SideStore**, em dois momentos: (a) quando você instala/atualiza, e (b) a cada refresh de 7 dias. O SideStore pega o `.ipa`, aplica **o seu certificado de desenvolvimento pessoal** (gerado pelo seu Apple ID grátis) e um **provisioning profile temporário** amarrado ao *UDID do seu iPhone + bundle id + seu Apple ID*, e só então o iOS aceita rodar. ([SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **Sim, o Apple ID grátis basta** para essa assinatura — dentro dos limites da Seção 1 (7 dias, 3 apps, 10 App IDs/semana).

Essa divisão de trabalho é o que torna o plano viável no Windows sem Mac e sem conta paga: **build unsigned na nuvem, assinatura delegada ao aparelho.**

---

## 4. As 4 possibilidades do seu brief, respondidas uma a uma

### Possibilidade 1 — Expo → GitHub → Actions → IPA → SideStore → iPhone
**Viável? Sim, inteiramente.** É exatamente a arquitetura recomendada.
- **Como:** Seções 3 e 7.
- **Limitações:** as 4 da Apple (Seção 1) + Wi‑Fi no refresh + minutos de CI (Seção 7.4).
- **Riscos:** SideStore é beta e pode quebrar em updates de iOS; anisette pode travar Apple ID se usar servidor compartilhado ruim; pareamento quebra ao atualizar iOS. (Seção 9.)
- **Custo:** US$0 se repositório público; se privado, cabe folgado na cota gratuita de minutos de macOS (Seção 7.4).
- **Dificuldades:** a mais chata é o build unsigned de Expo passar limpo no `xcodebuild` (pods, frameworks embarcados). Contornável com o patch de code signing (Seção 7.2).

### Possibilidade 2 — Unsigned IPA → SideStore instala
**Como gerar o unsigned IPA:** runner macOS roda `expo prebuild -p ios`, depois `xcodebuild ... CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO`, pega o `.app` compilado, coloca em `Payload/`, zipa como `.ipa`. (Detalhe na Seção 7.2. Projetos reais como uYouPlus/EeveeSpotify fazem exatamente isso em Actions. [ref](https://dev.to/oivoodoo/build-unsigned-ios-ipa-to-install-via-sideloadly-236f))
- **Quem assina:** o **SideStore, no iPhone**.
- **Quando:** no momento de instalar e a cada refresh.
- **O Apple ID grátis basta?** Sim, com os limites da Seção 1. O SideStore inclusive **re‑assina IPAs já assinados**; um IPA unsigned é o caso mais simples — ele aplica seu certificado por cima.

### Possibilidade 3 — Automação completa (git push → IPA → upload → instalo)
**Viável até o penúltimo passo, de forma automática; o último é um toque no aparelho (ou automático no refresh).**
- `git push` dispara o Actions → gera o `.ipa` → publica no **Releases** → atualiza o **JSON da fonte** (versão maior).
- O SideStore, que tem a sua fonte adicionada, **detecta que a versão subiu e oferece o update OTA**. ([App Sources](https://docs.sidestore.io/docs/advanced/app-sources); AltStore/SideStore avisam quando o número de versão na fonte é maior que o instalado.)
- **O que não é 100% "sem toque":** aprovar o update final costuma ser um tap no SideStore. Instalação *totalmente* silenciosa de novas versões não é permitida pela plataforma no plano gratuito. Mas chega bem perto do seu ideal: você faz `git push` e, minutos depois, o iPhone te oferece a nova versão.

### Possibilidade 4 — Atualizações preservando dados
**Viável, com uma regra de ouro: mesmo Bundle ID + mesmo Apple ID + atualizar via SideStore (não apagar o app).**
- Instalar uma versão nova por cima **preserva** o container do app: **SQLite** (seu `expo-sqlite`, modo WAL), **AsyncStorage**, arquivos — tudo. A doc do SideStore confirma: reinstalar/atualizar o mesmo IPA "adiciona à sua lista de apps com seus dados intactos". ([SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **O que apaga os dados:** (a) mudar o **Bundle ID**; (b) **deletar** o app e reinstalar do zero; (c) assinar com um **Apple ID diferente** (o iOS passa a ver "outro app"). Portanto: **escolha o bundle id definitivo agora e nunca mais troque** (Seção 11).
- **Bundle ID se mantém** naturalmente — é você quem define no `app.json`/`app.config`. Refresh e updates não mexem nele.

---

## 5. SideStore por dentro (o deep dive que você pediu — não é tutorial)

### 5.1 Como ocorre a assinatura
Ao logar com seu Apple ID, o SideStore fala com o portal de desenvolvedor da Apple e gera **um certificado de desenvolvimento pessoal** e um **provisioning profile temporário** amarrado a `UDID do iPhone + bundle id + Apple ID`. Na instalação e em cada refresh, ele **resigna** o `.ipa` com esse certificado e injeta o profile. O iOS então trata o app como um build de desenvolvimento legítimo seu. ([SideStore FAQ](https://docs.sidestore.io/docs/faq))

### 5.2 Anisette (a peça de autenticação)
A Apple exige, no login, um conjunto de dados de "máquina" (headers **anisette**) que normalmente só um Mac produz. O SideStore obtém isso de um **servidor anisette** que "finge ser um Mac" (por isso você vê um "iMac/MacBook fantasma" adicionado à conta — é gerado, não é um Mac real, e nenhum dado privado é enviado). Hoje é **Anisette V3**, que reduz travamentos. **Cuidado:** servidores anisette públicos e sobrecarregados são a causa nº 1 de **bloqueio temporário do Apple ID**. A recomendação oficial é usar os servidores oficiais **ou hospedar o seu próprio** (`anisette-v3-server`). ([Custom Anisette Server](https://docs.sidestore.io/docs/advanced/anisette), [FAQ](https://docs.sidestore.io/docs/faq))

### 5.3 Pareamento (pairing file)
O **arquivo de pareamento** é o que autoriza o SideStore a conversar com o serviço interno de instalação do iOS. É gerado **uma vez**, conectando o iPhone a um computador (no Windows, tipicamente via `jitterbugpair` ou o instalador do próprio SideStore). Depois disso o telefone se vira sozinho. **Ele expira se você atualizar ou resetar o iPhone** — então uma atualização de iOS obriga a refazer o pairing num computador. ([Pairing File](https://docs.sidestore.io/docs/advanced/pairing-file))

### 5.4 A VPN (LocalDevVPN, ex‑StosVPN/WireGuard)
Para instalar/refazer a assinatura sem um computador, o SideStore sobe uma **VPN local** ([LocalDevVPN](https://apps.apple.com/us/app/localdevvpn/id6755608044)) que só conecta o aparelho **a ele mesmo** (loopback). Isso "engana" o iOS, fazendo o serviço de instalação (que espera falar com um computador pareado) falar com o próprio SideStore. Como não há servidor remoto, **não drena bateria e não rastreia nada**. ([FAQ](https://docs.sidestore.io/docs/faq))

### 5.5 O refresh e "o que expira em 7 dias"
O que expira é o **certificado/perfil de desenvolvimento** do Apple ID grátis (Seção 1). O **refresh** re‑assina o app dentro dessa janela, zerando o contador para +7 dias. O SideStore mostra um número ("7", "6", …) por app e faz o refresh **em background**, desde que haja **Wi‑Fi + LocalDevVPN ativos**. Ele **não** faz refresh só com dados móveis hoje (issues [#1022](https://github.com/SideStore/SideStore/issues/1022), [#1237](https://github.com/SideStore/SideStore/issues/1237)). Se o app passar de 7 dias sem refresh, **para de abrir** até você re‑assinar (os dados continuam lá; é só re‑assinar).

### 5.6 Limites de App ID, certificado e instalações
- **App IDs:** ~10 novos/semana. No uso normal (mesmo bundle id) você **não** gasta cota; ela só pesa em setup e trocas.
- **Certificado:** um por conta no free; o SideStore rotaciona conforme necessário.
- **Apps ativos:** 3, contando o SideStore. Com 1 app pessoal, você usa 2 slots (SideStore + GuiGym) e sobra 1.

### 5.7 Furar o limite de 3 apps: LiveContainer
Novidade forte de 2026: o **LiveContainer** roda outros apps **dentro dele** (como "convidados"). A Apple vê **um** app; você roda vários. Você assina só o LiveContainer (gasta 1 slot); os apps internos **não consomem slot nem App ID**. Ele integra com o SideStore e **suporta iOS 26** (v3.7.0+). ([LiveContainer + SideStore](https://builds.io/blog/technologies/ios-technologies/sidestore-live-container-guide-2026-free-sideloading/), [SideStore FAQ](https://docs.sidestore.io/docs/faq))
- **Para você, é opcional:** com um único app pessoal, o limite de 3 nem morde. O LiveContainer vale a pena se (a) você quiser rodar vários apps sideloaded, ou (b) quiser reduzir a fricção de gerenciamento. Fica registrado como alavanca, não como obrigação.

### 5.8 JIT
JIT (compilação just‑in‑time) só importa para apps que dependem dela (emuladores, alguns runtimes). **Um build de release do seu app Expo/React Native não precisa de JIT.** Se algum dia precisar: iOS ≤16 ativa JIT direto no SideStore; iOS 17.4+ usa StikDebug/SideStore 0.6.2. ([FAQ](https://docs.sidestore.io/docs/faq))

### 5.9 Viagens longas (o seu "de qualquer lugar do mundo")
- **Boa notícia:** o SideStore **não** te prende à sua rede de casa nem a um computador específico (essa era a limitação do AltStore). Ele faz refresh em **qualquer Wi‑Fi do mundo**.
- **A pegadinha:** hoje ele exige **algum Wi‑Fi** a cada <7 dias; **só 4G/5G não basta** (Seção 5.5). Em hotel/café/Airbnb isso é trivial. Numa viagem *sem nenhum Wi‑Fi por mais de 7 dias*, o app expira.
- **Contornos:** (a) um **roteador de viagem** que transforma cabo/USB em Wi‑Fi; (b) **hotspot de um segundo aparelho** (outro celular/tablet) — o iPhone se conecta ao Wi‑Fi desse hotspot e o refresh roda; (c) **refresh manual preventivo** antes de embarcar; (d) o caminho definitivo: **US$99** → certificado de 1 ano → você só reencostaria nisso uma vez por ano.

---

## 6. IPA por dentro: assinado vs unsigned (o outro deep dive que você pediu)

| Aspecto | **Unsigned IPA** | **Signed IPA** |
|---|---|---|
| O que é | `.app` compilado dentro de `Payload/`, zipado. Sem certificado válido | O mesmo, porém com certificado + provisioning embutidos |
| Instala sozinho? | **Não** — precisa de um assinador no device | Sim, se assinado com certificado aceito pelo device |
| Quem gera | `xcodebuild` com signing desligado, ou zip manual do `.app` | `xcodebuild`/EAS com credenciais de assinatura |
| Precisa Apple Developer? | **Não** para gerar | Sim (grátis ou pago) para assinar |
| Papel no seu fluxo | **É o que o GitHub produz** | É o que o **SideStore produz no iPhone** |

- **Quem gera cada um:** o unsigned sai do runner macOS (Actions). O signed, no seu caso, é produzido **no aparelho** pelo SideStore, não no CI.
- **Quando é necessário Apple Developer:** só para *assinar*. Como a assinatura é delegada ao SideStore (Apple ID grátis), o CI não precisa de conta paga nem de chaves.
- **Ferramentas por tipo:**
  - Unsigned: `xcodebuild` (macOS) → o mais controlável e o que usaremos; ou serviços que empacotam `.app` cru.
  - Signed: `xcodebuild` com keychain/profile, **EAS Build** (nuvem), Xcode local.
- **Expo vs React Native "puro":** depois do `expo prebuild`, seu projeto **é** um projeto iOS nativo (Xcode workspace + Pods). Daí para frente o caminho é idêntico ao de um RN puro. Ou seja, tudo aqui vale para os dois.
- **Windows não gera nenhum dos dois** localmente (sem Xcode). Por isso o runner macOS é inegociável — mas ele é gratuito.

---

## 7. Pipeline GitHub Actions (implementação de REFERÊNCIA — não aplicar ainda)

> Isto é para você entender a forma final. **Não cole no projeto agora** — a aplicação real acontece na Fase 3, com uma edição de cada vez, do jeito que você trabalha.

### 7.1 Ambiente
- Runner `macos-14` ou `macos-15` (Xcode pré-instalado).
- Node LTS, `npm ci`, CocoaPods (já vem no runner).

### 7.2 Passos conceituais do job
1. `checkout`.
2. Setup Node + `npm ci`.
3. `npx expo prebuild --platform ios --no-install` (gera a pasta `ios/`).
4. `pod install` dentro de `ios/`.
5. **Patch de code signing** no `Podfile` (post_install) e/ou via flags do `xcodebuild`: `CODE_SIGNING_ALLOWED=NO`, `CODE_SIGNING_REQUIRED=NO`, `CODE_SIGN_IDENTITY=""`, `PROVISIONING_PROFILE_SPECIFIER=""`. (É o passo que faz o build passar sem conta de assinatura — [padrão conhecido em CI](https://irensaltali.com/fix/expo-no-code-signing-certificates-available/).)
6. `xcodebuild -workspace ios/GuiGym.xcworkspace -scheme GuiGym -configuration Release -sdk iphoneos -derivedDataPath build CODE_SIGNING_ALLOWED=NO` (build, sem archive/export para evitar a etapa de assinatura do export).
7. Empacotar: pegar `build/Build/Products/Release-iphoneos/GuiGym.app` → colocar em `Payload/` → `zip -r GuiGym.ipa Payload`.
8. `upload-artifact` (para baixar manualmente) **e/ou** publicar em **GitHub Releases**.
9. **Atualizar o JSON da fonte** (Seção 7.3) com a nova versão e a URL do `.ipa`.

### 7.3 A "fonte" (AltSource JSON) — o que fecha a automação
O SideStore consome o **formato AltStore Source**: um JSON com nome do app, bundle id, e uma lista de versões (número, data, changelog, **URL do `.ipa`**). Quando o número de versão no JSON fica **maior** que o instalado, o SideStore **oferece o update OTA**. ([App Sources](https://docs.sidestore.io/docs/advanced/app-sources), [formato AltSource](https://faq.altstore.io/developers/make-a-source))
- Hospedagem: **GitHub Pages** ou a URL "raw" do próprio repositório — grátis.
- Adicionar no SideStore uma vez via `sidestore://source?url=<url-do-json>`.
- Ferramenta que gera o JSON a partir do `.ipa`: **AltStudio** (atenção ao remover os campos `marketplaceID`/`Build` autogerados, senão o SideStore acha que é fonte "notarizada" e recusa — [aviso oficial](https://docs.sidestore.io/docs/advanced/app-sources)).

### 7.4 Custo de minutos (importante para repo privado)
- **Repo público:** minutos de Actions **ilimitados/gratuitos**, inclusive macOS. Mas o código fica público (o `.ipa` no Releases também).
- **Repo privado:** cota mensal gratuita de minutos, e **macOS consome 10× mais rápido** que Linux. Um build de RN leva ~10–20 min; cabe em poucas dezenas de builds/mês na cota. Se estourar, ou espaça os builds, ou paga por minuto, ou usa repo público só para o artefato. **Decisão da Seção 11.**

### 7.5 Onde o Expo pode dar trabalho
O build unsigned de Expo às vezes falha no `xcodebuild` por causa de frameworks embarcados/pods que querem assinatura ([ex.: expo/expo #36486](https://github.com/expo/expo/issues/36486)). O patch da etapa 5 resolve a maioria; o restante é caso a caso na Fase 3. Plano B: **EAS Build** com um perfil de distribuição interna (aí entra gestão de credenciais).

---

## 8. Grátis vs US$99: a comparação honesta (você pediu 100% grátis; aqui está o custo real dessa escolha)

| | **Apple ID grátis (seu plano)** | **Apple Developer US$99/ano** |
|---|---|---|
| Validade do certificado | **7 dias** | **365 dias** |
| Refresh recorrente | A cada 7 dias (automático no SideStore, se houver Wi‑Fi) | ~1×/ano |
| Limite de apps | **3** (LiveContainer contorna) | Sem limite prático (100 devices) |
| App IDs | ~10/semana | Amplo |
| Atrito em viagem >7 dias | Precisa de Wi‑Fi periódico | Praticamente nenhum |
| Build no CI | Igual (unsigned) | Igual (pode assinar no CI se quiser) |
| Custo | **US$0** | **US$99/ano** |

**Leitura de engenharia:** o pipeline de build (a parte "difícil") é **idêntico** nos dois. O que os US$99 compram não é capacidade — é **remoção de ritual**: some o refresh de 7 dias e o limite de 3 apps. Para um app pessoal que você usa todo dia, isso é conveniência real; para um projeto que você topa "cuidar" a cada semana, o grátis entrega 100% do objetivo. **Fica com o grátis como decidido, e trate os US$99 como um "botão de conforto" disponível a qualquer momento — a migração de um para o outro não muda a arquitetura.**

---

## 9. Riscos gerais e armadilhas conhecidas

- **Bloqueio de Apple ID por anisette ruim.** Mitigação: usar anisette oficial ou self‑hosted; nunca servidor público duvidoso. ([FAQ](https://docs.sidestore.io/docs/faq))
- **Pareamento quebra em update de iOS.** Toda atualização do iOS 26.x pode exigir re‑pairing com computador. Planeje atualizações de iOS para quando tiver o PC à mão.
- **SideStore é beta.** Updates de iOS podem quebrar temporariamente o refresh/JIT até saírem correções (nightly). Não atualize o iOS por impulso.
- **Bundle ID é imutável de fato.** Trocar = perder todos os dados locais. Decidir agora (Seção 11).
- **Assinar com Apple ID diferente = app "novo"** = perda de dados. Use sempre a mesma conta.
- **Minutos de CI em repo privado.** Pode estourar cota (Seção 7.4).
- **Apple pode fechar brechas.** O ecossistema (SideStore/LiveContainer/anisette) depende de comportamentos que a Apple pode mudar. Risco baixo-médio e contínuo; o plano gratuito é sempre "melhor esforço".
- **Conta pessoal vs conta descartável.** Alguns preferem um Apple ID secundário só para sideload, para isolar risco de bloqueio da conta principal. Decisão pessoal (Seção 11).

---

## 10. Plano faseado

> Metodologia: **não avance sem validar a fase anterior.** Cada fase tem objetivo, riscos, dependências, critérios de sucesso, rollback e próximos passos.

### Fase 0 — Auditoria e pré-requisitos
- **Objetivo:** confirmar terreno. Versão exata do iOS 26; modelo do iPhone; UDID; `app.json` (bundle id atual, nome, ícones); build de release local roda? (via prebuild). Confirmar Apple ID a usar.
- **Riscos:** bundle id "provisório" que vira definitivo sem querer.
- **Dependências:** nenhuma.
- **Critérios de sucesso:** ter numa folha: iOS, modelo, UDID, bundle id **definitivo**, Apple ID escolhido, decisão repo público/privado.
- **Rollback:** n/a (só levantamento).
- **Próximos passos:** fechar as decisões da Seção 11.

### Fase 1 — Escolha da arquitetura (fechar decisões)
- **Objetivo:** transformar este documento em decisões travadas (Seção 11): grátis vs $99 (já: grátis), com/sem LiveContainer, anisette oficial vs self‑host, repo público vs privado, Apple ID principal vs secundário.
- **Riscos:** decidir por inércia.
- **Dependências:** Fase 0.
- **Critérios de sucesso:** Seção 11 preenchida e assinada por você.
- **Rollback:** rever decisões antes de qualquer setup.
- **Próximos passos:** Fase 2.

### Fase 2 — Setup do SideStore (o alicerce)
- **Objetivo:** SideStore instalado e funcional; validar o conceito com **um IPA de teste** (não o seu app ainda) — instalar, refazer, ver o contador de 7 dias.
- **Riscos:** anisette/lockout; pairing.
- **Dependências:** um computador **uma vez** (Windows serve); seguir o [guia oficial de instalação](https://docs.sidestore.io/docs/installation/prerequisites).
- **Critérios de sucesso:** app de teste abre, refresh manual funciona, refresh em background funciona no Wi‑Fi.
- **Rollback:** remover SideStore; sem efeito colateral no iPhone.
- **Próximos passos:** Fase 3.

### Fase 3 — Pipeline de build unsigned
- **Objetivo:** um workflow que, ao rodar, produz um `.ipa` **unsigned** baixável do GuiGym.
- **Riscos:** build Expo falhar no signing (Seção 7.5).
- **Dependências:** Fase 0 (bundle id/scheme).
- **Critérios de sucesso:** baixar o `.ipa` do Actions e instalá‑lo **manualmente** pelo SideStore; app abre no iPhone.
- **Rollback:** desabilitar o workflow; nada afetado.
- **Próximos passos:** Fase 4.

### Fase 4 — Distribuição / OTA (fonte AltSource)
- **Objetivo:** publicar `.ipa` no Releases + JSON de fonte; adicionar a fonte no SideStore; ver o update aparecer OTA.
- **Riscos:** JSON malformado; campos notarizados que fazem o SideStore recusar (Seção 7.3).
- **Dependências:** Fase 3.
- **Critérios de sucesso:** subir a versão no JSON → SideStore oferece update → instala preservando dados.
- **Rollback:** remover a fonte; continuar instalando `.ipa` manualmente.
- **Próximos passos:** Fase 5.

### Fase 5 — Migração do GuiGym (com dados reais)
- **Objetivo:** adotar o bundle id **definitivo**, fazer o primeiro sideload "de verdade", validar persistência de SQLite/AsyncStorage entre duas versões.
- **Riscos:** troca de bundle id depois = perda de dados.
- **Dependências:** Fases 3–4.
- **Critérios de sucesso:** instalar v1, gerar dados, publicar v2, atualizar, **dados intactos**.
- **Rollback:** manter `.ipa` da versão anterior para reinstalar.
- **Próximos passos:** Fase 6.

### Fase 6 — Automação (git push → OTA)
- **Objetivo:** `git push` (ou tag) dispara build → publica → atualiza JSON → SideStore oferece update.
- **Riscos:** minutos de CI; versionamento automático inconsistente.
- **Dependências:** Fases 3–5.
- **Critérios de sucesso:** um push resulta, sem passos manuais no PC, em update oferecido no iPhone.
- **Rollback:** voltar a disparar o workflow manualmente.
- **Próximos passos:** Fase 7.

### Fase 7 — Manutenção e viagens
- **Objetivo:** rotina sustentável: refresh dos 7 dias tranquilo; plano para viagens sem Wi‑Fi; procedimento de re‑pairing pós‑update de iOS.
- **Riscos:** >7 dias sem Wi‑Fi; update de iOS sem PC por perto.
- **Dependências:** todas.
- **Critérios de sucesso:** 30 dias de uso sem o app expirar inesperadamente; checklist de viagem definido.
- **Rollback:** refresh manual; reinstalar `.ipa` do Releases se necessário.
- **Próximos passos:** reavaliar US$99 se o atrito incomodar.

---

## 11. Decisões a fechar antes da Fase 2 (perguntas em aberto)

1. **Bundle ID definitivo** (imutável — trocar apaga dados). Sugestão: algo estável como `com.ricardoalves.guigym`. **Qual você quer?**
2. **Repo público vs privado.** Público = minutos ilimitados, mas código e `.ipa` públicos. Privado = código fechado, mas cota de minutos macOS. Você citou "não tornar público" — provável **privado**; então precisamos dimensionar minutos (Seção 7.4). **Confirma privado?**
3. **Anisette:** começar com servidor **oficial** (mais simples) e migrar para **self‑hosted** só se houver lockout? (recomendado começar oficial.)
4. **LiveContainer:** entra agora ou fica como plano futuro? (Com 1 app, recomendo **não** agora.)
5. **Apple ID:** usar o principal ou criar um **secundário** só para sideload (isola risco de bloqueio)? (recomendo secundário.)
6. **US$99:** confirmado **fora por enquanto**; tratado como botão de conforto futuro.

---

## 12. Fontes

- SideStore — FAQ (assinatura, limites, anisette, VPN, dados preservados, JIT): https://docs.sidestore.io/docs/faq
- SideStore — App Sources (fonte AltSource, updates OTA): https://docs.sidestore.io/docs/advanced/app-sources
- SideStore — Custom Anisette Server: https://docs.sidestore.io/docs/advanced/anisette
- SideStore — LocalDevVPN (App Store): https://apps.apple.com/us/app/localdevvpn/id6755608044
- SideStore — refresh precisa de Wi‑Fi (issues): https://github.com/SideStore/SideStore/issues/1022 · https://github.com/SideStore/SideStore/issues/1237
- TrollStore — compatibilidade/CoreTrust: https://github.com/opa334/TrollStore · https://theapplewiki.com/wiki/TrollStore
- LiveContainer + SideStore (bypass 3 apps, iOS 26): https://builds.io/blog/technologies/ios-technologies/sidestore-live-container-guide-2026-free-sideloading/
- Apple Developer grátis vs pago (7 dias vs 365, 3 vs 100 devices): https://bitrig.com/blog/apple-developer-program-free-vs-paid
- Build unsigned IPA em GitHub Actions (padrão real): https://dev.to/oivoodoo/build-unsigned-ios-ipa-to-install-via-sideloadly-236f
- Expo prebuild / code signing em CI: https://irensaltali.com/fix/expo-no-code-signing-certificates-available/ · https://github.com/expo/expo/issues/36486
- Formato AltStore Source (referência do JSON): https://faq.altstore.io/developers/make-a-source

---

> **Próximo passo sugerido:** revisar este draft e responder às 6 decisões da Seção 11. Nada será aplicado no projeto até você fechá‑las. Quando fechar, começamos pela **Fase 2** (setup do SideStore) — ou pela **Fase 3** (pipeline), se preferir validar o build antes do aparelho.
