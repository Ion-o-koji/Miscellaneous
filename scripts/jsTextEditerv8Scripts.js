
    eruda.init()

  

    /**
     * AutoSwipe v2.1 — Autocomplete for contenteditable <pre> editors
     *
     * Designed to integrate with editors that use:
     *   - A <pre contenteditable> for input (transparent text)
     *   - A separate <pre> overlay for syntax highlighting
     *
     * Ghost text is injected into the highlight overlay so it never
     * corrupts the actual editor content.
     *
     * Usage:
     *   AutoSwipe.init({
     *     editor: '#editor',              // contenteditable element
     *     highlighter: '#highlighted',    // syntax highlight overlay
     *     language: 'auto',
     *     getContent: () => editor.innerText,
     *     onAccept: (text) => { ... }
     *   });
     */
    (function(root, factory) {
      if (typeof define === 'function' && define.amd) define([], factory);
      else if (typeof module === 'object' && module.exports) module.exports = factory();
      else root.AutoSwipe = factory();
    }(typeof self !== 'undefined' ? self : this, function() {
      'use strict';

      /* ══════════════════════════════════════════
         DICTIONARIES
         ══════════════════════════════════════════ */

      const DICT = {
        html: {
          tags: [
            'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'form', 'input', 'button',
            'textarea', 'select', 'option', 'optgroup', 'label', 'fieldset', 'legend',
            'video', 'audio', 'source', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polygon',
            'details', 'summary', 'dialog', 'template', 'slot', 'picture',
            'figure', 'figcaption', 'mark', 'time', 'progress', 'meter',
            'iframe', 'embed', 'object', 'script', 'style', 'link', 'meta',
            'html', 'head', 'body', 'title', 'base', 'noscript',
            'br', 'hr', 'wbr', 'pre', 'code', 'blockquote', 'cite',
            'strong', 'em', 'b', 'i', 'u', 'small', 'sub', 'sup', 'del', 'ins',
            'abbr', 'address', 'bdo', 'map', 'area', 'col', 'colgroup',
            'datalist', 'output', 'ruby', 'rt', 'rp', 'data', 'track', 'param',
          ],
          attributes: [
            'class', 'id', 'style', 'src', 'href', 'alt', 'title', 'type', 'name',
            'value', 'placeholder', 'action', 'method', 'target', 'rel',
            'width', 'height', 'disabled', 'readonly', 'required', 'checked',
            'selected', 'multiple', 'autofocus', 'autocomplete', 'novalidate',
            'min', 'max', 'step', 'pattern', 'maxlength', 'minlength',
            'for', 'tabindex', 'role', 'aria-label', 'aria-hidden', 'aria-describedby',
            'aria-expanded', 'aria-controls', 'aria-live', 'aria-atomic',
            'data-', 'hidden', 'contenteditable', 'draggable', 'spellcheck',
            'loading', 'decoding', 'fetchpriority', 'crossorigin', 'integrity',
            'sandbox', 'allow', 'allowfullscreen', 'autoplay', 'controls', 'loop', 'muted',
            'poster', 'preload', 'sizes', 'srcset', 'media', 'colspan', 'rowspan',
            'scope', 'headers', 'wrap', 'rows', 'cols', 'accept', 'capture',
            'formaction', 'formmethod', 'formtarget', 'formnovalidate', 'formenctype',
            'dirname', 'list', 'form', 'enctype', 'download', 'ping', 'referrerpolicy',
            'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
            'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
            'points', 'transform', 'opacity',
          ],
          snippets: {
            '<!do': '<!DOCTYPE html>',
            '<!doctype': '<!DOCTYPE html>',
            '<html': '<html lang="en">',
            '<meta char': '<meta charset="UTF-8">',
            '<meta view': '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<link css': '<link rel="stylesheet" href="">',
            '<link rel="stylesheet"': '<link rel="stylesheet" href="">',
            '<link icon': '<link rel="icon" href="" type="image/x-icon">',
            '<script src': '<script src=""><\/script>',
            '<a href': '<a href=""></a>',
            '<img src': '<img src="" alt="">',
            '<input type="text"': '<input type="text" name="" id="" placeholder="">',
            '<input type="email"': '<input type="email" name="" id="" placeholder="">',
            '<input type="password"': '<input type="password" name="" id="">',
            '<input type="submit"': '<input type="submit" value="">',
            '<input type="checkbox"': '<input type="checkbox" name="" id="">',
            '<input type="radio"': '<input type="radio" name="" id="" value="">',
            '<input type="number"': '<input type="number" name="" id="" min="" max="">',
            '<input type="range"': '<input type="range" name="" id="" min="" max="">',
            '<input type="file"': '<input type="file" name="" id="" accept="">',
            '<input type="hidden"': '<input type="hidden" name="" value="">',
            '<input type="date"': '<input type="date" name="" id="">',
            '<input type="color"': '<input type="color" name="" id="">',
            '<form': '<form action="" method="post">\n  \n</form>',
            '<select': '<select name="" id="">\n  <option value="">Select</option>\n</select>',
            '<table': '<table>\n  <thead>\n    <tr>\n      <th></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td></td>\n    </tr>\n  </tbody>\n</table>',
            '<ul': '<ul>\n  <li></li>\n</ul>',
            '<ol': '<ol>\n  <li></li>\n</ol>',
            '<video src': '<video src="" controls></video>',
            '<audio src': '<audio src="" controls></audio>',
            '<picture': '<picture>\n  <source srcset="" type="">\n  <img src="" alt="">\n</picture>',
            '<details': '<details>\n  <summary></summary>\n  \n</details>',
            '<dialog': '<dialog id="">\n  \n</dialog>',
            '<template': '<template id="">\n  \n</template>',
            '<svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  \n</svg>',
            '<canvas': '<canvas id="" width="" height=""></canvas>',
            'html5': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
            'html:5': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
          }
        },

        css: {
          properties: [
            'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'inset',
            'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
            'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'margin-block', 'margin-inline',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'padding-block', 'padding-inline',
            'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
            'border-width', 'border-style', 'border-color', 'border-radius',
            'border-top-left-radius', 'border-top-right-radius',
            'border-bottom-left-radius', 'border-bottom-right-radius',
            'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
            'background', 'background-color', 'background-image', 'background-size',
            'background-position', 'background-repeat', 'background-attachment',
            'background-clip', 'background-origin', 'background-blend-mode',
            'color', 'opacity', 'visibility',
            'font', 'font-family', 'font-size', 'font-weight', 'font-style',
            'font-variant', 'font-stretch', 'font-display',
            'line-height', 'letter-spacing', 'word-spacing', 'text-align',
            'text-decoration', 'text-transform', 'text-indent', 'text-shadow',
            'text-overflow', 'white-space', 'word-break', 'word-wrap', 'overflow-wrap',
            'vertical-align', 'direction', 'writing-mode',
            'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'flex-grow',
            'flex-shrink', 'flex-basis', 'justify-content', 'align-items',
            'align-content', 'align-self', 'order', 'gap', 'row-gap', 'column-gap',
            'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
            'grid-template-areas', 'grid-column', 'grid-row', 'grid-area',
            'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
            'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
            'place-items', 'place-content', 'place-self',
            'transform', 'transform-origin', 'transition', 'transition-property',
            'transition-duration', 'transition-timing-function', 'transition-delay',
            'animation', 'animation-name', 'animation-duration',
            'animation-timing-function', 'animation-delay', 'animation-iteration-count',
            'animation-direction', 'animation-fill-mode', 'animation-play-state',
            'box-shadow', 'box-sizing', 'cursor', 'pointer-events', 'user-select',
            'resize', 'appearance', 'filter', 'backdrop-filter', 'mix-blend-mode',
            'clip-path', 'mask', 'object-fit', 'object-position',
            'scroll-behavior', 'scroll-snap-type', 'scroll-snap-align',
            'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
            'table-layout', 'border-collapse', 'border-spacing', 'caption-side',
            'content', 'counter-reset', 'counter-increment',
            'will-change', 'contain', 'isolation', 'aspect-ratio',
            'accent-color', 'caret-color', 'color-scheme',
            'container-type', 'container-name',
            '-webkit-overflow-scrolling', 'touch-action',
            '-webkit-tap-highlight-color', '-webkit-text-fill-color',
          ],
          values: {
            'display': ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'table', 'table-row', 'table-cell', 'list-item', 'flow-root'],
            'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
            'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
            'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
            'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'start', 'end'],
            'align-items': ['stretch', 'flex-start', 'flex-end', 'center', 'baseline', 'start', 'end'],
            'align-content': ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
            'text-align': ['left', 'right', 'center', 'justify', 'start', 'end'],
            'text-decoration': ['none', 'underline', 'overline', 'line-through'],
            'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
            'overflow': ['visible', 'hidden', 'scroll', 'auto', 'clip'],
            'cursor': ['pointer', 'default', 'auto', 'move', 'text', 'wait', 'help', 'crosshair', 'not-allowed', 'grab', 'grabbing', 'col-resize', 'row-resize', 'zoom-in', 'zoom-out', 'none'],
            'font-weight': ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
            'font-style': ['normal', 'italic', 'oblique'],
            'visibility': ['visible', 'hidden', 'collapse'],
            'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],
            'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
            'box-sizing': ['content-box', 'border-box'],
            'border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
            'background-size': ['auto', 'cover', 'contain'],
            'background-repeat': ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'],
            'background-position': ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'],
            'object-fit': ['fill', 'contain', 'cover', 'none', 'scale-down'],
            'grid-auto-flow': ['row', 'column', 'dense', 'row dense', 'column dense'],
            'list-style-type': ['none', 'disc', 'circle', 'square', 'decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman'],
            'animation-fill-mode': ['none', 'forwards', 'backwards', 'both'],
            'animation-direction': ['normal', 'reverse', 'alternate', 'alternate-reverse'],
            'scroll-behavior': ['auto', 'smooth'],
            'resize': ['none', 'both', 'horizontal', 'vertical'],
            'user-select': ['auto', 'none', 'text', 'all'],
            'pointer-events': ['auto', 'none'],
            'appearance': ['none', 'auto'],
            'touch-action': ['auto', 'none', 'manipulation', 'pan-x', 'pan-y', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'pinch-zoom'],
          },
          snippets: {
            'flexcenter': 'display: flex;\n  justify-content: center;\n  align-items: center;',
            'gridcenter': 'display: grid;\n  place-items: center;',
            'flexcolumn': 'display: flex;\n  flex-direction: column;',
            'flexbetween': 'display: flex;\n  justify-content: space-between;\n  align-items: center;',
            'absolute-fill': 'position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;',
            'absolute-center': 'position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);',
            'fixed-fill': 'position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;',
            'truncate': 'overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;',
            'line-clamp': 'display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;',
            'visually-hidden': 'position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0,0,0,0);\n  border: 0;',
            'no-scrollbar': 'scrollbar-width: none;\n  -ms-overflow-style: none;',
            'smooth-scroll': 'scroll-behavior: smooth;',
            'reset-button': 'appearance: none;\n  background: none;\n  border: none;\n  padding: 0;\n  cursor: pointer;',
            'reset-list': 'list-style: none;\n  margin: 0;\n  padding: 0;',
            '@media mobile': '@media (max-width: 768px) {\n  \n}',
            '@media tablet': '@media (max-width: 1024px) {\n  \n}',
            '@media desktop': '@media (min-width: 1025px) {\n  \n}',
            '@media dark': '@media (prefers-color-scheme: dark) {\n  \n}',
            '@media light': '@media (prefers-color-scheme: light) {\n  \n}',
            '@media reduced': '@media (prefers-reduced-motion: reduce) {\n  \n}',
            '@media print': '@media print {\n  \n}',
            '@keyframes': '@keyframes name {\n  0% {\n    \n  }\n  100% {\n    \n  }\n}',
            '@font-face': '@font-face {\n  font-family: "";\n  src: url("") format("");\n  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}',
            '@container': '@container (min-width: ) {\n  \n}',
            '@import': '@import url("");',
            '@layer': '@layer name {\n  \n}',
            ':root': ':root {\n  --: ;\n}',
            'var(': 'var(--)',
            'calc(': 'calc()',
            'clamp(': 'clamp(, , )',
            'min(': 'min(, )',
            'max(': 'max(, )',
            'linear-gradient': 'linear-gradient(to right, , )',
            'radial-gradient': 'radial-gradient(circle, , )',
            'conic-gradient': 'conic-gradient(from 0deg, , )',
          },
          atRules: ['@media', '@keyframes', '@font-face', '@import', '@supports', '@charset', '@layer', '@container', '@property', '@scope', '@starting-style', '@counter-style'],
          pseudoClasses: [
            ':hover', ':focus', ':active', ':visited', ':first-child', ':last-child',
            ':nth-child()', ':nth-of-type()', ':first-of-type', ':last-of-type',
            ':only-child', ':only-of-type', ':not()', ':is()', ':where()', ':has()',
            ':focus-visible', ':focus-within', ':checked', ':disabled', ':enabled',
            ':required', ':optional', ':valid', ':invalid', ':placeholder-shown',
            ':empty', ':target', ':root', ':lang()',
            '::before', '::after', '::first-line', '::first-letter',
            '::placeholder', '::selection', '::marker', '::backdrop',
            '::file-selector-button',
          ],
        },

        js: {
          keywords: [
            'const', 'let', 'var', 'function', 'return', 'if', 'else', 'else if',
            'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default',
            'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof',
            'in', 'of', 'void', 'this', 'super', 'class', 'extends', 'constructor',
            'static', 'get', 'set', 'async', 'await', 'yield', 'import', 'export',
            'from', 'as', 'debugger',
            'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
          ],
          globals: [
            'console', 'document', 'window', 'navigator', 'location', 'history',
            'localStorage', 'sessionStorage', 'fetch', 'setTimeout', 'setInterval',
            'clearTimeout', 'clearInterval', 'requestAnimationFrame',
            'cancelAnimationFrame', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
            'Symbol', 'Proxy', 'Reflect', 'JSON', 'Math', 'Date', 'RegExp',
            'Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError',
            'Array', 'Object', 'String', 'Number', 'Boolean', 'Function',
            'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response',
            'AbortController', 'AbortSignal', 'Event', 'CustomEvent',
            'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
            'WebSocket', 'Worker', 'Notification', 'BroadcastChannel',
            'TextEncoder', 'TextDecoder', 'Blob', 'File', 'FileReader',
            'crypto', 'performance', 'queueMicrotask', 'structuredClone',
            'MediaMetadata', 'MediaSession',
            'getComputedStyle', 'matchMedia',
            'alert', 'confirm', 'prompt', 'atob', 'btoa',
            'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite',
          ],
          methods: {
            'console': ['log', 'error', 'warn', 'info', 'debug', 'table', 'dir', 'time', 'timeEnd', 'group', 'groupEnd', 'clear', 'assert', 'count', 'trace'],
            'document': ['getElementById', 'getElementsByClassName', 'getElementsByTagName', 'querySelector', 'querySelectorAll', 'createElement', 'createDocumentFragment', 'createTextNode', 'addEventListener', 'removeEventListener', 'createRange', 'execCommand', 'write', 'writeln', 'open', 'close'],
            'Array': ['from', 'isArray', 'of'],
            'Object': ['keys', 'values', 'entries', 'assign', 'freeze', 'seal', 'create', 'defineProperty', 'defineProperties', 'getOwnPropertyNames', 'getOwnPropertyDescriptor', 'getPrototypeOf', 'hasOwn', 'fromEntries', 'groupBy', 'is'],
            'JSON': ['parse', 'stringify'],
            'Math': ['floor', 'ceil', 'round', 'random', 'max', 'min', 'abs', 'pow', 'sqrt', 'log', 'log2', 'log10', 'sin', 'cos', 'tan', 'PI', 'E', 'sign', 'trunc', 'cbrt', 'hypot'],
            'Promise': ['resolve', 'reject', 'all', 'allSettled', 'race', 'any', 'withResolvers'],
            'window': ['addEventListener', 'removeEventListener', 'open', 'close', 'scroll', 'scrollTo', 'scrollBy', 'getComputedStyle', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'alert', 'confirm', 'prompt', 'postMessage', 'focus', 'blur', 'print', 'atob', 'btoa'],
            'navigator': ['clipboard', 'mediaSession', 'serviceWorker', 'geolocation', 'permissions', 'share', 'canShare', 'vibrate', 'sendBeacon', 'userAgent', 'language', 'languages', 'onLine', 'platform', 'maxTouchPoints'],
            'localStorage': ['getItem', 'setItem', 'removeItem', 'clear', 'key'],
            'sessionStorage': ['getItem', 'setItem', 'removeItem', 'clear', 'key'],
          },
          arrayMethods: [
            'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat',
            'join', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes',
            'find', 'findIndex', 'findLast', 'findLastIndex',
            'filter', 'map', 'reduce', 'reduceRight', 'forEach', 'every', 'some',
            'flat', 'flatMap', 'fill', 'copyWithin', 'entries', 'keys', 'values',
            'at', 'with', 'toSorted', 'toReversed', 'toSpliced',
            'length', 'toString',
          ],
          stringMethods: [
            'charAt', 'charCodeAt', 'codePointAt', 'concat', 'includes',
            'endsWith', 'startsWith', 'indexOf', 'lastIndexOf',
            'match', 'matchAll', 'replace', 'replaceAll', 'search',
            'slice', 'split', 'substring', 'toLowerCase', 'toUpperCase',
            'trim', 'trimStart', 'trimEnd', 'padStart', 'padEnd',
            'repeat', 'at', 'normalize', 'localeCompare',
            'length', 'toString',
          ],
          numberMethods: [
            'toFixed', 'toPrecision', 'toString', 'valueOf',
          ],
          domMethods: [
            'querySelector', 'querySelectorAll', 'getElementById',
            'getElementsByClassName', 'getElementsByTagName',
            'addEventListener', 'removeEventListener', 'dispatchEvent',
            'appendChild', 'removeChild', 'replaceChild', 'insertBefore',
            'cloneNode', 'contains', 'closest', 'matches',
            'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute', 'toggleAttribute',
            'classList', 'className', 'innerHTML', 'outerHTML', 'textContent', 'innerText',
            'style', 'dataset', 'children', 'childNodes', 'parentElement', 'parentNode',
            'nextElementSibling', 'previousElementSibling', 'nextSibling', 'previousSibling',
            'firstElementChild', 'lastElementChild', 'firstChild', 'lastChild',
            'append', 'prepend', 'before', 'after', 'remove', 'replaceWith', 'replaceChildren',
            'getBoundingClientRect', 'getClientRects', 'scrollIntoView',
            'focus', 'blur', 'click',
            'offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft', 'offsetParent',
            'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft',
            'clientWidth', 'clientHeight', 'clientTop', 'clientLeft',
            'insertAdjacentHTML', 'insertAdjacentElement', 'insertAdjacentText',
          ],
          classListMethods: [
            'add', 'remove', 'toggle', 'contains', 'replace', 'item', 'entries', 'forEach', 'keys', 'values', 'length', 'value',
          ],
          styleMethods: [
            'cssText', 'setProperty', 'getPropertyValue', 'removeProperty',
            'display', 'position', 'width', 'height', 'margin', 'padding',
            'background', 'backgroundColor', 'color', 'fontSize', 'fontWeight',
            'border', 'borderRadius', 'opacity', 'transform', 'transition',
            'animation', 'zIndex', 'overflow', 'cursor', 'pointerEvents',
            'flexDirection', 'justifyContent', 'alignItems', 'gap',
            'gridTemplateColumns', 'gridTemplateRows',
            'top', 'right', 'bottom', 'left',
            'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
            'textAlign', 'textDecoration', 'lineHeight', 'letterSpacing',
            'boxShadow', 'textShadow', 'outline',
            'visibility', 'userSelect', 'whiteSpace',
          ],
          events: [
            'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
            'mouseenter', 'mouseleave', 'mouseover', 'mouseout',
            'keydown', 'keyup', 'keypress',
            'submit', 'reset', 'change', 'input', 'focus', 'blur', 'focusin', 'focusout',
            'scroll', 'resize', 'load', 'unload', 'error',
            'DOMContentLoaded', 'beforeunload', 'hashchange', 'popstate',
            'touchstart', 'touchmove', 'touchend', 'touchcancel',
            'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
            'drag', 'dragstart', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop',
            'animationstart', 'animationend', 'animationiteration',
            'transitionstart', 'transitionend', 'transitioncancel',
            'contextmenu', 'wheel', 'copy', 'cut', 'paste', 'select',
            'fullscreenchange', 'visibilitychange', 'online', 'offline',
            'storage', 'message', 'beforeinstallprompt',
          ],
          snippets: {
            'function ': 'function name() {\n  \n}',
            'const fn': 'const name = () => {\n  \n};',
            'arrow': '() => {\n  \n}',
            'async function': 'async function name() {\n  \n}',
            'async arrow': 'const name = async () => {\n  \n};',
            'if (': 'if () {\n  \n}',
            'if else': 'if () {\n  \n} else {\n  \n}',
            'for (let': 'for (let i = 0; i < ; i++) {\n  \n}',
            'for...of': 'for (const item of ) {\n  \n}',
            'for...in': 'for (const key in ) {\n  \n}',
            'foreach': '.forEach((item, index) => {\n  \n});',
            'while (': 'while () {\n  \n}',
            'switch (': 'switch () {\n  case :\n    break;\n  default:\n    break;\n}',
            'try {': 'try {\n  \n} catch (error) {\n  console.error(error);\n}',
            'try catch finally': 'try {\n  \n} catch (error) {\n  console.error(error);\n} finally {\n  \n}',
            'class ': 'class Name {\n  constructor() {\n    \n  }\n}',
            'class extends': 'class Name extends Base {\n  constructor() {\n    super();\n    \n  }\n}',
            'import ': 'import {  } from "";',
            'import default': 'import name from "";',
            'export default': 'export default ',
            'export const': 'export const name = ',
            'export function': 'export function name() {\n  \n}',
            'promise': 'new Promise((resolve, reject) => {\n  \n});',
            'settimeout': 'setTimeout(() => {\n  \n}, );',
            'setinterval': 'setInterval(() => {\n  \n}, );',
            'fetch(': "fetch('')\n  .then(res => res.json())\n  .then(data => {\n    \n  })\n  .catch(err => console.error(err));",
            'async fetch': "const response = await fetch('');\nconst data = await response.json();",
            'addeventlistener': "addEventListener('', (e) => {\n  \n});",
            'queryselector': "document.querySelector('');",
            'queryselectorall': "document.querySelectorAll('');",
            'getelementbyid': "document.getElementById('');",
            'createelement': "document.createElement('');",
            'console.log': 'console.log();',
            'console.error': 'console.error();',
            'console.warn': 'console.warn();',
            'console.table': 'console.table();',
            'iife': '(() => {\n  \n})();',
            'debounce': 'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}',
            'throttle': 'function throttle(fn, limit) {\n  let inThrottle;\n  return function(...args) {\n    if (!inThrottle) {\n      fn.apply(this, args);\n      inThrottle = true;\n      setTimeout(() => inThrottle = false, limit);\n    }\n  };\n}',
            'localstorage get': "JSON.parse(localStorage.getItem(''));",
            'localstorage set': "localStorage.setItem('', JSON.stringify());",
            'raf': 'requestAnimationFrame(function loop() {\n  \n  requestAnimationFrame(loop);\n});',
            'domready': "document.addEventListener('DOMContentLoaded', () => {\n  \n});",
            'window.onload': "window.addEventListener('load', () => {\n  \n});",
            'structuredclone': 'structuredClone()',
            'object.keys': 'Object.keys()',
            'object.values': 'Object.values()',
            'object.entries': 'Object.entries()',
            'array.from': 'Array.from()',
            'json.parse': 'JSON.parse()',
            'json.stringify': 'JSON.stringify()',
            'map ': 'new Map()',
            'set ': 'new Set()',
            'weakmap': 'new WeakMap()',
            'weakset': 'new WeakSet()',
            'proxy': 'new Proxy(target, {\n  get(target, prop) {\n    \n  },\n  set(target, prop, value) {\n    \n    return true;\n  }\n});',
            'destructure array': 'const [, ] = ;',
            'destructure object': 'const { ,  } = ;',
            'template literal': '`${}`',
            'regex': '/pattern/flags',
          }
        }
      };

      /* ══════════════════════════════════════════
         HELPERS
         ══════════════════════════════════════════ */

      const _mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      const _escDiv = document.createElement('div');

      function esc(s) {
        _escDiv.textContent = s;
        return _escDiv.innerHTML;
      }

      /** Get the plain-text character offset of the cursor inside `el` */
      function getCursorOffset(el) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return 0;
        const selRange = sel.getRangeAt(0);
        const range = selRange.cloneRange();
        range.selectNodeContents(el);
        range.setEnd(selRange.startContainer, selRange.startOffset);
        return range.toString().length;
      }

      /** Place the cursor at a character offset inside `el` */
      function setCursorOffset(el, offset) {
        const sel = window.getSelection();
        const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let count = 0,
          node;
        while ((node = walker.nextNode())) {
          const len = node.textContent.length;
          if (count + len >= offset) {
            range.setStart(node, offset - count);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
          count += len;
        }
        // Past end — put at very end
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      /** Get a rect for the current cursor position */
      function getCursorRect() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        const range = sel.getRangeAt(0).cloneRange();
        range.collapse(true);
        const rects = range.getClientRects();
        if (rects.length > 0) return rects[0];
        // Fallback: insert temp span
        const span = document.createElement('span');
        span.textContent = '\u200b';
        range.insertNode(span);
        const rect = span.getBoundingClientRect();
        span.parentNode.removeChild(span);
        sel.removeAllRanges();
        sel.addRange(range);
        return rect;
      }

      /* ── Hoisted module-level constants ─────── */

      const _HTML_SELF_CLOSE = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'embed', 'wbr', 'area', 'base', 'col', 'track', 'param']);
      const _RX_HTML_ATTR_CTX = /<(\w+)(?:\s+[\w\-]+(?:="[^"]*")?)*\s+([\w\-]*)$/;
      const _RX_HTML_TAG_OPEN = /<(\w+)$/;
      const _RX_HTML_TAG_CLOSE = /<\/(\w*)$/;
      const _RX_HTML_OPENS = /<(\w+)[^>]*>/g;
      const _RX_HTML_CLOSES = /<\/(\w+)>/g;

      const _RX_CSS_OPEN_B = /{/g;
      const _RX_CSS_CLOSE_B = /}/g;
      const _RX_CSS_VAL_M = /^([\w-]+)\s*:\s*([\w-]*)$/;
      const _RX_CSS_AT_M = /@[\w-]*$/;
      const _RX_CSS_PSEUDO_M = /:{1,2}[\w-]*$/;

      const _RX_JS_DOT_M = /(\w+)\.\s*([\w]*)$/;
      const _RX_JS_CLS_M = /\.classList\.\s*([\w]*)$/;
      const _RX_JS_STY_M = /\.style\.\s*([\w]*)$/;
      const _RX_JS_EVT_M = /addEventListener\(\s*['"](\w*)$/;

      const _JS_ARR_HINTS = ['arr', 'array', 'list', 'items', 'data', 'results', 'elements', 'rows', 'cols', 'children', 'entries', 'files', 'matches', 'keys', 'values'];
      const _JS_STR_HINTS = ['str', 'string', 'name', 'text', 'title', 'msg', 'message', 'label', 'value', 'url', 'path', 'html', 'content', 'tag', 'src', 'href', 'key', 'filename', 'classname'];
      const _JS_NUM_HINTS = ['num', 'number', 'count', 'total', 'index', 'length', 'size', 'width', 'height', 'offset', 'scroll', 'client', 'top', 'left', 'right', 'bottom', 'x', 'y', 'z'];
      const _JS_DOM_HINTS = ['el', 'elem', 'element', 'node', 'btn', 'container', 'wrapper', 'div', 'form', 'input', 'section', 'modal', 'sidebar', 'overlay', 'canvas', 'header', 'footer', 'nav', 'parent', 'child'];

      /* ══════════════════════════════════════════
         CORE CLASS
         ══════════════════════════════════════════ */

      class AutoSwipeEditor {
        constructor(opts) {
          // Resolve elements
          this.editorEl = typeof opts.editor === 'string' ?
            document.querySelector(opts.editor) : opts.editor;
          this.highlightEl = typeof opts.highlighter === 'string' ?
            document.querySelector(opts.highlighter) : opts.highlighter;

          if (!this.editorEl) throw new Error('AutoSwipe: editor element not found');
          if (!this.highlightEl) throw new Error('AutoSwipe: highlighter element not found');

          this.opts = Object.assign({
            language: 'auto',
            swipeThreshold: 50,
            maxSuggestions: 6,
            debounceDelay: 100,
            tabAccept: true,
            showIndicator: true,
            getContent: () => this.editorEl.innerText,
            onAccept: null,
            onSuggest: null,
            customDictionary: null,
          }, opts);

          // State
          this.ghostText = '';
          this.suggestions = [];
          this.selectedIndex = -1;
          this._timer = null;
          this._touchX = 0;
          this._touchY = 0;
          this._touchT = 0;
          this._composing = false;
          this._currentLang = this.opts.language === 'auto' ? 'html' : this.opts.language;
          this._freq = {};
          this._lastContent = '';

          this._buildUI();
          this._bind();
        }

        /* ── UI Elements ─────────────────────── */

        _buildUI() {
          // Flash overlay
          this._flash = document.createElement('div');
          this._flash.className = 'as-accept-flash';
          document.body.appendChild(this._flash);

          // Swipe indicator
          if (this.opts.showIndicator) {
            this._indicator = document.createElement('div');
            this._indicator.className = 'as-swipe-indicator';
            this._indicator.innerHTML = _mobile ?
              `<span class="as-swipe-arrow"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></span> Swipe to accept` :
              `<span style="font-weight:700;opacity:0.7">Tab</span> to accept`;
            document.body.appendChild(this._indicator);
          }

          // Dropdown
          this._dropdown = document.createElement('div');
          this._dropdown.className = 'as-dropdown';
          this._dropdown.setAttribute('role', 'listbox');
          document.body.appendChild(this._dropdown);
        }

        /* ── Event Binding ───────────────────── */

        _bind() {
          this._onInputBound = () => {
            if (!this._composing) this._scheduleUpdate();
          };
          this._onKeyDownBound = (e) => this._onKeyDown(e);
          this._onTouchStartBound = (e) => this._onTouchStart(e);
          this._onTouchEndBound = (e) => this._onTouchEnd(e);
          this._onCompStartBound = () => {
            this._composing = true;
          };
          this._onCompEndBound = () => {
            this._composing = false;
            this._scheduleUpdate();
          };
          this._onBlurBound = () => {
            setTimeout(() => this._clear(), 200);
          };
          this._onFocusBound = () => {
            setTimeout(() => this._scheduleUpdate(), 120);
          };

          this.editorEl.addEventListener('input', this._onInputBound);
          this.editorEl.addEventListener('keydown', this._onKeyDownBound);
          this.editorEl.addEventListener('touchstart', this._onTouchStartBound, {
            passive: true
          });
          this.editorEl.addEventListener('touchend', this._onTouchEndBound);
          this.editorEl.addEventListener('compositionstart', this._onCompStartBound);
          this.editorEl.addEventListener('compositionend', this._onCompEndBound);
          this.editorEl.addEventListener('blur', this._onBlurBound);
          this.editorEl.addEventListener('focus', this._onFocusBound);

          // Prevent blur when clicking dropdown
          this._dropdown.addEventListener('pointerdown', (e) => e.preventDefault());
          this._dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.as-dropdown-item');
            if (item) this._acceptByIndex(parseInt(item.dataset.index, 10));
          });
        }

        /* ── Language Detection ───────────────── */

        _detectLang(text) {
          if (this.opts.language !== 'auto') return this.opts.language;
          let h = 0,
            c = 0,
            j = 0;
          if (/<[a-zA-Z]/.test(text)) h += 5;
          if (/<\/\w+>/.test(text)) h += 5;
          if (/<!DOCTYPE/i.test(text)) h += 10;
          if (/\sclass="/.test(text) || /\sid="/.test(text)) h += 3;
          if (/[{}]/.test(text) && /:\s*[^;]+;/.test(text)) c += 5;
          if (/@media|@keyframes|@font-face/.test(text)) c += 8;
          if (/\b(display|margin|padding|background|font-size|border|flex|grid)\s*:/.test(text)) c += 6;
          if (/:hover|::before|::after/.test(text)) c += 4;
          if (/\b(const|let|var|function|=>|return)\b/.test(text)) j += 5;
          if (/\b(document|window|console)\b/.test(text)) j += 5;
          if (/\b(if|else|for|while|switch|try|catch)\b/.test(text)) j += 3;
          if (/\b(import|export|require)\b/.test(text)) j += 4;
          if (/===|!==|\|\||&&/.test(text)) j += 3;

          // Context-aware: check if cursor is inside <style> or <script>
          const cursorPos = getCursorOffset(this.editorEl);
          const before = text.substring(0, cursorPos);
          const lastStyleOpen = before.lastIndexOf('<style');
          const lastStyleClose = before.lastIndexOf('</style');
          const lastScriptOpen = before.lastIndexOf('<script');
          const lastScriptClose = before.lastIndexOf('<\/script');

          if (lastStyleOpen > lastStyleClose && lastStyleOpen !== -1) return 'css';
          if (lastScriptOpen > lastScriptClose && lastScriptOpen !== -1) return 'js';

          const max = Math.max(h, c, j);
          if (max === 0) return this._currentLang;
          if (h === max) return 'html';
          if (c === max) return 'css';
          return 'js';
        }

        /* ── Context ─────────────────────────── */

        _getContext() {
          const text = this.opts.getContent();
          const cursorPos = getCursorOffset(this.editorEl);
          const before = text.substring(0, cursorPos);
          const after = text.substring(cursorPos);
          const currentLine = before.split('\n').pop() || '';
          const trimmedLine = currentLine.trimStart();
          this._currentLang = this._detectLang(text);
          return {
            text,
            cursorPos,
            before,
            after,
            currentLine,
            trimmedLine,
            lang: this._currentLang
          };
        }

        /* ── Matching ────────────────────────── */

        _lastWord(line) {
          const m = line.match(/([a-zA-Z0-9\-_@.:<!#"'($/\\]+)$/);
          return m ? m[1] : '';
        }

        _match(list, prefix, tag) {
          if (!prefix || prefix.length < 1) return [];
          const low = prefix.toLowerCase();
          return list
            .filter(item => {
              const il = item.toLowerCase();
              return il.startsWith(low) && il !== low;
            })
            .map(item => ({
              text: item,
              completion: item.substring(prefix.length),
              tag,
              score: 10,
            }));
        }

        /* ── Suggestion Engine ───────────────── */

        _suggest(ctx) {
          const {
            trimmedLine,
            lang
          } = ctx;
          if (!trimmedLine || trimmedLine.length < 1) return [];
          let r = [];
          switch (lang) {
            case 'html':
              r = this._suggestHTML(ctx);
              break;
            case 'css':
              r = this._suggestCSS(ctx);
              break;
            case 'js':
              r = this._suggestJS(ctx);
              break;
          }
          if (this.opts.customDictionary) {
            r = r.concat(this._match(this.opts.customDictionary, this._lastWord(trimmedLine), 'snippet'));
          }
          // Sort: frequency then score
          r.sort((a, b) => {
            const fa = this._freq[a.text] || 0,
              fb = this._freq[b.text] || 0;
            return fb !== fa ? fb - fa : (b.score || 0) - (a.score || 0);
          });
          // Dedup
          const seen = new Set();
          r = r.filter(x => {
            if (seen.has(x.text)) return false;
            seen.add(x.text);
            return true;
          });
          return r.slice(0, this.opts.maxSuggestions);
        }

        /* ── HTML Suggestions ────────────────── */

        _suggestHTML(ctx) {
          const {
            trimmedLine,
            before
          } = ctx;
          const r = [],
            d = DICT.html;

          // Snippets
          for (const [trigger, expansion] of Object.entries(d.snippets)) {
            const tl = trigger.toLowerCase(),
              ll = trimmedLine.toLowerCase();
            if (tl.startsWith(ll) && tl !== ll && ll.length >= 2) {
              r.push({
                text: expansion,
                completion: expansion,
                tag: 'snippet',
                score: 15,
                isSnippet: true,
                replaceLen: trimmedLine.length
              });
            }
          }

          // Attribute context: inside an open tag
          const attrCtx = before.match(_RX_HTML_ATTR_CTX);
          if (attrCtx && attrCtx[2]) {
            const am = this._match(d.attributes, attrCtx[2], 'html');
            am.forEach(m => {
              if (!m.text.endsWith('-')) m.completion += '=""';
            });
            r.push(...am);
          }

          // Opening tag <tag
          const tagM = trimmedLine.match(_RX_HTML_TAG_OPEN);
          if (tagM && tagM[1]) {
            const tm = this._match(d.tags, tagM[1], 'html');
            tm.forEach(t => {
              t.completion += _HTML_SELF_CLOSE.has(t.text) ? '>' : '></' + t.text + '>';
            });
            r.push(...tm);
          }

          // Closing tag </tag
          const closeM = trimmedLine.match(_RX_HTML_TAG_CLOSE);
          if (closeM) {
            const partial = closeM[1];
            // Find last unclosed tag
            const opens = (before.match(_RX_HTML_OPENS) || []).map(t => t.match(/<(\w+)/)[1]);
            const closes = (before.match(_RX_HTML_CLOSES) || []).map(t => t.match(/<\/(\w+)/)[1]);
            const unclosed = [];
            const cc = [...closes];
            for (const o of opens) {
              const i = cc.indexOf(o);
              if (i >= 0) cc.splice(i, 1);
              else unclosed.push(o);
            }
            if (unclosed.length) {
              const last = unclosed[unclosed.length - 1];
              if (!partial || last.startsWith(partial))
                r.push({
                  text: last + '>',
                  completion: last.substring(partial.length) + '>',
                  tag: 'html',
                  score: 20
                });
            }
            if (partial) {
              const cm = this._match(d.tags, partial, 'html');
              cm.forEach(m => {
                m.completion += '>';
              });
              r.push(...cm);
            }
          }

          return r;
        }

        /* ── CSS Suggestions ─────────────────── */

        _suggestCSS(ctx) {
          const {
            trimmedLine,
            before
          } = ctx;
          const r = [],
            d = DICT.css;

          // Snippets
          for (const [trigger, expansion] of Object.entries(d.snippets)) {
            const tl = trigger.toLowerCase(),
              ll = trimmedLine.toLowerCase();
            if (tl.startsWith(ll) && tl !== ll && ll.length >= 2)
              r.push({
                text: expansion,
                completion: expansion,
                tag: 'snippet',
                score: 15,
                isSnippet: true,
                replaceLen: trimmedLine.length
              });
          }

          const openB = (before.match(_RX_CSS_OPEN_B) || []).length;
          const closeB = (before.match(_RX_CSS_CLOSE_B) || []).length;
          const inside = openB > closeB;

          // Property value: "property: partial"
          const valM = trimmedLine.match(_RX_CSS_VAL_M);
          if (valM && inside) {
            const vals = d.values[valM[1]];
            if (vals && valM[2]) r.push(...this._match(vals, valM[2], 'css'));
            else if (vals && !valM[2]) vals.slice(0, this.opts.maxSuggestions).forEach(v => r.push({
              text: v,
              completion: v,
              tag: 'css',
              score: 8
            }));
            return r;
          }

          // Property name
          if (inside) {
            const pw = this._lastWord(trimmedLine);
            if (pw) r.push(...this._match(d.properties, pw, 'css'));
          }

          // At-rules
          const atM = trimmedLine.match(_RX_CSS_AT_M);
          if (atM) r.push(...this._match(d.atRules, atM[0], 'css'));

          // Pseudo
          const psM = trimmedLine.match(_RX_CSS_PSEUDO_M);
          if (psM) r.push(...this._match(d.pseudoClasses, psM[0], 'css'));

          // Fallback
          if (r.length === 0 && trimmedLine.length >= 2) {
            const pw = this._lastWord(trimmedLine);
            if (pw && pw.length >= 2) r.push(...this._match(d.properties, pw, 'css'));
          }

          return r;
        }

        /* ── JS Suggestions ──────────────────── */

        _suggestJS(ctx) {
          const {
            trimmedLine
          } = ctx;
          const r = [],
            d = DICT.js;

          // Snippets
          for (const [trigger, expansion] of Object.entries(d.snippets)) {
            const tl = trigger.toLowerCase(),
              ll = trimmedLine.toLowerCase();
            if (tl.startsWith(ll) && tl !== ll && ll.length >= 2)
              r.push({
                text: expansion,
                completion: expansion,
                tag: 'snippet',
                score: 15,
                isSnippet: true,
                replaceLen: trimmedLine.length
              });
          }

          // Dot methods: "obj.partial"
          const dotM = trimmedLine.match(_RX_JS_DOT_M);
          if (dotM) {
            const obj = dotM[1],
              partial = dotM[2];
            const known = d.methods[obj];
            if (known) {
              r.push(...(partial ?
                this._match(known, partial, 'js') :
                known.slice(0, this.opts.maxSuggestions).map(m => ({
                  text: m,
                  completion: m,
                  tag: 'js',
                  score: 10
                }))
              ));
            }

            // classList context
            const clMatch = trimmedLine.match(_RX_JS_CLS_M);
            if (clMatch) {
              r.push(...this._match(d.classListMethods, clMatch[1] || '', 'js'));
              return r;
            }

            // style context
            const stMatch = trimmedLine.match(_RX_JS_STY_M);
            if (stMatch) {
              r.push(...this._match(d.styleMethods, stMatch[1] || '', 'js'));
              return r;
            }

            // Context hints
            const ol = obj.toLowerCase();
            if (_JS_ARR_HINTS.some(k => ol.includes(k))) r.push(...this._match(d.arrayMethods, partial || '', 'js'));
            if (_JS_STR_HINTS.some(k => ol.includes(k))) r.push(...this._match(d.stringMethods, partial || '', 'js'));
            if (_JS_NUM_HINTS.some(k => ol === k)) r.push(...this._match(d.numberMethods, partial || '', 'js'));
            if (_JS_DOM_HINTS.some(k => ol.includes(k))) r.push(...this._match(d.domMethods, partial || '', 'js'));

            // Fallback for unknown objects
            if (partial && r.length < 3) {
              r.push(...this._match(d.arrayMethods, partial, 'js'));
              r.push(...this._match(d.stringMethods, partial, 'js'));
              r.push(...this._match(d.domMethods, partial, 'js'));
            }

            return r;
          }

          // Event names inside addEventListener('...')
          const evtM = trimmedLine.match(_RX_JS_EVT_M);
          if (evtM) {
            r.push(...this._match(d.events, evtM[1], 'js'));
            return r;
          }

          // Keywords + globals
          const lw = this._lastWord(trimmedLine);
          if (lw && lw.length >= 2) {
            r.push(...this._match(d.keywords, lw, 'js'));
            r.push(...this._match(d.globals, lw, 'js'));
          }

          return r;
        }

        /* ── Ghost Text in Highlight Overlay ─── */

        _renderGhost(ghostStr) {
          this.ghostText = ghostStr || '';

          // Remove any existing ghost
          const existing = this.highlightEl.querySelector('.as-ghost');
          if (existing) existing.remove();

          if (!this.ghostText) return;

          const cursorOff = getCursorOffset(this.editorEl);
          const walker = document.createTreeWalker(this.highlightEl, NodeFilter.SHOW_TEXT, null, false);
          let count = 0,
            targetNode = null,
            targetOff = 0;

          while (walker.nextNode()) {
            const node = walker.currentNode;
            const len = node.textContent.length;
            if (count + len >= cursorOff) {
              targetNode = node;
              targetOff = cursorOff - count;
              break;
            }
            count += len;
          }

          if (!targetNode) {
            // Append at end
            const ghost = document.createElement('span');
            ghost.className = 'as-ghost';
            ghost.textContent = this.ghostText;
            this.highlightEl.appendChild(ghost);
            return;
          }

          // Split the text node and insert ghost span
          const ghost = document.createElement('span');
          ghost.className = 'as-ghost';
          ghost.textContent = this.ghostText;

          if (targetOff < targetNode.textContent.length) {
            const afterText = targetNode.textContent.substring(targetOff);
            targetNode.textContent = targetNode.textContent.substring(0, targetOff);
            const afterNode = document.createTextNode(afterText);
            targetNode.parentNode.insertBefore(ghost, targetNode.nextSibling);
            targetNode.parentNode.insertBefore(afterNode, ghost.nextSibling);
          } else {
            targetNode.parentNode.insertBefore(ghost, targetNode.nextSibling);
          }
        }

        _removeGhost() {
          const g = this.highlightEl.querySelector('.as-ghost');
          if (g) g.remove();
          this.ghostText = '';
        }

        /* ── Indicator ───────────────────────── */

        _showHint() {
          if (this._indicator) this._indicator.classList.add('as-visible');
        }

        _hideHint() {
          if (this._indicator) this._indicator.classList.remove('as-visible');
        }

        /* ── Dropdown ────────────────────────── */

        _showDropdown() {
          if (this.suggestions.length <= 1) {
            this._hideDropdown();
            return;
          }

          this._dropdown.innerHTML = '';
          this.suggestions.forEach((s, i) => {
            const item = document.createElement('div');
            item.className = 'as-dropdown-item' + (i === this.selectedIndex ? ' as-selected' : '');
            item.dataset.index = i;
            item.setAttribute('role', 'option');
            const tagCls = ({
              html: 'as-tag-html',
              css: 'as-tag-css',
              js: 'as-tag-js',
              snippet: 'as-tag-snippet'
            })[s.tag] || 'as-tag-js';
            const preview = s.isSnippet ?
              s.text.split('\n')[0].substring(0, 40) + (s.text.includes('\n') ? '…' : '') :
              s.text;
            item.innerHTML = `<span class="as-tag ${tagCls}">${s.tag}</span><span class="as-preview">${esc(preview)}</span>`;
            this._dropdown.appendChild(item);
          });

          // Position near cursor
          const rect = getCursorRect();
          if (rect) {
            let top = rect.bottom + 4;
            let left = rect.left;
            const dh = this._dropdown.offsetHeight || 200;
            if (top + dh > window.innerHeight) top = rect.top - dh - 4;
            if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
            if (left < 4) left = 4;
            if (top < 0) top = 4;
            this._dropdown.style.top = top + 'px';
            this._dropdown.style.left = left + 'px';
          }
          this._dropdown.classList.add('as-open');
        }

        _hideDropdown() {
          this._dropdown.classList.remove('as-open');
          this.selectedIndex = -1;
        }

        _updateDropdownSel() {
          const items = this._dropdown.querySelectorAll('.as-dropdown-item');
          items.forEach((el, i) => el.classList.toggle('as-selected', i === this.selectedIndex));
          const sel = this._dropdown.querySelector('.as-selected');
          if (sel) sel.scrollIntoView({
            block: 'nearest'
          });
        }

        _updateGhostFromSel() {
          if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
            const s = this.suggestions[this.selectedIndex];
            const ghost = s.isSnippet ? s.text.substring(s.replaceLen || 0) : s.completion;
            this._renderGhost(ghost);
          }
        }

        /* ── Accept / Clear ──────────────────── */

        _accept() {
          if (!this.ghostText && !this.suggestions.length) return false;
          const s = this.suggestions[Math.max(0, this.selectedIndex)] || this.suggestions[0];
          return s ? this._apply(s) : false;
        }

        _acceptByIndex(idx) {
          if (idx < 0 || idx >= this.suggestions.length) return false;
          return this._apply(this.suggestions[idx]);
        }

        _apply(suggestion) {
          this._removeGhost();

          const text = this.opts.getContent();
          const cursorPos = getCursorOffset(this.editorEl);
          let newText, newCursorPos;

          if (suggestion.isSnippet && suggestion.replaceLen) {
            const before = text.substring(0, cursorPos - suggestion.replaceLen);
            const after = text.substring(cursorPos);
            newText = before + suggestion.text + after;
            newCursorPos = before.length + suggestion.text.length;
          } else {
            const before = text.substring(0, cursorPos);
            const after = text.substring(cursorPos);
            newText = before + suggestion.completion + after;
            newCursorPos = cursorPos + suggestion.completion.length;
          }

          // Set content
          this.editorEl.textContent = newText;
          setCursorOffset(this.editorEl, newCursorPos);

          // Track frequency
          this._freq[suggestion.text] = (this._freq[suggestion.text] || 0) + 1;

          // Flash
          this._flash.classList.remove('as-active');
          void this._flash.offsetWidth;
          this._flash.classList.add('as-active');
          setTimeout(() => this._flash.classList.remove('as-active'), 350);

          if (this.opts.onAccept) this.opts.onAccept(suggestion, newText);

          this._clear();
          return true;
        }

        _clear() {
          this._removeGhost();
          this.ghostText = '';
          this.suggestions = [];
          this.selectedIndex = -1;
          this._hideDropdown();
          this._hideHint();
        }

        /* ── Input Scheduling ────────────────── */

        _scheduleUpdate() {
          clearTimeout(this._timer);
          this._timer = setTimeout(() => this._update(), this.opts.debounceDelay);
        }

        _update() {
          const content = this.opts.getContent();
          // Avoid re-processing identical content
          if (content === this._lastContent && this.suggestions.length > 0) return;
          this._lastContent = content;

          const ctx = this._getContext();
          this.suggestions = this._suggest(ctx);

          if (this.suggestions.length > 0) {
            const best = this.suggestions[0];
            const ghost = best.isSnippet ? best.text.substring(best.replaceLen || 0) : best.completion;
            this.selectedIndex = 0;
            // Render ghost inside highlight overlay (after Prism has run)
            // Use a microtask to run after any pending highlight update
            Promise.resolve().then(() => {
              this._renderGhost(ghost);
            });
            this._showHint();
            if (this.suggestions.length > 1) this._showDropdown();
            else this._hideDropdown();
            if (this.opts.onSuggest) this.opts.onSuggest(this.suggestions);
          } else {
            this._clear();
          }
        }

        /* ── Keyboard ────────────────────────── */

        _onKeyDown(e) {
          // Tab to accept
          if (e.key === 'Tab' && this.opts.tabAccept && this.ghostText) {
            e.preventDefault();
            e.stopPropagation();
            this._accept();
            return;
          }

          // Dropdown nav
          if (this._dropdown.classList.contains('as-open')) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
              this._updateDropdownSel();
              this._updateGhostFromSel();
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
              this._updateDropdownSel();
              this._updateGhostFromSel();
              return;
            }
            if (e.key === 'Enter' && this.selectedIndex >= 0) {
              e.preventDefault();
              e.stopPropagation();
              this._acceptByIndex(this.selectedIndex);
              return;
            }
          }

          // Escape
          if (e.key === 'Escape') {
            this._clear();
            return;
          }

          // Any typing clears ghost (will regenerate from input event)
          if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            this._removeGhost();
          }
        }

        /* ── Touch / Swipe ───────────────────── */

        _onTouchStart(e) {
          if (e.touches.length !== 1) return;
          this._touchX = e.touches[0].clientX;
          this._touchY = e.touches[0].clientY;
          this._touchT = Date.now();
        }

        _onTouchEnd(e) {
          if (!this.ghostText || !this._touchX) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - this._touchX;
          const dy = Math.abs(t.clientY - this._touchY);
          const dt = Date.now() - this._touchT;
          if (dx > this.opts.swipeThreshold && dy < 80 && dt < 500) {
            e.preventDefault();
            this._accept();
          }
          this._touchX = 0;
          this._touchY = 0;
        }

        /* ══════════════════════════════════════
           PUBLIC API
           ══════════════════════════════════════ */

        setLanguage(lang) {
          if (['html', 'css', 'js', 'auto'].includes(lang)) {
            this.opts.language = lang;
            if (lang !== 'auto') this._currentLang = lang;
          }
          return this;
        }

        getLanguage() {
          return this._currentLang;
        }

        addWords(words) {
          if (!this.opts.customDictionary) this.opts.customDictionary = [];
          this.opts.customDictionary.push(...words);
          return this;
        }

        addSnippets(snippets, lang) {
          const target = lang || this._currentLang;
          if (DICT[target] && DICT[target].snippets) Object.assign(DICT[target].snippets, snippets);
          return this;
        }

        refresh() {
          this._scheduleUpdate();
          return this;
        }

        destroy() {
          this._clear();
          clearTimeout(this._timer);
          this.editorEl.removeEventListener('input', this._onInputBound);
          this.editorEl.removeEventListener('keydown', this._onKeyDownBound);
          this.editorEl.removeEventListener('touchstart', this._onTouchStartBound);
          this.editorEl.removeEventListener('touchend', this._onTouchEndBound);
          this.editorEl.removeEventListener('compositionstart', this._onCompStartBound);
          this.editorEl.removeEventListener('compositionend', this._onCompEndBound);
          this.editorEl.removeEventListener('blur', this._onBlurBound);
          this.editorEl.removeEventListener('focus', this._onFocusBound);
          if (this._flash && this._flash.parentNode) this._flash.parentNode.removeChild(this._flash);
          if (this._indicator && this._indicator.parentNode) this._indicator.parentNode.removeChild(this._indicator);
          if (this._dropdown && this._dropdown.parentNode) this._dropdown.parentNode.removeChild(this._dropdown);
        }
      }

      /* ══════════════════════════════════════════
         STATIC API
         ══════════════════════════════════════════ */

      return {
        version: '2.1.0',

        /**
         * AutoSwipe.init({
         *   editor: '#editor',
         *   highlighter: '#highlighted',
         *   language: 'auto',
         *   getContent: () => myEditor.innerText,
         *   onAccept: (suggestion, newText) => { ... }
         * })
         */
        init(opts) {
          return new AutoSwipeEditor(opts);
        }
      };

    }));

  

    /* ── Settings store ─────────────────────────────────────────────
         All user preferences live in one JSON blob under SETTINGS_KEY.
         cfgGet / cfgSet / cfgSave are the only public entry-points.
         On first run the old individual keys are migrated automatically.
      ──────────────────────────────────────────────────────────────── */
    const SETTINGS_KEY = 'mce_settings_v1';
    let _cfg = {};

    function cfgLoad() {
      try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          _cfg = JSON.parse(stored);
          return;
        }
      } catch (_) {}
      // First run / corrupted — migrate legacy individual keys
      const _OLD_KEYS = [
        'theme', 'fontSize', 'lineHeight', 'tabSize', 'showLineNumbers',
        'colorPickerController', 'autoCompleteActive', 'shortcutBar',
        'githubCdnOwner', 'githubCdnRepo', 'githubCdnBranch', 'githubCdnFolder', 'githubCdnToken',
        'gh_token', 'gh_repo',
      ];
      _cfg = {};
      for (const k of _OLD_KEYS) {
        const v = localStorage.getItem(k);
        if (v !== null) {
          _cfg[k] = v;
          localStorage.removeItem(k);
        }
      }
      cfgSave();
    }

    function cfgGet(key, fallback = null) {
      const v = _cfg[key];
      return (v !== undefined && v !== null) ? v : fallback;
    }

    function cfgSet(key, value) {
      _cfg[key] = value;
      cfgSave();
    }

    function cfgSave() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(_cfg));
      } catch (_) {}
    }

    cfgLoad();

    /* ── IndexedDB store ──────────────────────────────────────────────────
       One object store:
         'backups' — key = fileId, value = [{content, timestamp}, ...]
                     newest snapshot first, capped at MAX_BACKUP_VERSIONS per file.
       All writes are fire-and-forget; a failed write never blocks the UI.
       If IndexedDB is unavailable (e.g. private browsing), _db stays null
       and every helper returns a resolved Promise — safe no-ops.
    ──────────────────────────────────────────────────────────────────── */
    const _IDB_NAME = 'mce_idb_v1';
    const _IDB_VER = 2;
    let _db = null;

    function dbOpen() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(_IDB_NAME, _IDB_VER);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          // v1 had a 'files' store — no longer needed, remove it if present
          if (db.objectStoreNames.contains('files')) db.deleteObjectStore('files');
          if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups');
        };
        req.onsuccess = e => {
          _db = e.target.result;
          resolve(_db);
        };
        req.onerror = () => reject(req.error);
      });
    }

    function _dbTx(store, mode, fn) {
      if (!_db) return Promise.resolve(undefined);
      return new Promise((resolve, reject) => {
        const tx = _db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    const dbGet = (store, key) => _dbTx(store, 'readonly', os => os.get(key));
    const dbSet = (store, key, value) => _dbTx(store, 'readwrite', os => os.put(value, key));
    const dbDel = (store, key) => _dbTx(store, 'readwrite', os => os.delete(key));

    function dbAll(store) {
      if (!_db) return Promise.resolve([]);
      return new Promise((resolve, reject) => {
        const tx = _db.transaction(store, 'readonly');
        const results = [];
        tx.objectStore(store).openCursor().onsuccess = e => {
          const c = e.target.result;
          if (c) {
            results.push({
              key: c.key,
              value: c.value
            });
            c.continue();
          } else resolve(results);
        };
        tx.onerror = () => reject(tx.error);
      });
    }

    const editor = document.getElementById('editor');
    const highlighted = document.getElementById('highlighted');
    const lineNumbers = document.getElementById('line-numbers');
    const fileTree = document.getElementById('file-tree');
    const fileInput = document.getElementById('file-input');
    const initialContent = `<!DOCTYPE html>\n<!-- By Ion-o-koji -->\n<html lang="en">\n\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Skeleton Code</title>\n  <style>\n\n  </style>\n</head>\n\n<body>\n  \n  <script>\n    \n  <\/script>\n</body>\n\n</html>`;
    let CORS_PROXY = 'https://api.allorigins.win/get?url=';
    const fetchModal = document.getElementById('fetchModal');
    const fetchButton = document.getElementById('fetch-btn');
    const fetchCloseModal = document.querySelector('.close');
    const fetchHTMLButton = document.getElementById('fetchHTMLButton');
    const fetchStatusMessage = document.getElementById('statusMessage');

    const _TOAST_ICONS = {
      'success': '<svg fill="none" stroke="#10b981" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'error': '<svg fill="none" stroke="#ef4444" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'info': '<svg fill="none" stroke="#3b82f6" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'warning': '<svg fill="none" stroke="#f59e0b" viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
    };
    const toast = (m, t = 'info', d = 3000) => {
      const c = document.getElementById('toast-container') || Object.assign(document.body.appendChild(document.createElement('div')), {
        id: 'toast-container',
        style: 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;width:90%;max-width:420px'
      });
      const e = Object.assign(document.createElement('div'), {
        innerHTML: _TOAST_ICONS[t] + '<div style="flex:1;text-align:left">' + m + '</div>',
        style: 'background:#252526;color:#d4d4d4;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:12px;min-width:280px;pointer-events:auto;animation:slideUp 0.3s ease;font-size:15px;font-weight:500;border:1px solid rgba(255,255,255,0.1)'
      });
      if (!document.getElementById('toast-styles')) document.head.insertAdjacentHTML('beforeend', '<style id="toast-styles">@keyframes slideUp{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes slideDown{to{transform:translateY(100px);opacity:0}}</style>');
      c.appendChild(e);
      setTimeout(() => {
        e.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => c.removeChild(e), 300)
      }, d)
    };

    let fetchedHTML = '';
    let currentURL = '';

    let state = {
      files: {
        'index.html': initialContent
      },
      currentFile: 'index.html',
      undoStack: {
        'index.html': [initialContent]
      },
      redoStack: {
        'index.html': []
      },
      errors: [],
      linkedFiles: {}
    };

    let autoswipeInstance = null;
    const loadedPrismLangs = new Set(['html']);

    const _LANG_MAP = {
      'html': {
        prism: 'html',
        autoswipe: 'html'
      },
      'htm': {
        prism: 'html',
        autoswipe: 'html'
      },
      'css': {
        prism: 'css',
        autoswipe: 'css'
      },
      'js': {
        prism: 'javascript',
        autoswipe: 'javascript'
      },
      'mjs': {
        prism: 'javascript',
        autoswipe: 'javascript'
      },
      'json': {
        prism: 'json',
        autoswipe: 'javascript'
      },
      'ts': {
        prism: 'typescript',
        autoswipe: 'javascript'
      },
      'md': {
        prism: 'markdown',
        autoswipe: 'html'
      },
      'markdown': {
        prism: 'markdown',
        autoswipe: 'html'
      },
    };
    const _LANG_MAP_DEFAULT = {
      prism: 'html',
      autoswipe: 'html'
    };

    function getLanguageFromFilename(filename) {
      const ext = (filename || '').split('.').pop().toLowerCase();
      return _LANG_MAP[ext] || _LANG_MAP_DEFAULT;
    }

    function loadPrismLanguage(lang) {
      if (loadedPrismLangs.has(lang) || Prism.languages[lang]) {
        loadedPrismLangs.add(lang);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
        script.onload = () => {
          loadedPrismLangs.add(lang);
          resolve();
        };
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }

    async function applyLanguage(filename) {
      const lang = getLanguageFromFilename(filename);
      await loadPrismLanguage(lang.prism);
      updateHighlighting();
      const autoCompleteActive = cfgGet('autoCompleteActive', 'true') !== 'false';
      if (autoCompleteActive && typeof AutoSwipe !== 'undefined') {
        if (autoswipeInstance && typeof autoswipeInstance.destroy === 'function') {
          autoswipeInstance.destroy();
        }
        autoswipeInstance = AutoSwipe.init({
          editor: '#editor',
          highlighter: '#highlighted',
          language: lang.autoswipe,
          swipeThreshold: 50,
          maxSuggestions: 6,
          debounceDelay: 100,
          getContent: () => state.files[state.currentFile] || '',
          onAccept: (suggestion, newText) => {
            state.files[state.currentFile] = newText;
            saveState();
            updateAll();
            document.getElementById('editor').focus();
          }
        });
      }
    }

    function getLinkedHtmlFile(filename) {
      for (const htmlFile of Object.keys(state.linkedFiles)) {
        const links = state.linkedFiles[htmlFile];
        if (links.css.includes(filename) || links.js.includes(filename)) {
          return htmlFile;
        }
      }
      return null;
    }

    function toggleLink(filename) {
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      const isHtml = ext === 'html' || ext === 'htm';
      if (!isHtml) {
        toast('Switch to an HTML file first to link files to it', 'warning');
        return;
      }
      const htmlFile = state.currentFile;
      const fExt = filename.split('.').pop().toLowerCase();
      const type = fExt === 'css' ? 'css' : 'js';
      if (!state.linkedFiles[htmlFile]) {
        state.linkedFiles[htmlFile] = {
          css: [],
          js: []
        };
      }
      const links = state.linkedFiles[htmlFile];
      const idx = links[type].indexOf(filename);
      if (idx === -1) {
        links[type].push(filename);
        toast(`${filename} linked to ${htmlFile} — preview will combine them`, 'success');
      } else {
        links[type].splice(idx, 1);
        toast(`${filename} unlinked from ${htmlFile}`, 'info');
      }
      updateFileTree();
    }

    function buildCombinedDocument(htmlFile) {
      let html = state.files[htmlFile] || '';
      const links = state.linkedFiles[htmlFile] || {
        css: [],
        js: []
      };

      if (links.css.length > 0) {
        const cssBlocks = links.css
          .filter(f => state.files[f])
          .map(f => `<style>\n/* ${f} */\n${state.files[f]}\n</style>`)
          .join('\n');
        if (html.includes('</head>')) {
          html = html.replace('</head>', cssBlocks + '\n</head>');
        } else {
          html = cssBlocks + '\n' + html;
        }
      }

      if (links.js.length > 0) {
        const jsBlocks = links.js
          .filter(f => state.files[f])
          .map(f => `<script>\n/* ${f} */\n${state.files[f]}\n<\/script>`)
          .join('\n');
        if (html.includes('</body>')) {
          html = html.replace('</body>', jsBlocks + '\n</body>');
        } else {
          html += '\n' + jsBlocks;
        }
      }

      return html;
    }

    function splitAndLink() {
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      if (ext !== 'html' && ext !== 'htm') {
        toast('Open an HTML file first to split it', 'warning');
        return;
      }

      const htmlFile = state.currentFile;
      let html = state.files[htmlFile];
      const baseName = htmlFile.replace(/\.(html|htm)$/i, '');

      // Extract all <style> block contents
      const styleBlocks = [];
      html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, content) => {
        if (content.trim()) styleBlocks.push(content.trim());
        return '';
      });

      // Extract inline <script> blocks (no src attribute)
      const scriptBlocks = [];
      html = html.replace(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi, (_, content) => {
        if (content.trim()) scriptBlocks.push(content.trim());
        return '';
      });

      if (styleBlocks.length === 0 && scriptBlocks.length === 0) {
        toast('No inline styles or scripts found to extract', 'warning');
        return;
      }

      const created = [];

      if (styleBlocks.length > 0) {
        let cssFile = state.files[`${baseName}.css`] ? `${baseName}-styles.css` : `${baseName}.css`;
        const cssContent = styleBlocks.join('\n\n');
        state.files[cssFile] = cssContent;
        state.undoStack[cssFile] = [cssContent];
        state.redoStack[cssFile] = [];
        created.push({
          file: cssFile,
          type: 'css'
        });
      }

      if (scriptBlocks.length > 0) {
        let jsFile = state.files[`${baseName}.js`] ? `${baseName}-script.js` : `${baseName}.js`;
        const jsContent = scriptBlocks.join('\n\n');
        state.files[jsFile] = jsContent;
        state.undoStack[jsFile] = [jsContent];
        state.redoStack[jsFile] = [];
        created.push({
          file: jsFile,
          type: 'js'
        });
      }

      // Clean up leftover blank lines in the HTML
      html = html.replace(/\n{3,}/g, '\n\n').trim();
      state.files[htmlFile] = html;
      editor.textContent = html;
      updateAll();

      // Auto-link the new files
      if (!state.linkedFiles[htmlFile]) {
        state.linkedFiles[htmlFile] = {
          css: [],
          js: []
        };
      }
      for (const {
          file,
          type
        }
        of created) {
        if (!state.linkedFiles[htmlFile][type].includes(file)) {
          state.linkedFiles[htmlFile][type].push(file);
        }
      }

      const names = created.map(c => c.file).join(' + ');
      toast(`Split into ${names} — linked & ready to combine on save`, 'success');
      updateFileTree();
    }

    function getPreviewDocument() {
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      const isHtml = ext === 'html' || ext === 'htm';

      // Markdown: render with marked.js
      if (ext === 'md' || ext === 'markdown') {
        const mdContent = JSON.stringify(editor.innerText);
        return `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Markdown Preview</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:20px 16px;line-height:1.7;color:#222}h1,h2,h3,h4{margin:1.2em 0 0.4em;line-height:1.3}pre{background:#f4f4f4;padding:14px;border-radius:6px;overflow-x:auto}code{background:#f0f0f0;padding:2px 5px;border-radius:3px;font-size:.9em}pre code{background:none;padding:0}blockquote{border-left:4px solid #ccc;margin:0;padding:4px 16px;color:#555}img{max-width:100%}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px 12px;text-align:left}th{background:#f4f4f4}a{color:#0070f3}hr{border:none;border-top:1px solid #eee;margin:24px 0}</style>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script></head>
  <body><div id="c"></div><script>document.getElementById('c').innerHTML=marked.parse(${mdContent});<\/script></body></html>`;
      }

      if (isHtml) {
        const links = state.linkedFiles[state.currentFile];
        if (links && (links.css.length > 0 || links.js.length > 0)) {
          return buildCombinedDocument(state.currentFile);
        }
        return editor.innerText;
      }

      const linkedHtml = getLinkedHtmlFile(state.currentFile);
      if (linkedHtml) {
        return buildCombinedDocument(linkedHtml);
      }

      return editor.innerText;
    }

    // ── Shared cursor insertion helper ────────────────────────────
    function insertAtCursor(text) {
      editor.focus();
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
      state.files[state.currentFile] = editor.innerText;
      updateAll();
    }

    // ── Auto-format ───────────────────────────────────────────────
    let beautifyLoaded = false;
    async function formatCode() {
      if (!beautifyLoaded) {
        toast('Loading formatter…', 'info');
        const load = src => new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
        try {
          await Promise.all([
            load('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.4/beautify.min.js'),
            load('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.4/beautify-css.min.js'),
            load('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.4/beautify-html.min.js'),
          ]);
          beautifyLoaded = true;
        } catch (e) {
          toast('Could not load formatter — check connection', 'error');
          return;
        }
      }
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      const content = editor.innerText;
      const opts = {
        indent_size: 2,
        end_with_newline: true,
        preserve_newlines: true,
        max_preserve_newlines: 2
      };
      try {
        let formatted;
        if (ext === 'css') {
          formatted = css_beautify(content, opts);
        } else if (['js', 'ts', 'mjs'].includes(ext)) {
          formatted = js_beautify(content, opts);
        } else {
          formatted = html_beautify(content, {
            ...opts,
            wrap_line_length: 0,
            indent_inner_html: false
          });
        }
        saveState();
        state.files[state.currentFile] = formatted;
        editor.textContent = formatted;
        updateAll();
        toast('Formatted', 'success');
      } catch (e) {
        toast('Format failed: ' + e.message, 'error');
      }
    }

    // ── Tools Modal ───────────────────────────────────────────────
    function toolsTab(panel, btn) {
      document.querySelectorAll('.tools-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tools-tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tools-panel-' + panel).classList.add('active');
      btn.classList.add('active');
      try {
        localStorage.setItem('tools_last_tab', panel);
      } catch (e) {}
    }

    function toolsAccordion(card) {
      card.classList.toggle('open');
      try {
        const title = card.querySelector('.tool-title')?.textContent?.trim() || '';
        if (card.classList.contains('open')) {
          localStorage.setItem('tools_last_card', title);
        } else {
          if (localStorage.getItem('tools_last_card') === title) {
            localStorage.removeItem('tools_last_card');
          }
        }
      } catch (e) {}
    }

    function openToolsModal() {
      document.getElementById('toolsModal').style.display = 'flex';

      try {
        const lastTab = localStorage.getItem('tools_last_tab');
        if (lastTab) {
          const tabBtn = [...document.querySelectorAll('.tools-tab-btn')]
            .find(b => b.getAttribute('onclick')?.includes("'" + lastTab + "'"));
          if (tabBtn) {
            document.querySelectorAll('.tools-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tools-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tools-panel-' + lastTab)?.classList.add('active');
            tabBtn.classList.add('active');
          }
        }
        const lastCard = localStorage.getItem('tools_last_card');
        if (lastCard) {
          document.querySelectorAll('.tool-card').forEach(card => {
            const title = card.querySelector('.tool-title')?.textContent?.trim() || '';
            if (title === lastCard) card.classList.add('open');
          });
        }
      } catch (e) {}

      colorFromNative(document.getElementById('color-native').value);
      bsUpdate();
      gradRenderStops();
      gradUpdate();
      brUpdate();
      snippetRender();
      typoUpdate();
      filterUpdate();
      transformUpdate();
      transUpdate();
      flexUpdate();
      unitConvert();
      wkSbUpdate();
      wkTextRenderStops();
      wkTextUpdate();
      wkSnippetsRender();
      rngUpdate();
    }

    function closeToolsModal() {
      document.getElementById('toolsModal').style.display = 'none';
    }

    // ── URL Encode / Decode ──────────────────────────────────────────
    function urlEncode() {
      const v = document.getElementById('url-input').value;
      document.getElementById('url-output').value = encodeURIComponent(v);
    }

    function urlDecode() {
      try {
        const v = document.getElementById('url-input').value.trim();
        document.getElementById('url-output').value = decodeURIComponent(v);
      } catch (e) {
        toast('Invalid URL encoding', 'error');
      }
    }

    function urlSwap() {
      const a = document.getElementById('url-input');
      const b = document.getElementById('url-output');
      const tmp = a.value;
      a.value = b.value;
      b.value = tmp;
    }

    function urlClear() {
      document.getElementById('url-input').value = '';
      document.getElementById('url-output').value = '';
    }

    function urlCopy() {
      copyToClipboard(document.getElementById('url-output').value);
    }

    function urlInsert() {
      insertAtCursor(document.getElementById('url-output').value);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // ── Lorem Ipsum ──────────────────────────────────────────────────
    const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

    function _loremWords(n) {
      const out = [];
      for (let i = 0; i < n; i++) out.push(LOREM_WORDS[i % LOREM_WORDS.length]);
      out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
      return out.join(' ');
    }

    function _loremSentence() {
      return _loremWords(8 + Math.floor(Math.random() * 10)) + '.';
    }

    function _loremParagraph() {
      return Array.from({
        length: 3 + Math.floor(Math.random() * 4)
      }, () => _loremSentence()).join(' ');
    }

    function loremGenerate() {
      const count = Math.max(1, parseInt(document.getElementById('lorem-count').value) || 3);
      const type = document.getElementById('lorem-type').value;
      let result = '';
      if (type === 'words') result = _loremWords(count);
      else if (type === 'sentences') result = Array.from({
        length: count
      }, () => _loremSentence()).join(' ');
      else result = Array.from({
        length: count
      }, () => _loremParagraph()).join('\n\n');
      document.getElementById('lorem-output').value = result;
    }

    function loremCopy() {
      copyToClipboard(document.getElementById('lorem-output').value);
    }

    function loremInsert() {
      insertAtCursor(document.getElementById('lorem-output').value);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // ── Box Shadow Generator ─────────────────────────────────────────
    function bsUpdate() {
      const h = document.getElementById('bs-h')?.value ?? 4;
      const v = document.getElementById('bs-v')?.value ?? 4;
      const blur = document.getElementById('bs-blur')?.value ?? 12;
      const spread = document.getElementById('bs-spread')?.value ?? 0;
      const color = document.getElementById('bs-color')?.value ?? '#000000';
      const opacity = document.getElementById('bs-opacity')?.value ?? 60;
      const inset = document.getElementById('bs-inset')?.checked ?? false;
      const set = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      set('bs-h-val', h + 'px');
      set('bs-v-val', v + 'px');
      set('bs-blur-val', blur + 'px');
      set('bs-spread-val', spread + 'px');
      set('bs-opacity-val', opacity + '%');
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const rgba = `rgba(${r},${g},${b},${(opacity/100).toFixed(2)})`;
      const shadow = `${inset ? 'inset ' : ''}${h}px ${v}px ${blur}px ${spread}px ${rgba}`;
      const out = document.getElementById('bs-output');
      if (out) out.value = `box-shadow: ${shadow};`;
      const preview = document.getElementById('bs-preview');
      if (preview) {
        preview.style.boxShadow = shadow;
        preview.textContent = '';
      }
    }

    function bsCopy() {
      copyToClipboard(document.getElementById('bs-output').value);
    }

    function bsInsert() {
      insertAtCursor(document.getElementById('bs-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Gradient Generator ───────────────────────────────────────────
    let gradStops = [{
      color: '#4f8ef7',
      pct: 0
    }, {
      color: '#a855f7',
      pct: 100
    }];

    function gradRenderStops() {
      const container = document.getElementById('grad-stops');
      if (!container) return;
      container.innerHTML = gradStops.map((s, i) => `
          <div class="grad-stop-row">
            <input type="color" value="${s.color}" oninput="gradStops[${i}].color=this.value;gradUpdate()">
            <input type="range" min="0" max="100" value="${s.pct}" oninput="gradStops[${i}].pct=+this.value;document.getElementById('gp${i}').textContent=this.value+'%';gradUpdate()">
            <span class="grad-stop-pct" id="gp${i}">${s.pct}%</span>
            ${gradStops.length > 2 ? `<button onclick="gradRemoveStop(${i})" style="padding:2px 7px;background:var(--btn-bg);border:1px solid var(--status-bar-border);border-radius:4px;color:var(--text-secondary);cursor:pointer;font-size:12px">✕</button>` : ''}
          </div>`).join('');
    }

    function gradUpdate() {
      const type = document.getElementById('grad-type')?.value ?? 'linear';
      const dir = document.getElementById('grad-dir')?.value ?? 'to right';
      const stops = gradStops.map(s => `${s.color} ${s.pct}%`).join(', ');
      let css;
      if (type === 'radial') css = `background: radial-gradient(circle, ${stops});`;
      else if (type === 'conic') css = `background: conic-gradient(${stops});`;
      else css = `background: linear-gradient(${dir}, ${stops});`;
      const out = document.getElementById('grad-output');
      if (out) out.value = css;
      const preview = document.getElementById('grad-preview');
      if (preview) {
        preview.style.cssText = '';
        preview.style.cssText = css + 'height:80px;border-radius:6px;';
      }
    }

    function gradAddStop() {
      gradStops.push({
        color: '#f97316',
        pct: Math.round((gradStops[gradStops.length - 1].pct + 100) / 2)
      });
      gradRenderStops();
      gradUpdate();
    }

    function gradRemoveStop(i) {
      gradStops.splice(i, 1);
      gradRenderStops();
      gradUpdate();
    }

    function gradCopy() {
      copyToClipboard(document.getElementById('grad-output').value);
    }

    function gradInsert() {
      insertAtCursor(document.getElementById('grad-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Border Radius Generator ──────────────────────────────────────
    function brSetAll(val) {
      ['tl', 'tr', 'bl', 'br'].forEach(c => {
        const sl = document.getElementById('br-' + c);
        const lbl = document.getElementById('br-' + c + '-val');
        if (sl) sl.value = val;
        if (lbl) lbl.textContent = val + 'px';
      });
      const allLbl = document.getElementById('br-all-val');
      if (allLbl) allLbl.textContent = val + 'px';
      brUpdate();
    }

    function brUpdate() {
      const g = id => document.getElementById(id)?.value ?? 8;
      const tl = g('br-tl'),
        tr = g('br-tr'),
        bl = g('br-bl'),
        br = g('br-br');
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val + 'px';
      };
      set('br-tl-val', tl);
      set('br-tr-val', tr);
      set('br-bl-val', bl);
      set('br-br-val', br);
      const css = (tl === tr && tr === br && br === bl) ?
        `border-radius: ${tl}px;` :
        `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
      const out = document.getElementById('br-output');
      if (out) out.value = css;
      const preview = document.getElementById('br-preview');
      if (preview) preview.style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    }

    function brCopy() {
      copyToClipboard(document.getElementById('br-output').value);
    }

    function brInsert() {
      insertAtCursor(document.getElementById('br-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Snippet Library ──────────────────────────────────────────────
    const SNIPPETS_KEY = 'editor_snippets_v1';

    function snippetLoad() {
      try {
        return JSON.parse(localStorage.getItem(SNIPPETS_KEY) || '[]');
      } catch {
        return [];
      }
    }

    function snippetSave(arr) {
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(arr));
    }

    function snippetRender() {
      const all = snippetLoad();
      const q = (document.getElementById('snippet-search')?.value || '').toLowerCase();
      const snippets = q ? all.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) : all;
      const badge = document.getElementById('snippet-count');
      if (badge) badge.textContent = all.length || '';
      const list = document.getElementById('snippet-list');
      if (!list) return;
      if (!snippets.length) {
        list.innerHTML = `<div style="padding:14px;color:var(--text-secondary);font-size:12px;text-align:center">${all.length ? 'No results.' : 'No snippets yet.<br>Select code in the editor and click Save Selection.'}</div>`;
        return;
      }
      list.innerHTML = snippets.map((s, i) => `
          <div class="snippet-item">
            <div class="snippet-info">
              <div class="snippet-name">${escapeHtml(s.name)}</div>
              <div class="snippet-preview">${escapeHtml(s.code.substring(0,70))}${s.code.length>70?'…':''}</div>
            </div>
            <div class="snippet-btns">
              <button class="snippet-btn" onclick="snippetInsert(${s.id})">Insert</button>
              <button class="snippet-btn" onclick="snippetCopyOne(${s.id})">Copy</button>
              <button class="snippet-btn del" onclick="snippetDelete(${s.id})">✕</button>
            </div>
          </div>`).join('');
    }

    function snippetSaveFromEditor() {
      const name = document.getElementById('snippet-name-input').value.trim();
      if (!name) {
        toast('Enter a snippet name first', 'warning');
        return;
      }
      const sel = window.getSelection();
      const code = (sel && sel.toString().trim()) ? sel.toString() : (document.getElementById('editor')?.innerText || '');
      if (!code.trim()) {
        toast('Nothing selected or editor is empty', 'warning');
        return;
      }
      const arr = snippetLoad();
      arr.unshift({
        id: Date.now(),
        name,
        code,
        created: new Date().toISOString()
      });
      snippetSave(arr);
      snippetRender();
      document.getElementById('snippet-name-input').value = '';
      toast('Snippet saved!', 'success');
    }

    function snippetSaveFromInput() {
      const name = document.getElementById('snippet-name-input').value.trim();
      const code = document.getElementById('snippet-code-input').value;
      if (!name) {
        toast('Enter a snippet name', 'warning');
        return;
      }
      if (!code.trim()) {
        toast('Enter some code', 'warning');
        return;
      }
      const arr = snippetLoad();
      arr.unshift({
        id: Date.now(),
        name,
        code,
        created: new Date().toISOString()
      });
      snippetSave(arr);
      snippetRender();
      document.getElementById('snippet-name-input').value = '';
      document.getElementById('snippet-code-input').value = '';
      toast('Snippet saved!', 'success');
    }

    function snippetClearInput() {
      document.getElementById('snippet-name-input').value = '';
      document.getElementById('snippet-code-input').value = '';
    }

    function snippetInsert(id) {
      const s = snippetLoad().find(x => x.id === id);
      if (!s) return;
      insertAtCursor(s.code);
      closeToolsModal();
      toast('Snippet inserted', 'success');
    }

    function snippetCopyOne(id) {
      const s = snippetLoad().find(x => x.id === id);
      if (s) copyToClipboard(s.code);
    }

    function snippetDelete(id) {
      snippetSave(snippetLoad().filter(x => x.id !== id));
      snippetRender();
      toast('Snippet deleted', 'info');
    }

    // ── Case Converter ───────────────────────────────────────────────
    function caseConvert(type) {
      const input = document.getElementById('case-input').value;
      if (!input.trim()) {
        toast('Enter some text first', 'warning');
        return;
      }
      const words = input.trim().replace(/[\s\-_]+/g, ' ').split(' ');
      let result = '';
      switch (type) {
        case 'upper':
          result = input.toUpperCase();
          break;
        case 'lower':
          result = input.toLowerCase();
          break;
        case 'title':
          result = input.replace(/\b\w/g, c => c.toUpperCase());
          break;
        case 'sentence':
          result = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
          break;
        case 'camel':
          result = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
          break;
        case 'pascal':
          result = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
          break;
        case 'snake':
          result = words.map(w => w.toLowerCase()).join('_');
          break;
        case 'kebab':
          result = words.map(w => w.toLowerCase()).join('-');
          break;
      }
      document.getElementById('case-output').value = result;
    }

    function caseCopy() {
      copyToClipboard(document.getElementById('case-output').value);
    }

    function caseInsert() {
      insertAtCursor(document.getElementById('case-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Typography Builder ───────────────────────────────────────────
    function typoUpdate() {
      const size = document.getElementById('typo-size')?.value ?? 16;
      const lhRaw = document.getElementById('typo-lh')?.value ?? 16;
      const lsRaw = document.getElementById('typo-ls')?.value ?? 0;
      const fwRaw = document.getElementById('typo-fw')?.value ?? 4;
      const shBlur = document.getElementById('typo-sh-blur')?.value ?? 0;
      const shCol = document.getElementById('typo-sh-color')?.value ?? '#000000';
      const lh = (lhRaw / 10).toFixed(1);
      const ls = (lsRaw / 10).toFixed(2);
      const fw = fwRaw * 100;
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set('typo-size-val', size + 'px');
      set('typo-lh-val', lh);
      set('typo-ls-val', ls + 'px');
      set('typo-fw-val', fw);
      set('typo-sh-blur-val', shBlur + 'px');
      const preview = document.getElementById('typo-preview');
      if (preview) {
        preview.style.fontSize = size + 'px';
        preview.style.lineHeight = lh;
        preview.style.letterSpacing = ls + 'px';
        preview.style.fontWeight = fw;
        preview.style.textShadow = parseInt(shBlur) > 0 ? `1px 1px ${shBlur}px ${shCol}` : 'none';
      }
      const lines = [
        `font-size: ${size}px;`,
        `line-height: ${lh};`,
        `letter-spacing: ${ls}px;`,
        `font-weight: ${fw};`,
      ];
      if (parseInt(shBlur) > 0) lines.push(`text-shadow: 1px 1px ${shBlur}px ${shCol};`);
      const out = document.getElementById('typo-output');
      if (out) out.value = lines.join('\n');
    }

    function typoCopy() {
      copyToClipboard(document.getElementById('typo-output').value);
    }

    function typoInsert() {
      insertAtCursor(document.getElementById('typo-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── CSS Filter Generator ─────────────────────────────────────────
    function filterUpdate() {
      const g = id => document.getElementById(id)?.value ?? 0;
      const blur = g('flt-blur'),
        bright = g('flt-bright'),
        contrast = g('flt-contrast');
      const sat = g('flt-sat'),
        hue = g('flt-hue'),
        sepia = g('flt-sepia');
      const gray = g('flt-gray'),
        invert = g('flt-invert');
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set('flt-blur-val', blur + 'px');
      set('flt-bright-val', bright + '%');
      set('flt-contrast-val', contrast + '%');
      set('flt-sat-val', sat + '%');
      set('flt-hue-val', hue + '°');
      set('flt-sepia-val', sepia + '%');
      set('flt-gray-val', gray + '%');
      set('flt-invert-val', invert + '%');
      const parts = [];
      if (parseFloat(blur) !== 0) parts.push(`blur(${blur}px)`);
      if (parseFloat(bright) !== 100) parts.push(`brightness(${bright}%)`);
      if (parseFloat(contrast) !== 100) parts.push(`contrast(${contrast}%)`);
      if (parseFloat(sat) !== 100) parts.push(`saturate(${sat}%)`);
      if (parseFloat(hue) !== 0) parts.push(`hue-rotate(${hue}deg)`);
      if (parseFloat(sepia) !== 0) parts.push(`sepia(${sepia}%)`);
      if (parseFloat(gray) !== 0) parts.push(`grayscale(${gray}%)`);
      if (parseFloat(invert) !== 0) parts.push(`invert(${invert}%)`);
      const val = parts.length ? parts.join(' ') : 'none';
      const out = document.getElementById('filter-output');
      if (out) out.value = `filter: ${val};`;
      const preview = document.getElementById('filter-preview');
      if (preview) preview.style.filter = val;
    }

    function filterReset() {
      const resets = {
        'flt-blur': 0,
        'flt-bright': 100,
        'flt-contrast': 100,
        'flt-sat': 100,
        'flt-hue': 0,
        'flt-sepia': 0,
        'flt-gray': 0,
        'flt-invert': 0
      };
      Object.entries(resets).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
      });
      filterUpdate();
    }

    function filterCopy() {
      copyToClipboard(document.getElementById('filter-output').value);
    }

    function filterInsert() {
      insertAtCursor(document.getElementById('filter-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── CSS Transform Generator ──────────────────────────────────────
    function transformUpdate() {
      const g = id => document.getElementById(id)?.value ?? 0;
      const rotate = g('tf-rotate');
      const sx = (g('tf-sx') / 10).toFixed(1),
        sy = (g('tf-sy') / 10).toFixed(1);
      const tx = g('tf-tx'),
        ty = g('tf-ty');
      const skx = g('tf-skx'),
        sky = g('tf-sky');
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set('tf-rotate-val', rotate + '°');
      set('tf-sx-val', sx);
      set('tf-sy-val', sy);
      set('tf-tx-val', tx + 'px');
      set('tf-ty-val', ty + 'px');
      set('tf-skx-val', skx + '°');
      set('tf-sky-val', sky + '°');
      const parts = [];
      if (parseFloat(rotate) !== 0) parts.push(`rotate(${rotate}deg)`);
      if (parseFloat(sx) !== 1 || parseFloat(sy) !== 1) {
        sx === sy ? parts.push(`scale(${sx})`) : parts.push(`scaleX(${sx}) scaleY(${sy})`);
      }
      if (parseFloat(tx) !== 0 || parseFloat(ty) !== 0) parts.push(`translate(${tx}px, ${ty}px)`);
      if (parseFloat(skx) !== 0 || parseFloat(sky) !== 0) parts.push(`skew(${skx}deg, ${sky}deg)`);
      const val = parts.length ? parts.join(' ') : 'none';
      const out = document.getElementById('transform-output');
      if (out) out.value = `transform: ${val};`;
      const preview = document.getElementById('transform-preview');
      if (preview) preview.style.transform = val === 'none' ? '' : val;
    }

    function transformReset() {
      const resets = {
        'tf-rotate': 0,
        'tf-sx': 10,
        'tf-sy': 10,
        'tf-tx': 0,
        'tf-ty': 0,
        'tf-skx': 0,
        'tf-sky': 0
      };
      Object.entries(resets).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el) el.value = v;
      });
      transformUpdate();
    }

    function transformCopy() {
      copyToClipboard(document.getElementById('transform-output').value);
    }

    function transformInsert() {
      insertAtCursor(document.getElementById('transform-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Transition Builder ───────────────────────────────────────────
    let _transEase = 'ease';

    function transSetEase(val, btn) {
      _transEase = val;
      document.querySelectorAll('#trans-ease-btns .ease-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      transUpdate();
    }

    function transUpdate() {
      const prop = document.getElementById('trans-prop')?.value.trim() || 'all';
      const dur = ((document.getElementById('trans-dur')?.value ?? 3) / 10).toFixed(1);
      const delay = ((document.getElementById('trans-delay')?.value ?? 0) / 10).toFixed(1);
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set('trans-dur-val', dur + 's');
      set('trans-delay-val', delay + 's');
      const parts = [prop, `${dur}s`, _transEase];
      if (parseFloat(delay) > 0) parts.push(`${delay}s`);
      const out = document.getElementById('trans-output');
      if (out) out.value = `transition: ${parts.join(' ')};`;
    }

    function transCopy() {
      copyToClipboard(document.getElementById('trans-output').value);
    }

    function transInsert() {
      insertAtCursor(document.getElementById('trans-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Flexbox Helper ───────────────────────────────────────────────
    const _flex = {
      dir: 'row',
      jc: 'flex-start',
      ai: 'stretch',
      wrap: 'nowrap',
      gap: 8
    };

    function flexSet(prop, val, btn) {
      _flex[prop] = val;
      const row = btn.closest('.ease-btn-row');
      if (row) row.querySelectorAll('.ease-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      flexUpdate();
    }

    function flexGapUpdate() {
      const v = document.getElementById('flex-gap')?.value ?? 8;
      const lbl = document.getElementById('flex-gap-val');
      if (lbl) lbl.textContent = v + 'px';
      _flex.gap = v;
      flexUpdate();
    }

    function flexUpdate() {
      const demo = document.getElementById('flex-demo');
      if (demo) {
        demo.style.flexDirection = _flex.dir;
        demo.style.justifyContent = _flex.jc;
        demo.style.alignItems = _flex.ai;
        demo.style.flexWrap = _flex.wrap;
        demo.style.gap = _flex.gap + 'px';
      }
      const out = document.getElementById('flex-output');
      if (out) out.value = [
        'display: flex;',
        `flex-direction: ${_flex.dir};`,
        `justify-content: ${_flex.jc};`,
        `align-items: ${_flex.ai};`,
        `flex-wrap: ${_flex.wrap};`,
        `gap: ${_flex.gap}px;`,
      ].join('\n');
    }

    function flexCopy() {
      copyToClipboard(document.getElementById('flex-output').value);
    }

    function flexInsert() {
      insertAtCursor(document.getElementById('flex-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── Unit Converter ───────────────────────────────────────────────
    function unitConvert() {
      const val = parseFloat(document.getElementById('unit-val')?.value) || 0;
      const from = document.getElementById('unit-from')?.value ?? 'px';
      const base = parseFloat(document.getElementById('unit-base')?.value) || 16;
      const vw = parseFloat(document.getElementById('unit-vw')?.value) || 1440;
      const vh = parseFloat(document.getElementById('unit-vh')?.value) || 900;
      let px;
      switch (from) {
        case 'px':
          px = val;
          break;
        case 'rem':
          px = val * base;
          break;
        case 'em':
          px = val * base;
          break;
        case 'vw':
          px = val * vw / 100;
          break;
        case 'vh':
          px = val * vh / 100;
          break;
        case 'pt':
          px = val * 1.3333;
          break;
        case '%':
          px = val * base / 100;
          break;
        default:
          px = val;
      }
      const r = n => {
        const f = parseFloat(n.toFixed(4));
        return f;
      };
      const rows = [
        ['px', r(px), ''],
        ['rem', r(px / base), ''],
        ['em', r(px / base), ''],
        ['vw', r(px / vw * 100), ''],
        ['vh', r(px / vh * 100), ''],
        ['pt', r(px / 1.3333), ''],
        ['%', r(px / base * 100), ''],
      ];
      const table = document.getElementById('unit-table');
      if (table) table.innerHTML = rows.map(([unit, v]) =>
        `<tr><td>${unit}</td><td onclick="copyToClipboard('${v}${unit}')" title="Click to copy">${v}${unit}</td></tr>`
      ).join('');
    }

    // ── WebKit Helper ────────────────────────────────────────────────
    // Scrollbar Builder
    function wkSbUpdate() {
      const w = document.getElementById('wk-sb-w')?.value ?? 8;
      const tr = document.getElementById('wk-sb-tr')?.value ?? 4;
      const thumbr = document.getElementById('wk-sb-thumbr')?.value ?? 4;
      const track = document.getElementById('wk-sb-track')?.value ?? '#1a1a2e';
      const thumb = document.getElementById('wk-sb-thumb')?.value ?? '#4f8ef7';
      const hover = document.getElementById('wk-sb-hover')?.value ?? '#7aaaf8';
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set('wk-sb-w-val', w + 'px');
      set('wk-sb-tr-val', tr + 'px');
      set('wk-sb-thumbr-val', thumbr + 'px');
      // Inject live preview style
      let style = document.getElementById('wk-sb-live-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'wk-sb-live-style';
        document.head.appendChild(style);
      }
      style.textContent = `
          #wk-sb-preview::-webkit-scrollbar { width: ${w}px; }
          #wk-sb-preview::-webkit-scrollbar-track { background: ${track}; border-radius: ${tr}px; }
          #wk-sb-preview::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: ${thumbr}px; }
          #wk-sb-preview::-webkit-scrollbar-thumb:hover { background: ${hover}; }
        `;
      const css = `::-webkit-scrollbar {\n  width: ${w}px;\n}\n::-webkit-scrollbar-track {\n  background: ${track};\n  border-radius: ${tr}px;\n}\n::-webkit-scrollbar-thumb {\n  background: ${thumb};\n  border-radius: ${thumbr}px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: ${hover};\n}`;
      const out = document.getElementById('wk-sb-output');
      if (out) out.value = css;
    }

    function wkSbCopy() {
      copyToClipboard(document.getElementById('wk-sb-output').value);
    }

    function wkSbInsert() {
      insertAtCursor(document.getElementById('wk-sb-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // Gradient Text Mask
    let wkTextStops = [{
      color: '#4f8ef7',
      pct: 0
    }, {
      color: '#a855f7',
      pct: 100
    }];

    function wkTextRenderStops() {
      const container = document.getElementById('wk-text-stops');
      if (!container) return;
      container.innerHTML = wkTextStops.map((s, i) => `
          <div class="grad-stop-row">
            <input type="color" value="${s.color}" oninput="wkTextStops[${i}].color=this.value;wkTextUpdate()">
            <input type="range" min="0" max="100" value="${s.pct}" style="min-width:0" oninput="wkTextStops[${i}].pct=+this.value;document.getElementById('wkt${i}').textContent=this.value+'%';wkTextUpdate()">
            <span class="grad-stop-pct" id="wkt${i}">${s.pct}%</span>
            ${wkTextStops.length > 2 ? `<button onclick="wkTextRemoveStop(${i})" style="padding:2px 7px;background:var(--btn-bg);border:1px solid var(--status-bar-border);border-radius:4px;color:var(--text-secondary);cursor:pointer;font-size:12px">✕</button>` : ''}
          </div>`).join('');
    }

    function wkTextUpdate() {
      const dir = document.getElementById('wk-text-dir')?.value ?? 'to right';
      const stops = wkTextStops.map(s => `${s.color} ${s.pct}%`).join(', ');
      const gradient = `linear-gradient(${dir}, ${stops})`;
      const preview = document.getElementById('wk-text-preview');
      if (preview) {
        preview.style.background = gradient;
        preview.style.webkitBackgroundClip = 'text';
        preview.style.webkitTextFillColor = 'transparent';
        preview.style.backgroundClip = 'text';
      }
      const out = document.getElementById('wk-text-output');
      if (out) out.value = `background: linear-gradient(${dir}, ${stops});\n-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;\nbackground-clip: text;`;
    }

    function wkTextAddStop() {
      const lastPct = wkTextStops[wkTextStops.length - 1].pct;
      wkTextStops.push({
        color: '#f97316',
        pct: Math.min(100, Math.round((lastPct + 100) / 2))
      });
      wkTextRenderStops();
      wkTextUpdate();
    }

    function wkTextRemoveStop(i) {
      wkTextStops.splice(i, 1);
      wkTextRenderStops();
      wkTextUpdate();
    }

    function wkTextCopy() {
      copyToClipboard(document.getElementById('wk-text-output').value);
    }

    function wkTextInsert() {
      insertAtCursor(document.getElementById('wk-text-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // Common WebKit Snippets
    const WK_SNIPPETS = [{
        name: 'Smooth font rendering',
        code: '-webkit-font-smoothing: antialiased;\n-moz-osx-font-smoothing: grayscale;'
      },
      {
        name: 'Remove mobile tap highlight',
        code: '-webkit-tap-highlight-color: transparent;'
      },
      {
        name: 'iOS momentum scrolling',
        code: '-webkit-overflow-scrolling: touch;\noverflow-y: scroll;'
      },
      {
        name: 'Remove input appearance',
        code: '-webkit-appearance: none;\n-moz-appearance: none;\nappearance: none;'
      },
      {
        name: 'Line clamp — 2 lines',
        code: 'display: -webkit-box;\n-webkit-line-clamp: 2;\n-webkit-box-orient: vertical;\noverflow: hidden;'
      },
      {
        name: 'Line clamp — 3 lines',
        code: 'display: -webkit-box;\n-webkit-line-clamp: 3;\n-webkit-box-orient: vertical;\noverflow: hidden;'
      },
      {
        name: 'Hide scrollbar (keep scroll)',
        code: '-ms-overflow-style: none;\nscrollbar-width: none;\n\n/* also add: */\n.el::-webkit-scrollbar { display: none; }'
      },
      {
        name: 'Prevent text size adjust',
        code: '-webkit-text-size-adjust: 100%;\n-moz-text-size-adjust: 100%;\ntext-size-adjust: 100%;'
      },
      {
        name: 'User select none',
        code: '-webkit-user-select: none;\n-moz-user-select: none;\nuser-select: none;'
      },
      {
        name: 'User select all',
        code: '-webkit-user-select: all;\nuser-select: all;'
      },
      {
        name: 'GPU acceleration',
        code: '-webkit-transform: translateZ(0);\ntransform: translateZ(0);\nwill-change: transform;'
      },
      {
        name: 'Backface visibility hidden',
        code: '-webkit-backface-visibility: hidden;\nbackface-visibility: hidden;'
      },
      {
        name: 'Placeholder color',
        code: '::-webkit-input-placeholder { color: #999; opacity: 1; }\n::placeholder { color: #999; opacity: 1; }'
      },
      {
        name: 'Custom selection color',
        code: '::-webkit-selection { background: #4f8ef7; color: #fff; }\n::selection { background: #4f8ef7; color: #fff; }'
      },
      {
        name: 'Disable autofill yellow bg',
        code: 'input:-webkit-autofill,\ninput:-webkit-autofill:hover,\ninput:-webkit-autofill:focus {\n  -webkit-box-shadow: 0 0 0 1000px transparent inset;\n  transition: background-color 5000s ease-in-out 0s;\n}'
      },
      {
        name: 'Smooth scrolling',
        code: 'scroll-behavior: smooth;\n-webkit-overflow-scrolling: touch;'
      },
      {
        name: 'Print color adjust',
        code: '-webkit-print-color-adjust: exact;\nprint-color-adjust: exact;'
      },
    ];

    function wkSnippetsRender() {
      const list = document.getElementById('wk-snippets-list');
      if (!list) return;
      list.innerHTML = WK_SNIPPETS.map((s, i) => `
          <div class="snippet-item">
            <div class="snippet-info">
              <div class="snippet-name">${escapeHtml(s.name)}</div>
              <div class="snippet-preview">${escapeHtml(s.code.split('\n')[0])}${s.code.includes('\n') ? ' …' : ''}</div>
            </div>
            <div class="snippet-btns">
              <button class="snippet-btn" onclick="wkSnippetInsert(${i})">Insert</button>
              <button class="snippet-btn" onclick="wkSnippetCopy(${i})">Copy</button>
            </div>
          </div>`).join('');
    }

    function wkSnippetInsert(i) {
      insertAtCursor(WK_SNIPPETS[i].code);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    function wkSnippetCopy(i) {
      copyToClipboard(WK_SNIPPETS[i].code);
    }

    // ── RNG Generator ────────────────────────────────────────────────
    let _rngLang = 'js';

    function rngSetLang(lang, btn) {
      _rngLang = lang;
      document.querySelectorAll('#rng-lang-js,#rng-lang-py').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rngUpdate();
    }

    function rngUpdate() {
      const type = document.getElementById('rng-type')?.value || 'uniform-int';
      const min = parseFloat(document.getElementById('rng-min')?.value) || 0;
      const max = parseFloat(document.getElementById('rng-max')?.value) ?? 100;
      const mean = parseFloat(document.getElementById('rng-mean')?.value) || 0;
      const std = parseFloat(document.getElementById('rng-std')?.value) || 1;
      const seed = parseInt(document.getElementById('rng-seed')?.value) || 42;
      const count = parseInt(document.getElementById('rng-count')?.value) || 1;
      const decimals = parseInt(document.getElementById('rng-decimals')?.value) ?? 2;

      const rangeRow = document.getElementById('rng-range-row');
      const gaussRow = document.getElementById('rng-gauss-row');
      const seedRow = document.getElementById('rng-seed-row');
      const decWrap = document.getElementById('rng-decimals-wrap');

      const hasRange = ['uniform-int', 'uniform-float', 'seeded', 'crypto'].includes(type);
      if (rangeRow) rangeRow.style.display = hasRange ? 'flex' : 'none';
      if (gaussRow) gaussRow.style.display = type === 'gaussian' ? 'flex' : 'none';
      if (seedRow) seedRow.style.display = type === 'seeded' ? 'block' : 'none';
      if (decWrap) decWrap.style.display = ['uniform-float', 'gaussian'].includes(type) ? 'flex' : 'none';

      const code = _rngLang === 'js' ?
        rngBuildJS(type, min, max, mean, std, seed, count, decimals) :
        rngBuildPy(type, min, max, mean, std, seed, count, decimals);

      const out = document.getElementById('rng-output');
      if (out) out.value = code;
    }

    function rngBuildJS(type, min, max, mean, std, seed, count, decimals) {
      const multi = count > 1;
      switch (type) {
        case 'uniform-int': {
          let c = `function randomInt(min, max) {\n  return Math.floor(Math.random() * (max - min + 1)) + min;\n}`;
          if (multi) {
            c += `\n\nfunction randomInts(min, max, count) {\n  return Array.from({ length: count }, () => randomInt(min, max));\n}`;
            c += `\n\n// ${count} random integers between ${min} and ${max}\nconst results = randomInts(${min}, ${max}, ${count});\nconsole.log(results);`;
          } else {
            c += `\n\n// Random integer between ${min} and ${max}\nconst result = randomInt(${min}, ${max});\nconsole.log(result);`;
          }
          return c;
        }
        case 'uniform-float': {
          let c = `function randomFloat(min, max, decimals = ${decimals}) {\n  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));\n}`;
          if (multi) {
            c += `\n\nfunction randomFloats(min, max, count, decimals = ${decimals}) {\n  return Array.from({ length: count }, () => randomFloat(min, max, decimals));\n}`;
            c += `\n\n// ${count} random floats between ${min} and ${max}\nconst results = randomFloats(${min}, ${max}, ${count}, ${decimals});\nconsole.log(results);`;
          } else {
            c += `\n\n// Random float between ${min} and ${max}\nconst result = randomFloat(${min}, ${max}, ${decimals});\nconsole.log(result);`;
          }
          return c;
        }
        case 'gaussian': {
          let c = `// Box-Muller transform — normal distribution\nfunction randomGaussian(mean = ${mean}, std = ${std}) {\n  let u, v;\n  do { u = Math.random(); } while (u === 0);\n  do { v = Math.random(); } while (v === 0);\n  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);\n  return z * std + mean;\n}`;
          if (multi) {
            c += `\n\n// ${count} samples, μ=${mean}, σ=${std}\nconst results = Array.from({ length: ${count} }, () =>\n  parseFloat(randomGaussian(${mean}, ${std}).toFixed(${decimals}))\n);\nconsole.log(results);`;
          } else {
            c += `\n\n// μ=${mean}, σ=${std}\nconst result = parseFloat(randomGaussian(${mean}, ${std}).toFixed(${decimals}));\nconsole.log(result);`;
          }
          return c;
        }
        case 'seeded': {
          let c = `// Mulberry32 — fast, seedable PRNG\nfunction createSeededRNG(seed) {\n  return function() {\n    seed |= 0; seed = seed + 0x6D2B79F5 | 0;\n    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);\n    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;\n    return ((t ^ t >>> 14) >>> 0) / 4294967296;\n  };\n}\n\nfunction seededRandomInt(rng, min, max) {\n  return Math.floor(rng() * (max - min + 1)) + min;\n}`;
          if (multi) {
            c += `\n\n// Reproducible with seed ${seed}\nconst rng = createSeededRNG(${seed});\nconst results = Array.from({ length: ${count} }, () => seededRandomInt(rng, ${min}, ${max}));\nconsole.log(results);`;
          } else {
            c += `\n\n// Always same result for seed ${seed}\nconst rng = createSeededRNG(${seed});\nconst result = seededRandomInt(rng, ${min}, ${max});\nconsole.log(result);`;
          }
          return c;
        }
        case 'crypto': {
          let c = `// Cryptographically-secure RNG (Web Crypto API)\nfunction cryptoRandomInt(min, max) {\n  const range = max - min + 1;\n  const arr = new Uint32Array(1);\n  // Rejection sampling — avoids modulo bias\n  const limit = Math.floor(0x100000000 / range) * range;\n  let n;\n  do { crypto.getRandomValues(arr); n = arr[0]; } while (n >= limit);\n  return (n % range) + min;\n}`;
          if (multi) {
            c += `\n\nfunction cryptoRandomInts(min, max, count) {\n  return Array.from({ length: count }, () => cryptoRandomInt(min, max));\n}`;
            c += `\n\n// ${count} crypto-secure integers between ${min} and ${max}\nconst results = cryptoRandomInts(${min}, ${max}, ${count});\nconsole.log(results);`;
          } else {
            c += `\n\n// Crypto-secure integer between ${min} and ${max}\nconst result = cryptoRandomInt(${min}, ${max});\nconsole.log(result);`;
          }
          return c;
        }
        case 'weighted': {
          return `// Weighted random selection\nfunction weightedRandom(items) {\n  // items = [{ value, weight }, ...]\n  const total = items.reduce((sum, item) => sum + item.weight, 0);\n  let rand = Math.random() * total;\n  for (const item of items) {\n    rand -= item.weight;\n    if (rand <= 0) return item.value;\n  }\n  return items[items.length - 1].value;\n}\n\n// Adjust values and weights to fit your needs\nconst result = weightedRandom([\n  { value: 'common',    weight: 70 },\n  { value: 'uncommon',  weight: 20 },\n  { value: 'rare',      weight:  9 },\n  { value: 'legendary', weight:  1 },\n]);\nconsole.log(result);`;
        }
        case 'shuffle': {
          return `// Fisher-Yates shuffle\nfunction shuffleArray(arr) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}\n\n// Usage\nconst original = [1, 2, 3, 4, 5, 6, 7, 8];\nconst shuffled = shuffleArray(original);\nconsole.log(shuffled);`;
        }
        default:
          return '';
      }
    }

    function rngBuildPy(type, min, max, mean, std, seed, count, decimals) {
      const multi = count > 1;
      switch (type) {
        case 'uniform-int': {
          let c = `import random\n\ndef random_int(min_val, max_val):\n    return random.randint(min_val, max_val)`;
          if (multi) {
            c += `\n\ndef random_ints(min_val, max_val, count):\n    return [random.randint(min_val, max_val) for _ in range(count)]`;
            c += `\n\n# ${count} random integers between ${min} and ${max}\nresults = random_ints(${min}, ${max}, ${count})\nprint(results)`;
          } else {
            c += `\n\n# Random integer between ${min} and ${max}\nresult = random_int(${min}, ${max})\nprint(result)`;
          }
          return c;
        }
        case 'uniform-float': {
          let c = `import random\n\ndef random_float(min_val, max_val, decimals=${decimals}):\n    return round(random.uniform(min_val, max_val), decimals)`;
          if (multi) {
            c += `\n\ndef random_floats(min_val, max_val, count, decimals=${decimals}):\n    return [random_float(min_val, max_val, decimals) for _ in range(count)]`;
            c += `\n\n# ${count} random floats between ${min} and ${max}\nresults = random_floats(${min}, ${max}, ${count}, ${decimals})\nprint(results)`;
          } else {
            c += `\n\n# Random float between ${min} and ${max}\nresult = random_float(${min}, ${max}, ${decimals})\nprint(result)`;
          }
          return c;
        }
        case 'gaussian': {
          let c = `import random\n\ndef random_gaussian(mean=${mean}, std=${std}, decimals=${decimals}):\n    return round(random.gauss(mean, std), decimals)`;
          if (multi) {
            c += `\n\n# ${count} samples, μ=${mean}, σ=${std}\nresults = [random_gaussian(${mean}, ${std}, ${decimals}) for _ in range(${count})]\nprint(results)`;
          } else {
            c += `\n\n# μ=${mean}, σ=${std}\nresult = random_gaussian(${mean}, ${std}, ${decimals})\nprint(result)`;
          }
          return c;
        }
        case 'seeded': {
          let c = `import random\n\nrng = random.Random(${seed})\n\ndef seeded_random_int(min_val, max_val):\n    return rng.randint(min_val, max_val)`;
          if (multi) {
            c += `\n\n# Reproducible with seed ${seed}\nresults = [seeded_random_int(${min}, ${max}) for _ in range(${count})]\nprint(results)`;
          } else {
            c += `\n\n# Always same result for seed ${seed}\nresult = seeded_random_int(${min}, ${max})\nprint(result)`;
          }
          return c;
        }
        case 'crypto': {
          let c = `import secrets\n\ndef crypto_random_int(min_val, max_val):\n    return secrets.randbelow(max_val - min_val + 1) + min_val`;
          if (multi) {
            c += `\n\ndef crypto_random_ints(min_val, max_val, count):\n    return [crypto_random_int(min_val, max_val) for _ in range(count)]`;
            c += `\n\n# ${count} crypto-secure integers between ${min} and ${max}\nresults = crypto_random_ints(${min}, ${max}, ${count})\nprint(results)`;
          } else {
            c += `\n\n# Crypto-secure integer between ${min} and ${max}\nresult = crypto_random_int(${min}, ${max})\nprint(result)`;
          }
          return c;
        }
        case 'weighted': {
          return `import random\n\ndef weighted_random(items):\n    # items = list of (value, weight) tuples\n    values, weights = zip(*items)\n    return random.choices(values, weights=weights, k=1)[0]\n\n# Adjust values and weights to fit your needs\nresult = weighted_random([\n    ('common',     70),\n    ('uncommon',   20),\n    ('rare',        9),\n    ('legendary',   1),\n])\nprint(result)`;
        }
        case 'shuffle': {
          return `import random\n\ndef shuffle_list(lst):\n    result = lst.copy()\n    random.shuffle(result)\n    return result\n\n# Usage\noriginal = [1, 2, 3, 4, 5, 6, 7, 8]\nshuffled = shuffle_list(original)\nprint(shuffled)`;
        }
        default:
          return '';
      }
    }

    function rngCopy() {
      copyToClipboard(document.getElementById('rng-output').value);
    }

    function rngInsert() {
      insertAtCursor(document.getElementById('rng-output').value);
      closeToolsModal();
      toast('Inserted', 'success');
    }

    // ── CDN Push Modal ───────────────────────────────────────────────
    function openCdnModal() {
      const settings = getGithubCdnSettings();
      document.getElementById('cdn-owner').value = settings.owner || '';
      document.getElementById('cdn-repo').value = settings.repo || '';
      document.getElementById('cdn-branch').value = settings.branch || 'main';
      document.getElementById('cdn-folder').value = (settings.folder || '').replace(/\/$/, '');
      document.getElementById('cdn-token').value = settings.token || '';
      document.getElementById('cdn-file-info').textContent = state?.currentFile ? `File: ${state.currentFile}` : '';
      document.getElementById('cdn-log').style.display = 'none';
      document.getElementById('cdn-log').innerHTML = '';
      document.getElementById('cdn-result').style.display = 'none';
      document.getElementById('cdn-push-btn').disabled = false;
      document.getElementById('cdn-spinner').style.display = 'none';
      const om = document.getElementById('overflow-menu');
      if (om) om.classList.remove('open');
      document.getElementById('cdnPushModal').style.display = 'flex';
    }

    function closeCdnModal() {
      document.getElementById('cdnPushModal').style.display = 'none';
    }

    function cdnLog(msg, type) {
      const log = document.getElementById('cdn-log');
      log.style.display = 'block';
      const line = document.createElement('div');
      line.className = 'gh-log-line ' + (type || 'info');
      line.innerHTML = `<span>${escapeHtml(msg)}</span>`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
    async function cdnDoPush() {
      const owner = document.getElementById('cdn-owner').value.trim();
      const repo = document.getElementById('cdn-repo').value.trim();
      const branch = document.getElementById('cdn-branch').value.trim() || 'main';
      const folderRaw = document.getElementById('cdn-folder').value.trim();
      const token = document.getElementById('cdn-token').value.trim();
      if (!owner || !repo || !token) {
        toast('Fill in Owner, Repo, and Token', 'warning');
        return;
      }
      Object.assign(_cfg, {
        githubCdnOwner: owner,
        githubCdnRepo: repo,
        githubCdnBranch: branch,
        githubCdnFolder: folderRaw,
        githubCdnToken: token
      });
      cfgSave();
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      if (ext !== 'html' && ext !== 'htm') {
        toast('Switch to an HTML file to push to CDN', 'warning');
        return;
      }
      const btn = document.getElementById('cdn-push-btn');
      const spinner = document.getElementById('cdn-spinner');
      btn.disabled = true;
      spinner.style.display = '';
      document.getElementById('cdn-log').style.display = 'none';
      document.getElementById('cdn-log').innerHTML = '';
      document.getElementById('cdn-result').style.display = 'none';
      const folder = folderRaw ? (folderRaw.endsWith('/') ? folderRaw : folderRaw + '/') : '';
      const settings = {
        owner,
        repo,
        token,
        branch,
        folder
      };
      const baseName = state.currentFile.replace(/\.(html|htm)$/i, '');
      let html = editor.innerText;
      const pushed = [],
        pushedUrls = [];
      try {
        cdnLog('Scanning for inline styles…', 'info');
        const styleBlocks = [];
        html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, c) => {
          if (c.trim()) styleBlocks.push(c.trim());
          return '';
        });
        if (styleBlocks.length > 0) {
          const path = folder + baseName + '.css';
          cdnLog(`Pushing ${path}…`, 'wait');
          const url = await pushFileToGitHub(settings, path, styleBlocks.join('\n\n'));
          html = html.replace('</head>', `  <link rel="stylesheet" href="${url}">\n</head>`);
          pushed.push(baseName + '.css');
          pushedUrls.push(url);
          cdnLog(`✓ ${path}`, 'ok');
        } else {
          cdnLog('No inline styles found.', 'info');
        }
        cdnLog('Scanning for inline scripts…', 'info');
        const scriptBlocks = [];
        html = html.replace(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi, (_, c) => {
          if (c.trim()) scriptBlocks.push(c.trim());
          return '';
        });
        if (scriptBlocks.length > 0) {
          const path = folder + baseName + '.js';
          cdnLog(`Pushing ${path}…`, 'wait');
          const url = await pushFileToGitHub(settings, path, scriptBlocks.join('\n\n'));
          html = html.replace('</body>', `  <script src="${url}"><\/script>\n</body>`);
          pushed.push(baseName + '.js');
          pushedUrls.push(url);
          cdnLog(`✓ ${path}`, 'ok');
        } else {
          cdnLog('No inline scripts found.', 'info');
        }
        if (pushed.length === 0) {
          cdnLog('Nothing to push — no inline styles or scripts found.', 'err');
          btn.disabled = false;
          spinner.style.display = 'none';
          return;
        }
        html = html.replace(/\n{3,}/g, '\n\n').trim();
        state.files[state.currentFile] = html;
        editor.textContent = html;
        saveState();
        updateAll();
        cdnLog('Done! HTML updated with CDN links.', 'ok');
        document.getElementById('cdn-result-urls').innerHTML = pushedUrls.map(u =>
          `<div style="margin-bottom:4px;word-break:break-all">${escapeHtml(u)}</div>`).join('');
        document.getElementById('cdn-result').style.display = 'block';
      } catch (e) {
        cdnLog('Error: ' + e.message, 'err');
      } finally {
        btn.disabled = false;
        spinner.style.display = 'none';
      }
    }

    // Image → Base64
    function handleImgB64(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const uri = ev.target.result;
        document.getElementById('img-b64-thumb').src = uri;
        document.getElementById('img-b64-output').value = uri;
        document.getElementById('img-b64-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    function copyToClipboard(text, msg) {
      msg = msg || 'Copied!';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast(msg, 'success')).catch(() => fallbackCopy(text, msg));
      } else {
        fallbackCopy(text, msg);
      }
    }

    function fallbackCopy(text, msg) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        toast(msg || 'Copied!', 'success');
      } catch (e) {
        toast('Copy failed', 'error');
      }
      document.body.removeChild(ta);
    }

    function copyImgB64() {
      const val = document.getElementById('img-b64-output').value;
      copyToClipboard(val);
    }

    function insertImgB64() {
      insertAtCursor(document.getElementById('img-b64-output').value);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // Text ↔ Base64
    function encodeB64() {
      try {
        const v = document.getElementById('b64-input').value;
        document.getElementById('b64-output').value = btoa(unescape(encodeURIComponent(v)));
      } catch (e) {
        toast('Encode failed: ' + e.message, 'error');
      }
    }

    function decodeB64() {
      try {
        const v = document.getElementById('b64-input').value.trim();
        document.getElementById('b64-output').value = decodeURIComponent(escape(atob(v)));
      } catch (e) {
        toast('Not valid Base64', 'error');
      }
    }

    function swapB64() {
      const a = document.getElementById('b64-input');
      const b = document.getElementById('b64-output');
      const tmp = a.value;
      a.value = b.value;
      b.value = tmp;
    }

    function copyB64Output() {
      copyToClipboard(document.getElementById('b64-output').value);
    }

    function insertB64Output() {
      insertAtCursor(document.getElementById('b64-output').value);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // Base64 → Download
    async function downloadB64File() {
      let raw = document.getElementById('b64-file-input').value.trim();
      let filename = document.getElementById('b64-filename').value.trim() || 'download';
      let mime = 'application/octet-stream';
      if (raw.startsWith('data:')) {
        const m = raw.match(/^data:([^;]+);base64,(.+)$/s);
        if (!m) {
          toast('Invalid data URI', 'error');
          return;
        }
        mime = m[1];
        raw = m[2];
      }
      let bytes;
      try {
        bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      } catch (e) {
        toast('Invalid Base64 data', 'error');
        return;
      }

      const blob = new Blob([bytes], {
        type: mime
      });

      if ('showSaveFilePicker' in window) {
        try {
          const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: ext ? [{
              description: 'File',
              accept: {
                [mime]: [ext]
              }
            }] : undefined,
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast('Saved!', 'success');
        } catch (e) {
          if (e.name !== 'AbortError') toast('Save failed: ' + e.message, 'error');
        }
      } else {
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), {
          href: url,
          download: filename
        }).click();
        URL.revokeObjectURL(url);
        toast('Downloaded!', 'success');
      }
    }

    // CSS Variable Inspector
    function scanCssVars() {
      const content = editor.innerText;
      const matches = [...content.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g)];
      const varList = document.getElementById('var-list');
      const varCount = document.getElementById('var-count');
      if (matches.length === 0) {
        varList.innerHTML = '<span style="color:var(--text-secondary);font-size:13px">No CSS variables found in this file.</span>';
        varCount.textContent = '';
        return;
      }
      // Deduplicate by name, keep last value
      const vars = {};
      for (const m of matches) vars[m[1]] = m[2].trim();
      varCount.textContent = `— ${Object.keys(vars).length} found`;
      varList.innerHTML = Object.entries(vars).map(([name, val]) => {
        const isColor = /^(#|rgb|hsl|oklch|color\(|[a-z]+$)/.test(val) && CSS.supports('color', val);
        const swatch = isColor ? `<span class="var-swatch" style="background:${val}"></span>` : '';
        return `<div class="var-item">
                      ${swatch}
                      <span class="var-name">--${name}</span>
                      <input class="var-input" type="text" value="${val.replace(/"/g,'&quot;')}"
                          data-var="--${name}:${val}"
                          oninput="applyVarChange(this,'--${name}','${val.replace(/'/g,"\\'")}')">
                  </div>`;
      }).join('');
    }

    function applyVarChange(input, varName, oldVal) {
      const newVal = input.value;
      const pattern = new RegExp('(' + varName.replace(/[-]/g, '\\$&') + '\\s*:\\s*)' + oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const newContent = editor.innerText.replace(pattern, '$1' + newVal);
      saveState();
      state.files[state.currentFile] = newContent;
      editor.textContent = newContent;
      updateAll();
      input.dataset.var = varName + ':' + newVal;
      // Update swatch color if applicable
      const swatch = input.closest('.var-item').querySelector('.var-swatch');
      if (swatch && CSS.supports('color', newVal)) swatch.style.background = newVal;
    }

    // ── Font Awesome Icon Browser ─────────────────────────────────
    const FA_URL = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/metadata/icons.json';
    const FA_PER_PAGE = 80;
    let faAllIcons = []; // [{name, styles, label}]
    let faFiltered = [];
    let faPage = 0;
    let faSelectedIcon = null;
    let faSelectedStyle = null;
    let faLoaded = false;

    function faPrefix(style) {
      return style === 'brands' ? 'fa-brands' : style === 'regular' ? 'fa-regular' : 'fa-solid';
    }

    async function faInit() {
      if (faLoaded) return;
      const body = document.getElementById('fa-browser-body');
      body.innerHTML = '<div style="text-align:center;color:var(--text-secondary);font-size:13px;padding:14px 0"><i class="fas fa-spinner fa-spin"></i> Loading icons…</div>';
      try {
        const res = await fetch(FA_URL);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        faAllIcons = Object.entries(data).map(([name, info]) => ({
          name,
          label: info.label || name,
          styles: info.styles || ['solid']
        }));
        faLoaded = true;
        document.getElementById('fa-icon-count').textContent = `${faAllIcons.length} icons`;
        faFiltered = faAllIcons;
        faPage = 0;
        faBuildUI();
      } catch (e) {
        body.innerHTML = `<div style="color:var(--error);font-size:13px;padding:8px 0">Failed to load icons: ${e.message}</div><button class="btn2" onclick="faLoaded=false;faInit()" style="margin-top:6px">Retry</button>`;
      }
    }

    function faBuildUI() {
      const body = document.getElementById('fa-browser-body');
      body.innerHTML = `
                  <div class="fa-browser-controls">
                      <input class="setting-input" id="fa-search" type="text" placeholder="Search icons…" style="flex:1" oninput="faFilter()">
                      <select class="fa-style-select" id="fa-style-filter" onchange="faFilter()">
                          <option value="all">All styles</option>
                          <option value="solid">Solid</option>
                          <option value="regular">Regular</option>
                          <option value="brands">Brands</option>
                      </select>
                  </div>
                  <div id="fa-grid"></div>
                  <div id="fa-pagination"></div>
                  <div id="fa-detail" style="display:none"></div>
              `;
      faFilter();
    }

    function faFilter() {
      const q = (document.getElementById('fa-search')?.value || '').toLowerCase().trim();
      const style = document.getElementById('fa-style-filter')?.value || 'all';
      faFiltered = faAllIcons.filter(icon => {
        const matchQ = !q || icon.name.includes(q) || icon.label.toLowerCase().includes(q);
        const matchS = style === 'all' || icon.styles.includes(style);
        return matchQ && matchS;
      });
      faPage = 0;
      faSelectedIcon = null;
      faSelectedStyle = null;
      const det = document.getElementById('fa-detail');
      if (det) det.style.display = 'none';
      faRenderGrid();
    }

    function faRenderGrid() {
      const grid = document.getElementById('fa-grid');
      const pag = document.getElementById('fa-pagination');
      if (!grid) return;
      const start = faPage * FA_PER_PAGE;
      const slice = faFiltered.slice(start, start + FA_PER_PAGE);
      const totalPages = Math.ceil(faFiltered.length / FA_PER_PAGE);

      if (slice.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:14px 0;text-align:center">No icons found</div>';
        pag.innerHTML = '';
        return;
      }

      grid.innerHTML = slice.map(icon => {
        const style = icon.styles[0];
        const cls = faPrefix(style) + ' fa-' + icon.name;
        return `<div class="fa-icon-cell" onclick="faSelectIcon('${icon.name}')" title="${icon.label}">
                      <i class="${cls}"></i>
                      <span>${icon.name}</span>
                  </div>`;
      }).join('');

      pag.innerHTML = `
                  <button onclick="faGo(${faPage - 1})" ${faPage === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                  <span>${faPage + 1} / ${totalPages || 1}</span>
                  <button onclick="faGo(${faPage + 1})" ${faPage >= totalPages - 1 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
                  <span style="font-size:11px">${faFiltered.length} icons</span>
              `;

      if (faSelectedIcon) {
        const cell = [...grid.querySelectorAll('.fa-icon-cell')].find(c =>
          c.querySelector('span')?.textContent === faSelectedIcon
        );
        if (cell) cell.classList.add('fa-selected');
      }
    }

    function faGo(page) {
      const totalPages = Math.ceil(faFiltered.length / FA_PER_PAGE);
      faPage = Math.max(0, Math.min(page, totalPages - 1));
      faRenderGrid();
    }

    function faSelectIcon(name) {
      const icon = faAllIcons.find(i => i.name === name);
      if (!icon) return;
      faSelectedIcon = name;
      faSelectedStyle = faSelectedStyle && icon.styles.includes(faSelectedStyle) ? faSelectedStyle : icon.styles[0];

      document.querySelectorAll('.fa-icon-cell').forEach(c => c.classList.remove('fa-selected'));
      const cell = [...document.querySelectorAll('.fa-icon-cell')].find(c =>
        c.querySelector('span')?.textContent === name
      );
      if (cell) cell.classList.add('fa-selected');

      faRenderDetail(icon);
    }

    let faDetailData = {};

    function faRenderDetail(icon) {
      const det = document.getElementById('fa-detail');
      if (!det) return;
      det.style.display = 'block';

      const style = faSelectedStyle;
      const prefix = faPrefix(style);
      const cls = prefix + ' fa-' + icon.name;
      const iTag = `<i class="${cls}"></i>`;
      const cdnLink = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">`;

      faDetailData = {
        cls,
        iTag,
        cdnLink
      };

      const styleTabs = icon.styles.map(s =>
        `<span class="fa-style-tab ${s === style ? 'active' : ''}" onclick="faSetStyle('${icon.name}','${s}')">${s}</span>`
      ).join('');

      det.innerHTML = `
                  <div class="fa-detail-preview">
                      <div class="fa-detail-icon"><i class="${cls}"></i></div>
                      <div>
                          <div class="fa-detail-name">${icon.label}</div>
                          <div class="fa-detail-style">fa-${icon.name}</div>
                          <div class="fa-style-tab-row">${styleTabs}</div>
                      </div>
                  </div>
                  <div class="fa-copy-row">
                      <span class="fa-copy-label">Class</span>
                      <span class="fa-copy-value">${cls}</span>
                      <button class="fa-copy-btn" onclick="faCopyByType('cls')">Copy</button>
                  </div>
                  <div class="fa-copy-row">
                      <span class="fa-copy-label">&lt;i&gt; tag</span>
                      <span class="fa-copy-value">${iTag.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
                      <button class="fa-copy-btn" onclick="faCopyByType('iTag')">Copy</button>
                  </div>
                  <div class="fa-copy-row">
                      <span class="fa-copy-label">CDN link</span>
                      <span class="fa-copy-value">${cdnLink.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
                      <button class="fa-copy-btn" onclick="faCopyByType('cdnLink')">Copy</button>
                  </div>
                  <div style="margin-top:8px;display:flex;gap:6px">
                      <button class="btn2" style="flex:1" onclick="faInsert(faDetailData.iTag)">Insert &lt;i&gt; at Cursor</button>
                  </div>
              `;
      det.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    function faCopyByType(type) {
      const text = faDetailData[type];
      if (text) faCopy(text);
    }

    function faSetStyle(name, style) {
      faSelectedStyle = style;
      const icon = faAllIcons.find(i => i.name === name);
      if (icon) faRenderDetail(icon);
    }

    function faCopy(text) {
      copyToClipboard(text);
    }

    function faInsert(text) {
      insertAtCursor(text);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // ── Regex Tester ───────────────────────────────────────────────
    function rxGetFlags() {
      let f = '';
      if (document.getElementById('rx-g')?.checked) f += 'g';
      if (document.getElementById('rx-i')?.checked) f += 'i';
      if (document.getElementById('rx-m')?.checked) f += 'm';
      if (document.getElementById('rx-s')?.checked) f += 's';
      return f;
    }

    function rxUpdateFlags() {
      const f = rxGetFlags();
      const disp = document.getElementById('rx-flags-display');
      if (disp) disp.textContent = f || '—';
      rxRun();
    }

    function rxEscape(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function rxRun() {
      const patEl = document.getElementById('rx-pattern');
      const testEl = document.getElementById('rx-test-str');
      const statusEl = document.getElementById('rx-status');
      const highlEl = document.getElementById('rx-highlighted');
      const matchesEl = document.getElementById('rx-matches');
      if (!patEl || !testEl) return;

      const pattern = patEl.value;
      const testStr = testEl.value;
      statusEl.className = '';
      statusEl.textContent = '';

      if (!pattern) {
        highlEl.style.display = 'none';
        matchesEl.style.display = 'none';
        return;
      }

      let regex;
      try {
        regex = new RegExp(pattern, rxGetFlags());
      } catch (e) {
        statusEl.className = 'rx-error';
        statusEl.textContent = '⚠ ' + e.message;
        highlEl.style.display = 'none';
        matchesEl.style.display = 'none';
        return;
      }

      if (!testStr) {
        highlEl.style.display = 'none';
        matchesEl.style.display = 'none';
        statusEl.className = 'rx-ok';
        statusEl.textContent = 'Enter a test string to see matches.';
        return;
      }

      // Collect all matches
      const isGlobal = regex.flags.includes('g');
      const allMatches = [];
      if (isGlobal) {
        let m;
        regex.lastIndex = 0;
        while ((m = regex.exec(testStr)) !== null) {
          allMatches.push(m);
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(testStr);
        if (m) allMatches.push(m);
      }

      if (allMatches.length === 0) {
        statusEl.className = 'rx-ok';
        statusEl.textContent = '0 matches';
        highlEl.style.display = 'none';
        matchesEl.style.display = 'none';
        return;
      }

      statusEl.className = 'rx-ok';
      statusEl.textContent = `${allMatches.length} match${allMatches.length !== 1 ? 'es' : ''}`;

      // Build highlighted string
      let html = '';
      let cursor = 0;
      for (const m of allMatches) {
        if (m.index > cursor) html += rxEscape(testStr.slice(cursor, m.index));
        html += `<mark class="rx-match-full">${rxEscape(m[0])}</mark>`;
        cursor = m.index + m[0].length;
      }
      if (cursor < testStr.length) html += rxEscape(testStr.slice(cursor));
      highlEl.innerHTML = html;
      highlEl.style.display = 'block';

      // Build match list
      matchesEl.innerHTML = allMatches.slice(0, 50).map((m, idx) => {
        const groups = m.slice(1);
        const groupsHtml = groups.length ?
          groups.map((g, gi) =>
            `<div><span class="rx-group-label">Group ${gi + 1}:</span> <span class="rx-match-value">${g !== undefined ? rxEscape(g) : '<span style="color:var(--text-secondary)">undefined</span>'}</span></div>`
          ).join('') :
          '';
        return `<div class="rx-match-item">
                      <div class="rx-match-item-header">Match ${idx + 1} &nbsp;·&nbsp; index ${m.index}–${m.index + m[0].length}</div>
                      <div class="rx-match-value">${rxEscape(m[0])}</div>
                      ${groupsHtml}
                  </div>`;
      }).join('') + (allMatches.length > 50 ? `<div style="color:var(--text-secondary);font-size:11px;padding:4px">…and ${allMatches.length - 50} more</div>` : '');
      matchesEl.style.display = 'block';
    }

    function rxCopyPattern() {
      const p = document.getElementById('rx-pattern')?.value;
      if (!p) {
        toast('No pattern to copy', 'warning');
        return;
      }
      const flags = rxGetFlags();
      copyToClipboard(`/${p}/${flags}`, 'Pattern copied!');
    }

    function rxInsertPattern() {
      const p = document.getElementById('rx-pattern')?.value;
      if (!p) {
        toast('No pattern to insert', 'warning');
        return;
      }
      const flags = rxGetFlags();
      insertAtCursor(`/${p}/${flags}`);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    function rxClear() {
      const pat = document.getElementById('rx-pattern');
      const str = document.getElementById('rx-test-str');
      const stat = document.getElementById('rx-status');
      const hl = document.getElementById('rx-highlighted');
      const ml = document.getElementById('rx-matches');
      if (pat) pat.value = '';
      if (str) str.value = '';
      if (stat) {
        stat.textContent = '';
        stat.className = '';
      }
      if (hl) hl.style.display = 'none';
      if (ml) ml.style.display = 'none';
    }

    // ── CDN Search ────────────────────────────────────────────────
    let cdnDebounceTimer = null;
    const CDN_API = 'https://api.cdnjs.com/libraries';
    const cdnCardData = {};
    let cdnCardIndex = 0;

    function cdnOnInput() {
      clearTimeout(cdnDebounceTimer);
      const q = document.getElementById('cdn-input').value.trim();
      const status = document.getElementById('cdn-status');
      const results = document.getElementById('cdn-results');
      if (!q) {
        status.textContent = '';
        results.innerHTML = '';
        document.getElementById('cdn-spinner').style.display = 'none';
        return;
      }
      status.textContent = '';
      cdnDebounceTimer = setTimeout(() => cdnDoSearch(q), 400);
    }

    async function cdnDoSearch(query) {
      const spinner = document.getElementById('cdn-spinner');
      const status = document.getElementById('cdn-status');
      const results = document.getElementById('cdn-results');
      spinner.style.display = 'block';
      results.innerHTML = '';
      status.textContent = '';
      cdnCardIndex = 0;
      Object.keys(cdnCardData).forEach(k => delete cdnCardData[k]);
      try {
        const url = `${CDN_API}?search=${encodeURIComponent(query)}&fields=name,description,version,latest&limit=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        spinner.style.display = 'none';
        if (!data.results || data.results.length === 0) {
          status.textContent = 'No libraries found.';
          return;
        }
        status.textContent = `${data.results.length} result${data.results.length !== 1 ? 's' : ''} from cdnjs`;
        results.innerHTML = data.results.map(lib => cdnBuildCard(lib)).join('');
      } catch (e) {
        spinner.style.display = 'none';
        status.textContent = '⚠ ' + e.message;
      }
    }

    function cdnBuildCard(lib) {
      const url = lib.latest || '';
      const isCSS = url.endsWith('.css');
      const tag = isCSS ?
        `<link rel="stylesheet" href="${url}">` :
        `<script src="${url}"><\/script>`;
      const tagLabel = isCSS ? '&lt;link&gt; tag' : '&lt;script&gt; tag';
      const desc = lib.description ?
        lib.description.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 90) + (lib.description.length > 90 ? '…' : '') :
        'No description';
      const idx = cdnCardIndex++;
      cdnCardData[idx] = {
        tag,
        url
      };
      return `<div class="cdn-card">
                  <div class="cdn-card-top">
                      <span class="cdn-card-name">${lib.name}</span>
                      <span class="cdn-card-ver">v${lib.version}</span>
                  </div>
                  <div class="cdn-card-desc">${desc}</div>
                  ${url ? `<div class="cdn-card-url" title="${url}">${url}</div>` : ''}
                  <div class="cdn-card-actions">
                      ${url ? `<button class="cdn-action-btn" onclick="cdnCopyTag(${idx})">Copy ${tagLabel}</button>` : ''}
                      ${url ? `<button class="cdn-action-btn" onclick="cdnCopyUrl(${idx})">Copy URL</button>` : ''}
                      ${url ? `<button class="cdn-action-btn secondary" onclick="cdnInsert(${idx})">Insert at Cursor</button>` : ''}
                  </div>
              </div>`;
    }

    function cdnCopyTag(idx) {
      copyToClipboard(cdnCardData[idx].tag);
    }

    function cdnCopyUrl(idx) {
      copyToClipboard(cdnCardData[idx].url, 'URL copied!');
    }

    function cdnInsert(idx) {
      insertAtCursor(cdnCardData[idx].tag);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // ── HTML Entity Tool ──────────────────────────────────────────
    let entityMode = 'encode';

    const ENTITY_MAP = [
      ['&', '&amp;'],
      ['<', '&lt;'],
      ['>', '&gt;'],
      ['"', '&quot;'],
      ["'", '&#39;'],
      ['©', '&copy;'],
      ['®', '&reg;'],
      ['™', '&trade;'],
      ['€', '&euro;'],
      ['£', '&pound;'],
      ['¥', '&yen;'],
      ['¢', '&cent;'],
      ['°', '&deg;'],
      ['±', '&plusmn;'],
      ['×', '&times;'],
      ['÷', '&divide;'],
      ['½', '&frac12;'],
      ['¼', '&frac14;'],
      ['¾', '&frac34;'],
      ['–', '&ndash;'],
      ['—', '&mdash;'],
      ['\u00a0', '&nbsp;'],
      ['…', '&hellip;'],
      ['←', '&larr;'],
      ['→', '&rarr;'],
      ['↑', '&uarr;'],
      ['↓', '&darr;'],
      ['«', '&laquo;'],
      ['»', '&raquo;'],
      ['•', '&bull;'],
      ['·', '&middot;'],
      ['∞', '&infin;'],
      ['√', '&radic;'],
      ['∑', '&sum;'],
      ['π', '&pi;'],
      ['α', '&alpha;'],
      ['β', '&beta;'],
      ['γ', '&gamma;'],
      ['δ', '&delta;'],
    ];

    function entitySetMode(mode) {
      entityMode = mode;
      document.getElementById('entity-tab-enc').classList.toggle('active', mode === 'encode');
      document.getElementById('entity-tab-dec').classList.toggle('active', mode === 'decode');
      document.getElementById('entity-input-label').textContent = mode === 'encode' ? 'Text → Entities' : 'Entities → Text';
      document.getElementById('entity-input').placeholder = mode === 'encode' ? 'Paste text here…' : 'Paste HTML entities here…';
      entityRun();
    }

    function entityEncode(str) {
      const el = document.createElement('div');
      el.textContent = str;
      return el.innerHTML;
    }

    function entityDecode(str) {
      const el = document.createElement('div');
      el.innerHTML = str;
      return el.textContent;
    }

    function entityRun() {
      const input = document.getElementById('entity-input').value;
      const output = document.getElementById('entity-output');
      if (!input) {
        output.value = '';
        return;
      }
      output.value = entityMode === 'encode' ? entityEncode(input) : entityDecode(input);
    }

    function entityCopy() {
      const val = document.getElementById('entity-output').value;
      if (!val) {
        toast('Nothing to copy', 'warning');
        return;
      }
      copyToClipboard(val);
    }

    function entityInsert() {
      const val = document.getElementById('entity-output').value;
      if (!val) {
        toast('Nothing to insert', 'warning');
        return;
      }
      insertAtCursor(val);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    function entitySwap() {
      const inp = document.getElementById('entity-input');
      const out = document.getElementById('entity-output');
      const tmp = inp.value;
      inp.value = out.value;
      entityRun();
      if (!inp.value) out.value = tmp;
    }

    function entityClear() {
      document.getElementById('entity-input').value = '';
      document.getElementById('entity-output').value = '';
    }

    function entityInitRef() {
      const grid = document.getElementById('entity-ref-grid');
      if (!grid || grid.children.length > 0) return;
      grid.innerHTML = ENTITY_MAP.map(([char, entity]) =>
        `<div class="entity-ref-item" onclick="copyToClipboard('${entity.replace(/'/g,"\\'")}','Copied ${entity}')" title="Click to copy ${entity}">
                      <span class="entity-ref-char">${char === '\u00a0' ? '&nbsp;' : char}</span>
                      <span class="entity-ref-code">${entity}</span>
                  </div>`
      ).join('');
    }

    function init() {
      // Open IndexedDB in the background so backup system is ready
      dbOpen().catch(() => {});

      updateFileTree();
      editor.textContent = initialContent;
      editor.style.whiteSpace = 'pre-wrap';
      editor.spellcheck = false;
      editor.tabIndex = 0;
      setupEventListeners();
      applySavedSettings();
      updateAll(); // single render pass — no duplicate handleInput() call
    }

    function showStatus(message, type) {
      fetchStatusMessage.textContent = message;
      fetchStatusMessage.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'white';
    }

    function displayHTML(html) {
      editor.textContent = html;
    }

    fetchButton.onclick = () => {
      fetchModal.style.display = 'block';
    };

    fetchCloseModal.onclick = () => {
      fetchModal.style.display = 'none';
    };

    window.addEventListener('click', (event) => {
      if (event.target === fetchModal) {
        fetchModal.style.display = 'none';
      }
    });

    // Overflow Menu Toggle
    const overflowBtn = document.getElementById('overflow-btn');
    const overflowMenu = document.getElementById('overflow-menu');

    overflowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      overflowMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!overflowMenu.contains(e.target) && e.target !== overflowBtn) {
        overflowMenu.classList.remove('open');
      }
    });

    // Close menu when any menu button is clicked
    overflowMenu.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) {
        overflowMenu.classList.remove('open');
      }
    });

    fetchHTMLButton.onclick = async function fetchHTML() {
      const urlInput = document.getElementById('urlInput');
      let url = urlInput.value.trim();

      if (!url) {
        showStatus('Enter a URL', 'error');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      showStatus('Fetching...', 'info');

      if (CORS_PROXY.trim() === "") {
        const userInput = prompt("A CORS Anywhere URL is required for full functionality. Please enter one:");
        if (userInput && userInput.trim() !== "") {
          CORS_PROXY = userInput.trim();
          console.log("CORS_URL set to:", CORS_PROXY);
        } else {
          alert("CORS Anywhere URL is required for full functionality.");
          return;
        }
      }

      try {
        const fullURL = CORS_PROXY + encodeURIComponent(url);
        const response = await fetch(fullURL);

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        let fetchedHTML;

        // Detect if the proxy returns JSON (like AllOrigins)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          // AllOrigins returns { contents: "<html>...</html>", status: {...} }
          fetchedHTML = data.contents || '';
        } else {
          fetchedHTML = await response.text();
        }

        currentURL = url;

        const titleMatch = fetchedHTML.match(/<title>(.*?)<\/title>/i);
        let pageTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Page';
        pageTitle += '.html';
        createNewFile(pageTitle);

        displayHTML(fetchedHTML);
        showStatus(`Fetched ${fetchedHTML.length} characters`, 'success');
        fetchModal.style.display = 'none';
        updateAll();

      } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Fetch error:', error);
      }
    };

    function setupEventListeners() {
      editor.addEventListener('input', handleInput);
      editor.addEventListener('keydown', handleKeyDown);
      editor.addEventListener('click', updateCursorPosition);

      editor.addEventListener('copy', function(e) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const plainText = sel.toString();
        e.clipboardData.setData('text/plain', plainText);
        e.clipboardData.setData('text/html', '');
        e.preventDefault();
      });

      document.getElementById('new-btn').onclick = () => createNewFile(null);
      document.getElementById('saveas-btn').onclick = () => exportFile(false);
      document.getElementById('savelive-btn').onclick = () => saveLiveFile();
      document.getElementById('uploadlive-btn').onclick = () => openLiveFile();
      document.getElementById('share-btn').onclick = () => exportFile(true);
      document.getElementById('preview-btn').onclick = openPreview;
      //            document.getElementById('restore-btn').onclick = restoreBackup;
      document.getElementById('restore-btn').onclick = () => {
        showRecentBackups();
        backupsModal.style.display = 'flex';
      };
      document.getElementById('menu-btn').onclick = toggleSidebar;
      document.getElementById('undo-btn').onclick = undo;
      document.getElementById('redo-btn').onclick = redo;
      document.getElementById('upload-btn').onclick = () => fileInput.click();
      document.getElementById('tab-btn').addEventListener('click', handleTab);
      document.getElementById('comment-btn').addEventListener('click', handleComment);
      document.querySelector('.theme-select').addEventListener('click', e => {
        if (e.target.classList.contains('theme-option')) {
          handleThemeChange(e);
        }
      });
      document.addEventListener('selectionchange', updateCursorPosition);
      document.addEventListener('click', closeSidebarOnOutsideClick);

      fileInput.addEventListener('change', handleFileUpload);

    }

    function getLineNumber(offset) {
      const content = editor.textContent.slice(0, offset);
      return (content.match(/\n/g) || []).length;
    }

    // Timers for debounced / RAF updates
    let _highlightTimer = null;
    let _validateTimer = null;
    let _saveTimer = null;
    let _lineNumFrame = null;
    const UNDO_MAX = 150; // cap undo history to prevent memory leak

    function handleInput() {
      const content = editor.innerText; // single DOM read per keystroke
      state.files[state.currentFile] = content;

      // Cursor + file info are cheap — run immediately
      updateCursorPosition();
      updateFileInfo();

      // Line numbers — schedule for next paint (avoids forced layout mid-type)
      if (_lineNumFrame) cancelAnimationFrame(_lineNumFrame);
      _lineNumFrame = requestAnimationFrame(_doLineNumbers);

      // Syntax highlighting — debounce (Prism.js is expensive on large files)
      clearTimeout(_highlightTimer);
      _highlightTimer = setTimeout(updateHighlighting, 150);

      // Validation — debounce (parses entire file)
      clearTimeout(_validateTimer);
      _validateTimer = setTimeout(validate, 400);

      // Undo snapshot — debounce so fast typing doesn't flood the stack
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(saveState, 500);
    }

    function handleComment(e) {
      e.preventDefault();

      // Show modal with comment types
      const modal = document.createElement('div');
      modal.style.cssText = 'z-index: 10000; position: fixed; top: 30%; align-content: center;';
      modal.className = 'modal-content';

      const title = document.createElement('h3');
      title.textContent = 'Choose Comment Style';
      title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px;';
      modal.appendChild(title);

      const commentTypes = [{
          label: '/* ... */',
          start: '/* ',
          end: ' */',
          perLine: false
        },
        {
          label: '<!-- ... -->',
          start: '<!-- ',
          end: ' -->',
          perLine: false
        },
        {
          label: '// ...',
          start: '//',
          end: '',
          perLine: true
        }
      ];

      commentTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.textContent = type.label;
        btn.className = 'btn2';
        btn.onmouseover = () => btn.style.background = '#1d4ed8';
        btn.onmouseout = () => btn.style.background = '#2563eb';
        btn.onclick = () => {
          applyComment(type.start, type.end, type.perLine);
          document.body.removeChild(modal);
          document.body.removeChild(backdrop);
        };
        modal.appendChild(btn);
      });

      const backdrop = document.createElement('div');
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
      backdrop.onclick = () => {
        document.body.removeChild(modal);
        document.body.removeChild(backdrop);
      };

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);

      function applyComment(startComment, endComment, perLine) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;

        const content = editor.innerText;
        const startLine = getLineNumber(range.startOffset);
        const endLine = getLineNumber(range.endOffset);

        const lines = content.split('\n');

        let newContent;
        let addedLength;

        if (perLine) {
          // Apply comment to each line
          const modifiedLines = lines.map((line, index) => {
            if (index >= startLine && index <= endLine) {
              return startComment + line + endComment;
            }
            return line;
          });
          newContent = modifiedLines.join('\n');
          addedLength = startComment.length + endComment.length;
        } else {
          // Apply comment only to first and last line (or both on same line)
          const modifiedLines = lines.map((line, index) => {
            if (index === startLine && index === endLine) {
              // Single line - add both start and end
              return startComment + line + endComment;
            } else if (index === startLine) {
              return startComment + line;
            } else if (index === endLine) {
              return line + endComment;
            }
            return line;
          });
          newContent = modifiedLines.join('\n');
          addedLength = startComment.length + endComment.length;
        }

        editor.textContent = newContent;

        state.files[state.currentFile] = newContent;
        saveState();

        const newRange = document.createRange();
        const textNode = editor.firstChild || document.createTextNode('');

        if (perLine || startLine === endLine) {
          newRange.setStart(textNode, startOffset + startComment.length);
          newRange.setEnd(textNode, endOffset + addedLength);
        } else {
          newRange.setStart(textNode, startOffset + startComment.length);
          newRange.setEnd(textNode, endOffset + addedLength);
        }

        selection.removeAllRanges();
        selection.addRange(newRange);

        updateAll();
      }
    }

    function handleTab(e) {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      // Save current selection
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      const content = editor.innerText;
      const startLine = getLineNumber(range.startOffset);
      const endLine = getLineNumber(range.endOffset);

      // Modify lines
      const lines = content.split('\n');
      const tabSize = _tabSize;
      const indent = ' '.repeat(tabSize);

      const modifiedLines = lines.map((line, index) => {
        if (index >= startLine && index <= endLine) {
          return indent + line;
        }
        return line;
      });

      // Update content
      const newContent = modifiedLines.join('\n');
      editor.textContent = newContent;

      // Update state and save
      state.files[state.currentFile] = newContent;
      saveState();

      // Restore selection
      const newRange = document.createRange();
      const textNode = editor.firstChild || document.createTextNode('');
      newRange.setStart(textNode, startOffset + (startLine === endLine ? tabSize : 0));
      newRange.setEnd(textNode, endOffset + (endLine - startLine + 1) * tabSize);
      selection.removeAllRanges();
      selection.addRange(newRange);

      updateAll();
    }

    const _KD_PAIRS = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`'
    };
    const _KD_CLOSERS = new Set(['}', ')', ']', '"', "'", '`']);
    let _tabSize = parseInt(cfgGet('tabSize', '4')) || 4;
    const _RX_KD_INDENT = /^(\s*)/;
    const _RX_KD_TAG = /<(\w+)(?:\s[^>]*)?>$/;
    let _elCursorPos = null;
    let _elFileInfo = null;
    const _RX_VH_ID = /\bid=["']([^"']+)["']/gi;
    const _RX_VH_RAWTAG = /<[^>]+>/g;
    const _RX_VH_OC = /<(\/?)([a-zA-Z][\w-]*)(?:\s[^>]*)?\/?>/g;
    const _RX_VH_STYLE = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const _RX_VH_SCRIPT = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;

    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();

        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const content = editor.innerText;
        const _r0 = sel.getRangeAt(0);
        const cursorPos = getTextOffset(_r0.startContainer, _r0.startOffset);

        const textBefore = content.substring(0, cursorPos);
        const textAfter = content.substring(cursorPos);
        const currentLine = textBefore.split('\n').pop();

        const indentMatch = currentLine.match(_RX_KD_INDENT);
        let indent = indentMatch ? indentMatch[1] : '';

        const trimmed = currentLine.trim();
        const tabSize = _tabSize;
        const oneIndent = ' '.repeat(tabSize);

        const lastChar = trimmed.slice(-1);
        let addIndent = false;
        let addClosing = '';

        if (lastChar === '{') {
          addIndent = true;
          const afterTrimmed = textAfter.trimStart();
          if (!afterTrimmed.startsWith('}')) {
            addClosing = '\n' + indent + '}';
          }
        } else if (lastChar === '(') {
          addIndent = true;
          const afterTrimmed = textAfter.trimStart();
          if (!afterTrimmed.startsWith(')')) {
            addClosing = '\n' + indent + ')';
          }
        } else if (lastChar === '[') {
          addIndent = true;
          const afterTrimmed = textAfter.trimStart();
          if (!afterTrimmed.startsWith(']')) {
            addClosing = '\n' + indent + ']';
          }
        } else if (lastChar === '>') {
          const tagMatch = currentLine.match(_RX_KD_TAG);
          if (tagMatch) {
            const tag = tagMatch[1].toLowerCase();
            if (!isSelfClosing(tag)) {
              addIndent = true;
              const afterTrimmed = textAfter.trimStart();
              const closingTag = '</' + tag + '>';
              const hasClosingTag = afterTrimmed.includes(closingTag);
              if (!afterTrimmed.startsWith('</') && !hasClosingTag) {
                addClosing = '\n' + indent + closingTag;
              }
            }
          }
        }

        const newIndent = addIndent ? indent + oneIndent : indent;
        const indentText = '\n' + newIndent;
        const newCursorPos = cursorPos + indentText.length;

        // Build final content in one pass (indent + optional closing bracket)
        let newContent = textBefore + indentText + textAfter;
        if (addClosing) {
          newContent = newContent.slice(0, newCursorPos) + addClosing + newContent.slice(newCursorPos);
        }
        editor.textContent = newContent;
        setCursorInEditor(newCursorPos);

        // Single state save + render
        state.files[state.currentFile] = editor.innerText;
        saveState();
        updateAll();

        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleTab(e);
      }

      // Auto-close brackets/quotes
      if (_KD_PAIRS[e.key]) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);

        // Only auto-close if nothing is selected (simple cursor)
        if (range.collapsed) {
          const content = editor.innerText;
          const cursorPos = getTextOffset(range.startContainer, range.startOffset);
          const charAfter = content[cursorPos] || '';

          // For quotes, don't auto-close if the next char is alphanumeric
          // or if we're inside a word
          if ((e.key === '"' || e.key === "'" || e.key === '`')) {
            const charBefore = content[cursorPos - 1] || '';
            if (/\w/.test(charAfter) || /\w/.test(charBefore)) return;
          }

          e.preventDefault();
          const open = e.key;
          const close = _KD_PAIRS[e.key];

          const before = content.substring(0, cursorPos);
          const after = content.substring(cursorPos);
          const newContent = before + open + close + after;

          editor.textContent = newContent;
          setCursorInEditor(cursorPos + 1); // Between the pair

          state.files[state.currentFile] = editor.innerText;
          saveState();
          updateAll();
          return;
        }
      }

      // Skip over closing bracket if next char matches
      if (_KD_CLOSERS.has(e.key)) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          const content = editor.innerText;
          const cursorPos = getTextOffset(range.startContainer, range.startOffset);
          if (content[cursorPos] === e.key) {
            e.preventDefault();
            setCursorInEditor(cursorPos + 1);
            return;
          }
        }
      }

      // Backspace: delete matching pair if cursor is between them
      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          const content = editor.innerText;
          const cursorPos = getTextOffset(range.startContainer, range.startOffset);
          const charBefore = content[cursorPos - 1];
          const charAfterCur = content[cursorPos];
          if (charBefore && _KD_PAIRS[charBefore] === charAfterCur) {
            e.preventDefault();
            const newContent = content.substring(0, cursorPos - 1) + content.substring(cursorPos + 1);
            editor.textContent = newContent;
            setCursorInEditor(cursorPos - 1);
            state.files[state.currentFile] = editor.innerText;
            saveState();
            updateAll();
            return;
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }

    // Helper: set cursor position in contenteditable by character offset
    function setCursorInEditor(offset) {
      const sel = window.getSelection();
      const range = document.createRange();
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
      let count = 0;
      let node;

      while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        if (count + len >= offset) {
          range.setStart(node, offset - count);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        count += len;
      }

      // Past end — put cursor at very end
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function handleThemeChange(e) {
      const theme = e.target.dataset.theme;
      // Update document class
      document.documentElement.className = `theme-${theme}`;

      // Update selected state
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
      });
      e.target.classList.add('selected');

      // Save immediately
      cfgSet('theme', theme);
      applySavedSettings();
    }

    function updateAll() {
      // Programmatic call (undo/redo/file-switch) — no saveState here, caller owns that
      updateHighlighting();
      _doLineNumbers();
      updateCursorPosition();
      updateFileInfo();
      clearTimeout(_validateTimer);
      _validateTimer = setTimeout(validate, 300);
    }

    function updateHighlighting() {
      // Use cached state.files — avoids an extra innerText DOM read
      const content = state.files[state.currentFile] || editor.innerText;
      const lang = getLanguageFromFilename(state.currentFile);
      const grammar = Prism.languages[lang.prism] || Prism.languages.html;
      highlighted.innerHTML = Prism.highlight(content, grammar, lang.prism);
    }

    // Renamed internal: called via RAF from handleInput, directly from updateAll
    function _doLineNumbers() {
      const content = state.files[state.currentFile] || '';
      const lines = content.split('\n');
      // Pre-build a Set so the inner loop is O(1) not O(errors)
      const errorLines = new Set((state.errors || []).map(e => e.line));
      lineNumbers.innerHTML = lines.map((_, i) => {
        const ln = i + 1;
        return `<div>${ln}${errorLines.has(ln) ? '<span class="error-line">⚠</span>' : ''}</div>`;
      }).join('');
    }

    // Keep public alias for any call-sites that use updateLineNumbers() directly
    function updateLineNumbers() {
      _doLineNumbers();
    }

    function updateCursorPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const offset = getTextOffset(range.startContainer, range.startOffset);
      const content = editor.textContent;
      const textUpToCursor = content.slice(0, offset);
      const lineNum = textUpToCursor.split('\n').length;
      const lineStart = textUpToCursor.lastIndexOf('\n') + 1;
      const colNum = offset - lineStart + 1;

      if (!_elCursorPos) _elCursorPos = document.getElementById('cursor-position');
      _elCursorPos.textContent = `Ln ${lineNum}, Col ${colNum}`;
    }

    function getTextOffset(node, offset) {
      const range = document.createRange();
      range.setStart(editor, 0);
      range.setEnd(node, offset);
      return range.toString().length;
    }

    function openSettings() {
      document.getElementById('settings-modal').style.display = 'block';
      document.getElementById('settings-overlay').style.display = 'block';
      loadCurrentSettings();
    }

    function closeSettings() {
      document.getElementById('settings-modal').style.display = 'none';
      document.getElementById('settings-overlay').style.display = 'none';
      saveSettings();
    }

    function loadCurrentSettings() {
      document.getElementById('font-size').value =
        parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--editor-font-size'));
      document.getElementById('font-size-value').textContent =
        document.getElementById('font-size').value + 'px';

      document.getElementById('line-height').value =
        parseFloat(getComputedStyle(document.documentElement)
          .getPropertyValue('--line-height'));
      document.getElementById('line-height-value').textContent =
        document.getElementById('line-height').value;

      document.getElementById('tab-size').value =
        parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--tab-size'));

      document.getElementById('show-line-numbers').checked =
        cfgGet('showLineNumbers', 'true') !== 'false';
      document.getElementById('color-picker-controller').checked =
        cfgGet('colorPickerController', 'false') === 'true';
      document.getElementById('auto-complete-toggle').checked =
        cfgGet('autoCompleteActive', 'true') !== 'false';
      document.getElementById('shortcut-bar-toggle').checked =
        cfgGet('shortcutBar', 'false') === 'true';

      document.getElementById('github-cdn-owner').value = cfgGet('githubCdnOwner', '');
      document.getElementById('github-cdn-repo').value = cfgGet('githubCdnRepo', '');
      document.getElementById('github-cdn-branch').value = cfgGet('githubCdnBranch', 'main');
      document.getElementById('github-cdn-folder').value = cfgGet('githubCdnFolder', '');
      document.getElementById('github-cdn-token').value = cfgGet('githubCdnToken', '');

      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.theme === cfgGet('theme', 'dark')) {
          option.classList.add('selected');
        }
      });
    }

    function saveSettings() {
      Object.assign(_cfg, {
        theme: document.querySelector('.theme-option.selected').dataset.theme,
        fontSize: document.getElementById('font-size').value,
        lineHeight: document.getElementById('line-height').value,
        tabSize: document.getElementById('tab-size').value,
        showLineNumbers: String(document.getElementById('show-line-numbers').checked),
        colorPickerController: String(document.getElementById('color-picker-controller').checked),
        autoCompleteActive: String(document.getElementById('auto-complete-toggle').checked),
        shortcutBar: String(document.getElementById('shortcut-bar-toggle').checked),
        githubCdnOwner: document.getElementById('github-cdn-owner').value.trim(),
        githubCdnRepo: document.getElementById('github-cdn-repo').value.trim(),
        githubCdnBranch: document.getElementById('github-cdn-branch').value.trim() || 'main',
        githubCdnFolder: document.getElementById('github-cdn-folder').value.trim(),
        githubCdnToken: document.getElementById('github-cdn-token').value.trim(),
      });
      cfgSave();
      _tabSize = parseInt(_cfg.tabSize) || 4;
      sbApply();
      applySavedSettings();
      toast('Settings saved', 'success');
    }

    function applySavedSettings() {
      // 1. Apply theme first
      const savedTheme = cfgGet('theme', 'dark');
      document.documentElement.className = `theme-${savedTheme}`;

      // 2. Update theme selector UI
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.theme === savedTheme) {
          option.classList.add('selected');
        }
      });

      // 3. Font size
      const fontSize = cfgGet('fontSize', '14');
      document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
      editor.style.fontSize = `${fontSize}px`;
      highlighted.style.fontSize = `${fontSize}px`;

      // 4. Line height
      const lineHeight = cfgGet('lineHeight', '1.4');
      document.documentElement.style.setProperty('--line-height', lineHeight);
      editor.style.lineHeight = lineHeight;
      highlighted.style.lineHeight = lineHeight;

      // 5. Tab size
      const tabSize = cfgGet('tabSize', '4');
      document.documentElement.style.setProperty('--tab-size', tabSize);
      editor.style.tabSize = tabSize;
      highlighted.style.tabSize = tabSize;

      // 6. Line numbers visibility
      const showLineNumbers = cfgGet('showLineNumbers', 'true') !== 'false';
      lineNumbers.style.display = showLineNumbers ? 'block' : 'none';

      // 7. Media controller hack color picker
      const colorPickerController = cfgGet('colorPickerController', 'false') === 'true';
      if (colorPickerController) startColorPicker();

      // 10. Auto complete
      const autoCompleteActive = cfgGet('autoCompleteActive', 'true') !== 'false';
      if (autoCompleteActive) initAutoComplete();

      // 11. Shortcut bar
      sbApply();

      // 8. Force redraw for syntax highlighting
      highlighted.style.display = 'none';
      highlighted.offsetHeight; // Trigger reflow
      highlighted.style.display = 'block';

      // 9. Update Prism theme
      const prismThemes = {
        'dark': 'prism-okaidia',
        'light': 'prism-solarizedlight',
        'solarized': 'prism-tomorrow'
      };

      const prismTheme = prismThemes[savedTheme] || 'prism-okaidia';

      const existingPrismTheme = document.querySelector('#prism-theme');
      if (existingPrismTheme) existingPrismTheme.remove();

      const link = document.createElement('link');
      link.id = 'prism-theme';
      link.rel = 'stylesheet';
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${prismTheme}.min.css`;

      link.onload = () => updateHighlighting();
      link.onerror = () => {
        console.log('Failed to load Prism theme');
        updateHighlighting();
      };

      document.head.appendChild(link);
    }

    function validate() {
      const content = editor.innerText;
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      let errors = [];

      if (ext === 'html' || ext === 'htm') {
        errors = validateHTML(content);
      } else if (ext === 'css') {
        errors = validateCSS(content);
      } else if (ext === 'js' || ext === 'mjs' || ext === 'ts') {
        errors = validateJS(content);
      } else if (ext === 'json') {
        errors = validateJSON(content);
      }

      state.errors = errors;
      document.getElementById('error-count').textContent =
        errors.length ? `${errors.length} error(s)` : '';
    }

    function validateHTML(content) {
      const errors = [];
      const stack = [];
      const lines = content.split('\n');
      const ids = {};
      let match;

      // Duplicate ID detection
      _RX_VH_ID.lastIndex = 0;
      while ((match = _RX_VH_ID.exec(content)) !== null) {
        const id = match[1];
        const line = content.substr(0, match.index).split('\n').length;
        if (ids[id] !== undefined) {
          errors.push({
            pos: match.index,
            message: `Duplicate id: "${id}"`,
            line
          });
        } else {
          ids[id] = line;
        }
      }

      // Unclosed attribute quote detection
      _RX_VH_RAWTAG.lastIndex = 0;
      while ((match = _RX_VH_RAWTAG.exec(content)) !== null) {
        const tagStr = match[0];
        const line = content.substr(0, match.index).split('\n').length;
        let inDouble = false,
          inSingle = false;
        for (let i = 1; i < tagStr.length - 1; i++) {
          if (tagStr[i] === '"' && !inSingle) inDouble = !inDouble;
          else if (tagStr[i] === "'" && !inDouble) inSingle = !inSingle;
        }
        if (inDouble || inSingle) {
          errors.push({
            pos: match.index,
            message: `Unclosed attribute quote in tag`,
            line
          });
        }
      }

      // Stack-based tag matching (open/close balance)
      _RX_VH_OC.lastIndex = 0;
      while ((match = _RX_VH_OC.exec(content)) !== null) {
        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();
        const line = content.substr(0, match.index).split('\n').length;
        const isSelfClose = match[0].endsWith('/>') || isSelfClosing(tag);

        if (isClosing) {
          if (stack.length === 0) {
            errors.push({
              pos: match.index,
              message: `Unexpected closing tag: </${tag}>`,
              line
            });
          } else {
            const last = stack[stack.length - 1];
            if (last.tag !== tag) {
              errors.push({
                pos: match.index,
                message: `Mismatched tag: expected </${last.tag}>, got </${tag}>`,
                line
              });
            }
            stack.pop();
          }
        } else if (!isSelfClose) {
          stack.push({
            tag,
            line
          });
        }
      }

      // Report each unclosed tag at its own line
      for (const {
          tag,
          line
        }
        of stack) {
        errors.push({
          pos: 0,
          message: `Unclosed tag: <${tag}>`,
          line
        });
      }

      // Validate contents of <style> blocks as CSS
      _RX_VH_STYLE.lastIndex = 0;
      while ((match = _RX_VH_STYLE.exec(content)) !== null) {
        const blockStart = match.index + match[0].indexOf(match[1]);
        const lineOffset = content.substr(0, blockStart).split('\n').length - 1;
        const cssErrors = validateCSS(match[1]);
        for (const e of cssErrors) {
          errors.push({
            pos: e.pos,
            message: `[style] ${e.message}`,
            line: e.line + lineOffset
          });
        }
      }

      // Validate contents of <script> blocks (inline only, no src) as JS
      _RX_VH_SCRIPT.lastIndex = 0;
      while ((match = _RX_VH_SCRIPT.exec(content)) !== null) {
        const blockStart = match.index + match[0].indexOf(match[1]);
        const lineOffset = content.substr(0, blockStart).split('\n').length - 1;
        const jsErrors = validateJS(match[1]);
        for (const e of jsErrors) {
          errors.push({
            pos: e.pos,
            message: `[script] ${e.message}`,
            line: e.line + lineOffset
          });
        }
      }

      return errors;
    }

    function validateCSS(content) {
      const errors = [];
      let braceDepth = 0;
      let braceOpenLine = null;
      let inString = false;
      let stringChar = null;
      let line = 1;

      for (let i = 0; i < content.length; i++) {
        const ch = content[i];

        if (ch === '\n') {
          line++;
          continue;
        }

        if (inString) {
          if (ch === stringChar && content[i - 1] !== '\\') inString = false;
          continue;
        }

        if (ch === '"' || ch === "'") {
          inString = true;
          stringChar = ch;
        } else if (ch === '{') {
          braceDepth++;
          if (braceDepth === 1) braceOpenLine = line;
        } else if (ch === '}') {
          if (braceDepth === 0) {
            errors.push({
              pos: i,
              message: `Unexpected closing brace "}"`,
              line
            });
          } else {
            braceDepth--;
          }
        }
      }

      if (inString) {
        errors.push({
          pos: content.length - 1,
          message: `Unclosed string literal`,
          line
        });
      }
      if (braceDepth > 0) {
        errors.push({
          pos: content.length - 1,
          message: `${braceDepth} unclosed brace${braceDepth > 1 ? 's' : ''} "{"`,
          line: braceOpenLine
        });
      }

      return errors;
    }

    function validateJS(content) {
      const errors = [];
      const stack = [];
      const pairs = {
        '{': '}',
        '[': ']',
        '(': ')'
      };
      const closers = new Set(['}', ']', ')']);
      let i = 0;
      let line = 1;

      while (i < content.length) {
        const ch = content[i];

        if (ch === '\n') {
          line++;
          i++;
          continue;
        }

        // Skip line comments
        if (ch === '/' && content[i + 1] === '/') {
          while (i < content.length && content[i] !== '\n') i++;
          continue;
        }

        // Skip block comments
        if (ch === '/' && content[i + 1] === '*') {
          i += 2;
          while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
            if (content[i] === '\n') line++;
            i++;
          }
          i += 2;
          continue;
        }

        // Skip strings and template literals
        if (ch === '"' || ch === "'" || ch === '`') {
          const quote = ch;
          i++;
          while (i < content.length) {
            if (content[i] === '\\') {
              i += 2;
              continue;
            }
            if (content[i] === quote) break;
            if (content[i] === '\n') line++;
            i++;
          }
          i++;
          continue;
        }

        if (pairs[ch]) {
          stack.push({
            ch,
            line
          });
        } else if (closers.has(ch)) {
          if (stack.length === 0) {
            errors.push({
              pos: i,
              message: `Unexpected "${ch}"`,
              line
            });
          } else {
            const last = stack[stack.length - 1];
            if (pairs[last.ch] !== ch) {
              errors.push({
                pos: i,
                message: `Mismatched bracket: expected "${pairs[last.ch]}", got "${ch}"`,
                line
              });
            }
            stack.pop();
          }
        }

        i++;
      }

      for (const {
          ch,
          line
        }
        of stack) {
        errors.push({
          pos: 0,
          message: `Unclosed "${ch}"`,
          line
        });
      }

      return errors;
    }

    function validateJSON(content) {
      const errors = [];
      const trimmed = content.trim();
      if (!trimmed) return errors;
      try {
        JSON.parse(trimmed);
      } catch (e) {
        const msg = e.message;
        const posMatch = msg.match(/position (\d+)/i);
        let line = 1;
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          line = trimmed.substr(0, pos).split('\n').length;
        }
        errors.push({
          pos: 0,
          message: `JSON syntax error: ${msg}`,
          line
        });
      }
      return errors;
    }

    // ── Minifier ──────────────────────────────────────────────────
    function minifyCSS(css) {
      return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([:;{},>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    }

    function minifyJS(js) {
      return js
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function minifyHTML(html) {
      html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
        (_, o, c, cl) => o + minifyCSS(c) + cl);
      html = html.replace(/(<script(?![^>]*\bsrc\b)[^>]*>)([\s\S]*?)(<\/script>)/gi,
        (_, o, c, cl) => o + minifyJS(c) + cl);
      html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
      html = html.replace(/\s+/g, ' ');
      html = html.replace(/>\s+</g, '><');
      return html.trim();
    }

    function minifyCode() {
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      const before = editor.innerText;
      let minified;
      try {
        if (ext === 'css') minified = minifyCSS(before);
        else if (['js', 'ts', 'mjs'].includes(ext)) minified = minifyJS(before);
        else minified = minifyHTML(before);

        saveState();
        state.files[state.currentFile] = minified;
        editor.textContent = minified;
        updateAll();
        const pct = Math.round((1 - minified.length / before.length) * 100);
        toast(`Minified — ${pct}% smaller (${before.length - minified.length} chars removed)`, 'success');
      } catch (e) {
        toast('Minify failed: ' + e.message, 'error');
      }
    }

    // ── GitHub CDN ────────────────────────────────────────────────
    function getGithubCdnSettings() {
      let folder = cfgGet('githubCdnFolder', '').trim().replace(/^\/+/, '');
      if (folder && !folder.endsWith('/')) folder += '/';
      return {
        owner: cfgGet('githubCdnOwner', ''),
        repo: cfgGet('githubCdnRepo', ''),
        token: cfgGet('githubCdnToken', ''),
        branch: cfgGet('githubCdnBranch', 'main'),
        folder,
      };
    }

    async function pushFileToGitHub(settings, filePath, content) {
      const {
        owner,
        repo,
        token,
        branch
      } = settings;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };
      let sha;
      try {
        const check = await fetch(apiUrl, {
          headers
        });
        if (check.ok) sha = (await check.json()).sha;
      } catch (e) {}

      const body = {
        message: `Update ${filePath} via Mobile Code Editor`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch,
        ...(sha ? {
          sha
        } : {}),
      };
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`;
      fetch(`https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`).catch(() => {});
      return cdnUrl;
    }

    async function pushToCDN() {
      const settings = getGithubCdnSettings();
      if (!settings.owner || !settings.repo || !settings.token) {
        toast('Configure GitHub CDN in Settings first', 'warning');
        openSettings();
        return;
      }
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      if (ext !== 'html' && ext !== 'htm') {
        toast('Switch to an HTML file to push to CDN', 'warning');
        return;
      }
      const baseName = state.currentFile.replace(/\.(html|htm)$/i, '');
      let html = editor.innerText;
      const pushed = [];
      toast('Pushing to GitHub…', 'info');
      try {
        const styleBlocks = [];
        html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, c) => {
          if (c.trim()) styleBlocks.push(c.trim());
          return '';
        });
        if (styleBlocks.length > 0) {
          const path = settings.folder + baseName + '.css';
          const url = await pushFileToGitHub(settings, path, styleBlocks.join('\n\n'));
          html = html.replace('</head>', `  <link rel="stylesheet" href="${url}">\n</head>`);
          pushed.push(baseName + '.css');
        }

        const scriptBlocks = [];
        html = html.replace(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi, (_, c) => {
          if (c.trim()) scriptBlocks.push(c.trim());
          return '';
        });
        if (scriptBlocks.length > 0) {
          const path = settings.folder + baseName + '.js';
          const url = await pushFileToGitHub(settings, path, scriptBlocks.join('\n\n'));
          html = html.replace('</body>', `  <script src="${url}"><\/script>\n</body>`);
          pushed.push(baseName + '.js');
        }

        if (pushed.length === 0) {
          toast('No inline styles or scripts found to push', 'warning');
          return;
        }
        html = html.replace(/\n{3,}/g, '\n\n').trim();
        saveState();
        state.files[state.currentFile] = html;
        editor.textContent = html;
        updateAll();
        toast(`Pushed to CDN: ${pushed.join(', ')}`, 'success');
      } catch (e) {
        toast('CDN push failed: ' + e.message, 'error');
      }
    }

    // Combine linked files and immediately open showSaveFilePicker —
    // must be called directly from a user gesture with no async gap before it.
    async function combineAndExport() {
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      const isHtml = ext === 'html' || ext === 'htm';

      let targetHtml = null;
      if (isHtml) {
        targetHtml = state.currentFile;
      } else {
        // If editing a linked CSS/JS file, find its parent HTML and combine that
        targetHtml = getLinkedHtmlFile(state.currentFile);
        if (!targetHtml) {
          toast('Switch to an HTML file (or a CSS/JS file linked to one) to combine and save', 'warning');
          return;
        }
        toast(`Combining via parent file "${targetHtml}"`, 'info');
      }

      const content = buildCombinedDocument(targetHtml);
      const filename = targetHtml;
      const blob = new Blob([content], {
        type: 'text/html'
      });
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'HTML Files',
              accept: {
                'text/html': ['.html']
              }
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast('Combined & saved', 'success');
        } catch (e) {
          if (e.name !== 'AbortError') toast('Save failed: ' + e.message, 'error');
        }
      } else {
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), {
          href: url,
          download: filename
        }).click();
        URL.revokeObjectURL(url);
        toast('Combined & downloaded', 'success');
      }
    }

    async function exportFile(share = false) {
      const content = state.files[state.currentFile];
      let filename = state.currentFile || "untitled";
      if (!filename) return;
      if (!filename.endsWith(".html")) filename += ".html";

      const blob = new Blob([content], {
        type: "text/html"
      });
      if (share === false) {
        // 1️⃣ Try File System Access API first
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: filename,
              types: [{
                description: "HTML Files",
                accept: {
                  "text/html": [".html"]
                },
              }, ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log("File saved using File System Access API.");
            toast('File saved', 'success');
            return;
          } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("File System Access API failed:", err);
            // Fall through to download fallback
          }
        }

        // 2️⃣ Fallback to regular download
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log("File saved via regular download fallback.");
          toast('File saved', 'success');
          return;
        } catch (err) {
          console.warn("Regular download fallback failed:", err);
          toast('Regular download failed', 'error');
        }
      }
      // 3️⃣ Final fallback: Web Share API
      try {
        const file = new File([blob], filename, {
          type: "text/html"
        });
        if (navigator.canShare && navigator.canShare({
            files: [file]
          })) {
          await navigator.share({
            files: [file],
            title: filename
          });
          console.log("File shared successfully via Web Share API.");
          toast('File shared', 'success');
          return;
        } else {
          throw new Error("Web Share API not supported or cannot share files.");
          toast('Web Share API not supported', 'error');
        }
      } catch (err) {
        console.error("Unable to save or share the file on this device.", err);
        toast('Unable to share', 'error');
      }
    }

    function getInitialContent(fileName) {
      const ext = (fileName || '').split('.').pop().toLowerCase();
      if (ext === 'css') return `/* ${fileName} */\n\n* {\n    box-sizing: border-box;\n    margin: 0;\n    padding: 0;\n}\n`;
      if (ext === 'js' || ext === 'mjs') return `// ${fileName}\n\nconsole.log('Hello from ${fileName}');\n`;
      if (ext === 'json') return `{\n    \n}\n`;
      if (ext === 'ts') return `// ${fileName}\n\n`;
      if (ext === 'md' || ext === 'markdown') return `# ${fileName.replace(/\.(md|markdown)$/i,'')}\n\nWrite your content here.\n\n## Section\n\nParagraph text.\n`;
      return initialContent;
    }

    function createNewFile(fileName = null) {
      if (fileName) {
        fileName = prompt("Enter a name for your new file (canceling will replace current file):", fileName);
      } else {
        fileName = prompt("Enter a name for your new file:", `file${Object.keys(state.files).length + 1}.html`);
      }
      if (!fileName) {
        return;
      }

      // Prevent overwriting existing files
      if (state.files[fileName]) {
        toast("A file with that name already exists. Please choose a different name.", 'warning');
        return;
      }

      const content = getInitialContent(fileName);
      state.files[fileName] = content;
      state.undoStack[fileName] = [content];
      state.redoStack[fileName] = [];
      copyFromFile(fileName);
      toast(`${fileName} created`, 'success');
      updateFileTree();
    }

    function initAutoComplete() {
      if (autoswipeInstance && typeof autoswipeInstance.destroy === 'function') {
        autoswipeInstance.destroy();
      }
      const lang = getLanguageFromFilename(state.currentFile);
      autoswipeInstance = AutoSwipe.init({
        editor: '#editor',
        highlighter: '#highlighted',
        language: lang.autoswipe,
        swipeThreshold: 50,
        maxSuggestions: 6,
        debounceDelay: 100,
        getContent: () => document.getElementById('editor').innerText,
        onAccept: (suggestion, newText) => {
          state.files[state.currentFile] = newText;
          saveState();
          updateAll();
          document.getElementById('editor').focus();
        }
      });
    }

    async function handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const content = await file.text();
      state.files[file.name] = content;
      state.undoStack[file.name] = [content];
      state.redoStack[file.name] = [];
      copyFromFile(file.name);
      toast(`${file.name} uploaded`, 'success');
      updateFileTree();
      fileInput.value = '';
    }

    function copyFromFile(fileName) {
      // Ask the user for a file name, using the provided one as a default
      let curFile = fileName;

      // If the user cancels or leaves it blank, stop the function
      if (!curFile) return;

      // If the user changed the name, rename the file in state
      if (curFile !== fileName) {
        // If the new name already exists, warn and stop
        if (state.files[curFile]) {
          alert("A file with that name already exists.");
          return;
        }

        // Rename: copy content and delete old entry
        state.files[curFile] = state.files[fileName];
        delete state.files[fileName];

        // Also rename undo/redo stacks if they exist
        if (state.undoStack[fileName]) {
          state.undoStack[curFile] = state.undoStack[fileName];
          delete state.undoStack[fileName];
        }
        if (state.redoStack[fileName]) {
          state.redoStack[curFile] = state.redoStack[fileName];
          delete state.redoStack[fileName];
        }
      }

      // Set the current file and update the editor
      state.currentFile = curFile;
      editor.textContent = state.files[curFile];

      // Update UI and focus the editor
      updateAll();
      applyLanguage(curFile);
      updateFileTree();
      editor.focus();
    }

    async function openLiveFile() {
      if (!('showOpenFilePicker' in window)) {
        toast('File System Access API not supported', 'error');
        return;
      }

      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'HTML Files',
            accept: {
              'text/html': ['.html']
            }
          }],
          multiple: false
        });

        const file = await handle.getFile();
        const content = await file.text();

        // Store the file handle on the filename for later access
        if (!state.fileHandles) state.fileHandles = {};
        state.fileHandles[handle.name] = handle;

        // Store original content for change detection
        if (!state.originalContent) state.originalContent = {};
        state.originalContent[handle.name] = content;

        // Integrate with existing state
        state.files[handle.name] = content;
        state.undoStack[handle.name] = [content];
        state.redoStack[handle.name] = [];
        copyFromFile(handle.name);

        toast(`${handle.name} opened for live editing`, 'success');
        updateFileTree();

      } catch (err) {
        if (err.name !== 'AbortError') {
          toast(`Error opening file: ${err}`, 'error');
          toast('Failed to open file', 'error');
        }
      }
    }

    async function saveLiveFile() {
      const filename = state.currentFile;
      if (!filename) {
        toast('No file selected', 'warning');
        return;
      }

      const content = state.files[filename];

      // Check if this file has a live handle
      if (state.fileHandles && state.fileHandles[filename]) {
        try {
          const handle = state.fileHandles[filename];
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();

          // Update original content tracking
          if (state.originalContent) {
            state.originalContent[filename] = content;
          }

          toast('File saved', 'success');
          // Auto-run console on save if enabled and console is open
          if (document.getElementById('con-autorun')?.checked && document.getElementById('console-panel')?.classList.contains('open')) {
            if (typeof conRun === 'function') conRun();
          }
          return;
        } catch (err) {
          console.error('Error saving file:', err);
          toast('Failed to save file', 'error');
          return;
        }
      }

      // No handle? Fall back to regular export
      await exportFile(false);
      // Auto-run console on save if enabled and console is open
      if (document.getElementById('con-autorun')?.checked && document.getElementById('console-panel')?.classList.contains('open')) {
        if (typeof conRun === 'function') setTimeout(conRun, 100);
      }
    }

    function hasUnsavedChanges() {
      const filename = state.currentFile;
      if (!filename || !state.originalContent || !state.originalContent[filename]) {
        return false;
      }

      return state.files[filename] !== state.originalContent[filename];
    }

    function revertToSaved() {
      const filename = state.currentFile;
      if (!filename || !state.originalContent || !state.originalContent[filename]) {
        toast('No saved version to revert to', 'warning');
        return;
      }

      state.files[filename] = state.originalContent[filename];
      editor.textContent = state.originalContent[filename];
      updateAll();
      toast('Reverted to saved version', 'success');
    }

    function isLiveFile() {
      const filename = state.currentFile;
      return !!(state.fileHandles && state.fileHandles[filename]);
    }

    function renameFile(oldName) {
      const newName = prompt('Rename:', oldName);
      if (!newName || newName.trim() === oldName) return;
      const n = newName.trim();
      if (state.files[n]) {
        toast(`"${n}" already exists`, 'error');
        return;
      }
      state.files[n] = state.files[oldName];
      state.undoStack[n] = state.undoStack[oldName] || [];
      state.redoStack[n] = state.redoStack[oldName] || [];
      delete state.files[oldName];
      delete state.undoStack[oldName];
      delete state.redoStack[oldName];
      for (const htmlFile of Object.keys(state.linkedFiles)) {
        const lk = state.linkedFiles[htmlFile];
        ['css', 'js'].forEach(t => {
          const i = lk[t].indexOf(oldName);
          if (i !== -1) lk[t][i] = n;
        });
      }
      if (state.linkedFiles[oldName]) {
        state.linkedFiles[n] = state.linkedFiles[oldName];
        delete state.linkedFiles[oldName];
      }
      if (state.currentFile === oldName) {
        state.currentFile = n;
        document.getElementById('file-info').textContent = n;
        applyLanguage(n);
      }
      saveState();
      updateFileTree();
      toast(`Renamed to "${n}"`, 'success');
    }

    function deleteFile(name) {
      if (Object.keys(state.files).length <= 1) {
        toast('Cannot delete the only file', 'warning');
        return;
      }
      if (!confirm(`Delete "${name}"?`)) return;
      delete state.files[name];
      delete state.undoStack[name];
      delete state.redoStack[name];
      for (const htmlFile of Object.keys(state.linkedFiles)) {
        const lk = state.linkedFiles[htmlFile];
        lk.css = lk.css.filter(f => f !== name);
        lk.js = lk.js.filter(f => f !== name);
      }
      delete state.linkedFiles[name];
      if (state.currentFile === name) {
        state.currentFile = Object.keys(state.files)[0];
        editor.textContent = state.files[state.currentFile];
        updateAll();
        applyLanguage(state.currentFile);
        document.getElementById('file-info').textContent = state.currentFile;
      }
      saveState();
      updateFileTree();
      toast(`Deleted "${name}"`, 'info');
    }

    const _FILE_ICON_MAP = {
      css: 'fa-file-code',
      js: 'fa-file-code',
      ts: 'fa-file-code',
      json: 'fa-database'
    };

    function updateFileTree() {
      const currentExt = (state.currentFile || '').split('.').pop().toLowerCase();
      const currentIsHtml = currentExt === 'html' || currentExt === 'htm';

      fileTree.innerHTML = Object.keys(state.files)
        .map(name => {
          const ext = name.split('.').pop().toLowerCase();
          const isHtml = ext === 'html' || ext === 'htm';
          const isActive = name === state.currentFile;
          const linkedTo = getLinkedHtmlFile(name);
          const isLinked = !!linkedTo;

          const icon = _FILE_ICON_MAP[ext] || 'fa-file-code';

          // Show link button on non-HTML files when current file is HTML
          const showLinkBtn = !isHtml && currentIsHtml;
          const linkBtn = showLinkBtn ?
            `<button class="file-link-btn ${isLinked ? 'linked' : ''}"
                                 onclick="event.stopPropagation(); toggleLink('${name}')"
                                 title="${isLinked ? 'Unlink from ' + linkedTo : 'Link to ' + state.currentFile}">
                                 <i class="fas fa-link"></i>
                             </button>` :
            (isLinked && !isHtml ? `<span style="font-size:10px;color:var(--accent);flex-shrink:0" title="Linked to ${linkedTo}"><i class="fas fa-link"></i></span>` : '');

          return `<div class="file-item ${isActive ? 'active' : ''}" onclick="copyFromFile('${name}');">
                          <i class="fas ${icon}"></i>
                          <span>${name}</span>
                          ${linkBtn}
                          <button class="file-action-btn" style="color:var(--text-primary);" onclick="event.stopPropagation();renameFile('${name}')" title="Rename"><i class="fas fa-pencil"></i></button>
                          <button class="file-action-btn del" style="color:var(--text-primary);" onclick="event.stopPropagation();deleteFile('${name}')" title="Delete"><i class="fas fa-trash"></i></button>
                      </div>`;
        }).join('');
    }

    const recentBackupsKey = 'recentBackups';
    const MAX_BACKUP_VERSIONS = 4; // snapshots kept per file
    const recentBackupsContainer = document.getElementById('recentBackupsContainer');
    const backupsModal = document.getElementById('backupModal');

    function closeModal() {
      backupsModal.style.display = 'none';
    }

    // backupFile: prepends a new snapshot to the per-file version array in IDB.
    // Each file keeps up to MAX_BACKUP_VERSIONS snapshots, oldest dropped automatically.
    function backupFile(fileId, content) {
      const snapshot = {
        content,
        timestamp: Date.now()
      };
      if (_db) {
        dbGet('backups', fileId)
          .then(existing => {
            const versions = Array.isArray(existing) ? existing : [];
            const updated = [snapshot, ...versions].slice(0, MAX_BACKUP_VERSIONS);
            return dbSet('backups', fileId, updated);
          })
          .catch(() => {});
      } else {
        // localStorage fallback: object keyed by fileId, each value = versions array
        const store = JSON.parse(localStorage.getItem(recentBackupsKey) || '{}');
        const versions = Array.isArray(store[fileId]) ? store[fileId] : [];
        store[fileId] = [snapshot, ...versions].slice(0, MAX_BACKUP_VERSIONS);
        try {
          localStorage.setItem(recentBackupsKey, JSON.stringify(store));
        } catch (_) {}
      }
    }

    async function showRecentBackups() {
      // Collect { fileId, versions[] } from IDB or localStorage fallback
      let groups = []; // [{ fileId, versions: [{content,timestamp},...] }]
      if (_db) {
        const rows = await dbAll('backups').catch(() => []);
        groups = rows
          .filter(r => Array.isArray(r.value) && r.value.length)
          .map(r => ({
            fileId: r.key,
            versions: r.value
          }));
      } else {
        const store = JSON.parse(localStorage.getItem(recentBackupsKey) || '{}');
        groups = Object.entries(store)
          .filter(([, v]) => Array.isArray(v) && v.length)
          .map(([fileId, versions]) => ({
            fileId,
            versions
          }));
      }

      recentBackupsContainer.innerHTML = '';

      if (!groups.length) {
        const msg = document.createElement('p');
        msg.textContent = 'No recent backups available. Preview page to create a backup.';
        recentBackupsContainer.appendChild(msg);
        return;
      }

      // Sort groups by the timestamp of their newest snapshot, most recent first
      groups.sort((a, b) => b.versions[0].timestamp - a.versions[0].timestamp);

      for (const {
          fileId,
          versions
        }
        of groups) {
        const safeId = fileId.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        // File header
        const header = document.createElement('div');
        header.style.cssText = 'padding:6px 10px 4px;font-size:11px;color:var(--accent,#7c3aed);font-weight:600;border-bottom:1px solid rgba(255,255,255,.07);';
        header.textContent = `${fileId}  (${versions.length} version${versions.length !== 1 ? 's' : ''})`;
        recentBackupsContainer.appendChild(header);

        // One row per snapshot, newest first (index 0 = newest)
        versions.forEach((snap, idx) => {
          const el = document.createElement('div');
          el.className = 'backup-item';
          el.style.paddingLeft = '18px';
          el.innerHTML = `
              <div class="backup-info">
                <span class="backup-time">v${versions.length - idx} &mdash; ${formatDate(snap.timestamp)}</span>
              </div>
              <button class="btn2" onclick="restoreBackup('${safeId}', ${idx})">Restore</button>
            `;
          recentBackupsContainer.appendChild(el);
        });
      }
    }

    async function restoreBackup(fileId, versionIdx) {
      let versions;
      if (_db) {
        versions = await dbGet('backups', fileId).catch(() => null);
      } else {
        const store = JSON.parse(localStorage.getItem(recentBackupsKey) || '{}');
        versions = store[fileId] || null;
      }

      const snap = Array.isArray(versions) ? versions[versionIdx] : null;
      if (!snap) {
        toast('Backup not found', 'error');
        return;
      }

      const codeBackup = snap.content;
      if (!codeBackup || typeof codeBackup !== 'string' || !codeBackup.trim()) {
        toast('No backup content found', 'info');
        return;
      }

      const titleMatch = codeBackup.match(/<title>(.*?)<\/title>/i);
      let pageTitle = titleMatch ? titleMatch[1].trim() : 'Restored Page';
      pageTitle += '.html';

      createNewFile(pageTitle);
      displayHTML(codeBackup);
      toast(`Restored v${versions.length - versionIdx} of ${fileId}`, 'success');
      updateAll();
      closeModal();
    }

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    (function() {
      const sr_searchBar = document.getElementById('searchBar');
      const sr_searchBtn = document.getElementById('search-btn');
      const sr_searchClose = document.getElementById('searchClose');
      const sr_searchInput = document.getElementById('searchInput');
      const sr_replaceInput = document.getElementById('replaceInput');
      const sr_toggleReplace = document.getElementById('toggleReplace');
      const sr_replaceRow = document.getElementById('replaceRow');
      const sr_caseSensitive = document.getElementById('caseSensitive');
      const sr_wholeWord = document.getElementById('wholeWord');
      const sr_useRegex = document.getElementById('useRegex');
      const sr_matchCount = document.getElementById('matchCount');
      const sr_prevMatchBtn = document.getElementById('prevMatch');
      const sr_nextMatchBtn = document.getElementById('nextMatch');
      const sr_replaceOneBtn = document.getElementById('replaceOne');
      const sr_replaceAllBtn = document.getElementById('replaceAll');

      let sr_matches = [];
      let sr_currentMatchIndex = -1;
      let sr_originalContent = '';
      let sr_searchTimeout = null;

      // Open search bar
      sr_searchBtn.addEventListener('click', () => {
        sr_searchBar.style.display = 'block';
        sr_searchInput.focus();
        sr_performSearch();
      });

      // Close search bar
      sr_searchClose.addEventListener('click', () => {
        updateAll();
        sr_searchBar.style.display = 'none';
        sr_clearHighlights();
      });

      // Toggle replace row
      sr_toggleReplace.addEventListener('click', () => {
        if (sr_replaceRow.style.display === 'none') {
          sr_replaceRow.style.display = 'flex';
          sr_toggleReplace.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
          sr_replaceRow.style.display = 'none';
          sr_toggleReplace.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
      });

      // Toggle search options
      sr_caseSensitive.addEventListener('click', () => {
        sr_caseSensitive.classList.toggle('active');
        sr_performSearch();
      });

      sr_wholeWord.addEventListener('click', () => {
        sr_wholeWord.classList.toggle('active');
        sr_performSearch();
      });

      sr_useRegex.addEventListener('click', () => {
        sr_useRegex.classList.toggle('active');
        sr_performSearch();
      });

      // Search on input
      sr_searchInput.addEventListener('input', () => {
        // Debounce: wait 500ms after user stops typing
        clearTimeout(sr_searchTimeout);
        sr_searchTimeout = setTimeout(sr_performSearch, 500);
      });

      function sr_performSearch() {
        const sr_editor = document.getElementById('editor');
        const sr_searchTerm = sr_searchInput.value;

        sr_clearHighlights();
        sr_matches = [];
        sr_currentMatchIndex = -1;

        if (!sr_searchTerm) {
          sr_matchCount.textContent = '0 of 0';
          return;
        }

        try {
          const sr_content = sr_editor.textContent;
          let sr_pattern;

          if (sr_useRegex.classList.contains('active')) {
            const sr_flags = sr_caseSensitive.classList.contains('active') ? 'g' : 'gi';
            sr_pattern = new RegExp(sr_searchTerm, sr_flags);
          } else {
            let sr_escapedTerm = sr_searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (sr_wholeWord.classList.contains('active')) {
              sr_escapedTerm = '\\b' + sr_escapedTerm + '\\b';
            }
            const sr_flags = sr_caseSensitive.classList.contains('active') ? 'g' : 'gi';
            sr_pattern = new RegExp(sr_escapedTerm, sr_flags);
          }

          let sr_match;
          while ((sr_match = sr_pattern.exec(sr_content)) !== null) {
            sr_matches.push({
              index: sr_match.index,
              length: sr_match[0].length,
              text: sr_match[0]
            });
          }

          sr_matchCount.textContent = sr_matches.length > 0 ? `${sr_matches.length}` : 'No results';

          if (sr_matches.length > 0) {
            sr_currentMatchIndex = 0;
            sr_highlightMatches();
          }
        } catch (e) {
          sr_matchCount.textContent = 'Invalid';
        }
      }

      function sr_clearHighlights() {
        const sr_editor = document.getElementById('editor');
        const sr_highlighted = document.getElementById('highlighted');

        // Don't clear if there's no search - preserve syntax highlighting
        if (!sr_searchInput.value && sr_highlighted && sr_editor) {
          return;
        }

        // Only add highlights, don't replace content
        if (sr_highlighted) {
          const sr_spans = sr_highlighted.querySelectorAll('.search-highlight, .search-highlight-current');
          sr_spans.forEach(sr_span => {
            const sr_text = document.createTextNode(sr_span.textContent);
            sr_span.parentNode.replaceChild(sr_text, sr_span);
          });
        }
      }

      function sr_highlightMatches() {
        if (sr_matches.length === 0) return;

        const sr_editor = document.getElementById('editor');
        const sr_highlighted = document.getElementById('highlighted');
        const sr_content = sr_editor.textContent;

        // Performance optimization: only highlight visible matches (limit to 10000)
        const MAX_HIGHLIGHTS = 10000;
        const sr_matchesToHighlight = sr_matches.length > MAX_HIGHLIGHTS ?
          sr_matches.slice(0, MAX_HIGHLIGHTS) :
          sr_matches;

        // Store positions to inject highlights
        let sr_injections = [];
        sr_matchesToHighlight.forEach((sr_match, sr_idx) => {
          sr_injections.push({
            index: sr_match.index,
            length: sr_match.length,
            isCurrent: sr_idx === sr_currentMatchIndex
          });
        });

        // Build highlighted HTML by injecting spans
        let sr_result = '';
        let sr_lastIndex = 0;

        sr_injections.forEach(sr_inj => {
          sr_result += sr_escapeHtml(sr_content.substring(sr_lastIndex, sr_inj.index));
          const sr_className = sr_inj.isCurrent ? 'search-highlight-current' : 'search-highlight';
          sr_result += `<span class="${sr_className}">${sr_escapeHtml(sr_content.substring(sr_inj.index, sr_inj.index + sr_inj.length))}</span>`;
          sr_lastIndex = sr_inj.index + sr_inj.length;
        });

        sr_result += sr_escapeHtml(sr_content.substring(sr_lastIndex));

        // Preserve existing syntax highlighting by only replacing text nodes
        sr_highlighted.innerHTML = sr_result;

        sr_matchCount.textContent = `${sr_currentMatchIndex + 1}/${sr_matches.length}`;
        if (sr_matches.length > MAX_HIGHLIGHTS) {
          sr_matchCount.textContent += ` (showing ${MAX_HIGHLIGHTS})`;
        }

        // Scroll to current match
        sr_scrollToMatch();
      }

      function sr_scrollToMatch() {
        const sr_highlighted = document.getElementById('highlighted');
        const sr_currentHighlight = sr_highlighted.querySelector('.search-highlight-current');
        if (sr_currentHighlight) {
          sr_currentHighlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }

      const _sr_escapeDiv = document.createElement('div');

      function sr_escapeHtml(sr_text) {
        _sr_escapeDiv.textContent = sr_text;
        return _sr_escapeDiv.innerHTML;
      }

      // Navigation
      sr_prevMatchBtn.addEventListener('click', () => {
        if (sr_matches.length === 0) return;
        sr_currentMatchIndex = (sr_currentMatchIndex - 1 + sr_matches.length) % sr_matches.length;
        sr_highlightMatches();
      });

      sr_nextMatchBtn.addEventListener('click', () => {
        if (sr_matches.length === 0) return;
        sr_currentMatchIndex = (sr_currentMatchIndex + 1) % sr_matches.length;
        sr_highlightMatches();
      });

      // Replace
      sr_replaceOneBtn.addEventListener('click', () => {
        if (sr_matches.length === 0 || sr_currentMatchIndex === -1) return;

        const sr_editor = document.getElementById('editor');
        const sr_content = sr_editor.textContent;
        const sr_match = sr_matches[sr_currentMatchIndex];
        const sr_replaceText = sr_replaceInput.value;

        const sr_newContent = sr_content.substring(0, sr_match.index) + sr_replaceText + sr_content.substring(sr_match.index + sr_match.length);

        saveState();

        state.files[state.currentFile] = sr_newContent;
        sr_editor.textContent = sr_newContent;

        sr_performSearch();
      });

      sr_replaceAllBtn.addEventListener('click', () => {
        if (sr_matches.length === 0) return;

        const sr_editor = document.getElementById('editor');
        const sr_content = sr_editor.textContent;
        const sr_replaceText = sr_replaceInput.value;

        let sr_newContent = sr_content;
        for (let sr_i = sr_matches.length - 1; sr_i >= 0; sr_i--) {
          const sr_match = sr_matches[sr_i];
          sr_newContent = sr_newContent.substring(0, sr_match.index) + sr_replaceText + sr_newContent.substring(sr_match.index + sr_match.length);
        }

        saveState();

        state.files[state.currentFile] = sr_newContent;
        sr_editor.textContent = sr_newContent;

        sr_performSearch();
      });

      sr_searchInput.addEventListener('keydown', (sr_e) => {
        if (sr_e.key === 'Enter') {
          sr_e.preventDefault();
          if (sr_e.shiftKey) {
            sr_prevMatchBtn.click();
          } else {
            sr_nextMatchBtn.click();
          }
        }
        if (sr_e.key === 'Escape') {
          sr_searchClose.click();
        }
      });

      sr_replaceInput.addEventListener('keydown', (sr_e) => {
        if (sr_e.key === 'Enter') {
          sr_e.preventDefault();
          if (sr_e.shiftKey) {
            sr_replaceAllBtn.click();
          } else {
            sr_replaceOneBtn.click();
          }
        }
      });

      document.addEventListener('keydown', (sr_e) => {
        if ((sr_e.ctrlKey || sr_e.metaKey) && sr_e.key === 'f') {
          sr_e.preventDefault();
          sr_searchBar.style.display = 'block';
          sr_searchInput.focus();
          sr_searchInput.select(); // Select any existing text
          sr_performSearch();
        }
      });
    })();

    function updateFileInfo() {
      const maxChars = 10;
      if (!_elFileInfo) _elFileInfo = document.getElementById('file-info');
      const fileInfoElement = _elFileInfo;
      const fileName = state?.currentFile || 'Untitled.html';

      const dotIndex = fileName.lastIndexOf('.');
      const namePart = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
      const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';

      const truncatedName = namePart.length > maxChars ?
        namePart.slice(0, maxChars - 3) + '...' :
        namePart;

      fileInfoElement.textContent = truncatedName + extension;
    }

    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('active');

      const backdrop = document.querySelector('.sidebar-backdrop');
      if (sidebar.classList.contains('active') && !backdrop) {
        const newBackdrop = document.createElement('div');
        newBackdrop.className = 'sidebar-backdrop';
        newBackdrop.onclick = toggleSidebar;
        document.body.appendChild(newBackdrop);
      } else if (backdrop) {
        backdrop.remove();
      }
    }

    function closeSidebarOnOutsideClick(e) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('active') &&
        !e.target.closest('.sidebar') &&
        !e.target.closest('#menu-btn')) {
        sidebar.classList.remove('active');
      }
    }

    function openPreview() {
      const editorContent = getPreviewDocument();
      const titleMatch = editorContent.match(/<title>(.*?)<\/title>/i);
      let pageTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Page';
      backupFile(pageTitle, editorContent);

      const debugConsoleCode = `
                  (function() {'use strict';var NL=String.fromCharCode(10);var css='#dc-root{position:fixed;left:0;width:100%;background:#1a1a2e;color:#e0e0e0;'+ 'font-family:"SF Mono","Fira Code",Consolas,"Courier New",monospace;font-size:12px;'+ 'z-index:99999;display:none;flex-direction:column;box-shadow:0 0 20px rgba(0,0,0,.5);height:260px}'+ '#dc-root,#dc-root *{box-sizing:border-box;margin:0}'+ '#dc-root.dc-bottom{bottom:0;border-top:2px solid #e94560}'+ '#dc-root.dc-top{top:0;border-bottom:2px solid #e94560}'+ '#dc-toolbar{display:flex;justify-content:space-between;align-items:center;'+ 'padding:3px 6px;background:#16213e;flex-shrink:0;flex-wrap:wrap;gap:3px;order:1}'+ '.dc-btn{background:#0f3460;color:#a0a0c0;border:1px solid #1a1a4e;padding:3px 7px;'+ 'font-size:10px;font-family:inherit;cursor:pointer;border-radius:3px;white-space:nowrap;'+ '-webkit-tap-highlight-color:transparent}'+ '.dc-btn:active{opacity:.7}'+ '.dc-btn.dc-active{background:#e94560;color:#fff;border-color:#e94560}'+ '#dc-filters,#dc-actions{display:flex;gap:2px}'+ '#dc-output{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 8px;min-height:0;'+ 'order:2;-webkit-overflow-scrolling:touch}'+ '.dc-entry{padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);'+ 'line-height:1.5;word-wrap:break-word;overflow-wrap:break-word}'+ '.dc-time{color:#555;margin-right:6px;font-size:10px}'+ '.dc-type-warn{background:rgba(255,170,0,.05);border-left:3px solid #ffa500;padding-left:5px}'+ '.dc-type-error{background:rgba(255,68,68,.08);border-left:3px solid #ff4444;padding-left:5px}'+ '.dc-type-info{border-left:3px solid #0af;padding-left:5px}'+ '.dc-warn-text{color:#fa0}'+ '.dc-error-text{color:#ff6b6b}'+ '.dc-info-text{color:#0af}'+ '.dc-debug-text{color:#888}'+ '.dc-trace-text{color:#bb86fc;font-size:11px}'+ '.dc-cmd{color:#666}'+ '.dc-result{color:#8be9fd}'+ '.dc-v-null,.dc-v-undef{color:#888;font-style:italic}'+ '.dc-v-str{color:#f1fa8c}'+ '.dc-v-num{color:#bd93f9}'+ '.dc-v-bool{color:#ff79c6}'+ '.dc-v-fn{color:#8be9fd;font-style:italic}'+ '.dc-v-sym{color:#50fa7b}'+ '.dc-v-obj{color:#e0e0e0}'+ '.dc-v-dom{color:#ff79c6}'+ '.dc-v-err{color:#ff6b6b;white-space:pre-wrap;font-size:11px}'+ 'details.dc-obj{display:inline}'+ 'details.dc-obj>summary{cursor:pointer;display:inline;list-style:none}'+ 'details.dc-obj>summary::-webkit-details-marker{display:none}'+ 'details.dc-obj>summary::before{content:"\u25B6 ";font-size:9px;color:#666}'+ 'details.dc-obj[open]>summary::before{content:"\u25BC "}'+ '.dc-pre{margin:2px 0 2px 12px;padding:4px 8px;background:rgba(255,255,255,.03);'+ 'border-left:2px solid #333;font-family:inherit;font-size:11px;white-space:pre-wrap;'+ 'color:#ccc;overflow-x:auto}'+ '.dc-table-wrap{overflow-x:auto;margin:4px 0}'+ '.dc-table{border-collapse:collapse;font-size:11px}'+ '.dc-table th,.dc-table td{border:1px solid #333;padding:3px 8px;text-align:left;white-space:nowrap}'+ '.dc-table th{background:#16213e;color:#8be9fd;font-weight:bold}'+ '.dc-table td{color:#ddd}'+ '.dc-table tr:nth-child(even) td{background:rgba(255,255,255,.02)}'+ '#dc-resize{height:8px;cursor:ns-resize;flex-shrink:0;touch-action:none;'+ 'background:repeating-linear-gradient(90deg,transparent,transparent 48%,#333 48%,#333 52%,transparent 52%);'+ 'background-size:20px 2px;background-position:center;background-repeat:repeat-x}'+ '#dc-root.dc-top #dc-resize{order:10}'+ '#dc-root.dc-bottom #dc-resize{order:0}'+ '#dc-inputbar{display:flex;gap:3px;padding:4px 6px;background:#16213e;flex-shrink:0;order:3}'+ '#dc-input{flex:1;background:#0a0a1a;color:#e0e0e0;border:1px solid #333;padding:6px 8px;'+ 'font-family:inherit;font-size:12px;border-radius:3px;outline:none;min-width:0}'+ '#dc-input:focus{border-color:#e94560}'+ '#dc-input::placeholder{color:#444}'+ '#dc-inputbar .dc-btn{padding:6px 8px;font-size:12px}'+ '#dc-show{position:fixed;bottom:10px;right:10px;background:#16213e;color:#e94560;'+ 'border:1px solid #e94560;padding:8px 14px;font-family:"SF Mono","Fira Code",Consolas,monospace;'+ 'font-size:11px;cursor:pointer;z-index:100000;border-radius:5px;'+ 'box-shadow:0 2px 15px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent}'+ '#dc-show:active{background:#e94560;color:#fff}'+ '.dc-badge{position:absolute;top:-8px;right:-8px;background:#ff4444;color:#fff;'+ 'border-radius:10px;min-width:18px;height:18px;font-size:10px;display:flex;'+ 'align-items:center;justify-content:center;padding:0 4px;font-weight:bold}'+ '.dc-group-indent{display:inline-block}'+ '@keyframes dc-pulse{'+ '0%,100%{box-shadow:0 2px 15px rgba(0,0,0,.4)}'+ '50%{box-shadow:0 2px 20px rgba(255,68,68,.5)}}'+ '#dc-show.dc-has-errors{animation:dc-pulse 2s infinite;border-color:#ff4444;color:#ff4444}';var styleEl=document.createElement('style');styleEl.textContent=css;(document.head || document.documentElement).appendChild(styleEl);var nativeConsole={};['log','warn','error','info','debug','trace','assert','table','group','groupCollapsed','groupEnd','time','timeEnd','timeLog','clear','count','countReset','dir'].forEach(function(m) {nativeConsole[m]=console[m] ? console[m].bind(console) : function() {};});var state={history: [],historyIndex: -1,groupDepth: 0,timers: {},counters: {},filter: 'all',position: 'bottom',errorCount: 0,visible: false,counts: { log: 0, warn: 0, error: 0, info: 0, debug: 0 },maxEntries: 1000};var buffer=[];var domReady=false;function esc(str) {var d=document.createElement('div');d.textContent=String(str);return d.innerHTML;}function safeStringify(obj, indent) {var seen=new WeakSet();return JSON.stringify(obj, function(key, val) {if (typeof val==='object' && val !==null) {if (seen.has(val)) return '[Circular]';seen.add(val);}if (typeof val==='function') return '[Function: ' + (val.name || 'anonymous') + ']';if (typeof val==='undefined') return '[undefined]';if (typeof val==='symbol') return val.toString();if (typeof val==='bigint') return val.toString() + 'n';return val;}, indent);}function formatValue(val, asReturn) {if (val===null) return '<span class="dc-v-null">null</span>';if (val===undefined) return '<span class="dc-v-undef">undefined</span>';var type=typeof val;if (type==='string') {return asReturn? '<span class="dc-v-str">"' + esc(val) + '"</span>': esc(val);}if (type==='number' || type==='bigint') {return '<span class="dc-v-num">' + esc(String(val)) + (type==='bigint' ? 'n' : '') + '</span>';}if (type==='boolean') return '<span class="dc-v-bool">' + val + '</span>';if (type==='symbol') return '<span class="dc-v-sym">' + esc(val.toString()) + '</span>';if (type==='function') {var fnName=val.name || 'anonymous';return '<details class="dc-obj"><summary><span class="dc-v-fn">\u0192 '+ esc(fnName) + '()</span></summary><pre class="dc-pre">'+ esc(val.toString()) + '</pre></details>';}if (type==='object') return formatObject(val);return esc(String(val));}function formatObject(obj) {if (obj instanceof Error) {return '<span class="dc-v-err">' + esc(obj.stack || obj.message || String(obj)) + '</span>';}if (obj instanceof Date) return '<span class="dc-v-str">' + esc(obj.toISOString()) + '</span>';if (obj instanceof RegExp) return '<span class="dc-v-num">' + esc(obj.toString()) + '</span>';if (typeof Map !=='undefined' && obj instanceof Map) {var mapObj={};obj.forEach(function(v, k) { mapObj[String(k)]=v; });return 'Map(' + obj.size + ') ' + makeCollapsible(mapObj);}if (typeof Set !=='undefined' && obj instanceof Set) {return 'Set(' + obj.size + ') ' + makeCollapsible(Array.from(obj));}if (obj instanceof Element) {var tag=obj.tagName.toLowerCase();var id=obj.id ? '#' + obj.id : '';var cls=(obj.className && typeof obj.className==='string')? '.' + obj.className.trim().split(' ').filter(Boolean).join('.') : '';var preview='<' + tag + id + cls + '>';return '<details class="dc-obj"><summary><span class="dc-v-dom">'+ esc(preview) + '</span></summary><pre class="dc-pre">'+ esc(obj.outerHTML.substring(0, 500))+ (obj.outerHTML.length > 500 ? '...' : '') + '</pre></details>';}if (obj instanceof NodeList || obj instanceof HTMLCollection) {return makeCollapsible(Array.from(obj));}return makeCollapsible(obj);}function makeCollapsible(obj) {var preview, full;try { preview=safeStringify(obj); full=safeStringify(obj, 2); }catch (e) { return esc(String(obj)); }if (!preview) return esc(String(obj));var display=preview.length <=80 ? preview : preview.substring(0, 80) + '\u2026';return '<details class="dc-obj"><summary><span class="dc-v-obj">'+ esc(display) + '</span></summary><pre class="dc-pre">'+ esc(full) + '</pre></details>';}function formatArgs(args) {if (args.length===0) return '';var result=[];for (var i=0; i < args.length; i++) result.push(formatValue(args[i], false));return result.join(' ');}function getTimestamp() {var d=new Date();return d.getHours().toString().padStart(2, '0') + ':'+ d.getMinutes().toString().padStart(2, '0') + ':'+ d.getSeconds().toString().padStart(2, '0') + '.'+ d.getMilliseconds().toString().padStart(3, '0');}function getIndent() {if (state.groupDepth <=0) return '';return '<span class="dc-group-indent" style="width:' + (state.groupDepth * 14) + 'px"></span>';}function addEntry(type, html) {if (state.counts[type] !==undefined) state.counts[type]++;if (type==='error') state.errorCount++;var entryData={ type: type, html: html, time: getTimestamp() };if (!domReady) { buffer.push(entryData); return; }renderEntry(entryData);updateFilterCounts();updateBadge();}function renderEntry(entry) {var output=document.getElementById('dc-output');if (!output) return;var div='<div class="dc-entry dc-type-' + entry.type + '" data-type="' + entry.type + '"'+ (state.filter !=='all' && entry.type !==state.filter ? ' style="display:none"' : '') + '>'+ '<span class="dc-time">[' + entry.time + ']</span>'+ getIndent() + entry.html + '</div>';output.insertAdjacentHTML('beforeend', div);while (output.children.length > state.maxEntries) output.removeChild(output.firstChild);output.scrollTop=output.scrollHeight;}function applyFilter() {var output=document.getElementById('dc-output');if (!output) return;var entries=output.querySelectorAll('.dc-entry');for (var i=0; i < entries.length; i++) {entries[i].style.display=(state.filter==='all' || entries[i].getAttribute('data-type')===state.filter)? '' : 'none';}}function updateFilterCounts() {var btns=document.querySelectorAll('#dc-filters .dc-btn');btns.forEach(function(btn) {var f=btn.getAttribute('data-filter');if (f==='all') return;var count=state.counts[f] || 0;var label=btn.getAttribute('data-label');btn.textContent=count > 0 ? label + '(' + count + ')' : label;});}function updateBadge() {var showBtn=document.getElementById('dc-show');if (!showBtn) return;var badge=showBtn.querySelector('.dc-badge');if (state.errorCount > 0) {if (!badge) {badge=document.createElement('span');badge.className='dc-badge';showBtn.appendChild(badge);}badge.textContent=state.errorCount > 99 ? '99+' : state.errorCount;showBtn.classList.add('dc-has-errors');} else {if (badge) badge.remove();showBtn.classList.remove('dc-has-errors');}}console.log=function() {nativeConsole.log.apply(null, arguments);addEntry('log', formatArgs(arguments));};console.warn=function() {nativeConsole.warn.apply(null, arguments);addEntry('warn', '<span class="dc-warn-text">\u26A0 ' + formatArgs(arguments) + '</span>');};console.error=function() {nativeConsole.error.apply(null, arguments);addEntry('error', '<span class="dc-error-text">\u2716 ' + formatArgs(arguments) + '</span>');};console.info=function() {nativeConsole.info.apply(null, arguments);addEntry('info', '<span class="dc-info-text">\u2139 ' + formatArgs(arguments) + '</span>');};console.debug=function() {nativeConsole.debug.apply(null, arguments);addEntry('debug', '<span class="dc-debug-text">' + formatArgs(arguments) + '</span>');};console.trace=function() {nativeConsole.trace.apply(null, arguments);var stack='';try { throw new Error(); } catch (e) { stack=e.stack || ''; }var lines=stack.split(NL).slice(2).join(NL);addEntry('debug', '<span class="dc-trace-text">Trace: ' + formatArgs(arguments)+ '<br>' + esc(lines) + '</span>');};console.assert=function(assertion) {nativeConsole.assert.apply(null, arguments);if (!assertion) {var args=Array.prototype.slice.call(arguments, 1);addEntry('error', '<span class="dc-error-text">\u2716 Assertion failed: '+ (args.length ? formatArgs(args) : 'console.assert') + '</span>');}};console.table=function(data, columns) {nativeConsole.table.apply(null, arguments);if (!data || typeof data !=='object') { addEntry('log', formatValue(data)); return; }var isArray=Array.isArray(data);var tableEntries=[];var keys;if (isArray) {for (var i=0; i < data.length; i++) tableEntries.push({ idx: i, val: data[i] });} else {var objKeys=Object.keys(data);for (var j=0; j < objKeys.length; j++) tableEntries.push({ idx: objKeys[j], val: data[objKeys[j]] });}if (tableEntries.length===0) { addEntry('log', formatValue(data)); return; }var firstVal=tableEntries[0].val;var valuesAreObjects=(typeof firstVal==='object' && firstVal !==null&& !Array.isArray(firstVal) && !(firstVal instanceof Date));if (valuesAreObjects) {var allKeys={};tableEntries.forEach(function(e) {if (typeof e.val==='object' && e.val !==null)Object.keys(e.val).forEach(function(k) { allKeys[k]=true; });});keys=columns || Object.keys(allKeys);} else {keys=['Value'];}var html='<div class="dc-table-wrap"><table class="dc-table"><thead><tr><th>(index)</th>';keys.forEach(function(k) { html +='<th>' + esc(k) + '</th>'; });html +='</tr></thead><tbody>';tableEntries.forEach(function(entry) {html +='<tr><td>' + esc(String(entry.idx)) + '</td>';if (valuesAreObjects && typeof entry.val==='object' && entry.val !==null) {keys.forEach(function(k) {var v=entry.val[k];html +='<td>' + (v !==undefined ? esc(String(v)) : '') + '</td>';});} else {html +='<td>' + esc(String(entry.val)) + '</td>';}html +='</tr>';});html +='</tbody></table></div>';addEntry('log', html);};console.group=function() {nativeConsole.group.apply(null, arguments);addEntry('log', '<strong>\u25BC ' + (arguments.length ? formatArgs(arguments) : 'Group') + '</strong>');state.groupDepth++;};console.groupCollapsed=function() {nativeConsole.groupCollapsed.apply(null, arguments);addEntry('log', '<strong>\u25B6 ' + (arguments.length ? formatArgs(arguments) : 'Group') + '</strong>');state.groupDepth++;};console.groupEnd=function() {nativeConsole.groupEnd.apply(null, arguments);if (state.groupDepth > 0) state.groupDepth--;};console.time=function(label) {nativeConsole.time.apply(null, arguments);state.timers[label || 'default']=performance.now();};console.timeLog=function(label) {nativeConsole.timeLog.apply(null, arguments);label=label || 'default';if (state.timers[label] !==undefined)addEntry('log', esc(label) + ': ' + (performance.now() - state.timers[label]).toFixed(2) + 'ms');};console.timeEnd=function(label) {nativeConsole.timeEnd.apply(null, arguments);label=label || 'default';if (state.timers[label] !==undefined) {addEntry('log', esc(label) + ': ' + (performance.now() - state.timers[label]).toFixed(2) + 'ms');delete state.timers[label];}};console.count=function(label) {nativeConsole.count.apply(null, arguments);label=label || 'default';state.counters[label]=(state.counters[label] || 0) + 1;addEntry('log', esc(label) + ': ' + state.counters[label]);};console.countReset=function(label) {nativeConsole.countReset.apply(null, arguments);state.counters[label || 'default']=0;};console.dir=function(obj) {nativeConsole.dir.apply(null, arguments);addEntry('log', formatValue(obj, true));};console.clear=function() {nativeConsole.clear.apply(null, arguments);var output=document.getElementById('dc-output');if (output) output.innerHTML='';state.errorCount=0;state.counts={ log: 0, warn: 0, error: 0, info: 0, debug: 0 };updateFilterCounts();updateBadge();};window.addEventListener('error', function(e) {var loc='';if (e.filename) loc=' (' + e.filename.split('/').pop() + ':' + e.lineno + ':' + e.colno + ')';addEntry('error', '<span class="dc-error-text">\u2716 ' + esc(e.message) + esc(loc) + '</span>');});window.addEventListener('unhandledrejection', function(e) {var reason=e.reason;var msg=(reason instanceof Error) ? (reason.stack || reason.message) : String(reason);addEntry('error', '<span class="dc-error-text">\u2716 Unhandled Promise: ' + esc(msg) + '</span>');});function runCommand(cmd) {if (!cmd || !cmd.trim()) return;state.history.push(cmd);state.historyIndex=-1;addEntry('log', '<span class="dc-cmd">\u276F ' + esc(cmd) + '</span>');try {var result=(0, eval)(cmd);if (result !==undefined) {if (result instanceof Promise) {addEntry('log', '<span class="dc-result">\u2190 Promise {pending}</span>');result.then(function(v) {addEntry('log', '<span class="dc-result">\u2190 Resolved: ' + formatValue(v, true) + '</span>');}).catch(function(err) {addEntry('error', '<span class="dc-error-text">\u2716 Rejected: ' + formatValue(err, true) + '</span>');});} else {addEntry('log', '<span class="dc-result">\u2190 ' + formatValue(result, true) + '</span>');}}} catch (e) {addEntry('error', '<span class="dc-error-text">\u2716 ' + esc(e.message) + '</span>');}}function navigateHistory(direction) {var input=document.getElementById('dc-input');if (!input || state.history.length===0) return;state.historyIndex +=direction;if (state.historyIndex < 0) { state.historyIndex=-1; input.value=''; return; }if (state.historyIndex >=state.history.length) state.historyIndex=state.history.length - 1;input.value=state.history[state.history.length - 1 - state.historyIndex] || '';}function showConsole() {var root=document.getElementById('dc-root');if (root) { root.style.display='flex'; state.visible=true; }var btn=document.getElementById('dc-show');if (btn) btn.style.display='none';}function hideConsole() {var root=document.getElementById('dc-root');if (root) { root.style.display='none'; state.visible=false; }var btn=document.getElementById('dc-show');if (btn) btn.style.display='';}function togglePosition() {var root=document.getElementById('dc-root');if (!root) return;if (state.position==='bottom') {root.classList.remove('dc-bottom');root.classList.add('dc-top');state.position='top';} else {root.classList.remove('dc-top');root.classList.add('dc-bottom');state.position='bottom';}}function copyOutput(btn) {var output=document.getElementById('dc-output');if (!output) return;var text=output.innerText;var done=function() {var orig=btn.textContent;btn.textContent='COPIED!';setTimeout(function() { btn.textContent=orig; }, 1500);};if (navigator.clipboard && navigator.clipboard.writeText) {navigator.clipboard.writeText(text).then(done).catch(function() { fallbackCopy(text); done(); });} else { fallbackCopy(text); done(); }}function fallbackCopy(text) {var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try { document.execCommand('copy'); } catch (e) {}document.body.removeChild(ta);}function setupResize() {var handle=document.getElementById('dc-resize');var root=document.getElementById('dc-root');if (!handle || !root) return;var startY, startH;function onStart(y) { startY=y; startH=root.offsetHeight; }function onMove(y) {if (startY===undefined) return;var delta=startY - y;if (state.position==='top') delta=-delta;root.style.height=Math.max(120, Math.min(window.innerHeight * 0.85, startH + delta)) + 'px';}function onEnd() { startY=undefined; }handle.addEventListener('mousedown', function(e) { onStart(e.clientY); });document.addEventListener('mousemove', function(e) {if (startY !==undefined) { e.preventDefault(); onMove(e.clientY); }});document.addEventListener('mouseup', onEnd);handle.addEventListener('touchstart', function(e) {onStart(e.touches[0].clientY);}, { passive: true });document.addEventListener('touchmove', function(e) {if (startY !==undefined) onMove(e.touches[0].clientY);}, { passive: true });document.addEventListener('touchend', onEnd);}function buildUI() {var root=document.createElement('div');root.id='dc-root';root.className='dc-bottom';var resize=document.createElement('div');resize.id='dc-resize';root.appendChild(resize);var toolbar=document.createElement('div');toolbar.id='dc-toolbar';var filters=document.createElement('div');filters.id='dc-filters';toolbar.appendChild(filters);var actions=document.createElement('div');actions.id='dc-actions';toolbar.appendChild(actions);root.appendChild(toolbar);var output=document.createElement('div');output.id='dc-output';root.appendChild(output);var inputbar=document.createElement('div');inputbar.id='dc-inputbar';var upBtn=document.createElement('button');upBtn.className='dc-btn';upBtn.id='dc-up';upBtn.textContent='\u2191';inputbar.appendChild(upBtn);var input=document.createElement('input');input.id='dc-input';input.placeholder='Type JavaScript...';input.autocomplete='off';input.setAttribute('autocorrect', 'off');input.setAttribute('autocapitalize', 'off');input.spellcheck=false;inputbar.appendChild(input);var downBtn=document.createElement('button');downBtn.className='dc-btn';downBtn.id='dc-down';downBtn.textContent='\u2193';inputbar.appendChild(downBtn);var runBtn=document.createElement('button');runBtn.className='dc-btn';runBtn.id='dc-run';runBtn.textContent='\u25B6';inputbar.appendChild(runBtn);root.appendChild(inputbar);document.body.appendChild(root);var showBtn=document.createElement('button');showBtn.id='dc-show';showBtn.textContent='\u2699 Console';showBtn.addEventListener('click', showConsole);document.body.appendChild(showBtn);return { root: root, filters: filters, actions: actions, input: input,upBtn: upBtn, downBtn: downBtn, runBtn: runBtn };}function init() {domReady=true;var ui=buildUI();[{ filter: 'all', label: 'ALL' },{ filter: 'log', label: 'LOG' },{ filter: 'warn', label: 'WARN' },{ filter: 'error', label: 'ERR' },{ filter: 'info', label: 'INFO' },{ filter: 'debug', label: 'DBG' }].forEach(function(def) {var btn=document.createElement('button');btn.className='dc-btn' + (def.filter==='all' ? ' dc-active' : '');btn.setAttribute('data-filter', def.filter);btn.setAttribute('data-label', def.label);btn.textContent=def.label;btn.addEventListener('click', function() {state.filter=def.filter;ui.filters.querySelectorAll('.dc-btn').forEach(function(b) {b.classList.toggle('dc-active', b.getAttribute('data-filter')===state.filter);});applyFilter();});ui.filters.appendChild(btn);});[{ label: 'HIDE', fn: function() { hideConsole(); } },{ label: 'CLEAR', fn: function() { console.clear(); } },{ label: 'COPY', fn: function(b) { copyOutput(b); } },{ label: 'TOGGLE', fn: function() { togglePosition(); } }].forEach(function(def) {var btn=document.createElement('button');btn.className='dc-btn';btn.textContent=def.label;btn.addEventListener('click', function() { def.fn(btn); });ui.actions.appendChild(btn);});ui.input.addEventListener('keydown', function(e) {if (e.key==='Enter') { runCommand(ui.input.value); ui.input.value=''; }else if (e.key==='ArrowUp') { e.preventDefault(); navigateHistory(1); }else if (e.key==='ArrowDown') { e.preventDefault(); navigateHistory(-1); }});ui.runBtn.addEventListener('click', function() { runCommand(ui.input.value); ui.input.value=''; });ui.upBtn.addEventListener('click', function() { navigateHistory(1); ui.input.focus(); });ui.downBtn.addEventListener('click', function() { navigateHistory(-1); ui.input.focus(); });setupResize();buffer.forEach(renderEntry);buffer=[];updateFilterCounts();updateBadge();ui.root.style.display='none';}if (document.readyState==='loading') {document.addEventListener('DOMContentLoaded', init);} else {init();}})();
              `;

      const dcScript = '<script>' + debugConsoleCode + '<\/script>' + '<script src="https://cdn.jsdelivr.net/npm/eruda"><\/script> <script>eruda.init()<\/script>';

      const modifiedContent = editorContent.replace(
        /<body([^>]*)>/i,
        '<body$1>' + dcScript
      );
      const newTab = window.open('about:blank', '_blank');
      newTab.document.open();
      newTab.document.write(modifiedContent);
      newTab.document.close();
      toast('Code previewed in debug mode', 'success');
    }

    function saveState() {
      const currentContent = state.files[state.currentFile];
      const undoStack = state.undoStack[state.currentFile];
      if (undoStack[undoStack.length - 1] !== currentContent) {
        undoStack.push(currentContent);
        // Cap undo stack — prevents unbounded memory growth on long sessions
        if (undoStack.length > UNDO_MAX) undoStack.splice(0, undoStack.length - UNDO_MAX);
        state.redoStack[state.currentFile] = [];
      }
    }

    function undo() {
      const undoStack = state.undoStack[state.currentFile];
      if (undoStack.length > 1) {
        state.redoStack[state.currentFile].push(undoStack.pop());
        state.files[state.currentFile] = undoStack[undoStack.length - 1];
        editor.textContent = state.files[state.currentFile];
        updateAll();
      }
    }

    function redo() {
      if (state.redoStack[state.currentFile].length > 0) {
        state.files[state.currentFile] = state.redoStack[state.currentFile].pop();
        state.undoStack[state.currentFile].push(state.files[state.currentFile]);
        editor.textContent = state.files[state.currentFile];
        updateAll();
      }
    }

    const _selfClosingTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
      'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    function isSelfClosing(tag) {
      return _selfClosingTags.has(tag);
    }

    let currentColor = {
      h: 100,
      s: 100,
      l: 50
    };
    let currentMode = 0; // 0=Hue, 1=Saturation, 2=Lightness

    function hslToHex(h, s, l) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    function hexToHSL(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h *= 60;
      }

      return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    }

    const _colorParseEl = (() => {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el), {
        once: true
      });
      return el;
    })();

    function parseColorString(str) {
      const s = str.trim().toLowerCase();
      if (!_colorParseEl.parentNode) document.body.appendChild(_colorParseEl);
      _colorParseEl.style.color = s;
      const computed = getComputedStyle(_colorParseEl).color;

      // computed will be something like "rgb(20, 81, 100)" or "rgba(255, 255, 255, 0)"
      const rgbaMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!rgbaMatch) return null;

      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

      // Convert RGB to HSL
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const delta = max - min;
      let h = 0,
        sVal = 0,
        l = (max + min) / 2;

      if (delta !== 0) {
        sVal = delta / (1 - Math.abs(2 * l - 1));
        switch (max) {
          case r / 255:
            h = ((g - b) / 255) / delta % 6;
            break;
          case g / 255:
            h = ((b - r) / 255) / delta + 2;
            break;
          case b / 255:
            h = ((r - g) / 255) / delta + 4;
            break;
        }
        h *= 60;
        if (h < 0) h += 360;
      }

      return {
        h: Math.round(h),
        s: Math.round(sVal * 100),
        l: Math.round(l * 100),
        a
      };
    }

    function updateColorFromSelection() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const text = selection.toString().trim();
      if (!text) return;

      const newColor = parseColorString(text);
      if (newColor) {
        currentColor = newColor;
        updateMediaSession();
      }
    }

    // Attach listener to detect selection changes
    document.addEventListener('selectionchange', () => {
      const editor = document.getElementById('editor');
      if (editor && editor.contains(window.getSelection().anchorNode)) {
        updateColorFromSelection();
      }
    });

    function generateColorIcon(hexColor) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = hexColor;
      ctx.beginPath();
      ctx.arc(256, 256, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.stroke();
      return canvas.toDataURL();
    }

    function updateMediaSession() {
      if (!('mediaSession' in navigator)) return;

      const hexColor = hslToHex(currentColor.h, currentColor.s, currentColor.l);
      const modePointers = ['◀ HUE', '◀ SAT', '◀ LIGHT'];
      const artistText = `${modePointers[currentMode]} | H:${currentColor.h}° S:${currentColor.s}% L:${currentColor.l}%`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: hexColor,
        artist: artistText,
        album: 'Color Picker',
        artwork: [{
          src: generateColorIcon(hexColor),
          sizes: '512x512',
          type: 'image/png'
        }]
      });

      navigator.mediaSession.playbackState = 'playing';

      let sliderValue = currentMode === 0 ? (currentColor.h / 360) * 100 :
        currentMode === 1 ? currentColor.s : currentColor.l;

      try {
        navigator.mediaSession.setPositionState({
          duration: 100,
          playbackRate: 1,
          position: sliderValue
        });
      } catch (e) {}

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Insert color:', hexColor);
        if (editor) {
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(hexColor);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          editor.focus();
          updateAll();
        } else {
          console.log('Editor element with id="editor" not found');
        }
      });

      navigator.mediaSession.setActionHandler('play', () => {
        updateMediaSession();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        currentMode = (currentMode + 1) % 3;
        updateMediaSession();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        currentColor.h = (currentColor.h + 180) % 360;
        updateMediaSession();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          const sliderPos = Math.max(0, Math.min(100, details.seekTime));
          if (currentMode === 0) currentColor.h = Math.round((sliderPos / 100) * 360);
          else if (currentMode === 1) currentColor.s = Math.round(sliderPos);
          else currentColor.l = Math.round(sliderPos);
          updateMediaSession();
        }
      });
    }

    function startColorPicker() {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.loop = true;
      audio.volume = 0.01;
      audio.play().then(() => updateMediaSession());
    }

    // ── GitHub Pages Deploy ───────────────────────────────────────
    let ghDeployedUrl = '';

    function openGhDeploy() {
      const modal = document.getElementById('ghDeployModal');
      modal.style.display = 'flex';
      // Restore saved token — prefer the one from Settings, fall back to deploy modal's own saved copy
      const savedToken = cfgGet('githubCdnToken', '') || cfgGet('gh_token', '');
      const savedRepo = cfgGet('gh_repo', '');
      document.getElementById('gh-token').value = savedToken;
      document.getElementById('gh-repo').value = savedRepo;
      if (!document.getElementById('gh-commit-msg').value) {
        document.getElementById('gh-commit-msg').value = 'Deploy from Mobile Editor';
      }
      // Pre-fill repo name from current filename
      if (!savedRepo && state.currentFile) {
        const base = state.currentFile.replace(/\.(html|htm)$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        document.getElementById('gh-repo').value = base;
      }
      document.getElementById('gh-log').style.display = 'none';
      document.getElementById('gh-log').innerHTML = '';
      document.getElementById('gh-result').style.display = 'none';
      ghDeployedUrl = '';
      if (overflowMenu.classList.contains('open')) {
        overflowMenu.classList.remove('open');
      }
    }

    function closeGhDeploy() {
      document.getElementById('ghDeployModal').style.display = 'none';
    }

    function ghToggleToken() {
      const inp = document.getElementById('gh-token');
      const icon = document.getElementById('gh-eye-icon');
      if (inp.type === 'password') {
        inp.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        inp.type = 'password';
        icon.className = 'fas fa-eye';
      }
    }

    function ghLog(msg, type) {
      const log = document.getElementById('gh-log');
      log.style.display = 'block';
      const icons = {
        ok: '✓',
        err: '✗',
        info: '·',
        wait: '⟳'
      };
      const line = document.createElement('div');
      line.className = 'gh-log-line ' + (type || 'info');
      line.innerHTML = `<span>${icons[type] || '·'}</span><span>${msg}</span>`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }

    function ghSetBusy(busy) {
      const btn = document.getElementById('gh-deploy-btn');
      const spinner = document.getElementById('gh-spinner');
      btn.disabled = busy;
      spinner.classList.toggle('active', busy);
    }

    function ghGetContent() {
      // Save current editor state first
      state.files[state.currentFile] = editor.innerText;
      // If current file is HTML with linked assets, combine them
      const ext = (state.currentFile || '').split('.').pop().toLowerCase();
      if (ext === 'html' || ext === 'htm') {
        return buildCombinedDocument(state.currentFile);
      }
      // If we're in a linked CSS/JS file, find and combine the parent HTML
      const parent = getLinkedHtmlFile(state.currentFile);
      if (parent) return buildCombinedDocument(parent);
      return state.files[state.currentFile] || '';
    }

    async function ghApi(path, method, body, token) {
      const res = await fetch('https://api.github.com' + path, {
        method: method || 'GET',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
      return data;
    }

    async function ghDeploy() {
      const token = document.getElementById('gh-token').value.trim();
      const repo = document.getElementById('gh-repo').value.trim().toLowerCase().replace(/\s+/g, '-');
      const commitMsg = document.getElementById('gh-commit-msg').value.trim() || 'Deploy from Mobile Editor';

      if (!token) {
        toast('Enter your GitHub token', 'warning');
        return;
      }
      if (!repo) {
        toast('Enter a repository name', 'warning');
        return;
      }

      // Save prefs
      Object.assign(_cfg, {
        gh_token: token,
        gh_repo: repo
      });
      cfgSave();

      document.getElementById('gh-log').innerHTML = '';
      document.getElementById('gh-result').style.display = 'none';
      ghDeployedUrl = '';
      ghSetBusy(true);

      try {
        // 1. Get user info
        ghLog('Authenticating…', 'wait');
        const user = await ghApi('/user', 'GET', null, token);
        const owner = user.login;
        ghLog(`Authenticated as <b>${owner}</b>`, 'ok');

        // 2. Check / create repo
        ghLog(`Checking repository <b>${owner}/${repo}</b>…`, 'wait');
        let repoData;
        try {
          repoData = await ghApi(`/repos/${owner}/${repo}`, 'GET', null, token);
          ghLog('Repository already exists', 'ok');
        } catch (e) {
          if (e.message === 'Not Found') {
            ghLog('Repository not found — creating…', 'wait');
            repoData = await ghApi('/user/repos', 'POST', {
              name: repo,
              private: false,
              auto_init: true,
              description: 'Deployed with Mobile Editor'
            }, token);
            ghLog(`Created repository <b>${repo}</b>`, 'ok');
            // Give GitHub a moment to init the default branch
            await new Promise(r => setTimeout(r, 1500));
          } else {
            throw e;
          }
        }

        // 3. Get the default branch
        const branch = repoData.default_branch || 'main';

        // 4. Build the content to upload
        ghLog('Preparing file content…', 'wait');
        const content = ghGetContent();
        const contentB64 = btoa(unescape(encodeURIComponent(content)));
        const fileName = 'index.html';

        // 5. Check if index.html already exists (need SHA to update)
        let fileSha = null;
        try {
          const existing = await ghApi(`/repos/${owner}/${repo}/contents/${fileName}`, 'GET', null, token);
          fileSha = existing.sha;
          ghLog('Existing file found — updating…', 'wait');
        } catch (e) {
          ghLog('Uploading new file…', 'wait');
        }

        // 6. Upload the file
        const putBody = {
          message: commitMsg,
          content: contentB64,
          branch
        };
        if (fileSha) putBody.sha = fileSha;
        await ghApi(`/repos/${owner}/${repo}/contents/${fileName}`, 'PUT', putBody, token);
        ghLog('File uploaded successfully', 'ok');

        // 7. Enable / verify GitHub Pages
        ghLog('Configuring GitHub Pages…', 'wait');
        try {
          await ghApi(`/repos/${owner}/${repo}/pages`, 'POST', {
            source: {
              branch,
              path: '/'
            }
          }, token);
          ghLog('GitHub Pages enabled', 'ok');
        } catch (e) {
          // 409 = Pages already enabled — that's fine
          if (e.message && e.message.includes('already enabled')) {
            ghLog('GitHub Pages already enabled', 'ok');
          } else {
            ghLog('Pages already configured (or needs manual enable in repo settings)', 'info');
          }
        }

        // 8. Show result
        const pagesUrl = `https://${owner}.github.io/${repo}/`;
        ghDeployedUrl = pagesUrl;
        document.getElementById('gh-pages-url').textContent = pagesUrl;
        document.getElementById('gh-result').style.display = 'block';
        ghLog('Deploy complete!', 'ok');
        toast('Deployed to GitHub Pages!', 'success');

      } catch (err) {
        ghLog('Error: ' + err.message, 'err');
        toast('Deploy failed: ' + err.message, 'error');
      } finally {
        ghSetBusy(false);
      }
    }

    function ghCopyUrl() {
      if (ghDeployedUrl) copyToClipboard(ghDeployedUrl, 'URL copied!');
    }

    function ghOpenUrl() {
      if (ghDeployedUrl) window.open(ghDeployedUrl, '_blank');
    }

    function ghCreateMirror() {
      if (!ghDeployedUrl) return;
      const url = ghDeployedUrl;
      const mirrorName = 'mirror-' + (state.currentFile || 'page.html').replace(/\.html?$/i, '') + '.html';

      const mirrorHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mirror</title>
  </head>
  <body>
  <script>
    const TARGET = '${url}';
    const PROXY  = 'https://api.allorigins.win/get?url=';


    async function load() {
      // Try direct fetch first
      try {
        const res = await fetch(TARGET, { cache: 'no-store' });
        if (res.ok) { render(await res.text()); return; }
      } catch(e) { /* CORS blocked, try proxy */ }


      // Fall back to allorigins proxy
      try {
        const res = await fetch(PROXY + encodeURIComponent(TARGET) + '&t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data.contents) { render(data.contents); return; }
        }
      } catch(e) { /* proxy also failed */ }


      document.body.innerHTML = '<p style="font-family:sans-serif;color:#c00;padding:20px">Could not fetch ' + TARGET + '</p>';
    }


    function render(html) {
      document.open();
      document.write(html);
      document.close();
    }


    load();
  <\/script>
  </body>
  </html>`;

      state.files[mirrorName] = mirrorHtml;
      state.undoStack[mirrorName] = [mirrorHtml];
      state.redoStack[mirrorName] = [];
      updateFileTree();
      copyFromFile(mirrorName);
      closeGhDeploy();
      toast(`Mirror created as "${mirrorName}"`, 'success');
    }

    // ── Color Converter ───────────────────────────────────────────
    function colorHexToRgb(hex) {
      hex = hex.replace(/^#/, '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length !== 6) return null;
      const n = parseInt(hex, 16);
      if (isNaN(n)) return null;
      return {
        r: (n >> 16) & 255,
        g: (n >> 8) & 255,
        b: n & 255
      };
    }

    function colorRgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          default:
            h = ((r - g) / d + 4) / 6;
        }
      }
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    }

    function colorHslToRgb(h, s, l) {
      s /= 100;
      l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return {
        r: Math.round(f(0) * 255),
        g: Math.round(f(8) * 255),
        b: Math.round(f(4) * 255)
      };
    }

    function colorUpdateUI(r, g, b) {
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      const {
        h,
        s,
        l
      } = colorRgbToHsl(r, g, b);
      document.getElementById('color-hex').value = hex;
      document.getElementById('color-rgb').value = `rgb(${r}, ${g}, ${b})`;
      document.getElementById('color-hsl').value = `hsl(${h}, ${s}%, ${l}%)`;
      document.getElementById('color-swatch').style.background = hex;
      document.getElementById('color-native').value = hex;
    }

    function colorFromNative(hex) {
      const rgb = colorHexToRgb(hex);
      if (rgb) colorUpdateUI(rgb.r, rgb.g, rgb.b);
    }

    function colorFromManual(val) {
      val = val.trim();
      // HEX
      if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) {
        const rgb = colorHexToRgb(val.startsWith('#') ? val : '#' + val);
        if (rgb) {
          colorUpdateUI(rgb.r, rgb.g, rgb.b);
          return;
        }
      }
      // RGB
      const rgbM = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (rgbM) {
        colorUpdateUI(+rgbM[1], +rgbM[2], +rgbM[3]);
        return;
      }
      // HSL
      const hslM = val.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
      if (hslM) {
        const {
          r,
          g,
          b
        } = colorHslToRgb(+hslM[1], +hslM[2], +hslM[3]);
        colorUpdateUI(r, g, b);
      }
    }

    function colorGetValue(fmt) {
      return document.getElementById('color-' + fmt).value;
    }

    function colorCopy(fmt) {
      const v = colorGetValue(fmt);
      if (v) copyToClipboard(v);
    }

    function colorInsert(fmt) {
      const v = colorGetValue(fmt);
      if (v) {
        insertAtCursor(v);
        closeToolsModal();
        toast('Inserted at cursor', 'success');
      }
    }

    // ── JSON Formatter ────────────────────────────────────────────
    function jsonSetError(msg) {
      document.getElementById('json-error').textContent = msg || '';
    }

    function jsonGetInput() {
      return document.getElementById('json-input').value.trim();
    }

    function jsonSetOutput(val) {
      document.getElementById('json-output').value = val;
    }

    function jsonFormat() {
      const raw = jsonGetInput();
      if (!raw) {
        jsonSetError('Nothing to format');
        return;
      }
      try {
        jsonSetOutput(JSON.stringify(JSON.parse(raw), null, 2));
        jsonSetError('');
        toast('Formatted!', 'success');
      } catch (e) {
        jsonSetError('⚠ ' + e.message);
        jsonSetOutput('');
      }
    }

    function jsonMinify() {
      const raw = jsonGetInput();
      if (!raw) {
        jsonSetError('Nothing to minify');
        return;
      }
      try {
        jsonSetOutput(JSON.stringify(JSON.parse(raw)));
        jsonSetError('');
        toast('Minified!', 'success');
      } catch (e) {
        jsonSetError('⚠ ' + e.message);
        jsonSetOutput('');
      }
    }

    function jsonValidate() {
      const raw = jsonGetInput();
      if (!raw) {
        jsonSetError('Nothing to validate');
        return;
      }
      try {
        JSON.parse(raw);
        jsonSetError('');
        toast('Valid JSON ✓', 'success');
      } catch (e) {
        jsonSetError('⚠ ' + e.message);
      }
    }

    function jsonClear() {
      document.getElementById('json-input').value = '';
      document.getElementById('json-output').value = '';
      jsonSetError('');
    }

    function jsonCopy() {
      const v = document.getElementById('json-output').value;
      if (!v) {
        toast('Nothing to copy', 'warning');
        return;
      }
      copyToClipboard(v);
    }

    function jsonInsert() {
      const v = document.getElementById('json-output').value;
      if (!v) {
        toast('Nothing to insert', 'warning');
        return;
      }
      insertAtCursor(v);
      closeToolsModal();
      toast('Inserted at cursor', 'success');
    }

    // ── Symbol Shortcut Bar ────────────────────────────────────────
    const SB_CHARS = [
      ['⇥', '\t'],
      ['{', '{'],
      ['}', '}'],
      ['[', '['],
      [']', ']'],
      ['(', '('],
      [')', ')'], null,
      ['<', '<'],
      ['>', '>'],
      ['/', '/'],
      ['\\', '\\'], null,
      [';', ';'],
      [':', ':'],
      ['=', '='],
      ['+', '+'],
      ['-', '-'],
      ['*', '*'], null,
      ['!', '!'],
      ['?', '?'],
      ['#', '#'],
      ['@', '@'],
      ['&', '&'],
      ['|', '|'],
      ['_', '_'], null,
      ["'", "'"],
      ['"', '"'],
      ['`', '`']
    ];

    let sbEnabled = false;
    let sbVisible = false;

    function sbInit() {
      const bar = document.getElementById('shortcut-bar');
      if (!bar) return;
      bar.innerHTML = '';
      SB_CHARS.forEach(item => {
        if (!item) {
          const s = document.createElement('span');
          s.className = 'sb-sep';
          bar.appendChild(s);
          return;
        }
        const [label, char] = item;
        const btn = document.createElement('button');
        btn.className = 'sb-btn';
        btn.textContent = label;
        btn.title = char === '\t' ? 'Tab' : char;
        btn.dataset.sbChar = char;
        btn.addEventListener('mousedown', e => {
          e.preventDefault();
          sbInsert(char);
        });
        bar.appendChild(btn);
      });

      // Touch handling on the container — passive start/move so scroll is never blocked,
      // then only act on touchend if the finger didn't travel (i.e. it was a tap, not a scroll).
      let sbTouchX = 0,
        sbTouchY = 0,
        sbMoved = false;
      bar.addEventListener('touchstart', e => {
        sbTouchX = e.touches[0].clientX;
        sbTouchY = e.touches[0].clientY;
        sbMoved = false;
      }, {
        passive: true
      });
      bar.addEventListener('touchmove', e => {
        if (Math.abs(e.touches[0].clientX - sbTouchX) > 6 ||
          Math.abs(e.touches[0].clientY - sbTouchY) > 6) sbMoved = true;
      }, {
        passive: true
      });
      bar.addEventListener('touchend', e => {
        if (sbMoved) return;
        const target = e.target.closest('.sb-btn');
        if (!target) return;
        e.preventDefault(); // block synthetic mousedown/click — prevents double-insert
        sbInsert(target.dataset.sbChar);
      }, {
        passive: false
      });
    }

    let sbLastInsertAt = 0;

    function sbInsert(char) {
      const now = Date.now();
      if (now - sbLastInsertAt < 150) return;
      sbLastInsertAt = now;
      insertAtCursor(char);
    }

    function sbPosition() {
      const bar = document.getElementById('shortcut-bar');
      if (!bar || !sbVisible) return;
      const vv = window.visualViewport;
      if (!vv) return;
      bar.style.top = Math.round(vv.offsetTop + vv.height - bar.offsetHeight) + 'px';
      bar.style.left = vv.offsetLeft + 'px';
      bar.style.width = vv.width + 'px';
      bar.style.bottom = 'auto';
    }

    function sbShow() {
      if (!sbEnabled) return;
      const bar = document.getElementById('shortcut-bar');
      if (!bar) return;
      sbVisible = true;
      bar.style.display = 'flex';
      sbPosition();
    }

    function sbHide() {
      const bar = document.getElementById('shortcut-bar');
      if (!bar) return;
      sbVisible = false;
      bar.style.display = 'none';
    }

    function sbApply() {
      sbEnabled = cfgGet('shortcutBar', 'false') === 'true';
      if (!sbEnabled) {
        sbHide();
        return;
      }
      sbInit();
      if (document.activeElement === editor) sbShow();
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', sbPosition);
      window.visualViewport.addEventListener('scroll', sbPosition);
    }

    editor.addEventListener('focus', sbShow);
    editor.addEventListener('blur', sbHide);

    init();

  

    let ai = {
      model: '@cf/qwen/qwen2.5-coder-32b-instruct',
      temperature: 1,
      maxTokens: null,
      topP: 1,
      topK: 40,
      repetitionPenalty: 1.1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      seed: null,
      responseFormat: 'text',
      streamResponse: false,
      systemPrompt: null,
      baseApiUrl: '<cloudflare cors proxy>https://api.cloudflare.com/client/v4/accounts/<cloudflare account id>/ai/run',
      apiKey: '<cloudflare workers api key>',
      message: null,
      response: null
    };

    async function askAi(systemPrompt, message, maxTokenOutput = 10, debug = false) {
      if (debug) console.log('askAi called with:', {
        systemPrompt,
        message,
        maxTokenOutput,
        debug
      });
      if (!message || !systemPrompt) {
        console.error('AI Error: required argument(s) missing');
        return 'Here we go again';
      }
      ai.systemPrompt = systemPrompt;
      ai.message = message;
      ai.maxTokens = maxTokenOutput;
      try {
        const result = await callCloudflareAPI(false, debug);
        return result;
      } catch (error) {
        console.error('askAi error:', error);
        return 'Here we go again';
      }
    }

    async function callCloudflareAPI(stream = false, debug = false) {
      if (debug) console.log('callCloudflareAPI called with stream:', stream);
      if (!ai.systemPrompt || !ai.message || !ai.maxTokens) {
        console.error('Missing required AI parameters');
        return 'Here we go again';
      }
      const apiUrl = ai.baseApiUrl + ai.model;
      const messages = [{
          role: "system",
          content: ai.systemPrompt
        },
        {
          role: "user",
          content: ai.message
        }
      ];
      const requestBody = {
        messages: messages,
        max_tokens: ai.maxTokens,
        temperature: ai.temperature,
        stream: stream,
        raw: false
      };
      if (debug) {
        console.log('API URL:', apiUrl);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
      }
      try {
        if (debug) console.log('Sending request...');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ai.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (debug) {
          console.log('Full API response:');
          console.log(JSON.stringify(data, null, 2));
        }
        if (data.result && data.result.response) {
          ai.response = data.result.response;
          return data.result.response;
        } else if (typeof data.result === 'string') {
          ai.response = data.result;
          return data.result;
        } else {
          throw new Error('Unexpected response format from API');
        }
      } catch (error) {
        console.error('API Error:', error.message);
        ai.response = null;
        return 'Here we go again';
      }
    }

    async function askAiAdvanced(options = {}) {
      const {
        systemPrompt,
        message,
        maxTokens = 10,
        temperature = 1,
        model = '@cf/qwen/qwen2.5-coder-32b-instruct',
        stream = false,
        debug = false
      } = options;
      if (!systemPrompt || !message) {
        console.error('askAiAdvanced: systemPrompt and message are required');
        return 'Here we go again';
      }
      const originalSettings = {
        systemPrompt: ai.systemPrompt,
        message: ai.message,
        maxTokens: ai.maxTokens,
        temperature: ai.temperature,
        model: ai.model
      };
      ai.systemPrompt = systemPrompt;
      ai.message = message;
      ai.maxTokens = maxTokens;
      ai.temperature = temperature;
      ai.model = model;
      try {
        const result = await callCloudflareAPI(stream, debug);
        return result;
      } catch (error) {
        console.error('askAiAdvanced error:', error);
        return 'Here we go again';
      } finally {
        Object.assign(ai, originalSettings);
      }
    }

    function getAiStatus() {
      return {
        hasApiKey: !!ai.apiKey,
        model: ai.model,
        lastResponse: ai.response,
        ready: !!(ai.apiKey && ai.baseApiUrl)
      };
    }

  

    // ── Chatbot ──────────────────────────────────────────────────────
    const chatPanel = document.getElementById('chatbot-panel');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    // Configure marked with a custom renderer for code blocks
    (function setupMarked() {
      if (typeof marked === 'undefined') return;
      const renderer = new marked.Renderer();
      let _blockCodeId = 0;

      renderer.code = function(code, lang) {
        const id = 'chat-code-' + (++_blockCodeId);
        let highlighted = escapeHtml(typeof code === 'object' ? code.text : code);
        const rawLang = (typeof code === 'object' ? code.lang : lang) || '';
        const cleanLang = rawLang.split(/[^a-z0-9]/i)[0].toLowerCase();
        const rawCode = typeof code === 'object' ? code.text : code;
        if (typeof Prism !== 'undefined' && Prism.languages[cleanLang]) {
          try {
            highlighted = Prism.highlight(rawCode, Prism.languages[cleanLang], cleanLang);
          } catch (e) {}
        }
        const lineCount = rawCode.split('\n').length;
        return `<div class="chat-code-wrap">
            <div class="chat-code-header">
              <span>${escapeHtml(cleanLang || 'code')}<span class="chat-code-linect"> · ${lineCount}L</span></span>
            </div>
            <pre id="${id}"><code class="language-${escapeHtml(cleanLang)}">${highlighted}</code></pre>
            <div class="chat-code-footer">
              <button class="chat-code-copy" onclick="chatInsertCode('${id}')"><i class="fas fa-arrow-right"></i> Insert</button>
              <button class="chat-code-copy" onclick="chatCopyCode('${id}')"><i class="fas fa-copy"></i> Copy</button>
              <button class="chat-code-copy chat-code-replace" onclick="chatReplaceFile('${id}',this)"><i class="fas fa-file-import"></i> Replace</button>
            </div>
          </div>`;
      };

      renderer.codespan = function(code) {
        const text = typeof code === 'object' ? code.text : code;
        return `<code>${escapeHtml(text)}</code>`;
      };

      marked.use({
        renderer,
        gfm: true,
        breaks: true
      });
    })();

    function renderMarkdown(text) {
      if (typeof marked === 'undefined') return escapeHtml(text);
      try {
        return marked.parse(text);
      } catch (e) {
        return escapeHtml(text);
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function copyText(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    function chatCopyCode(id) {
      const pre = document.getElementById(id);
      if (!pre) return;
      copyText(pre.innerText);
      const btn = pre.closest('.chat-code-wrap').querySelector('.chat-code-copy');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.style.color = 'var(--accent)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.color = '';
      }, 1800);
    }

    function chatInsertCode(id) {
      const pre = document.getElementById(id);
      if (!pre) return;
      const text = pre.innerText;
      const editorEl = document.getElementById('editor');
      if (!editorEl) return;
      editorEl.focus();
      document.execCommand('insertText', false, text);
    }

    function chatReplaceFile(id, btn) {
      const pre = document.getElementById(id);
      if (!pre) return;
      const text = pre.innerText;
      agentWriteCode(text); // uses _pushUndoEntry so it's undoable
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Replaced!';
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 1800);
    }

    function chatExpandCode(id, btn) {
      const pre = document.getElementById(id);
      if (!pre) return;
      const expanded = pre.classList.toggle('expanded');
      btn.innerHTML = expanded ? '<i class="fas fa-compress-alt"></i>' : '<i class="fas fa-expand-alt"></i>';
      btn.title = expanded ? 'Collapse' : 'Expand';
    }

    function chatWrapCode(id, btn) {
      const pre = document.getElementById(id);
      if (!pre) return;
      const on = pre.classList.toggle('wrap-on');
      btn.style.color = on ? 'var(--accent)' : '';
    }

    function chatToggleCollapse(bodyId, btn) {
      const body = document.getElementById(bodyId);
      if (!body) return;
      const isCollapsed = body.classList.contains('collapsible');
      if (isCollapsed) {
        body.classList.remove('collapsible');
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> Show less';
      } else {
        body.classList.add('collapsible');
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> Show more';
      }
    }

    function chatToggleMeta(el) {
      const full = el.dataset.full === '1';
      el.dataset.full = full ? '0' : '1';
      const elapsed = el.dataset.elapsed;
      const time = el.dataset.time;
      el.textContent = full ? (elapsed || time) : time;
    }

    function chatCopyLog(wrapper, btn) {
      const steps = wrapper.querySelectorAll('.chat-agent-step');
      const lines = [...steps].map(s => {
        const icon = s.querySelector('.chat-agent-step-icon')?.textContent.trim() || '';
        const label = [...s.querySelectorAll('span')].filter(n => !n.classList.contains('chat-agent-step-icon') && !n.classList.contains('chat-agent-step-time')).map(n => n.textContent.trim()).join('');
        const time = s.querySelector('.chat-agent-step-time')?.textContent.trim() || '';
        return `${icon} ${label}${time ? '  ' + time : ''}`.trim();
      });
      copyText(lines.join('\n'));
      if (btn) {
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1500);
      }
    }

    // ── API configuration helpers ─────────────────────────────────────
    function isApiConfigured() {
      const base = document.getElementById('chat-base-url')?.value?.trim() || ai.baseApiUrl;
      const key = document.getElementById('chat-api-key')?.value?.trim() || ai.apiKey;
      return !!(base && key);
    }

    function chatShowSetupPrompt() {
      chatMessages.innerHTML = `
          <div class="chat-msg chat-msg-ai">
            <div class="chat-bubble chat-bubble-ai chat-md" style="border-color:var(--accent)55;">
              <div style="color:var(--accent);font-weight:bold;font-size:14px;margin-bottom:8px;">👋 Set up your AI API first</div>
              <p style="margin:0 0 8px;">No API credentials found. The settings panel above is already open — enter your <strong>Base URL</strong> and <strong>API Key</strong> there to get started.</p>
              <p style="margin:0 0 6px;font-size:12px;color:var(--text-secondary);">Free options:</p>
              <ul style="margin:0 0 8px 16px;padding:0;font-size:12px;color:var(--text-secondary);">
                <li><strong style="color:var(--text-primary);">Cloudflare Workers AI</strong> — free daily quota, requires a Workers account</li>
                <li><strong style="color:var(--text-primary);">Any OpenAI-compatible endpoint</strong> — use your own base URL</li>
              </ul>
              <p style="margin:0;font-size:12px;color:var(--text-secondary);">Once saved, just send a message and you're good to go.</p>
            </div>
          </div>`;
    }

    function chatShowConfiguredPrompt() {
      chatMessages.innerHTML = `
          <div class="chat-msg chat-msg-ai">
            <div class="chat-bubble chat-bubble-ai">✅ API configured! Ask me anything about your code.</div>
          </div>`;
    }

    function openChatbot() {
      chatPanel.style.display = 'flex';
      const om = document.getElementById('overflow-menu');
      if (om) om.classList.remove('open');

      if (!isApiConfigured()) {
        // Auto-open settings and show setup prompt
        const adv = document.getElementById('chat-advanced');
        const btn = document.getElementById('chat-adv-toggle-btn');
        if (adv && adv.style.display !== 'block') {
          adv.style.display = 'block';
          btn?.classList.add('active');
        }
        // Only show setup prompt on fresh chat (1 message or fewer)
        if (chatMessages.children.length <= 1) {
          chatShowSetupPrompt();
        }
      } else {
        chatInput.focus();
      }
    }

    function closeChatbot() {
      chatPanel.style.display = 'none';
    }

    function toggleChatAdvanced() {
      const adv = document.getElementById('chat-advanced');
      const btn = document.getElementById('chat-adv-toggle-btn');
      const open = adv.style.display === 'block';
      adv.style.display = open ? 'none' : 'block';
      btn.classList.toggle('active', !open);
    }

    function clearChatHistory() {
      chatHistoryClear();
    }

    function clearChat() {
      chatHistoryClear();
      chatMessages.innerHTML = `
          <div class="chat-msg chat-msg-ai">
            <div class="chat-bubble chat-bubble-ai chat-md">Chat cleared. How can I help?</div>
          </div>`;
    }

    // Snapshots: one entry per user message — shallow copy of all files at send time
    const _chatSnapshots = [];

    function chatAppendUser(text) {
      const snapIdx = _chatSnapshots.length;
      _chatSnapshots.push(Object.assign({}, state.files)); // shallow copy — strings are immutable

      const div = document.createElement('div');
      div.className = 'chat-msg chat-msg-user';
      div.innerHTML = `
          <div class="chat-bubble chat-bubble-user"
               onclick="chatToggleUserActions(this)"
               data-text="${encodeURIComponent(text)}"
               data-snap="${snapIdx}">${escapeHtml(text)}</div>
          <div class="chat-user-actions" id="chat-ua-${snapIdx}">
            <button class="chat-ua-btn" onclick="chatCopyUserMsg(${snapIdx})">
              <i class="fas fa-copy"></i> Copy
            </button>
            <button class="chat-ua-btn" onclick="chatEditUserMsg(${snapIdx})">
              <i class="fas fa-pencil-alt"></i> Edit
            </button>
            <button class="chat-ua-btn" onclick="chatRegenerateMsg(${snapIdx})">
              <i class="fas fa-redo"></i> Regenerate
            </button>
            <button class="chat-ua-btn chat-ua-revert" onclick="chatRevertSnap(${snapIdx})">
              <i class="fas fa-undo"></i> Revert files
            </button>
          </div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function chatToggleUserActions(bubble) {
      const snapIdx = bubble.dataset.snap;
      const ua = document.getElementById('chat-ua-' + snapIdx);
      if (!ua) return;
      const isOpen = ua.classList.contains('open');
      // Close any other open action bars
      document.querySelectorAll('.chat-user-actions.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) ua.classList.add('open');
    }

    function chatCopyUserMsg(snapIdx) {
      const ua = document.getElementById('chat-ua-' + snapIdx);
      const bubble = ua ? ua.previousElementSibling : null;
      if (!bubble) return;
      copyText(decodeURIComponent(bubble.dataset.text));
      const btn = ua.querySelector('.chat-ua-btn');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 1600);
    }

    function chatEditUserMsg(snapIdx) {
      const ua = document.getElementById('chat-ua-' + snapIdx);
      const bubble = ua ? ua.previousElementSibling : null;
      if (!bubble) return;
      chatInput.value = decodeURIComponent(bubble.dataset.text);
      chatInput.focus();
      chatInput.style.height = 'auto';
      chatInput.style.height = chatInput.scrollHeight + 'px';
      ua.classList.remove('open');
    }

    function chatRegenerateMsg(snapIdx) {
      const ua = document.getElementById('chat-ua-' + snapIdx);
      const bubble = ua ? ua.previousElementSibling : null;
      if (!bubble) return;
      chatInput.value = decodeURIComponent(bubble.dataset.text);
      ua.classList.remove('open');
      chatSend();
    }

    function chatRevertSnap(snapIdx) {
      const snap = _chatSnapshots[snapIdx];
      if (!snap) return;
      for (const [fname, content] of Object.entries(snap)) {
        if (state.files[fname] !== undefined && state.files[fname] !== content) {
          _pushUndoEntry(fname, state.files[fname], content);
          state.files[fname] = content;
        }
      }
      const ed = document.getElementById('editor');
      if (ed && snap[state.currentFile] !== undefined) {
        ed.textContent = snap[state.currentFile];
        updateAll();
      }
      const ua = document.getElementById('chat-ua-' + snapIdx);
      if (ua) ua.classList.remove('open');
      if (typeof toast === 'function') toast('Files reverted to before this message', 'success');
    }

    function chatAppendTyping() {
      const div = document.createElement('div');
      div.className = 'chat-msg chat-msg-ai';
      div.id = 'chat-typing-indicator';
      div.dataset.start = Date.now();
      div.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function chatAppendAi(text) {
      const typing = document.getElementById('chat-typing-indicator');
      const elapsedMs = typing ? Date.now() - (parseInt(typing.dataset.start) || Date.now()) : null;
      const elapsedStr = elapsedMs != null ? (elapsedMs / 1000).toFixed(1) + 's' : null;
      if (typing) typing.remove();

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      const isLong = text.length > 500;
      const bodyId = 'chat-ai-body-' + Date.now();

      const div = document.createElement('div');
      div.className = 'chat-msg chat-msg-ai';
      div.innerHTML = `
          <div class="chat-bubble chat-bubble-ai chat-md${isLong ? ' collapsible' : ''}" id="${bodyId}">${renderMarkdown(text)}</div>
          ${isLong ? `<button class="chat-collapse-btn" onclick="chatToggleCollapse('${bodyId}',this)"><i class="fas fa-chevron-down"></i> Show more</button>` : ''}
          <div class="chat-ai-meta"
               data-elapsed="${elapsedStr || ''}"
               data-time="${timeStr}"
               data-full="0"
               onclick="chatToggleMeta(this)">${elapsedStr || timeStr}</div>
          <div class="chat-action-row">
            <button class="chat-action-btn" onclick="chatInsertRaw(this)" data-text="${encodeURIComponent(text)}">
              <i class="fas fa-arrow-right"></i> Insert at cursor
            </button>
            <button class="chat-action-btn" onclick="chatCopyRaw(this)" data-text="${encodeURIComponent(text)}">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function chatInsertRaw(btn) {
      const text = decodeURIComponent(btn.getAttribute('data-text'));
      const editorEl = document.getElementById('editor');
      if (!editorEl) return;
      editorEl.focus();
      document.execCommand('insertText', false, text);
    }

    function chatCopyRaw(btn) {
      const text = decodeURIComponent(btn.getAttribute('data-text'));
      copyText(text);
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.style.color = 'var(--accent)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.color = '';
      }, 1800);
    }

    // ── Agent mode toggle ────────────────────────────────────────────
    function chatAgentModeToggle(cb) {
      const opts = document.getElementById('chat-agent-opts');
      if (opts) opts.style.display = cb.checked ? 'block' : 'none';
      chatUpdateBadge();
      saveChatSettings();
    }

    function chatUpdateBadge() {
      const badge = document.getElementById('chat-mode-badge');
      if (!badge) return;
      const agentOn = document.getElementById('chat-agent-mode')?.checked;
      const multiOn = document.getElementById('chat-agent-multi')?.checked;
      const ctxOn = document.getElementById('chat-include-code')?.checked;
      badge.className = '';
      if (agentOn && multiOn) {
        badge.className = 'multi';
        badge.innerHTML = 'Multi-agent';
      } else if (agentOn) {
        badge.className = 'agent';
        badge.innerHTML = 'Agent';
      } else if (ctxOn) {
        badge.className = 'ctx';
        badge.innerHTML = 'Include current file';
      }
    }

    document.getElementById('chat-include-code')?.addEventListener('change', chatUpdateBadge);
    document.getElementById('chat-agent-mode')?.addEventListener('change', chatUpdateBadge);
    document.getElementById('chat-agent-multi')?.addEventListener('change', chatUpdateBadge);

    // ── Settings persistence ──────────────────────────────────────────
    const CHAT_SETTINGS_KEY = 'mce_chat_settings_v2';
    const CON_SETTINGS_KEY = 'mce_con_settings_v1';

    function saveChatSettings() {
      const wasCfg = isApiConfigured();
      const ids = [
        'chat-base-url', 'chat-api-key', 'chat-model', 'chat-system-prompt',
        'chat-max-tokens', 'chat-temperature', 'chat-include-code', 'chat-agent-mode',
        'chat-agent-multi', 'chat-agent-thinker', 'chat-thinker-model', 'chat-agent-reviewer',
        'chat-agent-confirm', 'chat-agent-maxsteps', 'chat-agent-maxretries'
      ];
      const s = {};
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        s[id] = el.type === 'checkbox' ? el.checked : el.value;
      });
      try {
        localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(s));
      } catch (e) {}

      // Sync api config into ai object immediately
      const customBase = document.getElementById('chat-base-url')?.value?.trim();
      const customKey = document.getElementById('chat-api-key')?.value?.trim();
      if (customBase) ai.baseApiUrl = customBase;
      if (customKey) ai.apiKey = customKey;

      const nowCfg = isApiConfigured();
      if (nowCfg) {
        toast('Settings saved', 'success');
        // If we just became configured, update chat to ready state
        if (!wasCfg && chatMessages.children.length <= 1) {
          chatShowConfiguredPrompt();
          chatInput.focus();
          aiRateLimited = false;
          _rateLimitWarningShown = false;
        }
        chatUpdateApiStatus(true);
      } else {
        toast('Settings saved — add API credentials to use AI', 'info');
        chatUpdateApiStatus(false);
      }
    }

    function chatUpdateApiStatus(configured) {
      const indicator = document.getElementById('chat-api-status');
      if (!indicator) return;
      if (configured) {
        indicator.title = 'API configured';
        indicator.style.background = '#22c55e';
      } else {
        indicator.title = 'API not configured';
        indicator.style.background = '#f59e0b';
      }
    }

    function loadChatSettings() {
      let s = {};
      try {
        s = JSON.parse(localStorage.getItem(CHAT_SETTINGS_KEY) || '{}');
      } catch (e) {}
      const ids = [
        'chat-base-url', 'chat-api-key', 'chat-model', 'chat-system-prompt',
        'chat-max-tokens', 'chat-temperature', 'chat-include-code', 'chat-agent-mode',
        'chat-agent-multi', 'chat-agent-thinker', 'chat-thinker-model', 'chat-agent-reviewer',
        'chat-agent-confirm', 'chat-agent-maxsteps', 'chat-agent-maxretries'
      ];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !(id in s)) return;
        if (el.type === 'checkbox') el.checked = s[id];
        else el.value = s[id];
      });
      // Sync api config back to ai object
      const customBase = document.getElementById('chat-base-url')?.value?.trim();
      const customKey = document.getElementById('chat-api-key')?.value?.trim();
      if (customBase) ai.baseApiUrl = customBase;
      if (customKey) ai.apiKey = customKey;
      // Restore agent opts visibility
      const agentOn = document.getElementById('chat-agent-mode')?.checked;
      const opts = document.getElementById('chat-agent-opts');
      if (opts) opts.style.display = agentOn ? 'block' : 'none';
      chatUpdateBadge();
      // Reflect API status in the indicator
      chatUpdateApiStatus(isApiConfigured());
    }

    function saveConsoleSettings() {
      const s = {
        autorun: document.getElementById('con-autorun')?.checked || false,
        sbForms: document.getElementById('con-sb-forms')?.checked || false,
        sbPopups: document.getElementById('con-sb-popups')?.checked || false,
        sbModals: document.getElementById('con-sb-modals')?.checked || false,
        sbStorage: document.getElementById('con-sb-storage')?.checked || false
      };
      try {
        localStorage.setItem(CON_SETTINGS_KEY, JSON.stringify(s));
      } catch (e) {}
    }

    function loadConsoleSettings() {
      let s = {};
      try {
        s = JSON.parse(localStorage.getItem(CON_SETTINGS_KEY) || '{}');
      } catch (e) {}
      if ('autorun' in s) {
        const el = document.getElementById('con-autorun');
        if (el) el.checked = s.autorun;
      }
      if ('sbForms' in s) {
        const el = document.getElementById('con-sb-forms');
        if (el) el.checked = s.sbForms;
      }
      if ('sbPopups' in s) {
        const el = document.getElementById('con-sb-popups');
        if (el) el.checked = s.sbPopups;
      }
      if ('sbModals' in s) {
        const el = document.getElementById('con-sb-modals');
        if (el) el.checked = s.sbModals;
      }
      if ('sbStorage' in s) {
        const el = document.getElementById('con-sb-storage');
        if (el) el.checked = s.sbStorage;
      }
    }

    function conToggleSettings(e) {
      if (e) e.stopPropagation();
      const panel = document.getElementById('console-settings-panel');
      if (!panel) return;
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        // Close on click outside
        const closeOutside = ev => {
          if (!panel.contains(ev.target)) {
            panel.style.display = 'none';
            document.removeEventListener('click', closeOutside);
          }
        };
        setTimeout(() => document.addEventListener('click', closeOutside), 0);
      }
    }

    // Load all settings on init
    loadChatSettings();
    loadConsoleSettings();

    // ── Standalone API call (doesn't touch global ai state) ──────────
    async function callAIRaw(messages, maxTokens, temperature, model) {
      if (aiRateLimited) throw new Error('RATE_LIMITED');

      // Use custom API config from settings if provided
      const customBaseUrl = document.getElementById('chat-base-url')?.value?.trim();
      const customApiKey = document.getElementById('chat-api-key')?.value?.trim();
      const baseUrl = customBaseUrl || ai.baseApiUrl;
      const apiKey = customApiKey || ai.apiKey;

      const url = baseUrl + (model || ai.model);
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          max_tokens: maxTokens || 1024,
          temperature: temperature ?? 0.4,
          stream: false,
          raw: false
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        if (resp.status === 429 || t.includes('neurons') || t.includes('free allocation')) {
          aiRateLimited = true;
          const now = new Date();
          const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
          setTimeout(() => {
            aiRateLimited = false;
            _rateLimitWarningShown = false;
          }, Math.min(msUntilMidnight, 3600000));
          throw new Error('RATE_LIMITED');
        }
        throw new Error(`API ${resp.status}: ${t}`);
      }

      const data = await resp.json();
      if (data.result?.response) return data.result.response;
      if (typeof data.result === 'string') return data.result;
      throw new Error('Unexpected API response format');
    }
    // ── Editor tool functions ─────────────────────────────────────────
    function agentReadCode() {
      return state.files[state.currentFile] || document.getElementById('editor')?.innerText || '(empty)';
    }

    function agentReadFile(filename) {
      const content = state.files[filename];
      if (content === undefined) return `(file "${filename}" not found)`;
      return content;
    }

    function agentGetFiles() {
      const names = Object.keys(state.files);
      if (!names.length) return '(no files)';

      // Build a complete reverse lookup: which HTML file does each css/js belong to?
      const linkedToHtml = {};
      for (const [htmlFile, lk] of Object.entries(state.linkedFiles)) {
        for (const f of (lk.css || [])) linkedToHtml[f] = htmlFile;
        for (const f of (lk.js || [])) linkedToHtml[f] = htmlFile;
      }

      return names.map(n => {
        const tags = [];
        if (n === state.currentFile) tags.push('active');

        // Show which css/js files this HTML links (combines for preview)
        const lk = state.linkedFiles[n];
        if (lk) {
          const all = [...(lk.css || []), ...(lk.js || [])];
          if (all.length) tags.push(`combines: ${all.join(', ')}`);
        }

        // Show which HTML file this css/js is linked to
        if (linkedToHtml[n]) tags.push(`linked to ${linkedToHtml[n]}`);

        return n + (tags.length ? ` [${tags.join('] [')}]` : '');
      }).join('\n');
    }

    function _pushUndoEntry(filename, oldContent, newContent) {
      const stack = state.undoStack[filename];
      if (!stack) return;
      // Ensure the pre-edit state is on the stack
      if (stack[stack.length - 1] !== oldContent) stack.push(oldContent);
      // Push the post-edit state — this is what undo() will pop to get back to oldContent
      if (stack[stack.length - 1] !== newContent) stack.push(newContent);
      if (stack.length > UNDO_MAX) stack.splice(0, stack.length - UNDO_MAX);
      state.redoStack[filename] = [];
    }

    function agentWriteCode(content) {
      const current = state.files[state.currentFile];
      _pushUndoEntry(state.currentFile, current, content);
      const el = document.getElementById('editor');
      if (!el) return false;
      el.textContent = content;
      state.files[state.currentFile] = content;
      updateAll();
      return true;
    }

    function agentWriteFile(filename, content) {
      _pushUndoEntry(filename, state.files[filename], content);
      state.files[filename] = content;
      if (filename === state.currentFile) {
        document.getElementById('editor').textContent = content;
        updateAll();
      }
      return true;
    }

    // ── Enhanced tool functions ────────────────────────────────────────

    function agentNumberedCode(code) {
      const lines = code.split('\n');
      const pad = String(lines.length).length;
      return lines.map((l, i) =>
        `${String(i + 1).padStart(pad)} | ${l}`
      ).join('\n');
    }

    function agentReadLinesRange(start, end, filename) {
      const content = filename ?
        (state.files[filename] || '(file not found)') :
        agentReadCode();
      const lines = content.split('\n');
      const s = Math.max(1, start) - 1;
      const e = Math.min(lines.length, end);
      const pad = String(e).length;
      return {
        text: lines.slice(s, e).map((l, i) =>
          `${String(s + i + 1).padStart(pad)} | ${l}`
        ).join('\n'),
        total: lines.length
      };
    }

    function agentSearch(query, filename) {
      const content = filename ?
        (state.files[filename] || '') :
        agentReadCode();
      if (!content) return 'File not found or empty.';

      const lines = content.split('\n');
      const q = query.toLowerCase();
      const matches = [];

      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(q)) {
          const s = Math.max(0, i - 2);
          const e = Math.min(lines.length - 1, i + 2);
          const pad = String(e + 1).length;
          const snippet = lines.slice(s, e + 1).map((l, j) => {
            const ln = s + j + 1;
            const marker = (s + j === i) ? '>' : ' ';
            return `${marker}${String(ln).padStart(pad)} | ${l}`;
          }).join('\n');
          matches.push(snippet);
        }
      });

      if (!matches.length) return `No matches for "${query}".`;
      return `${matches.length} match(es):\n\n${matches.join('\n---\n')}`;
    }

    // ── OUTLINE tool — compact markdown map of file structure ─────────
    function agentOutline(filename) {
      const content = filename ? agentReadFile(filename) : agentReadCode();
      const fname = filename || state.currentFile;
      const ext = (fname.split('.').pop() || '').toLowerCase();
      const lines = content.split('\n');
      let md = `# ${fname} — ${lines.length} lines\n\n`;

      if (ext === 'html' || ext === 'htm') {
        md += _outlineHtml(lines);
      } else if (ext === 'css') {
        md += _outlineCss(lines);
      } else if (ext === 'js' || ext === 'ts' || ext === 'mjs') {
        md += _outlineJs(lines);
      } else {
        md += _outlineJs(lines); // generic function scan
      }
      return md;
    }

    function _outlineHtml(lines) {
      let md = '';
      let inStyle = false,
        inScript = false;
      let styleStart = 0,
        scriptStart = 0;
      const styleBlocks = [],
        scriptBlocks = [],
        ids = [],
        functions = [];

      for (let i = 0; i < lines.length; i++) {
        const ln = i + 1;
        const line = lines[i];

        if (!inStyle && /<style[\s>]/i.test(line)) {
          inStyle = true;
          styleStart = ln;
        }
        if (inStyle && /<\/style>/i.test(line)) {
          styleBlocks.push([styleStart, ln]);
          inStyle = false;
        }

        if (!inScript && /<script[\s>]/i.test(line) && !/<script\s+src/i.test(line)) {
          inScript = true;
          scriptStart = ln;
        }
        if (inScript && /<\/script>/i.test(line)) {
          scriptBlocks.push([scriptStart, ln]);
          inScript = false;
        }

        const idM = line.match(/\bid=["']([^"']+)["']/);
        if (idM) ids.push([ln, idM[1]]);

        if (inScript) {
          let m = line.match(/(?:^|\s)function\s+(\w+)\s*\(/);
          if (m) {
            functions.push([ln, m[1]]);
            continue;
          }
          m = line.match(/(?:^|\s)(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/);
          if (m) functions.push([ln, m[1]]);
        }
      }

      if (styleBlocks.length) {
        md += `## Style blocks\n`;
        styleBlocks.forEach(([s, e]) => md += `- \`<style>\` [lines ${s}–${e}]\n`);
        md += '\n';
      }
      if (ids.length) {
        const shown = ids.slice(0, 60);
        md += `## Element IDs (${ids.length})\n`;
        shown.forEach(([ln, id]) => md += `- \`#${id}\` [line ${ln}]\n`);
        if (ids.length > 60) md += `- …${ids.length - 60} more\n`;
        md += '\n';
      }
      if (scriptBlocks.length) {
        md += `## Script blocks\n`;
        scriptBlocks.forEach(([s, e]) => md += `- \`<script>\` [lines ${s}–${e}]\n`);
        md += '\n';
      }
      if (functions.length) {
        md += `## Functions (${functions.length})\n`;
        functions.forEach(([ln, name]) => md += `- \`${name}()\` [line ${ln}]\n`);
        md += '\n';
      }
      return md || '(No structure found — use READ_CODE or SEARCH)\n';
    }

    function _outlineCss(lines) {
      const selectors = [];
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (t.endsWith('{') && !t.startsWith('/*') && !t.startsWith('//') && t.length < 120) {
          selectors.push([i + 1, t.replace(/\{$/, '').trim()]);
        }
      }
      let md = `## Selectors (${selectors.length})\n`;
      selectors.slice(0, 100).forEach(([ln, sel]) => md += `- \`${sel}\` [line ${ln}]\n`);
      if (selectors.length > 100) md += `- …${selectors.length - 100} more\n`;
      return md;
    }

    function _outlineJs(lines) {
      const fns = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m = line.match(/(?:^|\s)function\s+(\w+)\s*\(/);
        if (m) {
          fns.push([i + 1, m[1]]);
          continue;
        }
        m = line.match(/(?:^|\s)(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/);
        if (m) fns.push([i + 1, m[1]]);
      }
      let md = `## Functions / declarations (${fns.length})\n`;
      fns.forEach(([ln, name]) => md += `- \`${name}\` [line ${ln}]\n`);
      return md || '(No functions found)\n';
    }

    function parseSearchReplaceBlock(content) {
      let raw = content.trim();

      // Strip leading <<<SEARCH marker
      raw = raw.replace(/^<<<\s*SEARCH\s*\n?/i, '');
      // Strip trailing >>>REPLACE marker
      raw = raw.replace(/\n?\s*>>>\s*REPLACE\s*$/i, '');

      let search = null,
        replace = null;

      // Method 1: split on \n===\n
      if (raw.includes('\n===\n')) {
        const idx = raw.indexOf('\n===\n');
        search = raw.substring(0, idx);
        replace = raw.substring(idx + 5);
      }
      // Method 2: split on \n>>>REPLACE\n or \n>>>\n (model uses as separator)
      else if (/\n>>>\s*(?:REPLACE)?\s*\n/i.test(raw)) {
        const match = raw.match(/\n>>>\s*(?:REPLACE)?\s*\n/i);
        const idx = raw.indexOf(match[0]);
        search = raw.substring(0, idx);
        replace = raw.substring(idx + match[0].length);
      }
      // Method 3: split on \n=======\n (git-style)
      else if (raw.includes('\n=======\n')) {
        const idx = raw.indexOf('\n=======\n');
        search = raw.substring(0, idx);
        replace = raw.substring(idx + 9);
      }
      // Method 4: split on loose === line
      else if (/\n\s*===\s*\n/.test(raw)) {
        const match = raw.match(/\n\s*===\s*\n/);
        const idx = raw.indexOf(match[0]);
        search = raw.substring(0, idx);
        replace = raw.substring(idx + match[0].length);
      }

      if (search === null) return null;

      // Aggressively clean any remaining markers from both halves
      const clean = s => s
        .replace(/^<<<\s*(?:SEARCH)?\s*\n?/gim, '')
        .replace(/\n?\s*>>>\s*(?:REPLACE)?\s*$/gim, '')
        .replace(/^>>>\s*(?:REPLACE)?\s*\n?/gim, '')
        .replace(/\n?\s*<<<\s*(?:SEARCH)?\s*$/gim, '')
        .replace(/^\s*=+\s*\n/gm, '')
        .replace(/\n\s*=+\s*$/gm, '');

      search = clean(search);
      replace = clean(replace);

      // Strip line number prefixes if the model copied them from the numbered display
      // Pattern: "  5 | actual code" or " 12 | actual code"
      const stripLineNums = s => {
        const lines = s.split('\n');
        const numbered = lines.filter(l => /^\s*\d+\s*\|\s/.test(l)).length;
        if (numbered > lines.length * 0.5) {
          return lines.map(l => l.replace(/^\s*\d+\s*\|\s?/, '')).join('\n');
        }
        return s;
      };

      search = stripLineNums(search);
      replace = stripLineNums(replace);

      if (!search.trim()) return null;

      return {
        search,
        replace: replace || ''
      };
    }

    function agentSearchReplace(searchText, replaceText, filename) {
      const target = filename || state.currentFile;
      const content = state.files[target];
      if (content === undefined)
        return {
          success: false,
          error: `File "${target}" not found.`
        };

      const source = content.replace(/\r\n/g, '\n');
      const search = searchText.replace(/\r\n/g, '\n');
      const replace = replaceText.replace(/\r\n/g, '\n');

      // Try 1: Exact match
      const idx = source.indexOf(search);
      if (idx !== -1) {
        const result = source.substring(0, idx) + replace + source.substring(idx + search.length);
        if (target === state.currentFile) agentWriteCode(result);
        else agentWriteFile(target, result);
        return {
          success: true
        };
      }

      // Try 2: Match ignoring leading/trailing whitespace per line
      const searchLines = search.split('\n').map(l => l.trim());
      const sourceLines = source.split('\n');

      for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
        let match = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (sourceLines[i + j].trim() !== searchLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          const before = sourceLines.slice(0, i);
          const after = sourceLines.slice(i + searchLines.length);
          const result = [...before, ...replace.split('\n'), ...after].join('\n');
          if (target === state.currentFile) agentWriteCode(result);
          else agentWriteFile(target, result);
          return {
            success: true,
            fuzzy: true
          };
        }
      }

      // Failed — help the model recover
      let bestScore = 0,
        bestLine = 0;
      for (let i = 0; i < sourceLines.length; i++) {
        let score = 0;
        for (let j = 0; j < searchLines.length && i + j < sourceLines.length; j++) {
          if (sourceLines[i + j].trim() === searchLines[j]) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          bestLine = i + 1;
        }
      }

      return {
        success: false,
        error: `Search text not found. Best partial match: ${bestScore}/${searchLines.length} lines near line ${bestLine}. Use SEARCH to find the exact text, then try again.`
      };
    }

    // ── Agent action parser ───────────────────────────────────────────
    const AGENT_ACTION_TYPES = new Set([
      'READ_CODE', 'READ_FILE', 'READ_LINES', 'OUTLINE', 'GET_FILES',
      'SEARCH', 'SEARCH_IN', 'SEARCH_REPLACE',
      'WRITE_CODE', 'WRITE_FILE', 'CREATE_FILE', 'APPEND_TO_FILE', 'RENAME_FILE', 'DONE'
    ]);

    function parseAgentAction(response) {
      // Strip markdown code fences the model may wrap output in
      let text = response.trim()
        .replace(/^```[\w]*\r?\n?/, '')
        .replace(/\r?\n?```$/, '')
        .trim();

      // Case-insensitive search for the AGENT_ACTION: marker
      const markerRe = /AGENT_ACTION\s*:/i;
      const markerMatch = markerRe.exec(text);

      if (!markerMatch) {
        // Fallback: detect if the response IS a bare action keyword (possibly with args)
        // e.g. "GET_FILES" or "READ_CODE index.html"
        const bareRe = new RegExp(
          '^(' + [...AGENT_ACTION_TYPES].join('|') + ')\\b', 'i'
        );
        const bareMatch = bareRe.exec(text);
        if (bareMatch) {
          const afterType = text.slice(bareMatch[0].length).trim();
          const lb = afterType.indexOf('\n');
          const argLine = lb === -1 ? afterType : afterType.slice(0, lb);
          const content = lb === -1 ? '' : afterType.slice(lb + 1).trim();
          return {
            type: bareMatch[1].toUpperCase(),
            args: argLine.trim() ? argLine.trim().split(/\s+/) : [],
            content
          };
        }
        return null;
      }

      const afterMarker = text.slice(markerMatch.index + markerMatch[0].length).trimStart();
      const lineBreak = afterMarker.indexOf('\n');
      const actionLine = (lineBreak === -1 ? afterMarker : afterMarker.slice(0, lineBreak)).trim();
      const content = lineBreak === -1 ? '' : afterMarker.slice(lineBreak + 1).trim();

      const parts = actionLine.split(/\s+/);
      const type = parts[0].toUpperCase();
      const args = parts.slice(1);

      return {
        type,
        args,
        content
      };
    }

    // ── Agent UI helpers ──────────────────────────────────────────────
    let _agentLogStart = 0;
    let _agentLastStep = 0;

    function chatCreateAgentLog() {
      _agentLogStart = _agentLastStep = Date.now();
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg chat-msg-ai';
      wrapper.innerHTML = `
          <div class="chat-agent-log">
            <div class="chat-agent-log-header" onclick="this.parentElement.classList.toggle('collapsed')">
              <span class="chat-agent-spinner"><i class="fas fa-circle-notch fa-spin"></i></span>
              <span class="chat-agent-log-title">Agent thinking…</span>
              <i class="fas fa-chevron-down chat-agent-chevron"></i>
            </div>
            <div class="chat-agent-steps"></div>
          </div>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return wrapper;
    }

    function chatAddAgentStep(wrapper, icon, label, type) {
      const now = Date.now();
      const elapsed = _agentLastStep ? ((now - _agentLastStep) / 1000).toFixed(1) : null;
      _agentLastStep = now;
      const steps = wrapper.querySelector('.chat-agent-steps');
      const stepNum = steps.children.length;
      const timeHtml = (elapsed && stepNum > 0) ? `<span class="chat-agent-step-time">${elapsed}s</span>` : '';
      const step = document.createElement('div');
      step.className = 'chat-agent-step' + (type ? ' chat-agent-step-' + type : '');
      step.innerHTML = `<span class="chat-agent-step-icon">${icon}</span><span>${escapeHtml(label)}</span>${timeHtml}`;
      steps.appendChild(step);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function chatFinalizeAgentLog(wrapper, success, stepCount) {
      const spinner = wrapper.querySelector('.chat-agent-spinner');
      const title = wrapper.querySelector('.chat-agent-log-title');
      const totalS = ((Date.now() - _agentLogStart) / 1000).toFixed(1);
      if (spinner) spinner.innerHTML = success ? '✅' : '⚠️';
      if (title) title.textContent = `Agent • ${stepCount} step${stepCount !== 1 ? 's' : ''} • ${totalS}s`;
      const log = wrapper.querySelector('.chat-agent-log');
      if (log) {
        log.classList.add('collapsed');
        const header = log.querySelector('.chat-agent-log-header');
        if (header && !header.querySelector('.chat-log-copy')) {
          const copyBtn = document.createElement('button');
          copyBtn.className = 'chat-log-copy';
          copyBtn.title = 'Copy log';
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
          copyBtn.onclick = e => {
            e.stopPropagation();
            chatCopyLog(wrapper, copyBtn);
          };
          header.insertBefore(copyBtn, header.querySelector('.chat-agent-chevron'));
        }
      }
    }

    function chatConfirmApply(actionType, args, content) {
      const currentCode = agentReadCode();
      const diffHtml = buildDiffHtml(actionType, args, content, currentCode);
      const uid = Date.now();
      return new Promise(resolve => {
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-msg chat-msg-ai';
        wrapper.innerHTML = `
            <div class="chat-bubble chat-bubble-ai chat-md" style="border-color:#f59e0b55;max-width:95%;">
              <div style="color:#f59e0b;font-weight:bold;font-size:12px;margin-bottom:6px;">⚠️ Agent wants to modify your code</div>
              ${diffHtml}
              <div class="chat-action-row" style="margin-top:6px;">
                <button class="chat-action-btn" id="confirm-yes-${uid}" style="color:var(--accent);border-color:var(--accent)55;">
                  <i class="fas fa-check"></i> Apply
                </button>
                <button class="chat-action-btn" id="confirm-no-${uid}">
                  <i class="fas fa-times"></i> Skip
                </button>
              </div>
            </div>`;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        wrapper.querySelector(`#confirm-yes-${uid}`).onclick = () => {
          wrapper.remove();
          resolve(true);
        };
        wrapper.querySelector(`#confirm-no-${uid}`).onclick = () => {
          wrapper.remove();
          resolve(false);
        };
      });
    }

    function chatAddThinkingDropdown(thinkContent, cleanContent) {
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg chat-msg-ai';

      // Format the thinking content nicely
      const thinkHtml = typeof marked !== 'undefined' ?
        renderMarkdown(thinkContent) :
        escapeHtml(thinkContent).replace(/\n/g, '<br>');

      wrapper.innerHTML = `
          <div class="chat-think-dropdown collapsed">
            <div class="chat-think-header" onclick="this.parentElement.classList.toggle('collapsed')">
              <span>💭</span>
              <span class="chat-think-title">Agent's reasoning</span>
              <i class="fas fa-chevron-down chat-think-chevron"></i>
            </div>
            <div class="chat-think-content chat-md">${thinkHtml}</div>
          </div>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let _rateLimitWarningShown = false;

    function chatAddRateLimitWarning() {
      if (_rateLimitWarningShown) return;
      _rateLimitWarningShown = true;

      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg chat-msg-ai';
      wrapper.innerHTML = `
          <div class="chat-rate-limit">
            ⛔ <strong>Daily limit reached</strong> — Cloudflare free tier neurons exhausted.
            All models share the same 10,000 neuron quota. Resets at midnight UTC.
            <br><br>
            <em>Tip: A Workers Paid plan ($5/mo) removes this limit, or you can use a second account's API key.</em>
          </div>`;
      chatMessages.appendChild(wrapper);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ── Diff helper ───────────────────────────────────────────────────
    function buildDiffHtml(actionType, args, newContent, currentCode) {
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const MAX = 60;

      if (actionType === 'SEARCH_REPLACE') {
        const parsed = parseSearchReplaceBlock(newContent);
        if (!parsed) return '<div class="diff-view">Could not parse change</div>';
        const oldLines = parsed.search.split('\n');
        const newLines = parsed.replace.split('\n');
        let html = `<div class="diff-stat">Replace ${oldLines.length} → ${newLines.length} line(s)</div><div class="diff-view">`;
        html += oldLines.slice(0, MAX).map(l => `<span class="diff-del">− ${esc(l)}</span>`).join('');
        html += newLines.slice(0, MAX).map(l => `<span class="diff-add">+ ${esc(l)}</span>`).join('');
        return html + '</div>';
      }

      if (actionType === 'WRITE_CODE') {
        const oldLines = currentCode.split('\n');
        const newLines = newContent.split('\n');
        const delta = newLines.length - oldLines.length;
        const sign = delta >= 0 ? `+${delta}` : `${delta}`;
        let html = `<div class="diff-stat">Full rewrite: ${oldLines.length} → ${newLines.length} lines (${sign})</div><div class="diff-view">`;
        const preview = newLines.slice(0, MAX);
        html += preview.map(l => `<span class="diff-add">+ ${esc(l)}</span>`).join('');
        if (newLines.length > MAX) html += `<span class="diff-ctx">  … ${newLines.length - MAX} more lines</span>`;
        return html + '</div>';
      }

      if (actionType === 'WRITE_FILE') {
        const filename = args[0] || '?';
        const newLines = newContent.split('\n');
        let html = `<div class="diff-stat">Write to "${esc(filename)}": ${newLines.length} lines</div><div class="diff-view">`;
        html += newLines.slice(0, MAX).map(l => `<span class="diff-add">+ ${esc(l)}</span>`).join('');
        if (newLines.length > MAX) html += `<span class="diff-ctx">  … ${newLines.length - MAX} more lines</span>`;
        return html + '</div>';
      }

      return `<div class="diff-view"><span class="diff-add">${esc(newContent.substring(0, 400))}</span></div>`;
    }

    // ── Thinker: consults reasoning model before acting ──────────────
    let aiRateLimited = false;

    async function agentThink(userMessage, fileContext) {
      if (aiRateLimited) return null;
      // Respect thinker on/off setting
      if (document.getElementById('chat-agent-thinker')?.checked === false) return null;

      const thinkerModel = document.getElementById('chat-thinker-model')?.value ||
        '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';

      const thinkerPrompt = `You are a senior developer advising a coding agent.
  The user wants a change made to their code. Your job: figure out the EXACT technical approach.


  Be specific and precise:
  - Name exact CSS properties, HTML attributes, JS methods, or APIs needed.
  - Call out any tricky techniques (e.g. CSS text gradients need -webkit-background-clip:text + -webkit-text-fill-color:transparent; backdrop-filter needs vendor prefixes; IntersectionObserver needs threshold config).
  - Give real code snippets — not pseudocode.
  - If multiple files are involved, say which file each change goes in.
  - Keep it under 500 words. No markdown fences.`;

      const fileList = agentGetFiles();
      const message = `USER WANTS: ${userMessage}


  PROJECT FILES:
  ${fileList}


  ACTIVE FILE CONTENT (${fileContext.length} chars shown):
  ${fileContext.substring(0, 4000)}


  What is the exact technical approach? Be precise and specific.`;

      try {
        const rawResponse = await callAIRaw([{
            role: 'system',
            content: thinkerPrompt
          },
          {
            role: 'user',
            content: message
          }
        ], 1200, 0.3, thinkerModel);

        const thinkMatch = rawResponse.match(/<think>([\s\S]*?)<\/think>/i);
        const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
        const cleanResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        if (thinkContent) chatAddThinkingDropdown(thinkContent, cleanResponse);

        return cleanResponse || null;
      } catch (e) {
        const errMsg = e.message || '';
        if (errMsg.includes('429') || errMsg.includes('neurons') || errMsg.includes('free allocation')) {
          console.warn('Thinker rate limited — skipping');
          return null;
        }
        console.warn('Thinker failed:', e.message);
        return null;
      }
    }

    // ── Single agent system prompt ────────────────────────────────────
    const AGENT_SYSTEM = `You are a code editing agent running in a browser IDE.


  AVAILABLE TOOLS — output exactly ONE per turn:


  AGENT_ACTION: READ_CODE
    Read the active file with line numbers. Do this first before any edit.


  AGENT_ACTION: READ_FILE filename
    Read a specific file with line numbers.


  AGENT_ACTION: READ_LINES start end
  AGENT_ACTION: READ_LINES filename start end
    Read a line range (e.g. READ_LINES 100 200). Use for large files.


  AGENT_ACTION: GET_FILES
    List all project files with their status.


  AGENT_ACTION: OUTLINE
  AGENT_ACTION: OUTLINE filename
    Get a compact markdown map of the file's structure — all functions, element IDs,
    style/script blocks, and CSS selectors with line numbers.
    USE THIS FIRST on any file over 300 lines instead of READ_CODE.
    It costs ~10x fewer tokens than reading the raw file.


  AGENT_ACTION: SEARCH query
  AGENT_ACTION: SEARCH_IN filename query
    Find lines matching query with surrounding context.


  AGENT_ACTION: SEARCH_REPLACE
  <<<SEARCH
  exact existing code (copied verbatim from the file)
  ===
  replacement code
  >>>REPLACE


  AGENT_ACTION: SEARCH_REPLACE filename
  <<<SEARCH
  exact existing code
  ===
  replacement code
  >>>REPLACE


  AGENT_ACTION: WRITE_CODE
  full file content here


  AGENT_ACTION: WRITE_FILE filename
  full file content here


  AGENT_ACTION: CREATE_FILE filename
  full file content here


  AGENT_ACTION: APPEND_TO_FILE filename
  content to append


  AGENT_ACTION: RENAME_FILE oldname newname


  AGENT_ACTION: DONE
  summary of what was done


  RULES:
  1. Always READ_CODE (or READ_FILE) before editing — never guess at content.
  2. Prefer SEARCH_REPLACE for targeted edits. Copy search text EXACTLY — character for character, no line-number prefixes.
  3. Include 3+ unique context lines in SEARCH so the match is unambiguous.
  4. Use WRITE_CODE only for full rewrites (>50% of file changed) or brand new files.
  5. Use CREATE_FILE to create a file that doesn't exist yet.
  6. Use APPEND_TO_FILE to add content to the end of a file without rewriting it.
  7. Use RENAME_FILE to rename a file: RENAME_FILE old.js new.js (no content block).
  8. One tool call per turn. Output ONLY the tool call — no commentary, no markdown fences.
  9. If a TECHNICAL APPROACH is provided, follow it precisely.
  10. If SEARCH_REPLACE fails, use SEARCH to find the exact text, then retry.


  FILE LINKING SYSTEM — IMPORTANT:
  This IDE has a link system for multi-file projects. The sandboxed preview cannot load external files via <link href> or <script src> tags. Instead, CSS and JS files must be "linked" to an HTML file so the preview combines them automatically.


  - GET_FILES output shows "[combines: style.css, app.js]" on an HTML file that links them, and "[linked to index.html]" on a CSS/JS file that is linked.
  - When you CREATE_FILE a .css or .js file while an HTML file is active, it is automatically linked — the observation will say so.
  - Do NOT add <link href="..."> or <script src="..."> tags for files managed in this IDE. The preview combines linked files without those tags.
  - If you need to add CSS or JS to a project: CREATE_FILE the .css/.js file (it auto-links), then edit it via SEARCH_REPLACE or WRITE_FILE.
  - If a CSS/JS file already exists but is not linked, the user must link it manually from the file tree.`;

    // ── Single agent loop (with thinker) ──────────────────────────────
    async function agentLoop(userMessage) {
      const maxSteps = parseInt(document.getElementById('chat-agent-maxsteps')?.value) || 12;
      const needsConfirm = document.getElementById('chat-agent-confirm')?.checked !== false;
      const model = document.getElementById('chat-model').value;
      const temperature = parseFloat(document.getElementById('chat-temperature').value) || 0.3;

      const logWrapper = chatCreateAgentLog();
      let stepCount = 0;

      // ── Think first ────────────────────────────
      stepCount++;
      chatAddAgentStep(logWrapper, '🧠', 'Thinking...');

      const codePreview = agentReadCode().substring(0, 2000);
      const thought = await agentThink(userMessage, codePreview);

      let enhancedMessage = userMessage;
      if (thought) {
        chatAddAgentStep(logWrapper, '💡', 'Got approach, starting edits...');
        enhancedMessage = `USER REQUEST: ${userMessage}


  TECHNICAL APPROACH (from senior developer — follow this closely):
  ${thought}


  Now use your tools to implement this. Start with READ_CODE.`;
      } else {
        chatAddAgentStep(logWrapper, '⚠️', 'Thinker unavailable, proceeding directly', 'warn');
      }

      const messages = [{
          role: 'system',
          content: AGENT_SYSTEM
        },
        {
          role: 'user',
          content: enhancedMessage
        }
      ];

      let fmtRetries = 0;
      const MAX_FMT_RETRIES = 2;
      const FMT_NUDGE = 'Your last response was not a valid AGENT_ACTION. Reply with EXACTLY one line like:\nAGENT_ACTION: GET_FILES\nor\nAGENT_ACTION: READ_CODE\nNo markdown, no explanation — just the action line, then a newline, then any required content block.';

      const STEP_META = {
        READ_CODE: ['📖', 'Read active file'],
        READ_FILE: ['📂', 'Read file'],
        READ_LINES: ['📄', 'Read lines'],
        OUTLINE: ['🗺️', 'Outline file structure'],
        GET_FILES: ['📁', 'List files'],
        SEARCH: ['🔍', 'Search'],
        SEARCH_IN: ['🔍', 'Search file'],
        SEARCH_REPLACE: ['✂️', 'Search & replace'],
        WRITE_CODE: ['✏️', 'Write active file'],
        WRITE_FILE: ['💾', 'Write file'],
        CREATE_FILE: ['🆕', 'Create file'],
        APPEND_TO_FILE: ['➕', 'Append to file'],
        RENAME_FILE: ['🔄', 'Rename file'],
        DONE: ['✅', 'Done'],
      };

      try {
        for (let i = 0; i < maxSteps; i++) {
          stepCount++;
          const response = await callAIRaw(messages, 2048, temperature, model);
          const action = parseAgentAction(response);

          if (!action) {
            if (fmtRetries < MAX_FMT_RETRIES) {
              fmtRetries++;
              chatAddAgentStep(logWrapper, '🔄', `Bad format — nudging (attempt ${fmtRetries})`, 'warn');
              messages.push({
                role: 'assistant',
                content: response
              });
              messages.push({
                role: 'user',
                content: FMT_NUDGE
              });
              stepCount--;
              continue;
            }
            chatAddAgentStep(logWrapper, '⚠️', 'Unrecognized response format after retries', 'warn');
            chatFinalizeAgentLog(logWrapper, false, stepCount);
            chatAppendAi(response);
            return;
          }
          fmtRetries = 0;

          const [icon, baseLabel] = STEP_META[action.type] || ['⚙️', action.type];
          let stepLabel = baseLabel;
          if (action.type === 'SEARCH_REPLACE') stepLabel = 'Search & replace' + (action.args[0] ? ` in ${action.args[0]}` : '');
          else if (action.type === 'READ_FILE') stepLabel = `Read ${action.args[0] || '?'}`;
          else if (action.type === 'SEARCH') stepLabel = `Search: ${action.args.join(' ').substring(0, 30)}`;
          else if (action.type === 'SEARCH_IN') stepLabel = `Search in ${action.args[0]}: ${action.args.slice(1).join(' ').substring(0, 25)}`;
          else if (action.type === 'CREATE_FILE') stepLabel = `Create ${action.args[0] || 'file'}`;
          else if (action.type === 'APPEND_TO_FILE') stepLabel = `Append to ${action.args[0] || state.currentFile}`;
          else if (action.type === 'RENAME_FILE') stepLabel = `Rename ${action.args[0] || '?'} → ${action.args[1] || '?'}`;
          else if (action.type === 'WRITE_FILE') stepLabel = `Write ${action.args[0] || '?'}`;
          chatAddAgentStep(logWrapper, icon, stepLabel);

          if (action.type === 'DONE') {
            chatFinalizeAgentLog(logWrapper, true, stepCount);
            chatAppendAi(action.content || 'Task complete.');
            return;
          }

          let observation = '';

          switch (action.type) {
            case 'READ_CODE': {
              const code = agentReadCode();
              const lines = code.split('\n').length;
              const MAX_LINES = 400;
              if (lines > MAX_LINES) {
                const preview = agentNumberedCode(code.split('\n').slice(0, MAX_LINES).join('\n'));
                observation = `Active file: "${state.currentFile}" (${lines} lines — showing first ${MAX_LINES}). Use READ_LINES start end or SEARCH to access the rest.\n${preview}`;
              } else {
                observation = `Active file: "${state.currentFile}" (${lines} lines):\n${agentNumberedCode(code)}`;
              }
              break;
            }
            case 'READ_FILE': {
              const fname = action.args[0];
              if (!fname) {
                observation = 'Error: no filename.';
                break;
              }
              const fc = agentReadFile(fname);
              const lines = fc.split('\n').length;
              const MAX_LINES = 400;
              if (lines > MAX_LINES) {
                const preview = agentNumberedCode(fc.split('\n').slice(0, MAX_LINES).join('\n'));
                observation = `File "${fname}" (${lines} lines — showing first ${MAX_LINES}). Use READ_LINES to access the rest.\n${preview}`;
              } else {
                observation = `File "${fname}" (${lines} lines):\n${agentNumberedCode(fc)}`;
              }
              break;
            }
            case 'READ_LINES': {
              let fname = null,
                start, end;
              if (action.args.length >= 3) {
                fname = action.args[0];
                start = parseInt(action.args[1]);
                end = parseInt(action.args[2]);
              } else {
                start = parseInt(action.args[0]);
                end = parseInt(action.args[1]);
              }
              if (isNaN(start) || isNaN(end)) {
                observation = 'Error: provide start and end line numbers.';
                break;
              }
              const r = agentReadLinesRange(start, end, fname);
              observation = `Lines ${start}-${end} of "${fname || state.currentFile}" (${r.total} total):\n${r.text}`;
              break;
            }
            case 'OUTLINE': {
              const ofname = action.args[0] || null;
              observation = agentOutline(ofname);
              break;
            }
            case 'GET_FILES': {
              observation = 'Files:\n' + agentGetFiles();
              break;
            }
            case 'SEARCH':
            case 'SEARCH_IN': {
              let fname = null,
                query;
              if (action.type === 'SEARCH_IN') {
                fname = action.args[0];
                query = action.args.slice(1).join(' ');
              } else {
                query = action.args.join(' ');
              }
              if (!query) {
                observation = 'Error: no search query.';
                break;
              }
              observation = agentSearch(query, fname);
              break;
            }
            case 'SEARCH_REPLACE': {
              const srFile = action.args[0] || null;
              const parsed = parseSearchReplaceBlock(action.content);
              if (!parsed) {
                observation = 'Error: could not parse SEARCH_REPLACE block. Use format:\n<<<SEARCH\nold code\n===\nnew code\n>>>REPLACE';
                break;
              }
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('SEARCH_REPLACE', action.args, action.content);
              if (apply) {
                const result = agentSearchReplace(parsed.search, parsed.replace, srFile);
                if (result.success) {
                  observation = 'Replacement applied successfully.' + (result.fuzzy ? ' (matched with flexible whitespace)' : '');
                } else {
                  observation = result.error;
                }
              } else {
                observation = 'User skipped this change.';
              }
              break;
            }
            case 'WRITE_CODE': {
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_CODE', action.args, action.content);
              if (apply) {
                agentWriteCode(action.content);
                observation = `Wrote ${action.content.split('\n').length} lines to "${state.currentFile}".`;
              } else {
                observation = 'User skipped this change.';
              }
              break;
            }
            case 'WRITE_FILE': {
              const wfname = action.args[0];
              if (!wfname) {
                observation = 'Error: no filename.';
                break;
              }
              if (!state.files.hasOwnProperty(wfname)) {
                observation = `Error: "${wfname}" doesn't exist. Use CREATE_FILE to create a new file, or GET_FILES to list existing files.`;
                break;
              }
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', action.args, action.content);
              if (apply) {
                agentWriteFile(wfname, action.content);
                observation = `Wrote ${action.content.split('\n').length} lines to "${wfname}".`;
              } else {
                observation = 'User skipped this change.';
              }
              break;
            }
            case 'CREATE_FILE': {
              const cfname = action.args[0];
              if (!cfname) {
                observation = 'Error: no filename provided for CREATE_FILE.';
                break;
              }
              if (state.files.hasOwnProperty(cfname)) {
                observation = `Error: "${cfname}" already exists. Use WRITE_FILE to overwrite it or SEARCH_REPLACE to edit it.`;
                break;
              }
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', [cfname], action.content);
              if (apply) {
                state.files[cfname] = action.content;
                state.undoStack[cfname] = [action.content];
                state.redoStack[cfname] = [];

                // Auto-link CSS/JS files to the active HTML file so preview combines them
                let autoLinkNote = '';
                const cfExt = cfname.split('.').pop().toLowerCase();
                const curExt = (state.currentFile || '').split('.').pop().toLowerCase();
                if ((cfExt === 'css' || cfExt === 'js') && (curExt === 'html' || curExt === 'htm')) {
                  const htmlFile = state.currentFile;
                  if (!state.linkedFiles[htmlFile]) state.linkedFiles[htmlFile] = {
                    css: [],
                    js: []
                  };
                  const ltype = cfExt === 'css' ? 'css' : 'js';
                  if (!state.linkedFiles[htmlFile][ltype].includes(cfname)) {
                    state.linkedFiles[htmlFile][ltype].push(cfname);
                    autoLinkNote = ` Auto-linked to "${htmlFile}" so the preview combines them.`;
                  }
                }

                updateFileTree();
                saveState();
                observation = `Created "${cfname}" with ${action.content.split('\n').length} lines.${autoLinkNote}`;
              } else {
                observation = 'User skipped this change.';
              }
              break;
            }
            case 'APPEND_TO_FILE': {
              const afname = action.args[0] || state.currentFile;
              if (!state.files.hasOwnProperty(afname)) {
                observation = `Error: "${afname}" not found. Use CREATE_FILE to create it, or GET_FILES to list files.`;
                break;
              }
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', [afname], action.content);
              if (apply) {
                const prev = state.files[afname];
                const newContent = prev.endsWith('\n') ? prev + action.content : prev + '\n' + action.content;
                agentWriteFile(afname, newContent);
                observation = `Appended ${action.content.split('\n').length} lines to "${afname}".`;
              } else {
                observation = 'User skipped this change.';
              }
              break;
            }
            case 'RENAME_FILE': {
              const oldName = action.args[0];
              const newName = action.args[1];
              if (!oldName || !newName) {
                observation = 'Error: RENAME_FILE requires oldname newname.';
                break;
              }
              if (!state.files.hasOwnProperty(oldName)) {
                observation = `Error: "${oldName}" not found.`;
                break;
              }
              if (state.files.hasOwnProperty(newName)) {
                observation = `Error: "${newName}" already exists.`;
                break;
              }
              state.files[newName] = state.files[oldName];
              state.undoStack[newName] = state.undoStack[oldName] || [];
              state.redoStack[newName] = state.redoStack[oldName] || [];
              delete state.files[oldName];
              delete state.undoStack[oldName];
              delete state.redoStack[oldName];
              if (state.linkedFiles) {
                for (const [hf, lk] of Object.entries(state.linkedFiles)) {
                  ['css', 'js'].forEach(t => {
                    const idx = lk[t].indexOf(oldName);
                    if (idx !== -1) lk[t][idx] = newName;
                  });
                }
              }
              if (state.currentFile === oldName) {
                state.currentFile = newName;
                document.getElementById('editor').textContent = state.files[newName];
                updateAll();
              }
              updateFileTree();
              saveState();
              observation = `Renamed "${oldName}" to "${newName}".`;
              break;
            }
            default:
              observation = `Unknown action: "${action.type}". Valid actions: READ_CODE, READ_FILE, READ_LINES, GET_FILES, SEARCH, SEARCH_IN, SEARCH_REPLACE, WRITE_CODE, WRITE_FILE, CREATE_FILE, APPEND_TO_FILE, RENAME_FILE, DONE.`;
          }

          messages.push({
            role: 'assistant',
            content: response
          });
          messages.push({
            role: 'user',
            content: `OBSERVATION: ${observation}`
          });
        }

        chatFinalizeAgentLog(logWrapper, false, stepCount);
        chatAppendAi(`⚠️ Agent reached the ${maxSteps}-step limit. You can ask it to continue where it left off.`);

      } catch (e) {
        chatFinalizeAgentLog(logWrapper, false, stepCount);
        if (e.message === 'RATE_LIMITED') {
          chatAddRateLimitWarning();
        } else {
          chatAppendAi(`Agent error: ${e.message}`);
        }
      }
    }

    // ── Multi-agent system prompts ────────────────────────────────────
    const PLANNER_SYSTEM = `You are a planning agent for a code editing system.
  You receive a user request and a list of project files.
  Break the request into small, atomic, specific steps.


  Output ONLY a numbered list. Each item = ONE edit in ONE file.


  ALLOWED STEP TYPES:
  - Edit existing code in a file
  - Create a brand new file
  - Append content to an existing file
  - Rename a file


  EXAMPLE:
  1. In index.html, add a <button id="dark-toggle"> after the nav header
  2. In style.css, add .dark-mode class with background:#1a1a1a and color:#f0f0f0
  3. Create file theme.js with a toggleDarkMode() function
  4. In index.html, add <script src="theme.js"> before </body>


  RULES:
  - Each step = ONE focused edit in ONE file
  - Be precise about WHERE in the file the change goes
  - Never bundle 2 changes in one step
  - 12 steps maximum
  - Reference exact filenames
  - Output ONLY the numbered list, nothing else`;

    const CODER_SYSTEM = `You are a code editing agent.
  You receive ONE specific task and the relevant file content.
  Output ONLY an AGENT_ACTION block. Nothing else — no explanation, no commentary.


  AVAILABLE ACTIONS:


  For targeted edits (preferred):
  AGENT_ACTION: SEARCH_REPLACE
  <<<SEARCH
  exact existing code (verbatim copy, no line numbers)
  ===
  new replacement code
  >>>REPLACE


  For a specific file:
  AGENT_ACTION: SEARCH_REPLACE filename.css
  <<<SEARCH
  exact existing code
  ===
  new code
  >>>REPLACE


  For full rewrites:
  AGENT_ACTION: WRITE_CODE
  full file content


  AGENT_ACTION: WRITE_FILE filename
  full file content


  For creating a new file:
  AGENT_ACTION: CREATE_FILE newfile.js
  full new file content


  For appending to a file:
  AGENT_ACTION: APPEND_TO_FILE filename
  content to append


  EXAMPLE — code shown:
    3 | <body>
    4 |   <h1>Hello</h1>
    5 |   <p>World</p>
    6 | </body>


  Task: "add a subtitle after the h1" → correct output:
  AGENT_ACTION: SEARCH_REPLACE
  <<<SEARCH
    <h1>Hello</h1>
    <p>World</p>
  ===
    <h1>Hello</h1>
    <h2>Subtitle</h2>
    <p>World</p>
  >>>REPLACE


  CRITICAL RULES:
  - Line numbers in code (like "  5 | ") are display-only — NEVER copy them into SEARCH
  - Copy SEARCH text EXACTLY from the shown code — character for character
  - Include 3+ context lines in SEARCH to ensure unique matching
  - Output NOTHING but the action block
  - If a TECHNICAL APPROACH is given, follow it precisely
  - If a previous attempt failed, read the failure reason and fix accordingly`;

    const REVIEWER_SYSTEM = `You are a code review agent.
  You see: the original code, the task, and the proposed change.


  Respond with EXACTLY one word on the first line:
  APPROVE or REJECT


  If REJECT, add a brief reason on the next line.


  Check for:
  - Does the change match what was asked?
  - Will it break existing code?
  - Is the syntax correct?
  - Are there obvious bugs?`;

    // ── Multi-agent loop (with thinker) ───────────────────────────────
    async function multiAgentLoop(userMessage) {
      const model = document.getElementById('chat-model').value;
      const temperature = parseFloat(document.getElementById('chat-temperature').value) || 0.3;
      const needsConfirm = document.getElementById('chat-agent-confirm')?.checked !== false;
      const useReviewer = document.getElementById('chat-agent-reviewer')?.checked !== false;
      const logWrapper = chatCreateAgentLog();
      let stepCount = 0;
      const MAX_RETRIES = parseInt(document.getElementById('chat-agent-maxretries')?.value) || 3;

      try {
        // ── PHASE 0: THINK ────────────────────────
        stepCount++;
        chatAddAgentStep(logWrapper, '🧠', 'Thinking...');

        const codePreview = agentReadCode().substring(0, 2000);
        const thought = await agentThink(userMessage, codePreview);

        let technicalContext = '';
        if (thought) {
          chatAddAgentStep(logWrapper, '💡', 'Got technical approach');
          technicalContext = `\n\nTECHNICAL APPROACH (follow this closely):\n${thought}`;
        } else {
          chatAddAgentStep(logWrapper, '⚠️', 'Thinker unavailable, proceeding without', 'warn');
        }

        // ── PHASE 1: PLAN ─────────────────────────
        stepCount++;
        chatAddAgentStep(logWrapper, '📋', 'Planning...');

        const fileList = agentGetFiles();

        // Try DeepSeek R1 for planning, fall back to Qwen on 429
        let planResponse;
        const plannerModel = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
        const plannerFallback = '@cf/qwen/qwen2.5-coder-32b-instruct';

        try {
          planResponse = await callAIRaw([{
              role: 'system',
              content: PLANNER_SYSTEM
            },
            {
              role: 'user',
              content: `Files in project:\n${fileList}\n\nUser request: ${userMessage}${technicalContext}`
            }
          ], 1024, 0.3, plannerModel);
        } catch (planErr) {
          const errMsg = planErr.message || '';
          if (errMsg.includes('429') || errMsg.includes('neurons') || errMsg.includes('free allocation')) {
            chatAddAgentStep(logWrapper, '⚠️', 'DeepSeek limit hit, using Qwen for planning', 'warn');
            if (!thought) chatAddRateLimitWarning(); // Only show warning once
            planResponse = await callAIRaw([{
                role: 'system',
                content: PLANNER_SYSTEM
              },
              {
                role: 'user',
                content: `Files in project:\n${fileList}\n\nUser request: ${userMessage}${technicalContext}`
              }
            ], 1024, 0.3, plannerFallback);
          } else {
            throw planErr;
          }
        }

        // Strip <think> tags from DeepSeek R1
        const cleanPlan = planResponse
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .trim();

        const steps = cleanPlan
          .split('\n')
          .filter(l => /^\d+[\.\)]\s/.test(l.trim()))
          .map(l => l.trim().replace(/^\d+[\.\)]\s*/, ''));

        if (!steps.length) {
          chatFinalizeAgentLog(logWrapper, false, stepCount);
          chatAppendAi("Couldn't break that into steps. Try being more specific?\n\nPlanner said:\n" + cleanPlan);
          return;
        }

        chatAddAgentStep(logWrapper, '📋', `Plan: ${steps.length} step(s)`);
        chatAppendAi(`**Plan (${steps.length} steps):**\n` + steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));

        // ── PHASE 2: EXECUTE EACH STEP ────────────
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          let stepApplied = false;
          let lastRetryReason = '';

          for (let attempt = 0; attempt <= MAX_RETRIES && !stepApplied; attempt++) {
            stepCount++;

            const isRetry = attempt > 0;
            const retryTag = isRetry ? ` (retry ${attempt})` : '';
            chatAddAgentStep(logWrapper, isRetry ? '🔄' : '✏️',
              `Step ${i + 1}${retryTag}: ${step.substring(0, 50)}${step.length > 50 ? '...' : ''}`);

            // Figure out which file this step targets
            const fileNames = Object.keys(state.files);
            let targetFile = state.currentFile;
            for (const f of fileNames) {
              if (step.toLowerCase().includes(f.toLowerCase())) {
                targetFile = f;
                break;
              }
            }

            // Re-read file content each attempt (may have changed)
            const fileContent = state.files[targetFile] || '';
            const lineCount = fileContent.split('\n').length;

            const MAX = 400;
            const shownContent = lineCount > MAX ?
              agentNumberedCode(fileContent.split('\n').slice(0, MAX).join('\n')) + `\n... (${lineCount - MAX} more lines — use READ_LINES to see the rest)` :
              agentNumberedCode(fileContent);

            // Build coder message
            let coderMessage = `TASK: ${step}\n\nFILE: ${targetFile} (${lineCount} lines):\n${shownContent}`;
            if (thought) {
              coderMessage += `\n\nTECHNICAL APPROACH (follow this):\n${thought}`;
            }
            if (isRetry && lastRetryReason) {
              coderMessage += `\n\nYOUR PREVIOUS ATTEMPT FAILED: ${lastRetryReason}\nFix the issue. Make sure SEARCH text matches the file EXACTLY — no line numbers, no markers.`;
            }

            // Ask the coder
            const coderResponse = await callAIRaw([{
                role: 'system',
                content: CODER_SYSTEM
              },
              {
                role: 'user',
                content: coderMessage
              }
            ], 2048, 0.2, model);

            const action = parseAgentAction(coderResponse);

            if (!action) {
              lastRetryReason = 'Response was not in AGENT_ACTION format.';
              chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: bad format${retryTag}`, 'warn');
              if (attempt >= MAX_RETRIES) {
                chatAppendAi(`**Step ${i + 1} failed** after ${MAX_RETRIES + 1} attempts: couldn't get valid format`);
              }
              continue;
            }

            // ── REVIEW ──────────────────────────────
            if (useReviewer) {
              stepCount++;
              chatAddAgentStep(logWrapper, '🔍', `Reviewing step ${i + 1}...`);

              const reviewResponse = await callAIRaw([{
                  role: 'system',
                  content: REVIEWER_SYSTEM
                },
                {
                  role: 'user',
                  content: `TASK: ${step}\n\nORIGINAL CODE (${targetFile}):\n${shownContent.substring(0, 2000)}\n\nPROPOSED CHANGE:\n${coderResponse}`
                }
              ], 256, 0.1, model);

              const firstLine = reviewResponse.trim().split('\n')[0].trim().toUpperCase();

              if (firstLine.includes('REJECT')) {
                const reason = reviewResponse.trim().split('\n').slice(1).join(' ').trim();
                lastRetryReason = `Reviewer rejected: ${reason || 'no reason given'}`;
                chatAddAgentStep(logWrapper, '❌', `Rejected${retryTag}: ${reason || 'no reason'}`, 'warn');
                if (attempt >= MAX_RETRIES) {
                  chatAppendAi(`**Step ${i + 1} failed** after ${MAX_RETRIES + 1} attempts. Last rejection: ${reason || 'no reason'}`);
                }
                continue;
              }
            }

            // ── APPLY ───────────────────────────────
            if (action.type === 'SEARCH_REPLACE') {
              const srFile = action.args[0] || targetFile;
              const parsed = parseSearchReplaceBlock(action.content);
              if (!parsed) {
                lastRetryReason = 'Could not parse SEARCH_REPLACE block. Need <<<SEARCH ... === ... >>>REPLACE format.';
                chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: bad SEARCH_REPLACE format${retryTag}`, 'warn');
                if (attempt >= MAX_RETRIES) {
                  chatAppendAi(`**Step ${i + 1} failed:** couldn't parse SEARCH_REPLACE format`);
                }
                continue;
              }

              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('SEARCH_REPLACE', [srFile], action.content);

              if (apply) {
                const result = agentSearchReplace(parsed.search, parsed.replace, srFile);
                if (result.success) {
                  chatAddAgentStep(logWrapper, '✅', `Step ${i + 1} applied${result.fuzzy ? ' (fuzzy)' : ''}`);
                  stepApplied = true;
                } else {
                  lastRetryReason = result.error;
                  chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: match failed${retryTag}`, 'warn');
                  chatAppendAi(`⚠️ Step ${i + 1} — search text not found in file after applying. ${result.error}`);
                  if (attempt >= MAX_RETRIES) {
                    chatAppendAi(`**Step ${i + 1} failed** after ${MAX_RETRIES + 1} attempts.`);
                  }
                }
              } else {
                chatAddAgentStep(logWrapper, '⏭️', `Step ${i + 1} skipped by user`);
                stepApplied = true;
              }

            } else if (action.type === 'WRITE_CODE') {
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_CODE', [], action.content);
              if (apply) {
                agentWriteCode(action.content);
                chatAddAgentStep(logWrapper, '✅', `Step ${i + 1} applied (full rewrite)`);
                stepApplied = true;
              } else {
                chatAddAgentStep(logWrapper, '⏭️', `Step ${i + 1} skipped by user`);
                stepApplied = true;
              }

            } else if (action.type === 'WRITE_FILE') {
              const wf = action.args[0] || targetFile;
              let apply = true;
              if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', [wf], action.content);
              if (apply) {
                agentWriteFile(wf, action.content);
                chatAddAgentStep(logWrapper, '✅', `Step ${i + 1} applied to ${wf}`);
                stepApplied = true;
              } else {
                chatAddAgentStep(logWrapper, '⏭️', `Step ${i + 1} skipped by user`);
                stepApplied = true;
              }

            } else if (action.type === 'CREATE_FILE') {
              const cfn = action.args[0];
              if (!cfn) {
                lastRetryReason = 'CREATE_FILE missing filename.';
                chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: no filename${retryTag}`, 'warn');
              } else if (state.files.hasOwnProperty(cfn)) {
                lastRetryReason = `"${cfn}" already exists. Use WRITE_FILE to overwrite.`;
                chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: file exists${retryTag}`, 'warn');
              } else {
                let apply = true;
                if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', [cfn], action.content);
                if (apply) {
                  state.files[cfn] = action.content;
                  state.undoStack[cfn] = [action.content];
                  state.redoStack[cfn] = [];

                  // Auto-link CSS/JS files to the active HTML file so preview combines them
                  const cfnExt = cfn.split('.').pop().toLowerCase();
                  const curExt2 = (state.currentFile || '').split('.').pop().toLowerCase();
                  if ((cfnExt === 'css' || cfnExt === 'js') && (curExt2 === 'html' || curExt2 === 'htm')) {
                    const htmlFile = state.currentFile;
                    if (!state.linkedFiles[htmlFile]) state.linkedFiles[htmlFile] = {
                      css: [],
                      js: []
                    };
                    const ltype = cfnExt === 'css' ? 'css' : 'js';
                    if (!state.linkedFiles[htmlFile][ltype].includes(cfn)) {
                      state.linkedFiles[htmlFile][ltype].push(cfn);
                    }
                  }

                  updateFileTree();
                  saveState();
                  chatAddAgentStep(logWrapper, '✅', `Step ${i + 1}: created ${cfn}`);
                  stepApplied = true;
                } else {
                  chatAddAgentStep(logWrapper, '⏭️', `Step ${i + 1} skipped by user`);
                  stepApplied = true;
                }
              }

            } else if (action.type === 'APPEND_TO_FILE') {
              const afn = action.args[0] || targetFile;
              if (!state.files.hasOwnProperty(afn)) {
                lastRetryReason = `"${afn}" not found. Use CREATE_FILE to create it.`;
                chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: file not found${retryTag}`, 'warn');
              } else {
                let apply = true;
                if (needsConfirm) apply = await chatConfirmApply('WRITE_FILE', [afn], action.content);
                if (apply) {
                  const prev = state.files[afn];
                  agentWriteFile(afn, prev.endsWith('\n') ? prev + action.content : prev + '\n' + action.content);
                  chatAddAgentStep(logWrapper, '✅', `Step ${i + 1}: appended to ${afn}`);
                  stepApplied = true;
                } else {
                  chatAddAgentStep(logWrapper, '⏭️', `Step ${i + 1} skipped by user`);
                  stepApplied = true;
                }
              }

            } else {
              lastRetryReason = `Unexpected action "${action.type}". Use SEARCH_REPLACE, WRITE_CODE, WRITE_FILE, CREATE_FILE, or APPEND_TO_FILE.`;
              chatAddAgentStep(logWrapper, '⚠️', `Step ${i + 1}: unexpected "${action.type}"${retryTag}`, 'warn');
              if (attempt >= MAX_RETRIES) {
                chatAppendAi(`**Step ${i + 1} failed:** unexpected action "${action.type}"`);
              }
            }
          }
        }

        chatFinalizeAgentLog(logWrapper, true, stepCount);
        chatAppendAi('✅ All steps processed.');

      } catch (e) {
        chatFinalizeAgentLog(logWrapper, false, stepCount);
        if (e.message === 'RATE_LIMITED') {
          chatAddRateLimitWarning();
        } else {
          chatAppendAi(`Multi-agent error: ${e.message}`);
        }
      }
    }

    // ── Persistent chat history ───────────────────────────────────────
    const CHAT_HISTORY_KEY = 'mce_chat_history_v2';
    const HISTORY_MAX_STORED = 40;
    const HISTORY_MAX_CONTEXT = 8;

    let chatConversation = (function() {
      return [];
    })();

    function chatHistoryPush(role, content) {
      chatConversation.push({
        role,
        content
      });
      if (chatConversation.length > HISTORY_MAX_STORED) chatConversation.splice(0, chatConversation.length - HISTORY_MAX_STORED);
    }

    function chatHistoryClear() {
      chatConversation = [];
    }

    function chatHistoryContext() {
      return chatConversation.slice(-HISTORY_MAX_CONTEXT * 2);
    }

    // ── chatSend — routes to multi-agent, single agent, or regular chat ──
    async function chatSend() {
      const msg = chatInput.value.trim();
      if (!msg) return;

      // Block if API not configured
      if (!isApiConfigured()) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
        chatAppendUser(msg);
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-msg chat-msg-ai';
        wrapper.innerHTML = `
            <div class="chat-bubble chat-bubble-ai chat-md" style="border-color:#f59e0b55;">
              <strong>⚙️ API not configured</strong><br>
              Open the <button onclick="toggleChatAdvanced()" style="background:none;border:none;color:var(--accent);cursor:pointer;text-decoration:underline;padding:0;font-size:inherit;">Settings panel</button>
              and enter your Base URL and API Key to start chatting.
            </div>`;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Auto-open settings
        const adv = document.getElementById('chat-advanced');
        const btn = document.getElementById('chat-adv-toggle-btn');
        if (adv && adv.style.display !== 'block') {
          adv.style.display = 'block';
          btn?.classList.add('active');
        }
        return;
      }

      // Block immediately if rate limited
      if (aiRateLimited) {
        chatAppendUser(msg);
        chatAddRateLimitWarning();
        chatInput.value = '';
        return;
      }

      chatInput.value = '';
      chatInput.style.height = 'auto';
      chatAppendUser(msg);
      chatHistoryPush('user', msg);

      const sendBtn = document.getElementById('chat-send-btn');
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.5';

      try {
        if (document.getElementById('chat-agent-mode')?.checked) {
          const useMulti = document.getElementById('chat-agent-multi')?.checked;
          if (useMulti) {
            await multiAgentLoop(msg);
          } else {
            await agentLoop(msg);
          }
        } else {
          chatAppendTyping();
          const systemPrompt = document.getElementById('chat-system-prompt').value.trim() ||
            'You are a helpful coding assistant. Be concise and clear.';
          const maxTokens = parseInt(document.getElementById('chat-max-tokens').value) || 512;
          const temperature = parseFloat(document.getElementById('chat-temperature').value) ?? 0.7;
          const model = document.getElementById('chat-model').value;

          let userMessage = msg;
          if (document.getElementById('chat-include-code')?.checked) {
            const code = agentReadCode();
            if (code && code !== '(empty)') {
              const lines = code.split('\n').length;
              userMessage = `${msg}\n\n---\nCurrent file (${lines} lines):\n\`\`\`\n${code}\n\`\`\``;
            }
          }

          const historyMsgs = chatHistoryContext().slice(0, -1);
          const messages = [{
              role: 'system',
              content: systemPrompt
            },
            ...historyMsgs,
            {
              role: 'user',
              content: userMessage
            }
          ];

          const reply = await callAIRaw(messages, maxTokens, temperature, model);
          const replyText = reply || '(no response)';
          chatAppendAi(replyText);
          chatHistoryPush('assistant', replyText);
        }
      } catch (e) {
        if (e.message === 'RATE_LIMITED') {
          const typing = document.getElementById('chat-typing-indicator');
          if (typing) typing.remove();
          chatAddRateLimitWarning();
        } else {
          chatAppendAi('Error: ' + e.message);
        }
      } finally {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
      }
    }

    // Send on Enter, Shift+Enter for newline
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatSend();
      }
    });

    // Auto-resize textarea + character counter
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      const cnt = document.getElementById('chat-char-count');
      if (cnt) {
        const len = this.value.length;
        cnt.textContent = len > 0 ? len + ' chars' : '';
        cnt.className = len > 1500 ? 'visible warn' : len > 0 ? 'visible' : '';
      }
    });

    // Scroll FAB visibility
    chatMessages.addEventListener('scroll', function() {
      const fab = document.getElementById('chat-scroll-fab');
      if (fab) fab.classList.toggle('visible', chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight > 80);
    });
    // ── Inline Console ────────────────────────────────────────────────
    (function() {
      const panel = document.getElementById('console-panel');
      const output = document.getElementById('console-output');
      const runner = document.getElementById('console-runner');
      const badge = document.getElementById('console-badge');
      let conFilter = 'all';
      let conEntries = [];
      let errorCount = 0;

      function conEsc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function conTimestamp() {
        const d = new Date();
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0') + '.' + d.getMilliseconds().toString().padStart(3, '0');
      }

      function conRenderEntries() {
        if (!conEntries.length) {
          output.innerHTML = '<div class="con-empty">No output yet. Press Run to execute.</div>';
          return;
        }
        const filtered = conFilter === 'all' ? conEntries : conEntries.filter(e => e.type === conFilter);
        if (!filtered.length) {
          output.innerHTML = `<div class="con-empty">No ${conFilter} entries.</div>`;
          return;
        }
        output.innerHTML = filtered.map(e =>
          `<div class="con-entry con-${e.type}"><span class="con-time">${conEsc(e.time)}</span>${conEsc(e.text)}</div>`
        ).join('');
        output.scrollTop = output.scrollHeight;
      }

      function conAddEntry(type, text, time) {
        conEntries.push({
          type,
          text,
          time: time || conTimestamp()
        });
        if (type === 'error') {
          errorCount++;
          badge.textContent = errorCount > 9 ? '9+' : String(errorCount);
          badge.classList.add('show');
        }
        conRenderEntries();
      }

      function conClearBadge() {
        errorCount = 0;
        badge.textContent = '';
        badge.classList.remove('show');
      }

      window.toggleConsole = function() {
        const isOpen = panel.classList.toggle('open');
        if (isOpen) {
          conRenderEntries();
        }
      };

      window.conRun = function() {
        conEntries = [];
        conClearBadge();
        output.innerHTML = '<div class="con-empty">Running…</div>';

        // Get current code from the authoritative source
        const code = (typeof state !== 'undefined' && state.files && state.currentFile) ?
          (state.files[state.currentFile] || '') :
          (document.getElementById('editor')?.innerText || '');

        // Build sandbox attribute from settings
        let sandbox = 'allow-scripts allow-same-origin';
        if (document.getElementById('con-sb-forms')?.checked) sandbox += ' allow-forms';
        if (document.getElementById('con-sb-popups')?.checked) sandbox += ' allow-popups allow-popups-to-escape-sandbox';
        if (document.getElementById('con-sb-modals')?.checked) sandbox += ' allow-modals';
        if (document.getElementById('con-sb-storage')?.checked) sandbox += ' allow-storage-access-by-user-activation';
        runner.sandbox = sandbox;

        // Build a sandboxed page that intercepts console output and errors
        const consoleCapture = `
  <script>
  (function(){
    var _send = function(type, args) {
      var text = Array.from(args).map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
        return String(a);
      }).join(' ');
      parent.postMessage({__conLog: true, type: type, text: text}, '*');
    };
    ['log','info','debug','warn','error'].forEach(function(m) {
      var orig = console[m];
      console[m] = function() { _send(m === 'log' ? 'log' : m === 'debug' ? 'debug' : m === 'info' ? 'info' : m, arguments); orig && orig.apply(console, arguments); };
    });
    window.onerror = function(msg, src, line, col, err) {
      parent.postMessage({__conLog: true, type: 'error', text: 'Error: ' + msg + (line ? ' (line ' + line + ')' : '')}, '*');
      return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
      parent.postMessage({__conLog: true, type: 'error', text: 'Unhandled Promise: ' + (e.reason || e)}, '*');
    });
  })();
  <\/script>`;

        const srcdoc = code.replace('</head>', consoleCapture + '</head>') || (consoleCapture + code);
        runner.srcdoc = srcdoc;
      };

      window.conClear = function() {
        conEntries = [];
        conClearBadge();
        conRenderEntries();
      };

      window.conSetFilter = function(f) {
        conFilter = f;
        ['all', 'error', 'warn'].forEach(function(id) {
          const el = document.getElementById('con-filter-' + id);
          if (el) el.classList.toggle('active', id === f);
        });
        conRenderEntries();
      };

      // Listen for messages from the console iframe
      window.addEventListener('message', function(e) {
        if (!e.data || !e.data.__conLog) return;
        const typeMap = {
          log: 'log',
          info: 'info',
          debug: 'debug',
          warn: 'warn',
          error: 'error'
        };
        const type = typeMap[e.data.type] || 'log';
        conAddEntry(type, e.data.text);
      });
    })();

    (() => {
      const ENTRY = 'JavaScript Text Editor v8',
        KEY = 'Ion-o-koji Watermark';
      const logs = (localStorage.getItem(KEY) || "").split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line && line !== ENTRY);
      logs.push(ENTRY);
      localStorage.setItem(KEY, logs.map(item => `- ${item}`).join('\n'));
    })();

  
