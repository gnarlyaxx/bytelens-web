// ============================================================
// ByteLens — Gallery & Photo Detail Modal
// ============================================================

(function () {
    const { showModal, hideModal, showToast } = window.ByteLens;

    const galleryGrid = document.getElementById('galleryGrid');
    const photoModal = document.getElementById('photoModal');
    const closePhotoModalBtn = document.getElementById('closePhotoModal');
    const photoDetailImg = document.getElementById('photoDetailImg');
    const photoWatermark = document.getElementById('photoWatermark');
    const photoTitle = document.getElementById('photoTitle');
    const photoAuthor = document.getElementById('photoAuthor');
    const photoPrice = document.getElementById('photoPrice');

    // --- Gallery Initialization ---
    async function initGallery() {
        try {
            let photos = null;
            const supabaseClient = window.ByteLens.supabaseClient;

            // Try fetching from Supabase first
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('photos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    photos = data;
                    console.log(`Loaded ${data.length} photos from Supabase.`);
                } else if (error) {
                    console.warn('Supabase query failed:', error.message);
                }
            }

            // Fallback to demo data
            if (!photos || photos.length === 0) {
                console.log('Using demo gallery data.');
                photos = window.ByteLens.demoPhotos;
            }

            galleryGrid.innerHTML = '';

            photos.forEach((photo, index) => {
                const card = document.createElement('div');
                card.className =
                    'relative rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 aspect-[4/5] group';
                card.style.animationDelay = `${index * 80}ms`;
                card.classList.add('animate-fadeInUp');
                card.onclick = () => openPhotoModal(photo);

                const imgSrc = photo.vault_url || `assets/images/${photo.filename}`;

                card.innerHTML = `
                    <img src="${imgSrc}" alt="${photo.title}"
                         class="w-full h-full object-cover blur-sm group-hover:blur-none transition-all duration-500 group-hover:scale-105"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 500%22><rect fill=%22%231e293b%22 width=%22400%22 height=%22500%22/><text fill=%22%2394a3b8%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2220%22>Image Not Found</text></svg>'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 class="text-white font-bold text-lg truncate">${photo.title}</h3>
                        <p class="text-white/70 text-sm cursor-pointer hover:text-blue-300 transition-colors" onclick="event.stopPropagation(); window.ByteLens.openProfile('${photo.author}')">${photo.author}</p>
                        <p class="text-blue-300 font-bold mt-1">Rp ${new Intl.NumberFormat('id-ID').format(photo.price)}</p>
                    </div>
                `;

                galleryGrid.appendChild(card);
            });
        } catch (err) {
            console.error('Gallery initialization error:', err);
            galleryGrid.innerHTML =
                '<p class="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">Gagal memuat galeri. Silakan refresh halaman.</p>';
        }
    }

    // --- Photo Detail Modal ---
    function openPhotoModal(photo) {
        currentPhoto = photo;
        const imgSrc = photo.vault_url || `assets/images/${photo.filename}`;
        photoDetailImg.src = imgSrc;
        photoDetailImg.onerror = function () {
            this.src =
                'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22><rect fill=%22%231e293b%22 width=%22800%22 height=%22600%22/><text fill=%22%2394a3b8%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22>Image Not Found</text></svg>';
        };

        photoWatermark.innerHTML = Array(15)
            .fill(
                `<span class="opacity-20 uppercase font-black text-6xl tracking-widest block rotate-[-30deg] whitespace-nowrap drop-shadow-lg mb-8">${photo.author} &nbsp; ${photo.author} &nbsp; ${photo.author}</span>`
            )
            .join('');

        photoTitle.textContent = photo.title;
        photoAuthor.textContent = photo.author;
        photoPrice.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(photo.price)}`;

        // Make author clickable in photo modal
        photoAuthor.classList.add('cursor-pointer', 'hover:text-blue-400', 'transition-colors');
        photoAuthor.onclick = () => {
            closePhotoModal();
            setTimeout(() => window.ByteLens.openProfile(photo.author), 350);
        };

        showModal(photoModal);
    }

    function closePhotoModal() {
        hideModal(photoModal);
    }

    closePhotoModalBtn.addEventListener('click', closePhotoModal);

    // --- Purchase Button ---
    let currentPhoto = null; // Track which photo is open
    const purchaseBtn = photoModal?.querySelector('.bg-blue-500');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
            if (!window.ByteLens.isLoggedIn) {
                closePhotoModal();
                window.ByteLens.openLoginWarning();
                return;
            }
            if (currentPhoto && window.ByteLens.purchasePhoto) {
                window.ByteLens.purchasePhoto(currentPhoto);
            }
        });
    }

    // Expose functions
    window.ByteLens.initGallery = initGallery;
    window.ByteLens.closePhotoModal = closePhotoModal;
})();
