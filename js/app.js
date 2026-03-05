var App = {
    init: function() {
        var self = this;

        // Mobile nav toggle
        var toggle = document.querySelector('.nav-toggle');
        var navLinks = document.querySelector('.nav-links');
        if (toggle && navLinks) {
            toggle.addEventListener('click', function() {
                navLinks.classList.toggle('open');
            });
            // Close nav when a link is clicked
            var links = navLinks.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', function() {
                    navLinks.classList.remove('open');
                });
            }
        }

        // Determine base path for data file
        var dataPath = 'data/gov_program_overlap_data.json';

        DataStore.load(dataPath).then(function() {
            // Update footer version
            var meta = DataStore.getMeta();
            var versionEl = document.getElementById('data-version');
            if (versionEl) versionEl.textContent = meta.version + ' (' + meta.generated_date + ')';

            // Start routing
            self.route();
            window.addEventListener('hashchange', function() {
                self.route();
            });
        }).catch(function(err) {
            var el = document.getElementById('app-content');
            if (el) {
                el.innerHTML = '<div class="error-state">' +
                    '<h2>데이터 로딩 실패</h2>' +
                    '<p>데이터 파일을 불러올 수 없습니다.</p>' +
                    '<p style="color:var(--text-secondary);font-size:var(--font-size-sm);">' + Utils.escapeHtml(err.message) + '</p>' +
                    '<p style="margin-top:16px;"><button onclick="location.reload()" class="btn-secondary">다시 시도</button></p>' +
                    '</div>';
            }
        });
    },

    route: function() {
        var hash = location.hash || '#/';

        // Scroll to top on navigation
        window.scrollTo(0, 0);

        var parsed = this._parseHash(hash);
        var path = parsed.path;
        var id = parsed.id;

        switch (path) {
            case '/':
            case '/programs':
                Views.renderProgramList();
                this._updateNav('programs');
                break;
            case '/program':
                Views.renderProgramDetail(id);
                this._updateNav('programs');
                break;
            case '/overlaps':
                Views.renderOverlapList();
                this._updateNav('overlaps');
                break;
            case '/overlap':
                Views.renderOverlapDetail(id);
                this._updateNav('overlaps');
                break;
            case '/about':
                Views.renderAbout();
                this._updateNav('about');
                break;
            default:
                Views.renderProgramList();
                this._updateNav('programs');
        }
    },

    _parseHash: function(hash) {
        // Remove leading #
        var raw = hash.replace(/^#/, '');
        // Match pattern: /path/id or /path
        var parts = raw.split('/').filter(function(s) { return s !== ''; });

        if (parts.length === 0) {
            return { path: '/', id: null };
        }
        if (parts.length === 1) {
            return { path: '/' + parts[0], id: null };
        }
        // /program/MOEL-1151-352 or /overlap/OVL-001
        return { path: '/' + parts[0], id: parts.slice(1).join('/') };
    },

    _updateNav: function(active) {
        var links = document.querySelectorAll('.nav-links a[data-nav]');
        for (var i = 0; i < links.length; i++) {
            var nav = links[i].getAttribute('data-nav');
            if (nav === active) {
                links[i].classList.add('active');
            } else {
                links[i].classList.remove('active');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
