/**
 * Merch Page - Fourthwall Integration
 * Fetches products from Fourthwall Storefront API
 */

const FOURTHWALL_CONFIG = {
  token: import.meta.env.VITE_FOURTHWALL_TOKEN || '',
  baseUrl: 'https://storefront-api.fourthwall.com/v1',
  shopUrl: 'https://merge-combinator-shop.fourthwall.com',
  currency: 'USD'
};

function formatPrice(priceObj) {
  if (!priceObj) return '';
  const value = priceObj.value !== undefined ? priceObj.value : priceObj;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: priceObj.currency || 'USD'
  }).format(value);
}

function getProductCategory(product) {
  const name = (product.name || '').toLowerCase();
  if (name.includes('cap') || name.includes('hat')) return 'Headwear';
  if (name.includes('coffee')) return 'Coffee';
  if (name.includes('mug')) return 'Drinkware';
  if (name.includes('sticker')) return 'Stickers';
  return 'Apparel';
}

function getProductImage(product) {
  if (product.images && product.images.length > 0) {
    return product.images[0].url || product.images[0].transformedUrl;
  }
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[0];
    if (variant.images && variant.images.length > 0) {
      return variant.images[0].url || variant.images[0].transformedUrl;
    }
  }
  return null;
}

function getProductPrice(product) {
  if (product.variants && product.variants.length > 0) {
    return product.variants[0].unitPrice;
  }
  return product.price || null;
}

function getProductUrl(product) {
  const slug = product.slug || product.handle || '';
  return `${FOURTHWALL_CONFIG.shopUrl}/products/${slug}`;
}

function renderProduct(product) {
  const imageUrl = getProductImage(product);
  const price = getProductPrice(product);
  const category = getProductCategory(product);
  const productUrl = getProductUrl(product);

  return `
    <article class="merch-card">
      <div class="merch-card__image">
        ${imageUrl
          ? `<img src="${imageUrl}" alt="${product.name}" loading="lazy">`
          : `<span class="merch-card__image-placeholder">📦</span>`
        }
      </div>
      <div class="merch-card__content">
        <div class="merch-card__category">${category}</div>
        <h3 class="merch-card__name">${product.name}</h3>
        <div class="merch-card__price">${price ? formatPrice(price) : 'View for price'}</div>
        <a href="${productUrl}" target="_blank" rel="noopener" class="merch-card__link">
          View Product →
        </a>
      </div>
    </article>
  `;
}

function renderError(message) {
  return `
    <div class="merch-error" style="grid-column: 1 / -1;">
      <p>${message}</p>
      <a href="${FOURTHWALL_CONFIG.shopUrl}" target="_blank" rel="noopener" class="merch-card__link" style="margin-top: 16px;">
        Visit Store Directly →
      </a>
    </div>
  `;
}

async function fetchProducts() {
  const url = `${FOURTHWALL_CONFIG.baseUrl}/collections/all/products?storefront_token=${FOURTHWALL_CONFIG.token}&currency=${FOURTHWALL_CONFIG.currency}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();
  return data.results || data.products || [];
}

async function initMerch() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // If no token configured, show static fallback
  if (!FOURTHWALL_CONFIG.token) {
    grid.innerHTML = renderError('Visit our store to browse all products.');
    return;
  }

  try {
    const products = await fetchProducts();

    if (products.length === 0) {
      grid.innerHTML = renderError('No products available at the moment.');
      return;
    }

    grid.innerHTML = products.map(renderProduct).join('');
  } catch (error) {
    console.error('Failed to fetch products:', error);
    grid.innerHTML = renderError('Unable to load products. Please visit our store directly.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMerch);
} else {
  initMerch();
}
