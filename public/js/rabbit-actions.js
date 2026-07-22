var RabbitActions = (function() {
    var ENTITY_CONFIG = {
        users: {
            editUrl: function(row) {
                return 'user-role-edit.html?userId=' + row.id + '&companyId=' + row.companyId;
            },
            editLabel: 'Role',
            showEdit: true,
            showDelete: false
        },
        roles: {
            editUrl: function(row) {
                return 'role-edit.html?roleId=' + row.id;
            },
            editLabel: 'Edit',
            showEdit: true,
            showDelete: true,
            deleteConfirm: 'Are you sure you want to delete this role?'
        },
        companies: {
            editUrl: function(row) {
                return 'company-edit.html?companyId=' + row.id;
            },
            editLabel: 'Edit',
            showEdit: true,
            showDelete: false
        },
        documents: {
            editUrl: null,
            editLabel: 'Edit',
            showEdit: false,
            showDelete: true,
            deleteConfirm: 'Are you sure you want to delete this document type?'
        },
        materials: {
            editUrl: function(row) {
                return 'material-edit.html?materialId=' + row.id;
            },
            editLabel: 'Edit',
            showEdit: true,
            showDelete: true,
            deleteConfirm: 'Are you sure you want to delete this material?'
        },
        invoices: {
            editUrl: null,
            editLabel: 'Edit',
            showEdit: false,
            showDelete: true,
            deleteConfirm: 'Are you sure you want to delete this invoice?'
        }
    };

    function renderActions(entityType, row, options) {
        var config = ENTITY_CONFIG[entityType];
        if (!config) return '';

        var html = '';
        var opts = options || {};

        if (config.showEdit && config.editUrl) {
            var url = typeof config.editUrl === 'function' ? config.editUrl(row) : config.editUrl;
            html += '<a href="' + url + '" class="btn-secondary btn-sm">' + config.editLabel + '</a> ';
        }

        if (config.showDelete) {
            var deleteFn = opts.deleteFunction || ('handleDelete(\'' + row.id + '\')');
            var confirmMsg = config.deleteConfirm || 'Are you sure?';
            html += '<button class="btn-secondary btn-sm" style="color:#dc2626;" onclick="if(confirm(\'' + confirmMsg + '\'))' + deleteFn + '">' + (opts.deleteLabel || 'Delete') + '</button>';
        }

        return html;
    }

    return {
        renderActions: renderActions,
        ENTITY_CONFIG: ENTITY_CONFIG
    };
})();
