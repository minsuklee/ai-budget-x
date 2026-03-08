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
    },

    // Code-to-label mappings
    codeLabels: {
        D01: '반도체/소자', D02: '데이터/클라우드', D03: '로봇/자율주행',
        D04: '바이오/헬스케어', D05: '제조/스마트팩토리', D06: '에너지',
        D07: '환경/기후', D08: '국방/안보', D09: '교통/물류',
        D10: '해양/수산', D11: '농업/식품', D12: '우주/항공',
        D13: '보안/사이버', D14: '콘텐츠/미디어', D15: '건설/도시',
        D16: '금융', D17: '양자', D18: '교육(도메인)',
        D20: 'AI/SW(공통)', D98: '기타/범용(재난·안전)', D99: '기타/범용(복지·돌봄·사회)',
        T01: '기초·원천 연구', T02: '응용·개발 연구', T03: '실증·시범',
        T04: '인력양성(학위과정)', T05: '인력양성(비학위/직업훈련)',
        T06: '인프라·플랫폼 구축', T07: '데이터 구축·개방', T08: '표준·인증·규제',
        T98: '기타(복합)', T99: '기타',
        F01: 'AI/SW 개발', F02: '데이터 분석/과학', F03: '반도체/전자',
        F04: '바이오/헬스', F05: '로봇/자율주행', F06: '제조/스마트팩토리',
        F07: '콘텐츠/미디어', F08: '보안/사이버', F09: '에너지/환경',
        F10: '국방/안보', F11: '농업/식품', F12: '금융/핀테크',
        F13: '교통/물류/건설', F14: '해양/우주/항공', F15: '디지털 전환 일반',
        A01: '대학', A02: '출연(연)', A03: '민간기업', A04: '공공기관',
        A05: '직접수행(정부)', A99: '불특정/혼합',
        B01: '대학생', B02: '대학원생', B03: '구직자·실업자',
        B04: '재직자', B05: '중소·중견기업', B06: '대기업·산업계',
        B07: '연구자·연구기관', B08: '공공기관·정부', B09: '국민 일반',
        B10: '특수 집단', B99: '불특정/해당없음'
    },

    getCodeLabel: function(code) {
        if (!code) return '';
        // Handle "D01-반도체/소자" format — already has label
        var dashIdx = code.indexOf('-');
        if (dashIdx > 0) {
            var prefix = code.substring(0, dashIdx);
            if (this.codeLabels[prefix]) return this.codeLabels[prefix];
            return code.substring(dashIdx + 1);
        }
        return this.codeLabels[code] || code;
    },

    codedValue: function(code) {
        if (!code) return '';
        var label = this.getCodeLabel(code);
        var display = this.escapeHtml(code);
        if (label && label !== code) {
            return '<span class="coded-value" title="' + this.escapeHtml(label) + '">' + display + '</span>';
        }
        return display;
    }
};
