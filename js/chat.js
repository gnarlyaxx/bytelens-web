// ============================================================
// ByteLens — Chat System
// ============================================================

(function () {
    const { showToast } = window.ByteLens;

    const chatPanel = document.getElementById('chatPanel');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatListView = document.getElementById('chatListView');
    const chatWindowView = document.getElementById('chatWindowView');
    const chatConversationList = document.getElementById('chatConversationList');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatBackBtn = document.getElementById('chatBackBtn');
    const chatRecipientName = document.getElementById('chatRecipientName');
    const chatHeaderTitle = document.getElementById('chatHeaderTitle');
    const chatNavBtn = document.getElementById('chatNavBtn');
    const chatBadge = document.getElementById('chatBadge');

    let conversations = {};
    let activeConversation = null;
    let isChatOpen = false;

    // --- Demo Auto-Reply Messages ---
    const autoReplies = [
        'Hi! Terima kasih sudah menghubungi saya 😊',
        'Foto tersebut masih available, silakan langsung order ya!',
        'Boleh, bisa saya bantu. Ada yang mau ditanyakan lagi?',
        'Terima kasih! Saya kirimkan file aslinya setelah pembayaran ya 📸',
        'Sip, noted! Saya follow up nanti ya 👍',
    ];

    // --- Load/Save from localStorage ---
    function loadConversations() {
        const stored = localStorage.getItem('bytelens-chats');
        if (stored) conversations = JSON.parse(stored);
    }

    function saveConversations() {
        localStorage.setItem('bytelens-chats', JSON.stringify(conversations));
    }

    // --- Get unread count ---
    function getUnreadCount() {
        let count = 0;
        Object.values(conversations).forEach((conv) => {
            conv.messages.forEach((msg) => {
                if (!msg.read && msg.senderId !== getCurrentUserId()) count++;
            });
        });
        return count;
    }

    function getCurrentUserId() {
        return window.ByteLens.currentUser?.email || 'me';
    }

    function updateBadge() {
        const count = getUnreadCount();
        if (chatBadge) {
            if (count > 0) {
                chatBadge.textContent = count > 9 ? '9+' : count;
                chatBadge.classList.remove('hidden');
            } else {
                chatBadge.classList.add('hidden');
            }
        }
    }

    // --- Open Chat Panel ---
    function openChatPanel() {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }
        loadConversations();
        isChatOpen = true;
        showChatList();

        chatPanel.classList.remove('hidden');
        chatOverlay.classList.remove('hidden');
        void chatPanel.offsetWidth;
        chatPanel.classList.add('animate-slideInRight');
        chatPanel.classList.remove('animate-slideOutRight');
        chatOverlay.classList.remove('opacity-0');
        document.body.style.overflow = 'hidden';
    }

    function closeChatPanel() {
        chatPanel.classList.remove('animate-slideInRight');
        chatPanel.classList.add('animate-slideOutRight');
        chatOverlay.classList.add('opacity-0');

        setTimeout(() => {
            chatPanel.classList.add('hidden');
            chatOverlay.classList.add('hidden');
            isChatOpen = false;
            activeConversation = null;
        }, 300);
        document.body.style.overflow = '';
    }

    // --- Open chat with specific user ---
    function openChat(userId) {
        if (!window.ByteLens.isLoggedIn) {
            window.ByteLens.openLoginWarning();
            return;
        }
        loadConversations();

        // Create conversation if it doesn't exist
        if (!conversations[userId]) {
            const profile = window.ByteLens.demoProfiles?.[userId];
            conversations[userId] = {
                recipientId: userId,
                recipientName: profile?.name || userId,
                messages: [],
                lastActivity: new Date().toISOString(),
            };
            saveConversations();
        }

        isChatOpen = true;
        chatPanel.classList.remove('hidden');
        chatOverlay.classList.remove('hidden');
        void chatPanel.offsetWidth;
        chatPanel.classList.add('animate-slideInRight');
        chatPanel.classList.remove('animate-slideOutRight');
        chatOverlay.classList.remove('opacity-0');
        document.body.style.overflow = 'hidden';

        openConversation(userId);
    }

    // --- Show Chat List ---
    function showChatList() {
        chatListView.classList.remove('hidden');
        chatWindowView.classList.add('hidden');
        activeConversation = null;
        chatBackBtn.classList.add('hidden');
        chatHeaderTitle.classList.remove('hidden');
        chatRecipientName.classList.add('hidden');
        renderConversationList();
    }

    function renderConversationList() {
        chatConversationList.innerHTML = '';

        const entries = Object.entries(conversations);
        if (entries.length === 0) {
            chatConversationList.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                    <div class="text-5xl mb-4">💬</div>
                    <p class="font-medium">No conversations yet</p>
                    <p class="text-sm mt-1">Start chatting from a seller's profile</p>
                </div>
            `;
            return;
        }

        // Sort by last activity
        entries.sort((a, b) => new Date(b[1].lastActivity) - new Date(a[1].lastActivity));

        entries.forEach(([id, conv]) => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const unread = conv.messages.filter((m) => !m.read && m.senderId !== getCurrentUserId()).length;
            const initial = (conv.recipientName || 'U').charAt(0).toUpperCase();
            const timeStr = lastMsg ? formatTime(lastMsg.timestamp) : '';

            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors';
            div.onclick = () => openConversation(id);
            div.innerHTML = `
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">${initial}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-sm truncate">${conv.recipientName}</span>
                        <span class="text-xs text-slate-400 flex-shrink-0">${timeStr}</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${lastMsg ? lastMsg.text : 'Start a conversation...'}</p>
                </div>
                ${unread > 0 ? `<span class="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">${unread}</span>` : ''}
            `;
            chatConversationList.appendChild(div);
        });
    }

    // --- Open Conversation ---
    function openConversation(userId) {
        activeConversation = userId;
        const conv = conversations[userId];
        if (!conv) return;

        // Mark messages as read
        conv.messages.forEach((m) => {
            if (m.senderId !== getCurrentUserId()) m.read = true;
        });
        saveConversations();
        updateBadge();

        chatListView.classList.add('hidden');
        chatWindowView.classList.remove('hidden');
        chatBackBtn.classList.remove('hidden');
        chatHeaderTitle.classList.add('hidden');
        chatRecipientName.classList.remove('hidden');
        chatRecipientName.textContent = conv.recipientName;

        renderMessages();
        chatInput.focus();
    }

    // --- Render Messages ---
    function renderMessages() {
        const conv = conversations[activeConversation];
        if (!conv) return;

        chatMessages.innerHTML = '';
        const myId = getCurrentUserId();

        if (conv.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-12">
                    <div class="text-4xl mb-3">👋</div>
                    <p class="text-sm">Say hello to ${conv.recipientName}!</p>
                </div>
            `;
            return;
        }

        conv.messages.forEach((msg) => {
            const isMine = msg.senderId === myId;
            const bubble = document.createElement('div');
            bubble.className = `flex ${isMine ? 'justify-end' : 'justify-start'} animate-messageIn`;
            bubble.innerHTML = `
                <div class="max-w-[80%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-blue-500 text-white rounded-br-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'}">
                    <p class="text-sm leading-relaxed">${escapeHtml(msg.text)}</p>
                    <p class="text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'} text-right">${formatTime(msg.timestamp)}</p>
                </div>
            `;
            chatMessages.appendChild(bubble);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Send Message ---
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !activeConversation) return;

        const conv = conversations[activeConversation];
        const msg = {
            id: Date.now().toString(),
            senderId: getCurrentUserId(),
            receiverId: activeConversation,
            text,
            timestamp: new Date().toISOString(),
            read: false,
        };

        conv.messages.push(msg);
        conv.lastActivity = msg.timestamp;
        saveConversations();

        chatInput.value = '';
        renderMessages();

        // Demo auto-reply after 1.5-3 seconds
        triggerAutoReply(activeConversation);
    }

    // --- Auto Reply (Demo) ---
    function triggerAutoReply(conversationId) {
        const delay = 1500 + Math.random() * 1500;

        // Show typing indicator
        setTimeout(() => {
            if (activeConversation === conversationId) {
                showTypingIndicator();
            }
        }, 800);

        setTimeout(() => {
            const conv = conversations[conversationId];
            if (!conv) return;

            removeTypingIndicator();

            const reply = {
                id: Date.now().toString(),
                senderId: conversationId,
                receiverId: getCurrentUserId(),
                text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
                timestamp: new Date().toISOString(),
                read: activeConversation === conversationId,
            };

            conv.messages.push(reply);
            conv.lastActivity = reply.timestamp;
            saveConversations();

            if (activeConversation === conversationId) {
                renderMessages();
            }
            updateBadge();
        }, delay);
    }

    function showTypingIndicator() {
        removeTypingIndicator();
        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'flex justify-start animate-messageIn';
        typing.innerHTML = `
            <div class="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 rounded-bl-md flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
                <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
                <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const existing = document.getElementById('typingIndicator');
        if (existing) existing.remove();
    }

    // --- Utilities ---
    function formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Event Listeners ---
    if (chatNavBtn) chatNavBtn.addEventListener('click', openChatPanel);
    if (closeChatBtn) closeChatBtn.addEventListener('click', closeChatPanel);
    if (chatOverlay) chatOverlay.addEventListener('click', closeChatPanel);
    if (chatBackBtn) chatBackBtn.addEventListener('click', showChatList);

    if (chatSendBtn) chatSendBtn.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Load badge on init
    loadConversations();
    updateBadge();

    // Expose
    window.ByteLens.openChat = openChat;
    window.ByteLens.openChatPanel = openChatPanel;
    window.ByteLens.closeChatPanel = closeChatPanel;
})();
