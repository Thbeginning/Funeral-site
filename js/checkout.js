// checkout.js - Checkout Logic and Mock Order Processing

document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('checkout-cart-items');
    const cartTotalElement = document.getElementById('checkout-total');
    const checkoutBtn = document.getElementById('submit-order-btn');
    const checkoutNotice = document.getElementById('checkout-notice');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!cartContainer || !window.cartManager) return; // Only run on checkout page

    renderCartItems();

    function renderCartItems() {
        const cart = window.cartManager.cart;
        cartContainer.replaceChildren(); // Secure clear

        if (cart.length === 0) {
            cartContainer.innerHTML = '<p class="text-slate-gray text-center py-8">Your cart is empty.</p>';
            cartTotalElement.textContent = '$0.00';
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        let total = 0;
        let hasTier2 = false;

        cart.forEach(item => {
            total += item.price * item.quantity;
            if (item.tier === 2) hasTier2 = true;

            const row = document.createElement('div');
            row.className = 'flex justify-between items-center py-4 border-b border-gray-100 last:border-0';

            const itemInfo = document.createElement('div');
            const itemName = document.createElement('h4');
            itemName.className = 'font-bold text-navy-blue';
            itemName.textContent = item.name;
            
            const itemQty = document.createElement('p');
            itemQty.className = 'text-sm text-slate-gray';
            itemQty.textContent = `Qty: ${item.quantity} x ${formatCurrency(item.price)}`;
            
            if (item.tier === 2) {
                const tierBadge = document.createElement('span');
                tierBadge.className = 'inline-block mt-1 bg-gray-200 text-slate-gray text-xs px-2 py-1 rounded';
                tierBadge.textContent = 'Freight Item';
                itemQty.appendChild(document.createElement('br'));
                itemQty.appendChild(tierBadge);
            }

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemQty);

            const itemTotal = document.createElement('div');
            itemTotal.className = 'font-bold text-teal-clinical';
            itemTotal.textContent = formatCurrency(item.price * item.quantity);

            // Remove Button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'ml-4 text-red-500 hover:text-red-700 text-sm focus:outline-none';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                window.cartManager.removeItem(item.id);
                renderCartItems();
            };

            const rightSide = document.createElement('div');
            rightSide.className = 'flex items-center';
            rightSide.appendChild(itemTotal);
            rightSide.appendChild(removeBtn);

            row.appendChild(itemInfo);
            row.appendChild(rightSide);
            cartContainer.appendChild(row);
        });

        cartTotalElement.textContent = formatCurrency(total);

        // 2-Tier Logic Updates
        if (hasTier2) {
            checkoutBtn.textContent = 'Request Custom Shipping & Order Quote';
            checkoutNotice.classList.remove('hidden');
        } else {
            checkoutBtn.textContent = 'Place Order';
            checkoutNotice.classList.add('hidden');
        }
    }

    // Form Submission & Validation Logic
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (window.cartManager.cart.length === 0) {
                alert('Cart is empty.');
                return;
            }

            // Client-side Validation
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            
            // Basic regex checks
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/; // Simple phone regex

            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            if (!phoneRegex.test(phone)) {
                alert('Please enter a valid phone number.');
                return;
            }

            // Generate Quote ID
            const quoteId = 'ESC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const hasTier2 = window.cartManager.hasTier2Items();
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

            // Mock Processing Simulation
            const originalBtnText = checkoutBtn.textContent;
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<div class="spinner inline-block mr-2"></div> Processing...';

            setTimeout(() => {
                // Secure Modal Injection
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center transform scale-100 transition-transform duration-300';
                
                const checkIcon = document.createElement('div');
                checkIcon.className = 'mx-auto w-16 h-16 bg-teal-100 text-teal-clinical rounded-full flex items-center justify-center mb-6';
                checkIcon.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                
                const title = document.createElement('h2');
                title.className = 'text-2xl font-bold text-navy-blue mb-2';
                title.textContent = hasTier2 ? 'Quote Request Received!' : 'Order Placed Successfully!';
                
                const msg = document.createElement('p');
                msg.className = 'text-slate-gray mb-6';
                msg.textContent = `Your Reference ID is: ${quoteId}. Our team will email you shortly with your finalized manual shipping invoice and secure ${paymentMethod} payment account details.`;
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'btn-primary w-full py-3 rounded-md font-bold';
                closeBtn.textContent = 'Return to Home';
                closeBtn.onclick = () => {
                    window.cartManager.clearCart();
                    window.location.href = 'index.html';
                };
                
                modalContent.appendChild(checkIcon);
                modalContent.appendChild(title);
                modalContent.appendChild(msg);
                modalContent.appendChild(closeBtn);
                modal.appendChild(modalContent);
                
                document.body.appendChild(modal);
                
            }, 1500); // Simulate network delay
        });
    }
});
