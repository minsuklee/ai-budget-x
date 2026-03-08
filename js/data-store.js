var DataStore = {
    raw: null,
    pairMap: {},

    load: async function(url) {
        var resp = await fetch(url);
        if (!resp.ok) throw new Error('데이터 로딩 실패: ' + resp.status);
        this.raw = await resp.json();
        this._buildMaps();
    },

    _buildMaps: function() {
        this.pairMap = {};
        var pairs = this.raw.pairs || [];
        for (var i = 0; i < pairs.length; i++) {
            this.pairMap[pairs[i].pair_id] = pairs[i];
        }
    },

    getPairs: function(filters, search, sort) {
        if (!filters) filters = {};
        if (!search) search = '';
        if (!sort) sort = {};

        var results = (this.raw.pairs || []).slice();

        if (search) {
            var q = search.toLowerCase();
            results = results.filter(function(p) {
                var searchable = [
                    p.project_a.project_name || '',
                    p.project_a.sub_project_name || '',
                    p.project_a.department || '',
                    p.project_a.division || '',
                    p.project_b.project_name || '',
                    p.project_b.sub_project_name || '',
                    p.project_b.department || '',
                    p.project_b.division || ''
                ].join(' ').toLowerCase();
                return searchable.indexOf(q) !== -1;
            });
        }

        if (filters.department) {
            results = results.filter(function(p) {
                return p.project_a.department === filters.department ||
                       p.project_b.department === filters.department;
            });
        }

        if (filters.minScore !== undefined && filters.minScore > 0) {
            var min = filters.minScore;
            results = results.filter(function(p) {
                return p.similarity_score >= min;
            });
        }

        if (sort.field) {
            var dir = sort.dir === 'asc' ? 1 : -1;
            var field = sort.field;
            results.sort(function(a, b) {
                var va, vb;
                if (field === 'similarity_score') {
                    va = a.similarity_score; vb = b.similarity_score;
                } else if (field === 'project_a_name') {
                    va = a.project_a.sub_project_name; vb = b.project_a.sub_project_name;
                } else if (field === 'project_b_name') {
                    va = a.project_b.sub_project_name; vb = b.project_b.sub_project_name;
                } else if (field === 'dept_a') {
                    va = a.project_a.department; vb = b.project_a.department;
                } else if (field === 'budget_sum') {
                    va = (a.project_a.budget_2026 || 0) + (a.project_b.budget_2026 || 0);
                    vb = (b.project_a.budget_2026 || 0) + (b.project_b.budget_2026 || 0);
                } else {
                    va = a[field]; vb = b[field];
                }
                if (va === null || va === undefined) va = '';
                if (vb === null || vb === undefined) vb = '';
                if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
                return String(va).localeCompare(String(vb), 'ko') * dir;
            });
        } else {
            results.sort(function(a, b) { return b.similarity_score - a.similarity_score; });
        }

        return results;
    },

    getPair: function(id) {
        return this.pairMap[id] || null;
    },

    getClusters: function() {
        return this.raw.clusters || [];
    },

    getCluster: function(id) {
        var clusters = this.raw.clusters || [];
        for (var i = 0; i < clusters.length; i++) {
            if (clusters[i].cluster_id === id) return clusters[i];
        }
        return null;
    },

    getFilterOptions: function() {
        var depts = {};
        var pairs = this.raw.pairs || [];
        for (var i = 0; i < pairs.length; i++) {
            if (pairs[i].project_a.department) depts[pairs[i].project_a.department] = true;
            if (pairs[i].project_b.department) depts[pairs[i].project_b.department] = true;
        }
        return {
            departments: Object.keys(depts).sort()
        };
    },

    getMeta: function() {
        return this.raw.metadata || {};
    },

    getSummaryStats: function() {
        return this.raw.summary_statistics || {};
    }
};
