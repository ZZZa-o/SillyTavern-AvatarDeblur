/**
 * SillyTavern Avatar Deblur
 * ------------------------------------------------------------
 * 拦截所有 /thumbnail?type=xxx&file=yyy 请求，重写为直接指向原图的路径，
 * 绕过后端的缩略图压缩，彻底解决头像 / 背景模糊的问题。
 *
 * type=avatar   -> /characters/<file>
 * type=bg       -> /backgrounds/<file>
 * type=persona  -> /User Avatars/<file>
 *
 * 纯前端实现，不修改 config.yaml，不依赖任何后端改动。
 */

(function () {
    'use strict';

    const TAG = '[Avatar Deblur]';

    // thumbnail type -> 真实资料夹
    const TYPE_MAP = {
        avatar: 'characters',
        bg: 'backgrounds',
        persona: 'User Avatars',
    };

    /**
     * 把 /thumbnail?type=...&file=... 改写成直链
     */
    function rewriteUrl(url) {
        try {
            if (!url || typeof url !== 'string') return url;
            if (url.indexOf('/thumbnail') === -1) return url;

            // 支援相对 / 绝对 URL
            const u = new URL(url, window.location.origin);
            if (!u.pathname.endsWith('/thumbnail')) return url;

            const type = u.searchParams.get('type');
            const file = u.searchParams.get('file');
            if (!type || !file) return url;

            const folder = TYPE_MAP[type];
            if (!folder) return url;

            // file 已是 encodeURIComponent 过的字串，直接拼即可
            return `/${encodeURIComponent(folder)}/${file}`;
        } catch (e) {
            return url;
        }
    }

    /**
     * 从 CSS background-image 值里抽 url(...) 并改写
     */
    function rewriteBackgroundImage(value) {
        if (!value || value.indexOf('/thumbnail') === -1) return value;
        return value.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, raw) => {
            const nu = rewriteUrl(raw);
            return `url(${quote}${nu}${quote})`;
        });
    }

    function processImg(img) {
        const src = img.getAttribute('src');
        if (!src) return;
        const ns = rewriteUrl(src);
        if (ns !== src) img.setAttribute('src', ns);
    }

    function processBg(el) {
        if (!el.style) return;
        const bg = el.style.backgroundImage;
        if (!bg) return;
        const nb = rewriteBackgroundImage(bg);
        if (nb !== bg) el.style.backgroundImage = nb;
    }

    function processElement(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.tagName === 'IMG') processImg(el);
        processBg(el);
        if (el.querySelectorAll) {
            el.querySelectorAll('img').forEach(processImg);
            el.querySelectorAll('[style*="thumbnail"]').forEach(processBg);
        }
    }

    function initialSweep() {
        document.querySelectorAll('img').forEach(processImg);
        document.querySelectorAll('[style*="thumbnail"]').forEach(processBg);
    }

    // --- MutationObserver: 覆盖之后动态插入 / 修改的节点 ---
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList') {
                m.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) processElement(node);
                });
            } else if (m.type === 'attributes') {
                const t = m.target;
                if (m.attributeName === 'src' && t.tagName === 'IMG') {
                    processImg(t);
                } else if (m.attributeName === 'style') {
                    processBg(t);
                }
            }
        }
    });

    // --- 拦截 fetch 作为保险（极少数用 fetch 预载的情境） ---
    const origFetch = window.fetch;
    if (typeof origFetch === 'function') {
        window.fetch = function (input, init) {
            try {
                if (typeof input === 'string') {
                    input = rewriteUrl(input);
                } else if (input && input.url) {
                    const nu = rewriteUrl(input.url);
                    if (nu !== input.url) {
                        input = new Request(nu, input);
                    }
                }
            } catch (e) { /* noop */ }
            return origFetch.call(this, input, init);
        };
    }

    function start() {
        initialSweep();
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style'],
        });
        console.log(`${TAG} loaded — bypassing /thumbnail for avatar / bg / persona`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
