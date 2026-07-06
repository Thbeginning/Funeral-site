// db.js - Unified Database Manager handling Supabase and LocalStorage Fallback

class DatabaseManager {
    constructor() {
        this.client = window.initSupabase();
        this.useSupabase = this.client !== null;
        this.checkSupabaseConnection();
        
        // Initial LocalStorage Seeding if empty
        this.seedLocalData();
    }
    
    async checkSupabaseConnection() {
        if (this.useSupabase) {
            try {
                // Try fetching groups to see if the table exists and key is valid
                const { error } = await this.client.from('groups').select('*').limit(1);
                if (error) {
                    console.warn("Supabase connection established, but 'groups' table access failed:", error.message);
                    this.useSupabase = false; // Fallback to local
                } else {
                    console.log("Supabase connected and tables verified.");
                    this.useSupabase = true;
                }
            } catch (e) {
                console.warn("Supabase check error:", e);
                this.useSupabase = false;
            }
        } else {
            console.log("No Supabase Anon Key configured. Operating in LocalStorage mode.");
        }
    }

    // ==========================================
    // GROUPS (CATEGORIES) CRUD
    // ==========================================
    
    async getGroups() {
        if (this.useSupabase) {
            const { data, error } = await this.client.from('groups').select('*').order('created_at', { ascending: true });
            if (error) {
                console.error("Error fetching groups from Supabase:", error);
                return this.getLocalGroups();
            }
            return data;
        } else {
            return this.getLocalGroups();
        }
    }

    async saveGroup(group) {
        if (this.useSupabase) {
            // Group object: { id (optional), name, slug, description, image_url }
            const { data, error } = await this.client.from('groups').upsert(group).select();
            if (error) throw error;
            return data;
        } else {
            const groups = this.getLocalGroups();
            if (group.id) {
                const index = groups.findIndex(g => g.id === group.id);
                if (index > -1) groups[index] = { ...groups[index], ...group };
                else groups.push(group);
            } else {
                group.id = 'G' + Date.now();
                groups.push(group);
            }
            localStorage.setItem('royal_groups', JSON.stringify(groups));
            return [group];
        }
    }

    async deleteGroup(id) {
        if (this.useSupabase) {
            const { error } = await this.client.from('groups').delete().eq('id', id);
            if (error) throw error;
        } else {
            let groups = this.getLocalGroups();
            groups = groups.filter(g => g.id !== id);
            localStorage.setItem('royal_groups', JSON.stringify(groups));
        }
    }

    // ==========================================
    // PRODUCTS CRUD
    // ==========================================

    async getProducts(groupSlug = null) {
        if (this.useSupabase) {
            let query = this.client.from('products').select('*').order('created_at', { ascending: false });
            if (groupSlug) query = query.eq('category', groupSlug);
            
            const { data, error } = await query;
            if (error) {
                console.error("Error fetching products from Supabase:", error);
                return this.getLocalProducts(groupSlug);
            }
            return data;
        } else {
            return this.getLocalProducts(groupSlug);
        }
    }

    async saveProduct(product) {
        if (this.useSupabase) {
            const { data, error } = await this.client.from('products').upsert(product).select();
            if (error) throw error;
            return data;
        } else {
            const products = this.getLocalProducts();
            if (product.id) {
                const index = products.findIndex(p => p.id === product.id);
                if (index > -1) products[index] = { ...products[index], ...product };
                else products.push(product);
            } else {
                product.id = 'P' + Date.now();
                products.push(product);
            }
            localStorage.setItem('royal_products', JSON.stringify(products));
            return [product];
        }
    }

    async deleteProduct(id) {
        if (this.useSupabase) {
            const { error } = await this.client.from('products').delete().eq('id', id);
            if (error) throw error;
        } else {
            let products = this.getLocalProducts();
            products = products.filter(p => p.id !== id);
            localStorage.setItem('royal_products', JSON.stringify(products));
        }
    }

    // ==========================================
    // ORDERS CRUD
    // ==========================================

    async getOrders() {
        if (this.useSupabase) {
            const { data, error } = await this.client.from('orders').select('*').order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching orders from Supabase:", error);
                return this.getLocalOrders();
            }
            return data;
        } else {
            return this.getLocalOrders();
        }
    }

    async saveOrder(order) {
        // order: { id, customer_name, email, phone, company, address, city, state, zip, total_amount, payment_method, status, items }
        if (this.useSupabase) {
            const { data, error } = await this.client.from('orders').insert([order]).select();
            if (error) throw error;
            return data;
        } else {
            const orders = this.getLocalOrders();
            order.id = order.id || 'ORD-' + Date.now();
            order.created_at = new Date().toISOString();
            orders.push(order);
            localStorage.setItem('royal_orders', JSON.stringify(orders));
            return [order];
        }
    }

    async updateOrderStatus(id, status) {
        if (this.useSupabase) {
            const { error } = await this.client.from('orders').update({ status }).eq('id', id);
            if (error) throw error;
        } else {
            const orders = this.getLocalOrders();
            const index = orders.findIndex(o => o.id === id);
            if (index > -1) {
                orders[index].status = status;
                localStorage.setItem('royal_orders', JSON.stringify(orders));
            }
        }
    }

    // ==========================================
    // LOCAL STORAGE FALLBACK LOGIC
    // ==========================================

    getLocalGroups() {
        const data = localStorage.getItem('royal_groups');
        return data ? JSON.parse(data) : [];
    }

    getLocalProducts(groupSlug = null) {
        const data = localStorage.getItem('royal_products');
        let products = data ? JSON.parse(data) : [];
        if (groupSlug) {
            products = products.filter(p => p.category === groupSlug);
        }
        return products;
    }

    getLocalOrders() {
        const data = localStorage.getItem('royal_orders');
        return data ? JSON.parse(data) : [];
    }

    seedLocalData() {
        if (!localStorage.getItem('royal_groups')) {
            const defaultGroups = [
                { id: 'G1', slug: 'removal', name: 'Removal & Transport', description: 'Heavy-duty stretchers, first-call vehicles supplies.', image_url: 'https://images.unsplash.com/photo-1587559070757-f72a388edbba?q=80&w=600&auto=format&fit=crop' },
                { id: 'G2', slug: 'prep', name: 'Prep Room & Embalming', description: 'Clinical-grade instruments, fluids, positioning blocks.', image_url: 'https://images.unsplash.com/photo-1614935151651-0bea6508abb6?q=80&w=600&auto=format&fit=crop' },
                { id: 'G3', slug: 'refrigeration', name: 'Refrigeration & Storage', description: 'Modular cooling systems, heavy-duty racking.', image_url: 'https://images.unsplash.com/photo-1585805567545-0d3221b21ba1?q=80&w=600&auto=format&fit=crop' },
                { id: 'G4', slug: 'chapel', name: 'Chapel Supplies', description: 'Elegant presentation biers, lighting, signage.', image_url: 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?q=80&w=600&auto=format&fit=crop' },
                { id: 'G5', slug: 'cremation', name: 'Cremation Products', description: 'Processing tools, urns, mailers, and ID tags.', image_url: 'https://images.unsplash.com/photo-1620577438166-5e58123ca39e?q=80&w=600&auto=format&fit=crop' }
            ];
            localStorage.setItem('royal_groups', JSON.stringify(defaultGroups));
        }

        if (!localStorage.getItem('royal_products')) {
            const defaultProducts = [
                { id: 'P001', name: 'Clinical Grade Embalming Fluid (Case of 24)', category: 'prep', price: 185.00, tier: 1, image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=400&auto=format&fit=crop', description: 'Premium formaldehyde-based arterial fluid. High penetration, consistent color distribution.' },
                { id: 'P002', name: 'Heavy-Duty Bariatric Cot', category: 'removal', price: 2450.00, tier: 2, image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=400&auto=format&fit=crop', description: 'Reinforced aluminum construction. Weight capacity up to 1000 lbs.' },
                { id: 'P003', name: 'Stainless Steel Prep Table with Drain', category: 'prep', price: 1850.00, tier: 2, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&auto=format&fit=crop', description: 'Type 304 stainless steel. Deep trough, positive drainage.' },
                { id: 'P004', name: 'Disaster Pouch / Body Bag (10 Pack)', category: 'removal', price: 120.00, tier: 1, image: 'https://images.unsplash.com/photo-1620577438166-5e58123ca39e?q=80&w=400&auto=format&fit=crop', description: 'Heavy duty, leak-resistant, envelope style zipper.' },
                { id: 'P005', name: 'Modular 3-Body Refrigeration Unit', category: 'refrigeration', price: 8900.00, tier: 2, image: 'https://images.unsplash.com/photo-1585805567545-0d3221b21ba1?q=80&w=400&auto=format&fit=crop', description: 'Drop-in cooling system, stainless steel interior/exterior.' },
                { id: 'P006', name: 'Solid Brass Urn - Classic Series', category: 'cremation', price: 85.00, tier: 1, image: 'https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?q=80&w=400&auto=format&fit=crop', description: 'Hand-crafted brass with threaded lid. 200 cubic inch capacity.' },
                { id: 'P007', name: 'Elegant Presentation Bier', category: 'chapel', price: 1100.00, tier: 2, image: 'https://images.unsplash.com/photo-1517409228578-8319e7a9b0f4?q=80&w=400&auto=format&fit=crop', description: 'Hardwood construction, velvet bumpers, silent locking casters.' },
                { id: 'P008', name: 'Cremation ID Tags (Box of 500)', category: 'cremation', price: 145.00, tier: 1, image: 'https://images.unsplash.com/photo-1614935151651-0bea6508abb6?q=80&w=400&auto=format&fit=crop', description: 'Stainless steel, sequentially numbered, withstands extreme temperatures.' }
            ];
            localStorage.setItem('royal_products', JSON.stringify(defaultProducts));
        }
    }
}

// Global Instantiation
window.dbManager = new DatabaseManager();
