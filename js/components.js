var Components = {
    filterSelect: function(id, label, options) {
        var html = '<select id="' + id + '">';
        html += '<option value="">전체 ' + Utils.escapeHtml(label) + '</option>';
        for (var i = 0; i < options.length; i++) {
            html += '<option value="' + Utils.escapeHtml(options[i]) + '">' + Utils.escapeHtml(options[i]) + '</option>';
        }
        html += '</select>';
        return html;
    },

    programTable: function(programs, currentSort) {
        if (!currentSort) currentSort = {};
        var columns = [
            { field: 'program_name', label: '사업명', cls: '' },
            { field: 'ministry', label: '소관부처', cls: '' },
            { field: 'budget_2026_million_won', label: '2026 예산', cls: 'text-right' },
            { field: 'budget_change_rate', label: '증감률', cls: 'text-right' },
            { field: 'target_groups', label: '주요 대상', cls: 'col-hide-tablet' },
            { field: '_overlap_count', label: '중복', cls: 'text-center' }
        ];

        var html = '<div class="table-wrapper"><table class="data-table mobile-cards">';
        html += '<thead><tr>';
        for (var c = 0; c < columns.length; c++) {
            var col = columns[c];
            var arrow = '\u2195';
            var arrowCls = '';
            if (currentSort.field === col.field) {
                arrow = currentSort.dir === 'asc' ? '\u25B2' : '\u25BC';
                arrowCls = ' active';
            }
            html += '<th class="' + col.cls + '" data-sort-field="' + col.field + '">';
            html += Utils.escapeHtml(col.label);
            if (col.field !== 'target_groups') {
                html += ' <span class="sort-arrow' + arrowCls + '">' + arrow + '</span>';
            }
            html += '</th>';
        }
        html += '</tr></thead><tbody>';

        for (var i = 0; i < programs.length; i++) {
            var p = programs[i];
            var overlapCount = DataStore.getOverlapCount(p.program_id);
            var targets = (p.target_groups || []).slice(0, 2).join(', ');
            if ((p.target_groups || []).length > 2) targets += ' 외';

            html += '<tr data-program-id="' + Utils.escapeHtml(p.program_id) + '">';
            html += '<td data-label="사업명"><strong>' + Utils.escapeHtml(p.program_name) + '</strong></td>';
            html += '<td data-label="소관부처"><span class="badge badge-ministry">' + Utils.escapeHtml(p.ministry) + '</span></td>';
            html += '<td data-label="2026 예산" class="text-right">' + Utils.formatBudget(p.budget_2026_million_won) + '</td>';
            html += '<td data-label="증감률" class="text-right">' + Utils.formatChangeRate(p.budget_change_rate) + '</td>';
            html += '<td data-label="주요 대상" class="col-hide-tablet">' + Utils.escapeHtml(targets) + '</td>';
            html += '<td data-label="중복관계" class="text-center">';
            if (overlapCount > 0) {
                html += '<span class="badge badge-overlap">' + overlapCount + '건</span>';
            } else {
                html += '-';
            }
            html += '</td>';
            html += '</tr>';
        }

        if (programs.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-secondary);">검색 결과가 없습니다.</td></tr>';
        }

        html += '</tbody></table></div>';
        return html;
    },

    overlapTable: function(overlaps, currentSort) {
        if (!currentSort) currentSort = {};
        var dimensionLabels = {
            target_group: '대상',
            content: '내용',
            executing_agency: '기관',
            region: '지역'
        };

        var html = '<div class="table-wrapper"><table class="data-table mobile-cards">';
        html += '<thead><tr>';
        html += '<th data-sort-field="program_a_name">사업 A</th>';
        html += '<th data-sort-field="program_b_name">사업 B</th>';
        html += '<th data-sort-field="overlap_type" class="col-hide-tablet">중복유형</th>';

        var sortArrow = function(field) {
            var arrow = '\u2195';
            var cls = '';
            if (currentSort.field === field) {
                arrow = currentSort.dir === 'asc' ? '\u25B2' : '\u25BC';
                cls = ' active';
            }
            return ' <span class="sort-arrow' + cls + '">' + arrow + '</span>';
        };

        html = '<div class="table-wrapper"><table class="data-table mobile-cards">';
        html += '<thead><tr>';
        html += '<th data-sort-field="program_a_name">사업 A' + sortArrow('program_a_name') + '</th>';
        html += '<th data-sort-field="program_b_name">사업 B' + sortArrow('program_b_name') + '</th>';
        html += '<th data-sort-field="overlap_type" class="col-hide-tablet">중복유형' + sortArrow('overlap_type') + '</th>';
        html += '<th data-sort-field="overlap_score" class="text-center">종합점수' + sortArrow('overlap_score') + '</th>';

        var dims = ['target_group', 'content', 'executing_agency', 'region'];
        for (var d = 0; d < dims.length; d++) {
            html += '<th class="text-center col-hide-tablet">' + dimensionLabels[dims[d]] + '</th>';
        }
        html += '</tr></thead><tbody>';

        for (var i = 0; i < overlaps.length; i++) {
            var o = overlaps[i];
            var pA = DataStore.getProgram(o.program_a);
            var pB = DataStore.getProgram(o.program_b);
            var nameA = pA ? pA.program_name : o.program_a;
            var nameB = pB ? pB.program_name : o.program_b;

            html += '<tr data-overlap-id="' + Utils.escapeHtml(o.overlap_id) + '">';
            html += '<td data-label="사업 A">' + Utils.escapeHtml(nameA) + '</td>';
            html += '<td data-label="사업 B">' + Utils.escapeHtml(nameB) + '</td>';
            html += '<td data-label="중복유형" class="col-hide-tablet"><span class="badge badge-overlap">' + Utils.escapeHtml(o.overlap_type) + '</span></td>';
            html += '<td data-label="종합점수" class="text-center">' + Components.scoreBar(o.overlap_score) + '</td>';

            for (var d2 = 0; d2 < dims.length; d2++) {
                var dimData = o.overlap_dimensions[dims[d2]];
                var score = dimData ? dimData.score : 0;
                html += '<td data-label="' + dimensionLabels[dims[d2]] + '" class="text-center col-hide-tablet">';
                html += '<span class="score-cell ' + Utils.getScoreClass(score) + '">' + Utils.formatScore(score) + '</span>';
                html += '</td>';
            }

            html += '</tr>';
        }

        if (overlaps.length === 0) {
            html += '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-secondary);">조건에 맞는 중복관계가 없습니다.</td></tr>';
        }

        html += '</tbody></table></div>';
        return html;
    },

    scoreBar: function(score) {
        var pct = Math.round(score * 100);
        var color = Utils.getScoreColor(score);
        return '<div class="score-bar">' +
            '<div class="score-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '<span class="score-label">' + pct + '%</span>' +
            '</div>';
    },

    dimensionBreakdown: function(dimensions) {
        var labels = {
            target_group: '대상 중복',
            content: '내용 중복',
            executing_agency: '수행기관 중복',
            region: '지역 중복'
        };
        var keys = ['target_group', 'content', 'executing_agency', 'region'];
        var html = '<div class="dimension-list">';
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var dim = dimensions[key];
            if (!dim) continue;
            html += '<div class="dimension-row">';
            html += '<div class="dimension-header">';
            html += '<span class="dimension-label">' + labels[key] + '</span>';
            html += '<div class="dimension-bar">' + Components.scoreBar(dim.score) + '</div>';
            html += '</div>';
            if (dim.detail) {
                html += '<div class="dimension-detail">' + Utils.escapeHtml(dim.detail) + '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    tagBadges: function(tags, cssClass) {
        if (!cssClass) cssClass = 'badge-domain';
        if (!tags || tags.length === 0) return '';
        var html = '<div class="tag-group">';
        for (var i = 0; i < tags.length; i++) {
            html += '<span class="badge ' + cssClass + '">' + Utils.escapeHtml(tags[i]) + '</span>';
        }
        html += '</div>';
        return html;
    },

    budgetCard: function(budget2026, budget2025, changeRate) {
        var html = '<div class="budget-display">';
        html += '<span class="budget-main">' + Utils.formatBudget(budget2026) + '</span>';
        html += '<span class="budget-sub">2026년 예산</span>';
        if (budget2025 !== null && budget2025 !== undefined) {
            html += '<span class="budget-sub">(전년 ' + Utils.formatBudget(budget2025) + ', ' + Utils.formatChangeRate(changeRate) + ')</span>';
        }
        html += '</div>';
        return html;
    },

    subProgramTable: function(subPrograms) {
        if (!subPrograms || subPrograms.length === 0) return '<p class="empty-state">내역사업 없음</p>';
        var html = '<table class="sub-table">';
        html += '<thead><tr><th>내역사업명</th><th style="text-align:right;">2026 예산</th><th>설명</th></tr></thead>';
        html += '<tbody>';
        for (var i = 0; i < subPrograms.length; i++) {
            var sp = subPrograms[i];
            html += '<tr>';
            html += '<td><strong>' + Utils.escapeHtml(sp.name) + '</strong></td>';
            html += '<td style="text-align:right;white-space:nowrap;">' + Utils.formatBudgetDetail(sp.budget_2026) + '</td>';
            html += '<td>' + Utils.escapeHtml(sp.description) + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
    },

    agencyList: function(agencies) {
        if (!agencies || agencies.length === 0) return '<p>-</p>';
        var html = '<ul class="simple-list">';
        for (var i = 0; i < agencies.length; i++) {
            var a = agencies[i];
            html += '<li><strong>' + Utils.escapeHtml(a.name) + '</strong>';
            if (a.role) html += ' &mdash; ' + Utils.escapeHtml(a.role);
            html += '</li>';
        }
        html += '</ul>';
        return html;
    },

    programSummaryCard: function(program) {
        if (!program) return '';
        var html = '<div class="card">';
        html += '<div class="card-header"><h3>' + Utils.escapeHtml(program.program_name) + '</h3></div>';
        html += '<div class="info-grid">';
        html += '<div class="info-item"><span class="info-label">부처</span><span class="info-value">' + Utils.escapeHtml(program.ministry) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">담당부서</span><span class="info-value">' + Utils.escapeHtml(program.department) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">2026 예산</span><span class="info-value">' + Utils.formatBudget(program.budget_2026_million_won) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">재원</span><span class="info-value">' + Utils.escapeHtml(program.fund_source) + '</span></div>';
        html += '</div>';
        html += Components.tagBadges(program.domain_tags);
        html += '</div>';
        return html;
    },

    contactCard: function(contact) {
        if (!contact) return '';
        var html = '<div class="contact-card">';
        html += '<div><strong>담당부서:</strong> ' + Utils.escapeHtml(contact.department) + '</div>';
        if (contact.phone) {
            html += '<div><strong>전화:</strong> ' + Utils.escapeHtml(contact.phone) + '</div>';
        }
        html += '</div>';
        return html;
    },

    coordinationContacts: function(contacts) {
        if (!contacts || contacts.length === 0) return '';
        var html = '<div class="section"><h3 class="section-title">조율 연락처</h3>';
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            html += '<div class="contact-card" style="margin-bottom:8px;">';
            html += '<div><strong>' + Utils.escapeHtml(c.ministry) + '</strong></div>';
            html += '<div>' + Utils.escapeHtml(c.department) + '</div>';
            html += '<div style="color:var(--text-secondary);font-size:var(--font-size-xs);">' + Utils.escapeHtml(c.topic) + '</div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    overlapCardList: function(overlaps, currentProgramId) {
        if (!overlaps || overlaps.length === 0) return '<p class="empty-state">중복관계 없음</p>';
        var html = '<div class="overlap-list">';
        for (var i = 0; i < overlaps.length; i++) {
            var o = overlaps[i];
            var partnerId = o.program_a === currentProgramId ? o.program_b : o.program_a;
            var partner = DataStore.getProgram(partnerId);
            var partnerName = partner ? partner.program_name : partnerId;
            html += '<div class="overlap-card" data-overlap-id="' + Utils.escapeHtml(o.overlap_id) + '">';
            html += '<div class="overlap-card-info">';
            html += '<div class="overlap-card-name">' + Utils.escapeHtml(partnerName) + '</div>';
            html += '<div class="overlap-card-type">' + Utils.escapeHtml(o.overlap_type) + '</div>';
            html += '</div>';
            html += '<div class="overlap-card-score">' + Components.scoreBar(o.overlap_score) + '</div>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
};
