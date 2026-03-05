var DataStore = {
    raw: null,
    programMap: {},
    overlapMap: {},

    async load(url) {
        var resp = await fetch(url);
        if (!resp.ok) throw new Error('데이터 로딩 실패: ' + resp.status);
        this.raw = await resp.json();
        this._buildMaps();
    },

    _buildMaps: function() {
        this.programMap = {};
        this.overlapMap = {};
        var programs = this.raw.programs || [];
        for (var i = 0; i < programs.length; i++) {
            this.programMap[programs[i].program_id] = programs[i];
        }
        var overlaps = this.raw.overlap_analysis || [];
        for (var j = 0; j < overlaps.length; j++) {
            this.overlapMap[overlaps[j].overlap_id] = overlaps[j];
        }
    },

    getPrograms: function(filters, search, sort) {
        if (!filters) filters = {};
        if (!search) search = '';
        if (!sort) sort = {};

        var results = (this.raw.programs || []).slice();

        if (search) {
            var q = search.toLowerCase();
            results = results.filter(function(p) {
                var searchable = [
                    p.program_name || '',
                    p.ministry || '',
                    p.department || '',
                    p.fund_source || '',
                    p.budget_field || '',
                    p.budget_sector || ''
                ]
                .concat(p.target_groups || [])
                .concat(p.keywords || [])
                .concat(p.domain_tags || [])
                .join(' ').toLowerCase();
                return searchable.indexOf(q) !== -1;
            });
        }

        if (filters.ministry) {
            results = results.filter(function(p) {
                return p.ministry === filters.ministry;
            });
        }

        if (filters.domain_tag) {
            results = results.filter(function(p) {
                return (p.domain_tags || []).indexOf(filters.domain_tag) !== -1;
            });
        }

        if (filters.budget_sector) {
            results = results.filter(function(p) {
                return p.budget_sector === filters.budget_sector;
            });
        }

        if (sort.field) {
            var dir = sort.dir === 'asc' ? 1 : -1;
            var field = sort.field;
            results.sort(function(a, b) {
                var va = a[field];
                var vb = b[field];
                if (va === null || va === undefined) va = '';
                if (vb === null || vb === undefined) vb = '';
                if (typeof va === 'number' && typeof vb === 'number') {
                    return (va - vb) * dir;
                }
                return String(va).localeCompare(String(vb), 'ko') * dir;
            });
        }

        return results;
    },

    getProgram: function(id) {
        return this.programMap[id] || null;
    },

    getOverlapsForProgram: function(programId) {
        var ids = (this.raw.indexes && this.raw.indexes.overlap_by_program)
            ? (this.raw.indexes.overlap_by_program[programId] || [])
            : [];
        var self = this;
        return ids.map(function(id) { return self.overlapMap[id]; }).filter(Boolean);
    },

    getOverlapCount: function(programId) {
        if (!this.raw.indexes || !this.raw.indexes.overlap_by_program) return 0;
        return (this.raw.indexes.overlap_by_program[programId] || []).length;
    },

    getOverlaps: function(sort, minScore) {
        if (!sort) sort = {};
        if (minScore === undefined) minScore = 0;

        var results = (this.raw.overlap_analysis || []).filter(function(o) {
            return o.overlap_score >= minScore;
        });

        if (sort.field) {
            var dir = sort.dir === 'asc' ? 1 : -1;
            var field = sort.field;
            results.sort(function(a, b) {
                var va, vb;
                if (field === 'overlap_score') {
                    va = a.overlap_score;
                    vb = b.overlap_score;
                } else if (field === 'program_a_name') {
                    var pa = DataStore.programMap[a.program_a];
                    var pb = DataStore.programMap[b.program_a];
                    va = pa ? pa.program_name : '';
                    vb = pb ? pb.program_name : '';
                } else if (field === 'program_b_name') {
                    var pa2 = DataStore.programMap[a.program_b];
                    var pb2 = DataStore.programMap[b.program_b];
                    va = pa2 ? pa2.program_name : '';
                    vb = pb2 ? pb2.program_name : '';
                } else {
                    va = a[field];
                    vb = b[field];
                }
                if (va === null || va === undefined) va = '';
                if (vb === null || vb === undefined) vb = '';
                if (typeof va === 'number' && typeof vb === 'number') {
                    return (va - vb) * dir;
                }
                return String(va).localeCompare(String(vb), 'ko') * dir;
            });
        } else {
            // Default: sort by overlap_score descending
            results.sort(function(a, b) {
                return b.overlap_score - a.overlap_score;
            });
        }

        return results;
    },

    getOverlap: function(id) {
        return this.overlapMap[id] || null;
    },

    getFilterOptions: function() {
        var ministries = {};
        var sectors = {};
        var programs = this.raw.programs || [];
        for (var i = 0; i < programs.length; i++) {
            var p = programs[i];
            if (p.ministry) ministries[p.ministry] = true;
            if (p.budget_sector) sectors[p.budget_sector] = true;
        }
        return {
            ministries: Object.keys(ministries).sort(),
            domain_tags: (this.raw.taxonomy && this.raw.taxonomy.domain_tags) || [],
            budget_sectors: Object.keys(sectors).sort()
        };
    },

    getMeta: function() {
        return this.raw.meta || {};
    },

    getTaxonomy: function() {
        return this.raw.taxonomy || {};
    },

    getTotalBudget: function(programs) {
        var total = 0;
        for (var i = 0; i < programs.length; i++) {
            var b = programs[i].budget_2026_million_won;
            if (b !== null && b !== undefined) total += b;
        }
        return total;
    }
};
