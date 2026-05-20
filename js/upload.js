// ============================================================
// ByteLens — Upload & Service Modals
// ============================================================

(function () {
    const { showModal, hideModal, showToast } = window.ByteLens;

    // --- Upload Modal ---
    const uploadModal = document.getElementById('uploadModal');
    const btnUpload = document.getElementById('btnUpload');
    const closeUploadModalBtn = document.getElementById('closeUploadModal');
    const closeUploadBtn = document.getElementById('closeUploadBtn');

    function openUploadModal() {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }
        showModal(uploadModal);
    }

    function closeUploadModal() {
        hideModal(uploadModal);
    }

    btnUpload.addEventListener('click', openUploadModal);
    closeUploadModalBtn.addEventListener('click', closeUploadModal);
    closeUploadBtn.addEventListener('click', closeUploadModal);

    // --- Service Upload Modal ---
    const serviceUploadModal = document.getElementById('serviceUploadModal');
    const btnOfferService = document.getElementById('btnOfferService');
    const closeServiceModalBtn = document.getElementById('closeServiceModal');
    const closeServiceBtn = document.getElementById('closeServiceBtn');

    function openServiceModal() {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }
        showModal(serviceUploadModal);
    }

    function closeServiceModal() {
        hideModal(serviceUploadModal);
    }

    btnOfferService.addEventListener('click', openServiceModal);
    closeServiceModalBtn.addEventListener('click', closeServiceModal);
    closeServiceBtn.addEventListener('click', closeServiceModal);

    // --- Service Type Tabs ---
    const serviceTypeTabs = document.querySelectorAll('.service-type-tab');
    serviceTypeTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
            serviceTypeTabs.forEach((t) => {
                t.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20', 'text-purple-600', 'dark:text-purple-400');
                t.classList.add('border-slate-200', 'dark:border-slate-700', 'text-slate-500', 'dark:text-slate-400');
            });
            e.target.classList.remove('border-slate-200', 'dark:border-slate-700', 'text-slate-500', 'dark:text-slate-400');
            e.target.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20', 'text-purple-600', 'dark:text-purple-400');
        });
    });

    // --- Upload Tabs ---
    const uploadTabs = document.querySelectorAll('.upload-tab');
    const batchTitleHint = document.getElementById('batchTitleHint');

    uploadTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
            uploadTabs.forEach((t) => {
                t.classList.remove('opacity-100', 'border-blue-500');
                t.classList.add('opacity-50', 'border-transparent');
            });
            e.target.classList.remove('opacity-50', 'border-transparent');
            e.target.classList.add('opacity-100', 'border-blue-500');

            const target = e.target.getAttribute('data-target');
            if (target === 'batch') {
                batchTitleHint.classList.remove('hidden');
            } else {
                batchTitleHint.classList.add('hidden');
            }
        });
    });

    // --- Upload Form File Input ---
    const dropZone = uploadModal?.querySelector('.border-dashed');
    if (dropZone) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        fileInput.id = 'uploadFileInput';
        dropZone.appendChild(fileInput);

        let selectedFiles = [];

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length > 0) {
                const names = selectedFiles.map((f) => f.name).join(', ');
                dropZone.innerHTML = `
                    <div class="text-4xl mb-3">✅</div>
                    <p class="font-medium text-green-500">${selectedFiles.length} file(s) selected</p>
                    <p class="text-sm text-slate-400 mt-2 truncate max-w-full">${names}</p>
                    <p class="text-xs text-blue-400 mt-3 cursor-pointer hover:underline">Click to change</p>
                `;
                dropZone.appendChild(fileInput);
            }
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-slate-700/50');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-slate-700/50');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-slate-700/50');
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length > 0) {
                selectedFiles = files;
                const names = files.map((f) => f.name).join(', ');
                dropZone.innerHTML = `
                    <div class="text-4xl mb-3">✅</div>
                    <p class="font-medium text-green-500">${files.length} file(s) selected</p>
                    <p class="text-sm text-slate-400 mt-2 truncate max-w-full">${names}</p>
                    <p class="text-xs text-blue-400 mt-3 cursor-pointer hover:underline">Click to change</p>
                `;
                dropZone.appendChild(fileInput);
            }
        });

        // Upload & Publish button
        const uploadPublishBtn = uploadModal.querySelector('.flex.justify-end .bg-blue-500');
        if (uploadPublishBtn) {
            uploadPublishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (selectedFiles.length === 0) {
                    showToast('Please select at least one photo to upload.', 'warning');
                    return;
                }
                showToast('Photos uploaded successfully! 🎉', 'success');
                closeUploadModal();
                selectedFiles = [];
                dropZone.innerHTML = `
                    <div class="text-4xl mb-3">📁</div>
                    <p class="font-medium">Drag and drop your photos here, or click to browse</p>
                    <p class="text-sm text-slate-400 mt-2">Supports High-Res JPG, PNG (Max 50MB)</p>
                `;
                dropZone.appendChild(fileInput);
            });
        }
    }

    // --- Publish Service button ---
    const publishServiceBtn = serviceUploadModal?.querySelector('.bg-gradient-to-r.from-purple-500');
    if (publishServiceBtn) {
        publishServiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Service published successfully! 🎉', 'success');
            closeServiceModal();
        });
    }

    // Expose functions
    window.ByteLens.closeUploadModal = closeUploadModal;
    window.ByteLens.closeServiceModal = closeServiceModal;
})();
