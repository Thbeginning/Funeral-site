// checkout.js - Checkout Logic & Order Processing with DB Save

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
            cartContainer.innerHTML = '<p class="text-slate-gray text-center py-8">Your cart is empty. <a href="products.html" class="text-teal-clinical font-bold underline">Browse Products</a></p>';
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
            itemInfo.className = 'flex-grow pr-4';
            const itemName = document.createElement('h4');
            itemName.className = 'font-bold text-navy-blue text-sm';
            itemName.textContent = item.name;

            const itemQty = document.createElement('p');
            itemQty.className = 'text-xs text-slate-gray mt-1';
            itemQty.textContent = `Qty: ${item.quantity} × ${formatCurrency(item.price)}`;

            if (item.tier === 2) {
                const tierBadge = document.createElement('span');
                tierBadge.className = 'inline-block mt-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium';
                tierBadge.textContent = '🚚 Freight Item';
                itemInfo.appendChild(tierBadge);
            }

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemQty);

            const itemTotal = document.createElement('div');
            itemTotal.className = 'font-bold text-teal-clinical flex-shrink-0 text-sm';
            itemTotal.textContent = formatCurrency(item.price * item.quantity);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'ml-3 text-red-400 hover:text-red-600 text-xs focus:outline-none transition-colors flex-shrink-0';
            removeBtn.textContent = '✕';
            removeBtn.setAttribute('aria-label', 'Remove item');
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

        if (hasTier2) {
            checkoutBtn.textContent = 'Request Quote & Submit Order';
            checkoutNotice.classList.remove('hidden');
        } else {
            checkoutBtn.textContent = 'Place Order';
            checkoutNotice.classList.add('hidden');
        }
    }

    // ---- Form Submission ----
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (window.cartManager.cart.length === 0) {
                showAlert('Your cart is empty. Please add items before checking out.');
                return;
            }

            // Client-side Validation
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            const zip = document.getElementById('zip').value.trim();
            const company = document.getElementById('company').value.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;

            if (!emailRegex.test(email)) {
                showAlert('Please enter a valid email address.');
                return;
            }
            if (!phoneRegex.test(phone)) {
                showAlert('Please enter a valid phone number.');
                return;
            }

            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            const cart = window.cartManager.cart;
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const hasTier2 = cart.some(item => item.tier === 2);
            const orderId = 'RFS-' + Math.random().toString(36).substr(2, 7).toUpperCase();

            // Show Processing State
            const originalBtnText = checkoutBtn.textContent;
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Processing...';

            try {
                // Save order to database
                const orderData = {
                    id: orderId,
                    customer_name: `${firstName} ${lastName}`,
                    email,
                    phone,
                    company,
                    address,
                    city,
                    state,
                    zip,
                    total_amount: total,
                    payment_method: paymentMethod,
                    status: 'pending',
                    items: JSON.stringify(cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price }))),
                    created_at: new Date().toISOString()
                };

                await window.dbManager.saveOrder(orderData);

                // Show Success Modal
                showSuccessModal(orderId, paymentMethod, hasTier2, email);

            } catch (err) {
                console.error('Order save error:', err);
                // Even if DB save fails, still confirm the order to the customer
                showSuccessModal(orderId, paymentMethod, hasTier2, email);
            }
        });
    }

    function showAlert(msg) {
        const existing = document.getElementById('checkout-alert');
        if (existing) existing.remove();
        const alert = document.createElement('div');
        alert.id = 'checkout-alert';
        alert.className = 'bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4';
        alert.textContent = msg;
        checkoutForm.prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    function getPaymentDetails(method) {
        const details = {
            'Bank Transfer': 'Our team will email you the ACH/Wire routing and account number within 1 business day.',
            'Zelle': 'Payment can be sent via Zelle to <strong>contact@muhameddispo.com</strong>. Our team will confirm receipt.',
            'CashApp': 'Payment can be sent via CashApp to <strong>$RoyalFuneralSupplies</strong>. Our team will confirm receipt.',
            'Crypto': 'Our team will email you the BTC/ETH wallet address for your payment within 1 business day.'
        };
        return details[method] || 'Our team will contact you with payment instructions shortly.';
    }

    function showSuccessModal(orderId, paymentMethod, hasTier2, email) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm';

        const box = document.createElement('div');
        box.className = 'bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center';

        box.innerHTML = `
            <div class="mx-auto w-20 h-20 bg-teal-50 text-teal-clinical rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 class="text-2xl font-bold text-navy-blue mb-2">${hasTier2 ? 'Quote Request Received!' : 'Order Placed Successfully!'}</h2>
            <p class="text-slate-gray mb-4">Thank you for your order. Your Reference ID is:</p>
            <div class="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 inline-block mb-6">
                <span class="text-2xl font-mono font-bold text-teal-clinical tracking-widest">${orderId}</span>
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left mb-6">
                <p class="text-sm font-bold text-navy-blue mb-1">💳 ${paymentMethod} Payment Instructions</p>
                <p class="text-sm text-slate-gray">${getPaymentDetails(paymentMethod)}</p>
            </div>
            <p class="text-xs text-slate-400 mb-6">A confirmation will be sent to <strong>${email}</strong>. If you don't hear from us within 24 hours, please contact us at contact@muhameddispo.com.</p>
            <button id="modal-close-btn" class="btn-primary w-full py-3 rounded-md font-bold text-base">Return to Home</button>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        document.getElementById('modal-close-btn').onclick = () => {
            window.cartManager.clearCart();
            window.location.href = 'index.html';
        };
    }
});

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
