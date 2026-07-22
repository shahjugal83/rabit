var RabbitCard = (function() {
    function renderDetail(config) {
        var container = document.getElementById(config.containerId);
        if (!container) return;

        var title = config.title || '';
        var sections = config.sections || [];
        var infoBoxes = config.infoBoxes || [];
        var actions = config.actions || [];

        var html = '';

        html += '<div class="rabbit-detail-card">';
        if (title) {
            html += '<div class="rabbit-detail-card-header">';
            html += '<h3>' + title + '</h3>';
            html += '</div>';
        }
        html += '<div class="rabbit-detail-card-body">';

        if (infoBoxes.length > 0) {
            html += '<div class="rabbit-info-grid">';
            infoBoxes.forEach(function(box) {
                html += '<div class="rabbit-info-box">';
                html += '<div class="rabbit-info-box-label">' + box.label + '</div>';
                html += '<div class="rabbit-info-box-value">' + (box.value || '-') + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }

        sections.forEach(function(section) {
            html += '<div class="rabbit-detail-section">';
            if (section.title) {
                html += '<h4 class="rabbit-detail-section-title">' + section.title + '</h4>';
            }
            if (section.html) {
                html += section.html;
            }
            if (section.fields) {
                html += '<div class="rabbit-detail-fields">';
                section.fields.forEach(function(field) {
                    html += '<div class="rabbit-detail-field">';
                    html += '<span class="rabbit-detail-field-label">' + field.label + '</span>';
                    html += '<span class="rabbit-detail-field-value">' + (field.value || '-') + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }
            html += '</div>';
        });

        if (actions.length > 0) {
            html += '<div class="rabbit-detail-actions">';
            actions.forEach(function(action) {
                html += action;
            });
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';

        container.innerHTML = html;
    }

    function renderInfoGrid(config) {
        var container = document.getElementById(config.containerId);
        if (!container) return;

        var boxes = config.boxes || [];
        var html = '<div class="rabbit-info-grid">';

        boxes.forEach(function(box) {
            html += '<div class="rabbit-info-box">';
            html += '<div class="rabbit-info-box-label">' + box.label + '</div>';
            html += '<div class="rabbit-info-box-value">' + (box.value || '-') + '</div>';
            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    return {
        renderDetail: renderDetail,
        renderInfoGrid: renderInfoGrid
    };
})();
