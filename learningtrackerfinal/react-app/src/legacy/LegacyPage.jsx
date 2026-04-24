import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const externalScriptCache = new Map();

const isExternal = (src = '') => /^(https?:)?\/\//i.test(src);

const resolveScriptSrc = (src = '') => {
  if (!src) return '';
  if (isExternal(src)) return src;
  const normalized = src.replace(/^\.\//, '').replace(/^\/+/, '');
  return `/legacy/${normalized}`;
};

const loadExternalScript = async (src) => {
  if (!src) return;
  if (externalScriptCache.has(src)) {
    const status = externalScriptCache.get(src);
    if (status === 'loaded') return;
    await status;
    return;
  }

  const loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      externalScriptCache.set(src, 'loaded');
      resolve();
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });

  externalScriptCache.set(src, loader);
  await loader;
};

const htmlLinkToRoute = (href) => {
  if (!href || typeof href !== 'string') return null;
  if (href.startsWith('#')) return null;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (isExternal(href)) return null;
  const url = new URL(href, window.location.origin);
  if (!url.pathname.endsWith('.html')) return null;
  const base = url.pathname.split('/').pop().replace('.html', '');
  const path = base === 'index' ? '/' : `/${base}`;
  const search = url.search || '';
  const hash = url.hash || '';
  return `${path}${search}${hash}`;
};

const dispatchDomReady = () => {
  document.dispatchEvent(new Event('DOMContentLoaded'));
};

const LegacyPage = ({ html, title }) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const scripts = Array.from(doc.querySelectorAll('script'));
    scripts.forEach((node) => node.parentNode?.removeChild(node));

    const derivedTitle = title || doc.title;
    if (derivedTitle) {
      document.title = derivedTitle;
    }

    const childNodes = Array.from(doc.body.childNodes);
    childNodes.forEach((node) => {
      container.appendChild(node.cloneNode(true));
    });

    const anchors = Array.from(container.querySelectorAll('a[href]'));
    const handleInternalNavigation = (event) => {
      const route = event.currentTarget.getAttribute('data-react-route');
      if (!route) return;
      event.preventDefault();
      navigate(route);
    };

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      const route = htmlLinkToRoute(href);
      if (route) {
        anchor.setAttribute('href', route);
        anchor.setAttribute('data-react-route', route);
        anchor.addEventListener('click', handleInternalNavigation);
      }
    });

    const formsWithActions = Array.from(container.querySelectorAll('form[action]'));
    formsWithActions.forEach((form) => {
      const action = form.getAttribute('action');
      const route = htmlLinkToRoute(action);
      if (route) {
        // Keep route info for future SPA handling but prevent browser navigation.
        form.dataset.reactRoute = route;
        form.setAttribute('action', '#');
      }
    });

    const runScriptsSequentially = async () => {
      for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src) {
          try {
            await loadExternalScript(resolveScriptSrc(src));
          } catch (error) {
            console.warn('Failed to load legacy script', src, error);
          }
        } else if ((script.textContent || '').trim().length) {
          const inlineScript = document.createElement('script');
          inlineScript.text = script.textContent;
          container.appendChild(inlineScript);
        }
      }

      // Re-dispatch DOMContentLoaded so legacy scripts can initialize.
      dispatchDomReady();
    };

    runScriptsSequentially();

    return () => {
      anchors.forEach((anchor) => {
        if (anchor.hasAttribute('data-react-route')) {
          anchor.removeEventListener('click', handleInternalNavigation);
        }
      });
      container.innerHTML = '';
    };
  }, [html, title, navigate, location.pathname, location.search]);

  return <div ref={containerRef} />;
};

export default LegacyPage;

