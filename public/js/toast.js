function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:100;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
        document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    var colors = {
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: 'check-circle' },
        error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: 'x-circle' },
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', icon: 'information-circle' },
        warning: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', icon: 'exclamation-triangle' }
    };
    var c = colors[type] || colors.info;

    var icons = {
        'check-circle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'x-circle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'information-circle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        'exclamation-triangle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>'
    };

    toast.style.cssText = 'pointer-events:auto;display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1rem;border-radius:0.5rem;font-size:0.875rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.1);opacity:0;transform:translateX(100%);transition:all 0.3s ease;background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.text + ';max-width:24rem;';
    toast.innerHTML = icons[c.icon] + '<span>' + message + '</span>';

    container.appendChild(toast);

    requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}
