# BRASA — cardápio digital

Cardápio digital + painel de gestão, em HTML, CSS e JavaScript puros. Sem build, sem framework,
sem dependência externa em tempo de execução. O pedido é finalizado no WhatsApp do restaurante,
sem comissão de marketplace.

- **Cardápio do cliente:** `/`
- **Painel do restaurante:** `/admin.html` (código inicial **7777**)

---

## 1. Rodar na sua máquina

Não precisa instalar nada além de um servidor estático. Pela raiz do projeto:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Abra `http://localhost:8000`. Os caminhos dos arquivos são absolutos (`/assets/...`),
então **não funciona abrindo o index.html direto pelo Finder/Explorer** — precisa de um servidor.

## 2. Publicar na Vercel

O projeto é 100% estático; não há passo de build.

**Pelo site (sem terminal):** crie um projeto novo na Vercel, aponte para o repositório,
e deixe *Framework Preset* em **Other**, *Build Command* vazio e *Output Directory* vazio.

**Pelo terminal:**

```bash
npm i -g vercel
vercel          # pré-visualização
vercel --prod   # produção
```

`vercel.json` já cuida de cache longo para fontes e imagens, revalidação para CSS/JS,
`cleanUrls` e cabeçalhos básicos de segurança.

**Domínio próprio:** Project → Settings → Domains. Depois troque `https://brasa.example/`
em `index.html` (`<link rel="canonical">`), `robots.txt` e `sitemap.xml` pelo domínio real.

## 3. Antes de usar com clientes de verdade

Três coisas, nesta ordem:

1. **Trocar o WhatsApp.** Painel → *Loja* → "WhatsApp que recebe os pedidos". Enquanto for o número
   de exemplo (`5511999999999`), o painel mostra um aviso e o checkout avisa o cliente que é demonstração.
2. **Conferir horários, bairros e taxas.** Painel → *Loja*.
3. **Trocar o código do painel.** Painel → *Dados* → "Código de acesso".

## 4. Transformar em outro restaurante

Tudo que identifica a casa está em **um arquivo**: `assets/js/config.js`. Nenhum outro arquivo
cita o nome do restaurante — nem as chaves de armazenamento.

| O que trocar | Onde |
| --- | --- |
| Nome, slogan, textos, logo | `SEED.brand` |
| Cores | `SEED.theme` (ou Painel → *Visual*, que grava nas mesmas variáveis) |
| WhatsApp, telefone, Instagram, endereço, mapa | `SEED.contact` |
| Horários | `SEED.hours` (`day: 0` = domingo) |
| Entrega, retirada, bairros, taxas, pedido mínimo | `SEED.service` |
| Formas de pagamento e chave Pix | `SEED.payments`, `SEED.pixKey` |
| Categorias, produtos, variações, adicionais | `SEED.categories`, `SEED.products`, `SEED.addonGroups` |

Passo a passo:

1. Copie a pasta inteira.
2. Edite `SEED.brand` e `SEED.theme` em `assets/js/config.js`.
3. Troque a logo em `assets/img/` (`logo-brasa.png` para fundo escuro, `logo-brasa-light.png`
   para fundo claro, `mark-brasa.png` para o símbolo) e gere os ícones
   (`icon-64/180/192/512.png`) a partir do símbolo.
4. Troque as fotos em `assets/img/p/`. Cada produto precisa de dois arquivos:
   `nome.webp` (760×760) e `nome-sm.webp` (320×320), **quadrados, com o prato centralizado
   e fundo branco de estúdio** — o ladrilho da foto no card também é branco, então o fundo
   da foto vira o ladrilho e a emenda some. No `config.js`, `img: 'nome'`.
   Se preferir um catálogo mais quente, troque `--photo-bg` em `tokens.css` para o creme
   da marca (`#F4E8D4`) — aí as fotos precisam ter o fundo nesse mesmo creme.
5. Reescreva `SEED.products`. **Preços são sempre inteiros em centavos** (`3200` = R$ 32,00).
   Nunca use ponto flutuante.
6. Suba o `SCHEMA_VERSION` em uma unidade — isso descarta o cardápio que ficou salvo no
   navegador de quem já tinha visitado e recarrega o novo.
7. Ajuste `index.html`: `<title>`, `description`, as tags Open Graph, o JSON-LD do
   restaurante e `assets/img/og.jpg`.

Também dá para fazer quase tudo isso sem editar código: Painel → *Visual* para as cores e a marca,
*Loja* para os dados, *Cardápio* para produtos, e *Dados* → "Baixar backup" / "Restaurar backup"
para levar um cardápio pronto de um aparelho para outro.

## 5. Arquitetura

```
index.html          cardápio (casca estática + skeleton, antes do JS carregar)
admin.html          painel
vercel.json         cache e cabeçalhos
assets/
  css/  tokens.css  ← único arquivo com cor literal; trocar aqui re-tematiza tudo
        fonts.css   Archivo + Overpass Mono, auto-hospedadas
        base.css    camada de plataforma mobile, tipografia, componentes
        menu.css / admin.css
  js/   config.js   TODA a identidade e o catálogo deste restaurante
        store.js    repositório (driver localStorage) + horários + pedidos
        cart.js     dinheiro em centavos, carrinho, totais, troco
        whatsapp.js monta a mensagem do pedido
        ui.js       toasts, bottom sheets com arrastar-para-fechar, odômetro
        menu.js     aplicação do cardápio
        admin.js    aplicação do painel
        art.js      desenhos vetoriais (só para produto sem foto)
        icons.js    ícones autorais
  img/p/            fotos recortadas, 320w e 760w WebP
  fonts/            woff2 auto-hospedadas
dev/fixtures.js     dados de pior caso (só carrega com ?data=, nunca em produção)
```

**Dinheiro.** Todo valor é inteiro em centavos, do catálogo ao total. `brl()` em `cart.js` é o
único lugar que transforma número em texto. Isso evita o clássico `0.1 + 0.2`.

**Dados.** O app conversa com `store.js`; `store.js` conversa com um *driver*. O driver de hoje é
`localStorage`, mas a interface é `async` de propósito: trocar por Supabase/Postgres é escrever um
segundo driver com os mesmos quatro métodos (`load`, `save`, `clear`), não reescrever o app.

**Testar com dados ruins.** `?data=worst`, `?data=empty`, `?data=one`, `?data=300`
(também em `/admin.html?data=worst`) carregam fixtures de estresse e mostram um seletor no rodapé.
Sem o parâmetro, o arquivo nem é baixado.

## 6. O que ainda não existe (e como ligar)

Nada na interface é decorativo: o que não funciona está rotulado como não integrado,
no próprio painel, em *Dados* → "O que ainda não existe".

| Falta | Caminho |
| --- | --- |
| **Pedidos em tempo real entre aparelhos** | Hoje o pedido vai pelo WhatsApp e fica gravado no navegador de quem pediu. Para uma fila de pedidos de verdade: criar tabelas `tenants`, `products`, `orders` no Supabase e escrever um driver em `store.js` com `load`/`save`/`clear` chamando o client do Supabase. Nenhum outro arquivo muda. |
| **Login de verdade** | O código de 4 dígitos é uma trava local contra toque acidental, não segurança — e o painel diz isso ao usuário. Com backend: Supabase Auth + RLS por `tenant_id`. |
| **Pagamento on-line** | Não há cobrança nem simulação de cobrança. Para integrar: Mercado Pago, Stripe ou Pagar.me, criando a preferência no checkout e confirmando por webhook. O ponto de integração está marcado em `config.js` → `onlinePayment`. |
| **Upload de foto pelo painel** | Hoje o campo aceita o endereço de uma imagem já hospedada. Com backend: Supabase Storage. |
| **Multi-restaurante (SaaS)** | A arquitetura não bloqueia: identidade, catálogo, WhatsApp, taxas e horários já são dados de um único objeto. O caminho é `tenant_id` em todas as tabelas + um subdomínio ou rota por restaurante. |

## 7. Acessibilidade e performance

- Contraste conferido em AA (4,5:1) em todas as combinações de texto e fundo — o painel
  recalcula isso ao vivo quando você mexe nas cores e avisa se cair abaixo.
- Alvos de toque de 44px, foco visível, campos rotulados com mensagens de erro reais,
  `prefers-reduced-motion` respeitado, estado nunca comunicado só por cor.
- Fontes auto-hospedadas (47 KB), fotos em WebP com `srcset` e `lazy`, zero requisição a terceiros,
  zero JavaScript de framework.

## 8. Licenças

- **Archivo** e **Overpass Mono** — SIL Open Font License 1.1 (`assets/fonts/OFL-*.txt`).
- Logo, fotos e nome BRASA são do cliente.
- Dados de exemplo (endereço, telefone, chave Pix, bairros) são fictícios e precisam ser trocados.
