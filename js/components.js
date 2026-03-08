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

    scoreBar: function(score, max) {
        if (!max) max = 10;
        var pct = Math.round((score / max) * 100);
        var color = Utils.getScoreColor(score);
        return '<div class="score-bar">' +
            '<div class="score-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '<span class="score-label">' + Utils.formatScore(score) + '</span>' +
            '</div>';
    },

    subScoreBar: function(score) {
        var pct = Math.round(score * 100);
        var color = Utils.getSubScoreColor(score);
        return '<div class="score-bar">' +
            '<div class="score-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '<span class="score-label">' + Utils.formatScorePercent(score) + '</span>' +
            '</div>';
    },

    pairTable: function(pairs, currentSort) {
        if (!currentSort) currentSort = {};
        var sortArrow = function(field) {
            var arrow = '\u2195', cls = '';
            if (currentSort.field === field) {
                arrow = currentSort.dir === 'asc' ? '\u25B2' : '\u25BC';
                cls = ' active';
            }
            return ' <span class="sort-arrow' + cls + '">' + arrow + '</span>';
        };

        var html = '<div class="table-wrapper"><table class="data-table mobile-cards">';
        html += '<thead><tr>';
        html += '<th data-sort-field="project_a_name">사업A (세부사업)' + sortArrow('project_a_name') + '</th>';
        html += '<th data-sort-field="dept_a">부처' + sortArrow('dept_a') + '</th>';
        html += '<th data-sort-field="project_b_name">사업B (세부사업)' + sortArrow('project_b_name') + '</th>';
        html += '<th class="col-hide-tablet">부처B</th>';
        html += '<th data-sort-field="similarity_score" class="text-center">유사도' + sortArrow('similarity_score') + '</th>';
        html += '<th data-sort-field="budget_sum" class="text-right col-hide-tablet">합산예산' + sortArrow('budget_sum') + '</th>';
        html += '</tr></thead><tbody>';

        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            var budgetSum = (p.project_a.budget_2026 || 0) + (p.project_b.budget_2026 || 0);
            html += '<tr data-pair-id="' + Utils.escapeHtml(p.pair_id) + '">';
            html += '<td data-label="사업A"><strong>' + Utils.escapeHtml(p.project_a.sub_project_name) + '</strong>';
            html += '<div style="font-size:var(--font-size-xs);color:var(--text-secondary);">' + Utils.escapeHtml(p.project_a.project_name) + '</div></td>';
            html += '<td data-label="부처A"><span class="badge badge-ministry">' + Utils.escapeHtml(p.project_a.department) + '</span></td>';
            html += '<td data-label="사업B"><strong>' + Utils.escapeHtml(p.project_b.sub_project_name) + '</strong>';
            html += '<div style="font-size:var(--font-size-xs);color:var(--text-secondary);">' + Utils.escapeHtml(p.project_b.project_name) + '</div></td>';
            html += '<td data-label="부처B" class="col-hide-tablet"><span class="badge badge-ministry">' + Utils.escapeHtml(p.project_b.department) + '</span></td>';
            html += '<td data-label="유사도" class="text-center">' + Components.scoreBar(p.similarity_score) + '</td>';
            html += '<td data-label="합산예산" class="text-right col-hide-tablet">' + Utils.formatBudget(budgetSum) + '</td>';
            html += '</tr>';
        }

        if (pairs.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-secondary);">검색 결과가 없습니다.</td></tr>';
        }
        html += '</tbody></table></div>';
        return html;
    },

    projectCard: function(proj) {
        if (!proj) return '';
        var html = '<div class="card">';
        html += '<div class="card-header"><h3>' + Utils.escapeHtml(proj.sub_project_name) + '</h3>';
        html += '<div style="font-size:var(--font-size-sm);color:var(--text-secondary);">' + Utils.escapeHtml(proj.project_name) + '</div></div>';
        html += '<div class="info-grid">';
        html += '<div class="info-item"><span class="info-label">부처</span><span class="info-value">' + Utils.escapeHtml(proj.department) + '</span></div>';
        if (proj.division) html += '<div class="info-item"><span class="info-label">실/국</span><span class="info-value">' + Utils.escapeHtml(proj.division) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">2026 예산</span><span class="info-value">' + Utils.formatBudgetDetail(proj.budget_2026) + '</span></div>';
        if (proj.type) html += '<div class="info-item"><span class="info-label">유형</span><span class="info-value">' + Utils.codedValue(proj.type) + '</span></div>';
        if (proj.primary_domain) html += '<div class="info-item"><span class="info-label">도메인</span><span class="info-value">' + Utils.codedValue(proj.primary_domain) + '</span></div>';
        if (proj.target_fields && proj.target_fields.length > 0) {
            html += '<div class="info-item"><span class="info-label">대상분야</span><span class="info-value">' + proj.target_fields.map(function(f){ return Utils.codedValue(f); }).join(', ') + '</span></div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    },

    analysisBreakdown: function(analysis) {
        if (!analysis) return '';
        var html = '<div class="dimension-list">';

        // Target Field Similarity
        if (analysis.target_field_similarity) {
            html += '<div class="dimension-row">';
            html += '<div class="dimension-header"><span class="dimension-label">교육분야 유사도</span>';
            html += '<div class="dimension-bar">' + Components.subScoreBar(analysis.target_field_similarity.score) + '</div></div>';
            html += '</div>';
        }

        // Beneficiary Similarity
        if (analysis.beneficiary_similarity) {
            html += '<div class="dimension-row">';
            html += '<div class="dimension-header"><span class="dimension-label">수혜대상 유사도</span>';
            html += '<div class="dimension-bar">' + Components.subScoreBar(analysis.beneficiary_similarity.score) + '</div></div>';
            html += '</div>';
        }

        // Agency Similarity
        if (analysis.agency_similarity) {
            html += '<div class="dimension-row">';
            html += '<div class="dimension-header"><span class="dimension-label">수행기관 유사도</span>';
            html += '<div class="dimension-bar">' + Components.subScoreBar(analysis.agency_similarity.score) + '</div></div>';
            html += '</div>';
        }

        // Text Similarity
        if (analysis.text_similarity) {
            html += '<div class="dimension-row">';
            html += '<div class="dimension-header"><span class="dimension-label">텍스트 유사도</span>';
            html += '<div class="dimension-bar">' + Components.subScoreBar(analysis.text_similarity.score) + '</div></div>';
            if (analysis.text_similarity.domain_tfidf !== undefined) {
                html += '<div class="dimension-detail">도메인 TF-IDF: ' + (analysis.text_similarity.domain_tfidf * 100).toFixed(0) + '% | 교육구조 TF-IDF: ' + (analysis.text_similarity.structure_tfidf * 100).toFixed(0) + '%</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    clusterCard: function(cluster) {
        if (!cluster) return '';
        var html = '<div class="card overlap-card" data-cluster-id="' + Utils.escapeHtml(cluster.cluster_id) + '">';
        html += '<div class="overlap-card-info" style="flex:1;">';
        html += '<div class="overlap-card-name">' + Utils.escapeHtml(cluster.cluster_name) + '</div>';
        html += '<div style="display:flex;gap:var(--space-md);flex-wrap:wrap;margin-top:var(--space-xs);font-size:var(--font-size-xs);color:var(--text-secondary);">';
        html += '<span>' + cluster.member_count + '개 세부사업</span>';
        html += '<span>' + Utils.formatBudget(cluster.total_budget_2026) + '</span>';
        html += '<span>평균 유사도: ' + Utils.formatScore(cluster.score_stats.avg) + '</span>';
        html += '</div>';
        html += '<div style="margin-top:var(--space-xs);">';
        for (var d = 0; d < (cluster.departments || []).length; d++) {
            html += '<span class="badge badge-ministry">' + Utils.escapeHtml(cluster.departments[d]) + '</span> ';
        }
        html += '</div>';
        html += '</div>';
        html += '<div class="overlap-card-score" style="min-width:80px;">' + Components.scoreBar(cluster.score_stats.max) + '</div>';
        html += '</div>';
        return html;
    },

    statsCard: function(title, items, labelKey, valueKey, extraKey) {
        var html = '<div class="card">';
        html += '<div class="card-header"><h3>' + Utils.escapeHtml(title) + '</h3></div>';
        html += '<table class="sub-table"><thead><tr>';
        html += '<th>' + Utils.escapeHtml(labelKey || '항목') + '</th>';
        html += '<th class="text-right">' + Utils.escapeHtml(valueKey || '값') + '</th>';
        if (extraKey) html += '<th class="text-right">' + Utils.escapeHtml(extraKey) + '</th>';
        html += '</tr></thead><tbody>';
        for (var i = 0; i < items.length; i++) {
            html += '<tr><td>' + Utils.escapeHtml(String(items[i].label)) + '</td>';
            html += '<td class="text-right"><strong>' + Utils.escapeHtml(String(items[i].value)) + '</strong></td>';
            if (extraKey) html += '<td class="text-right">' + Utils.escapeHtml(String(items[i].extra || '')) + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        return html;
    }
};
