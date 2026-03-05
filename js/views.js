var Views = {
    _state: {
        search: '',
        filters: { ministry: '', domain_tag: '', budget_sector: '' },
        sort: { field: 'budget_2026_million_won', dir: 'desc' },
        overlapSort: { field: 'overlap_score', dir: 'desc' },
        overlapMinScore: 0
    },

    container: function() {
        return document.getElementById('app-content');
    },

    // ========== Program List View ==========
    renderProgramList: function() {
        var el = this.container();
        var filters = DataStore.getFilterOptions();

        var html = '<div class="view-header">';
        html += '<h1>예산사업 목록</h1>';
        html += '<p>정부 예산사업의 현황과 중복 관계를 확인합니다.</p>';
        html += '</div>';

        html += '<div class="search-bar">';
        html += '<input type="text" id="search-input" placeholder="사업명, 부처, 대상, 키워드로 검색..." value="' + Utils.escapeHtml(this._state.search) + '">';
        html += '</div>';

        html += '<div class="filter-row">';
        html += Components.filterSelect('filter-ministry', '소관부처', filters.ministries);
        html += Components.filterSelect('filter-domain', '분야태그', filters.domain_tags);
        html += Components.filterSelect('filter-sector', '예산분야', filters.budget_sectors);
        html += '<button id="filter-reset" class="btn-secondary">초기화</button>';
        html += '</div>';

        html += '<div id="summary-bar" class="summary-bar"></div>';
        html += '<div id="program-table-container"></div>';

        el.innerHTML = html;

        // Restore filter state
        var fm = document.getElementById('filter-ministry');
        var fd = document.getElementById('filter-domain');
        var fs = document.getElementById('filter-sector');
        if (fm && this._state.filters.ministry) fm.value = this._state.filters.ministry;
        if (fd && this._state.filters.domain_tag) fd.value = this._state.filters.domain_tag;
        if (fs && this._state.filters.budget_sector) fs.value = this._state.filters.budget_sector;

        this._refreshProgramTable();
        this._bindProgramListEvents();
    },

    _refreshProgramTable: function() {
        var programs = DataStore.getPrograms(this._state.filters, this._state.search, this._state.sort);
        var totalBudget = DataStore.getTotalBudget(programs);
        var allPrograms = DataStore.getPrograms();

        var summaryEl = document.getElementById('summary-bar');
        if (summaryEl) {
            summaryEl.innerHTML =
                '<span class="summary-item">전체 <strong>' + allPrograms.length + '</strong>개 사업</span>' +
                '<span class="summary-item">필터 결과 <strong>' + programs.length + '</strong>개</span>' +
                '<span class="summary-item">총 예산 <strong>' + Utils.formatBudget(totalBudget) + '</strong></span>';
        }

        var tableEl = document.getElementById('program-table-container');
        if (tableEl) {
            tableEl.innerHTML = Components.programTable(programs, this._state.sort);
        }

        // Bind table row clicks
        var rows = document.querySelectorAll('#program-table-container tr[data-program-id]');
        for (var i = 0; i < rows.length; i++) {
            rows[i].addEventListener('click', function(e) {
                var id = this.getAttribute('data-program-id');
                if (id) location.hash = '#/program/' + id;
            });
        }

        // Bind sort header clicks
        var headers = document.querySelectorAll('#program-table-container th[data-sort-field]');
        var self = this;
        for (var j = 0; j < headers.length; j++) {
            headers[j].addEventListener('click', function() {
                var field = this.getAttribute('data-sort-field');
                if (field === 'target_groups') return;
                if (self._state.sort.field === field) {
                    self._state.sort.dir = self._state.sort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    self._state.sort.field = field;
                    self._state.sort.dir = field === 'program_name' || field === 'ministry' ? 'asc' : 'desc';
                }
                self._refreshProgramTable();
            });
        }
    },

    _bindProgramListEvents: function() {
        var self = this;
        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(function() {
                self._state.search = searchInput.value.trim();
                self._refreshProgramTable();
            }, 300));
        }

        var filterIds = [
            { id: 'filter-ministry', key: 'ministry' },
            { id: 'filter-domain', key: 'domain_tag' },
            { id: 'filter-sector', key: 'budget_sector' }
        ];
        for (var i = 0; i < filterIds.length; i++) {
            (function(fid) {
                var el = document.getElementById(fid.id);
                if (el) {
                    el.addEventListener('change', function() {
                        self._state.filters[fid.key] = el.value;
                        self._refreshProgramTable();
                    });
                }
            })(filterIds[i]);
        }

        var resetBtn = document.getElementById('filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                self._state.search = '';
                self._state.filters = { ministry: '', domain_tag: '', budget_sector: '' };
                var si = document.getElementById('search-input');
                if (si) si.value = '';
                var selects = document.querySelectorAll('.filter-row select');
                for (var s = 0; s < selects.length; s++) selects[s].value = '';
                self._refreshProgramTable();
            });
        }
    },

    // ========== Program Detail View ==========
    renderProgramDetail: function(programId) {
        var el = this.container();
        var p = DataStore.getProgram(programId);

        if (!p) {
            el.innerHTML = '<div class="error-state"><h2>사업을 찾을 수 없습니다</h2><p>ID: ' + Utils.escapeHtml(programId) + '</p><p><a href="#/programs">&larr; 사업 목록으로 돌아가기</a></p></div>';
            return;
        }

        var overlaps = DataStore.getOverlapsForProgram(programId);
        var html = '';

        html += '<a href="#/programs" class="back-link">&larr; 사업 목록으로</a>';

        // Header
        html += '<div class="card">';
        html += '<div class="card-header"><h1>' + Utils.escapeHtml(p.program_name) + '</h1></div>';
        html += '<div class="info-grid">';
        html += '<div class="info-item"><span class="info-label">사업코드</span><span class="info-value">' + Utils.escapeHtml(p.program_code) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">소관부처</span><span class="info-value">' + Utils.escapeHtml(p.ministry) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">담당부서</span><span class="info-value">' + Utils.escapeHtml(p.department) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">재원</span><span class="info-value">' + Utils.escapeHtml(p.fund_source) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">지원형태</span><span class="info-value">' + Utils.escapeHtml(p.support_type) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">사업상태</span><span class="info-value">' + Utils.escapeHtml(p.program_status) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">시작연도</span><span class="info-value">' + (p.start_year || '-') + '</span></div>';
        html += '<div class="info-item"><span class="info-label">수행방식</span><span class="info-value">' + Utils.escapeHtml(p.delivery_method) + '</span></div>';
        html += '</div>';
        html += '</div>';

        // Budget
        html += '<div class="card">';
        html += '<div class="card-header"><h2>예산 현황</h2></div>';
        html += Components.budgetCard(p.budget_2026_million_won, p.budget_2025_million_won, p.budget_change_rate);
        if (p.target_scale) {
            html += '<div style="margin-top:var(--space-md);font-size:var(--font-size-sm);color:var(--text-secondary);">사업 규모: ' + Utils.escapeHtml(p.target_scale) + '</div>';
        }
        html += '</div>';

        // Sub-programs
        if (p.sub_programs && p.sub_programs.length > 0) {
            html += '<div class="card">';
            html += '<div class="card-header"><h2>내역사업 (' + p.sub_programs.length + '개)</h2></div>';
            html += Components.subProgramTable(p.sub_programs);
            html += '</div>';
        }

        // Executing agencies
        html += '<div class="card">';
        html += '<div class="collapsible-header" data-collapsible="agencies">';
        html += '<h2>수행기관 (' + (p.executing_agencies || []).length + '개)</h2>';
        html += '<span class="collapsible-arrow open">&#9654;</span>';
        html += '</div>';
        html += '<div class="collapsible-body open" id="collapsible-agencies">';
        html += Components.agencyList(p.executing_agencies);
        html += '</div>';
        html += '</div>';

        // Target groups
        html += '<div class="card">';
        html += '<div class="collapsible-header" data-collapsible="targets">';
        html += '<h2>사업 대상</h2>';
        html += '<span class="collapsible-arrow open">&#9654;</span>';
        html += '</div>';
        html += '<div class="collapsible-body open" id="collapsible-targets">';
        html += '<ul class="simple-list">';
        for (var t = 0; t < (p.target_groups || []).length; t++) {
            html += '<li>' + Utils.escapeHtml(p.target_groups[t]) + '</li>';
        }
        html += '</ul>';
        html += '</div>';
        html += '</div>';

        // Legal basis
        if (p.legal_basis && p.legal_basis.length > 0) {
            html += '<div class="card">';
            html += '<div class="collapsible-header" data-collapsible="legal">';
            html += '<h2>법적 근거</h2>';
            html += '<span class="collapsible-arrow">&#9654;</span>';
            html += '</div>';
            html += '<div class="collapsible-body" id="collapsible-legal">';
            html += '<ul class="simple-list">';
            for (var l = 0; l < p.legal_basis.length; l++) {
                html += '<li>' + Utils.escapeHtml(p.legal_basis[l]) + '</li>';
            }
            html += '</ul>';
            html += '</div>';
            html += '</div>';
        }

        // Tags
        html += '<div class="card">';
        html += '<div class="card-header"><h2>분류 태그</h2></div>';
        html += '<div class="section"><h3 class="section-title" style="font-size:var(--font-size-sm);">도메인 태그</h3>';
        html += Components.tagBadges(p.domain_tags, 'badge-domain');
        html += '</div>';
        html += '<div class="section"><h3 class="section-title" style="font-size:var(--font-size-sm);">키워드</h3>';
        html += Components.tagBadges(p.keywords, 'badge-keyword');
        html += '</div>';
        html += '</div>';

        // Overlap relations
        html += '<div class="card">';
        html += '<div class="card-header"><h2>중복 관계 (' + overlaps.length + '건)</h2></div>';
        html += Components.overlapCardList(overlaps, programId);
        html += '</div>';

        // Contact
        if (p.contact) {
            html += '<div class="card">';
            html += '<div class="card-header"><h2>연락처</h2></div>';
            html += Components.contactCard(p.contact);
            html += '</div>';
        }

        el.innerHTML = html;
        this._bindDetailEvents();
    },

    _bindDetailEvents: function() {
        // Collapsible sections
        var headers = document.querySelectorAll('.collapsible-header');
        for (var i = 0; i < headers.length; i++) {
            headers[i].addEventListener('click', function() {
                var key = this.getAttribute('data-collapsible');
                var body = document.getElementById('collapsible-' + key);
                var arrow = this.querySelector('.collapsible-arrow');
                if (body) {
                    body.classList.toggle('open');
                    if (arrow) arrow.classList.toggle('open');
                }
            });
        }

        // Overlap card clicks
        var cards = document.querySelectorAll('.overlap-card[data-overlap-id]');
        for (var j = 0; j < cards.length; j++) {
            cards[j].addEventListener('click', function() {
                var id = this.getAttribute('data-overlap-id');
                if (id) location.hash = '#/overlap/' + id;
            });
        }
    },

    // ========== Overlap List View ==========
    renderOverlapList: function() {
        var el = this.container();
        var html = '<div class="view-header">';
        html += '<h1>중복 분석</h1>';
        html += '<p>사업 간 중복도를 종합점수 기준으로 분석합니다.</p>';
        html += '</div>';

        html += '<div class="filter-row">';
        html += '<div class="range-filter">';
        html += '<label>최소 중복점수:</label>';
        html += '<input type="range" id="overlap-min-score" min="0" max="100" step="5" value="' + Math.round(this._state.overlapMinScore * 100) + '">';
        html += '<span class="range-value" id="overlap-score-display">' + Math.round(this._state.overlapMinScore * 100) + '%</span>';
        html += '</div>';
        html += '</div>';

        html += '<div id="overlap-table-container"></div>';

        el.innerHTML = html;
        this._refreshOverlapTable();
        this._bindOverlapListEvents();
    },

    _refreshOverlapTable: function() {
        var overlaps = DataStore.getOverlaps(this._state.overlapSort, this._state.overlapMinScore);
        var tableEl = document.getElementById('overlap-table-container');
        if (tableEl) {
            tableEl.innerHTML = Components.overlapTable(overlaps, this._state.overlapSort);
        }

        // Bind row clicks
        var rows = document.querySelectorAll('#overlap-table-container tr[data-overlap-id]');
        for (var i = 0; i < rows.length; i++) {
            rows[i].addEventListener('click', function() {
                var id = this.getAttribute('data-overlap-id');
                if (id) location.hash = '#/overlap/' + id;
            });
        }

        // Bind sort headers
        var headers = document.querySelectorAll('#overlap-table-container th[data-sort-field]');
        var self = this;
        for (var j = 0; j < headers.length; j++) {
            headers[j].addEventListener('click', function() {
                var field = this.getAttribute('data-sort-field');
                if (self._state.overlapSort.field === field) {
                    self._state.overlapSort.dir = self._state.overlapSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    self._state.overlapSort.field = field;
                    self._state.overlapSort.dir = field === 'overlap_score' ? 'desc' : 'asc';
                }
                self._refreshOverlapTable();
            });
        }
    },

    _bindOverlapListEvents: function() {
        var self = this;
        var slider = document.getElementById('overlap-min-score');
        var display = document.getElementById('overlap-score-display');
        if (slider) {
            slider.addEventListener('input', function() {
                var val = parseInt(slider.value);
                if (display) display.textContent = val + '%';
                self._state.overlapMinScore = val / 100;
                self._refreshOverlapTable();
            });
        }
    },

    // ========== Overlap Detail View ==========
    renderOverlapDetail: function(overlapId) {
        var el = this.container();
        var o = DataStore.getOverlap(overlapId);

        if (!o) {
            el.innerHTML = '<div class="error-state"><h2>중복분석을 찾을 수 없습니다</h2><p>ID: ' + Utils.escapeHtml(overlapId) + '</p><p><a href="#/overlaps">&larr; 중복분석 목록으로 돌아가기</a></p></div>';
            return;
        }

        var pA = DataStore.getProgram(o.program_a);
        var pB = DataStore.getProgram(o.program_b);

        var html = '<a href="#/overlaps" class="back-link">&larr; 중복분석 목록으로</a>';

        // Header
        html += '<div class="card">';
        html += '<div class="card-header">';
        html += '<h1>중복 분석 상세</h1>';
        html += '<p style="margin-top:var(--space-xs);">';
        html += '<span class="badge badge-overlap">' + Utils.escapeHtml(o.overlap_type) + '</span>';
        html += ' 종합 중복도: ' + Components.scoreBar(o.overlap_score);
        html += '</p>';
        html += '</div>';
        html += '</div>';

        // Program pair
        html += '<div class="program-pair">';
        html += Components.programSummaryCard(pA);
        html += Components.programSummaryCard(pB);
        html += '</div>';

        // Dimension breakdown
        html += '<div class="card">';
        html += '<div class="card-header"><h2>차원별 중복도 분석</h2></div>';
        html += Components.dimensionBreakdown(o.overlap_dimensions);
        html += '</div>';

        // Coordination needed
        if (o.coordination_needed) {
            html += '<div class="coordination-card">';
            html += '<h4>조율 필요사항</h4>';
            html += '<p>' + Utils.escapeHtml(o.coordination_needed) + '</p>';
            html += '</div>';
        }

        // Coordination contacts
        html += Components.coordinationContacts(o.coordination_contacts);

        // Links to programs
        html += '<div class="card">';
        html += '<div class="card-header"><h2>사업 상세 보기</h2></div>';
        html += '<div style="display:flex;gap:var(--space-md);flex-wrap:wrap;">';
        if (pA) html += '<a href="#/program/' + pA.program_id + '" style="flex:1;min-width:200px;" class="btn-secondary" style="text-align:center;display:block;padding:12px;">' + Utils.escapeHtml(pA.program_name) + ' &rarr;</a>';
        if (pB) html += '<a href="#/program/' + pB.program_id + '" style="flex:1;min-width:200px;" class="btn-secondary" style="text-align:center;display:block;padding:12px;">' + Utils.escapeHtml(pB.program_name) + ' &rarr;</a>';
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
    },

    // ========== About View ==========
    renderAbout: function() {
        var el = this.container();
        var meta = DataStore.getMeta();
        var taxonomy = DataStore.getTaxonomy();

        var html = '<div class="view-header">';
        html += '<h1>데이터 정보</h1>';
        html += '<p>본 데이터셋의 구조와 분류 체계를 설명합니다.</p>';
        html += '</div>';

        html += '<div class="about-grid">';

        // Meta info
        html += '<div class="card">';
        html += '<div class="card-header"><h2>데이터셋 정보</h2></div>';
        html += '<div class="info-grid" style="grid-template-columns:1fr;">';
        html += '<div class="info-item"><span class="info-label">버전</span><span class="info-value">' + Utils.escapeHtml(meta.version) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">생성일</span><span class="info-value">' + Utils.escapeHtml(meta.generated_date) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">총 사업 수</span><span class="info-value">' + (meta.total_programs || '-') + '개</span></div>';
        html += '<div class="info-item"><span class="info-label">설명</span><span class="info-value">' + Utils.escapeHtml(meta.description) + '</span></div>';
        if (meta.note) {
            html += '<div class="info-item"><span class="info-label">비고</span><span class="info-value">' + Utils.escapeHtml(meta.note) + '</span></div>';
        }
        html += '</div>';
        html += '</div>';

        // Domain tags
        html += '<div class="card">';
        html += '<div class="card-header"><h2>도메인 분류 태그</h2></div>';
        html += Components.tagBadges(taxonomy.domain_tags || [], 'badge-domain');
        html += '</div>';

        // Overlap types
        html += '<div class="card">';
        html += '<div class="card-header"><h2>중복 유형</h2></div>';
        html += Components.tagBadges(taxonomy.overlap_types || [], 'badge-overlap');
        html += '</div>';

        // Overlap dimensions
        html += '<div class="card">';
        html += '<div class="card-header"><h2>중복 분석 차원</h2></div>';
        var dimLabels = {
            target_group: '대상 중복 - 수혜자 집단이 겹치는 정도',
            content: '내용 중복 - 교육/훈련/지원 내용의 유사도',
            executing_agency: '수행기관 중복 - 시행주체·참여기관의 동일성',
            region: '지역 중복 - 사업 수행 지역의 겹침 정도'
        };
        html += '<ul class="simple-list">';
        var dims = taxonomy.overlap_dimensions || [];
        for (var d = 0; d < dims.length; d++) {
            html += '<li><strong>' + Utils.escapeHtml(dims[d]) + '</strong>';
            if (dimLabels[dims[d]]) html += ' &mdash; ' + Utils.escapeHtml(dimLabels[dims[d]]);
            html += '</li>';
        }
        html += '</ul>';
        html += '</div>';

        html += '</div>'; // end about-grid

        // Methodology
        html += '<div class="card" style="margin-top:var(--space-md);">';
        html += '<div class="card-header"><h2>분석 방법론</h2></div>';
        html += '<p style="font-size:var(--font-size-sm);line-height:1.8;">본 데이터는 정부 예산사업 간의 중복도를 4가지 차원(대상, 내용, 수행기관, 지역)에서 분석한 결과입니다. ';
        html += '각 차원별로 0~1 사이의 점수를 산출하며, 종합 점수는 차원별 점수의 가중 평균으로 계산됩니다. ';
        html += '점수가 높을수록 두 사업 간의 중복도가 높음을 의미합니다.</p>';
        html += '<div style="margin-top:var(--space-md);">';
        html += '<p style="font-size:var(--font-size-sm);"><strong>점수 해석 기준:</strong></p>';
        html += '<ul class="simple-list">';
        html += '<li><span class="score-cell low" style="margin-right:8px;">0% ~ 30%</span> 낮은 중복도</li>';
        html += '<li><span class="score-cell mid" style="margin-right:8px;">30% ~ 60%</span> 중간 중복도</li>';
        html += '<li><span class="score-cell high" style="margin-right:8px;">60% ~ 100%</span> 높은 중복도</li>';
        html += '</ul>';
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
    }
};
