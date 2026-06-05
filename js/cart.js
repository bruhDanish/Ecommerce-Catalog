export class Cart {
constructor() {

  this.items = [];
  this.listeners = [];
  this.load();
}

  getStorageKey() {
    const user = window.auth && window.auth.getCurrentUser();
    return user ? `ecommerce_cart_${user.username}` : null;
  }

  load() {
    this.items = [];
    const key = this.getStorageKey();
    if (!key) {
      this.notify();
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    this.notify();
  }

  save() {
    const key = this.getStorageKey();
    if (key) {
      localStorage.setItem(key, JSON.stringify(this.items));
    }
    this.notify();
  }

addItem(product) {
  if (window.auth && !window.auth.isLoggedIn()) {
    if (window.showLoginModal) window.showLoginModal();
    return;
  }
  const existing = this.items.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    this.items.push({ ...product, quantity: 1 });
  }
  this.save();
  this.showToast('Item added to cart');
}

updateQuantity(productId, delta) {
  if (window.auth && !window.auth.isLoggedIn()) {
    if (window.showLoginModal) window.showLoginModal();
    return;
  }
  const item = this.items.find(i => i.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.save();
    }
  }
}

removeItem(productId) {
  if (window.auth && !window.auth.isLoggedIn()) {
    if (window.showLoginModal) window.showLoginModal();
    return;
  }
  this.items = this.items.filter(i => i.id !== productId);
  this.save();
}

clear() {
  this.items = [];
  this.save();
}

getTotal() {
  const sum = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  return Math.round(sum * 100) / 100;
}

getCount() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
}

subscribe(callback) {
  this.listeners.push(callback);
}

notify() {
  this.listeners.forEach(cb => cb(this.items));
  document.dispatchEvent(new CustomEvent('cart-updated', { detail: this.items }));
}

showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
}

export function bindCartUI(cart, products) {
  const cartBadge = document.getElementById('cartCount'); // updated ID
  const cartItemsContainer = document.getElementById('cartItems'); // updated ID
  const cartEmptyMsg = document.getElementById('emptyCart'); // updated ID
  const cartGrandTotal = document.getElementById('cart-grand-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  const dropzone = document.getElementById('dropZone'); // updated ID

  // Render function
  const render = (items) => {
    cartBadge.textContent = cart.getCount();
    cartGrandTotal.textContent = cart.getTotal();

    // Enable/disable checkout button
    if (checkoutBtn) {
      checkoutBtn.disabled = items.length === 0;
      checkoutBtn.onclick = () => {
        if (items.length > 0) window.location.hash = 'checkout';
      };
    }

    if (items.length === 0) {
      cartItemsContainer.innerHTML = '';
      cartEmptyMsg.classList.remove('hidden');
      return;
    }

    cartEmptyMsg.classList.add('hidden');
    cartItemsContainer.innerHTML = '';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3';
      el.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="h-20 w-20 rounded-xl object-cover" />
        <div class="flex-1">
          <h3 class="text-sm font-black leading-tight text-slate-900">${item.title}</h3>
          <p class="mt-1 text-xs text-slate-500">₹${item.price} x ${item.quantity} = <strong>₹${item.price * item.quantity}</strong></p>
          <div class="mt-2 flex items-center gap-3">
            <button class="qty-btn grid h-6 w-6 place-items-center rounded bg-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-300 transition" data-id="${item.id}" data-delta="-1">-</button>
            <span class="text-sm font-bold">${item.quantity}</span>
            <button class="qty-btn grid h-6 w-6 place-items-center rounded bg-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-300 transition" data-id="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <button class="remove-btn grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-black shadow-sm text-red-500 hover:bg-red-50 transition" data-id="${item.id}">×</button>
      `;
      cartItemsContainer.appendChild(el);
    });
  };

  // Setup Event Delegation for Cart Actions
  cartItemsContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('qty-btn')) {
      const id = parseInt(target.dataset.id);
      const delta = parseInt(target.dataset.delta);
      cart.updateQuantity(id, delta);
    } else if (target.classList.contains('remove-btn')) {
      const id = parseInt(target.dataset.id);
      cart.removeItem(id);
    }
  });

  // Drag and drop logic is now handled in app_v2.js to prevent duplicate addition

  cart.subscribe(render);
  render(cart.items); // initial render
}
