// ============================================================
// ByteLens — My Vault (Personal Gallery)
// ============================================================

(function () {
    const { showModal, hideModal, showToast } = window.ByteLens;

    // --- DOM Elements ---
    const vaultPanel = document.getElementById('vaultPanel');
    const vaultOverlay = document.getElementById('vaultOverlay');
    const vaultGrid = document.getElementById('vaultGrid');
    const vaultEmptyState = document.getElementById('vaultEmptyState');
    const vaultCounter = document.getElementById('vaultCounter');
    const vaultNavBtn = document.getElementById('vaultNavBtn');
    const vaultBadge = document.getElementById('vaultBadge');
    const closeVaultBtn = document.getElementById('closeVaultBtn');
    const vaultUploadBtn = document.getElementById('vaultUploadBtn');
    const vaultEmptyUploadBtn = document.getElementById('vaultEmptyUploadBtn');
    const vaultFileInput = document.getElementById('vaultFileInput');
    const vaultSearchInput = document.getElementById('vaultSearchInput');
    const vaultSelectModeBtn = document.getElementById('vaultSelectModeBtn');
    const vaultSelectActions = document.getElementById('vaultSelectActions');
    const vaultSelectedCount = document.getElementById('vaultSelectedCount');
    const vaultSellSelectedBtn = document.getElementById('vaultSellSelectedBtn');
    const vaultDeleteSelectedBtn = document.getElementById('vaultDeleteSelectedBtn');
    const vaultUploadArea = document.getElementById('vaultUploadArea');
    const vaultUploadStatus = document.getElementById('vaultUploadStatus');
    const vaultUploadPercent = document.getElementById('vaultUploadPercent');
    const vaultUploadBar = document.getElementById('vaultUploadBar');

    // Sell Modal
    const vaultSellModal = document.getElementById('vaultSellModal');
    const closeVaultSellModal = document.getElementById('closeVaultSellModal');
    const cancelVaultSellBtn = document.getElementById('cancelVaultSellBtn');
    const confirmVaultSellBtn = document.getElementById('confirmVaultSellBtn');
    const vaultSellPreview = document.getElementById('vaultSellPreview');
    const vaultSellCount = document.getElementById('vaultSellCount');
    const vaultSellTitle = document.getElementById('vaultSellTitle');
    const vaultSellPrice = document.getElementById('vaultSellPrice');

    // --- State ---
    let vaultPhotos = [];
    let selectedIds = new Set();
    let isSelectMode = false;
    let searchQuery = '';

    // --- Supabase Helper ---
    function getSupabase() {
        return window.ByteLens.supabaseClient;
    }

    function getCurrentUserId() {
        // Try Supabase session first
        const sb = getSupabase();
        if (sb && window.ByteLens.currentUser?.id) return window.ByteLens.currentUser.id;
        // Fallback: email-based
        return window.ByteLens.currentUser?.email || null;
    }

    // --- LocalStorage Fallback Key ---
    function getStorageKey() {
        const uid = getCurrentUserId();
        return uid ? `bytelens-vault-${uid}` : null;
    }

    // =============================================
    // DATA LAYER: Supabase + localStorage fallback
    // =============================================

    async function loadVaultPhotos() {
        const sb = getSupabase();
        if (sb && window.ByteLens.currentUser?.id) {
            try {
                const { data, error } = await sb
                    .from('vault_photos')
                    .select('*')
                    .order('uploaded_at', { ascending: false });
                if (!error && data) {
                    // Get public/signed URLs for each photo
                    for (const photo of data) {
                        if (photo.storage_path) {
                            const { data: urlData } = sb.storage
                                .from('vault-photos')
                                .getPublicUrl(photo.storage_path);
                            photo.url = urlData?.publicUrl || '';
                        }
                    }
                    vaultPhotos = data;
                    console.log(`Vault: loaded ${data.length} photos from Supabase.`);
                    return;
                }
                if (error) console.warn('Vault Supabase load error:', error.message);
            } catch (err) {
                console.warn('Vault Supabase error:', err);
            }
        }

        // Fallback: localStorage
        const key = getStorageKey();
        if (key) {
            try {
                const stored = localStorage.getItem(key);
                vaultPhotos = stored ? JSON.parse(stored) : [];
            } catch { vaultPhotos = []; }
        }
        console.log(`Vault: loaded ${vaultPhotos.length} photos from localStorage.`);
    }

    function saveToLocalStorage() {
        const key = getStorageKey();
        if (key) {
            try { localStorage.setItem(key, JSON.stringify(vaultPhotos)); }
            catch (e) { console.warn('Vault localStorage save error:', e); }
        }
    }

    async function uploadPhotoToVault(file) {
        const sb = getSupabase();
        const uid = getCurrentUserId();
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${timestamp}_${safeName}`;

        if (sb && window.ByteLens.currentUser?.id) {
            try {
                const storagePath = `${window.ByteLens.currentUser.id}/${filename}`;
                const { error: uploadErr } = await sb.storage
                    .from('vault-photos')
                    .upload(storagePath, file, { contentType: file.type, upsert: false });
                if (uploadErr) throw uploadErr;

                const { data: inserted, error: dbErr } = await sb
                    .from('vault_photos')
                    .insert({
                        user_id: window.ByteLens.currentUser.id,
                        filename: filename,
                        original_name: file.name,
                        storage_path: storagePath,
                        file_size: file.size,
                        status: 'private',
                        title: file.name.replace(/\.[^.]+$/, ''),
                    })
                    .select()
                    .single();

                if (dbErr) throw dbErr;

                const { data: urlData } = sb.storage
                    .from('vault-photos')
                    .getPublicUrl(storagePath);
                inserted.url = urlData?.publicUrl || '';
                return inserted;
            } catch (err) {
                console.warn('Vault Supabase upload failed, falling back:', err);
            }
        }

        // Fallback: base64 in localStorage
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Resize for localStorage limits
                resizeImage(e.target.result, 800, (resizedUrl) => {
                    const photo = {
                        id: `vault_${timestamp}`,
                        filename: filename,
                        original_name: file.name,
                        storage_path: '',
                        file_size: file.size,
                        status: 'private',
                        sell_price: null,
                        title: file.name.replace(/\.[^.]+$/, ''),
                        uploaded_at: new Date().toISOString(),
                        url: resizedUrl,
                    };
                    resolve(photo);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    function resizeImage(dataUrl, maxWidth, callback) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
    }

    async function deleteVaultPhoto(photoId) {
        const photo = vaultPhotos.find(p => p.id === photoId);
        if (!photo) return;

        const sb = getSupabase();
        if (sb && photo.storage_path) {
            try {
                await sb.storage.from('vault-photos').remove([photo.storage_path]);
                await sb.from('vault_photos').delete().eq('id', photoId);
            } catch (err) { console.warn('Vault delete error:', err); }
        }

        vaultPhotos = vaultPhotos.filter(p => p.id !== photoId);
        saveToLocalStorage();
    }

    async function updatePhotoStatus(photoId, status, sellPrice, title) {
        const photo = vaultPhotos.find(p => p.id === photoId);
        if (!photo) return;

        photo.status = status;
        photo.sell_price = sellPrice;
        if (title) photo.title = title;

        const sb = getSupabase();
        if (sb && photo.storage_path) {
            try {
                await sb.from('vault_photos')
                    .update({ status, sell_price: sellPrice, title: photo.title })
                    .eq('id', photoId);
            } catch (err) { console.warn('Vault status update error:', err); }
        }
        saveToLocalStorage();
    }

    // =============================================
    // UI RENDERING
    // =============================================

    function getFilteredPhotos() {
        if (!searchQuery) return vaultPhotos;
        const q = searchQuery.toLowerCase();
        return vaultPhotos.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.original_name || '').toLowerCase().includes(q)
        );
    }

    function renderVault() {
        const photos = getFilteredPhotos();
        updateCounter();

        if (photos.length === 0) {
            vaultGrid.innerHTML = '';
            vaultEmptyState.classList.remove('hidden');
            vaultEmptyState.classList.add('flex');
            return;
        }

        vaultEmptyState.classList.add('hidden');
        vaultEmptyState.classList.remove('flex');

        vaultGrid.innerHTML = photos.map((photo, i) => {
            const isSelected = selectedIds.has(photo.id);
            const selectClass = isSelectMode ? 'select-mode' : '';
            const selectedClass = isSelected ? 'selected' : '';
            const statusBadge = photo.status === 'selling'
                ? '<span class="vault-status-badge vault-status-selling">Selling</span>'
                : '<span class="vault-status-badge vault-status-private">Private</span>';
            const checkIcon = isSelected
                ? '<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
                : '';
            const sizeText = photo.file_size ? formatFileSize(photo.file_size) : '';

            return `
                <div class="vault-photo-card ${selectClass} ${selectedClass} aspect-square bg-slate-100 dark:bg-slate-700 animate-vaultPhotoIn"
                     style="animation-delay: ${i * 40}ms"
                     data-id="${photo.id}"
                     onclick="window.ByteLens._vaultCardClick('${photo.id}')">
                    <img src="${photo.url}" alt="${photo.title || photo.original_name}" class="w-full h-full object-cover" loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%231e293b%22 width=%22200%22 height=%22200%22/><text fill=%22%2394a3b8%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>'">
                    <div class="vault-select-overlay"></div>
                    <div class="vault-checkbox">${checkIcon}</div>
                    ${statusBadge}
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                        <p class="text-white text-xs font-semibold truncate">${photo.title || photo.original_name}</p>
                        <p class="text-white/50 text-[10px] mt-0.5">${sizeText}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateCounter() {
        const total = vaultPhotos.length;
        vaultCounter.textContent = `${total} photo${total !== 1 ? 's' : ''}`;
        if (vaultBadge) {
            if (total > 0) {
                vaultBadge.textContent = total > 99 ? '99+' : total;
                vaultBadge.classList.remove('hidden');
                vaultBadge.classList.add('flex');
            } else {
                vaultBadge.classList.add('hidden');
                vaultBadge.classList.remove('flex');
            }
        }
    }

    function updateSelectUI() {
        vaultSelectedCount.textContent = `${selectedIds.size} selected`;
        if (isSelectMode) {
            vaultSelectActions.classList.remove('hidden');
            vaultSelectActions.classList.add('flex');
            vaultSelectModeBtn.classList.add('border-blue-500', 'text-blue-500');
        } else {
            vaultSelectActions.classList.add('hidden');
            vaultSelectActions.classList.remove('flex');
            vaultSelectModeBtn.classList.remove('border-blue-500', 'text-blue-500');
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // =============================================
    // PANEL OPEN / CLOSE
    // =============================================

    async function openVault() {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }

        vaultPanel.classList.remove('hidden');
        vaultPanel.classList.add('flex');
        vaultOverlay.classList.remove('hidden');
        void vaultPanel.offsetWidth;
        vaultPanel.classList.remove('animate-slideOutLeft');
        vaultPanel.classList.add('animate-slideInLeft');
        vaultOverlay.classList.remove('opacity-0');
        document.body.style.overflow = 'hidden';

        await loadVaultPhotos();
        renderVault();
    }

    function closeVault() {
        vaultPanel.classList.remove('animate-slideInLeft');
        vaultPanel.classList.add('animate-slideOutLeft');
        vaultOverlay.classList.add('opacity-0');

        setTimeout(() => {
            vaultPanel.classList.add('hidden');
            vaultPanel.classList.remove('flex');
            vaultOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 350);

        // Reset select mode
        isSelectMode = false;
        selectedIds.clear();
        updateSelectUI();
    }

    // =============================================
    // UPLOAD FLOW
    // =============================================

    function triggerUpload() {
        vaultFileInput.click();
    }

    async function handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            showToast('Please select image files (JPG, PNG, WebP).', 'warning');
            return;
        }

        // Show progress
        vaultUploadArea.classList.remove('hidden');
        let uploaded = 0;
        const total = imageFiles.length;

        for (const file of imageFiles) {
            vaultUploadStatus.textContent = `Uploading ${uploaded + 1}/${total}: ${file.name}`;
            const pct = Math.round((uploaded / total) * 100);
            vaultUploadPercent.textContent = `${pct}%`;
            vaultUploadBar.style.width = `${pct}%`;

            try {
                const photo = await uploadPhotoToVault(file);
                if (photo) {
                    vaultPhotos.unshift(photo);
                    saveToLocalStorage();
                }
            } catch (err) {
                console.error('Upload error for', file.name, err);
                showToast(`Failed to upload ${file.name}`, 'error');
            }
            uploaded++;
        }

        // Complete
        vaultUploadPercent.textContent = '100%';
        vaultUploadBar.style.width = '100%';
        vaultUploadStatus.textContent = `✅ ${uploaded} photo${uploaded !== 1 ? 's' : ''} uploaded!`;

        setTimeout(() => {
            vaultUploadArea.classList.add('hidden');
            vaultUploadBar.style.width = '0%';
        }, 2000);

        renderVault();
        showToast(`${uploaded} photo${uploaded !== 1 ? 's' : ''} added to your vault! 🎉`, 'success');
        vaultFileInput.value = '';
    }

    // =============================================
    // SELECT MODE & ACTIONS
    // =============================================

    function toggleSelectMode() {
        isSelectMode = !isSelectMode;
        if (!isSelectMode) selectedIds.clear();
        updateSelectUI();
        renderVault();
    }

    // Called from onclick in rendered HTML
    window.ByteLens._vaultCardClick = function (id) {
        if (isSelectMode) {
            if (selectedIds.has(id)) selectedIds.delete(id);
            else selectedIds.add(id);
            updateSelectUI();
            renderVault();
        }
    };

    async function deleteSelected() {
        if (selectedIds.size === 0) {
            showToast('No photos selected.', 'warning');
            return;
        }
        const count = selectedIds.size;
        for (const id of selectedIds) {
            await deleteVaultPhoto(id);
        }
        selectedIds.clear();
        updateSelectUI();
        renderVault();
        showToast(`${count} photo${count !== 1 ? 's' : ''} deleted. 🗑️`, 'info');
    }

    // =============================================
    // SELL FLOW
    // =============================================

    function openSellModal() {
        if (selectedIds.size === 0) {
            showToast('Select photos to sell first.', 'warning');
            return;
        }

        const selected = vaultPhotos.filter(p => selectedIds.has(p.id));
        vaultSellCount.textContent = `${selected.length} photo${selected.length !== 1 ? 's' : ''} selected`;

        // Render preview thumbnails
        vaultSellPreview.innerHTML = selected.map(p => `
            <img src="${p.url}" alt="${p.title}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-slate-200 dark:border-slate-600">
        `).join('');

        vaultSellTitle.value = selected.length === 1 ? (selected[0].title || '') : '';
        vaultSellPrice.value = '';

        showModal(vaultSellModal);
    }

    function closeSellModal() {
        hideModal(vaultSellModal);
    }

    async function confirmSell() {
        const price = parseInt(vaultSellPrice.value);
        const title = vaultSellTitle.value.trim();

        if (!price || price < 1000) {
            showToast('Please set a valid price (minimum Rp 1,000).', 'warning');
            return;
        }

        const selected = vaultPhotos.filter(p => selectedIds.has(p.id));

        for (const photo of selected) {
            const photoTitle = selected.length === 1 && title ? title : photo.title;
            await updatePhotoStatus(photo.id, 'selling', price, photoTitle);

            // Push to marketplace gallery (demoPhotos)
            const userName = window.ByteLens.currentUser?.name || window.ByteLens.currentUser?.email || 'Unknown';
            const marketplacePhoto = {
                id: photo.id,
                title: photoTitle || photo.original_name,
                author: `@${userName.replace(/\s+/g, '').toLowerCase()}`,
                price: price,
                filename: photo.filename,
                vault_url: photo.url,
            };
            window.ByteLens.demoPhotos.push(marketplacePhoto);
        }

        closeSellModal();
        selectedIds.clear();
        isSelectMode = false;
        updateSelectUI();
        renderVault();

        // Refresh main gallery
        if (window.ByteLens.initGallery) window.ByteLens.initGallery();

        showToast(`${selected.length} photo${selected.length !== 1 ? 's' : ''} published to marketplace! 🚀`, 'success');
    }

    // =============================================
    // EVENT LISTENERS
    // =============================================

    if (vaultNavBtn) vaultNavBtn.addEventListener('click', openVault);
    if (closeVaultBtn) closeVaultBtn.addEventListener('click', closeVault);
    if (vaultOverlay) vaultOverlay.addEventListener('click', closeVault);
    if (vaultUploadBtn) vaultUploadBtn.addEventListener('click', triggerUpload);
    if (vaultEmptyUploadBtn) vaultEmptyUploadBtn.addEventListener('click', triggerUpload);
    if (vaultFileInput) vaultFileInput.addEventListener('change', (e) => handleFileUpload(e.target.files));
    if (vaultSelectModeBtn) vaultSelectModeBtn.addEventListener('click', toggleSelectMode);
    if (vaultSellSelectedBtn) vaultSellSelectedBtn.addEventListener('click', openSellModal);
    if (vaultDeleteSelectedBtn) vaultDeleteSelectedBtn.addEventListener('click', deleteSelected);
    if (closeVaultSellModal) closeVaultSellModal.addEventListener('click', closeSellModal);
    if (cancelVaultSellBtn) cancelVaultSellBtn.addEventListener('click', closeSellModal);
    if (confirmVaultSellBtn) confirmVaultSellBtn.addEventListener('click', confirmSell);

    // Search
    if (vaultSearchInput) {
        vaultSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderVault();
        });
    }

    // Drag & drop on vault grid area
    const vaultScrollArea = vaultGrid?.parentElement;
    if (vaultScrollArea) {
        vaultScrollArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            vaultScrollArea.classList.add('ring-2', 'ring-blue-500', 'ring-inset');
        });
        vaultScrollArea.addEventListener('dragleave', () => {
            vaultScrollArea.classList.remove('ring-2', 'ring-blue-500', 'ring-inset');
        });
        vaultScrollArea.addEventListener('drop', (e) => {
            e.preventDefault();
            vaultScrollArea.classList.remove('ring-2', 'ring-blue-500', 'ring-inset');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) handleFileUpload(files);
        });
    }

    // =============================================
    // AUTH INTEGRATION
    // =============================================

    function showVaultButton() {
        if (vaultNavBtn) {
            vaultNavBtn.classList.remove('hidden');
            vaultNavBtn.classList.add('inline-flex');
        }
    }

    function hideVaultButton() {
        if (vaultNavBtn) {
            vaultNavBtn.classList.add('hidden');
            vaultNavBtn.classList.remove('inline-flex');
        }
    }

    // =============================================
    // EXPOSE
    // =============================================

    window.ByteLens.openVault = openVault;
    window.ByteLens.closeVault = closeVault;
    window.ByteLens.showVaultButton = showVaultButton;
    window.ByteLens.hideVaultButton = hideVaultButton;
    window.ByteLens.closeSellModal = closeSellModal;
})();
