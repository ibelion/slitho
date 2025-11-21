// ==================== SKILL TREE UI ====================
// Renders skill tree interface

// Render skill tree
function renderSkillTree() {
    const container = document.getElementById('skillTreeContent');
    if (!container) return;
    
    const skills = window.getAllSkills ? window.getAllSkills() : [];
    const skillPoints = window.getSkillPoints ? window.getSkillPoints() : 0;
    
    // Update skill points display
    const pointsDisplay = document.getElementById('skillPointsDisplay');
    if (pointsDisplay) {
        pointsDisplay.textContent = skillPoints;
    }
    
    container.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
            <div style="font-size: 1.5em; color: var(--snake-color); font-weight: bold;">
                Skill Points: <span id="skillPointsDisplay">${skillPoints}</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9em; margin-top: 5px;">
                Earn skill points by achieving S-Rank on levels
            </div>
        </div>
        
        <div class="skill-tree-grid" id="skillTreeGrid"></div>
    `;
    
    const grid = document.getElementById('skillTreeGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    skills.forEach(skill => {
        const skillElement = createSkillElement(skill, skillPoints);
        grid.appendChild(skillElement);
    });
}

// Create skill element
function createSkillElement(skill, availablePoints) {
    const div = document.createElement('div');
    div.className = 'skill-node';
    
    const isUnlocked = window.isSkillUnlocked ? window.isSkillUnlocked(skill.id) : false;
    const isPurchased = window.isSkillPurchased ? window.isSkillPurchased(skill.id) : false;
    const canAfford = availablePoints >= skill.cost;
    
    if (!isUnlocked) {
        div.classList.add('locked');
    } else if (isPurchased) {
        div.classList.add('purchased');
    } else if (canAfford) {
        div.classList.add('affordable');
    }
    
    div.innerHTML = `
        <div class="skill-icon">${skill.icon}</div>
        <div class="skill-name">${skill.name}</div>
        <div class="skill-description">${skill.description}</div>
        ${!isUnlocked ? `
            <div class="skill-requirement">Unlocks at Level ${skill.unlockLevel}</div>
        ` : `
            <div class="skill-cost">
                ${isPurchased ? 
                    '<span style="color: var(--snake-color);">✓ Purchased</span>' : 
                    `Cost: ${skill.cost} SP`
                }
            </div>
        `}
    `;
    
    // Add click handler
    div.id = `skillNode_${skill.id}`;
    div.setAttribute('role', 'button');
    
    let ariaLabel = `${skill.name} - ${skill.description}`;
    if (!isUnlocked) {
        ariaLabel += ` - Locked (Unlocks at Level ${skill.unlockLevel})`;
    } else if (isPurchased) {
        ariaLabel += ' - Purchased';
    } else if (!canAfford) {
        ariaLabel += ` - Need ${skill.cost - availablePoints} more skill points`;
    } else {
        ariaLabel += ` - Cost: ${skill.cost} skill points`;
    }
    div.setAttribute('aria-label', ariaLabel);
    
    if (isUnlocked && !isPurchased && canAfford) {
        div.style.cursor = 'pointer';
        div.setAttribute('tabindex', '0');
        
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(div, () => {
                console.log(`[Button] Skill Purchase clicked: ${skill.id}`);
                if (window.purchaseSkill) {
                    if (window.purchaseSkill(skill.id)) {
                        renderSkillTree();
                    } else {
                        alert('Failed to purchase skill. Check if you have enough skill points.');
                    }
                }
            });
        } else {
            // Fallback
            div.addEventListener('click', () => {
                if (window.purchaseSkill) {
                    if (window.purchaseSkill(skill.id)) {
                        renderSkillTree();
                    } else {
                        alert('Failed to purchase skill. Check if you have enough skill points.');
                    }
                }
            });
        }
    } else if (isUnlocked && !isPurchased && !canAfford) {
        div.style.cursor = 'not-allowed';
        div.title = `Need ${skill.cost - availablePoints} more skill points`;
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    } else if (!isUnlocked) {
        div.style.cursor = 'not-allowed';
        div.title = `Unlocks at Level ${skill.unlockLevel}`;
        div.setAttribute('tabindex', '-1');
        div.setAttribute('aria-disabled', 'true');
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.disableButton(div);
        }
    }
    
    return div;
}

// Show skill tree modal
function showSkillTree() {
    const modal = document.getElementById('skillTreeModal');
    if (!modal) {
        createSkillTreeModal();
    }
    
    const skillTreeModal = document.getElementById('skillTreeModal');
    if (skillTreeModal) {
        // Update skill unlocks before rendering
        if (window.updateSkillUnlocks) {
            window.updateSkillUnlocks();
        }
        renderSkillTree();
        skillTreeModal.classList.add('show');
    }
}

// Hide skill tree modal
function hideSkillTree() {
    const modal = document.getElementById('skillTreeModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Create skill tree modal
function createSkillTreeModal() {
    const modal = document.createElement('div');
    modal.id = 'skillTreeModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>Skill Tree</h2>
                <button class="modal-close" id="skillTreeClose">&times;</button>
            </div>
            <div class="modal-body">
                <div id="skillTreeContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close button
    const closeBtn = document.getElementById('skillTreeClose');
    if (closeBtn) {
        if (window.UnifiedButtonHandler) {
            window.UnifiedButtonHandler.registerButton(closeBtn, () => {
                console.log('[Button] Skill Tree Close clicked');
                hideSkillTree();
            });
        } else {
            closeBtn.onclick = hideSkillTree;
        }
    }
}

// Export
window.renderSkillTree = renderSkillTree;
window.showSkillTree = showSkillTree;
window.hideSkillTree = hideSkillTree;

