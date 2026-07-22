var RabbitTable = (function() {
    var BORDER_CLASSES = {
        users: 'rabbit-table-silver',
        roles: 'rabbit-table-mint-dashed',
        invoices: 'rabbit-table-orange',
        materials: 'rabbit-table-blue',
        companies: 'rabbit-table-silver',
        documents: 'rabbit-table-silver'
    };

    var instances = {};

    function getState(containerId) {
        if (!instances[containerId]) {
            instances[containerId] = {
                selected: [],
                sortKey: null,
                sortDir: 'asc',
                filteredData: []
            };
        }
        return instances[containerId];
    }

    function render(config) {
        var container = document.getElementById(config.containerId);
        if (!container) return;

        var st = getState(config.containerId);
        var type = config.type || 'users';
        var columns = config.columns || [];
        var data = config.data || [];
        var actions = config.actions || null;
        var onRefresh = config.onRefresh || null;

        st.selected = config.selected || [];
        st.filteredData = data.slice();

        var borderClass = BORDER_CLASSES[type] || 'rabbit-table-silver';
        var allChecked = st.filteredData.length > 0 && st.selected.length === st.filteredData.length;

        var html = '';

        html += '<div class="rabbit-table-toolbar">';
        html += '<div class="rabbit-table-toolbar-left"></div>';
        html += '<div class="rabbit-table-toolbar-right">';
        if (onRefresh) {
            html += '<button class="rabbit-btn-refresh" onclick="RabbitTable.refresh(\'' + config.containerId + '\')" title="Refresh">';
            html += '<svg class="rabbit-btn-refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';
            html += '</button>';
        }
        html += '</div>';
        html += '</div>';

        html += '<div class="rabbit-table-container ' + borderClass + '">';
        html += '<table class="rabbit-table">';
        html += '<thead><tr>';
        html += '<th class="rabbit-th-check">';
        html += '<input type="checkbox" class="rabbit-checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="RabbitTable.toggleAll(\'' + config.containerId + '\')">';
        html += '</th>';
        columns.forEach(function(col) {
            var sortable = col.sortable !== false;
            var sortClass = 'rabbit-th';
            if (sortable) {
                sortClass += ' rabbit-th-sortable';
                if (st.sortKey === col.key) {
                    sortClass += ' rabbit-th-active';
                }
            }
            var onclick = sortable ? ' onclick="RabbitTable.sort(\'' + config.containerId + '\', \'' + col.key + '\')"' : '';
            html += '<th class="' + sortClass + '"' + onclick + '>';
            html += col.label;
            if (sortable) {
                html += '<span class="rabbit-sort-arrow">';
                if (st.sortKey === col.key && st.sortDir === 'asc') {
                    html += '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
                } else if (st.sortKey === col.key && st.sortDir === 'desc') {
                    html += '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
                } else {
                    html += '<svg class="rabbit-sort-inactive" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
                }
                html += '</span>';
            }
            html += '</th>';
        });
        if (actions) {
            html += '<th class="rabbit-th">Actions</th>';
        }
        html += '</tr></thead>';
        html += '<tbody id="' + config.containerId + '-tbody">';
        html += renderRows(config, st.filteredData);
        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        html += '<div class="rabbit-card-list" id="' + config.containerId + '-cards">';
        html += renderCards(config, st.filteredData);
        html += '</div>';

        container.innerHTML = html;
        container._config = config;
    }

    function renderRows(config, data) {
        var html = '';
        var columns = config.columns || [];
        var actions = config.actions || null;
        var st = getState(config.containerId);
        var selected = st.selected;

        data.forEach(function(row) {
            var checked = selected.indexOf(row.id) !== -1 ? 'checked' : '';
            html += '<tr class="rabbit-tr" data-id="' + row.id + '">';
            html += '<td class="rabbit-td-check">';
            html += '<input type="checkbox" class="rabbit-checkbox" ' + checked + ' onchange="RabbitTable.toggleOne(\'' + config.containerId + '\', \'' + row.id + '\')">';
            html += '</td>';
            columns.forEach(function(col) {
                var value = col.render ? col.render(row) : (row[col.key] || '-');
                html += '<td class="rabbit-td">' + value + '</td>';
            });
            if (actions) {
                html += '<td class="rabbit-td rabbit-td-actions">' + actions(row) + '</td>';
            }
            html += '</tr>';
        });

        if (data.length === 0) {
            html += '<tr><td colspan="' + (columns.length + 1 + (actions ? 1 : 0)) + '" class="rabbit-td-empty">No data found</td></tr>';
        }

        return html;
    }

    function renderCards(config, data) {
        var html = '';
        var columns = config.columns || [];
        var actions = config.actions || null;

        data.forEach(function(row) {
            html += '<div class="rabbit-card-item" data-id="' + row.id + '">';
            columns.forEach(function(col) {
                var value = col.render ? col.render(row) : (row[col.key] || '-');
                html += '<div class="rabbit-card-item-row">';
                html += '<span class="rabbit-card-item-label">' + col.label + '</span>';
                html += '<span class="rabbit-card-item-value">' + value + '</span>';
                html += '</div>';
            });
            if (actions) {
                html += '<div class="rabbit-card-item-actions">' + actions(row) + '</div>';
            }
            html += '</div>';
        });

        if (data.length === 0) {
            html += '<div class="rabbit-card-empty">No data found</div>';
        }

        return html;
    }

    function toggleAll(containerId) {
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        var st = getState(containerId);
        var data = st.filteredData;

        if (st.selected.length === data.length) {
            st.selected = [];
        } else {
            st.selected = data.map(function(row) { return row.id; });
        }

        render(config);
        if (config.onSelect) config.onSelect(st.selected);
    }

    function toggleOne(containerId, id) {
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        var st = getState(containerId);

        var idx = st.selected.indexOf(id);
        if (idx !== -1) {
            st.selected.splice(idx, 1);
        } else {
            st.selected.push(id);
        }

        render(config);
        if (config.onSelect) config.onSelect(st.selected);
    }

    function sort(containerId, key) {
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        var st = getState(containerId);

        if (st.sortKey === key) {
            st.sortDir = st.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            st.sortKey = key;
            st.sortDir = 'asc';
        }

        st.filteredData.sort(function(a, b) {
            var va = a[key] || '';
            var vb = b[key] || '';
            if (typeof va === 'number' && typeof vb === 'number') {
                return st.sortDir === 'asc' ? va - vb : vb - va;
            }
            va = String(va).toLowerCase();
            vb = String(vb).toLowerCase();
            if (va < vb) return st.sortDir === 'asc' ? -1 : 1;
            if (va > vb) return st.sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        render(config);
    }

    function refresh(containerId) {
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        if (config.onRefresh) config.onRefresh();
    }

    function search(containerId, query) {
        var container = document.getElementById(containerId);
        if (!container || !container._config) return;
        var config = container._config;
        var st = getState(containerId);
        var data = config.data || [];
        var searchFields = config.searchFields || config.columns.map(function(c) { return c.key; });

        if (!query) {
            st.filteredData = data.slice();
        } else {
            var q = query.toLowerCase();
            st.filteredData = data.filter(function(row) {
                return searchFields.some(function(field) {
                    var val = row[field];
                    if (val === null || val === undefined) val = '';
                    return String(val).toLowerCase().indexOf(q) !== -1;
                });
            });
        }

        render(config);
    }

    function getData(containerId) {
        var st = getState(containerId);
        return st.filteredData;
    }

    function getSelected(containerId) {
        var st = getState(containerId);
        return st.selected.slice();
    }

    function setSelected(containerId, ids) {
        var st = getState(containerId);
        st.selected = ids || [];
    }

    return {
        render: render,
        toggleAll: toggleAll,
        toggleOne: toggleOne,
        sort: sort,
        refresh: refresh,
        search: search,
        getData: getData,
        getSelected: getSelected,
        setSelected: setSelected
    };
})();
