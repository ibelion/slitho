// ==================== SHOP UI ====================
// Renders shop modal with item grid, purchase functionality, and recommendations

let recommendedItemRotation = 0;

function renderShop() {
    const content = document.getElementById('shopContent');
    const shopCoinsDisplay = document.getElementById('shopCoinsDisplay');
    if (!content) return;
    
    if (shopCoinsDisplay && window.playerStats) {
        shopCoinsDisplay.textContent = window.playerStats.gold;
    }
    
    const activeTab = document.querySelector('.shop-tab.active')?.getAttribute('data-tab') || 'all';
    const searchTerm = document.getElementById('shopSearch')?.value.toLowerCase() || '';
    const rarityFilter = document.getElementById('shopRarityFilter')?.value || '';
    
    // Update recommended item
    updateRecommendedItem();
    
    // Filter items by tab
    let items = Object.values(window.ITEMS || {});
    
    if (activeTab === 'active') {
        items = items.filter(item => item.type === 'active');
    } else if (activeTab === 'consumables') {
        items = items.filter(item => item.type === 'consumable');
    } else if (activeTab === 'cosmetics') {
        items = items.filter(item => item.type === 'cosmetic');
    }
    
    // Apply filters
    items = items.filter(item => {
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        if (rarityFilter && item.rarity !== rarityFilter) {
            return false;
        }
        return true;
    });
    
    // Sort by unlock level, then by cost
    items.sort((a, b) => {
        if (a.unlockLevel !== b.unlockLevel) return a.unlockLevel - b.unlockLevel;
        return a.cost - b.cost;
    });
    
    // Optimize: reuse elements instead of clearing innerHTML
    // Clear content efficiently (remove children instead of innerHTML)
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }
    
    if (items.length === 0) {
        // Reuse or create "no items" message
        let noItemsMsg = content.querySelector('.no-items-message');
        if (!noItemsMsg) {
            noItemsMsg = document.createElement('p');
            noItemsMsg.className = 'no-items-message';
            noItemsMsg.style.cssText = 'text-align: center; color: var(--text-secondary); padding: 20px;';
        }
        noItemsMsg.textContent = 'No items found';
        content.appendChild(noItemsMsg);
        return;
    }
    
    items.forEach(item => {
        const itemElement = createShopItemElement(item);
        content.appendChild(itemElement);
    });
}

function createShopItemElement(item) {
    const rarity = window.ITEM_RARITIES[item.rarity];
    const rarityColor = rarity ? rarity.color : '#9e9e9e';
    const isOwned = window.isItemOwned(item.id);
    const isUnlocked = window.unlockCheck(item);
    const canAfford = window.canAfford(item);
    
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', isUnlocked && !isOwned ? '0' : '-1');
    div.setAttribute('aria-label', `${item.name} - ${item.description}${!isUnlocked ? ' (Locked)' : isOwned ? ' (Owned)' : canAfford ? ' (Available)' : ' (Not enough gold)'}`);
    if (isOwned) div.classList.add('owned');
    if (!isUnlocked) div.classList.add('locked');
    
    div.style.cssText = `
        padding: 15px;
        background: var(--bg-secondary);
        border: 2px solid ${isUnlocked ? rarityColor : '#666'};
        border-radius: 8px;
        text-align: center;
        opacity: ${isUnlocked ? '1' : '0.6'};
        position: relative;
    `;
    
    const lockBadge = !isUnlocked ? '<span style="position: absolute; top: 5px; right: 5px; background: #666; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">🔒 LOCKED</span>' : '';
    const ownedBadge = isOwned ? '<span style="position: absolute; top: 5px; right: 5px; background: var(--snake-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">OWNED</span>' : '';
    
    div.innerHTML = `
        ${lockBadge || ownedBadge}
        <div style="font-size: 3em; margin-bottom: 10px;">${getItemIcon(item)}</div>
        <h3 style="margin: 0 0 5px 0; color: ${rarityColor};">${item.name}</h3>
        <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 0.9em; min-height: 40px;">${item.description}</p>
        <div style="margin: 10px 0;">
            <span style="padding: 4px 8px; background: ${rarityColor}; color: white; border-radius: 4px; font-size: 0.8em;">${rarity.name}</span>
        </div>
        ${!isUnlocked ? `
            <div style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; font-size: 0.85em; color: var(--text-secondary);">
                ${window.getUnlockRequirementsText ? window.getUnlockRequirementsText(item.id) : `Requires Level ${item.unlockLevel}`}
            </div>
        ` : ''}
        <div style="margin: 15px 0; font-size: 1.2em; color: #ffd700; font-weight: bold;">
            🪙 ${item.cost}
        </div>
        ${isOwned ? `
            <div style="color: var(--snake-color); margin-top: 10px;">Already Owned</div>
        ` : `
            <button class="btn" id="shopPurchaseBtn_${item.id}" 
                    ${!isUnlocked || !canAfford ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                    aria-label="${!isUnlocked ? 'Locked - ' : !canAfford ? 'Not enough gold - ' : 'Purchase '}${item.name}"
                    style="width: 100%; margin-top: 10px;">
                ${!canAfford ? 'Not Enough Gold' : 'Purchase'}
            </button>
        `}
    `;
    
    // Add tooltip
    div.title = item.description;
    
    // Register button with UnifiedButtonHandler if available
    const purchaseBtn = div.querySelector(`#shopPurchaseBtn_${item.id}`);
    if (purchaseBtn && window.UnifiedButtonHandler) {
        // Disable button if needed
        if (!isUnlocked || !canAfford) {
            window.UnifiedButtonHandler.disableButton(purchaseBtn);
        }
        
        // Register handler
        window.UnifiedButtonHandler.registerButton(purchaseBtn, () => {
            console.log(`[Button] Shop Purchase clicked: ${item.id}`);
            purchaseItemFromShop(item.id);
        });
    } else if (purchaseBtn) {
        // Fallback: use onclick
        purchaseBtn.onclick = () => purchaseItemFromShop(item.id);
    }
    
    return div;
}

function getItemIcon(item) {
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

function purchaseItemFromShop(itemId) {
    if (window.purchaseItem(itemId)) {
        // Play shop purchase sound
        if (window.UISoundSystem && window.UISoundSystem.playShopPurchase) {
            window.UISoundSystem.playShopPurchase();
        }
        // Show success message
        const item = window.ITEMS[itemId];
        alert(`Purchased ${item.name}!`);
        renderShop();
        if (window.updateProgressionUI) window.updateProgressionUI();
    } else {
        // Play error sound
        if (window.UISoundSystem && window.UISoundSystem.playError) {
            window.UISoundSystem.playError();
        }
        alert('Purchase failed! Check if you have enough gold or if the item is unlocked.');
    }
}

function updateRecommendedItem() {
    const recommendedDiv = document.getElementById('shopRecommendedItem');
    if (!recommendedDiv) return;
    
    // Get available items (unlocked, not owned, affordable or close)
    const availableItems = Object.values(window.ITEMS || {})
        .filter(item => {
            if (!window.unlockCheck(item)) return false;
            if (window.isItemOwned(item.id)) return false;
            return true;
        });
    
    if (availableItems.length === 0) {
        recommendedDiv.innerHTML = '<p style="color: var(--text-secondary);">All items unlocked!</p>';
        return;
    }
    
    // Rotate recommendation
    recommendedItemRotation = (recommendedItemRotation + 1) % availableItems.length;
    const recommended = availableItems[recommendedItemRotation];
    
    const rarity = window.ITEM_RARITIES[recommended.rarity];
    const rarityColor = rarity ? rarity.color : '#9e9e9e';
    const canAfford = window.canAfford(recommended);
    
    recommendedDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 3em;">${getItemIcon(recommended)}</div>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; color: ${rarityColor};">${recommended.name}</h4>
                <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 0.9em;">${recommended.description}</p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="color: #ffd700; font-weight: bold;">🪙 ${recommended.cost}</span>
                    ${canAfford ? '<span style="color: var(--snake-color);">✓ Affordable</span>' : '<span style="color: #f44336;">Need more gold</span>'}
                </div>
            </div>
            <button class="btn" onclick="purchaseItemFromShop('${recommended.id}')" 
                    ${!canAfford ? 'disabled style="opacity: 0.5;"' : ''}>
                Buy Now
            </button>
        </div>
    `;
}

// Export
window.renderShop = renderShop;
window.purchaseItemFromShop = purchaseItemFromShop;
window.updateRecommendedItem = updateRecommendedItem;

