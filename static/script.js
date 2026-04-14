// Get elements
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const emptyState = document.getElementById('emptyState');
const errorMessage = document.getElementById('errorMessage');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// Event listeners
searchBtn.addEventListener('click', startResearch);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startResearch();
    }
});
tabButtons.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
});

function activateTab(tabName) {
    tabPanels.forEach((panel) => {
        panel.classList.add('hidden');
    });

    tabButtons.forEach((button) => {
        button.classList.remove('border-cyan-400/30', 'bg-cyan-400/10', 'text-cyan-200');
        button.classList.add('border-slate-700', 'bg-slate-950/60', 'text-slate-300');
    });

    const activePanel = document.getElementById(`panel-${tabName}`);
    const activeButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);

    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    if (activeButton) {
        activeButton.classList.remove('border-slate-700', 'bg-slate-950/60', 'text-slate-300');
        activeButton.classList.add('border-cyan-400/30', 'bg-cyan-400/10', 'text-cyan-200');
    }
}

async function startResearch() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showError('Please enter a research topic');
        return;
    }
    
    // Disable input and button
    topicInput.disabled = true;
    searchBtn.disabled = true;
    
    // Show loading state
    document.getElementById('btnText').classList.add('hidden');
    document.getElementById('btnLoader').classList.remove('hidden');
    
    // Hide empty state and show results
    emptyState.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    activateTab('search');
    
    // Reset results
    resetResults();
    
    try {
        const response = await fetch('/api/research', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showError(error.detail || 'An error occurred during research');
            return;
        }
        
        const data = await response.json();
        
        // Update results
        updateResults(data);
        
        // Mark all as complete
        updateBadgeStatus('search', 'complete');
        updateBadgeStatus('scrape', 'complete');
        updateBadgeStatus('report', 'complete');
        updateBadgeStatus('feedback', 'complete');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to connect to the server. Make sure FastAPI is running.');
    } finally {
        // Re-enable input and button
        topicInput.disabled = false;
        searchBtn.disabled = false;
        
        // Hide loading state
        document.getElementById('btnText').classList.remove('hidden');
        document.getElementById('btnLoader').classList.add('hidden');
    }
}

function updateResults(data) {
    // Update search results
    const searchResults = document.getElementById('searchResults');
    if (data.search_results) {
        searchResults.innerHTML = renderRichText(data.search_results);
    } else {
        searchResults.textContent = 'No search results found';
    }
    
    // Update scraped content
    const scrapedContent = document.getElementById('scrapedContent');
    if (data.scraped_content) {
        scrapedContent.innerHTML = renderRichText(data.scraped_content);
    } else {
        scrapedContent.textContent = 'No content could be scraped';
    }
    
    // Update report
    const report = document.getElementById('report');
    if (data.report) {
        report.innerHTML = renderRichText(data.report);
    } else {
        report.textContent = 'Report generation failed';
    }
    
    // Update feedback
    const feedback = document.getElementById('feedback');
    if (data.feedback) {
        feedback.innerHTML = renderRichText(data.feedback);
    } else {
        feedback.textContent = 'Feedback generation failed';
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createLink(url, label) {
    const linkClass = 'text-sky-400 underline decoration-sky-400/70 underline-offset-2 hover:text-sky-300 break-all';
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${label}</a>`;
}

function renderRichText(text) {
    const cleaned = formatText(text);
    const escaped = escapeHtml(cleaned);
    const placeholders = [];

    // Convert markdown links: [label](https://example.com)
    let html = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
        const marker = `@@LINK_${placeholders.length}@@`;
        placeholders.push(createLink(url, label));
        return marker;
    });

    // Convert bare URLs with protocol.
    html = html.replace(/https?:\/\/[^\s<]+/g, (rawUrl) => {
        let url = rawUrl;
        let trailing = '';
        while (/[),.!?;:]$/.test(url)) {
            trailing = url.slice(-1) + trailing;
            url = url.slice(0, -1);
        }
        return `${createLink(url, url)}${trailing}`;
    });

    // Convert bare www links.
    html = html.replace(/(^|\s)(www\.[^\s<]+)/g, (match, prefix, rawUrl) => {
        let url = rawUrl;
        let trailing = '';
        while (/[),.!?;:]$/.test(url)) {
            trailing = url.slice(-1) + trailing;
            url = url.slice(0, -1);
        }
        return `${prefix}${createLink(`https://${url}`, url)}${trailing}`;
    });

    // Restore markdown-link placeholders and keep line breaks.
    html = html.replace(/@@LINK_(\d+)@@/g, (_, index) => placeholders[Number(index)] || '');
    return html.replace(/\n/g, '<br>');
}

function updateBadgeStatus(type, status) {
    const badge = document.getElementById(`status-${type}`);
    const sideStatus = document.getElementById(`side-status-${type}`);

    if (sideStatus) {
        sideStatus.classList.remove('animate-pulse', 'bg-amber-300', 'bg-emerald-300', 'bg-rose-300');
        sideStatus.classList.remove('shadow-[0_0_12px_rgba(252,211,77,0.8)]', 'shadow-[0_0_12px_rgba(110,231,183,0.8)]', 'shadow-[0_0_12px_rgba(253,164,175,0.8)]');

        if (status === 'complete') {
            sideStatus.classList.add('bg-emerald-300', 'shadow-[0_0_12px_rgba(110,231,183,0.8)]');
        } else if (status === 'error') {
            sideStatus.classList.add('bg-rose-300', 'shadow-[0_0_12px_rgba(253,164,175,0.8)]');
        } else {
            sideStatus.classList.add('animate-pulse', 'bg-amber-300', 'shadow-[0_0_12px_rgba(252,211,77,0.8)]');
        }
    }

    if (badge) {
        badge.classList.remove(
            'border-amber-400/30',
            'bg-amber-400/10',
            'text-amber-300',
            'border-emerald-400/30',
            'bg-emerald-400/10',
            'text-emerald-300',
            'border-rose-400/30',
            'bg-rose-400/10',
            'text-rose-300'
        );

        if (status === 'complete') {
            badge.textContent = 'Complete';
            badge.classList.add('border-emerald-400/30', 'bg-emerald-400/10', 'text-emerald-300');
        } else if (status === 'error') {
            badge.textContent = 'Error';
            badge.classList.add('border-rose-400/30', 'bg-rose-400/10', 'text-rose-300');
        } else {
            badge.textContent = 'Processing...';
            badge.classList.add('border-amber-400/30', 'bg-amber-400/10', 'text-amber-300');
        }
    }
}

function resetResults() {
    document.getElementById('searchResults').textContent = 'Searching for information...';
    document.getElementById('scrapedContent').textContent = 'Scraping relevant content...';
    document.getElementById('report').textContent = 'Generating comprehensive report...';
    document.getElementById('feedback').textContent = 'Reviewing report quality...';
    
    // Reset badges
    ['search', 'scrape', 'report', 'feedback'].forEach(type => {
        updateBadgeStatus(type, 'processing');
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    resultsSection.classList.add('hidden');
    emptyState.classList.remove('hidden');

    ['search', 'scrape', 'report', 'feedback'].forEach(type => {
        updateBadgeStatus(type, 'error');
    });
    
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function formatText(text) {
    if (!text) {
        return '';
    }

    let cleaned = String(text);

    // Remove tool/reference artifacts that occasionally leak from model responses.
    cleaned = cleaned.replace(/\{\s*['\"]type['\"]\s*:\s*['\"]reference['\"][^}]*\}/gi, '');

    // Remove markdown headings and emphasis markers for a clean professional display.
    cleaned = cleaned.replace(/^\s*#{1,6}\s*/gm, '');
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/__(.*?)__/g, '$1');
    cleaned = cleaned.replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$)/g, '$1$2');

    // Normalize separators and excessive blank lines.
    cleaned = cleaned.replace(/^\s*---+\s*$/gm, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    // Limit text length and add ellipsis if too long
    const maxLength = 5000;
    if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength) + '\n\n... (truncated)';
    }
    return cleaned;
}

function downloadReport() {
    const topic = topicInput.value;
    const searchResults = document.getElementById('searchResults').textContent;
    const scrapedContent = document.getElementById('scrapedContent').textContent;
    const report = document.getElementById('report').textContent;
    const feedback = document.getElementById('feedback').textContent;
    
    const fullReport = `
================================================================================
                    MULTI-AGENT RESEARCH REPORT
================================================================================

TOPIC: ${topic}
Generated: ${new Date().toLocaleString()}

================================================================================
1. SEARCH RESULTS
================================================================================
${searchResults}

================================================================================
2. DETAILED CONTENT
================================================================================
${scrapedContent}

================================================================================
3. AI-GENERATED REPORT
================================================================================
${report}

================================================================================
4. CRITIC FEEDBACK
================================================================================
${feedback}

================================================================================
Report generated by Multi-Agent Research System
================================================================================
    `;
    
    // Create blob and download
    const blob = new Blob([fullReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function resetForm() {
    topicInput.value = '';
    topicInput.focus();
    resultsSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    activateTab('search');
}

// Initial setup
window.addEventListener('load', () => {
    // Check if server is running
    fetch('/api/health')
        .catch(() => {
            console.warn('Server not running. Please start FastAPI with: python app.py');
        });
});
