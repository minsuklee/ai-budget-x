const Utils = {
    formatBudget(millionWon) {
        if (millionWon === null || millionWon === undefined) return '-';
        const eok = millionWon / 100;
        return eok.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '억원';
    },

    formatBudgetDetail(millionWon) {
        if (millionWon === null || millionWon === undefined) return '-';
        return millionWon.toLocaleString('ko-KR') + '백만원';
    },

    formatChangeRate(rate) {
        if (rate === null || rate === undefined) return '-';
        const sign = rate > 0 ? '+' : '';
        const cls = rate > 0 ? 'change-up' : rate < 0 ? 'change-down' : 'change-flat';
        const arrow = rate > 0 ? '\u25B2' : rate < 0 ? '\u25BC' : '';
        return '<span class="' + cls + '">' + arrow + ' ' + sign + rate + '%</span>';
    },

    formatScore(score) {
        if (score === null || score === undefined) return '-';
        return (score * 100).toFixed(0) + '%';
    },

    getScoreColor(score) {
        if (score >= 0.6) return 'var(--score-high)';
        if (score >= 0.3) return 'var(--score-mid)';
        return 'var(--score-low)';
    },

    getScoreClass(score) {
        if (score >= 0.6) return 'high';
        if (score >= 0.3) return 'mid';
        return 'low';
    },

    debounce(fn, ms) {
        if (ms === undefined) ms = 300;
        var timer;
        return function() {
            var args = arguments;
            var self = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(self, args); }, ms);
        };
    },

    escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    truncate(str, len) {
        if (!str) return '';
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    }
};
