import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { suggestProducts } from '../../api/catalog';
import { formatPrice } from '../../lib/format';

const MIN_CHARS = 2;
const DELAY_MS = 200;

/** Builds the list the shopper moves through with the arrow keys. */
const optionsFor = (result, term) => {
  if (!result) return [];
  const options = [
    ...result.products.map((p) => ({
      key: `p-${p.id}`,
      kind: 'product',
      to: `/products/${p.slug}`,
      label: p.name,
      detail: formatPrice(p.price),
      image: p.primary_image,
    })),
    ...result.categories.map((c) => ({
      key: `c-${c.slug}`,
      kind: 'category',
      to: `/shop/${c.slug}`,
      label: c.name,
      detail: 'Category',
    })),
    ...result.brands.map((b) => ({
      key: `b-${b.slug}`,
      kind: 'brand',
      to: `/shop?brand=${encodeURIComponent(b.slug)}`,
      label: b.name,
      detail: 'Brand',
    })),
  ];
  options.push({
    key: 'all',
    kind: 'all',
    to: `/shop?search=${encodeURIComponent(term)}`,
    label: `See all results for "${term}"`,
  });
  return options;
};

/**
 * Header search with suggestions as you type (#191, FR-001): a WAI-ARIA combobox. Arrow keys
 * move through products, categories and brands; Enter opens the highlighted one or searches.
 */
export function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const listId = useId();
  const [query, setQuery] = useState(params.get('search') || '');
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  const term = query.trim();
  const options = term.length >= MIN_CHARS ? optionsFor(result, term) : [];
  const showList = open && options.length > 0;

  useEffect(() => {
    if (term.length < MIN_CHARS) {
      setResult(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestProducts(term, { signal: controller.signal })
        .then((data) => {
          setResult(data);
          setActive(-1);
        })
        .catch(() => {}); // suggestions are a convenience; the full search still works
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  useEffect(() => {
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to) => {
    setOpen(false);
    setActive(-1);
    navigate(to);
  };

  const submit = (event) => {
    event.preventDefault();
    if (showList && active >= 0) {
      go(options[active].to);
      return;
    }
    go(term ? `/shop?search=${encodeURIComponent(term)}` : '/shop');
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (options.length ? (i + 1) % options.length : -1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => {
        if (!options.length) return -1;
        return i <= 0 ? options.length - 1 : i - 1;
      });
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="search-box" ref={boxRef}>
      <form className="search" role="search" onSubmit={submit}>
        <label htmlFor="site-search" className="visually-hidden">
          Search products
        </label>
        <input
          id="site-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="Search batik, sarees, linen…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="search__button" aria-label="Search">
          <Search size={18} aria-hidden="true" />
        </button>
      </form>
      <ul
        id={listId}
        role="listbox"
        aria-label="Search suggestions"
        className="search-suggest"
        hidden={!showList}
      >
        {options.map((option, index) => (
          <li
            key={option.key}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={`search-suggest__item search-suggest__item--${option.kind} ${
              index === active ? 'is-active' : ''
            }`}
            // mousedown keeps focus in the input; click would blur it first
            onMouseDown={(e) => {
              e.preventDefault();
              go(option.to);
            }}
            onMouseEnter={() => setActive(index)}
          >
            {option.kind === 'product' &&
              (option.image ? (
                <img src={option.image} alt="" className="search-suggest__thumb" />
              ) : (
                <span className="search-suggest__thumb" aria-hidden="true" />
              ))}
            <span className="search-suggest__label">{option.label}</span>
            {option.detail && <span className="search-suggest__detail">{option.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
