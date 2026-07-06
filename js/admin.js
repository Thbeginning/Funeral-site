// admin.js - Admin Dashboard Logic (Master-Detail Structure)

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Simulation
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminNav = document.getElementById('admin-nav');
    const adminMain = document.getElementById('admin-main');
    const logoutBtn = document.getElementById('logout-btn');

    // Views
    const viewGroupsList = document.getElementById('view-groups-list');
    const viewGroupDetail = document.getElementById('view-group-detail');

    // Check auth
    const isLoggedIn = sessionStorage.getItem('royal_admin_auth') === 'true';
    if (isLoggedIn) {
        showDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin-pwd').value;
        if (pwd === 'admin1234') { 
            sessionStorage.setItem('royal_admin_auth', 'true');
            showDashboard();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('royal_admin_auth');
        window.location.reload();
    });

    function showDashboard() {
        loginOverlay.classList.add('hidden');
        adminNav.classList.remove('hidden');
        adminMain.classList.remove('hidden');
        loadData();
        setupTabs();
    }

    // ==========================================
    // TAB SWITCHING LOGIC
    // ==========================================
    function setupTabs() {
        const tabInventory = document.getElementById('tab-inventory');
        const tabOrders = document.getElementById('tab-orders');
        const panelInventory = document.getElementById('panel-inventory');
        const panelOrders = document.getElementById('panel-orders');

        tabInventory.addEventListener('click', () => {
            tabInventory.classList.add('border-teal-clinical', 'text-teal-clinical');
            tabInventory.classList.remove('border-transparent', 'text-slate-gray');
            tabOrders.classList.remove('border-teal-clinical', 'text-teal-clinical');
            tabOrders.classList.add('border-transparent', 'text-slate-gray');
            panelInventory.classList.remove('hidden');
            panelOrders.classList.add('hidden');
        });

        tabOrders.addEventListener('click', () => {
            tabOrders.classList.add('border-teal-clinical', 'text-teal-clinical');
            tabOrders.classList.remove('border-transparent', 'text-slate-gray');
            tabInventory.classList.remove('border-teal-clinical', 'text-teal-clinical');
            tabInventory.classList.add('border-transparent', 'text-slate-gray');
            panelOrders.classList.remove('hidden');
            panelInventory.classList.add('hidden');
            loadOrders();
        });

        document.getElementById('btn-refresh-orders').addEventListener('click', loadOrders);
    }

    // ==========================================
    // ORDERS LOADER & RENDERER
    // ==========================================
    async function loadOrders() {
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = `<div class="text-center py-12 text-slate-gray"><p class="text-4xl mb-3">⏳</p><p class="font-semibold">Loading orders...</p></div>`;

        try {
            const orders = await window.dbManager.getOrders() || [];

            if (orders.length === 0) {
                ordersList.innerHTML = `<div class="text-center py-16 text-slate-gray"><p class="text-5xl mb-4">🛒</p><h3 class="text-xl font-bold text-navy-blue mb-2">No Orders Yet</h3><p>When customers place orders on your site, they will appear here.</p></div>`;
                return;
            }

            ordersList.replaceChildren();
            orders.forEach(order => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden';

                const statusColor = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'processing': 'bg-blue-100 text-blue-800',
                    'shipped': 'bg-indigo-100 text-indigo-800',
                    'completed': 'bg-green-100 text-green-800',
                    'cancelled': 'bg-red-100 text-red-800'
                }[order.status] || 'bg-gray-100 text-gray-800';

                let items = [];
                try { items = JSON.parse(order.items || '[]'); } catch(e) {}

                const itemsHtml = items.map(i => `<li class="text-xs text-slate-gray">${i.qty}× ${i.name} — $${parseFloat(i.price).toFixed(2)}</li>`).join('');

                card.innerHTML = `
                    <div class="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
                        <div class="flex-grow">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="text-lg font-mono font-bold text-navy-blue">${order.id}</span>
                                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor}">${order.status}</span>
                            </div>
                            <p class="font-bold text-slate-700">${order.customer_name}</p>
                            <p class="text-sm text-slate-gray">${order.email} • ${order.phone}</p>
                            <p class="text-sm text-slate-gray">${order.address}, ${order.city}, ${order.state} ${order.zip}</p>
                            ${order.company ? `<p class="text-xs text-slate-500 mt-1">🏢 ${order.company}</p>` : ''}
                        </div>
                        <div class="flex-shrink-0 text-right">
                            <p class="text-2xl font-bold text-teal-clinical">$${parseFloat(order.total_amount).toFixed(2)}</p>
                            <p class="text-xs text-slate-gray">${order.payment_method}</p>
                            <p class="text-xs text-slate-gray mt-1">${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    ${itemsHtml ? `<div class="border-t border-gray-100 px-5 py-3 bg-gray-50"><ul class="space-y-0.5">${itemsHtml}</ul></div>` : ''}
                    <div class="border-t border-gray-100 px-5 py-3 flex items-center gap-3">
                        <label class="text-xs font-bold text-slate-gray">Update Status:</label>
                        <select class="order-status-select border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-teal-clinical outline-none" data-order-id="${order.id}">
                            <option value="pending" ${order.status==='pending'?'selected':''}>Pending</option>
                            <option value="processing" ${order.status==='processing'?'selected':''}>Processing</option>
                            <option value="shipped" ${order.status==='shipped'?'selected':''}>Shipped</option>
                            <option value="completed" ${order.status==='completed'?'selected':''}>Completed</option>
                            <option value="cancelled" ${order.status==='cancelled'?'selected':''}>Cancelled</option>
                        </select>
                        <button class="update-status-btn btn-primary px-4 py-1.5 rounded text-xs font-bold" data-order-id="${order.id}">Save</button>
                    </div>
                `;

                card.querySelector('.update-status-btn').addEventListener('click', async (evt) => {
                    const oid = evt.target.dataset.orderId;
                    const sel = card.querySelector('.order-status-select');
                    const newStatus = sel.value;
                    try {
                        await window.dbManager.updateOrderStatus(oid, newStatus);
                        const badge = card.querySelector('.rounded-full');
                        if (badge) {
                            badge.textContent = newStatus;
                            badge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${{ 'pending': 'bg-yellow-100 text-yellow-800', 'processing': 'bg-blue-100 text-blue-800', 'shipped': 'bg-indigo-100 text-indigo-800', 'completed': 'bg-green-100 text-green-800', 'cancelled': 'bg-red-100 text-red-800' }[newStatus] || 'bg-gray-100 text-gray-800'}`;
                        }
                        evt.target.textContent = '✓ Saved!';
                        setTimeout(() => evt.target.textContent = 'Save', 2000);
                    } catch(err) {
                        alert('Failed to update order status.');
                    }
                });

                ordersList.appendChild(card);
            });
        } catch(e) {
            ordersList.innerHTML = `<div class="text-center py-12 text-red-500"><p class="font-bold">Failed to load orders. Please refresh.</p></div>`;
            console.error(e);
        }
    }

    // State
    let currentGroups = [];
    let currentProducts = [];
    let activeGroupSlug = null; // Currently viewed group

    async function loadData() {
        try {
            currentGroups = await window.dbManager.getGroups() || [];
            currentProducts = await window.dbManager.getProducts() || [];
            
            if (activeGroupSlug) {
                renderGroupDetail(activeGroupSlug);
            } else {
                renderGroupsGrid();
                showGroupsView();
            }
        } catch (e) {
            console.error("Error loading admin data:", e);
        }
    }

    // ==========================================
    // VIEW CONTROLLERS
    // ==========================================

    function showGroupsView() {
        viewGroupDetail.classList.add('hidden');
        viewGroupsList.classList.remove('hidden');
        activeGroupSlug = null;
    }

    function showDetailView() {
        viewGroupsList.classList.add('hidden');
        viewGroupDetail.classList.remove('hidden');
    }

    document.getElementById('btn-back-to-groups').addEventListener('click', () => {
        showGroupsView();
    });

    // ==========================================
    // RENDERERS
    // ==========================================

    function renderGroupsGrid() {
        const grid = document.getElementById('groups-grid-admin');
        grid.replaceChildren();

        currentGroups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group-card flex flex-col';
            card.onclick = () => {
                activeGroupSlug = group.slug;
                renderGroupDetail(group.slug);
            };

            const productCount = currentProducts.filter(p => p.category === group.slug).length;

            card.innerHTML = `
                <div class="h-32 bg-gray-100 relative">
                    <img src="${group.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}" class="w-full h-full object-cover opacity-90 mix-blend-multiply">
                    <div class="absolute inset-0 bg-navy-blue opacity-10"></div>
                </div>
                <div class="p-5 flex-grow">
                    <h3 class="text-xl font-bold text-navy-blue mb-1">${group.name}</h3>
                    <p class="text-sm text-slate-gray mb-3 line-clamp-2">${group.description || 'No description provided.'}</p>
                    <div class="flex items-center text-teal-clinical text-sm font-semibold">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        ${productCount} Products
                    </div>
                </div>
                <div class="border-t border-gray-100 p-3 bg-gray-50 text-center text-sm font-semibold text-navy-blue group-hover:text-teal-clinical transition-colors">
                    Manage Group &rarr;
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderGroupDetail(slug) {
        const group = currentGroups.find(g => g.slug === slug);
        if (!group) {
            showGroupsView();
            return;
        }

        // Update Header
        document.getElementById('detail-group-name').textContent = group.name;
        document.getElementById('detail-group-desc').textContent = group.description || 'No description.';
        document.getElementById('detail-group-image').src = group.image_url || 'https://via.placeholder.com/150';

        // Filter Products
        const productsInGroup = currentProducts.filter(p => p.category === slug);
        const tbody = document.getElementById('admin-products-tbody');
        tbody.replaceChildren();

        if (productsInGroup.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="5" class="p-8 text-center text-slate-gray">No products found in this group. Click "Add Product Here" to get started.</td>`;
            tbody.appendChild(tr);
        } else {
            productsInGroup.forEach(product => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
                
                tr.innerHTML = `
                    <td class="p-3 w-16">
                        <div class="w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-100">
                            <img src="${product.image || 'https://via.placeholder.com/100'}" class="w-full h-full object-cover">
                        </div>
                    </td>
                    <td class="p-3 text-sm font-bold text-navy-blue">${product.name}</td>
                    <td class="p-3 text-sm text-teal-clinical font-bold">$${parseFloat(product.price).toFixed(2)}</td>
                    <td class="p-3 text-sm text-slate-gray">
                        <span class="${product.tier === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded text-xs font-semibold">
                            ${product.tier === 2 ? 'Tier 2 (Freight)' : 'Tier 1'}
                        </span>
                    </td>
                    <td class="p-3 text-sm text-right space-x-3">
                        <button class="text-teal-clinical hover:text-teal-hover font-bold transition-colors" onclick="editProduct('${product.id}')">Edit</button>
                        <button class="text-red-500 hover:text-red-700 font-bold transition-colors" onclick="deleteProduct('${product.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        showDetailView();
    }

    // ==========================================
    // MODAL LOGIC (ADD / EDIT)
    // ==========================================
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const formFields = document.getElementById('form-fields');
    const editForm = document.getElementById('edit-form');
    
    // Helper function to compress uploaded image to Base64
    async function compressImageAndReturnBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality JPEG
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    async function uploadImageFile(file, bucket) {
        if (!window.dbManager || !window.dbManager.useSupabase) {
            return await compressImageAndReturnBase64(file);
        }
        
        const sb = window.initSupabase();
        const uuid = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
        const filename = `${uuid}.${ext}`;
        
        const { data, error } = await sb.storage.from(bucket).upload(filename, file, { cacheControl: '3600', upsert: false });
        if (error) {
            console.error("Storage upload error:", error);
            throw error;
        }
        
        const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(filename);
        return publicUrl;
    }
    
    let currentEditType = null; // 'product' or 'group'
    let currentEditId = null;

    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-cancel').onclick = closeModal;

    function closeModal() {
        modal.classList.add('hidden');
        editForm.reset();
    }

    function openModal(type, data = null) {
        currentEditType = type;
        currentEditId = data ? data.id : null;
        formFields.replaceChildren();

        modalTitle.textContent = data ? `Edit ${type === 'product' ? 'Product' : 'Group'}` : `Add New ${type === 'product' ? 'Product' : 'Group'}`;

        if (type === 'group') {
            formFields.innerHTML = `
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Group Name</label>
                    <input type="text" id="f_name" value="${data ? data.name : ''}" required class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none">
                </div>
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Slug (URL identifier)</label>
                    <input type="text" id="f_slug" value="${data ? data.slug : ''}" required class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none" placeholder="e.g., prep-room">
                    <p class="text-xs text-gray-500 mt-1">Must be unique, lowercase, no spaces.</p>
                </div>
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Description</label>
                    <textarea id="f_desc" required class="w-full border border-gray-300 rounded px-4 py-2 h-24 focus:ring-2 focus:ring-teal-clinical outline-none">${data ? data.description : ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Profile Image</label>
                    <input type="file" id="f_image_file" accept="image/*" class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none mb-2 text-sm text-slate-gray file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-clinical hover:file:bg-teal-100 cursor-pointer">
                    <p class="text-xs font-semibold text-slate-gray mb-1">Or paste an Image URL instead:</p>
                    <input type="url" id="f_image" value="${data ? data.image_url : ''}" class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none" placeholder="https://...">
                </div>
            `;
        } else if (type === 'product') {
            // When creating a product inside a group view, lock the category to the active group
            formFields.innerHTML = `
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Product Name</label>
                    <input type="text" id="f_name" value="${data ? data.name : ''}" required class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none">
                </div>
                
                <!-- Hidden Input for Category (Auto-assigned to current group) -->
                <input type="hidden" id="f_category" value="${activeGroupSlug}">

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-navy-blue mb-1">Price ($)</label>
                        <input type="number" step="0.01" id="f_price" value="${data ? data.price : ''}" required class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-navy-blue mb-1">Shipping Tier</label>
                        <select id="f_tier" class="w-full border border-gray-300 rounded px-4 py-2 bg-white focus:ring-2 focus:ring-teal-clinical outline-none" required>
                            <option value="1" ${data && data.tier == 1 ? 'selected' : ''}>Tier 1 (Standard)</option>
                            <option value="2" ${data && data.tier == 2 ? 'selected' : ''}>Tier 2 (Freight Shipping)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Description</label>
                    <textarea id="f_desc" required class="w-full border border-gray-300 rounded px-4 py-2 h-24 focus:ring-2 focus:ring-teal-clinical outline-none">${data ? data.description : ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-bold text-navy-blue mb-1">Product Image</label>
                    <input type="file" id="f_image_file" accept="image/*" class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none mb-2 text-sm text-slate-gray file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-clinical hover:file:bg-teal-100 cursor-pointer">
                    <p class="text-xs font-semibold text-slate-gray mb-1">Or paste an Image URL instead:</p>
                    <input type="url" id="f_image" value="${data ? data.image : ''}" class="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-teal-clinical outline-none" placeholder="https://...">
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    // Button Listeners
    document.getElementById('btn-add-group').onclick = () => openModal('group');
    document.getElementById('btn-add-product').onclick = () => {
        if(!activeGroupSlug) return alert("Please select a group first.");
        openModal('product');
    };
    
    document.getElementById('btn-edit-current-group').onclick = () => {
        if(activeGroupSlug) {
            const group = currentGroups.find(g => g.slug === activeGroupSlug);
            if(group) openModal('group', group);
        }
    };

    document.getElementById('btn-delete-current-group').onclick = async () => {
        if(!activeGroupSlug) return;
        const group = currentGroups.find(g => g.slug === activeGroupSlug);
        if(!group) return;

        if (confirm(`Are you sure you want to delete the group "${group.name}"?\nWARNING: Any products in this group will be orphaned or deleted depending on database rules.`)) {
            await window.dbManager.deleteGroup(group.id);
            activeGroupSlug = null; // reset view
            loadData();
        }
    };

    // Global exposed functions for table row buttons
    window.editProduct = (id) => {
        const product = currentProducts.find(p => p.id === id);
        if (product) openModal('product', product);
    };

    window.deleteProduct = async (id) => {
        if (confirm("Are you sure you want to delete this product?")) {
            await window.dbManager.deleteProduct(id);
            loadData();
        }
    };

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (currentEditType === 'group') {
                let finalImageUrl = document.getElementById('f_image').value.trim();
                const fileInput = document.getElementById('f_image_file');
                if (fileInput && fileInput.files.length > 0) {
                    finalImageUrl = await uploadImageFile(fileInput.files[0], 'royal-groups');
                }

                const group = {
                    name: document.getElementById('f_name').value.trim(),
                    slug: document.getElementById('f_slug').value.trim().toLowerCase(),
                    description: document.getElementById('f_desc').value.trim(),
                    image_url: finalImageUrl
                };
                if (currentEditId) group.id = currentEditId;
                
                // If creating a new group, we need to handle slug conflicts ideally, but let's just save
                await window.dbManager.saveGroup(group);
                
                // Keep the active view if editing, or set it if new
                activeGroupSlug = group.slug; 

            } else if (currentEditType === 'product') {
                let finalImageUrl = document.getElementById('f_image').value.trim();
                const fileInput = document.getElementById('f_image_file');
                if (fileInput && fileInput.files.length > 0) {
                    finalImageUrl = await uploadImageFile(fileInput.files[0], 'royal-products');
                }

                const product = {
                    name: document.getElementById('f_name').value.trim(),
                    category: document.getElementById('f_category').value, // auto-assigned
                    price: parseFloat(document.getElementById('f_price').value),
                    tier: parseInt(document.getElementById('f_tier').value),
                    description: document.getElementById('f_desc').value.trim(),
                    image: finalImageUrl
                };
                if (currentEditId) product.id = currentEditId;
                await window.dbManager.saveProduct(product);
            }
            
            closeModal();
            loadData(); // Refresh UI
        } catch (err) {
            console.error("Save error:", err);
            alert("Error saving data. Please ensure slugs are unique and valid.");
        }
    });
});
