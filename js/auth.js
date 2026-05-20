// ============================================================
// ByteLens — Authentication System
// ============================================================

(function () {
    const { showModal, hideModal, showToast } = window.ByteLens;

    // --- Auth State & Elements ---
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const btnLogout = document.getElementById('btnLogout');
    const btnSignUp = document.getElementById('btnSignUp');
    const btnLogin = document.getElementById('btnLogin');

    // Auth Modal Elements
    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const nameFieldGroup = document.getElementById('nameFieldGroup');
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');
    const authToggleText = document.getElementById('authToggleText');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authName = document.getElementById('authName');

    let isLoginMode = true;

    function openAuthModal(mode) {
        isLoginMode = mode === 'login';
        updateAuthModalUI();
        showModal(authModal);
    }

    function closeAuth() {
        hideModal(authModal);
        if (authForm) authForm.reset();
    }

    function updateAuthModalUI() {
        if (isLoginMode) {
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Please enter your details to log in.';
            nameFieldGroup.classList.add('hidden');
            btnSubmitAuth.textContent = 'Log In';
            authToggleText.textContent = "Don't have an account?";
            toggleAuthMode.textContent = 'Sign Up';
        } else {
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Sign up to start sharing your photos.';
            nameFieldGroup.classList.remove('hidden');
            btnSubmitAuth.textContent = 'Sign Up';
            authToggleText.textContent = 'Already have an account?';
            toggleAuthMode.textContent = 'Log In';
        }
    }

    function updateUIForAuthState() {
        if (window.ByteLens.isLoggedIn) {
            authButtons.classList.add('hidden');
            authButtons.classList.remove('flex');
            userProfile.classList.remove('hidden');
            userProfile.classList.add('flex');

            // Update avatar initial
            const avatar = userProfile.querySelector('.avatar-btn');
            if (avatar && window.ByteLens.currentUser) {
                const initial = (window.ByteLens.currentUser.name || window.ByteLens.currentUser.email || 'U').charAt(0).toUpperCase();
                avatar.textContent = initial;
            }

            // Show vault button
            if (window.ByteLens.showVaultButton) window.ByteLens.showVaultButton();
        } else {
            authButtons.classList.remove('hidden');
            authButtons.classList.add('flex');
            userProfile.classList.add('hidden');
            userProfile.classList.remove('flex');

            // Hide vault button
            if (window.ByteLens.hideVaultButton) window.ByteLens.hideVaultButton();
        }
    }

    toggleAuthMode.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateAuthModalUI();
    });

    btnLogin.addEventListener('click', () => openAuthModal('login'));
    btnSignUp.addEventListener('click', () => openAuthModal('signup'));
    closeAuthModalBtn.addEventListener('click', closeAuth);

    // Auth Form Submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value.trim();
        const name = authName ? authName.value.trim() : '';

        if (!email || !password) {
            showToast('Please fill in all required fields.', 'warning');
            return;
        }

        btnSubmitAuth.disabled = true;
        btnSubmitAuth.textContent = isLoginMode ? 'Logging in...' : 'Signing up...';

        try {
            const supabaseClient = window.ByteLens.supabaseClient;

            if (supabaseClient) {
                if (isLoginMode) {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    window.ByteLens.currentUser = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.full_name || email };
                } else {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: { data: { full_name: name } },
                    });
                    if (error) throw error;
                    window.ByteLens.currentUser = { id: data.user.id, email: data.user.email, name: name || email };
                    showToast('Account created! Check your email for confirmation.', 'info');
                }
            } else {
                // Demo mode: simulate auth
                window.ByteLens.currentUser = { email, name: name || email.split('@')[0] };
            }

            window.ByteLens.isLoggedIn = true;
            updateUIForAuthState();
            closeAuth();
            showToast(isLoginMode ? 'Welcome back!' : 'Account created successfully!', 'success');
        } catch (err) {
            console.error('Auth error:', err);
            showToast(err.message || 'Authentication failed. Please try again.', 'error');
        } finally {
            btnSubmitAuth.disabled = false;
            btnSubmitAuth.textContent = isLoginMode ? 'Log In' : 'Sign Up';
        }
    });

    // Logout
    btnLogout.addEventListener('click', async () => {
        try {
            const supabaseClient = window.ByteLens.supabaseClient;
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
        } catch (err) {
            console.warn('Logout error:', err);
        }
        window.ByteLens.isLoggedIn = false;
        window.ByteLens.currentUser = null;
        updateUIForAuthState();
        showToast('Logged out successfully.', 'info');
    });

    // Check existing Supabase session on load
    async function checkExistingSession() {
        const supabaseClient = window.ByteLens.supabaseClient;
        if (!supabaseClient) return;
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.user) {
                window.ByteLens.isLoggedIn = true;
                window.ByteLens.currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email,
                };
                updateUIForAuthState();
            }
        } catch (err) {
            console.warn('Session check failed:', err);
        }
    }

    // --- Login Warning Modal ---
    const loginWarningModal = document.getElementById('loginWarningModal');
    const closeWarningBtn = document.getElementById('closeWarningBtn');
    const btnSignInFromWarning = document.getElementById('btnSignInFromWarning');

    function openLoginWarning() {
        showModal(loginWarningModal);
    }

    function closeLoginWarning() {
        hideModal(loginWarningModal);
    }

    closeWarningBtn.addEventListener('click', closeLoginWarning);
    btnSignInFromWarning.addEventListener('click', () => {
        closeLoginWarning();
        setTimeout(() => openAuthModal('login'), 350);
    });

    // Expose functions
    window.ByteLens.openAuthModal = openAuthModal;
    window.ByteLens.closeAuth = closeAuth;
    window.ByteLens.openLoginWarning = openLoginWarning;
    window.ByteLens.closeLoginWarning = closeLoginWarning;
    window.ByteLens.checkExistingSession = checkExistingSession;
    window.ByteLens.updateUIForAuthState = updateUIForAuthState;
})();
