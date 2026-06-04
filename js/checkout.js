export function bindCheckout(cart) {
  const checkoutForm = document.getElementById('checkout-form');
  const successModal = document.getElementById('sov');
  const continueShoppingBtn = document.getElementById('continue-shopping-btn');

  // Input fields mapping
  const fields = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    address: document.getElementById('address'),
    city: document.getElementById('city'),
    pincode: document.getElementById('pincode')
  };

  // Basic validation rules
  const validationRules = {
    fullName: (val) => val.trim().length >= 3 ? '' : 'Name must be at least 3 characters',
    email: (val) => val.trim() === '' ? '' : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Invalid email address'),
    phone: (val) => /^\d{10}$/.test(val.replace(/\D/g, '')) ? '' : 'Phone must be 10 digits',
    address: (val) => val.trim().length >= 10 ? '' : 'Address must be at least 10 characters',
    city: (val) => val.trim().length >= 2 ? '' : 'City is required',
    pincode: (val) => /^\d{6}$/.test(val.trim()) ? '' : 'Pincode must be 6 digits'
  };

  const validateField = (key) => {
    const input = fields[key];
    if (!input) return true;
    const errorMsg = validationRules[key](input.value);
    const errorSpan = document.getElementById(`error-${key}`);
    
    if (errorMsg) {
      input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
      input.classList.remove('border-slate-300', 'focus:border-blue-600', 'focus:ring-blue-100');
      if (errorSpan) errorSpan.textContent = errorMsg;
      return false;
    } else {
      input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
      input.classList.add('border-slate-300', 'focus:border-blue-600', 'focus:ring-blue-100');
      if (errorSpan) errorSpan.textContent = '';
      return true;
    }
  };

  // Attach blur event for real-time validation
  Object.keys(fields).forEach(key => {
    if (fields[key]) {
      fields[key].addEventListener('blur', () => validateField(key));
      fields[key].addEventListener('input', () => validateField(key));
    }
  });

  // Proceed to payment
  const proceedBtn = document.getElementById('proceed-to-payment-btn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (cart.items.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      let isValid = true;
      Object.keys(fields).forEach(key => {
        if (!validateField(key)) isValid = false;
      });

      if (isValid) {
        // Form is valid, navigate to payment
        window.location.hash = 'payment';
      }
    });
  }

  // Continue shopping
  if(continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      cart.clear();
      successModal.classList.add('hidden');
      successModal.classList.remove('flex');
      if (checkoutForm) checkoutForm.reset();
      window.location.hash = 'home';
    });
  }
}

export function initPayment(cart) {
  const ss = document.createElement('style');
  ss.textContent = '@keyframes spinit{to{transform:rotate(360deg)}}';
  document.head.appendChild(ss);

  /* ══ BIN DATABASE ══ */
  const BINS=[
    {re:/^4111/,net:'Visa',   icon:'🔵',bank:'HDFC Bank',      offer:'5% cashback on electronics · Max ₹500',    color:'#1D4ED8',bg:'#EFF6FF'},
    {re:/^4532/,net:'Visa',   icon:'🔵',bank:'ICICI Bank',     offer:'No-cost EMI available up to 6 months',     color:'#1D4ED8',bg:'#EFF6FF'},
    {re:/^4916/,net:'Visa',   icon:'🔵',bank:'Axis Bank',      offer:'10% off on fashion · Max ₹300',            color:'#9D174D',bg:'#FDF2F8'},
    {re:/^4556/,net:'Visa',   icon:'🔵',bank:'Kotak Bank',     offer:'₹200 instant discount on orders above ₹999',color:'#B91C1C',bg:'#FFF1F2'},
    {re:/^4024/,net:'Visa',   icon:'🔵',bank:'Yes Bank',       offer:'Extra 5% off with Yes First card',         color:'#065F46',bg:'#F0FDF4'},
    {re:/^4/,    net:'Visa',   icon:'🔵',bank:'Visa Card',      offer:'Standard Visa offers apply',               color:'#1D4ED8',bg:'#EFF6FF'},
    {re:/^51/,   net:'Mastercard',icon:'🔴',bank:'SBI Card',   offer:'5% cashback via SBI SimplyCLICK',          color:'#1E3A8A',bg:'#EFF6FF'},
    {re:/^52/,   net:'Mastercard',icon:'🔴',bank:'HDFC Mastercard',offer:'Reward points on every ₹100 spent',    color:'#1D4ED8',bg:'#EFF6FF'},
    {re:/^54/,   net:'Mastercard',icon:'🔴',bank:'Axis Mastercard', offer:'Grab 10% discount on electronics',    color:'#9D174D',bg:'#FDF2F8'},
    {re:/^5[1-5]/,net:'Mastercard',icon:'🔴',bank:'Mastercard',offer:'Contactless payment ready',                color:'#B91C1C',bg:'#FFF1F2'},
    {re:/^60/,   net:'RuPay',  icon:'🇮🇳',bank:'SBI RuPay',   offer:'Cashback on RuPay + UPI combo',            color:'#1E3A8A',bg:'#EFF6FF'},
    {re:/^607/,  net:'RuPay',  icon:'🇮🇳',bank:'PNB RuPay',   offer:'₹100 cashback on first RuPay transaction',color:'#1E3A8A',bg:'#EFF6FF'},
    {re:/^6[0-9]/,net:'RuPay', icon:'🇮🇳',bank:'RuPay Card',  offer:'Made in India · Powered by UPI',           color:'#1E3A8A',bg:'#EFF6FF'},
    {re:/^3[47]/, net:'Amex',  icon:'🟦',bank:'American Express',offer:'5X reward points this month',             color:'#0369A1',bg:'#EFF6FF'},
    {re:/^65/,   net:'Discover',icon:'🟠',bank:'Discover Card',offer:'1.5% flat cashback on all purchases',     color:'#C2410C',bg:'#FFF7ED'},
  ];

  /* ══ STATE ══ */
  let activeUPI='gpay';
  let BASE_TOTAL = cart.getTotal();
  
  // Expose update function to sync with cart
  window.updatePaymentTotal = function(total) {
    BASE_TOTAL = total;
    if (activeUPI && document.getElementById('p-upi') && !document.getElementById('p-upi').classList.contains('hidden')) {
      window.applyUPIDiscount(activeUPI);
    } else {
      const tv = document.getElementById('p-total-val');
      if(tv) tv.textContent = `₹${BASE_TOTAL.toLocaleString('en-IN')}`;
    }
    if (document.getElementById('p-emi') && !document.getElementById('p-emi').classList.contains('hidden')) {
      // Find active bank or default to HDFC
      let activeBank = 'HDFC';
      const sel = document.getElementById('other-emi-banks-select');
      if (sel && sel.value) activeBank = sel.value;
      else {
        const activeTile = document.querySelector('.ebank.on');
        if (activeTile) activeBank = activeTile.textContent;
      }
      window.renderEMIPlans(activeBank);
    }
  };

  const UPI_DATA={
    gpay:   {label:'Google Pay 5% Cashback', rate:0.05, via:'UPI – Google Pay'},
    phonepe:{label:'PhonePe 10% Off',        rate:0.10, via:'UPI – PhonePe'},
    bhim:   {label:'BHIM UPI ₹150 Off',      flat:150,  via:'UPI – BHIM'},
    amazon: {label:'Amazon Pay 15% Cashback',rate:0.15, via:'UPI – Amazon Pay'},
  };

  const getUPIDiscount = (key, total) => {
    const d = UPI_DATA[key];
    if (!d) return 0;
    if (d.flat) return Math.min(d.flat, total);
    if (d.rate) return Math.round(total * d.rate);
    return 0;
  };

  /* ══ TABS ══ */
  window.switchTab = function(id, btn){
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('on', 'bg-blue-50', 'border-brand-primary', 'text-brand-primary');
      b.classList.add('border-transparent');
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    
    btn.classList.add('on', 'bg-blue-50', 'border-brand-primary', 'text-brand-primary');
    btn.classList.remove('border-transparent');
    
    const panel = document.getElementById('p-'+id);
    if(panel) panel.classList.remove('hidden');

    // Reset offers UI if leaving UPI
    if (id !== 'upi') {
      const udr = document.getElementById('p-upi-dis-row');
      if (udr) udr.style.display = 'none';
      
      const ofr = document.getElementById('p-offer-row');
      if (ofr) {
          ofr.classList.remove('flex');
          ofr.classList.add('hidden');
      }

      const tv = document.getElementById('p-total-val');
      if(tv) tv.textContent = `₹${BASE_TOTAL.toLocaleString('en-IN')}`;
      
      const sb = document.getElementById('p-save-bar');
      if(sb) sb.style.display = 'none';
      
      if (id === 'emi') {
        let activeBank = 'HDFC';
        const sel = document.getElementById('other-emi-banks-select');
        if (sel && sel.value) activeBank = sel.value;
        else {
          const activeTile = document.querySelector('.ebank.on');
          if (activeTile) activeBank = activeTile.textContent;
        }
        window.renderEMIPlans(activeBank);
      }
    } else {
      window.applyUPIDiscount(activeUPI);
    }
  };

  /* ══ UPI ══ */
  window.selectUPI = function(key, el){
    document.querySelectorAll('.upi-tile').forEach(t => {
      t.classList.remove('on', 'border-brand-primary', 'bg-blue-50');
      t.classList.add('border-slate-200');
    });
    el.classList.add('on', 'border-brand-primary', 'bg-blue-50');
    el.classList.remove('border-slate-200');
    activeUPI = key;

    const logos={
      gpay: `<svg viewBox="0 0 24 24" width="22" height="22" style="display:block;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
      phonepe: `<svg fill="#5F259F" width="22" height="22" viewBox="0 0 24 24" style="display:block;"><path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/></svg>`,
      bhim: `<svg width="22" height="22" viewBox="0 0 100 100" style="display:block;"><path d="M20,15 L70,15 C85,15 85,45 70,45 C85,45 85,75 70,75 L20,75 Z" fill="url(#bhim-grad-qr)" /><path d="M20,15 L20,75 M20,45 L65,45" stroke="#FFF" stroke-width="8" stroke-linecap="round" /><defs><linearGradient id="bhim-grad-qr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FF9933" /><stop offset="50%" stop-color="#FF9933" /><stop offset="50%" stop-color="#128807" /><stop offset="100%" stop-color="#128807" /></linearGradient></defs></svg>`,
      amazon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FF9900" style="display:block;"><path d="M14.3781 4.9945c-.3732-.3227-.953-.4843-1.7401-.4843-.3895 0-.779.0355-1.1684.1054-.3901.0706-.7172.1636-.9824.2797-.0993.0418-.166.0849-.1991.1304-.0331.0456-.05.1267-.05.2422v.3352c0 .1491.0537.224.1617.224a.337.337 0 0 0 .1061-.0187c.0374-.0125.0687-.0225.093-.0312.6385-.1904 1.247-.2859 1.8275-.2859.4968 0 .8451.0912 1.0442.274.1991.1823.2984.4969.2984.9444v.8201c-.5799-.141-1.1023-.211-1.5667-.211-.729 0-1.3088.1804-1.74.5406-.4308.3601-.6467.8432-.6467 1.448 0 .5642.1741 1.013.5224 1.3488.3477.3358.8201.503 1.4168.503.3564 0 .7147-.0705 1.0754-.2109.3608-.1404.6897-.3402.988-.5967l.0625.41c.025.1574.116.236.274.236h.5343c.1654 0 .249-.083.249-.2484V6.4987c-.0006-.6797-.1872-1.1809-.5599-1.5042zm-.6091 4.6c-.2734.2072-.5593.3645-.8576.4725-.2984.108-.5842.1617-.8576.1617-.3233 0-.5717-.085-.7459-.2547-.1741-.1698-.2609-.412-.2609-.7271 0-.721.4682-1.0817 1.4044-1.0817.2153 0 .4369.015.6647.0437.2278.0293.4456.0687.6529.118z"/></svg>`
    };
    
    const qrLogo = document.getElementById('qr-logo');
    if (qrLogo) qrLogo.innerHTML = logos[key] || '💳';
    window.drawQR();

    window.applyUPIDiscount(key);
    const names={gpay:'Google Pay',phonepe:'PhonePe',bhim:'BHIM UPI',amazon:'Amazon Pay'};
    const offers={gpay:'5% Cashback',phonepe:'10% Off',bhim:'₹150 Off',amazon:'15% Cashback'};
    window.showToast(`${names[key]} selected · ${offers[key]} applied 🎉`,'success');
  };

  window.applyUPIDiscount = function(key){
    if (BASE_TOTAL === 0) return;
    const d=UPI_DATA[key];
    // Don't discount more than total
    const disc=getUPIDiscount(key, BASE_TOTAL);
    const final=BASE_TOTAL-disc;
    
    const udr = document.getElementById('p-upi-dis-row');
    if(udr) udr.style.display='flex';
    
    const udl = document.getElementById('p-upi-dis-lbl');
    if(udl) udl.textContent=d.label.split(' ').slice(2).join(' ');
    
    const udv = document.getElementById('p-upi-dis-val');
    if(udv) udv.textContent=`−₹${disc.toLocaleString('en-IN')}`;
    
    const tv = document.getElementById('p-total-val');
    if(tv) tv.textContent=`₹${final.toLocaleString('en-IN')}`;
    
    const sb = document.getElementById('p-save-bar');
    if(sb) {
      sb.style.display = 'block';
      // Assume a generic 20% savings roughly plus this UPI discount for the display message
      sb.innerHTML=`You save <strong class="text-green-600">₹${Math.floor(BASE_TOTAL * 0.2 + disc).toLocaleString('en-IN')}</strong> on this order 🎉`;
    }
    
    const ofr = document.getElementById('p-offer-row');
    if(ofr) {
      ofr.classList.remove('hidden');
      ofr.classList.add('flex');
    }
    
    const ot = document.getElementById('p-offer-txt');
    if(ot) ot.textContent=`${d.label} Applied`;
    
    const pt = document.getElementById('p-pay-txt');
    if(pt) pt.textContent=`Pay ₹${final.toLocaleString('en-IN')} via ${d.via.replace('UPI – ','')}`;
    
    const sa = document.getElementById('s-amt');
    if(sa) sa.textContent=`₹${final.toLocaleString('en-IN')}`;
    
    const sv = document.getElementById('s-via');
    if(sv) sv.textContent=d.via;
  };

  window.verifyUPI = function(){
    const v=document.getElementById('upi-id-inp').value.trim();
    const msg=document.getElementById('verify-msg');
    if(!v){msg.innerHTML='<span class="text-red-500">⚠️ Please enter a UPI ID</span>';return;}
    if(!v.includes('@')){msg.innerHTML='<span class="text-red-500">❌ Invalid format — must contain @</span>';return;}
    msg.innerHTML='<span class="text-blue-500">⏳ Verifying…</span>';
    setTimeout(()=>{
      msg.innerHTML=`<span class="text-green-600">✅ UPI ID verified: <strong>${v}</strong></span>`;
      window.showToast('UPI ID verified!','success');
    },1000);
  };

  window.drawQR = function(){
    const c=document.getElementById('qr-canvas');
    if(!c)return;
    const ctx=c.getContext('2d');
    if(!ctx)return;
    ctx.clearRect(0,0,180,180);
    ctx.fillStyle='white';ctx.fillRect(0,0,180,180);
    
    const cell=5;
    const m=20; 
    const n=28; 
    
    function fillCellRect(col, row, w, h, color='#0F172A') {
      ctx.fillStyle = color;
      ctx.fillRect(m + col*cell, m + row*cell, w*cell, h*cell);
    }
    
    function drawFinder(col, row) {
      fillCellRect(col, row, 7, 7, '#0F172A');
      fillCellRect(col+1, row+1, 5, 5, '#FFFFFF');
      fillCellRect(col+2, row+2, 3, 3, '#0F172A');
    }
    
    drawFinder(0, 0);       
    drawFinder(n-7, 0);     
    drawFinder(0, n-7);     
    
    fillCellRect(n-9, n-9, 5, 5, '#0F172A');
    fillCellRect(n-8, n-8, 3, 3, '#FFFFFF');
    fillCellRect(n-7, n-7, 1, 1, '#0F172A');
    
    let r=87654;
    for(let row=0;row<n;row++){
      for(let col=0;col<n;col++){
        if (row < 8 && col < 8) continue;
        if (row < 8 && col >= n - 8) continue;
        if (row >= n - 8 && col < 8) continue;
        if (row >= n - 10 && row < n - 4 && col >= n - 10 && col < n - 4) continue;
        
        if (row === 6 || col === 6) {
          if ((row === 6 && col % 2 === 0) || (col === 6 && row % 2 === 0)) {
            fillCellRect(col, row, 1, 1, '#0F172A');
          }
          continue;
        }
        
        r=(r*1664525+1013904223)&0xffffffff;
        if(r%2===0){
          fillCellRect(col, row, 1, 1, '#0F172A');
        }
      }
    }
  };

  let qrSecs=9*60+59;
  setInterval(()=>{
    qrSecs--;if(qrSecs<0)qrSecs=9*60+59;
    const m=Math.floor(qrSecs/60),s=qrSecs%60;
    const el=document.getElementById('qr-timer');
    if(el)el.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },1000);

  /* ══ CARD BIN DETECTION ══ */
  window.onCardNum = function(inp){
    let v=inp.value.replace(/\D/g,'').slice(0,16);
    v=v.match(/.{1,4}/g)?.join(' ')||v;
    inp.value=v;
    const d=v.replace(/\s/g,'');
    let disp='';
    const parts=v.split(' ');
    for(let i=0;i<4;i++){disp+=(parts[i]||'••••');if(i<3)disp+=' ';}
    const cn = document.getElementById('c-num');
    if(cn) cn.textContent=disp;
    window.detectBIN(d);
  };

  window.detectBIN = function(d){
    const banner=document.getElementById('bank-banner');
    if (!banner) return;
    if(d.length<4){
      banner.classList.remove('flex');
      banner.classList.add('hidden');
      document.getElementById('cf-sfx').innerHTML='💳';
      document.getElementById('c-net').innerHTML='💳';
      document.getElementById('c-bank-lbl').textContent='YOUR BANK';
      const cchip = document.getElementById('c-chip');
      if(cchip) cchip.innerHTML = `<svg viewBox="0 0 100 80" width="40" height="32" xmlns="http://www.w3.org/2000/svg" class="opacity-80"><rect x="5" y="5" width="90" height="70" rx="8" ry="8" fill="#eab308"/><path d="M 5 25 L 30 25 L 30 5 M 30 55 L 30 75 M 5 55 L 30 55 M 70 5 L 70 25 L 95 25 M 70 55 L 95 55 M 70 55 L 70 75 M 20 25 C 50 25, 50 55, 20 55 M 80 25 C 50 25, 50 55, 80 55" stroke="#ca8a04" stroke-width="3" fill="none"/></svg>`;
      return;
    }
    
    let bankFound = false;
    let bankName = 'YOUR BANK';
    let iconHTML = '💳';
    let bannerColor = '#1D4ED8';
    let bannerBg = '#EFF6FF';
    let offer = 'Standard Credit Card Offer applies';
    let network = 'Visa/MasterCard';
    let chipHTML = `<svg viewBox="0 0 100 80" width="40" height="32" xmlns="http://www.w3.org/2000/svg" class="opacity-80"><rect x="5" y="5" width="90" height="70" rx="8" ry="8" fill="#eab308"/><path d="M 5 25 L 30 25 L 30 5 M 30 55 L 30 75 M 5 55 L 30 55 M 70 5 L 70 25 L 95 25 M 70 55 L 95 55 M 70 55 L 70 75 M 20 25 C 50 25, 50 55, 20 55 M 80 25 C 50 25, 50 55, 80 55" stroke="#ca8a04" stroke-width="3" fill="none"/></svg>`;
    
    if (d.endsWith('1111')) {
        bankFound = true; bankName = 'HDFC BANK'; 
        iconHTML = '<span class="bg-blue-800 text-white font-bold px-2 py-1 rounded text-xs inline-block shadow-sm">HDFC</span>';
        chipHTML = '<svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md"><rect x="0" y="0" width="100" height="100" rx="10" fill="#002f6c"/><rect x="20" y="20" width="60" height="60" fill="#e21a22"/><rect x="42" y="20" width="16" height="60" fill="#ffffff"/><rect x="20" y="42" width="60" height="16" fill="#ffffff"/></svg>';
        bannerColor = '#1e3a8a'; offer = '5% cashback on electronics'; network = 'Visa';
    } else if (d.endsWith('2222')) {
        bankFound = true; bankName = 'PNB'; 
        iconHTML = '<span class="bg-orange-500 text-white font-bold px-2 py-1 rounded text-xs inline-block shadow-sm">PNB</span>';
        chipHTML = '<svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md"><circle cx="50" cy="50" r="46" fill="#fdb813" stroke="#a31f37" stroke-width="3"/><path d="M 42 75 L 42 32 A 15 15 0 1 1 42 62" fill="none" stroke="#a31f37" stroke-width="8" stroke-linecap="round"/><path d="M 28 32 L 42 32" fill="none" stroke="#a31f37" stroke-width="8" stroke-linecap="round"/></svg>';
        bannerColor = '#f97316'; offer = '10% off on first PNB transaction'; network = 'RuPay';
    } else if (d.endsWith('3333')) {
        bankFound = true; bankName = 'SBI'; 
        iconHTML = '<span class="bg-blue-500 text-white font-bold px-2 py-1 rounded text-xs inline-block shadow-sm">SBI</span>';
        chipHTML = '<svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md"><circle cx="50" cy="50" r="48" fill="#00a1e0"/><circle cx="50" cy="45" r="16" fill="#ffffff"/><rect x="45" y="55" width="10" height="25" fill="#ffffff"/></svg>';
        bannerColor = '#3b82f6'; offer = 'Extra 5% off via SBI SimplyCLICK'; network = 'MasterCard';
    } else if (d.endsWith('4444')) {
        bankFound = true; bankName = 'AXIS BANK'; 
        iconHTML = '<span class="bg-red-800 text-white font-bold px-2 py-1 rounded text-xs inline-block shadow-sm">AXIS</span>';
        chipHTML = '<svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md"><rect x="0" y="0" width="100" height="100" rx="10" fill="#ae2839"/><polygon points="50,20 20,80 35,80 50,45 65,80 80,80" fill="#ffffff"/><polygon points="60,30 80,80 95,80" fill="#ffffff"/></svg>';
        bannerColor = '#991b1b'; offer = '10% discount on fashion'; network = 'Visa';
    } else {
        for(const b of BINS){
          if(b.re.test(d)){
            bankFound = true;
            bankName = b.bank.toUpperCase();
            iconHTML = b.icon;
            bannerColor = b.color;
            bannerBg = b.bg;
            offer = b.offer;
            network = b.net;
            break;
          }
        }
    }
    
    document.getElementById('cf-sfx').innerHTML = iconHTML;
    document.getElementById('c-net').innerHTML = iconHTML;
    document.getElementById('c-bank-lbl').textContent = bankName;
    const cchip = document.getElementById('c-chip');
    if (cchip) cchip.innerHTML = chipHTML;
    
    if(bankFound){
      banner.classList.add('flex');
      banner.classList.remove('hidden');
      banner.style.background=bannerBg;
      banner.style.borderLeft = `4px solid ${bannerColor}`;
      
      document.getElementById('b-icon').innerHTML=iconHTML;
      document.getElementById('b-name').textContent=`${bankName} · ${network}`;
      document.getElementById('b-offer').textContent=`🎁 ${offer}`;
    } else {
      banner.classList.remove('flex');
      banner.classList.add('hidden');
    }
  };

  window.onExpiry = function(inp){
    let v=inp.value.replace(/\D/g,'');
    if(v.length>=2)v=v.slice(0,2)+' / '+v.slice(2,4);
    inp.value=v;
    const ce = document.getElementById('c-exp-disp');
    if (ce) ce.textContent=v||'MM/YY';
  };

  /* ══ EMI & NET BANKING ══ */

  window.renderEMIPlans = function(bankName) {
    const container = document.getElementById('emi-plans-container');
    const title = document.getElementById('emi-plans-title');
    if (!container) return;
    
    if (title) title.textContent = `Available EMI Plans for ${bankName}`;
    
    if (BASE_TOTAL < 3000) {
      container.innerHTML = '<div class="col-span-2 text-sm text-red-500 py-4 text-center">EMI is only available for orders above ₹3,000.</div>';
      return;
    }
    
    // Modern Indian Market EMI Rates (approximate)
    const plans = [
      { mo: 3, rate: 0, tag: 'No Cost EMI' },
      { mo: 6, rate: 0, tag: 'No Cost EMI' },
      { mo: 9, rate: 15 },
      { mo: 12, rate: 15 },
      { mo: 18, rate: 16 },
      { mo: 24, rate: 16.5 }
    ];
    
    let html = '';
    plans.forEach((p, idx) => {
      // Calculate EMI with interest
      let emiAmt;
      let totalInterest = 0;
      if (p.rate === 0) {
        emiAmt = Math.round(BASE_TOTAL / p.mo);
      } else {
        const monthlyRate = (p.rate / 100) / 12;
        emiAmt = Math.round((BASE_TOTAL * monthlyRate * Math.pow(1 + monthlyRate, p.mo)) / (Math.pow(1 + monthlyRate, p.mo) - 1));
        totalInterest = (emiAmt * p.mo) - BASE_TOTAL;
      }
      
      const interestText = p.rate === 0 ? `<div class="text-sm text-green-600 font-medium">${p.tag}</div>` : `<div class="text-sm text-slate-500">${p.rate}% p.a. | Int: ₹${totalInterest}</div>`;
      
      html += `
        <div class="emi-tile ${idx===0 ? 'on border-brand-primary bg-blue-50' : 'border-slate-200'} border p-3 rounded-2xl cursor-pointer hover:bg-slate-50 transition" onclick="selectEMI(this, ${p.mo}, ${emiAmt}, ${p.rate})">
          <div class="flex justify-between items-center mb-1">
            <div class="font-bold text-slate-800">${p.mo} Months</div>
            <div class="font-bold text-brand-primary">₹${emiAmt.toLocaleString('en-IN')}/mo</div>
          </div>
          ${interestText}
        </div>
      `;
      
      // Auto-select first plan
      if (idx === 0) {
        window.selectEMI(null, p.mo, emiAmt, p.rate, true);
      }
    });
    
    container.innerHTML = html;
  };

  window.selectEMI = function(el,mo,amt,interest, isSilent=false){
    if (el) {
      document.querySelectorAll('.emi-tile').forEach(t=>{
        t.classList.remove('on', 'border-brand-primary', 'bg-blue-50');
        t.classList.add('border-slate-200');
      });
      el.classList.add('on', 'border-brand-primary', 'bg-blue-50');
      el.classList.remove('border-slate-200');
    }
    
    const pt = document.getElementById('p-pay-txt');
    if(pt) pt.textContent=`Start EMI · ₹${amt.toLocaleString('en-IN')}/mo × ${mo}`;
    
    const sv = document.getElementById('s-via');
    if(sv) sv.textContent=`EMI – ${mo} Months @ ₹${amt}/mo`;
    
    if (!isSilent) window.showToast(`${mo}-month EMI selected · ₹${amt}/month`,'success');
  };

  window.toggleBank = function(el, bankName){
    document.querySelectorAll('.ebank').forEach(e=>{
      e.classList.remove('on', 'border-brand-primary', 'bg-blue-50');
      e.classList.add('border-slate-200');
    });
    
    const sel = document.getElementById('other-emi-banks-select');
    if (sel && el !== sel) {
        sel.value = '';
        sel.classList.remove('border-brand-primary', 'bg-blue-50');
        sel.classList.add('border-slate-300');
    }

    if (el) {
        el.classList.add('on', 'border-brand-primary', 'bg-blue-50');
        if (el.classList && el.classList.contains('ebank')) {
             el.classList.remove('border-slate-200');
        } else if (el.classList) {
             el.classList.remove('border-slate-300');
        }
    }
    
    window.renderEMIPlans(bankName);
  };

  window.selectNB = function(el,name){
    document.querySelectorAll('.nb-tile').forEach(t=>{
      t.classList.remove('on', 'border-brand-primary', 'bg-blue-50');
      t.classList.add('border-slate-200');
    });
    
    const sel = document.getElementById('other-banks-select');
    if (sel && el !== sel) {
        sel.value = '';
        sel.classList.remove('border-brand-primary', 'bg-blue-50');
        sel.classList.add('border-slate-300');
    }

    if (el) {
        el.classList.add('on', 'border-brand-primary', 'bg-blue-50');
        if (el.classList.contains('nb-tile')) {
             el.classList.remove('border-slate-200');
        } else {
             el.classList.remove('border-slate-300');
        }
    }
    
    const pt = document.getElementById('p-pay-txt');
    if(pt) pt.textContent=`Pay via ${name} Net Banking`;
    
    const sv = document.getElementById('s-via');
    if(sv) sv.textContent=`Net Banking – ${name}`;
    window.showToast(`${name} selected`,'info');
  };

  /* ══ TOAST ══ */
  window.showToast = function(msg,type='success'){
    const zone = document.getElementById('tz');
    if (!zone) return;
    const t = document.createElement('div');
    const colors = {success:'border-green-600',error:'border-red-500',warning:'border-orange-500',info:'border-blue-600'};
    const ic = {success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    
    t.className = `flex items-center gap-3 bg-white text-slate-800 px-4 py-3 shadow-lg rounded-2xl border-l-4 ${colors[type]||colors.success} transform transition-all translate-y-4 opacity-0`;
    t.innerHTML = `<span>${ic[type]||'✅'}</span><span class="text-sm font-medium">${msg}</span>`;
    
    zone.appendChild(t);
    
    // Animate in
    requestAnimationFrame(() => {
      t.classList.remove('translate-y-4', 'opacity-0');
    });
    
    // Animate out
    setTimeout(() => {
      t.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => t.remove(), 300);
    }, 3200);
  };

  /* ══ PLACE ORDER ══ */
  window.placeOrder = function(cartInstance){
    if (cartInstance.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const btn = document.getElementById('p-pay-btn');
    const txt = document.getElementById('p-pay-txt');
    if (!btn || !txt) return;

    // Detect paid via and amount
    let paidVia = 'UPI';
    let finalAmt = BASE_TOTAL;

    const upiPanel = document.getElementById('p-upi');
    const cardPanel = document.getElementById('p-card');
    const emiPanel = document.getElementById('p-emi');
    const nbPanel = document.getElementById('p-nb');

    if (upiPanel && !upiPanel.classList.contains('hidden')) {
      const d = UPI_DATA[activeUPI];
      const disc = getUPIDiscount(activeUPI, BASE_TOTAL);
      finalAmt = BASE_TOTAL - disc;
      paidVia = d.via;
    } else if (cardPanel && !cardPanel.classList.contains('hidden')) {
      paidVia = 'Credit/Debit Card';
      const bankLabel = document.getElementById('c-bank-lbl')?.textContent;
      if (bankLabel && bankLabel !== 'YOUR BANK') {
        paidVia = `Card (${bankLabel})`;
      }
    } else if (emiPanel && !emiPanel.classList.contains('hidden')) {
      const selectedPlanEl = document.querySelector('.emi-tile.on');
      if (selectedPlanEl) {
        const planText = selectedPlanEl.querySelector('.font-bold')?.textContent || '';
        const emiAmtText = selectedPlanEl.querySelector('.text-brand-primary')?.textContent || '';
        paidVia = `EMI – ${planText} @ ${emiAmtText}`;
      } else {
        paidVia = 'EMI';
      }
    } else if (nbPanel && !nbPanel.classList.contains('hidden')) {
      const selectedNBEl = document.querySelector('.nb-tile.on');
      const bankName = selectedNBEl ? selectedNBEl.querySelector('span')?.textContent : '';
      paidVia = bankName ? `Net Banking – ${bankName}` : 'Net Banking';
    }

    btn.style.pointerEvents = 'none';
    const origHtml = txt.innerHTML;
    txt.innerHTML = '<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spinit .7s linear infinite;display:inline-block"></div>&nbsp;Processing…';
    
    setTimeout(()=>{
      txt.innerHTML = '✅ Payment Successful!';
      btn.classList.add('bg-green-600');
      btn.classList.remove('bg-[#fb641b]', 'hover:bg-[#f25e17]');
      
      setTimeout(()=>{
        document.getElementById('s-oid').textContent = '#SHO-'+Date.now().toString().slice(-6);
        document.getElementById('s-amt').textContent = `₹${finalAmt.toLocaleString('en-IN')}`;
        document.getElementById('s-via').textContent = paidVia;

        const sov = document.getElementById('sov');
        if(sov) {
          sov.classList.remove('hidden');
          sov.classList.add('flex');
        }
        
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-[#fb641b]', 'hover:bg-[#f25e17]');
        btn.style.pointerEvents = '';
        txt.innerHTML = origHtml;
      }, 600);
    }, 2200);
  };

  window.handleCOD = function(cartInstance) {
    if (cartInstance.items.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const btn = document.querySelector('.btn-cod');
    if(!btn) return;

    const origText = btn.innerHTML;
    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(15,23,42,.4);border-top-color:#0f172a;border-radius:50%;animation:spinit .7s linear infinite;display:inline-block"></div>&nbsp;Confirming...';
    
    setTimeout(() => {
      document.getElementById('s-oid').textContent = '#SHO-' + Date.now().toString().slice(-6);
      document.getElementById('s-amt').textContent = '₹' + BASE_TOTAL.toLocaleString('en-IN');
      document.getElementById('s-via').textContent = 'Cash on Delivery (COD)';
      
      document.querySelector('.s-title').textContent = 'Order Placed! 📦';
      document.querySelector('.s-sub').textContent = 'Your order is confirmed. Please keep cash ready at the time of delivery.';
      
      const sov = document.getElementById('sov');
      if(sov) {
        sov.classList.remove('hidden');
        sov.classList.add('flex');
      }
      
      btn.innerHTML = origText;
      btn.style.pointerEvents = '';
    }, 1500);
  };

  /* ══ INIT ══ */
  // Initial draw
  setTimeout(() => {
    const defaultTile = document.getElementById('tile-gpay');
    if (defaultTile) {
      window.selectUPI('gpay', defaultTile);
    } else {
      window.drawQR();
      window.applyUPIDiscount('gpay');
    }
  }, 100);
}
