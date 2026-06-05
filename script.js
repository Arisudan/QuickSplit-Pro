document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 QuickSplit Pro DOMContentLoaded listener fired.");
  // --- STATE ---
  let friends = []; // Start with a clean blank slate of friends
  let items = [];
  let taxType = 'percent'; // 'percent' or 'amount'
  let tipType = 'percent'; // 'percent' or 'amount'
  let payments = {}; // { name: paidAmount }
  let editingItemId = null;
  let ledgerFilterFriend = 'All';
  let ledgerSearchQuery = '';
  let friendColorOverrides = {}; // { name: colorIndex }
  let mediaStream = null;
  let lastCalculatedGrandTotal = 0; // cache to use in paidAll
  let expandedFriends = {}; // { friendName: true/false }
  let history = [];
  let settledTransfers = {};
  
  // --- DOM ELEMENTS ---
  const currencySelect = document.getElementById('currency-select');
  const priceCurrencySymbol = document.getElementById('price-currency-symbol');
  
  const historyModal = document.getElementById('history-modal');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const btnOpenHistory = document.getElementById('btn-open-history');
  const btnSaveSession = document.getElementById('btn-save-session');
  const sessionTitleInput = document.getElementById('session-title-input');
  const historyListContainer = document.getElementById('history-list-container');
  
  const addFriendForm = document.getElementById('add-friend-form');
  const friendNameInput = document.getElementById('friend-name');
  const friendsListContainer = document.getElementById('friends-list');
  const friendFormWarning = document.getElementById('friend-form-warning');
  
  const addItemForm = document.getElementById('add-item-form');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const itemQtyInput = document.getElementById('item-qty');
  const btnAddItem = document.getElementById('btn-add-item');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const itemFormWarning = document.getElementById('item-form-warning');
  
  const taxInput = document.getElementById('tax-input');
  const taxTypeGroup = document.getElementById('tax-type-group');
  const taxCurrencySymbol = document.getElementById('tax-currency-symbol');
  const taxPercentSuffix = document.getElementById('tax-percent-suffix');
  
  const tipInput = document.getElementById('tip-input');
  const tipTypeGroup = document.getElementById('tip-type-group');
  const tipCurrencySymbol = document.getElementById('tip-currency-symbol');
  const tipPercentSuffix = document.getElementById('tip-percent-suffix');
  const serviceChargeToggle = document.getElementById('service-charge-toggle');
  
  const itemsListContainer = document.getElementById('items-list-container');
  const ledgerSearchInput = document.getElementById('ledger-search');
  const ledgerFiltersContainer = document.getElementById('ledger-filters');
  
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryTax = document.getElementById('summary-tax');
  const summaryTip = document.getElementById('summary-tip');
  const summaryTotal = document.getElementById('summary-total');
  
  const friendsBreakdownContainer = document.getElementById('friends-breakdown-container');
  const btnShare = document.getElementById('btn-share');
  const btnDownloadReceipt = document.getElementById('btn-download-receipt');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  let toastTimeout = null;

  const themeToggle = document.getElementById('theme-toggle');
  const btnResetBill = document.getElementById('btn-reset-bill');
  const paymentsListContainer = document.getElementById('payments-list-container');
  const btnSplitUnpaid = document.getElementById('btn-split-unpaid');
  const settlementWrapper = document.getElementById('settlement-wrapper');
  const settlementListContainer = document.getElementById('settlement-list-container');

  // --- OCR SCANNER & VOICE DOM ELEMENTS ---
  const btnVoiceInput = document.getElementById('btn-voice-input');
  const btnOpenScanner = document.getElementById('btn-open-scanner');
  const scannerModal = document.getElementById('scanner-modal');
  const btnCloseScanner = document.getElementById('btn-close-scanner');
  const tabScanFile = document.getElementById('tab-scan-file');
  const tabScanCamera = document.getElementById('tab-scan-camera');
  const scanFileSection = document.getElementById('scan-file-section');
  const scanCameraSection = document.getElementById('scan-camera-section');
  const fileDropZone = document.getElementById('file-drop-zone');
  const btnChooseFile = document.getElementById('btn-choose-file');
  const scanFileInput = document.getElementById('scan-file-input');
  const cameraStream = document.getElementById('camera-stream');
  const cameraCaptureCanvas = document.getElementById('camera-capture-canvas');
  const btnCaptureSnapshot = document.getElementById('btn-capture-snapshot');
  const scannerLoading = document.getElementById('scanner-loading');
  const scannerResultsSection = document.getElementById('scanner-results-section');
  const scannedItemsList = document.getElementById('scanned-items-list');
  const btnReScan = document.getElementById('btn-re-scan');
  const btnImportScanned = document.getElementById('btn-import-scanned');

  // --- SVG ILLUSTRATIONS ---
  const SVG_EMPTY_FRIENDS = `
    <div class="empty-state">
      <svg class="empty-illustration" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <p class="empty-text">No friends added yet. Add names above to get started!</p>
    </div>
  `;

  const SVG_EMPTY_ITEMS = `
    <div class="empty-state">
      <svg class="empty-illustration" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
      <p class="empty-text">No items added to the bill yet.</p>
    </div>
  `;

  const SVG_EMPTY_BREAKDOWN = `
    <div class="empty-state">
      <svg class="empty-illustration" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      <p class="empty-text">Breakdown will generate as friends and items are added.</p>
    </div>
  `;

  // --- AVATAR HELPERS ---
  const AVATAR_COLORS = [
    { bg: 'hsl(260, 60%, 55%)', text: '#ffffff' }, // Indigo
    { bg: 'hsl(190, 75%, 45%)', text: '#ffffff' }, // Cyan
    { bg: 'hsl(145, 60%, 42%)', text: '#ffffff' }, // Green
    { bg: 'hsl(25, 75%, 50%)', text: '#ffffff' },  // Orange
    { bg: 'hsl(340, 70%, 50%)', text: '#ffffff' }, // Pink
    { bg: 'hsl(285, 60%, 48%)', text: '#ffffff' }, // Purple
    { bg: 'hsl(210, 70%, 45%)', text: '#ffffff' }  // Blue
  ];
  
  function getAvatarColor(name) {
    if (friendColorOverrides[name] !== undefined) {
      return AVATAR_COLORS[friendColorOverrides[name] % AVATAR_COLORS.length];
    }
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  window.cycleFriendColor = function(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const defaultIndex = Math.abs(hash) % AVATAR_COLORS.length;
    
    let currentIndex = friendColorOverrides[name] !== undefined ? friendColorOverrides[name] : defaultIndex;
    let nextIndex = (currentIndex + 1) % AVATAR_COLORS.length;
    friendColorOverrides[name] = nextIndex;
    
    saveLocalStorage();
    renderAll();
  };

  function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // --- CURRENCY HANDLERS ---
  currencySelect.addEventListener('change', () => {
    updateCurrencySymbol();
    renderAll();
  });

  function updateCurrencySymbol() {
    const selectedOption = currencySelect.options[currencySelect.selectedIndex];
    const symbol = selectedOption.getAttribute('data-symbol');
    priceCurrencySymbol.textContent = symbol;
    taxCurrencySymbol.textContent = symbol;
    tipCurrencySymbol.textContent = symbol;
  }

  function formatMoney(amount) {
    const code = currencySelect.value;
    let locale = 'en-US';
    switch (code) {
      case 'INR': locale = 'en-IN'; break;
      case 'EUR': locale = 'de-DE'; break;
      case 'GBP': locale = 'en-GB'; break;
      case 'JPY': locale = 'ja-JP'; break;
      case 'CAD': locale = 'en-CA'; break;
      case 'AUD': locale = 'en-AU'; break;
      case 'SGD': locale = 'en-SG'; break;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code
    }).format(amount);
  }

  // --- FRIENDS MANAGEMENT ---
  addFriendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = friendNameInput.value.trim();
    if (!name) return;

    if (friends.map(f => f.toLowerCase()).includes(name.toLowerCase())) {
      showToast('A friend with this name already exists.');
      return;
    }

    friends.push(name);
    friendNameInput.value = '';
    friendFormWarning.style.display = 'none';
    friendNameInput.classList.remove('input-error');
    friendNameInput.focus();

    renderAll();
  });

  window.removeFriend = function(name) {
    const chips = friendsListContainer.querySelectorAll('.chip');
    const element = Array.from(chips).find(el => {
      const span = el.querySelector('span');
      return span && span.textContent.trim() === name.trim();
    });

    if (element) {
      element.classList.add('collapsing');
      element.addEventListener('animationend', () => {
        executeRemoveFriend(name);
      });
    } else {
      executeRemoveFriend(name);
    }
  };

  function executeRemoveFriend(name) {
    friends = friends.filter(f => f !== name);
    items.forEach(item => {
      if (item.assignees && typeof item.assignees === 'object') {
        delete item.assignees[name];
      }
    });
    renderAll();
  }

  // Proactive duplicate friend check
  friendNameInput.addEventListener('input', () => {
    const name = friendNameInput.value.trim().toLowerCase();
    const btnAdd = document.getElementById('btn-add-friend');
    
    if (!name) {
      friendNameInput.classList.remove('input-error');
      btnAdd.disabled = false;
      friendFormWarning.style.display = 'none';
      return;
    }

    if (friends.map(f => f.toLowerCase()).includes(name)) {
      friendNameInput.classList.add('input-error');
      btnAdd.disabled = true;
      friendFormWarning.style.display = 'block';
      friendFormWarning.textContent = '⚠️ Name already added';
    } else {
      friendNameInput.classList.remove('input-error');
      btnAdd.disabled = false;
      friendFormWarning.style.display = 'none';
    }
  });

  // --- ITEMS MANAGEMENT ---
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value) || 0;
    const qty = parseInt(itemQtyInput.value, 10) || 1;

    if (!name) return;
    if (price <= 0) {
      showToast('Please enter a valid price greater than zero.');
      return;
    }
    if (qty <= 0) {
      showToast('Please enter a valid quantity greater than zero.');
      return;
    }

    if (editingItemId) {
      const item = items.find(i => i.id === editingItemId);
      if (item) {
        item.name = name;
        item.price = price;
        item.qty = qty;
        showToast('Item updated successfully.');
      }
      editingItemId = null;
      btnAddItem.textContent = 'Add Item to Bill';
      if (btnCancelEdit) btnCancelEdit.style.display = 'none';
    } else {
      const newItem = {
        id: Date.now().toString(),
        name,
        price,
        qty,
        assignees: {}
      };
      items.push(newItem);
    }

    itemNameInput.value = '';
    itemPriceInput.value = '';
    itemQtyInput.value = '1';

    renderAll();
    itemNameInput.focus();
  });

  window.removeItem = function(itemId) {
    const itemElements = itemsListContainer.querySelectorAll('.ledger-item');
    const element = Array.from(itemElements).find(el => el.getAttribute('data-id') === itemId);
    
    if (element) {
      element.classList.add('collapsing');
      element.addEventListener('animationend', () => {
        items = items.filter(item => item.id !== itemId);
        renderAll();
      });
    } else {
      items = items.filter(item => item.id !== itemId);
      renderAll();
    }
  };



  // --- ITEM FORM PROACTIVE VALIDATION ENGINE ---
  function validateItemForm() {
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value) || 0;
    const qty = parseInt(itemQtyInput.value, 10) || 1;
    let isValid = name.length > 0 && price > 0 && qty > 0;
    
    btnAddItem.disabled = !isValid;

    if (!isValid && (name.length > 0 || price > 0)) {
      itemFormWarning.style.display = 'block';
      if (price <= 0) {
        itemFormWarning.textContent = '⚠️ Price must be greater than zero.';
      } else {
        itemFormWarning.textContent = '⚠️ Fill in all details to add the item.';
      }
    } else {
      itemFormWarning.style.display = 'none';
    }
  }

  itemNameInput.addEventListener('input', validateItemForm);
  itemPriceInput.addEventListener('input', validateItemForm);

  // --- STEPPER EVENT LISTENERS ---
  const btnMinus = document.querySelector('.btn-step-minus');
  const btnPlus = document.querySelector('.btn-step-plus');
  
  if (btnMinus && btnPlus) {
    btnMinus.addEventListener('click', () => {
      let val = parseInt(itemQtyInput.value, 10) || 1;
      if (val > 1) {
        itemQtyInput.value = val - 1;
        validateItemForm();
      }
    });

    btnPlus.addEventListener('click', () => {
      let val = parseInt(itemQtyInput.value, 10) || 1;
      itemQtyInput.value = val + 1;
      validateItemForm();
    });
  }

  // --- THEME MANAGEMENT ---
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }

  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // --- LOCAL STORAGE & SESSION STORAGE PERSISTENCE ---
  function loadLocalStorage() {
    try {
      const savedFriends = sessionStorage.getItem('qs_friends');
      if (savedFriends) friends = JSON.parse(savedFriends);

      const savedItems = sessionStorage.getItem('qs_items');
      if (savedItems) {
        items = JSON.parse(savedItems);
        items.forEach(item => {
          if (Array.isArray(item.assignees)) {
            const legacyArr = item.assignees;
            item.assignees = {};
            legacyArr.forEach(f => {
              item.assignees[f] = 1;
            });
          } else if (!item.assignees || typeof item.assignees !== 'object') {
            item.assignees = {};
          }
        });
      }

      const savedTaxType = sessionStorage.getItem('qs_tax_type');
      if (savedTaxType) taxType = savedTaxType;

      const savedTaxVal = sessionStorage.getItem('qs_tax_val');
      if (savedTaxVal) taxInput.value = savedTaxVal;

      const savedTipType = sessionStorage.getItem('qs_tip_type');
      if (savedTipType) tipType = savedTipType;

      const savedTipVal = sessionStorage.getItem('qs_tip_val');
      if (savedTipVal) tipInput.value = savedTipVal;

      const savedServiceChargeEnabled = sessionStorage.getItem('qs_service_charge_enabled');
      if (savedServiceChargeEnabled !== null && serviceChargeToggle) {
        if (savedServiceChargeEnabled === 'true') {
          serviceChargeToggle.classList.add('active');
        } else {
          serviceChargeToggle.classList.remove('active');
        }
      }

      const savedCurrency = sessionStorage.getItem('qs_currency');
      if (savedCurrency) currencySelect.value = savedCurrency;

      const savedPayments = sessionStorage.getItem('qs_payments');
      if (savedPayments) payments = JSON.parse(savedPayments);

      const savedColorOverrides = sessionStorage.getItem('qs_color_overrides');
      if (savedColorOverrides) friendColorOverrides = JSON.parse(savedColorOverrides);

      // History is explicitly saved, so we persist it in localStorage
      const savedHistory = localStorage.getItem('qs_history');
      if (savedHistory) history = JSON.parse(savedHistory);

      const savedSettled = sessionStorage.getItem('qs_settled_transfers');
      if (savedSettled) settledTransfers = JSON.parse(savedSettled);
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }

  function saveLocalStorage() {
    try {
      sessionStorage.setItem('qs_friends', JSON.stringify(friends));
      sessionStorage.setItem('qs_items', JSON.stringify(items));
      sessionStorage.setItem('qs_tax_type', taxType);
      sessionStorage.setItem('qs_tax_val', taxInput.value);
      sessionStorage.setItem('qs_tip_type', tipType);
      sessionStorage.setItem('qs_tip_val', tipInput.value);
      if (serviceChargeToggle) {
        sessionStorage.setItem('qs_service_charge_enabled', serviceChargeToggle.classList.contains('active'));
      }
      sessionStorage.setItem('qs_currency', currencySelect.value);
      sessionStorage.setItem('qs_payments', JSON.stringify(payments));
      sessionStorage.setItem('qs_color_overrides', JSON.stringify(friendColorOverrides));
      
      // History is explicitly saved, so we persist it in localStorage
      localStorage.setItem('qs_history', JSON.stringify(history));
      
      sessionStorage.setItem('qs_settled_transfers', JSON.stringify(settledTransfers));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function syncToggleGroups() {
    const taxButtons = taxTypeGroup.querySelectorAll('.btn-toggle');
    taxButtons.forEach(btn => {
      if (btn.getAttribute('data-type') === taxType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (taxType === 'percent') {
      taxCurrencySymbol.style.display = 'none';
      taxPercentSuffix.style.display = 'inline';
      taxInput.placeholder = '5';
    } else {
      taxCurrencySymbol.style.display = 'inline';
      taxPercentSuffix.style.display = 'none';
      taxInput.placeholder = '0.00';
    }

    const tipButtons = tipTypeGroup.querySelectorAll('.btn-toggle');
    tipButtons.forEach(btn => {
      if (btn.getAttribute('data-type') === tipType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (tipType === 'percent') {
      tipCurrencySymbol.style.display = 'none';
      tipPercentSuffix.style.display = 'inline';
      tipInput.placeholder = '10';
    } else {
      tipCurrencySymbol.style.display = 'inline';
      tipPercentSuffix.style.display = 'none';
      tipInput.placeholder = '0.00';
    }
  }

  function syncServiceChargeToggleVisuals() {
    if (!serviceChargeToggle) return;
    const isEnabled = serviceChargeToggle.classList.contains('active');
    const tipGroup = tipInput.closest('.input-group');
    if (tipGroup) {
      if (isEnabled) {
        tipGroup.classList.remove('service-charge-disabled');
        tipInput.disabled = false;
      } else {
        tipGroup.classList.add('service-charge-disabled');
        tipInput.disabled = true;
      }
    }
  }

  // --- INITIALIZE APP ---
  loadLocalStorage();
  updateCurrencySymbol();
  syncToggleGroups();
  syncServiceChargeToggleVisuals();

  if (serviceChargeToggle) {
    serviceChargeToggle.addEventListener('click', () => {
      serviceChargeToggle.classList.toggle('active');
      syncServiceChargeToggleVisuals();
      calculateAndRenderTotals();
      saveLocalStorage();
    });
  }

  setupToggleGroup(taxTypeGroup, (type) => {
    taxType = type;
    if (type === 'percent') {
      taxCurrencySymbol.style.display = 'none';
      taxPercentSuffix.style.display = 'inline';
      taxInput.placeholder = '5';
    } else {
      taxCurrencySymbol.style.display = 'inline';
      taxPercentSuffix.style.display = 'none';
      taxInput.placeholder = '0.00';
    }
    calculateAndRenderTotals();
    saveLocalStorage();
  });

  setupToggleGroup(tipTypeGroup, (type) => {
    tipType = type;
    if (type === 'percent') {
      tipCurrencySymbol.style.display = 'none';
      tipPercentSuffix.style.display = 'inline';
      tipInput.placeholder = '10';
    } else {
      tipCurrencySymbol.style.display = 'inline';
      tipPercentSuffix.style.display = 'none';
      tipInput.placeholder = '0.00';
    }
    calculateAndRenderTotals();
    saveLocalStorage();
  });

  taxInput.addEventListener('input', () => {
    calculateAndRenderTotals();
    saveLocalStorage();
  });
  
  tipInput.addEventListener('input', () => {
    calculateAndRenderTotals();
    saveLocalStorage();
  });

  btnResetBill.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all friends, items, and payments?')) {
      friends = [];
      items = [];
      payments = {};
      taxInput.value = '5';
      tipInput.value = '10';
      taxType = 'percent';
      tipType = 'percent';
      editingItemId = null;
      ledgerFilterFriend = 'All';
      ledgerSearchQuery = '';
      friendColorOverrides = {};
      settledTransfers = {};
      
      const searchInput = document.getElementById('ledger-search');
      if (searchInput) searchInput.value = '';
      
      if (btnCancelEdit) btnCancelEdit.style.display = 'none';
      if (btnAddItem) btnAddItem.textContent = 'Add Item to Bill';
      
      if (serviceChargeToggle) serviceChargeToggle.classList.add('active');
      syncServiceChargeToggleVisuals();
      syncToggleGroups();
      renderAll();
      showToast('Bill data reset successfully.');
    }
  });

  renderAll();

  function setupToggleGroup(groupElement, onChange) {
    const buttons = groupElement.querySelectorAll('.btn-toggle');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const type = button.getAttribute('data-type');
        onChange(type);
      });
    });
  }

  // --- RENDER FUNCTIONS ---
  function renderAll() {
    renderFriendsChips();
    renderLedgerFilters();
    renderItemsLedger();
    calculateAndRenderTotals();
    validateItemForm();
    saveLocalStorage();
  }

  function renderFriendsChips() {
    friendsListContainer.innerHTML = '';
    
    if (friends.length === 0) {
      friendsListContainer.innerHTML = SVG_EMPTY_FRIENDS;
      return;
    }

    friends.forEach(name => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const initials = getInitials(name);
      const color = getAvatarColor(name);
      chip.innerHTML = `
        <span class="mini-avatar" style="background:${color.bg}; color:${color.text}; margin-right: 4px;">${initials}</span>
        <span>${escapeHtml(name)}</span>
        <button type="button" class="chip-btn-remove" onclick="removeFriend('${escapeHtml(name)}')">&times;</button>
      `;
      friendsListContainer.appendChild(chip);
    });
  }



  function renderLedgerFilters() {
    ledgerFiltersContainer.innerHTML = '';
    
    // "All" filter chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `filter-chip ${ledgerFilterFriend === 'All' ? 'active' : ''}`;
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => {
      ledgerFilterFriend = 'All';
      renderLedgerFilters();
      renderItemsLedger();
    });
    ledgerFiltersContainer.appendChild(allChip);
    
    // Friend filter chips
    friends.forEach(friend => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `filter-chip ${ledgerFilterFriend === friend ? 'active' : ''}`;
      
      const initials = getInitials(friend);
      const color = getAvatarColor(friend);
      
      chip.innerHTML = `
        <span class="mini-avatar" style="background:${color.bg}; color:${color.text}; width:12px; height:12px; font-size:0.5rem; margin-right:4px;">${initials}</span>
        <span>${escapeHtml(friend)}</span>
      `;
      chip.addEventListener('click', () => {
        ledgerFilterFriend = friend;
        renderLedgerFilters();
        renderItemsLedger();
      });
      ledgerFiltersContainer.appendChild(chip);
    });
  }

  function renderItemsLedger() {
    itemsListContainer.innerHTML = '';

    // Filter items
    const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
      const matchesFriend = ledgerFilterFriend === 'All' || (item.assignees && item.assignees[ledgerFilterFriend] > 0);
      return matchesSearch && matchesFriend;
    });

    if (filteredItems.length === 0) {
      if (items.length === 0) {
        itemsListContainer.innerHTML = SVG_EMPTY_ITEMS;
      } else {
        itemsListContainer.innerHTML = `
          <div class="empty-state">
            <p class="empty-text">No items match search or filter criteria.</p>
          </div>
        `;
      }
      return;
    }

    filteredItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'ledger-item';
      itemDiv.setAttribute('data-id', item.id);
      const itemTotal = item.price * item.qty;
      const qtyText = item.qty > 1 ? `<span class="ledger-item-qty-sub" style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:2px;">${item.qty} &times; ${formatMoney(item.price)} each</span>` : '';

      const isSplitEqually = friends.length > 0 && friends.every(f => (item.assignees && item.assignees[f] === 1)) && Object.keys(item.assignees || {}).filter(k => friends.includes(k)).length === friends.length;

      itemDiv.innerHTML = `
        <div class="ledger-item-info">
          <div class="ledger-item-title-row" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="ledger-item-name" style="font-weight:600;">${escapeHtml(item.name)}</span>
              ${qtyText}
            </div>
            <span class="ledger-item-price" style="font-family:var(--font-display); font-weight:700; color:var(--color-secondary);">${formatMoney(itemTotal)}</span>
          </div>
          <div class="ledger-item-assignees" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
            ${Object.keys(item.assignees || {}).filter(a => item.assignees[a] > 0).map(a => {
              const color = getAvatarColor(a);
              const initials = getInitials(a);
              const claimedQty = item.assignees[a];
              const displayQty = claimedQty > 1 ? ` (x${claimedQty})` : '';
              return `
                <span class="assignee-mini-chip" title="${escapeHtml(a)}">
                  <span class="mini-avatar" style="background:${color.bg}; color:${color.text};">${initials}</span>
                  <span>${escapeHtml(a)}${displayQty}</span>
                </span>
              `;
            }).join('')}
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button type="button" class="btn-split-equal ${isSplitEqually ? 'active' : ''}" onclick="toggleSplitEqually('${item.id}')" title="${isSplitEqually ? 'Clear Split' : 'Split Equally among all friends'}" aria-label="Split equally">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </button>
          <button type="button" class="btn-edit" onclick="editItem('${item.id}')" aria-label="Edit item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button type="button" class="btn-remove" onclick="removeItem('${item.id}')" aria-label="Remove item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      `;
      itemsListContainer.appendChild(itemDiv);
    });
  }

  // --- CALCULATION ENGINE ---
  
  function calculatePersonSubtotals() {
    const personSubtotals = {};
    friends.forEach(f => {
      personSubtotals[f] = 0;
    });

    items.forEach(item => {
      let totalClaimedQty = 0;
      const claims = [];
      friends.forEach(f => {
        const q = (item.assignees && item.assignees[f]) || 0;
        if (q > 0) {
          claims.push({ friend: f, qty: q });
          totalClaimedQty += q;
        }
      });

      if (totalClaimedQty === 0) return;

      const totalItemPrice = item.price * item.qty;
      claims.forEach(claim => {
        personSubtotals[claim.friend] += (claim.qty / totalClaimedQty) * totalItemPrice;
      });
    });

    return personSubtotals;
  }

  function calculateAndRenderTotals() {
    // 1. Calculate general subtotal (taking quantities into account)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Read manual rates
    const taxVal = parseFloat(taxInput.value) || 0;
    const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
    const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
    
    const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
    const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
    const grandTotal = subtotal + taxTotal + tipTotal;
    lastCalculatedGrandTotal = grandTotal;

    // Render general receipt totals
    summarySubtotal.textContent = formatMoney(subtotal);
    summaryTax.textContent = formatMoney(taxTotal);
    summaryTip.textContent = formatMoney(tipTotal);
    summaryTotal.textContent = formatMoney(grandTotal);

    // Sync payments map keys with active friends
    friends.forEach(f => {
      if (payments[f] === undefined) {
        payments[f] = 0;
      }
    });
    Object.keys(payments).forEach(key => {
      if (!friends.includes(key)) {
        delete payments[key];
      }
    });

    // 2. Proportional Split Calculation
    const personSubtotals = calculatePersonSubtotals();

    // Render alert warning/success banner (Option B)
    const unassignedAlertContainer = document.getElementById('unassigned-alert-container');
    if (unassignedAlertContainer) {
      if (friends.length === 0 || items.length === 0) {
        unassignedAlertContainer.innerHTML = '';
      } else {
        const unassignedItemsList = [];
        items.forEach(item => {
          let totalClaimedQty = 0;
          friends.forEach(f => {
            totalClaimedQty += (item.assignees && item.assignees[f]) || 0;
          });
          if (totalClaimedQty < item.qty) {
            unassignedItemsList.push({
              name: item.name,
              qty: item.qty - totalClaimedQty
            });
          }
        });

        if (unassignedItemsList.length > 0) {
          const listText = unassignedItemsList.map(item => `${item.qty}x ${escapeHtml(item.name)}`).join(', ');
          unassignedAlertContainer.innerHTML = `
            <div class="unassigned-alert-banner">
              <span>⚠️ Unassigned: ${listText}</span>
            </div>
          `;
        } else {
          unassignedAlertContainer.innerHTML = `
            <div class="unassigned-success-banner">
              <span>All dishes fully assigned! 🎉</span>
            </div>
          `;
        }
      }
    }

    // Render Individual Breakdown & Track individual shares
    const individualShares = {};
    friendsBreakdownContainer.innerHTML = '';

    if (friends.length === 0 || items.length === 0) {
      friendsBreakdownContainer.innerHTML = SVG_EMPTY_BREAKDOWN;
      btnShare.disabled = true;
      btnDownloadReceipt.disabled = true;
      if (btnDownloadPdf) btnDownloadPdf.disabled = true;
      settlementWrapper.style.display = 'none';
      paymentsListContainer.innerHTML = `<div class="empty-state mini"><p class="empty-text">Add friends to log payments.</p></div>`;
      return;
    }

    btnShare.disabled = false;
    btnDownloadReceipt.disabled = false;
    if (btnDownloadPdf) btnDownloadPdf.disabled = false;

    friends.forEach(friend => {
      const pSub = personSubtotals[friend] || 0;
      
      // Proportional tax/tip distribution
      const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
      const pTax = taxTotal * ratio;
      const pTip = tipTotal * ratio;
      const pTotal = pSub + pTax + pTip;
      individualShares[friend] = pTotal;

      const breakdownCard = document.createElement('div');
      breakdownCard.className = 'breakdown-card';

      // Checklist of all items to toggle assignments
      const itemsListHtml = items.map(item => {
        const claimedQty = (item.assignees && item.assignees[friend]) || 0;
        const isAssigned = claimedQty > 0;
        const itemId = item.id;
        const totalItemPrice = item.price * item.qty;
        
        let totalClaimedQty = 0;
        friends.forEach(f => {
          totalClaimedQty += (item.assignees && item.assignees[f]) || 0;
        });

        const portionCost = (totalClaimedQty > 0 && isAssigned)
          ? (claimedQty / totalClaimedQty) * totalItemPrice
          : 0;
        
        return `
          <div class="breakdown-assignee-row ${isAssigned ? 'assigned' : ''}">
            <div class="item-name-col">
              <span class="item-title">${escapeHtml(item.name)} ${item.qty > 1 ? `(x${item.qty})` : ''}</span>
            </div>
            <div class="stepper-controls">
              <button type="button" class="btn-stepper btn-decrement" data-friend="${escapeHtml(friend)}" data-item-id="${itemId}">-</button>
              <span class="stepper-value">${claimedQty}</span>
              <button type="button" class="btn-stepper btn-increment" data-friend="${escapeHtml(friend)}" data-item-id="${itemId}">+</button>
            </div>
            <span class="item-cost">
              ${isAssigned ? formatMoney(portionCost) : '-'}
            </span>
          </div>
        `;
      }).join('');

      const taxLabel = taxType === 'percent' ? `Proportional Tax (${taxVal}%)` : 'Proportional Tax (Fixed)';
      const isEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
      const tipLabel = isEnabled
        ? (tipType === 'percent' ? `Proportional Service Charge (${tipVal}%)` : 'Proportional Service Charge (Fixed)')
        : 'Proportional Service Charge (Disabled)';
      
      const initials = getInitials(friend);
      const color = getAvatarColor(friend);

      breakdownCard.innerHTML = `
        <div class="breakdown-header" onclick="toggleDetails(this)">
          <div class="breakdown-name-group">
            <span class="assignee-avatar" style="background:${color.bg}; color:${color.text}; width: 26px; height: 26px; font-size: 0.75rem;">${initials}</span>
            <span class="breakdown-name">${escapeHtml(friend)}</span>
          </div>
          <span class="breakdown-total">${formatMoney(pTotal)}</span>
        </div>
        <div class="breakdown-details" style="display: ${expandedFriends[friend] ? 'flex' : 'none'};">
          ${itemsListHtml || '<div class="breakdown-detail-row"><span>No items on bill yet</span><span>-</span></div>'}
          <div class="receipt-divider" style="margin: 4px 0;"></div>
          <div class="breakdown-detail-row tax-tip-row">
            <span>Subtotal</span>
            <span>${formatMoney(pSub)}</span>
          </div>
          <div class="breakdown-detail-row tax-tip-row">
            <span>${taxLabel}</span>
            <span>${formatMoney(pTax)}</span>
          </div>
          <div class="breakdown-detail-row tax-tip-row">
            <span>${tipLabel}</span>
            <span>${formatMoney(pTip)}</span>
          </div>
        </div>
      `;

      friendsBreakdownContainer.appendChild(breakdownCard);
    });

    // Render Payments inputs
    renderPaymentsSection(individualShares);

    // Calculate Settlements
    calculateSettlements(individualShares, grandTotal);
  }

  function renderPaymentsSection(shares = {}) {
    paymentsListContainer.innerHTML = '';
    const symbol = priceCurrencySymbol.textContent;

    friends.forEach(friend => {
      const row = document.createElement('div');
      row.className = 'payments-grid-row';
      
      const paidVal = payments[friend] || 0;
      const initials = getInitials(friend);
      const color = getAvatarColor(friend);
      const friendShare = shares[friend] || 0;

      row.innerHTML = `
        <div class="payment-friend-info" style="display:flex; flex-direction:column; justify-content:center; min-width: 0;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="assignee-avatar" style="background:${color.bg}; color:${color.text}; width: 22px; height: 22px; font-size: 0.7rem;">${initials}</span>
            <span class="payment-friend-name" style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(friend)}</span>
          </div>
          <span class="payment-friend-share" style="font-size:0.75rem; color:var(--text-muted); margin-left:30px; margin-top:2px; cursor:pointer;" title="Click to fill this amount as paid">Owes: ${formatMoney(friendShare)}</span>
        </div>
        <div class="input-wrapper">
          <span class="input-prefix">${symbol}</span>
          <input type="number" class="input-field pad-prefix payment-input" data-friend="${escapeHtml(friend)}" value="${paidVal > 0 ? paidVal.toFixed(2) : ''}" placeholder="${friendShare.toFixed(2)}" min="0" step="0.01" inputmode="decimal">
        </div>
        <button type="button" class="btn-paid-all" data-friend="${escapeHtml(friend)}">Paid All</button>
      `;

      // Event listener on "Owes: ..." label to auto-fill paid amount
      const shareLabel = row.querySelector('.payment-friend-share');
      shareLabel.addEventListener('click', () => {
        payments[friend] = friendShare;
        renderAll();
        showToast(`Logged payment of ${formatMoney(friendShare)} for ${friend}.`);
      });

      // Event listener on inputs
      const input = row.querySelector('.payment-input');
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        payments[friend] = val;
        // Recalculate settlements without re-rendering the inputs list to preserve input focus
        calculateSettlementsFromActiveState();
        saveLocalStorage();
      });

      // Event listener on "Paid All"
      const paidAllBtn = row.querySelector('.btn-paid-all');
      paidAllBtn.addEventListener('click', () => {
        friends.forEach(f => {
          payments[f] = 0;
        });
        payments[friend] = lastCalculatedGrandTotal;
        renderAll();
      });

      paymentsListContainer.appendChild(row);
    });
  }

  function calculateSettlements(shares, grandTotal) {
    const totalPaid = friends.reduce((sum, f) => sum + (payments[f] || 0), 0);
    const difference = totalPaid - grandTotal;
    
    settlementWrapper.style.display = 'block';

    const settlementList = document.getElementById('settlement-list-container');
    settlementList.innerHTML = '';

    // If sum of payments doesn't match total bill
    if (Math.abs(difference) > 0.05) {
      const warningText = difference < 0 
        ? `Remaining to allocate: ${formatMoney(Math.abs(difference))}`
        : `Overallocated by: ${formatMoney(difference)}`;
      
      settlementList.innerHTML = `
        <div class="settlement-row" style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.25); color: var(--color-danger);">
          <div class="settlement-bullet" style="background: var(--color-danger);"></div>
          <span>${warningText} (Total paid: ${formatMoney(totalPaid)} / Total bill: ${formatMoney(grandTotal)})</span>
        </div>
      `;
      return;
    }

    // Debt Simplification Algorithm
    const balances = {};
    friends.forEach(f => {
      balances[f] = (payments[f] || 0) - (shares[f] || 0);
    });

    const creditors = [];
    const debtors = [];

    friends.forEach(f => {
      const bal = balances[f];
      if (bal > 0.02) {
        creditors.push({ name: f, amount: bal });
      } else if (bal < -0.02) {
        debtors.push({ name: f, amount: Math.abs(bal) });
      }
    });

    // Sort: highest creditor and highest debtor first
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let dIdx = 0;
    let cIdx = 0;

    // Greedy matching
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const payAmount = Math.min(debtor.amount, creditor.amount);
      if (payAmount > 0.01) {
        transfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: payAmount
        });
      }

      debtor.amount -= payAmount;
      creditor.amount -= payAmount;

      if (debtor.amount < 0.02) dIdx++;
      if (creditor.amount < 0.02) cIdx++;
    }

    // Render transfers list
    if (transfers.length === 0) {
      settlementList.innerHTML = `
        <div class="settlement-row" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: hsl(160, 84%, 39%); cursor: default;">
          <div class="settlement-bullet" style="background: hsl(160, 84%, 39%);"></div>
          <span>All shares settled! No transfers needed.</span>
        </div>
      `;
    } else {
      transfers.forEach(t => {
        const container = document.createElement('div');
        container.className = 'settlement-row-container';
        
        const transferKey = `${t.from}->${t.to}`;
        const isSettled = !!settledTransfers[transferKey];

        const row = document.createElement('div');
        row.className = `settlement-row ${isSettled ? 'settled' : ''}`;
        row.style.cursor = 'pointer';
        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; flex-grow: 1; min-width: 0;">
            <input type="checkbox" class="settle-debt-checkbox" data-from="${escapeHtml(t.from)}" data-to="${escapeHtml(t.to)}" ${isSettled ? 'checked' : ''} style="margin: 0; z-index: 10;" onclick="toggleSettleDebt(event, '${escapeHtml(t.from)}', '${escapeHtml(t.to)}')">
            <span style="flex-grow: 1; text-decoration: ${isSettled ? 'line-through' : 'none'}; opacity: ${isSettled ? '0.55' : '1'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <strong>${escapeHtml(t.from)}</strong> pays <strong>${escapeHtml(t.to)}</strong> ${formatMoney(t.amount)}
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 12px; height: 12px; transition: transform 0.2s;" class="expander-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        `;
        
        const details = document.createElement('div');
        details.className = 'settlement-math-details';
        
        const fromSpent = shares[t.from] || 0;
        const fromPaid = payments[t.from] || 0;
        const toSpent = shares[t.to] || 0;
        const toPaid = payments[t.to] || 0;
        
        details.innerHTML = `
          <div style="font-weight: 700; margin-bottom: 4px; color: var(--color-secondary);">Breakdown Details:</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span>• <strong>${escapeHtml(t.from)}</strong> consumed ${formatMoney(fromSpent)} of bill, but paid only ${formatMoney(fromPaid)} (Owes ${formatMoney(fromSpent - fromPaid)})</span>
            <span>• <strong>${escapeHtml(t.to)}</strong> consumed ${formatMoney(toSpent)} of bill, but paid ${formatMoney(toPaid)} (Is owed ${formatMoney(toPaid - toSpent)})</span>
          </div>
        `;
        
        row.addEventListener('click', () => {
          const isOpen = details.style.display === 'flex';
          details.style.display = isOpen ? 'none' : 'flex';
          const icon = row.querySelector('.expander-icon');
          if (icon) {
            icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
          }
        });
        
        container.appendChild(row);
        container.appendChild(details);
        settlementList.appendChild(container);
      });
    }
  }

  // Preservation helper: calculate settlements from current inputs without replacing input elements
  function calculateSettlementsFromActiveState() {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxVal = parseFloat(taxInput.value) || 0;
    const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
    const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
    
    const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
    const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
    const grandTotal = subtotal + taxTotal + tipTotal;

    const personSubtotals = calculatePersonSubtotals();

    const shares = {};
    friends.forEach(friend => {
      const pSub = personSubtotals[friend] || 0;
      const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
      const pTax = taxTotal * ratio;
      const pTip = tipTotal * ratio;
      shares[friend] = pSub + pTax + pTip;
    });

    calculateSettlements(shares, grandTotal);
  }

  // --- TOGGLE CARD DETAILS ---
  window.toggleDetails = function(headerElement) {
    const detailsDiv = headerElement.nextElementSibling;
    const friendName = headerElement.querySelector('.breakdown-name').textContent.trim();
    if (detailsDiv.style.display === 'none') {
      detailsDiv.style.display = 'flex';
      expandedFriends[friendName] = true;
    } else {
      detailsDiv.style.display = 'none';
      expandedFriends[friendName] = false;
    }
  };

  // --- SHARING COMPILER ---
  btnShare.addEventListener('click', () => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxVal = parseFloat(taxInput.value) || 0;
    const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
    const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
    
    const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
    const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
    const grandTotal = subtotal + taxTotal + tipTotal;

    const personSubtotals = calculatePersonSubtotals();

    const taxLabel = taxType === 'percent' ? `Tax (${taxVal}%)` : 'Tax (Fixed)';
    const tipLabel = isServiceChargeEnabled
      ? (tipType === 'percent' ? `Service Charge (${tipVal}%)` : 'Service Charge (Fixed)')
      : 'Service Charge (Disabled)';

    let shareText = `*QuickSplit Pro — Bill Split Summary*\n`;
    shareText += `====================================\n`;
    shareText += `Subtotal: ${formatMoney(subtotal)}\n`;
    shareText += `${taxLabel}: ${formatMoney(taxTotal)}\n`;
    shareText += `${tipLabel}: ${formatMoney(tipTotal)}\n`;
    shareText += `*Grand Total: ${formatMoney(grandTotal)}*\n`;
    shareText += `====================================\n\n`;
    shareText += `*Individual Proportional Breakdowns:*\n`;

    const shares = {};
    friends.forEach(friend => {
      const pSub = personSubtotals[friend] || 0;
      const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
      const pTax = taxTotal * ratio;
      const pTip = tipTotal * ratio;
      const pTotal = pSub + pTax + pTip;
      shares[friend] = pTotal;
      shareText += `• ${friend}: ${formatMoney(pTotal)}\n`;
    });

    // Append settlement instructions if fully allocated
    const totalPaid = friends.reduce((sum, f) => sum + (payments[f] || 0), 0);
    const difference = totalPaid - grandTotal;
    
    if (Math.abs(difference) <= 0.05) {
      const balances = {};
      friends.forEach(f => {
        balances[f] = (payments[f] || 0) - (shares[f] || 0);
      });

      const creditors = [];
      const debtors = [];

      friends.forEach(f => {
        const bal = balances[f];
        if (bal > 0.02) {
          creditors.push({ name: f, amount: bal });
        } else if (bal < -0.02) {
          debtors.push({ name: f, amount: Math.abs(bal) });
        }
      });

      creditors.sort((a, b) => b.amount - a.amount);
      debtors.sort((a, b) => b.amount - a.amount);

      const transfers = [];
      let dIdx = 0;
      let cIdx = 0;

      while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];
        const payAmount = Math.min(debtor.amount, creditor.amount);
        if (payAmount > 0.01) {
          transfers.push({ from: debtor.name, to: creditor.name, amount: payAmount });
        }
        debtor.amount -= payAmount;
        creditor.amount -= payAmount;
        if (debtor.amount < 0.02) dIdx++;
        if (creditor.amount < 0.02) cIdx++;
      }

      if (transfers.length > 0) {
        shareText += `\n*Transfer Instructions:*\n`;
        transfers.forEach(t => {
          shareText += `• ${t.from} pays ${t.to} ${formatMoney(t.amount)}\n`;
        });
      }
    }

    // Attempt sharing via navigator.share or fallback to clipboard
    if (navigator.share) {
      navigator.share({
        title: 'QuickSplit Pro Bill Summary',
        text: shareText
      })
      .then(() => showToast('Shared successfully!'))
      .catch(err => {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      });
    } else {
      copyToClipboard(shareText);
    }
  });

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('Summary copied to clipboard!');
      })
      .catch(() => {
        showToast('Failed to copy. Please copy manually.');
      });
  }

  function showToast(message) {
    toastMessage.textContent = message;
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- HTML ESCAPER HELPER ---
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.toggleSplitEqually = function(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (!friends || friends.length === 0) {
      showToast('Please add friends first to split this item.');
      return;
    }

    const isSplitEqually = friends.every(f => (item.assignees && item.assignees[f] === 1)) && Object.keys(item.assignees || {}).filter(k => friends.includes(k)).length === friends.length;

    if (isSplitEqually) {
      item.assignees = {};
      showToast(`Cleared split assignments for "${item.name}".`);
    } else {
      item.assignees = {};
      friends.forEach(f => {
        item.assignees[f] = 1;
      });
      showToast(`Split "${item.name}" equally among all ${friends.length} friends!`);
    }

    renderAll();
  };

  // --- INLINE ITEM EDITING HELPERS (#1) ---
  window.editItem = function(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    editingItemId = itemId;

    itemNameInput.value = item.name;
    itemPriceInput.value = item.price;
    itemQtyInput.value = item.qty;

    btnAddItem.textContent = 'Update Item';
    btnCancelEdit.style.display = 'block';

    validateItemForm();
    itemNameInput.focus();
    itemNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  btnCancelEdit.addEventListener('click', () => {
    cancelEditMode();
  });

  function cancelEditMode() {
    editingItemId = null;
    itemNameInput.value = '';
    itemPriceInput.value = '';
    itemQtyInput.value = '1';

    btnAddItem.textContent = 'Add Item to Bill';
    btnCancelEdit.style.display = 'none';

    validateItemForm();
  }

  // --- GST/TIP PRESETS CLICK BINDERS (#2) ---
  const taxPresets = document.getElementById('tax-presets');
  const tipPresets = document.getElementById('tip-presets');

  if (taxPresets) {
    taxPresets.querySelectorAll('.preset-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        taxType = 'percent';
        const val = pill.getAttribute('data-value');
        taxInput.value = val;
        syncToggleGroups();
        taxInput.dispatchEvent(new Event('input', { bubbles: true }));
        taxInput.dispatchEvent(new Event('change', { bubbles: true }));
        calculateAndRenderTotals();
        saveLocalStorage();
      });
    });
  }

  if (tipPresets) {
    tipPresets.querySelectorAll('.preset-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        tipType = 'percent';
        const val = pill.getAttribute('data-value');
        tipInput.value = val;
        syncToggleGroups();
        tipInput.dispatchEvent(new Event('input', { bubbles: true }));
        tipInput.dispatchEvent(new Event('change', { bubbles: true }));
        calculateAndRenderTotals();
        saveLocalStorage();
      });
    });
  }

  // --- SEARCH INPUT LISTENER (#5) ---
  if (ledgerSearchInput) {
    ledgerSearchInput.addEventListener('input', (e) => {
      ledgerSearchQuery = e.target.value.trim();
      renderItemsLedger();
    });
  }

  // --- BREAKDOWN ASSIGNEE STEPPER CLICK LISTENER ---
  if (friendsBreakdownContainer) {
    friendsBreakdownContainer.addEventListener('click', (e) => {
      const btnDec = e.target.closest('.btn-decrement');
      const btnInc = e.target.closest('.btn-increment');
      
      if (!btnDec && !btnInc) return;
      
      const btn = btnDec || btnInc;
      const friend = btn.getAttribute('data-friend');
      const itemId = btn.getAttribute('data-item-id');
      
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      if (!item.assignees || typeof item.assignees !== 'object') {
        item.assignees = {};
      }

      if (btnInc) {
        // Increment
        let totalClaimedQty = 0;
        friends.forEach(f => {
          totalClaimedQty += item.assignees[f] || 0;
        });

        if (totalClaimedQty >= item.qty) {
          showToast(`Total claimed quantity cannot exceed item quantity (${item.qty}).`);
          return;
        }

        item.assignees[friend] = (item.assignees[friend] || 0) + 1;
      } else {
        // Decrement
        let currentClaimed = item.assignees[friend] || 0;
        if (currentClaimed > 0) {
          item.assignees[friend] = currentClaimed - 1;
          if (item.assignees[friend] === 0) {
            delete item.assignees[friend];
          }
        }
      }

      renderAll();
    });
  }

  // --- SPLIT UNPAID BALANCE HELPER (#6) ---
  if (btnSplitUnpaid) {
    btnSplitUnpaid.addEventListener('click', () => {
      if (friends.length === 0 || items.length === 0) {
        showToast('Please add friends and items first.');
        return;
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const taxVal = parseFloat(taxInput.value) || 0;
      const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
      const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
      
      const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
      const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
      const grandTotal = subtotal + taxTotal + tipTotal;

      const totalPaid = friends.reduce((sum, f) => sum + (payments[f] || 0), 0);
      const remaining = grandTotal - totalPaid;

      if (remaining <= 0.02) {
        showToast('All balance is already paid!');
        return;
      }

      let targets = friends.filter(f => !payments[f] || payments[f] === 0);
      if (targets.length === 0) {
        targets = friends;
      }

      const share = remaining / targets.length;
      targets.forEach(f => {
        payments[f] = (payments[f] || 0) + share;
      });

      showToast(`Split remaining balance among ${targets.length} friend(s).`);
      renderAll();
    });
  }

  // --- DOWNLOAD RECEIPT IMAGE CANVAS EXPORTER (#3) ---
  if (btnDownloadReceipt) {
    btnDownloadReceipt.addEventListener('click', () => {
      if (friends.length === 0 || items.length === 0) return;

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const taxVal = parseFloat(taxInput.value) || 0;
      const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
      const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
      
      const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
      const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
      const grandTotal = subtotal + taxTotal + tipTotal;

      const personSubtotals = calculatePersonSubtotals();

      const shares = {};
      friends.forEach(friend => {
        const pSub = personSubtotals[friend] || 0;
        const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
        shares[friend] = pSub + (taxTotal * ratio) + (tipTotal * ratio);
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const padding = 30;
      const itemHeight = 35;
      const headerHeight = 160;
      const totalSectionHeight = 140;
      const friendSectionHeight = friends.length * itemHeight + 60;
      const canvasWidth = 400;
      const canvasHeight = headerHeight + totalSectionHeight + friendSectionHeight + padding * 2;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Fill Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Border outline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);

      // Drawing a torn paper effect at the bottom:
      ctx.fillStyle = '#1e293b'; 
      ctx.fillRect(0, canvasHeight - 15, canvasWidth, 15);
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight - 15);
      const toothWidth = 10;
      const toothHeight = 8;
      for (let x = 0; x < canvasWidth; x += toothWidth) {
        ctx.lineTo(x + toothWidth / 2, canvasHeight - 15 - toothHeight);
        ctx.lineTo(x + toothWidth, canvasHeight - 15);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Title Header
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QUICKSPLIT PRO', canvasWidth / 2, 60);

      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Official Bill Split Summary', canvasWidth / 2, 80);
      
      const dateText = new Date().toLocaleDateString(undefined, { dateStyle: 'long' }) + ' ' + new Date().toLocaleTimeString(undefined, { timeStyle: 'short' });
      ctx.fillText(dateText, canvasWidth / 2, 98);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, 115);
      ctx.lineTo(canvasWidth - padding, 115);
      ctx.stroke();

      let y = 145;
      ctx.font = '500 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.fillText('Subtotal:', padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(subtotal), canvasWidth - padding, y);

      y += 25;
      ctx.textAlign = 'left';
      ctx.fillText(`Tax (${taxInput.value}${taxType === 'percent' ? '%' : ' Fixed'}):`, padding, y);
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(taxTotal), canvasWidth - padding, y);

      y += 25;
      ctx.textAlign = 'left';
      if (isServiceChargeEnabled) {
        ctx.fillText(`Service Charge (${tipInput.value}${tipType === 'percent' ? '%' : ' Fixed'}):`, padding, y);
      } else {
        ctx.fillText(`Service Charge (Disabled):`, padding, y);
      }
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(tipTotal), canvasWidth - padding, y);

      y += 20;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();

      y += 28;
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('GRAND TOTAL:', padding, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(formatMoney(grandTotal), canvasWidth - padding, y);

      y += 25;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();

      y += 35;
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('INDIVIDUAL PROPORTIONAL SHARES:', padding, y);

      y += 10;
      ctx.font = '500 14px system-ui, -apple-system, sans-serif';
      friends.forEach(friend => {
        y += itemHeight;
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'left';
        ctx.fillText(friend, padding, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(formatMoney(shares[friend] || 0), canvasWidth - padding, y);
      });

      y += 45;
      ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Thank you for using QuickSplit Pro!', canvasWidth / 2, y);

      const link = document.createElement('a');
      link.download = 'quicksplit-receipt.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Receipt image downloaded!');
    });
  }

  // --- DOWNLOAD PDF EXPORTER (#4) ---
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      try {
        if (friends.length === 0 || items.length === 0) return;

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const taxVal = parseFloat(taxInput.value) || 0;
        const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
        const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
        
        const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
        const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
        const grandTotal = subtotal + taxTotal + tipTotal;

        const personSubtotals = calculatePersonSubtotals();

        const shares = {};
        friends.forEach(friend => {
          const pSub = personSubtotals[friend] || 0;
          const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
          shares[friend] = pSub + (taxTotal * ratio) + (tipTotal * ratio);
        });

        let jsPDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
          jsPDFClass = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
          jsPDFClass = window.jsPDF;
        }

        if (!jsPDFClass) {
          showToast('⚠️ PDF Engine (jsPDF) is not loaded yet. Please reload or check your internet connection.');
          console.error('jsPDF not found on window.jspdf or window.jsPDF');
          return;
        }

        const doc = new jsPDFClass({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2); // 180mm

        let y = 20;

        function formatPdfMoney(amount) {
          const code = currencySelect.value;
          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(amount);
          return `${code} ${formatted}`;
        }

        function checkPageBreak(heightNeeded) {
          if (y + heightNeeded > 270) {
            doc.addPage();
            y = 20;
            drawPageHeader();
          }
        }

        function drawPageHeader() {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400 (text-muted)
          doc.text('QuickSplit Pro — Bill Split Summary & Invoice', margin, 12);
          doc.setDrawColor(226, 232, 240); // Slate-200
          doc.setLineWidth(0.2);
          doc.line(margin, 14, pageWidth - margin, 14);
        }

        // --- PAGE 1 BRAND HEADER BLOCK ---
        // Primary branding background bar
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(margin, y, contentWidth, 25, 'F');

        // Brand Title & Logo Block
        const logoX = margin + 6;
        const logoY = y + 8.5;

        // Left rounded part (Primary Color - Royal Sapphire Blue)
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(logoX + 0.6, logoY + 1.6, 3.8, 4.4, 0.6, 0.6, 'F');

        // Right part straight-and-rounded (Secondary Color - Cool Slate Blue)
        doc.setFillColor(96, 165, 250);
        doc.roundedRect(logoX + 3.8, logoY + 1.6, 2.0, 4.4, 0.6, 0.6, 'F');
        doc.rect(logoX + 3.8, logoY + 1.6, 1.0, 4.4, 'F');

        // Middle divider line (Background color overlay + White accent)
        doc.setDrawColor(30, 41, 59); // Slate-800
        doc.setLineWidth(0.8);
        doc.line(logoX + 3.8, logoY + 0.9, logoX + 3.8, logoY + 6.6);

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.4);
        doc.line(logoX + 3.8, logoY + 0.9, logoX + 3.8, logoY + 6.6);

        // Brand Title Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('QUICKSPLIT PRO', margin + 15, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(96, 165, 250); // Cool Slate Blue color accent
        doc.text('Proportional Group Bill Splitter & Invoice', margin + 15, y + 18);

        // Generation Date / Right Side of Header
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225); // Slate-300
        const dateString = new Date().toLocaleDateString(undefined, { dateStyle: 'long' }) + ' ' + new Date().toLocaleTimeString(undefined, { timeStyle: 'short' });
        doc.text(`Generated: ${dateString}`, pageWidth - margin - 6, y + 14, { align: 'right' });

        y += 35;

        // --- SECTION A: ITEMIZED ITEMS TABLE ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.text('1. ITEMIZED BILL LEDGER', margin, y);
        y += 6;

        // Table Header Row
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(margin, y, contentWidth, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // Slate-600
        
        doc.text('Item Description', margin + 3, y + 5.5);
        doc.text('Qty', margin + 80, y + 5.5, { align: 'center' });
        doc.text('Unit Price', margin + 130, y + 5.5, { align: 'right' });
        doc.text('Total Price', pageWidth - margin - 3, y + 5.5, { align: 'right' });

        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.3);
        doc.line(margin, y + 8, pageWidth - margin, y + 8);
        y += 8;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        items.forEach(item => {
          checkPageBreak(8);

          const itemTotal = item.price * item.qty;
          let displayName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;

          doc.text(displayName, margin + 3, y + 5.5);
          doc.text(item.qty.toString(), margin + 80, y + 5.5, { align: 'center' });
          doc.text(formatPdfMoney(item.price), margin + 130, y + 5.5, { align: 'right' });
          doc.text(formatPdfMoney(itemTotal), pageWidth - margin - 3, y + 5.5, { align: 'right' });

          doc.setDrawColor(241, 245, 249); // Outer border line style
          doc.setLineWidth(0.15);
          doc.line(margin, y + 8, pageWidth - margin, y + 8);
          y += 8;
        });

        y += 4; // Spacing

        // --- SECTION B: GRAND TOTALS BLOCK ---
        checkPageBreak(30);
        
        const totalBlockWidth = 80;
        const totalBlockX = pageWidth - margin - totalBlockWidth;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);

        // Subtotal Row
        doc.text('Subtotal:', totalBlockX + 3, y + 5);
        doc.text(formatPdfMoney(subtotal), pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 6;

        // Tax Row
        const taxLabel = taxType === 'percent' ? `Tax (${taxVal}%):` : 'Tax (Fixed):';
        doc.text(taxLabel, totalBlockX + 3, y + 5);
        doc.text(formatPdfMoney(taxTotal), pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 6;

        // Service Charge Row
        const tipLabel = isServiceChargeEnabled
          ? (tipType === 'percent' ? `Service Charge (${tipVal}%):` : 'Service Charge (Fixed):')
          : 'Service Charge (Disabled):';
        doc.text(tipLabel, totalBlockX + 3, y + 5);
        doc.text(formatPdfMoney(tipTotal), pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 6;

        // Divider line
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.setLineWidth(0.3);
        doc.line(totalBlockX, y + 2, pageWidth - margin, y + 2);
        y += 4;

        // Grand Total Row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235); // Royal Sapphire Blue Primary Accent
        doc.text('GRAND TOTAL:', totalBlockX + 3, y + 5);
        doc.text(formatPdfMoney(grandTotal), pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 15;

        // --- SECTION C: INDIVIDUAL PROPORTIONAL BREAKDOWNS ---
        checkPageBreak(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('2. INDIVIDUAL PROPORTIONAL BREAKDOWNS', margin, y);
        y += 6;

        // Table Header Row
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        
        doc.text('Friend Name', margin + 3, y + 5.5);
        doc.text('Subtotal Share', margin + 75, y + 5.5, { align: 'right' });
        doc.text('Tax Share', margin + 110, y + 5.5, { align: 'right' });
        doc.text('Service Chg Share', margin + 150, y + 5.5, { align: 'right' });
        doc.text('Total Share', pageWidth - margin - 3, y + 5.5, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 8, pageWidth - margin, y + 8);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        friends.forEach(friend => {
          checkPageBreak(8);

          const pSub = personSubtotals[friend] || 0;
          const ratio = subtotal === 0 ? 0 : (pSub / subtotal);
          const pTax = taxTotal * ratio;
          const pTip = tipTotal * ratio;
          const pTotal = shares[friend] || 0;

          let displayFriend = friend.length > 20 ? friend.substring(0, 17) + '...' : friend;

          doc.text(displayFriend, margin + 3, y + 5.5);
          doc.text(formatPdfMoney(pSub), margin + 75, y + 5.5, { align: 'right' });
          doc.text(formatPdfMoney(pTax), margin + 110, y + 5.5, { align: 'right' });
          doc.text(formatPdfMoney(pTip), margin + 150, y + 5.5, { align: 'right' });
          
          doc.setFont('helvetica', 'bold');
          doc.text(formatPdfMoney(pTotal), pageWidth - margin - 3, y + 5.5, { align: 'right' });
          doc.setFont('helvetica', 'normal');

          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.15);
          doc.line(margin, y + 8, pageWidth - margin, y + 8);
          y += 8;
        });

        // --- PAGE NUMBERING AND COPYRIGHT FOOTER INJECTOR ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // Footer Divider
          doc.setDrawColor(226, 232, 240); // Slate-200
          doc.setLineWidth(0.3);
          doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

          // Copyright Statement
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139); // Slate-500
          doc.text('Copyright \u00a9 2026 Arisudan. All Rights Reserved. Owned legally by Arisudan.', margin, pageHeight - 11);

          // Page Numbering
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 11, { align: 'right' });
        }

        // Save PDF document
        doc.save('quicksplit-split-invoice.pdf');
        showToast('PDF Report downloaded successfully!');
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        showToast('❌ Error generating PDF: ' + err.message);
      }
    });
  }

  // ==========================================
  // --- VOICE SPEECH (SPEECH-TO-TEXT) ---
  // ==========================================
  if (btnVoiceInput) {
    btnVoiceInput.addEventListener('click', () => {
      if (window.location.protocol === 'file:') {
        showToast('⚠️ Browser blocks microphone on local files (file://). Run via localhost:8000!');
        return;
      }
      if (!window.isSecureContext) {
        showToast('⚠️ Microphone access requires a secure context (localhost or HTTPS).');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast('⚠️ Speech recognition not supported in this browser.');
        return;
      }

      if (btnVoiceInput.classList.contains('listening')) {
        // If already listening, we don't start again
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        btnVoiceInput.classList.add('listening');
        showToast('🎙️ Listening... speak name and price (e.g. "Idli 90 rupees")');
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        showToast('⚠️ Voice recognition failed. Try again.');
        btnVoiceInput.classList.remove('listening');
      };

      recognition.onend = () => {
        btnVoiceInput.classList.remove('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized speech:', transcript);
        
        // Parse results
        const parsed = parseSpeechTranscript(transcript);
        if (parsed.name) {
          itemNameInput.value = parsed.name;
          itemNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (parsed.price !== null) {
          itemPriceInput.value = parsed.price.toFixed(2);
          itemPriceInput.dispatchEvent(new Event('input', { bubbles: true }));
          showToast(`🎤 Logged: "${parsed.name}" for ₹${parsed.price}`);
        } else {
          itemPriceInput.focus();
          showToast(`🎤 Logged: "${parsed.name}". Please input price.`);
        }
        validateItemForm();
      };

      recognition.start();
    });
  }

  function parseSpeechTranscript(transcript) {
    const text = transcript.trim();
    
    // Look for numbers in the transcript
    const matches = [...text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const price = parseFloat(lastMatch[1]);
      const numberIndex = lastMatch.index;
      
      let name = text.substring(0, numberIndex).trim();
      
      // Clean up connection words (at, for, rupees, rs, bucks)
      name = name.replace(/\b(at|for|costing|is|of|rs|rupees)\b\s*$/gi, '').trim();
      
      // Capitalize first letter of item name
      if (name.length > 0) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }
      
      return { name, price };
    }
    
    // Capitalize first letter
    let cleanName = text;
    if (cleanName.length > 0) {
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    return { name: cleanName, price: null };
  }

  // ==========================================
  // --- BILL OCR CAMERA SCANNER ---
  // ==========================================
  
  // Tab view switching
  if (tabScanFile && tabScanCamera) {
    tabScanFile.addEventListener('click', () => {
      tabScanFile.classList.add('active');
      tabScanCamera.classList.remove('active');
      scanFileSection.style.display = 'block';
      scanCameraSection.style.display = 'none';
      stopCameraStream();
    });

    tabScanCamera.addEventListener('click', () => {
      tabScanCamera.classList.add('active');
      tabScanFile.classList.remove('active');
      scanCameraSection.style.display = 'flex';
      scanFileSection.style.display = 'none';
      startCameraStream();
    });
  }

  // Modal controls
  if (btnOpenScanner) {
    btnOpenScanner.addEventListener('click', () => {
      scannerModal.style.display = 'flex';
      // Default to camera view to request hardware stream immediately
      tabScanCamera.click();
    });
  }

  if (btnCloseScanner) {
    btnCloseScanner.addEventListener('click', () => {
      scannerModal.style.display = 'none';
      stopCameraStream();
    });
  }

  // Also close modal when clicking outside card
  if (scannerModal) {
    scannerModal.addEventListener('click', (e) => {
      if (e.target === scannerModal) {
        btnCloseScanner.click();
      }
    });
  }

  // File selection
  if (btnChooseFile && scanFileInput) {
    btnChooseFile.addEventListener('click', () => {
      scanFileInput.click();
    });

    scanFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processOCRImage(e.target.files[0]);
      }
    });
  }

  // File Drop Zone events
  if (fileDropZone) {
    fileDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropZone.classList.add('drag-over');
    });

    fileDropZone.addEventListener('dragleave', () => {
      fileDropZone.classList.remove('drag-over');
    });

    fileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processOCRImage(e.dataTransfer.files[0]);
      }
    });
  }

  // Camera handling
  function startCameraStream() {
    if (window.location.protocol === 'file:') {
      showToast('⚠️ Browser blocks camera on local files (file://). Run via localhost:8000!');
      tabScanFile.click();
      return;
    }
    if (!window.isSecureContext) {
      showToast('⚠️ Camera access requires a secure context (localhost or HTTPS).');
      tabScanFile.click();
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          mediaStream = stream;
          cameraStream.srcObject = stream;
          cameraStream.setAttribute('playsinline', true);
          cameraStream.play().catch(e => console.error('Play failed:', e));
        })
        .catch(err => {
          console.warn('Camera environmental request failed, retrying with basic video:', err);
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              mediaStream = stream;
              cameraStream.srcObject = stream;
              cameraStream.setAttribute('playsinline', true);
              cameraStream.play().catch(e => console.error('Play failed:', e));
            })
            .catch(fallbackErr => {
              console.error('All camera streams failed:', fallbackErr);
              showToast('⚠️ Camera access denied or not supported.');
              tabScanFile.click();
            });
        });
    } else {
      showToast('⚠️ Camera APIs not supported in this browser.');
      tabScanFile.click();
    }
  }

  function stopCameraStream() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    if (cameraStream) {
      cameraStream.srcObject = null;
    }
  }

  // Capture from stream
  if (btnCaptureSnapshot) {
    btnCaptureSnapshot.addEventListener('click', () => {
      if (!cameraStream.srcObject) return;

      const width = cameraStream.videoWidth;
      const height = cameraStream.videoHeight;
      cameraCaptureCanvas.width = width;
      cameraCaptureCanvas.height = height;

      const ctx = cameraCaptureCanvas.getContext('2d');
      ctx.drawImage(cameraStream, 0, 0, width, height);

      stopCameraStream();

      // Convert canvas content to blob and run OCR
      cameraCaptureCanvas.toBlob((blob) => {
        processOCRImage(blob);
      }, 'image/png');
    });
  }

  // Run Tesseract OCR engine
  function processOCRImage(imageFileOrBlob) {
    // Hide panels and show loading spinner
    scanFileSection.style.display = 'none';
    scanCameraSection.style.display = 'none';
    scannerLoading.style.display = 'flex';
    scannerResultsSection.style.display = 'none';

    Tesseract.recognize(
      imageFileOrBlob,
      'eng',
      { logger: m => console.log('Tesseract:', m.status, Math.round(m.progress * 100) + '%') }
    )
    .then(({ data: { text } }) => {
      scannerLoading.style.display = 'none';
      renderExtractedItems(text);
    })
    .catch(err => {
      console.error('Tesseract OCR error:', err);
      scannerLoading.style.display = 'none';
      showToast('❌ Failed to read receipt text.');
      resetScannerView();
    });
  }

  function resetScannerView() {
    if (tabScanFile.classList.contains('active')) {
      scanFileSection.style.display = 'block';
    } else {
      scanCameraSection.style.display = 'flex';
      startCameraStream();
    }
    scannerLoading.style.display = 'none';
    scannerResultsSection.style.display = 'none';
  }

  if (btnReScan) {
    btnReScan.addEventListener('click', () => {
      resetScannerView();
    });
  }

  // Parse receipts line by line
  function renderExtractedItems(ocrText) {
    console.log('Raw Scanned OCR Text:\n', ocrText);
    const parsedItems = parseReceiptText(ocrText);
    
    scannedItemsList.innerHTML = '';
    
    if (parsedItems.length === 0) {
      scannedItemsList.innerHTML = '<p class="placeholder-text text-center">Could not find any clear item/price matches. Try scanning another receipt or uploading a clearer image.</p>';
    } else {
      parsedItems.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'scanned-item-row';
        itemRow.innerHTML = `
          <input type="checkbox" class="scanned-item-checkbox" id="scanned-cb-${index}" checked style="width: 18px; height: 18px;">
          <input type="text" class="scanned-item-name-input input-field" value="${escapeHtml(item.name)}" style="padding: 4px 8px; height: 32px; border-radius: var(--radius-sm);">
          <div style="display:flex; align-items:center; gap: 4px; width: 100px;">
            <span style="font-size:0.9rem; color:var(--text-muted);">${priceCurrencySymbol.textContent}</span>
            <input type="number" class="scanned-item-price-input input-field" value="${item.price.toFixed(2)}" step="0.01" style="padding: 4px 8px; height: 32px; border-radius: var(--radius-sm);">
          </div>
        `;
        scannedItemsList.appendChild(itemRow);
      });
    }
    scannerResultsSection.style.display = 'block';
  }

  function parseReceiptText(text) {
    const lines = text.split('\n');
    const results = [];
    
    // Matches text followed by a numeric price (e.g. 120.00, 150, 45.50) at the end of a line
    const priceRegex = /^(.*?)\s+[$₹€£]?\s*(\d+(?:[.,]\d{2})?)\s*$/;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const match = trimmed.match(priceRegex);
      if (match) {
        let name = match[1].trim();
        let priceVal = match[2].replace(',', '.'); // replace decimal commas if present
        const price = parseFloat(priceVal);
        
        if (isNaN(price) || price <= 0) return;
        
        // Filter out typical receipt titles or metadata rows
        const lowerName = name.toLowerCase();
        if (
          lowerName.includes('total') ||
          lowerName.includes('subtotal') ||
          lowerName.includes('tax') ||
          lowerName.includes('gst') ||
          lowerName.includes('cgst') ||
          lowerName.includes('sgst') ||
          lowerName.includes('vat') ||
          lowerName.includes('service charge') ||
          lowerName.includes('cash') ||
          lowerName.includes('card') ||
          lowerName.includes('change') ||
          lowerName.includes('balance') ||
          lowerName.includes('due') ||
          lowerName.includes('invoice') ||
          lowerName.includes('receipt') ||
          lowerName.includes('merchant') ||
          lowerName.includes('visa') ||
          lowerName.includes('mastercard') ||
          lowerName.includes('phonepe') ||
          lowerName.includes('gpay') ||
          lowerName.includes('paytm')
        ) {
          return;
        }
        
        // Clean special characters from beginning and end of name
        name = name.replace(/^[\*\-\.\s\d#]+/, '').trim();
        name = name.replace(/[\.\-\*#]+$/, '').trim();
        
        // Capitalize first letter of item name
        if (name.length >= 2) {
          name = name.charAt(0).toUpperCase() + name.slice(1);
          results.push({ name, price });
        }
      }
    });
    return results;
  }

  // Import button logic
  if (btnImportScanned) {
    btnImportScanned.addEventListener('click', () => {
      const rows = scannedItemsList.querySelectorAll('.scanned-item-row');
      let count = 0;

      rows.forEach(row => {
        const checkbox = row.querySelector('.scanned-item-checkbox');
        if (checkbox && checkbox.checked) {
          const nameInput = row.querySelector('.scanned-item-name-input');
          const priceInput = row.querySelector('.scanned-item-price-input');
          
          const name = nameInput.value.trim();
          const price = parseFloat(priceInput.value) || 0;

          if (name && price > 0) {
            // Add item sharing with all friends by default
            const newItem = {
              id: (Date.now() + count).toString(),
              name,
              price,
              qty: 1,
              assignees: friends.reduce((obj, f) => { obj[f] = 1; return obj; }, {})
            };
            items.push(newItem);
            count++;
          }
        }
      });

      if (count > 0) {
        showToast(`✅ Successfully imported ${count} item(s) from receipt!`);
        scannerModal.style.display = 'none';
        renderAll();
      } else {
        showToast('⚠️ No items selected or valid to import.');
      }
    });
  }
  
  // ==========================================
  // --- SESSION HISTORY ARCHIVES ---
  // ==========================================
  
  function formatMoneyInCurrency(amount, code) {
    let locale = 'en-US';
    switch (code) {
      case 'INR': locale = 'en-IN'; break;
      case 'EUR': locale = 'de-DE'; break;
      case 'GBP': locale = 'en-GB'; break;
      case 'JPY': locale = 'ja-JP'; break;
      case 'CAD': locale = 'en-CA'; break;
      case 'AUD': locale = 'en-AU'; break;
      case 'SGD': locale = 'en-SG'; break;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code
    }).format(amount);
  }

  if (btnSaveSession) {
    btnSaveSession.addEventListener('click', () => {
      const title = sessionTitleInput.value.trim();
      if (!title) {
        showToast('Please enter a session title to save.');
        return;
      }
      if (friends.length === 0 && items.length === 0) {
        showToast('Cannot save an empty bill.');
        return;
      }

      // Calculate grand total to display in history meta
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const taxVal = parseFloat(taxInput.value) || 0;
      const isServiceChargeEnabled = serviceChargeToggle ? serviceChargeToggle.classList.contains('active') : true;
      const tipVal = isServiceChargeEnabled ? (parseFloat(tipInput.value) || 0) : 0;
      const taxTotal = taxType === 'percent' ? (subtotal * (taxVal / 100)) : taxVal;
      const tipTotal = isServiceChargeEnabled ? (tipType === 'percent' ? (subtotal * (tipVal / 100)) : tipVal) : 0;
      const grandTotal = subtotal + taxTotal + tipTotal;

      const sessionSnapshot = {
        id: Date.now().toString(),
        title: title,
        timestamp: new Date().toLocaleString(),
        grandTotal: grandTotal,
        friends: [...friends],
        items: JSON.parse(JSON.stringify(items)),
        payments: JSON.parse(JSON.stringify(payments)),
        taxType: taxType,
        taxVal: taxInput.value,
        tipType: tipType,
        tipVal: tipInput.value,
        serviceChargeEnabled: isServiceChargeEnabled,
        friendColorOverrides: JSON.parse(JSON.stringify(friendColorOverrides)),
        currency: currencySelect.value
      };

      history.unshift(sessionSnapshot);
      saveLocalStorage();
      sessionTitleInput.value = '';
      showToast(`Successfully saved session "${title}"!`);
    });
  }

  if (btnOpenHistory) {
    btnOpenHistory.addEventListener('click', () => {
      renderHistoryList();
      historyModal.style.display = 'flex';
    });
  }

  if (btnCloseHistory) {
    btnCloseHistory.addEventListener('click', () => {
      historyModal.style.display = 'none';
    });
  }

  if (historyModal) {
    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) {
        historyModal.style.display = 'none';
      }
    });
  }

  function renderHistoryList() {
    historyListContainer.innerHTML = '';
    if (history.length === 0) {
      historyListContainer.innerHTML = `<p class="placeholder-text text-center">No saved sessions found in archive.</p>`;
      return;
    }

    history.forEach(session => {
      const row = document.createElement('div');
      row.className = 'history-item-row';
      row.setAttribute('data-id', session.id);

      const friendsCount = session.friends.length;
      const itemsCount = session.items.length;
      const subtitleText = `${session.timestamp} • ${friendsCount} friend(s) • ${itemsCount} item(s)`;

      row.innerHTML = `
        <div class="history-item-meta">
          <span class="history-item-title">${escapeHtml(session.title)}</span>
          <span class="history-item-subtitle">${escapeHtml(subtitleText)}</span>
        </div>
        <span class="history-item-total">${formatMoneyInCurrency(session.grandTotal, session.currency)}</span>
        <div class="history-item-actions">
          <button type="button" class="btn-load" onclick="loadSession('${session.id}')" title="Load Split State">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </button>
          <button type="button" class="btn-delete" onclick="deleteSession('${session.id}')" title="Delete Archive">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      `;
      historyListContainer.appendChild(row);
    });
  }

  window.loadSession = function(id) {
    const session = history.find(s => s.id === id);
    if (!session) return;

    if (confirm(`Are you sure you want to load session "${session.title}"? This will replace your current bill state.`)) {
      friends = [...session.friends];
      items = JSON.parse(JSON.stringify(session.items));
      payments = JSON.parse(JSON.stringify(session.payments));
      taxType = session.taxType;
      taxInput.value = session.taxVal;
      tipType = session.tipType;
      tipInput.value = session.tipVal;
      
      if (serviceChargeToggle) {
        if (session.serviceChargeEnabled) {
          serviceChargeToggle.classList.add('active');
        } else {
          serviceChargeToggle.classList.remove('active');
        }
      }
      
      if (session.currency) currencySelect.value = session.currency;
      if (session.friendColorOverrides) friendColorOverrides = JSON.parse(JSON.stringify(session.friendColorOverrides));

      updateCurrencySymbol();
      syncToggleGroups();
      syncServiceChargeToggleVisuals();
      renderAll();

      historyModal.style.display = 'none';
      showToast(`Loaded session "${session.title}" successfully.`);
    }
  };

  window.deleteSession = function(id) {
    const session = history.find(s => s.id === id);
    if (!session) return;

    if (confirm(`Are you sure you want to delete session "${session.title}" from the archive?`)) {
      history = history.filter(s => s.id !== id);
      saveLocalStorage();
      renderHistoryList();
      showToast(`Deleted session "${session.title}" from archive.`);
    }
  };

  window.toggleSettleDebt = function(event, from, to) {
    event.stopPropagation(); // Avoid expanding details card on checkbox click
    const key = `${from}->${to}`;
    if (event.target.checked) {
      settledTransfers[key] = true;
    } else {
      delete settledTransfers[key];
    }
    saveLocalStorage();
    calculateSettlementsFromActiveState();
  };

  console.log("✅ QuickSplit Pro script initialization complete!");
});
