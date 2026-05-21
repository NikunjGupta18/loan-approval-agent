const API_BASE = 'http://localhost:8800';
let currentSessionId = null;
let currentAgentId = null;
let lastOffset = 0;
let isPolling = false;
let activePollingSessionId = null;
let activeSessionHasCustomerMessages = false;

// Helper to extract message text from Parlant events safely and robustly
function getEventMessageText(event) {
    if (event.message && typeof event.message === 'string') {
        return event.message;
    }
    if (event.data && typeof event.data === 'string') {
        return event.data;
    }
    if (event.data && typeof event.data === 'object') {
        if (typeof event.data.message === 'string') {
            return event.data.message;
        }
        if (event.data.message && typeof event.data.message === 'object') {
            if (typeof event.data.message.text === 'string') {
                return event.data.message.text;
            }
        }
    }
    if (event.message && typeof event.message === 'object') {
        if (typeof event.message.text === 'string') {
            return event.message.text;
        }
    }
    return '';
}

// DOM Elements
const chatBox = document.getElementById('chat-box');
const messagesContainer = document.getElementById('messages-container');
const welcomeScreen = document.getElementById('welcome-screen');
const typingIndicator = document.getElementById('typing-indicator');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const chatTitleHeader = document.getElementById('chat-title-header');
const chatStatusHeader = document.getElementById('chat-status-header');
const deleteCurrentChatBtn = document.getElementById('delete-current-chat-btn');

// Sidebar DOM Elements
const sidebar = document.getElementById('sidebar');
const sessionList = document.getElementById('session-list');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const newChatSidebarBtn = document.getElementById('new-chat-sidebar-btn');

// Mobile Sidebar Toggles
if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.add('open'));
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// Initialize
async function init() {
    try {
        await fetchAgent();
        await fetchSessions();
        
        // Check if there are existing sessions, if so load the most recent one
        const res = await fetch(`${API_BASE}/sessions`);
        let hasSessions = false;
        if (res.ok) {
            const sessions = await res.json();
            if (sessions && sessions.length > 0) {
                hasSessions = true;
                // Sort sessions newest first and load the latest
                sessions.sort((a, b) => new Date(b.creation_utc) - new Date(a.creation_utc));
                await loadSession(sessions[0].id);
            }
        }
        
        // If there were no sessions at all, create a new one
        if (!hasSessions) {
            await createSession();
        }
        
        // Connect the dynamic header delete button
        if (deleteCurrentChatBtn) {
            deleteCurrentChatBtn.addEventListener('click', () => {
                if (!currentSessionId) return;
                const currentTitle = chatTitleHeader ? chatTitleHeader.textContent : "this chat";
                deleteSession(currentSessionId, currentTitle);
            });
        }
    } catch (error) {
        console.error("Initialization error:", error);
        addMessage('System', 'Failed to connect to the agent server. Please make sure the server is running on port 8800.', 'agent');
    }
}

// Fetch all sessions to populate the sidebar
async function fetchSessions() {
    try {
        const res = await fetch(`${API_BASE}/sessions`);
        if (!res.ok) return;
        const sessions = await res.json();
        
        sessionList.innerHTML = '';
        
        // Sort sessions newest first
        sessions.sort((a, b) => new Date(b.creation_utc) - new Date(a.creation_utc));
        
        sessions.forEach(session => {
            // Use custom human default title instead of raw timestamp
            const date = new Date(session.creation_utc);
            const formattedDate = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
            const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            const displayTitle = session.title || `Chat (${formattedDate}, ${formattedTime})`;
            
            const item = document.createElement('div');
            item.className = 'session-item';
            item.setAttribute('data-id', session.id);
            item.innerHTML = `
                <svg class="session-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="session-title">${displayTitle}</span>
                <div class="session-actions">
                    <button class="session-action-btn rename" title="Rename Chat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="session-action-btn delete" title="Delete Chat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;
            
            // Clicking on the rename button triggers inline editing
            const renameBtn = item.querySelector('.session-action-btn.rename');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent loading session
                startEditingSessionTitle(session.id, displayTitle, item);
            });
            
            // Clicking on the delete button triggers deletion
            const deleteBtn = item.querySelector('.session-action-btn.delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent loading session
                deleteSession(session.id, displayTitle);
            });
            
            // Clicking on the item loads the session (only if not editing)
            item.addEventListener('click', (e) => {
                if (item.classList.contains('editing')) return;
                loadSession(session.id);
            });
            
            sessionList.appendChild(item);
        });
        
        updateSidebarActiveState();
    } catch (e) {
        console.error("Failed to fetch sessions", e);
    }
}

// Inline session title editor
function startEditingSessionTitle(sessionId, currentTitle, item) {
    if (item.classList.contains('editing')) return;
    
    item.classList.add('editing');
    
    const titleSpan = item.querySelector('.session-title');
    const actionsDiv = item.querySelector('.session-actions');
    
    // Hide actions while editing
    actionsDiv.style.display = 'none';
    
    // Replace titleSpan with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'session-title-input';
    input.value = currentTitle;
    
    titleSpan.replaceWith(input);
    input.focus();
    input.select();
    
    // Prevent typing or clicking input from triggering session load or bubble events
    input.addEventListener('click', (e) => e.stopPropagation());
    
    const finishEditing = async (save) => {
        item.classList.remove('editing');
        actionsDiv.style.display = ''; // Restore actions hover behavior
        
        const newTitle = input.value.trim();
        
        if (save && newTitle && newTitle !== currentTitle) {
            // Save to Parlant Server
            try {
                const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newTitle
                    })
                });
                
                if (res.ok) {
                    // Update header title immediately if this is the active session
                    if (sessionId === currentSessionId && chatTitleHeader) {
                        chatTitleHeader.textContent = newTitle;
                    }
                    // Successfully updated! Re-render the sidebar
                    await fetchSessions();
                } else {
                    console.error("Failed to update session title");
                    input.replaceWith(titleSpan);
                }
            } catch (err) {
                console.error("Error patching session title:", err);
                input.replaceWith(titleSpan);
            }
        } else {
            // Cancel or no change
            input.replaceWith(titleSpan);
        }
    };
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finishEditing(false);
        }
    });
    
    input.addEventListener('blur', () => {
        // Delay slightly to allow a potential click event to register first if needed
        setTimeout(() => {
            if (document.body.contains(input)) {
                finishEditing(true);
            }
        }, 100);
    });
}

// Delete a session
async function deleteSession(sessionId, title) {
    const confirmed = confirm(`Are you sure you want to delete the chat "${title}"?`);
    if (!confirmed) return;
    
    try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            // If the deleted session was the current one, switch or create new
            if (sessionId === currentSessionId) {
                currentSessionId = null;
                messagesContainer.innerHTML = '';
                welcomeScreen.style.display = 'block';
                hideTypingIndicator();
                
                // Clear the header
                if (chatTitleHeader) chatTitleHeader.textContent = "Loan Approval Agent";
                if (chatStatusHeader) chatStatusHeader.textContent = "AI Assistant";
                
                const listRes = await fetch(`${API_BASE}/sessions`);
                if (listRes.ok) {
                    const sessions = await listRes.json();
                    if (sessions.length > 0) {
                        sessions.sort((a, b) => new Date(b.creation_utc) - new Date(a.creation_utc));
                        await loadSession(sessions[0].id);
                    } else {
                        await createSession();
                    }
                } else {
                    await createSession();
                }
            } else {
                await fetchSessions();
            }
        } else {
            console.error("Failed to delete session");
            alert("Failed to delete the chat. Please try again.");
        }
    } catch (err) {
        console.error("Error deleting session:", err);
        alert("An error occurred while deleting the chat.");
    }
}

// Auto-rename session to first message if it's currently untitled
async function autoRenameSessionIfNeeded(firstMessageText) {
    if (!currentSessionId) return;
    
    try {
        const res = await fetch(`${API_BASE}/sessions/${currentSessionId}`);
        if (!res.ok) return;
        const session = await res.json();
        
        // If title is null, empty or default, we rename it
        if (!session.title || session.title.startsWith('New Chat') || session.title.startsWith('Chat')) {
            let newTitle = firstMessageText.trim();
            if (newTitle.length > 30) {
                newTitle = newTitle.substring(0, 27) + '...';
            }
            newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1);
            
            const patchRes = await fetch(`${API_BASE}/sessions/${currentSessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle
                })
            });
            
            if (patchRes.ok) {
                // Update header title as well
                if (chatTitleHeader) chatTitleHeader.textContent = newTitle;
                await fetchSessions();
            }
        }
    } catch (err) {
        console.error("Failed to auto-rename session:", err);
    }
}

// Update the active state in the sidebar
function updateSidebarActiveState() {
    document.querySelectorAll('.session-item').forEach(el => {
        if (el.getAttribute('data-id') === currentSessionId) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Load a specific session's history
async function loadSession(sessionId) {
    if (sessionId === currentSessionId) return;
    
    currentSessionId = sessionId;
    lastOffset = 0;
    activeSessionHasCustomerMessages = false;
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'none';
    hideTypingIndicator();
    updateSidebarActiveState();
    sidebar.classList.remove('open'); // Close sidebar on mobile
    
    // Update the dynamic header details
    try {
        const sessionRes = await fetch(`${API_BASE}/sessions/${sessionId}`);
        if (sessionRes.ok) {
            const session = await sessionRes.json();
            const date = new Date(session.creation_utc);
            const formattedDate = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
            const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            const displayTitle = session.title || `Chat (${formattedDate}, ${formattedTime})`;
            
            if (chatTitleHeader) chatTitleHeader.textContent = displayTitle;
            if (chatStatusHeader) chatStatusHeader.innerHTML = `Loan Approval Agent &bull; AI Assistant`;
        }
    } catch (err) {
        console.error("Failed to load session details in header", err);
    }
    
    try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/events`);
        if (res.ok) {
            const events = await res.json();
            for (const event of events) {
                if (event.offset >= lastOffset) {
                    lastOffset = event.offset + 1;
                }
                
                if (event.kind === 'message') {
                    const msgText = getEventMessageText(event);
                    if (event.source === 'customer') {
                        addMessage('You', msgText, 'customer');
                        activeSessionHasCustomerMessages = true;
                    } else if (event.source === 'ai_agent') {
                        if (msgText) addOrUpdateAgentMessage(event.id, msgText);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to load session events:", error);
    }
    
    startPolling();
}

// Get the agent ID
async function fetchAgent() {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error("Failed to fetch agents");
    const agents = await res.json();
    if (agents && agents.length > 0) {
        currentAgentId = agents[0].id;
    } else {
        throw new Error("No agents found");
    }
}

// Create a new session
async function createSession() {
    if (!currentAgentId) throw new Error("Agent ID not set");
    
    // Clear UI
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'block';
    
    // Reset header to loading/initial state
    if (chatTitleHeader) chatTitleHeader.textContent = "New Chat";
    if (chatStatusHeader) chatStatusHeader.textContent = "AI Assistant";
    
    const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_id: currentAgentId,
            allow_greeting: true
        })
    });
    
    if (!res.ok) throw new Error("Failed to create session");
    const session = await res.json();
    currentSessionId = session.id;
    lastOffset = 0;
    activeSessionHasCustomerMessages = false;
    
    // Set dynamic header details for the newly created session
    const date = new Date(session.creation_utc);
    const formattedDate = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
    const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const displayTitle = session.title || `Chat (${formattedDate}, ${formattedTime})`;
    
    if (chatTitleHeader) chatTitleHeader.textContent = displayTitle;
    if (chatStatusHeader) chatStatusHeader.innerHTML = `Loan Approval Agent &bull; AI Assistant`;
    
    await fetchSessions(); // Refresh sidebar to show new session
    updateSidebarActiveState();
    sidebar.classList.remove('open'); // Close sidebar on mobile
    
    // Start polling for events
    startPolling();
}

// Input handling
messageInput.addEventListener('input', () => {
    sendBtn.disabled = messageInput.value.trim().length === 0;
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Auto-create a session first if there is no active session (e.g. all chats were deleted)
    if (!currentSessionId) {
        try {
            await createSession();
        } catch (err) {
            console.error("Failed to auto-create session on submit:", err);
            addMessage('System', 'Failed to start a new chat session.', 'agent');
            return;
        }
    }
    
    if (!currentSessionId) return;
    
    messageInput.value = '';
    sendBtn.disabled = true;
    welcomeScreen.style.display = 'none';
    
    // Add to UI immediately
    addMessage('You', text, 'customer');
    activeSessionHasCustomerMessages = true;
    showTypingIndicator();
    
    // Send to API
    try {
        await fetch(`${API_BASE}/sessions/${currentSessionId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kind: 'message',
                source: 'customer',
                message: text
            })
        });
        
        // Auto-rename the session based on first customer message if it is currently untitled
        autoRenameSessionIfNeeded(text);
    } catch (error) {
        console.error("Failed to send message:", error);
        hideTypingIndicator();
        addMessage('System', 'Failed to send message.', 'agent');
    }
});

function sendQuickAction(text) {
    messageInput.value = text;
    sendBtn.disabled = false;
    chatForm.dispatchEvent(new Event('submit'));
}

// Start polling for a session and ensure only one loop is active for it
function startPolling() {
    if (!currentSessionId) return;
    if (activePollingSessionId === currentSessionId) return;
    
    activePollingSessionId = currentSessionId;
    isPolling = true;
    pollEvents(currentSessionId);
}

// Polling for events of a specific session
async function pollEvents(sessionId) {
    if (sessionId !== currentSessionId || !isPolling) {
        if (activePollingSessionId === sessionId) {
            activePollingSessionId = null;
        }
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/events?min_offset=${lastOffset}&wait_for_data=60`);
        
        // If session changed while we were waiting, gracefully exit this loop
        if (sessionId !== currentSessionId) return;
        
        if (res.ok) {
            const events = await res.json();
            
            for (const event of events) {
                if (event.offset >= lastOffset) {
                    lastOffset = event.offset + 1;
                }
                
                // Hide welcome screen if any event happens
                welcomeScreen.style.display = 'none';
                
                if (event.kind === 'status' && event.source === 'ai_agent') {
                    if (event.data && event.data.status === 'typing') {
                        showTypingIndicator();
                    } else {
                        hideTypingIndicator();
                    }
                }
                
                if (event.kind === 'message') {
                    if (event.source === 'customer') {
                        activeSessionHasCustomerMessages = true;
                    } else if (event.source === 'ai_agent') {
                        hideTypingIndicator();
                        const msgText = getEventMessageText(event);
                        if (msgText) {
                            addOrUpdateAgentMessage(event.id, msgText);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Polling error:", error);
        // Wait a bit before retrying on error
        await new Promise(r => setTimeout(r, 2000));
    }
    
    // Continue polling for this specific session if it is still active
    if (isPolling && sessionId === currentSessionId) {
        pollEvents(sessionId);
    } else {
        if (activePollingSessionId === sessionId) {
            activePollingSessionId = null;
        }
    }
}

// UI Rendering
function addMessage(sender, text, type) {
    const row = document.createElement('div');
    row.className = `message-row ${type}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (type === 'agent') {
        // Parse markdown for agent messages
        bubble.innerHTML = marked.parse(text);
        // Use event ID or similar if we want to update later, but simple append works for now
        bubble.setAttribute('data-msg-id', Date.now()); 
    } else {
        bubble.textContent = text;
    }
    
    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    scrollToBottom();
}

function addOrUpdateAgentMessage(eventId, text) {
    // Basic implementation: just append. 
    // If Parlant sends incremental updates for the same event ID, we'd find and update it.
    // For this simple implementation, assuming it sends the complete message or we just append.
    let existingRow = document.querySelector(`[data-event-id="${eventId}"]`);
    
    if (existingRow) {
        existingRow.innerHTML = marked.parse(text);
    } else {
        const row = document.createElement('div');
        row.className = `message-row agent`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.setAttribute('data-event-id', eventId);
        bubble.innerHTML = marked.parse(text);
        
        row.appendChild(bubble);
        messagesContainer.appendChild(row);
    }
    scrollToBottom();
}

function showTypingIndicator() {
    typingIndicator.classList.remove('hidden');
    messagesContainer.appendChild(typingIndicator); // Move to bottom
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleNewChatRequest() {
    if (currentSessionId && !activeSessionHasCustomerMessages) {
        if (messageInput) {
            messageInput.focus();
        }
        return;
    }
    createSession();
}

newChatBtn.addEventListener('click', handleNewChatRequest);

if (newChatSidebarBtn) {
    newChatSidebarBtn.addEventListener('click', handleNewChatRequest);
}

// Start
init();
