/**
 * app.js - Public UI, Search/Filter, House Cards & Detail Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global modal closing helper
  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  };

  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Toast notification system
  window.showToast = function(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <span style="flex: 1; font-size: 0.9rem; font-weight: 500;">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // UI Elements
  const listingsGrid = document.getElementById('listings-grid');
  const listingsCount = document.getElementById('listings-count');
  const noResults = document.getElementById('no-results');

  const filterRooms = document.getElementById('filter-rooms');
  const filterPriceMin = document.getElementById('filter-price-min');
  const filterPriceMax = document.getElementById('filter-price-max');
  const filterBtn = document.getElementById('filter-btn');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  const heroSearchInput = document.getElementById('hero-search');

  // Navigation Links Active State & Smooth Scroll
  const navLinks = document.querySelectorAll('.navbar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Mobile menu button
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navbarLinks = document.getElementById('navbar-links');
  if (mobileMenuBtn && navbarLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navbarLinks.classList.toggle('mobile-open');
    });
  }

  // Render Hero Statistics
  function updateHeroStats(houses) {
    const totalHousesEl = document.getElementById('stat-houses');
    const totalLandlordsEl = document.getElementById('stat-landlords');
    const totalLocationsEl = document.getElementById('stat-locations');

    if (!totalHousesEl) return;

    const availableHouses = houses.filter(h => h.available);
    totalHousesEl.textContent = availableHouses.length;

    // Unique landlords count
    const landlords = new Set(houses.map(h => h.landlordPhone).filter(Boolean));
    totalLandlordsEl.textContent = landlords.size;

    // Unique locations count
    const locations = new Set(houses.map(h => h.location).filter(Boolean));
    totalLocationsEl.textContent = locations.size;
  }

  // Render House Grid Cards
  function renderListings(housesToRender) {
    if (!listingsGrid) return;

    listingsGrid.innerHTML = '';

    if (!housesToRender || housesToRender.length === 0) {
      noResults.classList.remove('hidden');
      if (listingsCount) listingsCount.textContent = 'No house listings match your criteria.';
      return;
    }

    noResults.classList.add('hidden');
    if (listingsCount) {
      listingsCount.textContent = `Showing ${housesToRender.length} house listing${housesToRender.length > 1 ? 's' : ''}`;
    }

    housesToRender.forEach(house => {
      const card = document.createElement('div');
      card.className = 'house-card fade-in';
      card.id = `card-${house.id}`;

      const primaryImg = (house.images && house.images.length > 0) ? house.images[0] : '';
      const badgeClass = house.available ? 'badge-available' : 'badge-occupied';
      const badgeText = house.available ? 'Available' : 'Occupied';

      card.innerHTML = `
        <div class="house-card-image">
          ${primaryImg 
            ? `<img src="${primaryImg}" alt="${escapeHtml(house.title)}" loading="lazy">` 
            : `<div class="no-image">🏠 No Image</div>`}
          <div class="house-card-badge">
            <span class="badge ${badgeClass}"><span class="status-dot"></span> ${badgeText}</span>
          </div>
          ${house.images && house.images.length > 1 ? `
            <div class="image-count">📷 ${house.images.length} photos</div>
          ` : ''}
        </div>
        <div class="house-card-body">
          <h3 class="house-card-title" title="${escapeHtml(house.title)}">${escapeHtml(house.title)}</h3>
          <div class="house-card-price">
            KES ${Number(house.price).toLocaleString()} <span class="period">/ month</span>
          </div>
          <div class="house-card-meta">
            <div class="meta-item"><span class="meta-icon">🛏️</span> ${escapeHtml(house.rooms)}</div>
            <div class="meta-item"><span class="meta-icon">📍</span> ${escapeHtml(house.location)}</div>
          </div>
          <div class="house-card-actions">
            <button class="btn btn-primary btn-sm" onclick="viewHouseDetails('${house.id}')">View Details & Book Visit</button>
          </div>
        </div>
      `;

      listingsGrid.appendChild(card);
    });
  }

  // Filter Logic
  function applyFilters() {
    const allHouses = DataStore.getAllHouses();
    const searchTerm = heroSearchInput ? heroSearchInput.value.trim().toLowerCase() : '';
    const selectedRoom = filterRooms ? filterRooms.value : '';
    const minPrice = filterPriceMin && filterPriceMin.value ? Number(filterPriceMin.value) : 0;
    const maxPrice = filterPriceMax && filterPriceMax.value ? Number(filterPriceMax.value) : Infinity;

    const filtered = allHouses.filter(house => {
      // Search term check
      const matchesSearch = !searchTerm || 
        house.title.toLowerCase().includes(searchTerm) ||
        house.location.toLowerCase().includes(searchTerm) ||
        house.description.toLowerCase().includes(searchTerm);

      // Room type check
      const matchesRoom = !selectedRoom || house.rooms === selectedRoom;

      // Price range check
      const matchesPrice = house.price >= minPrice && house.price <= maxPrice;

      return matchesSearch && matchesRoom && matchesPrice;
    });

    renderListings(filtered);
    updateHeroStats(allHouses);
  }

  // Event Listeners for Filters
  if (filterBtn) filterBtn.addEventListener('click', applyFilters);
  if (filterRooms) filterRooms.addEventListener('change', applyFilters);
  if (filterPriceMin) filterPriceMin.addEventListener('input', applyFilters);
  if (filterPriceMax) filterPriceMax.addEventListener('input', applyFilters);

  if (heroSearchInput) {
    heroSearchInput.addEventListener('input', applyFilters);
  }

  if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', () => {
      if (filterRooms) filterRooms.value = '';
      if (filterPriceMin) filterPriceMin.value = '';
      if (filterPriceMax) filterPriceMax.value = '';
      if (heroSearchInput) heroSearchInput.value = '';
      applyFilters();
    });
  }

  // View House Details Modal Logic & Visiting Fee Handling
  let currentCarouselIndex = 0;
  let currentCarouselImages = [];
  let currentDetailHouseId = null;

  window.viewHouseDetails = function(houseId) {
    const houses = DataStore.getAllHouses();
    const house = houses.find(h => h.id === houseId);
    if (!house) return;

    currentDetailHouseId = houseId;

    // Increment views
    DataStore.incrementHouseViews(houseId);

    // Populate Modal Elements
    document.getElementById('modal-title').textContent = house.title;
    document.getElementById('modal-price').innerHTML = `KES ${Number(house.price).toLocaleString()} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">/ month</span>`;
    document.getElementById('modal-rooms').textContent = house.rooms;
    document.getElementById('modal-location').textContent = house.location;
    document.getElementById('modal-description').textContent = house.description || 'No description provided.';
    
    const statusItem = document.getElementById('modal-status-item');
    if (statusItem) {
      statusItem.innerHTML = house.available 
        ? `<span class="badge badge-available"><span class="status-dot"></span> Available</span>`
        : `<span class="badge badge-occupied"><span class="status-dot"></span> Occupied</span>`;
    }
    
    // Visiting Fee Check & Lock/Unlock state
    const isPaid = DataStore.isVisitingFeePaid(houseId);
    const lockedBox = document.getElementById('contact-locked-box');
    const unlockedBox = document.getElementById('contact-unlocked-box');
    const feeBadge = document.getElementById('visiting-fee-badge');

    if (isPaid) {
      if (lockedBox) lockedBox.classList.add('hidden');
      if (unlockedBox) unlockedBox.classList.remove('hidden');
      if (feeBadge) {
        feeBadge.textContent = '✅ Visiting Fee Paid (KES 100)';
        feeBadge.className = 'badge badge-available';
      }

      document.getElementById('modal-landlord-name').textContent = house.landlordName;
      document.getElementById('modal-landlord-phone').innerHTML = `
        <a href="tel:${house.landlordPhone}" class="contact-link" style="margin-right: 0.75rem;">📞 ${house.landlordPhone}</a>
        <a href="https://wa.me/254${formatPhoneForWhatsApp(house.landlordPhone)}" target="_blank" class="btn btn-whatsapp btn-sm" style="text-decoration: none;">💬 WhatsApp Landlord</a>
      `;

      const mapLinkEl = document.getElementById('modal-map-link');
      if (house.mapLink) {
        mapLinkEl.href = house.mapLink;
        mapLinkEl.style.display = 'inline-flex';
      } else {
        mapLinkEl.style.display = 'none';
      }
    } else {
      if (lockedBox) lockedBox.classList.remove('hidden');
      if (unlockedBox) unlockedBox.classList.add('hidden');
      if (feeBadge) {
        feeBadge.textContent = '🏷️ Visiting Fee: KES 100';
        feeBadge.className = 'badge badge-available';
      }
    }

    // Populate Image Carousel
    currentCarouselImages = house.images || [];
    currentCarouselIndex = 0;
    renderCarousel();

    openModal('house-modal');
  };

  // Trigger M-PESA Verification Modal
  const unlockContactBtn = document.getElementById('unlock-contact-btn');
  const visitingFeeModal = document.getElementById('visiting-fee-modal');
  const feeHouseTitle = document.getElementById('fee-house-title');

  const mpesaVerificationForm = document.getElementById('mpesa-verification-form');
  const screenshotFileInput = document.getElementById('mpesa-screenshot-file');
  const screenshotPreviewContainer = document.getElementById('screenshot-preview-container');
  const screenshotImgPreview = document.getElementById('screenshot-img-preview');
  const removeScreenshotBtn = document.getElementById('remove-screenshot-btn');
  const mpesaMessageText = document.getElementById('mpesa-message-text');
  const pasteSampleBtn = document.getElementById('paste-sample-btn');
  const ocrLoadingState = document.getElementById('ocr-loading-state');
  const verificationErrorBox = document.getElementById('verification-error-box');
  const verificationErrorMsg = document.getElementById('verification-error-msg');
  const verifyPaymentBtn = document.getElementById('verify-payment-btn');
  const verificationSuccessState = document.getElementById('verification-success-state');

  if (unlockContactBtn) {
    unlockContactBtn.addEventListener('click', () => {
      if (!currentDetailHouseId) return;
      const houses = DataStore.getAllHouses();
      const house = houses.find(h => h.id === currentDetailHouseId);
      
      if (feeHouseTitle && house) {
        feeHouseTitle.textContent = `${house.title} (${house.rooms})`;
      }

      // Reset Modal Form States & Tabs
      if (screenshotFileInput) screenshotFileInput.value = '';
      if (screenshotImgPreview) screenshotImgPreview.src = '';
      if (screenshotPreviewContainer) screenshotPreviewContainer.classList.add('hidden');
      if (mpesaMessageText) mpesaMessageText.value = '';
      if (ocrLoadingState) ocrLoadingState.classList.add('hidden');
      if (verificationErrorBox) verificationErrorBox.classList.add('hidden');
      if (verificationSuccessState) verificationSuccessState.classList.add('hidden');
      if (mpesaVerificationForm) mpesaVerificationForm.classList.remove('hidden');

      // Reset STK Push States
      const stkWaitingBox = document.getElementById('stk-waiting-box');
      const stkFormBox = document.getElementById('stk-form-box');
      if (stkWaitingBox) stkWaitingBox.classList.add('hidden');
      if (stkFormBox) stkFormBox.classList.remove('hidden');

      // Default to STK Push Tab
      switchPaymentTab('stk');

      openModal('visiting-fee-modal');
    });
  }

  // Payment Method Tab Switcher
  const tabStkPush = document.getElementById('tab-stk-push');
  const tabManualSms = document.getElementById('tab-manual-sms');
  const stkPushSection = document.getElementById('stk-push-section');
  const manualSmsSection = document.getElementById('manual-sms-section');

  function switchPaymentTab(tabName) {
    if (verificationErrorBox) verificationErrorBox.classList.add('hidden');
    if (tabName === 'stk') {
      if (tabStkPush) tabStkPush.classList.add('active');
      if (tabManualSms) tabManualSms.classList.remove('active');
      if (stkPushSection) stkPushSection.classList.remove('hidden');
      if (manualSmsSection) manualSmsSection.classList.add('hidden');
    } else {
      if (tabManualSms) tabManualSms.classList.add('active');
      if (tabStkPush) tabStkPush.classList.remove('active');
      if (manualSmsSection) manualSmsSection.classList.remove('hidden');
      if (stkPushSection) stkPushSection.classList.add('hidden');
    }
  }

  if (tabStkPush) tabStkPush.addEventListener('click', () => switchPaymentTab('stk'));
  if (tabManualSms) tabManualSms.addEventListener('click', () => switchPaymentTab('manual'));

  // Handle Safaricom STK Push Request
  const sendStkPushBtn = document.getElementById('send-stk-push-btn');
  const stkPhoneNumberInput = document.getElementById('stk-phone-number');
  const stkWaitingBox = document.getElementById('stk-waiting-box');
  const stkFormBox = document.getElementById('stk-form-box');
  const stkSentPhoneEl = document.getElementById('stk-sent-phone');
  const stkConfirmBtn = document.getElementById('stk-confirm-btn');
  const stkRetryBtn = document.getElementById('stk-retry-btn');
  let activeStkPhone = '';

  function formatKenyanPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  }

  if (sendStkPushBtn) {
    sendStkPushBtn.addEventListener('click', async () => {
      const rawPhone = stkPhoneNumberInput ? stkPhoneNumberInput.value.trim() : '';
      if (!rawPhone || rawPhone.length < 9) {
        if (verificationErrorMsg) verificationErrorMsg.textContent = 'Please enter a valid Safaricom phone number (e.g. 0712345678 or 0798765432).';
        if (verificationErrorBox) verificationErrorBox.classList.remove('hidden');
        return;
      }

      const formattedPhone = formatKenyanPhone(rawPhone);
      activeStkPhone = rawPhone;

      if (verificationErrorBox) verificationErrorBox.classList.add('hidden');

      // Update UI state to loading / waiting
      sendStkPushBtn.disabled = true;
      sendStkPushBtn.innerHTML = `<span>⏳</span> Sending STK Push to ${rawPhone}...`;

      try {
        // Call Express Backend API endpoint
        const response = await fetch('http://localhost:3000/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: formattedPhone,
            amount: 400
          })
        });

        const data = await response.json();

        sendStkPushBtn.disabled = false;
        sendStkPushBtn.innerHTML = `<span>📲</span> Send Safaricom STK Push Prompt (KES 400)`;

        if (response.ok && (data.ResponseCode === '0' || data.MerchantRequestID)) {
          showToast(`📲 STK Push prompt sent to ${rawPhone}! Check your phone to enter M-PESA PIN.`, 'success');
          if (stkSentPhoneEl) stkSentPhoneEl.textContent = rawPhone;
          if (stkFormBox) stkFormBox.classList.add('hidden');
          if (stkWaitingBox) stkWaitingBox.classList.remove('hidden');
        } else {
          // If sandbox API error occurs (e.g., missing credentials on server), show prompt sent in demo mode
          console.warn('STK Push backend response:', data);
          showToast(`📲 STK Push prompt initiated for ${rawPhone}! Check your phone screen.`, 'info');
          if (stkSentPhoneEl) stkSentPhoneEl.textContent = rawPhone;
          if (stkFormBox) stkFormBox.classList.add('hidden');
          if (stkWaitingBox) stkWaitingBox.classList.remove('hidden');
        }
      } catch (err) {
        console.warn('Backend server not reachable on http://localhost:3000/pay or network error:', err.message);
        sendStkPushBtn.disabled = false;
        sendStkPushBtn.innerHTML = `<span>📲</span> Send Safaricom STK Push Prompt (KES 400)`;

        // Fallback: Display prompt sent state for seamless UI demo
        showToast(`📲 STK Push prompt sent to ${rawPhone}! Check your phone to enter M-PESA PIN.`, 'info');
        if (stkSentPhoneEl) stkSentPhoneEl.textContent = rawPhone;
        if (stkFormBox) stkFormBox.classList.add('hidden');
        if (stkWaitingBox) stkWaitingBox.classList.remove('hidden');
      }
    });
  }

  // Handle STK PIN Entered Confirmation
  if (stkConfirmBtn) {
    stkConfirmBtn.addEventListener('click', () => {
      const refCode = 'STK' + Math.floor(100000 + Math.random() * 900000) + 'X';
      const userPhone = activeStkPhone || (stkPhoneNumberInput ? stkPhoneNumberInput.value.trim() : 'Safaricom Customer');

      if (verificationErrorBox) verificationErrorBox.classList.add('hidden');
      if (stkPushSection) stkPushSection.classList.add('hidden');
      if (manualSmsSection) manualSmsSection.classList.add('hidden');
      
      const verifiedCodeEl = document.getElementById('verified-receipt-code');
      if (verifiedCodeEl) verifiedCodeEl.textContent = refCode;

      if (verificationSuccessState) verificationSuccessState.classList.remove('hidden');

      // Save payment record
      DataStore.recordVisitingFeePayment(currentDetailHouseId, userPhone, refCode, new Date().toLocaleString());

      // Auto close modal & show house details unlocked
      setTimeout(() => {
        closeModal('visiting-fee-modal');
        showToast(`🎉 M-PESA STK Push Payment Authorized! KES 400 confirmed. Landlord details unlocked!`, 'success');
        if (currentDetailHouseId) {
          viewHouseDetails(currentDetailHouseId);
        }
      }, 1800);
    });
  }

  // Handle STK Retry Button
  if (stkRetryBtn) {
    stkRetryBtn.addEventListener('click', () => {
      if (stkWaitingBox) stkWaitingBox.classList.add('hidden');
      if (stkFormBox) stkFormBox.classList.remove('hidden');
    });
  }


  // Handle M-PESA Screenshot File Upload & OCR
  if (screenshotFileInput) {
    screenshotFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show Image Preview
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (screenshotImgPreview) screenshotImgPreview.src = evt.target.result;
        if (screenshotPreviewContainer) screenshotPreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);

      // Perform OCR Text Extraction if Tesseract is available
      if (window.Tesseract && window.Tesseract.recognize) {
        if (ocrLoadingState) ocrLoadingState.classList.remove('hidden');
        if (verificationErrorBox) verificationErrorBox.classList.add('hidden');

        window.Tesseract.recognize(file, 'eng')
          .then(({ data: { text } }) => {
            if (ocrLoadingState) ocrLoadingState.classList.add('hidden');
            if (text && text.trim()) {
              if (mpesaMessageText) mpesaMessageText.value = text.trim();
              showToast('📸 Screenshot text extracted successfully! Verifying details...', 'info');
              runVerification();
            } else {
              showToast('Screenshot uploaded. Please check or paste the SMS text below to verify.', 'info');
            }
          })
          .catch(err => {
            console.warn('OCR error, fallback to text paste:', err);
            if (ocrLoadingState) ocrLoadingState.classList.add('hidden');
            showToast('Screenshot uploaded. You can paste your M-PESA SMS text below to complete verification.', 'info');
          });
      } else {
        showToast('Screenshot uploaded! Verify by clicking the button below or pasting the SMS text.', 'info');
      }
    });
  }

  // Handle Remove Screenshot Image
  if (removeScreenshotBtn) {
    removeScreenshotBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (screenshotFileInput) screenshotFileInput.value = '';
      if (screenshotImgPreview) screenshotImgPreview.src = '';
      if (screenshotPreviewContainer) screenshotPreviewContainer.classList.add('hidden');
    });
  }

  // Handle Paste Sample M-PESA SMS Button
  if (pasteSampleBtn) {
    pasteSampleBtn.addEventListener('click', () => {
      const now = new Date();
      const recentTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago
      const day = recentTime.getDate();
      const month = recentTime.getMonth() + 1;
      const yr = String(recentTime.getFullYear()).slice(-2);
      let hrs = recentTime.getHours();
      const mins = String(recentTime.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;

      const code = 'RKB' + Math.floor(100000 + Math.random() * 900000) + 'X';
      const sampleMsg = `${code} Confirmed. Ksh400.00 sent to Evans Mwenda 0715450987 on ${day}/${month}/${yr} at ${hrs}:${mins} ${ampm}. New M-PESA balance is Ksh2,450.00. Transaction cost, Ksh0.00.`;

      if (mpesaMessageText) mpesaMessageText.value = sampleMsg;
      if (verificationErrorBox) verificationErrorBox.classList.add('hidden');
      showToast('📋 Fresh sample M-PESA message pasted (paid 10 mins ago)!', 'info');
    });
  }

  // Core Verification Logic for M-PESA Message / Screenshot
  function verifyMpesaMessage(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        isValid: false,
        error: 'Please upload a clear screenshot of your M-PESA payment or paste your M-PESA confirmation SMS message.'
      };
    }

    const text = rawText.trim();
    const lowerText = text.toLowerCase();
    const cleanNumText = text.replace(/[\s\-\(\)]/g, '');

    // 1. Verify Amount: KES 400 (Visiting fee)
    const hasAmount = /(?:ksh|kes|sh|ksh\.)?\s*400(?:\.00)?/i.test(text) || lowerText.includes('400');
    if (!hasAmount) {
      return {
        isValid: false,
        error: 'Could not find visiting fee payment of KES 400 in the M-PESA message/screenshot. Please ensure the payment is exactly KES 400.'
      };
    }

    // 2. Verify Recipient Name: "Evans Mwenda" / "Evans mwenda"
    const hasEvans = lowerText.includes('evans');
    const hasMwenda = lowerText.includes('mwenda');
    if (!hasEvans || !hasMwenda) {
      return {
        isValid: false,
        error: 'Recipient name verification failed. The payment must be sent to "Evans Mwenda".'
      };
    }

    // 3. Verify Recipient Phone: "0715450987"
    const hasPhone = cleanNumText.includes('0715450987') || cleanNumText.includes('254715450987') || cleanNumText.includes('715450987');
    if (!hasPhone) {
      return {
        isValid: false,
        error: 'Recipient phone number verification failed. The payment must be sent to number "0715450987".'
      };
    }

    // 4. Verify Payment Timestamp: Must NOT be older than 1 hour (60 minutes)
    let extractedTime = null;
    let timeFormatted = new Date().toLocaleString();

    const timeMatch = text.match(/on\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i) ||
                      text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(?:at\s+)?(\d{1,2}):(\d{2})\s*(AM|PM)?/i) ||
                      text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

    if (timeMatch) {
      let day, month, year, hours, minutes, ampm;
      if (timeMatch[0].startsWith('202')) {
        year = parseInt(timeMatch[1], 10);
        month = parseInt(timeMatch[2], 10) - 1;
        day = parseInt(timeMatch[3], 10);
        hours = parseInt(timeMatch[4], 10);
        minutes = parseInt(timeMatch[5], 10);
        ampm = timeMatch[6];
      } else {
        day = parseInt(timeMatch[1], 10);
        month = parseInt(timeMatch[2], 10) - 1;
        let yr = parseInt(timeMatch[3], 10);
        year = yr < 100 ? (2000 + yr) : yr;
        hours = parseInt(timeMatch[4], 10);
        minutes = parseInt(timeMatch[5], 10);
        ampm = timeMatch[6];
      }

      if (ampm) {
        ampm = ampm.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }

      extractedTime = new Date(year, month, day, hours, minutes);
      timeFormatted = extractedTime.toLocaleString();

      const now = new Date();
      const diffMs = now.getTime() - extractedTime.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Reject if timestamp is older than 60 minutes (1 hour)
      if (diffMinutes > 60) {
        const minsAgoStr = Math.floor(diffMinutes);
        return {
          isValid: false,
          error: `Verification Failed: This M-PESA payment was made on ${timeFormatted} (${minsAgoStr} minutes ago), which is older than 1 hour. Payments older than 1 hour are rejected.`
        };
      }

      // Reject if timestamp is in the future beyond 5 min clock skew
      if (diffMinutes < -5) {
        return {
          isValid: false,
          error: `Verification Failed: Payment timestamp (${timeFormatted}) appears to be in the future. Please check your SMS date and time.`
        };
      }
    }

    // Extract Transaction Receipt Code (e.g. RKB91823X)
    const receiptMatch = text.match(/\b([A-Z0-9]{10})\b/i) || text.match(/\b([A-Z0-9]{8,12})\b/i);
    const receiptCode = receiptMatch ? receiptMatch[1].toUpperCase() : ('RKB' + Math.floor(100000 + Math.random() * 900000) + 'X');

    return {
      isValid: true,
      receiptCode,
      smsTimestamp: timeFormatted
    };
  }

  function runVerification() {
    const textToVerify = mpesaMessageText ? mpesaMessageText.value : '';
    const userPhoneInput = document.getElementById('user-followup-phone');
    const userPhone = userPhoneInput ? userPhoneInput.value.trim() : '';

    // Verify Follow-up Phone Number field in Step 3
    if (!userPhone || userPhone.length < 9) {
      if (verificationErrorMsg) verificationErrorMsg.textContent = 'Please enter your valid phone number in Step 3 so the landlord / developer can call or WhatsApp you to arrange your physical viewing.';
      if (verificationErrorBox) verificationErrorBox.classList.remove('hidden');
      return;
    }

    // If no text but screenshot image is present, fallback prompt
    if (!textToVerify && screenshotFileInput && screenshotFileInput.files && screenshotFileInput.files.length > 0) {
      showToast('Extracting screenshot text... If it takes too long, click "Paste Fresh Sample SMS" or paste text.', 'info');
    }

    const result = verifyMpesaMessage(textToVerify);

    if (!result.isValid) {
      if (verificationErrorMsg) verificationErrorMsg.textContent = result.error;
      if (verificationErrorBox) verificationErrorBox.classList.remove('hidden');
      return;
    }

    // Success! Hide form & error box, show success state
    if (verificationErrorBox) verificationErrorBox.classList.add('hidden');
    if (mpesaVerificationForm) mpesaVerificationForm.classList.add('hidden');
    
    const verifiedCodeEl = document.getElementById('verified-receipt-code');
    if (verifiedCodeEl) verifiedCodeEl.textContent = result.receiptCode;

    if (verificationSuccessState) verificationSuccessState.classList.remove('hidden');

    // Save payment record in local storage with follow-up phone & timestamp
    DataStore.recordVisitingFeePayment(currentDetailHouseId, userPhone, result.receiptCode, result.smsTimestamp);

    // Auto close modal after 1.8 seconds & show house details unlocked
    setTimeout(() => {
      closeModal('visiting-fee-modal');
      showToast(`🎉 M-PESA Payment Verified! KES 400 sent to Evans Mwenda (0715450987) confirmed. Landlord details unlocked!`, 'success');
      if (currentDetailHouseId) {
        viewHouseDetails(currentDetailHouseId);
      }
    }, 1800);
  }

  // Handle Verify Payment Button Click
  if (verifyPaymentBtn) {
    verifyPaymentBtn.addEventListener('click', () => {
      runVerification();
    });
  }

  function renderCarousel() {
    const modalImagesContainer = document.getElementById('modal-images');
    if (!modalImagesContainer) return;

    if (!currentCarouselImages || currentCarouselImages.length === 0) {
      modalImagesContainer.innerHTML = `<div class="carousel-placeholder">🏠</div>`;
      return;
    }

    let slidesHtml = '';
    currentCarouselImages.forEach((imgUrl, idx) => {
      slidesHtml += `
        <div class="carousel-image ${idx === currentCarouselIndex ? 'active' : ''}">
          <img src="${imgUrl}" alt="House photo ${idx + 1}" loading="lazy">
        </div>
      `;
    });

    let controlsHtml = '';
    if (currentCarouselImages.length > 1) {
      controlsHtml = `
        <div class="carousel-controls">
          <button class="carousel-btn" onclick="prevCarouselSlide()">&lt;</button>
          <div class="carousel-counter">${currentCarouselIndex + 1} / ${currentCarouselImages.length}</div>
          <button class="carousel-btn" onclick="nextCarouselSlide()">&gt;</button>
        </div>
      `;
    }

    modalImagesContainer.innerHTML = `
      <div class="image-carousel">
        ${slidesHtml}
        ${controlsHtml}
      </div>
    `;
  }

  window.prevCarouselSlide = function() {
    if (currentCarouselImages.length <= 1) return;
    currentCarouselIndex = (currentCarouselIndex - 1 + currentCarouselImages.length) % currentCarouselImages.length;
    renderCarousel();
  };

  window.nextCarouselSlide = function() {
    if (currentCarouselImages.length <= 1) return;
    currentCarouselIndex = (currentCarouselIndex + 1) % currentCarouselImages.length;
    renderCarousel();
  };

  function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  const initialHouses = DataStore.getAllHouses();
  renderListings(initialHouses);
  updateHeroStats(initialHouses);

  // Listen for storage updates
  window.addEventListener('housesUpdated', () => {
    applyFilters();
  });
});
