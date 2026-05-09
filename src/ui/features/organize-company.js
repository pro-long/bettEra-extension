const OrganizeCompanyController = {
    isActive: false,
    observer: null,
    draggedCard: null,
    isReordering: false,

    enable() {
        this.isActive = true;
        this.injectHandles();
        
        if (!this.observer) {
            this.observer = new MutationObserver(() => {
                if (this.isActive && !this.isReordering) this.injectHandles();
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
        }
        console.log("[OrganizeCompany] Activated.");
    },

    disable() {
        this.isActive = false;
        this.removeHandles();
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        console.log("[OrganizeCompany] Deactivated.");
    },

    applySavedOrder(container) {
        const saved = localStorage.getItem('bettera-company-order');
        if (!saved) return;
        
        this.isReordering = true;
        const order = JSON.parse(saved);
        const cards = Array.from(container.children);
        
        order.forEach(id => {
            const targetCard = cards.find(card => {
                const link = card.querySelector('a[href^="/company/"]');
                return link && link.getAttribute('href').includes(id);
            });
            if (targetCard) {
                container.appendChild(targetCard);
            }
        });
        
        setTimeout(() => { this.isReordering = false; }, 50);
    },

    saveOrder(container) {
        const order = Array.from(container.children).map(card => {
            const link = card.querySelector('a[href^="/company/"]');
            return link ? link.getAttribute('href').split('/company/')[1] : null;
        }).filter(Boolean);
        localStorage.setItem('bettera-company-order', JSON.stringify(order));
    },

    injectHandles() {
        const buyButton = document.getElementById('buy-company-button');
        if (!buyButton) return;

        const container = buyButton.previousElementSibling;
        if (!container) return;

        if (!container.dataset.ordered) {
            this.applySavedOrder(container);
            container.dataset.ordered = "true";
        }

        Array.from(container.children).forEach(card => {
            const link = card.querySelector('a[href^="/company/"]');
            
            if (link && !card.querySelector('.bettera-drag-btn')) {
                const companyId = link.getAttribute('href').split('/company/')[1];
                const dragBtn = document.createElement('div');
                
                dragBtn.className = 'bettera-drag-btn';
                dragBtn.innerHTML = '⋮⋮'; 
                dragBtn.dataset.id = companyId; 
                
                Object.assign(dragBtn.style, {
                    cursor: 'grab', padding: '5px', fontSize: '20px', color: '#00d4ff',
                    position: 'absolute', left: '-25px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: '100', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none'
                });

                card.style.position = 'relative'; 
                card.appendChild(dragBtn);

                dragBtn.addEventListener('mousedown', () => { card.draggable = true; });
                dragBtn.addEventListener('mouseup', () => { card.draggable = false; });
                dragBtn.addEventListener('mouseleave', () => { card.draggable = false; });
                card.addEventListener('dragstart', (e) => { this.draggedCard = card; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', companyId); setTimeout(() => card.style.opacity = '0.4', 0); });
                card.addEventListener('dragend', () => { card.style.opacity = '1'; card.draggable = false; this.draggedCard = null; this.saveOrder(container); });
                card.addEventListener('dragover', (e) => { e.preventDefault(); if (!this.draggedCard || this.draggedCard === card) return; const rect = card.getBoundingClientRect(); const isAfter = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5; this.isReordering = true; container.insertBefore(this.draggedCard, isAfter ? card.nextSibling : card); setTimeout(() => { this.isReordering = false; }, 10); });
            }
        });
    },

    removeHandles() {
        document.querySelectorAll('.bettera-drag-btn').forEach(btn => { const card = btn.parentElement; if (card) card.draggable = false; btn.remove(); });
        const buyButton = document.getElementById('buy-company-button');
        if (buyButton && buyButton.previousElementSibling) delete buyButton.previousElementSibling.dataset.ordered;
    }
};