// ==================== INVENTORY UI ====================
// Renders inventory modal with equipped, owned, and consumable items

function renderInventory() {
    const content = document.getElementById('inventoryContent');
    if (!content) return;
    
    const activeTab = document.querySelector('.inventory-tab.active')?.getAttribute('data-tab') || 'equipped';
    const searchTerm = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    const rarityFilter = document.getElementById('inventoryRarityFilter')?.value || '';
    
    content.innerHTML = '';
    
    if (activeTab === 'equipped') {
        renderEquippedItems(content, searchTerm, rarityFilter);
    } else if (activeTab === 'owned') {
        renderOwnedItems(content, searchTerm, rarityFilter);
    } else if (activeTab === 'consumables') {
        renderConsumableItems(content, searchTerm, rarityFilter);
    }
}

function renderEquippedItems(container, searchTerm, rarityFilter) {
    if (!window.playerInventory || !window.playerInventory.equipped.length) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No items equipped</p>';
        return;
    }
    
    const equipped = window.playerInventory.equipped
        .map(id => window.ITEMS[id])
        .filter(item => item && matchesFilter(item, searchTerm, rarityFilter));
    
    if (equipped.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No matching items</p>';
        return;
    }
    
    equipped.forEach(item => {
        const itemElement = createItemElement(item, true);
        container.appendChild(itemElement);
    });
}

function renderOwnedItems(container, searchTerm, rarityFilter) {
    if (!window.playerInventory || !window.playerInventory.owned.length) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No items owned</p>';
        return;
    }
    
    const owned = window.playerInventory.owned
        .map(id => window.ITEMS[id])
        .filter(item => item && matchesFilter(item, searchTerm, rarityFilter));
    
    if (owned.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No matching items</p>';
        return;
    }
    
    owned.forEach(item => {
        const isEquipped = window.isItemEquipped(item.id);
        const itemElement = createItemElement(item, isEquipped);
        container.appendChild(itemElement);
    });
}

function renderConsumableItems(container, searchTerm, rarityFilter) {
    if (!window.playerInventory || !window.playerInventory.consumables || Object.keys(window.playerInventory.consumables).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No consumables</p>';
        return;
    }
    
    const consumables = Object.keys(window.playerInventory.consumables)
        .map(id => ({ item: window.ITEMS[id], count: window.playerInventory.consumables[id] }))
        .filter(({ item }) => item && matchesFilter(item, searchTerm, rarityFilter));
    
    if (consumables.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No matching items</p>';
        return;
    }
    
    consumables.forEach(({ item, count }) => {
        const itemElement = createItemElement(item, false, count);
        container.appendChild(itemElement);
    });
}

function createItemElement(item, isEquipped, consumableCount = null) {
    const rarity = window.ITEM_RARITIES[item.rarity];
    const rarityColor = rarity ? rarity.color : '#9e9e9e';
    
    const div = document.createElement('div');
    div.className = 'inventory-item';
    if (isEquipped) div.classList.add('equipped');
    
    div.style.cssText = `
        padding: 15px;
        background: var(--bg-secondary);
        border: 2px solid ${rarityColor};
        border-radius: 8px;
        margin-bottom: 10px;
        position: relative;
    `;
    
    const equippedBadge = isEquipped ? '<span style="position: absolute; top: 5px; right: 5px; background: var(--snake-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">EQUIPPED</span>' : '';
    const countBadge = consumableCount ? `<span style="position: absolute; top: 5px; right: 5px; background: ${rarityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">x${consumableCount}</span>` : '';
    
    div.innerHTML = `
        ${equippedBadge || countBadge}
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 2.5em;">${getItemIcon(item)}</div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0; color: ${rarityColor};">${item.name}</h3>
                <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 0.9em;">${item.description}</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <span style="padding: 4px 8px; background: ${rarityColor}; color: white; border-radius: 4px; font-size: 0.8em;">${rarity.name}</span>
                    ${item.type === 'consumable' ? '<span style="padding: 4px 8px; background: #f44336; color: white; border-radius: 4px; font-size: 0.8em;">CONSUMABLE</span>' : ''}
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                ${!isEquipped && item.type !== 'consumable' ? `
                    <button class="btn" id="inventoryEquipBtn_${item.id}" aria-label="Equip ${item.name}" style="font-size: 0.9em; padding: 8px 15px;">Equip</button>
                ` : ''}
                ${isEquipped ? `
                    <button class="btn" id="inventoryUnequipBtn_${item.id}" aria-label="Unequip ${item.name}" style="font-size: 0.9em; padding: 8px 15px; background: #666;">Unequip</button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add tooltip
    div.title = item.description;
    
    // Register buttons with UnifiedButtonHandler if available
    if (window.UnifiedButtonHandler) {
        const equipBtn = div.querySelector(`#inventoryEquipBtn_${item.id}`);
        if (equipBtn) {
            window.UnifiedButtonHandler.registerButton(equipBtn, () => {
                console.log(`[Button] Inventory Equip clicked: ${item.id}`);
                equipItemFromUI(item.id);
            });
        }
        
        const unequipBtn = div.querySelector(`#inventoryUnequipBtn_${item.id}`);
        if (unequipBtn) {
            window.UnifiedButtonHandler.registerButton(unequipBtn, () => {
                console.log(`[Button] Inventory Unequip clicked: ${item.id}`);
                unequipItemFromUI(item.id);
            });
        }
    } else {
        // Fallback: use onclick
        const equipBtn = div.querySelector(`#inventoryEquipBtn_${item.id}`);
        if (equipBtn) equipBtn.onclick = () => equipItemFromUI(item.id);
        const unequipBtn = div.querySelector(`#inventoryUnequipBtn_${item.id}`);
        if (unequipBtn) unequipBtn.onclick = () => unequipItemFromUI(item.id);
    }
    
    return div;
}

function getItemIcon(item) {
    // Return appropriate icon based on item type
    if (item.effects.speedMultiplier) return '⚡';
    if (item.effects.fruitMultiplier) return '⭐';
    if (item.effects.autoBiteRadius) return '🍎';
    if (item.effects.shield) return '🛡️';
    if (item.effects.magnetRadius) return '🧲';
    if (item.effects.dashCooldown) return '💨';
    if (item.effects.clearRadius) return '🧹';
    if (item.effects.startLength) return '📏';
    if (item.effects.skin) return '🎨';
    return '📦';
}

function matchesFilter(item, searchTerm, rarityFilter) {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.description.toLowerCase().includes(searchTerm)) {
        return false;
    }
    if (rarityFilter && item.rarity !== rarityFilter) {
        return false;
    }
    return true;
}

function equipItemFromUI(itemId) {
    if (window.equipItem(itemId)) {
        renderInventory();
        if (window.applyItemEffects) window.applyItemEffects();
    }
}

function unequipItemFromUI(itemId) {
    if (window.unequipItem(itemId)) {
        renderInventory();
        if (window.applyItemEffects) window.applyItemEffects();
    }
}

// Export
window.renderInventory = renderInventory;
window.equipItemFromUI = equipItemFromUI;
window.unequipItemFromUI = unequipItemFromUI;

