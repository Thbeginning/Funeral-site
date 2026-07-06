// main.js - Core State & UI Logic

// State Management for Cart
class CartManager {
    constructor() {
        this.cartKey = 'royal_cart';
        this.cart = this.loadCart();
        this.updateCartUI();
    }

    loadCart() {
        try {
            const data = localStorage.getItem(this.cartKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
            this.updateCartUI();
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }

    addItem(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                tier: product.tier,
                image: product.image,
                quantity: quantity
            });
        }
        this.saveCart();
        this.showToast('Item added to cart.');
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    hasTier2Items() {
        return this.cart.some(item => item.tier === 2);
    }

    updateCartUI() {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            countElement.textContent = this.getCartCount();
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-teal-clinical text-white px-6 py-3 rounded shadow-lg z-50 transform transition-all duration-300 translate-y-0 opacity-100';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => {
                if(document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Global utilities
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Initialize Cart
window.cartManager = new CartManager();

// Mobile Menu & Dynamic Index Categories
document.addEventListener('DOMContentLoaded', async () => {
    const mobileBtn = document.querySelector('button.md\\:hidden');
    const navLinks = document.querySelector('.hidden.md\\:flex');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('hidden');
            navLinks.classList.toggle('flex');
            navLinks.classList.toggle('flex-col');
            navLinks.classList.toggle('absolute');
            navLinks.classList.toggle('top-16');
            navLinks.classList.toggle('left-0');
            navLinks.classList.toggle('w-full');
            navLinks.classList.toggle('bg-white');
            navLinks.classList.toggle('shadow-md');
            navLinks.classList.toggle('p-4');
            navLinks.classList.toggle('space-y-4');
            navLinks.classList.toggle('space-x-8');
            
            const links = navLinks.querySelectorAll('a');
            links.forEach(link => link.classList.toggle('ml-0'));
        });
    }

    // Load categories on index.html dynamically
    const groupsGrid = document.getElementById('groups-grid');
    if (groupsGrid && window.dbManager) {
        try {
            const groups = await window.dbManager.getGroups();
            groupsGrid.replaceChildren(); // clear loader
            
            if (!groups || groups.length === 0) {
                const noData = document.createElement('p');
                noData.className = 'text-slate-gray col-span-full text-center';
                noData.textContent = 'No categories found.';
                groupsGrid.appendChild(noData);
                return;
            }

            groups.forEach(group => {
                const a = document.createElement('a');
                a.href = `products.html?category=${group.slug}`;
                // Fixed width card that snaps in the horizontal carousel
                a.className = 'group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex-shrink-0 snap-start flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1';
                a.style.width = 'min(300px, 80vw)'; // responsive: 300px on desktop, 80% width on mobile

                const imgDiv = document.createElement('div');
                imgDiv.className = 'h-48 bg-gray-100 overflow-hidden';
                const img = document.createElement('img');
                img.src = group.image_url || '';
                img.alt = group.name;
                img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500';
                imgDiv.appendChild(img);

                const content = document.createElement('div');
                content.className = 'p-5 flex-grow flex flex-col';
                
                const h3 = document.createElement('h3');
                h3.className = 'text-base font-bold mb-1 text-navy-blue group-hover:text-teal-clinical transition-colors';
                h3.textContent = group.name;
                
                const p = document.createElement('p');
                p.className = 'text-slate-gray text-sm flex-grow';
                p.textContent = group.description || '';
                
                const arrow = document.createElement('div');
                arrow.className = 'mt-3 flex items-center text-teal-clinical text-sm font-semibold';
                arrow.innerHTML = 'Browse Products <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';

                content.appendChild(h3);
                content.appendChild(p);
                content.appendChild(arrow);

                a.appendChild(imgDiv);
                a.appendChild(content);

                groupsGrid.appendChild(a);
            });
        } catch(e) {
            console.error(e);
            groupsGrid.innerHTML = '<p class="text-red-500 col-span-full text-center">Failed to load categories.</p>';
        }
    }
});
