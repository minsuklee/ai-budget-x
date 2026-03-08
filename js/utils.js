var Utils = {
    formatBudget: function(millionWon) {
        if (millionWon === null || millionWon === undefined) return '-';
        var eok = millionWon / 100;
        if (eok >= 1) return eok.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '억원';
        return millionWon.toLocaleString('ko-KR') + '백만원';
    },

    formatBudgetDetail: function(millionWon) {
        if (millionWon === null || millionWon === undefined) return '-';
        return millionWon.toLocaleString('ko-KR') + '백만원';
    },

    formatScore: function(score) {
        if (score === null || score === undefined) return '-';
        return score.toFixed(1);
    },

    formatScorePercent: function(score) {
        if (score === null || score === undefined) return '-';
        return (score * 100).toFixed(0) + '%';
    },

    // Score 5~10 scale
    getScoreColor: function(score) {
        if (score >= 8) return 'var(--score-high)';
        if (score >= 6) return 'var(--score-mid)';
        return 'var(--score-low)';
    },

    getScoreClass: function(score) {
        if (score >= 8) return 'high';
        if (score >= 6) return 'mid';
        return 'low';
    },

    // Sub-score 0~1 scale
    getSubScoreColor: function(score) {
        if (score >= 0.7) return 'var(--score-high)';
        if (score >= 0.4) return 'var(--score-mid)';
        return 'var(--score-low)';
    },

    getSubScoreClass: function(score) {
        if (score >= 0.7) return 'high';
        if (score >= 0.4) return 'mid';
        return 'low';
    },

    debounce: function(fn, ms) {
        if (ms === undefined) ms = 300;
        var timer;
        return function() {
            var args = arguments;
            var self = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(self, args); }, ms);
        };
    },

    escapeHtml: function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    truncate: function(str, len) {
        if (!str) return '';
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    }
};
