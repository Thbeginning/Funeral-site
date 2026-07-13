// checkout.js - Checkout Logic, DB Save & Email Invoice System
// Waits for cartManager to be ready before initialising

function initCheckout() {
    const cartContainer = document.getElementById('checkout-cart-items');
    const cartTotalElement = document.getElementById('checkout-total');
    const checkoutBtn = document.getElementById('submit-order-btn');
    const checkoutNotice = document.getElementById('checkout-notice');
    const checkoutForm = document.getElementById('checkout-form');

    // Guard: only run on the checkout page
    if (!cartContainer || !cartTotalElement || !checkoutBtn || !checkoutForm) return;

    renderCartItems();

    // ─── Render cart items & live total ───────────────────────────────────────
    function renderCartItems() {
        const cart = window.cartManager.cart;
        cartContainer.innerHTML = '';

        if (!cart || cart.length === 0) {
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

        cart.forEach(function(item) {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQty   = parseInt(item.quantity, 10) || 1;
            const lineTotal = itemPrice * itemQty;
            total += lineTotal;
            if (item.tier === 2) hasTier2 = true;

            const row = document.createElement('div');
            row.className = 'flex justify-between items-center py-4 border-b border-gray-100 last:border-0';

            // Left: product info
            const itemInfo = document.createElement('div');
            itemInfo.className = 'flex-grow pr-4';

            const itemName = document.createElement('h4');
            itemName.className = 'font-bold text-navy-blue text-sm';
            itemName.textContent = item.name;

            const itemQtyEl = document.createElement('p');
            itemQtyEl.className = 'text-xs text-slate-gray mt-1';
            itemQtyEl.textContent = 'Qty: ' + itemQty + ' \u00D7 ' + formatCurrency(itemPrice);

            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemQtyEl);

            if (item.tier === 2) {
                const badge = document.createElement('span');
                badge.className = 'inline-block mt-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium';
                badge.textContent = '\uD83D\uDE9A Freight Item';
                itemInfo.appendChild(badge);
            }

            // Right: line total + remove button
            const itemTotalEl = document.createElement('div');
            itemTotalEl.className = 'font-bold text-teal-clinical flex-shrink-0 text-sm';
            itemTotalEl.textContent = formatCurrency(lineTotal);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'ml-3 text-red-400 hover:text-red-600 text-xs focus:outline-none transition-colors flex-shrink-0';
            removeBtn.textContent = '\u2715';
            removeBtn.setAttribute('aria-label', 'Remove item');
            removeBtn.onclick = function() {
                window.cartManager.removeItem(item.id);
                renderCartItems();
            };

            const rightSide = document.createElement('div');
            rightSide.className = 'flex items-center';
            rightSide.appendChild(itemTotalEl);
            rightSide.appendChild(removeBtn);

            row.appendChild(itemInfo);
            row.appendChild(rightSide);
            cartContainer.appendChild(row);
        });

        // Update subtotal display
        cartTotalElement.textContent = formatCurrency(total);

        // Update button label
        if (hasTier2) {
            checkoutBtn.textContent = 'Request Quote & Submit Order';
            if (checkoutNotice) checkoutNotice.classList.remove('hidden');
        } else {
            checkoutBtn.textContent = 'Place Order & Receive Invoice';
            if (checkoutNotice) checkoutNotice.classList.add('hidden');
        }
    }

    // ─── Form Submission ──────────────────────────────────────────────────────
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!window.cartManager.cart || window.cartManager.cart.length === 0) {
            showAlert('Your cart is empty. Please add items before checking out.');
            return;
        }

        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const email     = document.getElementById('email').value.trim();
        const phone     = document.getElementById('phone').value.trim();
        const address   = document.getElementById('address').value.trim();
        const city      = document.getElementById('city').value.trim();
        const state     = document.getElementById('state').value.trim();
        const zip       = document.getElementById('zip').value.trim();
        const company   = document.getElementById('company').value.trim();

        // Validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
        if (!emailRegex.test(email)) { showAlert('Please enter a valid email address.'); return; }
        if (!phoneRegex.test(phone)) { showAlert('Please enter a valid phone number.'); return; }

        const paymentMethodEl = document.querySelector('input[name="payment"]:checked');
        if (!paymentMethodEl) { showAlert('Please select a payment method.'); return; }
        const paymentMethod = paymentMethodEl.value;

        const cart    = window.cartManager.cart;
        const total   = cart.reduce(function(sum, i) { return sum + (parseFloat(i.price)||0) * (parseInt(i.quantity,10)||1); }, 0);
        const hasTier2 = cart.some(function(i) { return i.tier === 2; });
        const orderId = 'RFS-' + Math.random().toString(36).substr(2, 7).toUpperCase();
        const orderDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Processing state
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px;">\u23F3</span> Processing...';

        // Build items table rows for email
        var itemsTableRows = cart.map(function(i) {
            var p = parseFloat(i.price)||0;
            var q = parseInt(i.quantity,10)||1;
            return '<tr><td style="padding:8px 12px;border-bottom:1px solid #eaeaea;">' + i.name + '</td><td style="padding:8px 12px;border-bottom:1px solid #eaeaea;text-align:center;">' + q + '</td><td style="padding:8px 12px;border-bottom:1px solid #eaeaea;text-align:right;">' + formatCurrency(p) + '</td><td style="padding:8px 12px;border-bottom:1px solid #eaeaea;text-align:right;font-weight:bold;">' + formatCurrency(p*q) + '</td></tr>';
        }).join('');

        // HTML email body
        var emailHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">'
            + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 0;">'
            + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">'
            // Header
            + '<tr><td style="background:#0f172a;padding:30px 40px;text-align:center;">'
            + '<h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:1px;">ROYAL FUNERAL SUPPLIES</h1>'
            + '<p style="color:#0d9488;margin:4px 0 0;font-size:13px;">Order Confirmation Invoice</p>'
            + '</td></tr>'
            // Body
            + '<tr><td style="padding:30px 40px;">'
            + '<p style="color:#0f172a;font-size:15px;margin:0 0 8px;">Dear <strong>' + firstName + ' ' + lastName + '</strong>,</p>'
            + '<p style="color:#475569;font-size:14px;margin:0 0 24px;">Thank you for your order! Your order has been received and is now being processed.</p>'
            // Order ID box
            + '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px 20px;margin-bottom:24px;text-align:center;">'
            + '<p style="margin:0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Order Reference ID</p>'
            + '<p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#0d9488;letter-spacing:3px;font-family:monospace;">' + orderId + '</p>'
            + '<p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">' + orderDate + '</p>'
            + '</div>'
            // Payment notice
            + '<div style="background:#fefce8;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 6px 6px 0;margin-bottom:24px;">'
            + '<p style="margin:0;font-size:13px;font-weight:bold;color:#92400e;">\uD83D\uDCB3 Payment Method: ' + paymentMethod + '</p>'
            + '<p style="margin:6px 0 0;font-size:13px;color:#78350f;">Based on the payment method you chose, the account details will be sent to you via email by our service team within 1 business day.</p>'
            + '</div>'
            // Items table
            + '<h3 style="color:#0f172a;font-size:15px;margin:0 0 12px;">Order Summary</h3>'
            + '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">'
            + '<thead><tr style="background:#f8fafc;"><th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;font-weight:600;">Product</th><th style="padding:10px 12px;text-align:center;font-size:12px;color:#475569;font-weight:600;">Qty</th><th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;font-weight:600;">Unit Price</th><th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;font-weight:600;">Total</th></tr></thead>'
            + '<tbody>' + itemsTableRows + '</tbody>'
            + '<tfoot><tr style="background:#f8fafc;"><td colspan="3" style="padding:12px;text-align:right;font-weight:bold;color:#0f172a;font-size:15px;">Subtotal</td><td style="padding:12px;text-align:right;font-weight:bold;color:#0d9488;font-size:15px;">' + formatCurrency(total) + '</td></tr></tfoot>'
            + '</table>'
            + (hasTier2 ? '<p style="margin:12px 0 0;font-size:12px;color:#475569;font-style:italic;">\uD83D\uDE9A Note: Your order contains freight items. Final shipping cost will be calculated and sent to you separately.</p>' : '')
            // Customer info
            + '<h3 style="color:#0f172a;font-size:15px;margin:24px 0 12px;">Shipping Information</h3>'
            + '<p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">'
            + firstName + ' ' + lastName + '<br>'
            + (company ? company + '<br>' : '')
            + address + '<br>' + city + ', ' + state + ' ' + zip + '<br>'
            + phone
            + '</p>'
            + '</td></tr>'
            // Footer
            + '<tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">'
            + '<p style="margin:0;font-size:12px;color:#94a3b8;">\u00A9 2024 Royal Funeral Supplies \u2014 B2B Sales Only</p>'
            + '<p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">contact@royalfuneralsupplies.com</p>'
            + '</td></tr>'
            + '</table>'
            + '</td></tr></table>'
            + '</body></html>';

        // Save order to DB then send email
        try {
            const orderData = {
                id: orderId,
                customer_name: firstName + ' ' + lastName,
                email: email,
                phone: phone,
                company: company,
                address: address,
                city: city,
                state: state,
                zip: zip,
                total_amount: total,
                payment_method: paymentMethod,
                status: 'pending',
                items: JSON.stringify(cart.map(function(i){ return { name: i.name, qty: i.quantity, price: i.price }; })),
                created_at: new Date().toISOString()
            };
            if (window.dbManager && window.dbManager.saveOrder) {
                await window.dbManager.saveOrder(orderData);
            }
        } catch (dbErr) {
            console.warn('Order DB save failed (continuing with email):', dbErr);
        }

        // Send email via Resend API
        let emailSent = false;
        try {
            const RESEND_KEY = 're_Sj6daB1k_BVpwTAERdT5zTQFgM3e5mnQv';
            const resp = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + RESEND_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Royal Funeral Supplies <contact@royalfuneralsupplies.com>',
                    to: [email, 'contact@royalfuneralsupplies.com'],
                    subject: 'Order Confirmation ' + orderId + ' - Royal Funeral Supplies',
                    html: emailHtml
                })
            });

            if (resp.ok) {
                console.log('Invoice emails sent successfully via Resend.');
                emailSent = true;
            } else {
                var errBody = await resp.text();
                console.warn('Resend API error ' + resp.status + ':', errBody);
                // Fallback: try via CORS proxy
                try {
                    const proxyResp = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.resend.com/emails'), {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + RESEND_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'Royal Funeral Supplies <contact@royalfuneralsupplies.com>',
                            to: [email, 'contact@royalfuneralsupplies.com'],
                            subject: 'Order Confirmation ' + orderId + ' - Royal Funeral Supplies',
                            html: emailHtml
                        })
                    });
                    if (proxyResp.ok) {
                        console.log('Invoice sent via CORS proxy fallback.');
                        emailSent = true;
                    }
                } catch(proxyErr) {
                    console.warn('Proxy fallback also failed:', proxyErr);
                }
            }
        } catch (emailErr) {
            console.warn('Email send error:', emailErr);
        }

        // Show success popup
        showSuccessModal(orderId, paymentMethod, email, emailSent);
    });

    // ─── Alert ────────────────────────────────────────────────────────────────
    function showAlert(msg) {
        var existing = document.getElementById('checkout-alert');
        if (existing) existing.remove();
        var alertEl = document.createElement('div');
        alertEl.id = 'checkout-alert';
        alertEl.className = 'bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4';
        alertEl.textContent = msg;
        checkoutForm.prepend(alertEl);
        setTimeout(function() { if (alertEl.parentNode) alertEl.remove(); }, 6000);
    }

    // ─── Success popup ────────────────────────────────────────────────────────
    function showSuccessModal(orderId, paymentMethod, email, emailSent) {
        // Clear any processing state
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Place Order & Receive Invoice';

        var modal = document.createElement('div');
        modal.id = 'order-success-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);';

        var emailNote = emailSent
            ? '<p style="color:#059669;font-size:13px;font-weight:600;margin:0 0 16px;">\uD83D\uDCE7 Invoice sent to <strong>' + email + '</strong></p>'
            : '<p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">Our team will email your invoice to <strong>' + email + '</strong> shortly.</p>';

        modal.innerHTML = ''
            + '<div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px 32px;max-width:480px;width:100%;text-align:center;">'
            // Checkmark circle
            + '<div style="width:72px;height:72px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">'
            + '<svg width="40" height="40" fill="none" stroke="#0d9488" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
            + '</div>'
            + '<h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 8px;">Order Placed Successfully!</h2>'
            + '<p style="color:#475569;font-size:14px;margin:0 0 20px;">Your order has been received and you will receive an invoice via email shortly.</p>'
            // Reference ID
            + '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;margin-bottom:16px;display:inline-block;">'
            + '<p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Reference ID</p>'
            + '<p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#0d9488;letter-spacing:3px;font-family:monospace;">' + orderId + '</p>'
            + '</div>'
            + emailNote
            // Payment note
            + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;text-align:left;margin-bottom:24px;">'
            + '<p style="margin:0;font-size:13px;font-weight:700;color:#1e40af;">\uD83D\uDCB3 ' + paymentMethod + ' – Payment Instructions</p>'
            + '<p style="margin:6px 0 0;font-size:13px;color:#374151;">The payment account details will be sent to you via email by our service team. Please check your inbox.</p>'
            + '</div>'
            + '<button id="modal-done-btn" style="background:#0d9488;color:#fff;border:none;border-radius:8px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:background 0.2s;">Return to Home</button>'
            + '</div>';

        document.body.appendChild(modal);

        document.getElementById('modal-done-btn').addEventListener('click', function() {
            window.cartManager.clearCart();
            window.location.href = 'index.html';
        });
    }
}

// ─── Boot: wait for cartManager ───────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// cartManager is created synchronously in main.js (outside DOMContentLoaded),
// so it should be available when our DOMContentLoaded fires.
// We poll briefly just in case scripts load out of order.
document.addEventListener('DOMContentLoaded', function() {
    if (window.cartManager) {
        initCheckout();
    } else {
        var attempts = 0;
        var poll = setInterval(function() {
            attempts++;
            if (window.cartManager) {
                clearInterval(poll);
                initCheckout();
            } else if (attempts > 20) {
                clearInterval(poll);
                console.error('cartManager not found after 2 seconds. Checkout cannot initialise.');
            }
        }, 100);
    }
});
