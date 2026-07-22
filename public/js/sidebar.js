const SIDEBAR_NAV = [
  {
    id: 'profile',
    label: 'Profile',
    href: 'profile.html',
    alwaysVisible: true,
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: 'dashboard.html',
    alwaysVisible: true,
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>',
  },
  {
    id: 'companies',
    label: 'Companies',
    href: 'companies.html',
    adminOnly: true,
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
  },
  {
    id: 'roles',
    label: 'Roles',
    href: 'roles.html',
    adminOnly: true,
    featureKey: 'userFeature',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  },
  {
    id: 'users',
    label: 'Users',
    href: 'users.html',
    adminOnly: true,
    featureKey: 'userFeature',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  },
  {
    id: 'documents',
    label: 'Documents',
    href: 'documents.html',
    adminOnly: true,
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  },
  {
    id: 'materials',
    label: 'Materials',
    href: 'materials.html',
    adminOnly: true,
    featureKey: 'invoiceManagement',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    href: 'invoices.html',
    adminOnly: true,
    featureKey: 'invoiceManagement',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>',
  },
];

function renderSidebar(activePage) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const links = SIDEBAR_NAV.map(item => {
    const isActive = item.id === activePage;
    const activeClass = isActive ? ' active' : '';
    const hiddenAttr = item.adminOnly ? ' style="display:none;"' : '';
    const idAttr = item.adminOnly ? ` id="nav-${item.id}"` : '';
    return `                <a href="${item.href}" class="sidebar-link${activeClass}"${idAttr}${hiddenAttr}>
                    ${item.icon}
                    ${item.label}
                </a>`;
  }).join('\n');

  container.innerHTML = `<button id="mobile-menu-btn" class="mobile-menu-btn" onclick="toggleSidebar()">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-brand">
                <span class="sidebar-brand-rabbit"></span>
                Rabbit
            </div>
            <nav class="sidebar-nav">
${links}
            </nav>
            <div class="sidebar-footer">
                <a href="logout.html" class="text-red-400 hover:text-red-300 text-sm">Logout</a>
            </div>
        </aside>
        <div id="sidebar-overlay" class="sidebar-overlay" onclick="toggleSidebar()"></div>`;
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function showAdminNavLinks(features) {
  SIDEBAR_NAV.forEach(item => {
    if (item.adminOnly) {
      const el = document.getElementById('nav-' + item.id);
      if (!el) return;
      if (item.featureKey && features && !features[item.featureKey]) {
        el.style.display = 'none';
      } else {
        el.style.display = 'flex';
      }
    }
  });
}
