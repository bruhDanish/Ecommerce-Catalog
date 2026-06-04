import { products as allProducts } from './data.js?v=17';

// --- Reviews & Ratings helpers merged from product.js ---
const getReviews = (productId) => {
  const key = `product_reviews_${productId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    {
      rating: 5,
      title: "Terrific purchase",
      desc: "Absolutely amazing product! The quality is top notch and delivery was super fast. Highly recommended to everyone looking for this.",
      author: "Verified Customer",
      time: "1 month ago",
      likes: 245,
      dislikes: 12
    }
  ];
};

const addReview = (productId, review) => {
  const key = `product_reviews_${productId}`;
  const reviews = getReviews(productId);
  reviews.unshift(review);
  localStorage.setItem(key, JSON.stringify(reviews));
};

const getRatingBreakdown = (product) => {
  const key = `product_rating_breakdown_${product.id}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved);
  }
  
  const total = product.ratingNumber || 120;
  const rating = product.rating || 4.5;
  
  let count5 = 0, count4 = 0, count3 = 0, count2 = 0, count1 = 0;
  if (rating >= 4.7) {
    count5 = Math.round(total * 0.75);
    count4 = Math.round(total * 0.15);
    count3 = Math.round(total * 0.06);
    count2 = Math.round(total * 0.02);
    count1 = total - (count5 + count4 + count3 + count2);
  } else if (rating >= 4.5) {
    count5 = Math.round(total * 0.60);
    count4 = Math.round(total * 0.22);
    count3 = Math.round(total * 0.10);
    count2 = Math.round(total * 0.04);
    count1 = total - (count5 + count4 + count3 + count2);
  } else if (rating >= 4.2) {
    count5 = Math.round(total * 0.48);
    count4 = Math.round(total * 0.28);
    count3 = Math.round(total * 0.14);
    count2 = Math.round(total * 0.05);
    count1 = total - (count5 + count4 + count3 + count2);
  } else {
    count5 = Math.round(total * 0.35);
    count4 = Math.round(total * 0.25);
    count3 = Math.round(total * 0.20);
    count2 = Math.round(total * 0.10);
    count1 = total - (count5 + count4 + count3 + count2);
  }
  if (count1 < 0) count1 = 0;
  
  return { 5: count5, 4: count4, 3: count3, 2: count2, 1: count1 };
};

const saveRatingBreakdown = (productId, breakdown) => {
  const key = `product_rating_breakdown_${productId}`;
  localStorage.setItem(key, JSON.stringify(breakdown));
};

const saveProductRatingOverride = (productId, rating, ratingNumber) => {
  const key = `product_rating_override_${productId}`;
  localStorage.setItem(key, JSON.stringify({ rating, ratingNumber }));
};

// --- Product Catalog Rendering ---
export function renderCatalog(products, containerId, callbacks, wishlist) {
  const container = document.getElementById(containerId);
  const noProductsMsg = document.getElementById('no-products-msg');
  
  if (products.length === 0) {
    container.innerHTML = '';
    noProductsMsg.classList.remove('hidden');
    return;
  }
  
  noProductsMsg.classList.add('hidden');
  container.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card cursor-grab overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition hover:shadow-md hover:-translate-y-1 duration-300 active:cursor-grabbing flex flex-col relative group';
    card.draggable = true;
    card.dataset.id = product.id;
    
    const isWishlisted = wishlist && wishlist.has(product.id);
    const heartIcon = isWishlisted ? '♥' : '♡';
    const heartColor = isWishlisted ? 'text-red-500' : 'text-slate-400';

    card.innerHTML = `
      <div class="relative h-48 w-full shrink-0 flex items-center justify-center p-4 bg-white border-b border-slate-100">
        <img class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" src="${product.image}" alt="${product.title}" loading="lazy" />
        <span class="absolute left-3 top-3 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase shadow-sm">${product.category}</span>
        <button class="wishlist-btn absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-100 text-lg shadow-sm transition hover:scale-110 ${heartColor}">${heartIcon}</button>
      </div>
      <div class="p-4 flex flex-col flex-grow">
        <div class="flex items-center gap-1.5 w-full">
          <span class="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">${product.rating} ★</span>
          <span class="text-[11px] text-slate-400 font-medium">(${product.ratingNumber || 100})</span>
          ${product.deliveryDays ? `<span class="ml-auto text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${product.deliveryDays} Days</span>` : ''}
        </div>
        <h3 class="mt-2 min-h-[40px] text-[14px] font-medium leading-tight text-slate-800 line-clamp-2">${product.title}</h3>
        <div class="mt-auto pt-3 flex items-center justify-between border-t border-slate-50">
          <p class="text-[16px] font-bold text-slate-900">₹${product.price}</p>
          <div class="cart-controls-wrapper" data-product-id="${product.id}"></div>
        </div>
      </div>
    `;

    const controlsWrapper = card.querySelector('.cart-controls-wrapper');
    renderCartControls(controlsWrapper, product, callbacks);

    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.onToggleWishlist(product.id);
    });

    card.addEventListener('click', () => {
      window.location.hash = 'product/' + product.id;
    });

    // Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', product.id);
      e.dataTransfer.effectAllowed = "copy";
      card.classList.add("opacity-60", "ring-2", "ring-brand-primary");
      
      const dropZone = document.getElementById('dropZone');
      if(dropZone) {
        dropZone.classList.remove('hidden');
        setTimeout(() => {
          dropZone.classList.remove("scale-50", "opacity-0");
          dropZone.classList.add("scale-100", "opacity-100");
        }, 10);
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove("opacity-60", "ring-2", "ring-brand-primary");
      
      const dropZone = document.getElementById('dropZone');
      if(dropZone) {
        dropZone.classList.add("scale-50", "opacity-0");
        dropZone.classList.remove("scale-100", "scale-110", "border-blue-600", "bg-blue-50", "opacity-100", "bg-emerald-50", "border-emerald-500");
        setTimeout(() => dropZone.classList.add("hidden"), 350);
      }
    });

    container.appendChild(card);
  });
}

// --- Home Product Rows Rendering ---
export function renderHome(products, containerId, callbacks = {}, wishlist = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const categories = [...new Set(products.map(p => p.category))];

  categories.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category);
    if (categoryProducts.length === 0) return;

    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'bg-white shadow-sm border border-slate-100 rounded-2xl p-5 mb-6 overflow-hidden';
    
    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between border-b border-slate-100 pb-3 mb-4';
    header.innerHTML = `
      <h2 class="text-[18px] font-bold text-slate-800">Best of ${category}</h2>
      <button class="view-all-btn bg-brand-primary rounded-2xl text-white px-4 py-1.5 text-[12px] shadow-sm font-semibold hover:bg-blue-700 transition" data-category="${category}">VIEW ALL</button>
    `;
    const viewAllBtn = header.querySelector('.view-all-btn');
    viewAllBtn.addEventListener('click', () => {
      if (callbacks.onViewAll) callbacks.onViewAll(category);
    });
    rowWrapper.appendChild(header);

    // Products Scroll Area
    const scrollArea = document.createElement('div');
    scrollArea.className = 'flex gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x';
    
    categoryProducts.forEach(product => {
      const inWishlist = wishlist ? wishlist.has(product.id) : false;
      const heartColor = inWishlist ? 'text-red-500' : 'text-slate-300';
      const fillAttr = inWishlist ? 'currentColor' : 'none';

      const card = document.createElement('div');
      card.className = 'min-w-[190px] max-w-[210px] shrink-0 snap-start flex flex-col items-center group cursor-pointer relative bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition duration-300';
      card.draggable = true;
      
      card.innerHTML = `
        <div class="relative w-full aspect-square p-2 bg-white flex justify-center items-center rounded-xl overflow-hidden border border-slate-50">
          <img src="${product.image}" alt="${product.title}" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
          <button class="absolute top-2 right-2 wishlist-toggle-btn text-xl ${heartColor} hover:text-red-500 transition-colors z-10" data-id="${product.id}">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${fillAttr}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
        </div>
        <div class="mt-3 text-center w-full px-1 flex flex-col flex-grow">
          <h3 class="text-[13px] font-medium text-slate-800 line-clamp-1 hover:text-brand-primary transition">${product.title}</h3>
          ${product.deliveryDays ? `<div class="mt-1 flex justify-center"><span class="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">${product.deliveryDays} Days</span></div>` : ''}
          <p class="text-[13px] font-bold text-green-600 mt-1">From ₹${product.price}</p>
          <div class="cart-controls-wrapper mt-2 flex justify-center w-full" data-product-id="${product.id}"></div>
        </div>
      `;

      card.querySelector('.wishlist-toggle-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (callbacks.onToggleWishlist) callbacks.onToggleWishlist(product.id);
      });

      const controlsWrapper = card.querySelector('.cart-controls-wrapper');
      renderCartControls(controlsWrapper, product, callbacks);

      card.addEventListener('click', () => {
        window.location.hash = 'product/' + product.id;
      });

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', product.id);
        e.dataTransfer.effectAllowed = "copy";
        card.classList.add("opacity-60");
        const dropZone = document.getElementById('dropZone');
        if(dropZone) {
          dropZone.classList.remove('hidden');
          setTimeout(() => {
            dropZone.classList.remove("scale-50", "opacity-0");
            dropZone.classList.add("scale-100", "opacity-100");
          }, 10);
        }
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove("opacity-60");
        const dropZone = document.getElementById('dropZone');
        if(dropZone) {
          dropZone.classList.add("scale-50", "opacity-0");
          dropZone.classList.remove("scale-100", "scale-110", "border-blue-600", "bg-blue-50", "opacity-100", "bg-emerald-50", "border-emerald-500");
          setTimeout(() => dropZone.classList.add("hidden"), 350);
        }
      });

      scrollArea.appendChild(card);
    });

    rowWrapper.appendChild(scrollArea);
    container.appendChild(rowWrapper);
  });
}

// --- Cart Controls Rendering ---
export function renderCartControls(container, product, callbacks) {
  const cart = window.appCart;
  if (!cart) return;
  const item = cart.items.find(i => i.id === product.id);
  
  if (item) {
    container.innerHTML = `
      <div class="flex items-center gap-2 rounded-xl border border-brand-primary p-0.5 bg-white shadow-sm">
        <button class="dec-btn grid h-6 w-6 place-items-center rounded-lg bg-blue-50 text-brand-primary font-bold hover:bg-blue-100 transition text-xs">-</button>
        <span class="text-xs font-bold text-brand-primary min-w-[16px] text-center">${item.quantity}</span>
        <button class="inc-btn grid h-6 w-6 place-items-center rounded-lg bg-brand-primary text-white font-bold hover:bg-blue-700 transition text-xs">+</button>
      </div>
    `;
    container.querySelector('.dec-btn').onclick = (e) => {
      e.stopPropagation();
      cart.updateQuantity(product.id, -1);
    };
    container.querySelector('.inc-btn').onclick = (e) => {
      e.stopPropagation();
      cart.updateQuantity(product.id, 1);
    };
  } else {
    container.innerHTML = `
      <button class="add-btn rounded-xl bg-blue-50 border border-blue-100 text-brand-primary px-3 py-1 text-xs font-bold hover:bg-brand-primary hover:text-white transition shadow-sm">Add</button>
    `;
    container.querySelector('.add-btn').onclick = (e) => {
      e.stopPropagation();
      if (callbacks && callbacks.onAddToCart) callbacks.onAddToCart(product);
      else {
        cart.addItem(product);
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Added to Cart';
          toast.classList.remove('hidden');
          toast.classList.add('translate-y-0', 'opacity-100');
          setTimeout(() => {
            toast.classList.add('hidden');
          }, 2000);
        }
      }
    };
  }
}

// --- Product Page Rendering Merged from product.js ---
export function renderProductPage(productId, callbacks = {}, wishlist = null, cart = null) {
  const id = parseInt(productId, 10);
  const product = allProducts.find(p => p.id === id);

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  // DOM Elements
  const titleEl = document.getElementById('pd-title');
  const imgEl = document.getElementById('pd-image');
  const ratingEl = document.getElementById('pd-rating');
  const ratingBigEl = document.getElementById('pd-rating-big');
  const priceEl = document.getElementById('pd-price');
  const origPriceEl = document.getElementById('pd-original-price');
  const discountEl = document.getElementById('pd-discount');
  const descEl = document.getElementById('pd-description');
  const breadcrumbCat = document.getElementById('breadcrumb-category');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  const wishlistBtn = document.getElementById('pd-wishlist-btn');
  const cartControlsContainer = document.getElementById('pd-cart-controls-container');
  const buyNowBtn = document.getElementById('pd-buy-now');

  // Pincode elements
  const pincodeInput = document.getElementById('pd-pincode-input');
  const pincodeBtn = document.getElementById('pd-pincode-btn');
  const deliveryStatusEl = document.getElementById('pd-delivery-status');
  const deliveryNoteEl = document.getElementById('pd-delivery-note');

  // Populate data
  titleEl.textContent = product.title;
  imgEl.src = product.image;
  imgEl.alt = product.title;
  ratingEl.textContent = product.rating;
  if (ratingBigEl) ratingBigEl.textContent = product.rating;
  
  const priceVal = parseFloat(product.price);
  const originalPrice = product.originalPrice || Math.round(priceVal * 1.3);
  const discount = product.discountPercentage || Math.round((1 - (priceVal / originalPrice)) * 100);

  priceEl.textContent = `₹${priceVal}`;
  origPriceEl.textContent = `₹${originalPrice}`;
  discountEl.textContent = `${discount}% off`;
  
  const ratingCountEl = document.getElementById('pd-rating-count');
  if (ratingCountEl && product.ratingNumber) {
    ratingCountEl.textContent = `${product.ratingNumber.toLocaleString()} Ratings & ${Math.floor(product.ratingNumber / 10).toLocaleString()} Reviews`;
  }
  
  descEl.textContent = product.description;
  
  breadcrumbCat.textContent = product.category;
  breadcrumbTitle.textContent = product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title;

  // Drag to Cart logic for the main image
  imgEl.draggable = true;
  imgEl.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', product.id);
    e.dataTransfer.effectAllowed = "copy";
    imgEl.classList.add("opacity-60");
    const dropZone = document.getElementById('dropZone');
    if(dropZone) {
      dropZone.classList.remove('hidden');
      setTimeout(() => {
        dropZone.classList.remove("scale-50", "opacity-0");
        dropZone.classList.add("scale-100", "opacity-100");
      }, 10);
    }
  });
  imgEl.addEventListener('dragend', () => {
    imgEl.classList.remove("opacity-60");
    const dropZone = document.getElementById('dropZone');
    if(dropZone) {
      dropZone.classList.add("scale-50", "opacity-0");
      dropZone.classList.remove("scale-100", "scale-110", "border-blue-600", "bg-blue-50", "opacity-100", "bg-emerald-50", "border-emerald-500");
      setTimeout(() => dropZone.classList.add("hidden"), 350);
    }
  });

  // Wishlist logic
  const inWishlist = wishlist ? wishlist.has(product.id) : false;
  wishlistBtn.innerHTML = inWishlist ? '♥' : '♡';
  wishlistBtn.className = `absolute top-0 right-0 grid h-10 w-10 place-items-center rounded-full bg-white text-2xl shadow-sm transition hover:scale-110 ${inWishlist ? 'text-red-500' : 'text-slate-300'}`;

  // Reset listeners by cloning buttons
  const newWlBtn = wishlistBtn.cloneNode(true);
  wishlistBtn.parentNode.replaceChild(newWlBtn, wishlistBtn);
  newWlBtn.addEventListener('click', () => {
    if (callbacks.onToggleWishlist) {
      callbacks.onToggleWishlist(product.id);
      // Update local UI immediately
      const isNowWishlisted = wishlist.has(product.id);
      newWlBtn.innerHTML = isNowWishlisted ? '♥' : '♡';
      newWlBtn.className = `absolute top-0 right-0 grid h-10 w-10 place-items-center rounded-full bg-white text-2xl shadow-sm transition hover:scale-110 ${isNowWishlisted ? 'text-red-500' : 'text-slate-300'}`;
    }
  });

  // Dynamic cart controls
  const updateCartControls = () => {
    if (!cartControlsContainer) return;
    const cartItem = cart ? cart.items.find(i => i.id === product.id) : null;
    if (cartItem && cartItem.quantity > 0) {
      cartControlsContainer.innerHTML = `
        <div class="w-full flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-sm">
          <div class="flex items-center gap-2">
            <button id="pd-qty-minus" class="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition shadow-sm">-</button>
            <span id="pd-qty-display" class="min-w-[70px] text-center font-bold text-slate-800 text-[14px]">${cartItem.quantity} Added</span>
            <button id="pd-qty-plus" class="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition shadow-sm">+</button>
          </div>
          <button id="pd-remove" class="px-4 py-2 text-sm font-bold text-red-500 hover:text-white border border-red-200 rounded-xl hover:bg-red-500 transition bg-white shadow-sm">Remove</button>
        </div>
      `;
      document.getElementById('pd-qty-minus').onclick = () => {
        cart.updateQuantity(product.id, -1);
        updateCartControls();
      };
      document.getElementById('pd-qty-plus').onclick = () => {
        cart.updateQuantity(product.id, 1);
        updateCartControls();
      };
      document.getElementById('pd-remove').onclick = () => {
        cart.removeItem(product.id);
        updateCartControls();
      };
    } else {
      cartControlsContainer.innerHTML = `
        <button id="pd-add-to-cart" class="w-full bg-[#ff9f00] hover:bg-[#f39802] text-white py-4 text-[16px] font-medium rounded-2xl shadow-sm transition">ADD TO CART</button>
      `;
      document.getElementById('pd-add-to-cart').onclick = () => {
        if (callbacks.onAddToCart) callbacks.onAddToCart(product);
        updateCartControls();
      };
    }
  };

  updateCartControls();

  // Setup cart-updated event listener
  if (window._cleanupProductCartListener) {
    window._cleanupProductCartListener();
  }
  const handleCartUpdated = () => {
    const viewProduct = document.getElementById('view-product');
    if (viewProduct && viewProduct.style.display !== 'none') {
      updateCartControls();
    }
  };
  document.addEventListener('cart-updated', handleCartUpdated);
  window._cleanupProductCartListener = () => {
    document.removeEventListener('cart-updated', handleCartUpdated);
  };

  const newBuyBtn = buyNowBtn.cloneNode(true);
  buyNowBtn.parentNode.replaceChild(newBuyBtn, buyNowBtn);
  newBuyBtn.addEventListener('click', () => {
    if (callbacks.onBuyNow) callbacks.onBuyNow(product);
  });

  // Dynamic Pincode Verification Logic
  const handlePincodeCheck = () => {
    const activeInput = document.getElementById('pd-pincode-input');
    if (!activeInput || !deliveryStatusEl || !deliveryNoteEl) return;
    const pin = activeInput.value.trim();
    if (!pin) {
      deliveryStatusEl.innerHTML = `<span class="text-red-500 font-semibold">Please enter a pincode</span>`;
      deliveryNoteEl.textContent = "Pincode cannot be empty.";
      deliveryNoteEl.className = "text-[12px] text-red-500 mt-1";
      return;
    }

    // Indian Pincode Regex validation (6 digits starting with 1-9)
    if (/^[1-9]\d{5}$/.test(pin)) {
      const prefix = pin.substring(0, 2);
      let location = "India";
      let deliveryDays = 3;

      if (prefix === '11') {
        location = "New Delhi";
        deliveryDays = 1;
      } else if (pin.startsWith('400')) {
        location = "Mumbai";
        deliveryDays = 1;
      } else if (pin.startsWith('560')) {
        location = "Bengaluru";
        deliveryDays = 1;
      } else if (pin.startsWith('600')) {
        location = "Chennai";
        deliveryDays = 2;
      } else if (pin.startsWith('700')) {
        location = "Kolkata";
        deliveryDays = 2;
      } else if (pin.startsWith('500')) {
        location = "Hyderabad";
        deliveryDays = 2;
      } else if (prefix >= '11' && prefix <= '19') {
        location = "Delhi NCR";
        deliveryDays = 2;
      } else if (prefix >= '20' && prefix <= '28') {
        location = "Uttar Pradesh";
        deliveryDays = 3;
      } else if (prefix >= '30' && prefix <= '34') {
        location = "Rajasthan";
        deliveryDays = 3;
      } else if (prefix >= '36' && prefix <= '39') {
        location = "Gujarat";
        deliveryDays = 3;
      } else if (prefix >= '40' && prefix <= '44') {
        location = "Maharashtra";
        deliveryDays = 2;
      } else if (prefix >= '45' && prefix <= '48') {
        location = "Madhya Pradesh";
        deliveryDays = 3;
      } else if (prefix >= '50' && prefix <= '53') {
        location = "Andhra/Telangana";
        deliveryDays = 3;
      } else if (prefix >= '56' && prefix <= '59') {
        location = "Karnataka";
        deliveryDays = 2;
      } else if (prefix >= '60' && prefix <= '64') {
        location = "Tamil Nadu";
        deliveryDays = 3;
      } else if (prefix >= '67' && prefix <= '69') {
        location = "Kerala";
        deliveryDays = 3;
      } else if (prefix >= '70' && prefix <= '74') {
        location = "West Bengal";
        deliveryDays = 3;
      } else if (prefix >= '75' && prefix <= '77') {
        location = "Odisha";
        deliveryDays = 4;
      } else if (prefix >= '78') {
        location = "North East India";
        deliveryDays = 5;
      } else if (prefix >= '80' && prefix <= '85') {
        location = "Bihar/Jharkhand";
        deliveryDays = 4;
      }

      // Calculate future delivery date
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + deliveryDays);
      const deliveryDateStr = `${days[targetDate.getDay()]}, ${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
      
      const speedText = deliveryDays === 1 ? "Tomorrow" : deliveryDateStr;
      
      deliveryStatusEl.innerHTML = `Delivery to <strong class="text-brand-primary font-bold">${location}</strong> by <strong class="text-slate-800">${speedText}</strong> | <span class="text-green-600 font-bold">Free</span> <span class="line-through text-slate-400">₹40</span>`;
      deliveryNoteEl.innerHTML = `<span class="text-green-600 font-semibold">✓ Valid Pincode</span> (Delivered from nearest center)`;
      deliveryNoteEl.className = "text-[12px] text-green-600 mt-1";
    } else {
      deliveryStatusEl.innerHTML = `<span class="text-red-500 font-semibold">Invalid Pincode</span>`;
      deliveryNoteEl.textContent = "Please enter a valid 6-digit Indian Pincode (e.g. 560001)";
      deliveryNoteEl.className = "text-[12px] text-red-500 mt-1";
    }
  };

  // Re-bind click event on pincode check button
  if (pincodeBtn) {
    const newPinBtn = pincodeBtn.cloneNode(true);
    pincodeBtn.parentNode.replaceChild(newPinBtn, pincodeBtn);
    newPinBtn.addEventListener('click', handlePincodeCheck);
  }

  // Set input reset and bind enter key event
  if (pincodeInput) {
    pincodeInput.value = '';
    // Restore default messages
    if (deliveryStatusEl) {
      if (product.deliveryDays) {
        deliveryStatusEl.innerHTML = `Delivery within ${product.deliveryDays} Days | <span class="text-green-600">Free</span> <span class="line-through text-slate-500">₹40</span>`;
      } else {
        deliveryStatusEl.innerHTML = `Delivery by Tomorrow | <span class="text-green-600">Free</span> <span class="line-through text-slate-500">₹40</span>`;
      }
    }
    if (deliveryNoteEl) {
      deliveryNoteEl.textContent = 'if ordered before 4:00 PM';
      deliveryNoteEl.className = 'text-[12px] text-slate-500 mt-1';
    }

    // Remove old listeners by cloning
    const newPinInput = pincodeInput.cloneNode(true);
    pincodeInput.parentNode.replaceChild(newPinInput, pincodeInput);
    
    newPinInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        handlePincodeCheck();
      }
    });
  }

  // Dynamic Ratings & Reviews Rendering
  const ratingSummaryTextEl = document.getElementById('pd-rating-summary-text');
  const ratingBreakdownContainer = document.getElementById('pd-rating-breakdown-container');
  const reviewsListEl = document.getElementById('pd-reviews-list');
  const rateBtn = document.getElementById('pd-rate-btn');
  
  const updateRatingsAndReviews = () => {
    const reviews = getReviews(product.id);
    const breakdown = getRatingBreakdown(product);
    const totalRatings = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    // Update main rating texts
    if (ratingEl) ratingEl.textContent = product.rating;
    if (ratingBigEl) ratingBigEl.textContent = product.rating;
    
    if (ratingCountEl) {
      ratingCountEl.textContent = `${totalRatings.toLocaleString()} Ratings & ${reviews.length.toLocaleString()} Reviews`;
    }
    if (ratingSummaryTextEl) {
      ratingSummaryTextEl.innerHTML = `${totalRatings.toLocaleString()} Ratings &<br>${reviews.length.toLocaleString()} Reviews`;
    }
    
    // Update breakdown bars
    if (ratingBreakdownContainer) {
      ratingBreakdownContainer.innerHTML = '';
      const colors = {
        5: 'bg-green-500',
        4: 'bg-green-500',
        3: 'bg-green-500',
        2: 'bg-orange-400',
        1: 'bg-red-500'
      };
      
      for (let r = 5; r >= 1; r--) {
        const count = breakdown[r];
        const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
        const colorClass = colors[r];
        
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 text-[12px]';
        row.innerHTML = `
          <span class="w-4">${r}★</span>
          <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full ${colorClass} transition-all duration-500" style="width: ${pct}%"></div>
          </div>
          <span class="text-slate-500 w-12 text-right">${count.toLocaleString()}</span>
        `;
        ratingBreakdownContainer.appendChild(row);
      }
    }
    
    // Update reviews list
    if (reviewsListEl) {
      reviewsListEl.innerHTML = '';
      reviews.forEach(review => {
        const el = document.createElement('div');
        el.className = 'py-6 border-b border-slate-100 last:border-0';
        el.innerHTML = `
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">${review.rating} ★</span>
            <span class="font-medium text-[14px] text-slate-800">${review.title}</span>
          </div>
          <p class="text-[14px] text-slate-700 mb-4">${review.desc}</p>
          <div class="flex items-center justify-between text-[12px] text-slate-500 font-medium">
            <div class="flex items-center gap-2">
              <span>${review.author}</span>
              <span class="text-slate-300">|</span>
              <span>${review.time}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1 cursor-pointer hover:text-brand-primary">👍 ${review.likes || 0}</span>
              <span class="flex items-center gap-1 cursor-pointer hover:text-brand-primary">👎 ${review.dislikes || 0}</span>
            </div>
          </div>
        `;
        reviewsListEl.appendChild(el);
      });
    }
  };
  
  updateRatingsAndReviews();

  // Rating submission interaction
  const rateModal = document.getElementById('rate-modal');
  const closeRateModalBtn = document.getElementById('close-rate-modal');
  const cancelRateBtn = document.getElementById('cancel-rate-btn');
  const submitRateBtn = document.getElementById('submit-rate-btn');
  const starSelector = document.getElementById('modal-star-selector');
  const ratingLabel = document.getElementById('modal-rating-label');
  const rateNameInput = document.getElementById('rate-name');
  const rateTitleInput = document.getElementById('rate-title');
  const rateDescInput = document.getElementById('rate-desc');
  
  let currentSelectedRating = 5;
  
  const ratingLabels = {
    5: { text: 'Excellent', color: 'text-green-600' },
    4: { text: 'Very Good', color: 'text-green-500' },
    3: { text: 'Good', color: 'text-yellow-500' },
    2: { text: 'Fair', color: 'text-orange-500' },
    1: { text: 'Poor', color: 'text-red-500' }
  };
  
  const updateModalStars = (rating) => {
    currentSelectedRating = rating;
    if (!starSelector) return;
    const starItems = starSelector.querySelectorAll('.star-rating-item');
    starItems.forEach(star => {
      const val = parseInt(star.dataset.val);
      if (val <= rating) {
        star.classList.remove('text-slate-300');
        star.classList.add('text-yellow-400');
      } else {
        star.classList.remove('text-yellow-400');
        star.classList.add('text-slate-300');
      }
    });
    
    const info = ratingLabels[rating];
    if (ratingLabel && info) {
      ratingLabel.textContent = info.text;
      ratingLabel.className = `text-xs font-semibold mt-1 ${info.color}`;
    }
  };
  
  // Star clicks
  if (starSelector) {
    starSelector.onclick = (e) => {
      const target = e.target;
      if (target.classList.contains('star-rating-item')) {
        const val = parseInt(target.dataset.val);
        updateModalStars(val);
      }
    };
  }
  
  // Open modal
  if (rateBtn) {
    const newRateBtn = rateBtn.cloneNode(true);
    rateBtn.parentNode.replaceChild(newRateBtn, rateBtn);
    newRateBtn.addEventListener('click', () => {
      if (rateModal) {
        rateModal.classList.remove('hidden');
        rateModal.classList.add('flex');
        
        if (rateNameInput) rateNameInput.value = '';
        if (rateTitleInput) rateTitleInput.value = '';
        if (rateDescInput) rateDescInput.value = '';
        
        updateModalStars(5);
      }
    });
  }
  
  const hideRateModal = () => {
    if (rateModal) {
      rateModal.classList.remove('flex');
      rateModal.classList.add('hidden');
    }
  };
  
  if (closeRateModalBtn) closeRateModalBtn.onclick = hideRateModal;
  if (cancelRateBtn) cancelRateBtn.onclick = hideRateModal;
  
  // Submit Review
  if (submitRateBtn) {
    const newSubmitBtn = submitRateBtn.cloneNode(true);
    submitRateBtn.parentNode.replaceChild(newSubmitBtn, submitRateBtn);
    newSubmitBtn.onclick = () => {
      const author = rateNameInput ? rateNameInput.value.trim() : '';
      const title = rateTitleInput ? rateTitleInput.value.trim() : '';
      const desc = rateDescInput ? rateDescInput.value.trim() : '';
      
      if (!author || !title) {
        alert('Please fill out your name and review title.');
        return;
      }
      
      const newReview = {
        rating: currentSelectedRating,
        title: title,
        desc: desc,
        author: author,
        time: 'Just now',
        likes: 0,
        dislikes: 0
      };
      addReview(product.id, newReview);
      
      const breakdown = getRatingBreakdown(product);
      breakdown[currentSelectedRating] += 1;
      saveRatingBreakdown(product.id, breakdown);
      
      const totalRatings = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const totalSum = (5 * breakdown[5]) + (4 * breakdown[4]) + (3 * breakdown[3]) + (2 * breakdown[2]) + (1 * breakdown[1]);
      const newAverage = Math.round((totalSum / totalRatings) * 10) / 10;
      
      product.rating = newAverage;
      product.ratingNumber = totalRatings;
      
      saveProductRatingOverride(product.id, newAverage, totalRatings);
      
      updateRatingsAndReviews();
      hideRateModal();
      
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Review submitted successfully!';
        toast.classList.remove('hidden');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => toast.classList.add('hidden'), 2000);
      }
    };
  }
}

// Add event listener to update controls when cart changes
document.addEventListener('cart-updated', () => {
  const wrappers = document.querySelectorAll('.cart-controls-wrapper');
  wrappers.forEach(wrapper => {
    const productId = parseInt(wrapper.dataset.productId);
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      renderCartControls(wrapper, product);
    }
  });
});
