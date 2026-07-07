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
        this.showAddToCartModal(product, quantity);
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

    showAddToCartModal(product, quantity) {
        // Remove existing modal if any
        const existing = document.getElementById('add-to-cart-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'add-to-cart-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300';
        
        const box = document.createElement('div');
        box.className = 'bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center relative mx-4';
        
        box.innerHTML = `
            <button id="modal-close-x" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="mx-auto w-16 h-16 bg-teal-50 text-teal-clinical rounded-full flex items-center justify-center mb-4 shadow-inner">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 class="text-2xl font-bold text-navy-blue mb-4">Added to Cart!</h2>
            
            <div class="flex items-center gap-4 bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-100">
                <img src="${product.image || 'image-1.png'}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md bg-white border border-gray-200">
                <div>
                    <h3 class="font-bold text-navy-blue text-sm line-clamp-2">${product.name}</h3>
                    <p class="text-teal-clinical font-bold mt-1">${formatCurrency(product.price)} <span class="text-xs text-slate-gray font-normal">x ${quantity}</span></p>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
                <button id="modal-continue-btn" class="flex-1 py-3 px-4 bg-white border-2 border-teal-clinical text-teal-clinical rounded-md font-bold hover:bg-teal-50 transition-colors">
                    Continue Shopping
                </button>
                <button id="modal-checkout-btn" class="flex-1 py-3 px-4 bg-teal-clinical text-white rounded-md font-bold shadow-lg hover:bg-teal-hover transition-colors">
                    View Cart & Checkout
                </button>
            </div>
        `;
        
        modal.appendChild(box);
        document.body.appendChild(modal);

        document.getElementById('modal-close-x').onclick = () => modal.remove();
        document.getElementById('modal-continue-btn').onclick = () => modal.remove();
        document.getElementById('modal-checkout-btn').onclick = () => {
            window.location.href = 'checkout.html';
        };
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
                p.className = 'text-slate-gray text-sm flex-grow line-clamp-3';
                p.title = group.description || ''; // Show full description on hover
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

// ==========================================
// Customer Reviews Injector
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('reviews-track');
    if (!track) return;

    const reviews = [
        { name: "Robert H.", role: "Funeral Director", text: "The heavy-duty mortuary cot we ordered is incredibly well built. Highly recommend Royal." },
        { name: "Sarah M.", role: "Operations Manager", text: "Shipping was fast and the quality of the prep room tables is unmatched for the price point." },
        { name: "David T.", role: "Owner", text: "Maxwell was extremely helpful in answering our questions. We will be ordering exclusively from them." },
        { name: "Jennifer K.", role: "Lead Embalmer", text: "Finally found a reliable supplier for clinical disposables. Consistent quality and great service." },
        { name: "Michael C.", role: "Transport Specialist", text: "The flexible stretchers have made our removals so much easier. Durable and easy to clean." },
        { name: "Thomas R.", role: "Funeral Home Owner", text: "Exceptional customer service. The church trucks we received look highly professional and dignified." },
        { name: "Amanda B.", role: "Care Center Director", text: "Their bariatric equipment is best-in-class. Very sturdy and gives our staff confidence." },
        { name: "James L.", role: "Mortician", text: "Smooth transactions and fast freight. The stainless steel tables arrived in perfect condition." },
        { name: "William S.", role: "Facility Manager", text: "Great return policy, though we've never had to use it. Everything arrives exactly as described." },
        { name: "Elizabeth P.", role: "Procurement", text: "Pricing is very competitive for B2B. The invoicing process is seamless and very professional." },
        { name: "Richard D.", role: "Owner/Director", text: "I appreciate the 24/7 support. Had an urgent order need and they fulfilled it immediately." },
        { name: "Joseph E.", role: "Crematory Operator", text: "The body bags are thick, reliable, and exactly what we need for our daily operations." },
        { name: "Daniel W.", role: "Logistics", text: "Freight tracking was accurate. The equipment was crated perfectly to avoid any damage." },
        { name: "Lisa F.", role: "Funeral Director", text: "The dressing tables fold easily and store neatly. Great space-savers for our prep room." },
        { name: "Paul G.", role: "Manager", text: "I love the new site design! Ordering is much easier now and the product catalog is extensive." },
        { name: "Mark V.", role: "Owner", text: "Royal Funeral Supplies understands what we do. They are partners, not just vendors." },
        { name: "Steven A.", role: "Embalmer", text: "The fluid collection systems we bought here work flawlessly. High clinical standards." },
        { name: "Kevin N.", role: "Transport Co. Owner", text: "We equip our entire fleet with their cots. They hold up great to daily heavy use." },
        { name: "Brian Y.", role: "Operations", text: "Solid urn vaults and great presentation items. The quality reflects well on our business." },
        { name: "Jason O.", role: "Director", text: "Honestly the best supplier we've used in 15 years. Maxwell knows the industry inside out." }
    ];

    // Function to generate the HTML for a single review card
    const createReviewCard = (review) => {
        return `
            <div class="inline-block w-80 md:w-96 p-6 mx-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm whitespace-normal align-top">
                <div class="flex text-yellow-400 mb-3">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </div>
                <p class="text-slate-gray italic mb-4 leading-relaxed line-clamp-3">"${review.text}"</p>
                <div class="flex items-center mt-auto">
                    <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-navy-blue rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 text-sm">
                        ${review.name.charAt(0)}
                    </div>
                    <div>
                        <p class="font-bold text-navy-blue text-sm">${review.name}</p>
                        <p class="text-xs text-slate-500 uppercase tracking-wider">${review.role}</p>
                    </div>
                </div>
            </div>
        `;
    };

    const cardsHtml = reviews.map(createReviewCard).join('');
    // We duplicate the cards twice to ensure smooth infinite scrolling without a visible jump
    track.innerHTML = cardsHtml + cardsHtml;
});

