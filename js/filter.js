const CATEGORY_FILTERS = {
  Electronics: [
    {
      name: "Brand",
      options: [
        { label: "Sony", keyword: "sony" },
        { label: "JBL", keyword: "jbl" },
        { label: "Canon", keyword: "canon" },
        { label: "HP", keyword: "hp" },
        { label: "Logitech", keyword: "logitech" }
      ]
    },
    {
      name: "Type",
      options: [
        { label: "Headphones", keyword: "headphone" },
        { label: "Speaker", keyword: "speaker" },
        { label: "Camera", keyword: "camera" },
        { label: "Keyboard/Mouse", keyword: "keyboard" }
      ]
    }
  ],
  Mobile: [
    {
      name: "Brand",
      options: [
        { label: "Apple", keyword: "iphone" },
        { label: "Samsung", keyword: "samsung" },
        { label: "OnePlus", keyword: "oneplus" },
        { label: "Redmi/Xiaomi", keyword: "redmi" },
        { label: "Realme", keyword: "realme" }
      ]
    }
  ],
  Appliances: [
    {
      name: "Brand",
      options: [
        { label: "LG", keyword: "lg" },
        { label: "Samsung", keyword: "samsung" },
        { label: "Dyson", keyword: "dyson" },
        { label: "Philips", keyword: "philips" }
      ]
    }
  ],
  Fashion: [
    {
      name: "Brand",
      options: [
        { label: "Nike", keyword: "nike" },
        { label: "Adidas", keyword: "adidas" },
        { label: "Levi's", keyword: "levi" },
        { label: "Zara", keyword: "zara" },
        { label: "H&M", keyword: "h&m" }
      ]
    },
    {
      name: "Gender",
      options: [
        { label: "Men", keyword: "men" },
        { label: "Women", keyword: "women" },
        { label: "Unisex", keyword: "unisex" },
        { label: "Child", keyword: "child,kid" }
      ]
    }
  ],
  Furniture: [
    {
      name: "Material",
      options: [
        { label: "Wooden", keyword: "wood" },
        { label: "Metal", keyword: "metal" },
        { label: "Fabric/Leather", keyword: "leather,fabric" }
      ]
    }
  ],
  Beauty: [
    {
      name: "Type",
      options: [
        { label: "Makeup", keyword: "makeup" },
        { label: "Skincare", keyword: "skin" },
        { label: "Fragrance", keyword: "perfume" }
      ]
    }
  ],
  Books: [
    {
      name: "Genre",
      options: [
        { label: "Fiction", keyword: "novel" },
        { label: "Self-Help/Business", keyword: "rich dad" },
        { label: "Biography", keyword: "biography" }
      ]
    }
  ],
  Toys: [
    {
      name: "Age Group",
      options: [
        { label: "0-3 Years", keyword: "teddy,kitchen,plush" },
        { label: "4-7 Years", keyword: "car,lego,blocks,doll,train,action,basketball" },
        { label: "8+ Years", keyword: "puzzle,drone,science,robot" }
      ]
    }
  ],
  Grocery: [
    {
      name: "Delivery Speed",
      options: [
        { label: "2 Days Delivery", keyword: "2 days" },
        { label: "3 Days Delivery", keyword: "3 days" }
      ]
    }
  ],
  Sports: [
    {
      name: "Brand",
      options: [
        { label: "Adidas", keyword: "adidas" },
        { label: "Yonex", keyword: "yonex" },
        { label: "Spalding", keyword: "spalding" },
        { label: "Wilson", keyword: "wilson" },
        { label: "MRF", keyword: "mrf" },
        { label: "SG", keyword: "sg" },
        { label: "Nivia", keyword: "nivia" },
        { label: "Cosco", keyword: "cosco" }
      ]
    },
    {
      name: "Type",
      options: [
        { label: "Cricket", keyword: "cricket,bat,wicket,stumps" },
        { label: "Football", keyword: "football,studs,shin" },
        { label: "Badminton", keyword: "badminton,shuttle" },
        { label: "Tennis", keyword: "tennis" },
        { label: "Basketball", keyword: "basketball,hoop" }
      ]
    }
  ]
};

export function getFilteredProducts(products, filters) {
  let result = products.filter(product => {
    // 1. Search Query
    if (filters.search) {
      const queryTokens = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = `${product.title} ${product.category} ${product.description || ''}`.toLowerCase();
      const allTokensMatch = queryTokens.every(token => searchableText.includes(token));
      if (!allTokensMatch) return false;
    }

    // 2. Category
    if (filters.category && filters.category !== 'All') {
      if (product.category !== filters.category) return false;
    }

    // 2b. Dynamic Category Specific Filters
    if (filters.activeCategoryFilters && Object.keys(filters.activeCategoryFilters).length > 0) {
      for (const filterName in filters.activeCategoryFilters) {
        const keywords = filters.activeCategoryFilters[filterName];
        if (keywords && keywords.length > 0) {
          const match = keywords.some(kw => {
            const subparts = kw.split(',');
            return subparts.some(sub => 
              product.title.toLowerCase().includes(sub) || 
              product.description.toLowerCase().includes(sub)
            );
          });
          if (!match) return false;
        }
      }
    }

    // 3. Min Price
    if (filters.minPrice !== null && !isNaN(filters.minPrice)) {
      if (product.price < filters.minPrice) return false;
    }

    // 4. Max Price
    if (filters.maxPrice !== null && !isNaN(filters.maxPrice)) {
      if (product.price > filters.maxPrice) return false;
    }

    // 5. Rating
    if (filters.rating > 0) {
      if (product.rating < filters.rating) return false;
    }

    return true; // Passed all filters
  });

  // 6. Sorting
  if (filters.sortBy === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'rating_desc') {
    result.sort((a, b) => b.rating - a.rating);
  }

  return result;
}

export function bindFilterEvents(callbacks) {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const sortDropdown = document.getElementById('sort-dropdown');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const ratingRadios = document.querySelectorAll('input[name="rating-filter"]');
  const clearBtn = document.getElementById('clear-filters-btn');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const categoryFiltersContainer = document.getElementById('pd-category-filters-container');
  const sidebarCategoriesContainer = document.getElementById('sidebar-categories');
  const priceFilterContainer = document.getElementById('price-filter-container');

  let currentCategory = 'All';
  let activeCategoryFilters = {};

  const CATEGORIES = [
    'All',
    'Electronics',
    'Mobile',
    'Appliances',
    'Fashion',
    'Furniture',
    'Sports',
    'Beauty',
    'Books',
    'Toys',
    'Grocery'
  ];

  // Helper to gather all current filter values
  const triggerUpdate = () => {
    let selectedRating = 0;
    ratingRadios.forEach(radio => {
      if (radio.checked) {
        selectedRating = parseInt(radio.value, 10);
      }
    });

    const searchVal = searchInput ? searchInput.value.trim() : '';
    const sortVal = sortDropdown ? sortDropdown.value : 'default';
    const minVal = minPriceInput && minPriceInput.value !== '' ? parseFloat(minPriceInput.value) : null;
    const maxVal = maxPriceInput && maxPriceInput.value !== '' ? parseFloat(maxPriceInput.value) : null;

    callbacks.onChange({
      search: searchVal,
      category: currentCategory,
      minPrice: minVal,
      maxPrice: maxVal,
      rating: selectedRating,
      sortBy: sortVal,
      activeCategoryFilters: { ...activeCategoryFilters }
    });
  };

  // Render Category List in sidebar
  const renderSidebarCategories = () => {
    if (!sidebarCategoriesContainer) return;
    sidebarCategoriesContainer.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'sidebar-category-item flex items-center justify-between py-1.5 px-3 rounded-xl cursor-pointer text-sm transition-all hover:bg-slate-50';
      item.dataset.category = cat;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-medium';
      nameSpan.textContent = cat;

      if (cat === currentCategory) {
        item.className += ' text-brand-primary font-bold bg-blue-50/50';

        const checkMark = document.createElement('span');
        checkMark.className = 'text-brand-primary text-xs font-bold';
        checkMark.textContent = '✓';
        item.appendChild(nameSpan);
        item.appendChild(checkMark);
      } else {
        item.className += ' text-slate-600';
        item.appendChild(nameSpan);
      }

      item.addEventListener('click', () => {
        currentCategory = cat;
        syncCategorySelection();
        renderCategoryFilters(currentCategory);
        triggerUpdate();
      });

      sidebarCategoriesContainer.appendChild(item);
    });
  };

  const syncCategorySelection = () => {
    // 1. Sync Top Home Category Buttons
    categoryBtns.forEach(b => {
      const bImg = b.firstElementChild;
      const bText = b.querySelector('p');
      if (bImg && bText) {
        bImg.classList.remove('ring-4', 'ring-brand-primary');
        bText.classList.remove('text-brand-primary');

        if (b.dataset.category === currentCategory) {
          bImg.classList.add('ring-4', 'ring-brand-primary');
          bText.classList.add('text-brand-primary');
        }
      }
    });

    // 2. Sync Sidebar Categories List
    renderSidebarCategories();
  };

  // Render category filters in sidebar
  const renderCategoryFilters = (category) => {
    if (priceFilterContainer) {
      if (['Electronics', 'Mobile', 'Appliances'].includes(category)) {
        priceFilterContainer.classList.remove('hidden');
      } else {
        priceFilterContainer.classList.add('hidden');
      }
    }
    
    if (!categoryFiltersContainer) return;
    
    categoryFiltersContainer.innerHTML = '';
    activeCategoryFilters = {};
    
    const groups = CATEGORY_FILTERS[category];
    if (!groups || groups.length === 0) {
      categoryFiltersContainer.classList.add('hidden');
      return;
    }
    
    categoryFiltersContainer.classList.remove('hidden');
    
    groups.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'mb-6 last:mb-0';
      
      const title = document.createElement('h4');
      title.className = 'font-semibold text-sm text-slate-700 uppercase tracking-wider mb-3';
      title.textContent = group.name;
      groupDiv.appendChild(title);
      
      const listDiv = document.createElement('div');
      listDiv.className = 'space-y-2';
      
      group.options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-3 cursor-pointer text-sm text-slate-600 hover:text-slate-900 transition-colors';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary';
        checkbox.dataset.group = group.name;
        checkbox.dataset.keyword = opt.keyword;
        
        checkbox.addEventListener('change', () => {
          const checked = [];
          listDiv.querySelectorAll('input:checked').forEach(cb => {
            checked.push(cb.dataset.keyword);
          });
          
          if (checked.length > 0) {
            activeCategoryFilters[group.name] = checked;
          } else {
            delete activeCategoryFilters[group.name];
          }
          
          triggerUpdate();
        });
        
        const span = document.createElement('span');
        span.textContent = opt.label;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        listDiv.appendChild(label);
      });
      
      groupDiv.appendChild(listDiv);
      categoryFiltersContainer.appendChild(groupDiv);
    });
  };

  // Bind Standard Inputs
  if (searchInput) searchInput.addEventListener('input', triggerUpdate);
  if (sortDropdown) sortDropdown.addEventListener('change', triggerUpdate);
  if (minPriceInput) minPriceInput.addEventListener('input', triggerUpdate);
  if (maxPriceInput) maxPriceInput.addEventListener('input', triggerUpdate);
  ratingRadios.forEach(radio => radio.addEventListener('change', triggerUpdate));

  // Category Buttons Logic
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      syncCategorySelection();
      renderCategoryFilters(currentCategory);
      triggerUpdate();
    });
  });

  // Clear All Button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Reset DOM Elements
      if (searchInput) searchInput.value = '';
      if (sortDropdown) sortDropdown.value = 'default';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      
      ratingRadios.forEach(radio => {
        if (radio.value === '0') radio.checked = true;
      });

      // Reset Category State
      currentCategory = 'All';
      syncCategorySelection();
      renderCategoryFilters('All');
      triggerUpdate();
    });
  }

  // Initial render
  syncCategorySelection();
  renderCategoryFilters(currentCategory);
}
