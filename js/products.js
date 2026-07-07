// products.js - Product Data and Rendering Logic

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('product-grid');
    const categoryList = document.getElementById('category-list');
    if (!productGrid || !window.dbManager) return; // Only run on products.html

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');

    // 1. Fetch & Render Categories Sidebar
    try {
        const groups = await window.dbManager.getGroups();
        if (categoryList) {
            // Keep the "All Products" link
            const firstChild = categoryList.firstElementChild;
            categoryList.replaceChildren(firstChild);

            groups.forEach(group => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `products.html?category=${group.slug}`;
                
                // Highlight active category
                if (categoryFilter === group.slug) {
                    a.className = 'text-teal-clinical font-bold transition-colors';
                    // Update header with category details
                    const headerTitle = document.getElementById('page-header-title');
                    const headerDesc = document.getElementById('page-header-desc');
                    if (headerTitle) headerTitle.textContent = group.name;
                    if (headerDesc) headerDesc.textContent = group.description || `Browse our selection of ${group.name}.`;
                } else {
                    a.className = 'text-slate-gray hover:text-teal-clinical transition-colors';
                }
                a.textContent = group.name;
                li.appendChild(a);
                categoryList.appendChild(li);
            });
        }
    } catch(e) {
        console.error("Error loading categories sidebar", e);
    }

    // 2. Fetch & Render Products Grid
    try {
        const products = await window.dbManager.getProducts(categoryFilter);
        renderProducts(products, productGrid);
    } catch(e) {
        console.error("Error loading products", e);
        productGrid.innerHTML = '<p class="text-red-500 col-span-full text-center py-12">Failed to load products. Please check database connection.</p>';
    }
});

function renderProducts(products, container) {
    container.replaceChildren(); // Secure clear

    if (!products || products.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'text-slate-gray text-center col-span-full py-12';
        noResults.textContent = 'No products found in this category.';
        container.appendChild(noResults);
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover-lift flex flex-col';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'h-56 bg-gray-100 overflow-hidden relative';

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        img.className = 'w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500';

        if (product.tier === 2) {
            const badge = document.createElement('span');
            badge.className = 'absolute top-3 right-3 bg-navy-blue text-white text-xs font-bold px-2 py-1 rounded shadow';
            badge.textContent = 'Freight Shipping';
            imgContainer.appendChild(badge);
        }

        imgContainer.appendChild(img);

        const content = document.createElement('div');
        content.className = 'p-6 flex-grow flex flex-col';

        const title = document.createElement('h3');
        title.className = 'text-xl font-bold mb-2 text-navy-blue';
        title.textContent = product.name;

        const desc = document.createElement('p');
        desc.className = 'text-slate-gray text-sm mb-4 flex-grow line-clamp-3';
        desc.title = product.description; // show on hover just in case
        desc.textContent = product.description;

        const priceRow = document.createElement('div');
        priceRow.className = 'flex justify-between items-center mt-auto pt-4 border-t border-gray-100';

        const price = document.createElement('span');
        price.className = 'text-2xl font-bold text-teal-clinical';
        price.textContent = formatCurrency(product.price);

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary px-4 py-2 rounded text-sm font-semibold';
        addBtn.textContent = 'Add to Cart';
        
        addBtn.addEventListener('click', () => {
            if (window.cartManager) {
                window.cartManager.addItem(product);
            }
        });

        priceRow.appendChild(price);
        priceRow.appendChild(addBtn);

        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(priceRow);

        card.appendChild(imgContainer);
        card.appendChild(content);

        container.appendChild(card);
    });
}
