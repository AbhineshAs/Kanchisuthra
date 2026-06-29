// Kanchisuthra Theme JS - theme.js

document.addEventListener('DOMContentLoaded', function () {

  // ── AOS (Animate on Scroll) ─────────────────────────────
  if (window.AOS) {
    AOS.init({ once: true, duration: 700, easing: 'ease-out' });
  }

  // ── Sticky Header on Scroll ─────────────────────────────
  var header = document.getElementById('SiteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, { passive: true });
  }

  // ── Mobile Menu Toggle ──────────────────────────────────
  var mobileToggle = document.getElementById('MobileMenuToggle');
  var mobileMenu   = document.getElementById('MobileMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('header__mobile-menu--open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });
  }

  // ── Cart Drawer ─────────────────────────────────────────
  var cartToggle = document.querySelector('[data-cart-toggle]');
  var cartDrawer = document.querySelector('.cart-drawer');
  var cartClose  = document.querySelector('[data-cart-close]');
  var cartOverlay = document.querySelector('.cart-drawer__overlay');

  function openCart() {
    if (cartDrawer) cartDrawer.classList.add('cart-drawer--open');
  }
  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove('cart-drawer--open');
  }

  if (cartToggle) cartToggle.addEventListener('click', function (e) { e.preventDefault(); openCart(); });
  if (cartClose)  cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // ── Wishlist (localStorage) ─────────────────────────────
  var wishlist = JSON.parse(localStorage.getItem('kanchi_wishlist') || '[]');

  function updateWishlistUI() {
    document.querySelectorAll('[data-wishlist-toggle]').forEach(function (btn) {
      var id = btn.getAttribute('data-product-id');
      if (id && wishlist.indexOf(id) !== -1) {
        btn.classList.add('wishlist--active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('wishlist--active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  updateWishlistUI();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-product-id');
    if (!id) return;
    var idx = wishlist.indexOf(id);
    if (idx === -1) { wishlist.push(id); } else { wishlist.splice(idx, 1); }
    localStorage.setItem('kanchi_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  });

  // ── Predictive Search ───────────────────────────────────
  var searchInput = document.getElementById('SearchInput');
  var searchResults = document.getElementById('SearchResults');
  if (searchInput && searchResults) {
    var searchTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var q = searchInput.value.trim();
      if (q.length < 2) { searchResults.innerHTML = ''; searchResults.hidden = true; return; }
      searchTimer = setTimeout(function () {
        fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var products = data.resources.results.products || [];
            if (!products.length) { searchResults.innerHTML = '<p class="search-results__empty">No results found.</p>'; searchResults.hidden = false; return; }
            searchResults.innerHTML = products.map(function (p) {
              return '<a href="' + p.url + '" class="search-results__item">' +
                '<img src="' + p.featured_image.url + '" alt="' + p.title + '" width="50" height="50" loading="lazy">' +
                '<span>' + p.title + '</span>' +
                '<span class="search-results__price">' + p.price + '</span>' +
              '</a>';
            }).join('');
            searchResults.hidden = false;
          });
      }, 300);
    });

    document.addEventListener('click', function (e) {
      if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.hidden = true;
      }
    });
  }

  // ── Add-to-Cart (AJAX) ──────────────────────────────────
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[data-add-to-cart-btn]');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ quantity: parseInt(form.querySelector('[name="quantity"]')?.value || 1, 10), id: parseInt(form.querySelector('[name="id"]').value, 10) }] })
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      return fetch('/cart.js');
    })
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      var count = document.getElementById('CartCount');
      if (count) count.textContent = cart.item_count;
      if (btn) { btn.disabled = false; btn.textContent = 'Added!'; setTimeout(function () { btn.textContent = originalText; }, 2000); }
      openCart();
    })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    });
  });

  // ── Lazy load images with data-src ─────────────────────
  if ('IntersectionObserver' in window) {
    var imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
          imgObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(function (img) { imgObserver.observe(img); });
  }

});
