var RabbitSearch = (function() {
    var state = {
        query: '',
        sortField: null,
        sortOrder: 'asc'
    };

    function render(config) {
        var container = document.getElementById(config.containerId);
        if (!container) return;

        var sortFields = config.sortFields || [];
        var onSearch = config.onSearch || null;
        var onSort = config.onSort || null;
        var placeholder = config.placeholder || 'Search...';

        var html = '';

        html += '<div class="rabbit-search-bar">';
        html += '<form onsubmit="RabbitSearch.handleSearch(event, \'' + config.containerId + '\')" class="rabbit-search-form">';
        html += '<svg class="rabbit-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
        html += '<input type="text" class="rabbit-search-input" placeholder="' + placeholder + '" value="' + escapeHtml(state.query) + '" oninput="RabbitSearch.handleInput(\'' + config.containerId + '\', this.value)">';
        html += '<button type="submit" class="rabbit-search-submit">Search</button>';
        html += '</form>';

        if (sortFields.length > 0) {
            html += '<div class="rabbit-sort-controls">';
            sortFields.forEach(function(field) {
                var isActive = state.sortField === field.key;
                var sortOrder = isActive ? state.sortOrder : 'asc';
                var btnClass = 'rabbit-sort-btn';
                if (isActive) btnClass += ' rabbit-sort-btn-active';

                html += '<button class="' + btnClass + '" onclick="RabbitSearch.handleSort(\'' + config.containerId + '\', \'' + field.key + '\')">';
                html += '<span class="rabbit-sort-label">' + (field.label || field.key) + '</span>';
                html += '<span class="rabbit-sort-arrow">';
                if (isActive && sortOrder === 'asc') {
                    html += '<svg class="rabbit-sort-arrow-active" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
                } else if (isActive && sortOrder === 'desc') {
                    html += '<svg class="rabbit-sort-arrow-active" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
                } else {
                    html += '<svg class="rabbit-sort-arrow-inactive" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
                }
                html += '</span>';
                html += '</button>';
            });
            html += '</div>';
        }

        html += '</div>';

        container.innerHTML = html;
        container._config = config;
    }

    function handleSearch(e, containerId) {
        e.preventDefault();
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        if (config.onSearch) config.onSearch(state.query);
    }

    function handleInput(containerId, value) {
        state.query = value;
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        if (config.onSearch) config.onSearch(state.query);
    }

    function handleSort(containerId, field) {
        if (state.sortField === field) {
            state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortOrder = 'asc';
        }

        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;

        render(config);
        if (config.onSort) config.onSort(state.sortField, state.sortOrder);
    }

    function getQuery() {
        return state.query;
    }

    function getSort() {
        return { field: state.sortField, order: state.sortOrder };
    }

    function reset() {
        state.query = '';
        state.sortField = null;
        state.sortOrder = 'asc';
    }

    return {
        render: render,
        handleSearch: handleSearch,
        handleInput: handleInput,
        handleSort: handleSort,
        getQuery: getQuery,
        getSort: getSort,
        reset: reset
    };
})();
