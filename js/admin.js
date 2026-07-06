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
                    finalImageUrl = await compressImageAndReturnBase64(fileInput.files[0]);
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
                    finalImageUrl = await compressImageAndReturnBase64(fileInput.files[0]);
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
