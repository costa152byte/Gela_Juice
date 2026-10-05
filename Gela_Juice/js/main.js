/* =================================================================
   GELA JUICE — main.js
   Organizado por responsabilidade (Clean Code):
   - Config
   - Dados de produtos
   - Utilitários
   - Carrinho (state + persistência)
   - Renderização (produtos / carrinho)
   - Filtros
   - Checkout via WhatsApp
   - Interações de UI (menu, drawer, scroll, animações)
   ================================================================= */

/* =================================================================
   1. CONFIGURAÇÃO — ALTERE AQUI
   ================================================================= */

// Número de WhatsApp da loja (formato internacional, sem espaços/símbolos)
const WHATSAPP_NUMBER = "556199893803";

// Configurações da loja — edite conforme os dados reais
const STORE_CONFIG = {
  address: "QR 629 conjunto 3 casa 5",
  city: "Brasília - DF",
  mapsUrl: "https://maps.app.goo.gl/TQ5a5zDrREUTCkM56",
  instagram: "https://www.instagram.com/gelajuice?stkn=OTc0N3dwMWNtbWo1",
};

/* =================================================================
   2. DADOS DE PRODUTOS
   Fictícios e fáceis de editar. Basta alterar preço, nome, imagem
   ou adicionar novos itens ao array abaixo.
   category: "acai" | "sucos" | "salgados"
   featured: true = aparece em "Os queridinhos da Gela"
   pairing: true = aparece em "Para acompanhar"
   ================================================================= */
const products = [
  // AÇAÍ
  { id: 1, name: "Açaí 300ml", category: "acai", description: "Açaí cremoso e refrescante.", price: 14.90, image: "img/acai/acai-300.png", featured: false },
 // { id: 2, name: "Açaí 500ml", category: "acai", description: "Cremoso, refrescante e cheio de sabor.", price: 18.90, image: "img/acai/acai-500.webp", featured: true },
 // { id: 3, name: "Açaí 700ml", category: "acai", description: "Para quem quer aproveitar ainda mais.", price: 24.90, image: "img/acai/acai-700.webp", featured: false },
  { id: 4, name: "Açaí na Garrafa", category: "acai", description: "Praticidade para levar para qualquer lugar.", price: 13.90, image: "img/acai/acai-garrafa.webp", featured: true },

  // SUCOS NATURAIS
  { id: 5, name: "Suco de Laranja", category: "sucos", description: "Feito com laranjas selecionadas.", price: 8.00, image: "img/sucos/laranja.webp", featured: false },
  { id: 6, name: "Suco de Maracujá", category: "sucos", description: "Azedinho na medida certa.", price: 9.00, image: "img/sucos/maracuja.webp", featured: false },
 // { id: 7, name: "Suco de Acerola", category: "sucos", description: "Fresco e rico em vitamina C.", price: 8.00, image: "img/sucos/acerola.webp", featured: false },
  //{ id: 8, name: "Abacaxi com Hortelã", category: "sucos", description: "A combinação clássica que refresca.", price: 10.00, image: "img/sucos/abacaxi-hortela.webp", featured: true },
 // { id: 9, name: "Suco de Morango", category: "sucos", description: "Doce, natural e cheio de sabor.", price: 11.00, image: "img/sucos/morango.webp", featured: false },
  { id: 10, name: "Suco de Manga", category: "sucos", description: "Tropical e naturalmente doce.", price: 8.00, image: "img/sucos/manga.webp", featured: false },

  // SALGADOS
  { id: 11, name: "Pão pizza", category: "salgados", description: "Massa macia com recheio cremoso.", price: 5.00, image: "img/salgados/coxinha.webp", pairing: true },
  { id: 12, name: "Frango", category: "salgados", description: "Crocante por fora, saboroso por dentro.", price: 5.00, image: "img/salgados/pastel.webp", pairing: true },
  { id: 13, name: "carne", category: "salgados", description: "Massa amanteigada com recheio especial.", price: 5.00, image: "img/salgados/empada.webp", pairing: true },
  { id: 14, name: "Enroladinho ", category: "salgados", description: "Prático e cheio de sabor.", price: 5.00, image: "img/salgados/enroladinho.webp", pairing: true },
  { id: 15, name: "Pão de Queijo", category: "salgados", description: "Quentinho e derretendo por dentro.", price: 2.00, image: "img/salgados/pao-de-queijo.webp", pairing: true },
];

// Emojis usados como ícone visual enquanto não há fotos reais dos produtos
const CATEGORY_ICON = { acai: "🥣", sucos: "🥤", salgados: "🥐" };

/* =================================================================
   3. UTILITÁRIOS
   ================================================================= */
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/* =================================================================
   4. CARRINHO — STATE E PERSISTÊNCIA (LocalStorage)
   ================================================================= */
const CART_STORAGE_KEY = "gela-juice-cart";
let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Não foi possível carregar o carrinho salvo:", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Não foi possível salvar o carrinho:", error);
  }
}

function addToCart(item) {
  const existing = cart.find((cartItem) => cartItem.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
  updateCartIndicators();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
  updateCartIndicators();
}

function updateQuantity(id, delta) {
  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  renderCart();
  updateCartIndicators();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  updateCartIndicators();
}

function calculateCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartItemCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

/* =================================================================
   5. RENDERIZAÇÃO — PRODUTOS
   ================================================================= */
function createProductCard(product) {
  const template = qs("#product-card-template");
  const card = template.content.cloneNode(true).firstElementChild;

  const imageWrap = qs(".product-card__image-wrap", card);
  const imageEl = qs(".product-card__image", card);
  const badgeEl = qs(".product-card__badge", card);

  // Sem foto real disponível: usamos o emoji da categoria como placeholder visual
  imageEl.remove();
  imageWrap.textContent = CATEGORY_ICON[product.category] || "🥤";

  if (product.featured) {
    badgeEl.hidden = false;
  } else {
    badgeEl.remove();
  }

  qs(".product-card__name", card).textContent = product.name;
  qs(".product-card__description", card).textContent = product.description;
  qs(".product-card__price", card).textContent = formatCurrency(product.price);

  const addButton = qs(".product-card__add", card);
  addButton.addEventListener("click", () => {
    addToCart(product);
    showToast("Adicionado ao pedido ✓");
    addButton.classList.add("is-added");
    setTimeout(() => addButton.classList.remove("is-added"), 600);
  });

  return card;
}

function renderProducts(list, containerSelector) {
  const container = qs(containerSelector);
  if (!container) return;

  container.innerHTML = "";
  list.forEach((product) => container.appendChild(createProductCard(product)));

  observeProductCards(container);
}

function renderFeaturedProducts() {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  renderProducts(featured, "#featured-products");
}

function renderPairingProducts() {
  const pairing = products.filter((product) => product.pairing);
  renderProducts(pairing, "#pairing-products");
}

function renderMenuProducts(filter = "todos") {
  const filtered = filter === "todos"
    ? products
    : products.filter((product) => product.category === filter);

  renderProducts(filtered, "#menu-products");
}

/* =================================================================
   6. FILTROS DO CARDÁPIO
   ================================================================= */
function filterProducts(filter) {
  renderMenuProducts(filter);

  qsa(".filter-btn").forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
}

function setupMenuFilters() {
  qsa(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => filterProducts(btn.dataset.filter));
  });
}

// Cards de categoria no topo: rolam até o cardápio e aplicam o filtro
function setupCategoryNavigation() {
  qsa(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const targetId = card.dataset.scrollTarget;
      const filter = card.dataset.filter;
      const target = document.getElementById(targetId);

      if (target) target.scrollIntoView({ behavior: "smooth" });
      if (filter && targetId === "cardapio") filterProducts(filter);
    });
  });
}

/* =================================================================
   7. RENDERIZAÇÃO — CARRINHO
   ================================================================= */
function createCartItemRow(item) {
  const template = qs("#cart-item-template");
  const row = template.content.cloneNode(true).firstElementChild;

  qs(".cart-item__name", row).textContent = item.name;
  qs(".cart-item__unit-price", row).textContent = `${formatCurrency(item.price)} / unidade`;
  qs(".cart-item__count", row).textContent = item.quantity;
  qs(".cart-item__subtotal", row).textContent = formatCurrency(item.price * item.quantity);

  qs(".cart-item__increase", row).addEventListener("click", () => updateQuantity(item.id, 1));
  qs(".cart-item__decrease", row).addEventListener("click", () => updateQuantity(item.id, -1));
  qs(".cart-item__remove", row).addEventListener("click", () => removeFromCart(item.id));

  return row;
}

function renderCart() {
  const container = qs("#cart-items");
  const emptyMessage = qs("#cart-empty-message");

  container.innerHTML = "";

  if (cart.length === 0) {
    container.appendChild(emptyMessage);
    emptyMessage.hidden = false;
  } else {
    cart.forEach((item) => container.appendChild(createCartItemRow(item)));
  }

  qs("#cart-total").textContent = formatCurrency(calculateCartTotal());
}

function updateCartIndicators() {
  const count = getCartItemCount();
  const total = calculateCartTotal();

  const cartCountEl = qs("#cart-count");
  cartCountEl.textContent = count;
  cartCountEl.hidden = count === 0;

  const cartFab = qs("#cart-fab");
  const cartFabSummary = qs("#cart-fab-summary");

  if (count > 0) {
    cartFabSummary.textContent = `🛒 ${count} ${count === 1 ? "item" : "itens"} • ${formatCurrency(total)}`;
    cartFab.hidden = false;
  } else {
    cartFab.hidden = true;
  }
}

/* =================================================================
   8. CHECKOUT VIA WHATSAPP
   ================================================================= */
function buildWhatsAppMessage() {
  if (cart.length === 0) {
    return "Olá! Gostaria de conhecer o cardápio da Gela Juice.";
  }

  const lines = cart.map(
    (item) => `${item.quantity}x ${item.name}\n${formatCurrency(item.price * item.quantity)}`
  );

  const total = formatCurrency(calculateCartTotal());

  return [
    "Olá! 👋",
    "",
    "Gostaria de fazer um pedido na Gela Juice.",
    "",
    "🥤 MEU PEDIDO",
    "",
    ...lines,
    "",
    "------------------",
    "",
    `TOTAL: ${total}`,
    "",
    "Nome:",
    "Forma de entrega/retirada:",
    "Observações:",
  ].join("\n");
}

function getWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function checkoutWhatsApp() {
  const message = buildWhatsAppMessage();
  window.open(getWhatsAppUrl(message), "_blank", "noopener");
}

/* Adiciona um combo ao carrinho como item único e finaliza direto no WhatsApp,
   já que combos não fazem parte da lista dinâmica de produtos. */
function orderComboViaWhatsApp(comboName, comboPrice) {
  const message = [
    "Olá! 👋",
    "",
    "Gostaria de fazer um pedido na Gela Juice.",
    "",
    "🥤 MEU PEDIDO",
    "",
    `1x ${comboName}`,
    formatCurrency(comboPrice),
    "",
    "------------------",
    "",
    `TOTAL: ${formatCurrency(comboPrice)}`,
    "",
    "Nome:",
    "Forma de entrega/retirada:",
    "Observações:",
  ].join("\n");

  window.open(getWhatsAppUrl(message), "_blank", "noopener");
}

/* =================================================================
   9. UI — MENU MOBILE
   ================================================================= */
function setupMobileMenu() {
  const menuToggle = qs("#menu-toggle");
  const nav = qs("#primary-nav");
  const overlay = qs("#mobile-nav-overlay");

  function closeMenu() {
    nav.classList.remove("is-open");
    overlay.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    nav.classList.add("is-open");
    overlay.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  qsa(".header__nav-link", nav).forEach((link) => link.addEventListener("click", closeMenu));
}

/* =================================================================
   10. UI — CARRINHO (DRAWER)
   ================================================================= */
function setupCartDrawer() {
  const drawer = qs("#cart-drawer");
  const overlay = qs("#cart-overlay");
  const openTriggers = [qs("#cart-toggle"), qs("#cart-fab")].filter(Boolean);
  const closeBtn = qs("#cart-close");

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    qs("#cart-toggle").setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    qs("#cart-toggle").setAttribute("aria-expanded", "false");
  }

  openTriggers.forEach((trigger) => trigger.addEventListener("click", openDrawer));
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  qs("#cart-clear").addEventListener("click", clearCart);
  qs("#checkout-whatsapp-btn").addEventListener("click", checkoutWhatsApp);
}

/* =================================================================
   11. UI — BOTÕES DE WHATSAPP (hero, flutuante, footer)
   ================================================================= */
function setupWhatsAppButtons() {
  const targets = [
    qs("#hero-whatsapp-btn"),
    qs("#whatsapp-fab"),
    qs("#footer-whatsapp-link"),
  ].filter(Boolean);

  targets.forEach((link) => {
    link.href = getWhatsAppUrl(buildWhatsAppMessage());
    link.addEventListener("click", (event) => {
      // Atualiza a mensagem no clique para refletir o carrinho mais recente
      event.currentTarget.href = getWhatsAppUrl(buildWhatsAppMessage());
    });
  });
}

function setupComboButtons() {
  qsa(".combo-card__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.comboName;
      const price = parseFloat(btn.dataset.comboPrice);
      orderComboViaWhatsApp(name, price);
    });
  });
}

/* =================================================================
   12. UI — LOCALIZAÇÃO / INSTAGRAM (usa STORE_CONFIG)
   ================================================================= */
function setupStoreLinks() {
  const addressEl = qs("#location-address");
  if (addressEl) addressEl.textContent = STORE_CONFIG.address;

  const howToArriveBtn = qs("#how-to-arrive-btn");
  if (howToArriveBtn) howToArriveBtn.href = STORE_CONFIG.mapsUrl;

  const instagramFollowBtn = qs("#instagram-follow-btn");
  if (instagramFollowBtn) instagramFollowBtn.href = STORE_CONFIG.instagram;

  const footerInstagramLink = qs("#footer-instagram-link");
  if (footerInstagramLink) footerInstagramLink.href = STORE_CONFIG.instagram;
}

/* =================================================================
   13. UI — TOAST DE FEEDBACK
   ================================================================= */
let toastTimeout;
function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.hidden = false;

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2200);
}

/* =================================================================
   14. UI — ANIMAÇÕES (IntersectionObserver)
   ================================================================= */
let cardObserver;

function getCardObserver() {
  if (cardObserver) return cardObserver;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    cardObserver = { observe: (el) => el.classList.add("is-visible") };
    return cardObserver;
  }

  cardObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  return cardObserver;
}

function observeProductCards(container) {
  const observer = getCardObserver();
  qsa(".product-card", container).forEach((card) => observer.observe(card));
}

/* =================================================================
   15. INICIALIZAÇÃO
   ================================================================= */
function setCurrentYear() {
  const yearEl = qs("#current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function init() {
  renderFeaturedProducts();
  renderPairingProducts();
  renderMenuProducts();
  renderCart();
  updateCartIndicators();

  setupMenuFilters();
  setupCategoryNavigation();
  setupMobileMenu();
  setupCartDrawer();
  setupWhatsAppButtons();
  setupComboButtons();
  setupStoreLinks();
  setCurrentYear();
}

document.addEventListener("DOMContentLoaded", init);
