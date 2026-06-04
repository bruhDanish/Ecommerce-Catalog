import { products } from './data.js?v=17';
import { renderCatalog, renderHome, renderProductPage } from './catalog.js?v=14';
import { getFilteredProducts, bindFilterEvents } from './filter.js?v=3';
import { Cart, bindCartUI } from './cart.js?v=12';
import { bindCheckout, initPayment } from './checkout.js?v=13';
import { auth } from './auth.js';

window.auth = auth; // Make globally accessible if needed

// ─── INLINED WISHLIST MODULE (previously wishlist.js) ───
class Wishlist {
  constructor() {
    this.items = new Set();
    this.listeners = [];
    this.load();
  }

  getStorageKey() {
    const user = window.auth && window.auth.getCurrentUser();
    return user ? `ecommerce_wishlist_${user.username}` : 'ecommerce_wishlist_guest';
  }

  load() {
    this.items = new Set();
    try {
      const saved = localStorage.getItem(this.getStorageKey());
      if (saved) {
        this.items = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
    this.notify();
  }

  save() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(Array.from(this.items)));
    this.notify();
  }

  toggle(productId) {
    if (this.items.has(productId)) {
      this.items.delete(productId);
    } else {
      this.items.add(productId);
      this.showToast('Item added to wishlist');
    }
    this.save();
  }

  remove(productId) {
    this.items.delete(productId);
    this.save();
  }

  has(productId) {
    return this.items.has(productId);
  }

  getCount() {
    return this.items.size;
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.items));
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 3000);
    }
  }
}

function bindWishlistUI(wishlist, products, cart) {
  const wishlistBtn = document.getElementById('wishlistBtn');
  const wishlistCount = document.getElementById('wishlistCount');
  const wishlistPanel = document.getElementById('wishlistPanel');
  const closeWishlist = document.getElementById('closeWishlist');
  const overlay = document.getElementById('overlay');
  const wishlistItemsContainer = document.getElementById('wishlistItems');
  const emptyWishlist = document.getElementById('emptyWishlist');

  // Toggle Panel
  const togglePanel = (show) => {
    if (show) {
      wishlistPanel.classList.remove('translate-x-full');
      overlay.classList.remove('hidden');
      document.getElementById('cartPanel')?.classList.add('translate-x-full');
    } else {
      wishlistPanel.classList.add('translate-x-full');
      overlay.classList.add('hidden');
    }
  };

  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      if (!auth.isLoggedIn()) {
        if (window.showLoginModal) window.showLoginModal();
      } else {
        togglePanel(true);
      }
    });
  }
  if (closeWishlist) closeWishlist.addEventListener('click', () => togglePanel(false));
  if (overlay) overlay.addEventListener('click', () => togglePanel(false));

  const render = () => {
    const count = wishlist.getCount();
    
    // Update Badge
    if (wishlistCount) {
      wishlistCount.textContent = count;
      if (count > 0) {
        wishlistCount.classList.remove('hidden');
      } else {
        wishlistCount.classList.add('hidden');
      }
    }

    // Render Panel
    if (count === 0) {
      if (emptyWishlist) emptyWishlist.classList.remove('hidden');
      if (wishlistItemsContainer) wishlistItemsContainer.innerHTML = '';
      return;
    }

    if (emptyWishlist) emptyWishlist.classList.add('hidden');
    if (wishlistItemsContainer) {
      wishlistItemsContainer.innerHTML = '';

      const wishlistedProducts = products.filter(p => wishlist.has(p.id));

      wishlistedProducts.forEach(product => {
        const el = document.createElement('div');
        el.className = 'flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3';
        
        const cartItem = cart.items.find(i => i.id === product.id);
        const bagText = cartItem ? `Add to Bag (${cartItem.quantity})` : 'Add to Bag';
        
        el.innerHTML = `
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
            <img src="${product.image}" alt="${product.title}" class="h-full w-full object-cover" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-bold text-slate-900 line-clamp-1">${product.title}</h3>
            <p class="mt-1 text-sm font-black text-slate-900">₹${product.price}</p>
          </div>
          <div class="flex flex-col gap-2">
            <button class="add-btn rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 shadow-md">${bagText}</button>
            <button class="remove-btn text-xs font-bold text-red-500 hover:text-red-700 text-center">Remove</button>
          </div>
        `;

        el.querySelector('.add-btn').addEventListener('click', () => {
          cart.addItem(product);
        });

        el.querySelector('.remove-btn').addEventListener('click', () => {
          wishlist.remove(product.id);
          // Dispatch an event so app.js can re-render the catalog (update heart icon)
          document.dispatchEvent(new CustomEvent('wishlist-updated'));
        });

        wishlistItemsContainer.appendChild(el);
      });
    }
  };

  wishlist.subscribe(render);
  cart.subscribe(render);
  render();
}

// ─── INLINED ROUTER MODULE (previously router.js) ───
const router = (() => {
  let _views       = {};       // { viewName: DOMElement }
  let _defaultView = 'catalog';
  let _onEnter     = {};       // { viewName: fn }
  let _onLeave     = {};       // { viewName: fn }
  let _current     = null;     // name of the currently visible view
  let _currentParam= null;     // param of the currently visible view

  function _getViewFromHash() {
    const raw  = window.location.hash.replace('#', '').trim().toLowerCase();
    const parts = raw.split('/');
    const baseName = parts[0];
    const name = _views[baseName] ? baseName : _defaultView;
    const param = parts[1] || null;
    return { name, param };
  }

  function _switchTo(viewData) {
    const { name: viewName, param } = viewData;
    if (viewName === _current && param === _currentParam) return;

    if (_current) {
      const leaving = _views[_current];
      if (leaving) {
        leaving.classList.remove('view--active');
        leaving.setAttribute('aria-hidden', 'true');
        leaving.style.display = 'none';
      }
      if (typeof _onLeave[_current] === 'function') {
        _onLeave[_current]();
      }
    }

    const entering = _views[viewName];
    if (entering) {
      entering.style.display = '';
      entering.classList.add('view--active');
      entering.removeAttribute('aria-hidden');
    }
    
    _current = viewName;
    _currentParam = param;
    
    if (typeof _onEnter[viewName] === 'function') {
      _onEnter[viewName](param);
    }
  }

  function _handleRouteChange() {
    const viewData = _getViewFromHash();
    _switchTo(viewData);
  }

  function init(config = {}) {
    if (!config.views || Object.keys(config.views).length === 0) {
      console.error('[Router] init() requires a views object.');
      return;
    }

    _views       = config.views;
    _defaultView = config.defaultView || Object.keys(_views)[0];
    _onEnter     = config.onEnter || {};
    _onLeave     = config.onLeave || {};

    Object.values(_views).forEach(el => {
      if (el) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        el.classList.remove('view--active');
      }
    });

    window.addEventListener('hashchange', _handleRouteChange);
    _handleRouteChange();
  }

  function navigate(path) {
    const baseName = path.split('/')[0];
    if (!_views[baseName]) {
      console.warn(`[Router] Unknown view: "${baseName}"`);
      return;
    }
    window.location.hash = path;
  }

  function getCurrent() {
    return _current;
  }

  return { init, navigate, getCurrent };
})();


// ─── INITIALIZATION LOGIC ───

// Load stored rating overrides at startup
products.forEach(p => {
  const key = `product_rating_override_${p.id}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    const override = JSON.parse(saved);
    p.rating = override.rating;
    p.ratingNumber = override.ratingNumber;
  }
});

// Initialize Cart
const cart = new Cart();
window.appCart = cart;
bindCartUI(cart, products);

// Initialize Wishlist
const wishlist = new Wishlist();
bindWishlistUI(wishlist, products, cart);

// Initialize Checkout & Payment
bindCheckout(cart);
initPayment(cart);

// Initialize Catalog & Home
let currentFilters = {
  search: '',
  category: 'All',
  minPrice: null,
  maxPrice: null,
  rating: 0,
  sortBy: 'default'
};

const updateHome = () => {
  renderHome(products, 'home-product-rows', {
    onAddToCart: (product) => {
      if (!auth.isLoggedIn()) {
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      cart.addItem(product);
    },
    onToggleWishlist: (productId) => {
      if (!auth.isLoggedIn()) {
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      wishlist.toggle(productId);
      updateHome();
      updateCatalog(); 
    },
    onViewAll: (category) => {
      const categoryBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
      if (categoryBtn) {
        categoryBtn.click();
      }
    }
  }, wishlist);
};

const updateCatalog = () => {
  const filtered = getFilteredProducts(products, currentFilters);
  
  // Update search term display
  const searchTermDisplay = document.getElementById('search-term-display');
  if (searchTermDisplay) {
    searchTermDisplay.textContent = currentFilters.search || currentFilters.category || 'All';
  }

  renderCatalog(filtered, 'product-grid', {
    onAddToCart: (product) => {
      if (!auth.isLoggedIn()) {
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      cart.addItem(product);
    },
    onToggleWishlist: (productId) => {
      if (!auth.isLoggedIn()) {
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      wishlist.toggle(productId);
      updateCatalog(); 
      updateHome();
    }
  }, wishlist);
};

bindFilterEvents({
  onChange: (filters) => {
    currentFilters = filters;
    
    // Auto-navigate to search if filtering starts from home (excluding search input itself)
    if (filters.category !== 'All' || filters.minPrice || filters.maxPrice || filters.rating > 0) {
      if (router.getCurrent() !== 'search' && router.getCurrent() !== 'checkout') {
        router.navigate('search');
      }
    }
    updateCatalog();
  }
});

// Initial renders
updateHome();
updateCatalog();

document.addEventListener('wishlist-updated', () => {
  updateHome();
  updateCatalog();
});

// Setup SPA Routing
const checkoutItemsContainer = document.getElementById('checkout-items');
const paymentItemsContainer = document.getElementById('payment-items');
const checkoutSubtotal = document.getElementById('checkout-subtotal');
const paymentSubtotal = document.getElementById('payment-subtotal');

const renderCheckoutSummary = () => {
  if (checkoutItemsContainer) checkoutItemsContainer.innerHTML = '';
  if (paymentItemsContainer) paymentItemsContainer.innerHTML = '';
  
  let itemsHTML = '';
  if (cart.items.length === 0) {
    itemsHTML = '<p class="text-slate-500 text-sm">Your bag is empty.</p>';
    if (router.getCurrent() === 'checkout' || router.getCurrent() === 'payment') {
      setTimeout(() => {
        if (cart.items.length === 0) {
          router.navigate('home');
        }
      }, 1000);
    }
  } else {
    itemsHTML = cart.items.map(item => `
      <div class="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
        <img src="${item.image}" alt="${item.title}" class="h-16 w-16 rounded-2xl object-cover border border-slate-200" />
        <div class="flex-1">
          <h3 class="text-sm font-medium text-slate-900 line-clamp-1">${item.title}</h3>
          <div class="flex items-center gap-2 mt-1">
            <button class="checkout-qty-btn flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition" data-id="${item.id}" data-delta="-1">-</button>
            <span class="text-xs font-semibold text-slate-700">Qty: ${item.quantity}</span>
            <button class="checkout-qty-btn flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition" data-id="${item.id}" data-delta="1">+</button>
            <span class="text-slate-300 text-xs mx-0.5">|</span>
            <button class="checkout-remove-btn text-xs font-medium text-red-500 hover:text-red-700 transition" data-id="${item.id}">Remove</button>
          </div>
        </div>
        <div class="font-medium text-slate-900">₹${item.price * item.quantity}</div>
      </div>
    `).join('');
  }
  
  if (checkoutItemsContainer) checkoutItemsContainer.innerHTML = itemsHTML;
  if (paymentItemsContainer) paymentItemsContainer.innerHTML = itemsHTML;

  const total = cart.getTotal();
  if (checkoutSubtotal) checkoutSubtotal.textContent = `₹${total}`;
  if (paymentSubtotal) paymentSubtotal.textContent = `₹${total}`;
  
  const cTotal = document.getElementById('total-val');
  if (cTotal) cTotal.textContent = `₹${total}`;
  
  if (window.updatePaymentTotal) {
    window.updatePaymentTotal(total);
  }
};

const handleCheckoutSummaryClick = (e) => {
  const target = e.target;
  if (target.classList.contains('checkout-qty-btn')) {
    const id = parseInt(target.dataset.id, 10);
    const delta = parseInt(target.dataset.delta, 10);
    cart.updateQuantity(id, delta);
  } else if (target.classList.contains('checkout-remove-btn')) {
    const id = parseInt(target.dataset.id, 10);
    cart.removeItem(id);
  }
};

if (checkoutItemsContainer) {
  checkoutItemsContainer.addEventListener('click', handleCheckoutSummaryClick);
}
if (paymentItemsContainer) {
  paymentItemsContainer.addEventListener('click', handleCheckoutSummaryClick);
}

cart.subscribe(renderCheckoutSummary);


router.init({
  views: {
    home: document.getElementById('view-home'),
    search: document.getElementById('view-search'),
    checkout: document.getElementById('view-checkout'),
    payment: document.getElementById('view-payment'),
    product: document.getElementById('view-product')
  },
  defaultView: 'home',
  onEnter: {
    home: () => {
      updateHome();
    },
    search: () => {
      updateCatalog();
    },
    checkout: () => {
      if (!auth.isLoggedIn()) {
        window.location.hash = 'home';
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      // Hide cart panel when navigating to checkout
      document.getElementById('cartPanel')?.classList.add('translate-x-full');
      document.getElementById('overlay')?.classList.add('hidden');
      
      // Render the latest cart state
      renderCheckoutSummary();
    },
    payment: () => {
      if (!auth.isLoggedIn()) {
        window.location.hash = 'home';
        if (window.showLoginModal) window.showLoginModal();
        return;
      }
      document.getElementById('cartPanel')?.classList.add('translate-x-full');
      document.getElementById('overlay')?.classList.add('hidden');
      if (window.appCart.items.length === 0) {
        window.location.hash = 'home';
      }
      renderCheckoutSummary();
    },
    product: (productId) => {
      renderProductPage(productId, {
        onAddToCart: (product) => {
          if (!auth.isLoggedIn()) {
            if (window.showLoginModal) window.showLoginModal();
            return;
          }
          cart.addItem(product);
          const toast = document.getElementById('toast');
          if (toast) {
            toast.textContent = 'Added to Cart';
            toast.classList.remove('hidden');
            toast.classList.add('translate-y-0', 'opacity-100');
            setTimeout(() => toast.classList.add('hidden'), 2000);
          }
        },
        onBuyNow: (product) => {
          if (!auth.isLoggedIn()) {
            if (window.showLoginModal) window.showLoginModal();
            return;
          }
          cart.addItem(product);
          router.navigate('checkout');
        },
        onToggleWishlist: (pId) => {
          if (!auth.isLoggedIn()) {
            if (window.showLoginModal) window.showLoginModal();
            return;
          }
          wishlist.toggle(pId);
          updateHome();
          updateCatalog();
        }
      }, wishlist, cart);
    }
  }
});

// Cart toggle logic
const cartPanel = document.getElementById('cartPanel');
const cartToggleBtn = document.getElementById('cartBtn');
const closeCartBtn = document.getElementById('closeCart');
const overlay = document.getElementById('overlay');

if(cartToggleBtn) {
  cartToggleBtn.addEventListener('click', () => {
    if (!auth.isLoggedIn()) {
      if (window.showLoginModal) window.showLoginModal();
      return;
    }
    cartPanel.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
  });
}

const closeCart = () => {
  if (cartPanel) cartPanel.classList.add('translate-x-full');
  const wishlistPanel = document.getElementById('wishlistPanel');
  if (wishlistPanel && wishlistPanel.classList.contains('translate-x-full')) {
    if (overlay) overlay.classList.add('hidden');
  } else if (!wishlistPanel) {
    if (overlay) overlay.classList.add('hidden');
  }
};

if(closeCartBtn) {
  closeCartBtn.addEventListener('click', closeCart);
}

// Carousel Logic
const track = document.getElementById('carousel-track');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');

if (track && prevBtn && nextBtn) {
  const slidesHtml = `
    <div class="min-w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-between px-16 shrink-0">
      <div>
        <h2 class="text-4xl font-bold text-slate-800">Big Billion Days</h2>
        <p class="text-2xl mt-2 text-brand-primary font-medium">Up to 80% Off on Electronics</p>
        <button class="mt-6 bg-brand-primary text-white px-6 py-2 rounded-2xl shadow-sm font-medium">Shop Now</button>
      </div>
      <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80" class="h-48 w-48 object-cover rounded-xl shadow-lg mix-blend-multiply" />
    </div>
    <div class="min-w-full h-full bg-gradient-to-r from-yellow-50 to-orange-100 flex items-center justify-between px-16 shrink-0">
      <div>
        <h2 class="text-4xl font-bold text-slate-800">Festive Deals</h2>
        <p class="text-2xl mt-2 text-orange-600 font-medium">Extra 10% Off with Bank Cards</p>
        <button class="mt-6 bg-[#fb641b] text-white px-6 py-2 rounded-2xl shadow-sm font-medium">Explore</button>
      </div>
      <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80" class="h-48 w-48 object-cover rounded-xl shadow-lg mix-blend-multiply" />
    </div>
    <div class="min-w-full h-full bg-gradient-to-r from-purple-50 to-pink-100 flex items-center justify-between px-16 shrink-0">
      <div>
        <h2 class="text-4xl font-bold text-slate-800">New Arrivals</h2>
        <p class="text-2xl mt-2 text-purple-600 font-medium">Latest Tech & Gadgets</p>
        <button class="mt-6 bg-purple-600 text-white px-6 py-2 rounded-2xl shadow-sm font-medium">View Collection</button>
      </div>
      <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80" class="h-48 w-48 object-cover rounded-xl shadow-lg mix-blend-multiply" />
    </div>
  `;
  track.innerHTML = slidesHtml;

  let currentSlide = 0;
  const slideCount = 3;

  const updateCarousel = () => {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
  };

  let autoplayInterval = setInterval(() => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateCarousel();
  }, 4000);

  const stopAutoplay = () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  };

  nextBtn.addEventListener('click', () => {
    stopAutoplay();
    currentSlide = (currentSlide + 1) % slideCount;
    updateCarousel();
  });

  prevBtn.addEventListener('click', () => {
    stopAutoplay();
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    updateCarousel();
  });
}

if(overlay) {
  overlay.addEventListener('click', () => {
    closeCart();
    const wishlistPanel = document.getElementById('wishlistPanel');
    if (wishlistPanel) wishlistPanel.classList.add('translate-x-full');
  });
}

// --- Drag and Drop ---
function initDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('scale-110', 'border-blue-600', 'bg-blue-50');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('scale-110', 'border-blue-600', 'bg-blue-50');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('scale-110', 'border-blue-600', 'bg-blue-50');
    dropZone.classList.add('bg-emerald-50', 'border-emerald-500');
    
    const productId = e.dataTransfer.getData('text/plain');
    if (productId) {
      const product = products.find(p => p.id === parseInt(productId, 10));
      if (product) {
        if (!auth.isLoggedIn()) {
          if (window.showLoginModal) window.showLoginModal();
          return;
        }
        cart.addItem(product);
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Dropped into Cart';
          toast.classList.remove('hidden');
          toast.classList.add('translate-y-0', 'opacity-100');
          setTimeout(() => toast.classList.add('hidden'), 2000);
        }
      }
    }
  });
}
initDragAndDrop();

// --- Auth & Login Modal Logic ---
const loginModalOverlay = document.getElementById('loginModalOverlay');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginHeaderBtn = document.getElementById('loginHeaderBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const userProfile = document.getElementById('user-profile');
const userNameDisplay = document.getElementById('user-name-display');
const loginError = document.getElementById('loginError');

window.showLoginModal = () => {
  if(loginModalOverlay) loginModalOverlay.classList.remove('hidden');
  if(loginError) loginError.classList.add('hidden');
  if(document.getElementById('loginUsername')) document.getElementById('loginUsername').value = '';
  if(document.getElementById('loginPassword')) document.getElementById('loginPassword').value = '';
};

window.hideLoginModal = () => {
  if(loginModalOverlay) loginModalOverlay.classList.add('hidden');
};

if (loginHeaderBtn) loginHeaderBtn.addEventListener('click', window.showLoginModal);
if (closeLoginModal) closeLoginModal.addEventListener('click', window.hideLoginModal);
if (loginModalOverlay) loginModalOverlay.addEventListener('click', (e) => {
  if(e.target === loginModalOverlay) window.hideLoginModal();
});

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();
    
    const res = auth.login(user, pass);
    if (res.success) {
      window.hideLoginModal();
      
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Login successful!';
        toast.classList.remove('hidden');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => toast.classList.add('hidden'), 2000);
      }
    } else {
      loginError.textContent = res.message;
      loginError.classList.remove('hidden');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.logout();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Logged out';
      toast.classList.remove('hidden');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => toast.classList.add('hidden'), 2000);
    }
    
    // Close wishlist if it's open
    const wishlistPanel = document.getElementById('wishlistPanel');
    if (wishlistPanel && !wishlistPanel.classList.contains('translate-x-full')) {
       wishlistPanel.classList.add('translate-x-full');
       document.getElementById('overlay')?.classList.add('hidden');
    }
  });
}

const updateAuthUI = () => {
  if (auth.isLoggedIn()) {
    if(loginHeaderBtn) loginHeaderBtn.classList.add('hidden');
    if(userProfile) {
      userProfile.classList.remove('hidden');
      userProfile.classList.add('flex');
    }
    if(userNameDisplay) userNameDisplay.textContent = auth.getCurrentUser().name;
  } else {
    if(loginHeaderBtn) loginHeaderBtn.classList.remove('hidden');
    if(userProfile) {
      userProfile.classList.add('hidden');
      userProfile.classList.remove('flex');
    }
  }
};

auth.subscribe(() => {
  updateAuthUI();
  wishlist.load();
  cart.load();
  document.dispatchEvent(new CustomEvent('wishlist-updated'));
});
updateAuthUI(); // Initial UI check

// Auto-suggest search dropdown logic
const searchInputEl = document.getElementById('search-input');
const searchDropdownEl = document.getElementById('search-dropdown');

if (searchInputEl && searchDropdownEl) {
  const saveSearchHistory = (term) => {
    if (!term) return;
    let history = JSON.parse(localStorage.getItem('ecommerce_search_history') || '[]');
    history = history.filter(item => item !== term);
    history.unshift(term);
    if (history.length > 5) history.pop();
    localStorage.setItem('ecommerce_search_history', JSON.stringify(history));
  };

  const renderHistory = () => {
    let history = JSON.parse(localStorage.getItem('ecommerce_search_history') || '[]');
    if (history.length > 0) {
      searchDropdownEl.innerHTML = `
        <div class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">Recent Searches</div>
        ${history.map(term => `
          <div class="history-suggestion-item px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 font-medium flex items-center gap-3 border-b border-slate-50 last:border-0">
            <span class="text-slate-400">🕒</span>
            <span>${term}</span>
          </div>
        `).join('')}
      `;
      searchDropdownEl.classList.remove('hidden');
      
      searchDropdownEl.querySelectorAll('.history-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const term = item.querySelector('span:nth-child(2)').textContent;
          searchInputEl.value = term;
          searchDropdownEl.classList.add('hidden');
          saveSearchHistory(term);
          searchInputEl.dispatchEvent(new Event('input', { bubbles: true }));
          if (router.getCurrent() !== 'search') router.navigate('search');
        });
      });
    } else {
      searchDropdownEl.classList.add('hidden');
    }
  };

  searchInputEl.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      renderHistory();
      return;
    }
    
    // Filter top 8 products matching the title
    const matches = products.filter(p => p.title.toLowerCase().includes(val)).slice(0, 8);
    
    if (matches.length > 0) {
      searchDropdownEl.innerHTML = matches.map(m => `
        <div class="search-suggestion-item px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-800 font-medium flex items-center gap-3 border-b border-slate-50 last:border-0" data-id="${m.id}">
          <img src="${m.image}" class="w-8 h-8 rounded object-cover" />
          <span class="line-clamp-1">${m.title}</span>
        </div>
      `).join('');
      
      searchDropdownEl.classList.remove('hidden');
      
      searchDropdownEl.querySelectorAll('.search-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          searchInputEl.value = item.querySelector('span').textContent;
          searchDropdownEl.classList.add('hidden');
          saveSearchHistory(searchInputEl.value);
          searchInputEl.dispatchEvent(new Event('input', { bubbles: true }));
          // Navigate to product directly
          router.navigate('product/' + item.dataset.id);
        });
      });
    } else {
      searchDropdownEl.classList.add('hidden');
    }
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInputEl.contains(e.target) && !searchDropdownEl.contains(e.target)) {
      searchDropdownEl.classList.add('hidden');
    }
  });
  
  // Show history when focused and empty, or suggest when has value
  searchInputEl.addEventListener('focus', () => {
    if (!searchInputEl.value.trim()) {
      renderHistory();
    } else if (searchDropdownEl.innerHTML.trim() !== '') {
      searchDropdownEl.classList.remove('hidden');
    }
  });

  // Handle Enter key to navigate to search page
  searchInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchDropdownEl.classList.add('hidden');
      const val = searchInputEl.value.trim();
      if (val) saveSearchHistory(val);
      if (router.getCurrent() !== 'search') {
        router.navigate('search');
      }
    }
  });

  // Handle magnifying glass click to navigate to search page
  const searchBtnEl = document.getElementById('search-btn');
  if (searchBtnEl) {
    searchBtnEl.addEventListener('click', () => {
      searchDropdownEl.classList.add('hidden');
      const val = searchInputEl.value.trim();
      if (val) saveSearchHistory(val);
      if (router.getCurrent() !== 'search') {
        router.navigate('search');
      }
    });
  }
}
