var Views = {
    _state: {
        search: '',
        filters: { department: '', minScore: 0 },
        sort: { field: 'similarity_score', dir: 'desc' }
    },

    container: function() { return document.getElementById('app-content'); },

    // ========== Pair List (유사도 쌍 목록) ==========
    renderPairList: function() {
        var el = this.container();
        var filters = DataStore.getFilterOptions();
        var meta = DataStore.getMeta();

        var html = '<div class="view-header">';
        html += '<h1>유사 사업 쌍 분석</h1>';
        html += '<p>총 ' + (meta.total_pairs_found || 0) + '건의 유사 사업 쌍이 발견되었습니다. (분석 대상: ' + (meta.total_sub_projects_analyzed || 0) + '개 세부사업)</p>';
        html += '</div>';

        html += '<div class="search-bar">';
        html += '<input type="text" id="search-input" placeholder="사업명, 세부사업명, 부처, 실/국으로 검색..." value="' + Utils.escapeHtml(this._state.search) + '">';
        html += '</div>';

        html += '<div class="filter-row">';
        html += Components.filterSelect('filter-dept', '부처', filters.departments);
        html += '<div class="range-filter">';
        html += '<label>최소 유사도:</label>';
        html += '<input type="range" id="filter-min-score" min="5" max="10" step="0.5" value="' + (this._state.filters.minScore || 5) + '">';
        html += '<span class="range-value" id="score-display">' + (this._state.filters.minScore || 5) + '</span>';
        html += '</div>';
        html += '<button id="filter-reset" class="btn-secondary">초기화</button>';
        html += '</div>';

        html += '<div id="summary-bar" class="summary-bar"></div>';
        html += '<div id="pair-table-container"></div>';

        el.innerHTML = html;

        if (this._state.filters.department) {
            document.getElementById('filter-dept').value = this._state.filters.department;
        }

        this._refreshPairTable();
        this._bindPairListEvents();
    },

    _refreshPairTable: function() {
        var pairs = DataStore.getPairs(this._state.filters, this._state.search, this._state.sort);
        var allPairs = DataStore.getPairs();

        var summaryEl = document.getElementById('summary-bar');
        if (summaryEl) {
            var totalBudget = 0;
            for (var i = 0; i < pairs.length; i++) {
                totalBudget += (pairs[i].project_a.budget_2026 || 0) + (pairs[i].project_b.budget_2026 || 0);
            }
            summaryEl.innerHTML =
                '<span class="summary-item">전체 <strong>' + allPairs.length + '</strong>쌍</span>' +
                '<span class="summary-item">필터 결과 <strong>' + pairs.length + '</strong>쌍</span>' +
                '<span class="summary-item">관련 예산 합계 <strong>' + Utils.formatBudget(totalBudget) + '</strong></span>';
        }

        var tableEl = document.getElementById('pair-table-container');
        if (tableEl) {
            tableEl.innerHTML = Components.pairTable(pairs, this._state.sort);
        }

        // Bind row clicks
        var rows = document.querySelectorAll('#pair-table-container tr[data-pair-id]');
        for (var j = 0; j < rows.length; j++) {
            rows[j].addEventListener('click', function() {
                var id = this.getAttribute('data-pair-id');
                if (id) location.hash = '#/pair/' + id;
            });
        }

        // Bind sort headers
        var headers = document.querySelectorAll('#pair-table-container th[data-sort-field]');
        var self = this;
        for (var k = 0; k < headers.length; k++) {
            headers[k].addEventListener('click', function() {
                var field = this.getAttribute('data-sort-field');
                if (self._state.sort.field === field) {
                    self._state.sort.dir = self._state.sort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    self._state.sort.field = field;
                    self._state.sort.dir = field === 'similarity_score' || field === 'budget_sum' ? 'desc' : 'asc';
                }
                self._refreshPairTable();
            });
        }
    },

    _bindPairListEvents: function() {
        var self = this;
        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(function() {
                self._state.search = searchInput.value.trim();
                self._refreshPairTable();
            }, 300));
        }

        var deptSelect = document.getElementById('filter-dept');
        if (deptSelect) {
            deptSelect.addEventListener('change', function() {
                self._state.filters.department = deptSelect.value;
                self._refreshPairTable();
            });
        }

        var slider = document.getElementById('filter-min-score');
        var display = document.getElementById('score-display');
        if (slider) {
            slider.addEventListener('input', function() {
                var val = parseFloat(slider.value);
                if (display) display.textContent = val;
                self._state.filters.minScore = val;
                self._refreshPairTable();
            });
        }

        var resetBtn = document.getElementById('filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                self._state.search = '';
                self._state.filters = { department: '', minScore: 5 };
                var si = document.getElementById('search-input');
                if (si) si.value = '';
                if (deptSelect) deptSelect.value = '';
                if (slider) { slider.value = 5; if (display) display.textContent = '5'; }
                self._refreshPairTable();
            });
        }
    },

    // ========== Pair Detail (유사도 쌍 상세) ==========
    renderPairDetail: function(pairId) {
        var el = this.container();
        var p = DataStore.getPair(pairId);

        if (!p) {
            el.innerHTML = '<div class="error-state"><h2>유사 사업 쌍을 찾을 수 없습니다</h2><p><a href="#/pairs">&larr; 목록으로 돌아가기</a></p></div>';
            return;
        }

        var html = '<a href="#/pairs" class="back-link">&larr; 유사 사업 쌍 목록으로</a>';

        // Header
        html += '<div class="card">';
        html += '<div class="card-header">';
        html += '<h1>유사도 분석 상세</h1>';
        html += '<div style="display:flex;align-items:center;gap:var(--space-md);margin-top:var(--space-sm);flex-wrap:wrap;">';
        html += '<span class="badge badge-overlap">' + Utils.escapeHtml(p.similarity_level) + '</span>';
        html += '<span>종합 유사도:</span>';
        html += '<div style="min-width:120px;">' + Components.scoreBar(p.similarity_score) + '</div>';
        html += '</div></div></div>';

        // Two project cards side by side
        html += '<div class="program-pair">';
        html += Components.projectCard(p.project_a);
        html += Components.projectCard(p.project_b);
        html += '</div>';

        // Analysis breakdown
        html += '<div class="card">';
        html += '<div class="card-header"><h2>분석 세부 점수</h2></div>';
        html += Components.analysisBreakdown(p.analysis);
        html += '</div>';

        // Rationale
        html += '<div class="card">';
        html += '<div class="card-header"><h2>분석 근거 (Rationale)</h2></div>';
        html += '<p style="font-size:var(--font-size-sm);line-height:1.8;">' + Utils.escapeHtml(p.rationale) + '</p>';
        html += '</div>';

        // Recommendation
        html += '<div class="coordination-card">';
        html += '<h4>조정 권고사항 (Recommendation)</h4>';
        html += '<p>' + Utils.escapeHtml(p.recommendation) + '</p>';
        html += '</div>';

        el.innerHTML = html;
    },

    // ========== Clusters (사업군) ==========
    renderClusters: function() {
        var el = this.container();
        var clusters = DataStore.getClusters();

        var html = '<div class="view-header">';
        html += '<h1>유사 사업군 (클러스터)</h1>';
        html += '<p>유사도가 높은 사업들이 모여 형성된 사업군입니다.</p>';
        html += '</div>';

        html += '<div class="overlap-list">';
        for (var i = 0; i < clusters.length; i++) {
            html += Components.clusterCard(clusters[i]);
        }
        if (clusters.length === 0) {
            html += '<div class="empty-state"><p>클러스터가 없습니다.</p></div>';
        }
        html += '</div>';

        el.innerHTML = html;

        // Bind clicks
        var cards = document.querySelectorAll('.overlap-card[data-cluster-id]');
        for (var j = 0; j < cards.length; j++) {
            cards[j].addEventListener('click', function() {
                var id = this.getAttribute('data-cluster-id');
                if (id) location.hash = '#/cluster/' + id;
            });
        }
    },

    // ========== Cluster Detail ==========
    renderClusterDetail: function(clusterId) {
        var el = this.container();
        var c = DataStore.getCluster(clusterId);

        if (!c) {
            el.innerHTML = '<div class="error-state"><h2>클러스터를 찾을 수 없습니다</h2><p><a href="#/clusters">&larr; 목록으로 돌아가기</a></p></div>';
            return;
        }

        var html = '<a href="#/clusters" class="back-link">&larr; 사업군 목록으로</a>';

        // Header
        html += '<div class="card">';
        html += '<div class="card-header"><h1>' + Utils.escapeHtml(c.cluster_name) + '</h1></div>';
        html += '<div class="info-grid">';
        html += '<div class="info-item"><span class="info-label">유형</span><span class="info-value">' + Utils.escapeHtml(c.cluster_type) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">세부사업 수</span><span class="info-value">' + c.member_count + '개</span></div>';
        html += '<div class="info-item"><span class="info-label">총 예산</span><span class="info-value">' + Utils.formatBudget(c.total_budget_2026) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">유사도 범위</span><span class="info-value">' + Utils.formatScore(c.score_stats.min) + ' ~ ' + Utils.formatScore(c.score_stats.max) + ' (평균 ' + Utils.formatScore(c.score_stats.avg) + ')</span></div>';
        html += '</div>';
        html += '<div style="margin-top:var(--space-md);">';
        for (var d = 0; d < (c.departments || []).length; d++) {
            html += '<span class="badge badge-ministry">' + Utils.escapeHtml(c.departments[d]) + '</span> ';
        }
        html += '</div></div>';

        // Members
        html += '<div class="card">';
        html += '<div class="card-header"><h2>소속 세부사업 (' + c.member_count + '개)</h2></div>';
        html += '<table class="sub-table"><thead><tr>';
        html += '<th>세부사업명</th><th>사업명</th><th>부처</th><th class="text-right">예산</th><th class="col-hide-tablet">유형</th>';
        html += '</tr></thead><tbody>';
        for (var m = 0; m < (c.members || []).length; m++) {
            var mem = c.members[m];
            html += '<tr>';
            html += '<td><strong>' + Utils.escapeHtml(mem.sub_project_name) + '</strong></td>';
            html += '<td>' + Utils.escapeHtml(mem.project_name) + '</td>';
            html += '<td><span class="badge badge-ministry">' + Utils.escapeHtml(mem.department) + '</span></td>';
            html += '<td class="text-right">' + Utils.formatBudgetDetail(mem.budget_2026) + '</td>';
            html += '<td class="col-hide-tablet">' + Utils.escapeHtml(mem.type || '') + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table></div>';

        // Internal pairs
        if (c.internal_pairs && c.internal_pairs.length > 0) {
            html += '<div class="card">';
            html += '<div class="card-header"><h2>내부 유사 쌍 (' + c.internal_pairs.length + '건)</h2></div>';
            html += '<div class="overlap-list">';
            for (var ip = 0; ip < c.internal_pairs.length; ip++) {
                var pair = c.internal_pairs[ip];
                html += '<div class="overlap-card" data-pair-id="' + Utils.escapeHtml(pair.pair_id) + '">';
                html += '<div class="overlap-card-info">';
                html += '<div class="overlap-card-name">' + Utils.escapeHtml(pair.project_a.sub_project_name) + ' &harr; ' + Utils.escapeHtml(pair.project_b.sub_project_name) + '</div>';
                html += '<div class="overlap-card-type">' + Utils.escapeHtml(pair.project_a.department) + ' / ' + Utils.escapeHtml(pair.project_b.department) + '</div>';
                html += '</div>';
                html += '<div class="overlap-card-score">' + Components.scoreBar(pair.similarity_score) + '</div>';
                html += '</div>';
            }
            html += '</div></div>';

            // Bind pair clicks
            setTimeout(function() {
                var pairCards = document.querySelectorAll('.overlap-card[data-pair-id]');
                for (var x = 0; x < pairCards.length; x++) {
                    pairCards[x].addEventListener('click', function() {
                        var id = this.getAttribute('data-pair-id');
                        if (id) location.hash = '#/pair/' + id;
                    });
                }
            }, 0);
        }

        // Summary
        if (c.summary) {
            html += '<div class="card">';
            html += '<div class="card-header"><h2>요약</h2></div>';
            html += '<p style="font-size:var(--font-size-sm);line-height:1.8;">' + Utils.escapeHtml(c.summary) + '</p>';
            html += '</div>';
        }

        // Recommendation
        if (c.recommendation) {
            html += '<div class="coordination-card">';
            html += '<h4>조정 권고사항</h4>';
            html += '<p>' + Utils.escapeHtml(c.recommendation) + '</p>';
            html += '</div>';
        }

        el.innerHTML = html;
    },

    // ========== Statistics (통계) ==========
    renderStats: function() {
        var el = this.container();
        var stats = DataStore.getSummaryStats();
        var meta = DataStore.getMeta();

        var html = '<div class="view-header">';
        html += '<h1>분석 통계</h1>';
        html += '<p>' + Utils.escapeHtml(meta.title || '') + '</p>';
        html += '</div>';

        html += '<div class="about-grid">';

        // Meta info
        html += '<div class="card">';
        html += '<div class="card-header"><h2>분석 개요</h2></div>';
        html += '<div class="info-grid" style="grid-template-columns:1fr;">';
        html += '<div class="info-item"><span class="info-label">버전</span><span class="info-value">' + Utils.escapeHtml(String(meta.version)) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">생성일</span><span class="info-value">' + Utils.escapeHtml(meta.generated_at || '') + '</span></div>';
        html += '<div class="info-item"><span class="info-label">분석 사업 수</span><span class="info-value">' + (meta.total_projects_analyzed || 0) + '개 사업 / ' + (meta.total_sub_projects_analyzed || 0) + '개 세부사업</span></div>';
        html += '<div class="info-item"><span class="info-label">발견된 유사 쌍</span><span class="info-value">' + (meta.total_pairs_found || 0) + '건</span></div>';
        html += '<div class="info-item"><span class="info-label">클러스터</span><span class="info-value">' + (meta.total_clusters_found || 0) + '개</span></div>';
        html += '</div></div>';

        // Score range distribution
        if (stats.by_score_range) {
            var sr = stats.by_score_range;
            var scoreItems = [
                { label: '9~10점 (매우 높음)', value: sr['9_10'] || 0 },
                { label: '7~8점 (높음)', value: sr['7_8'] || 0 },
                { label: '5~6점 (중간)', value: sr['5_6'] || 0 }
            ];
            html += Components.statsCard('유사도 점수 분포', scoreItems, '점수 범위', '쌍 수');
        }

        html += '</div>'; // end about-grid

        // By department pair
        if (stats.by_department_pair && stats.by_department_pair.length > 0) {
            var deptItems = stats.by_department_pair.map(function(d) {
                return {
                    label: d.dept_a + ' \u2194 ' + d.dept_b,
                    value: d.pair_count + '쌍',
                    extra: '평균 ' + d.avg_score.toFixed(1) + '점'
                };
            });
            html += Components.statsCard('부처 간 유사 쌍 현황', deptItems, '부처 조합', '유사 쌍 수', '평균 유사도');
        }

        // By domain
        if (stats.by_domain && stats.by_domain.length > 0) {
            var domItems = stats.by_domain.map(function(d) {
                return {
                    label: d.domain,
                    value: d.pair_count + '쌍',
                    extra: Utils.formatBudget(d.total_budget)
                };
            });
            html += Components.statsCard('도메인별 유사 쌍 현황', domItems, '도메인', '유사 쌍 수', '관련 예산');
        }

        // Methodology
        html += '<div class="card" style="margin-top:var(--space-md);">';
        html += '<div class="card-header"><h2>분석 방법론</h2></div>';
        html += '<p style="font-size:var(--font-size-sm);line-height:1.8;">' + Utils.escapeHtml(meta.methodology || '') + '</p>';
        if (meta.formula) {
            html += '<div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--bg-gray);border-radius:var(--radius-sm);font-family:monospace;font-size:var(--font-size-sm);">';
            html += Utils.escapeHtml(meta.formula);
            html += '</div>';
        }
        html += '</div>';

        el.innerHTML = html;
    }
};
