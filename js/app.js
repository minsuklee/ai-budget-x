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
            var links = navLinks.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', function() {
                    navLinks.classList.remove('open');
                });
            }
        }

        DataStore.load('data/similarity_analysis.json').then(function() {
            var meta = DataStore.getMeta();
            var versionEl = document.getElementById('data-version');
            if (versionEl) versionEl.textContent = 'v' + meta.version + ' (' + (meta.generated_at || '').split('T')[0] + ')';

            self.route();
            window.addEventListener('hashchange', function() { self.route(); });
        }).catch(function(err) {
            var el = document.getElementById('app-content');
            if (el) {
                el.innerHTML = '<div class="error-state">' +
                    '<h2>데이터 로딩 실패</h2>' +
                    '<p>' + Utils.escapeHtml(err.message) + '</p>' +
                    '<p style="margin-top:16px;"><button onclick="location.reload()" class="btn-secondary">다시 시도</button></p>' +
                    '</div>';
            }
        });
    },

    route: function() {
        var hash = location.hash || '#/';
        window.scrollTo(0, 0);

        var parsed = this._parseHash(hash);
        var path = parsed.path;
        var id = parsed.id;

        switch (path) {
            case '/':
            case '/pairs':
                Views.renderPairList();
                this._updateNav('pairs');
                break;
            case '/pair':
                Views.renderPairDetail(id);
                this._updateNav('pairs');
                break;
            case '/clusters':
                Views.renderClusters();
                this._updateNav('clusters');
                break;
            case '/cluster':
                Views.renderClusterDetail(id);
                this._updateNav('clusters');
                break;
            case '/stats':
                Views.renderStats();
                this._updateNav('stats');
                break;
            default:
                Views.renderPairList();
                this._updateNav('pairs');
        }
    },

    _parseHash: function(hash) {
        var raw = hash.replace(/^#/, '');
        var parts = raw.split('/').filter(function(s) { return s !== ''; });
        if (parts.length === 0) return { path: '/', id: null };
        if (parts.length === 1) return { path: '/' + parts[0], id: null };
        return { path: '/' + parts[0], id: parts.slice(1).join('/') };
    },

    _updateNav: function(active) {
        var links = document.querySelectorAll('.nav-links a[data-nav]');
        for (var i = 0; i < links.length; i++) {
            var nav = links[i].getAttribute('data-nav');
            links[i].classList.toggle('active', nav === active);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() { App.init(); });
