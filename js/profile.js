// ============================================================
// ByteLens — User Profile System
// ============================================================

(function () {
    const { showModal, hideModal, showToast } = window.ByteLens;

    const profileModal = document.getElementById('profileModal');
    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileBio = document.getElementById('profileBio');
    const profileEditBtn = document.getElementById('profileEditBtn');
    const profileChatBtn = document.getElementById('profileChatBtn');
    const profileSocialLinks = document.getElementById('profileSocialLinks');
    const profilePhotoGrid = document.getElementById('profilePhotoGrid');
    const profileEditForm = document.getElementById('profileEditForm');
    const profileViewMode = document.getElementById('profileViewMode');

    let currentProfileUser = null;
    let isEditing = false;

    // --- SVG Icons for social links ---
    const socialIcons = {
        instagram: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
        twitter: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        website: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9z"/></svg>',
        github: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
    };

    const socialLabels = {
        instagram: 'Instagram',
        twitter: 'X (Twitter)',
        website: 'Website / Portfolio',
        github: 'GitHub',
    };

    // --- Load Profile Data ---
    function getProfile(userId) {
        // Check localStorage first
        const stored = localStorage.getItem(`bytelens-profile-${userId}`);
        if (stored) return JSON.parse(stored);

        // Check demo profiles
        if (window.ByteLens.demoProfiles[userId]) {
            return { ...window.ByteLens.demoProfiles[userId] };
        }

        // Default profile for current user
        if (window.ByteLens.currentUser) {
            return {
                userId: window.ByteLens.currentUser.email,
                name: window.ByteLens.currentUser.name || 'User',
                email: window.ByteLens.currentUser.email || '',
                bio: '',
                socialLinks: { instagram: '', twitter: '', website: '', github: '' },
                createdAt: new Date().toISOString().split('T')[0],
            };
        }

        return null;
    }

    function saveProfile(profile) {
        localStorage.setItem(`bytelens-profile-${profile.userId}`, JSON.stringify(profile));
    }

    // --- Get User's Photos ---
    function getUserPhotos(userId) {
        return window.ByteLens.demoPhotos.filter((p) => p.author === userId);
    }

    // --- Check if viewing own profile ---
    function isOwnProfile(userId) {
        if (!window.ByteLens.isLoggedIn || !window.ByteLens.currentUser) return false;
        return userId === window.ByteLens.currentUser.email || userId === window.ByteLens.currentUser.name;
    }

    // --- Open Profile ---
    function openProfile(userId) {
        const profile = getProfile(userId);
        if (!profile) {
            showToast('Profile not found.', 'error');
            return;
        }

        currentProfileUser = profile;
        isEditing = false;

        // Set avatar
        const initial = (profile.name || 'U').charAt(0).toUpperCase();
        profileAvatar.textContent = initial;

        // Set name
        profileName.textContent = profile.name;

        // Set bio
        const bioDisplay = profileViewMode.querySelector('#profileBioText');
        if (bioDisplay) bioDisplay.textContent = profile.bio || 'No bio yet.';

        // Show/hide edit & chat buttons
        const ownProfile = isOwnProfile(userId);
        profileEditBtn.classList.toggle('hidden', !ownProfile);
        profileChatBtn.classList.toggle('hidden', ownProfile);

        // Render social links
        renderSocialLinks(profile.socialLinks);

        // Render mini photo grid
        renderPhotoGrid(userId);

        // Show view mode, hide edit form
        profileViewMode.classList.remove('hidden');
        profileEditForm.classList.add('hidden');

        showModal(profileModal);
    }

    function closeProfile() {
        hideModal(profileModal);
        isEditing = false;
    }

    // --- Render Social Links ---
    function renderSocialLinks(links) {
        profileSocialLinks.innerHTML = '';
        if (!links) return;

        const entries = Object.entries(links).filter(([, url]) => url && url.trim() !== '');
        if (entries.length === 0) {
            profileSocialLinks.innerHTML = '<p class="text-sm text-slate-400 dark:text-slate-500 italic">No social links added yet.</p>';
            return;
        }

        entries.forEach(([platform, url]) => {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'social-link-item flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-all';
            a.innerHTML = `
                <span class="flex-shrink-0 w-9 h-9 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm">${socialIcons[platform] || socialIcons.website}</span>
                <span class="font-medium text-sm">${socialLabels[platform] || platform}</span>
                <svg class="w-4 h-4 ml-auto opacity-40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            `;
            profileSocialLinks.appendChild(a);
        });
    }

    // --- Render Mini Photo Grid ---
    function renderPhotoGrid(userId) {
        const photos = getUserPhotos(userId);
        profilePhotoGrid.innerHTML = '';

        if (photos.length === 0) {
            profilePhotoGrid.innerHTML = '<p class="col-span-full text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">No photos uploaded yet.</p>';
            return;
        }

        photos.forEach((photo) => {
            const div = document.createElement('div');
            div.className = 'aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity';
            div.innerHTML = `<img src="assets/images/${photo.filename}" alt="${photo.title}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%231e293b%22 width=%22200%22 height=%22200%22/><text fill=%22%2394a3b8%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>'">`;
            profilePhotoGrid.appendChild(div);
        });
    }

    // --- Edit Profile Mode ---
    function enterEditMode() {
        if (!currentProfileUser) return;
        isEditing = true;

        profileViewMode.classList.add('hidden');
        profileEditForm.classList.remove('hidden');

        // Fill edit form
        document.getElementById('editBio').value = currentProfileUser.bio || '';
        document.getElementById('editInstagram').value = currentProfileUser.socialLinks?.instagram || '';
        document.getElementById('editTwitter').value = currentProfileUser.socialLinks?.twitter || '';
        document.getElementById('editWebsite').value = currentProfileUser.socialLinks?.website || '';
        document.getElementById('editGithub').value = currentProfileUser.socialLinks?.github || '';
    }

    function cancelEdit() {
        isEditing = false;
        profileViewMode.classList.remove('hidden');
        profileEditForm.classList.add('hidden');
    }

    function saveProfileEdits() {
        if (!currentProfileUser) return;

        currentProfileUser.bio = document.getElementById('editBio').value.trim();
        currentProfileUser.socialLinks = {
            instagram: document.getElementById('editInstagram').value.trim(),
            twitter: document.getElementById('editTwitter').value.trim(),
            website: document.getElementById('editWebsite').value.trim(),
            github: document.getElementById('editGithub').value.trim(),
        };

        saveProfile(currentProfileUser);

        // Update view mode
        const bioDisplay = profileViewMode.querySelector('#profileBioText');
        if (bioDisplay) bioDisplay.textContent = currentProfileUser.bio || 'No bio yet.';
        renderSocialLinks(currentProfileUser.socialLinks);

        cancelEdit();
        showToast('Profile updated successfully! ✨', 'success');
    }

    // --- Event Listeners ---
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfile);
    if (profileEditBtn) profileEditBtn.addEventListener('click', enterEditMode);

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveProfileEdits);

    // Chat button in profile → open chat with this user
    if (profileChatBtn) {
        profileChatBtn.addEventListener('click', () => {
            if (!window.ByteLens.isLoggedIn) {
                closeProfile();
                window.ByteLens.openLoginWarning();
                return;
            }
            const userId = currentProfileUser?.userId;
            if (userId && window.ByteLens.openChat) {
                closeProfile();
                setTimeout(() => window.ByteLens.openChat(userId), 350);
            }
        });
    }

    // Avatar in navbar → open own profile
    const navAvatar = document.querySelector('.avatar-btn');
    if (navAvatar) {
        navAvatar.addEventListener('click', () => {
            if (window.ByteLens.isLoggedIn && window.ByteLens.currentUser) {
                openProfile(window.ByteLens.currentUser.email);
            }
        });
    }

    // Expose
    window.ByteLens.openProfile = openProfile;
    window.ByteLens.closeProfile = closeProfile;
})();
