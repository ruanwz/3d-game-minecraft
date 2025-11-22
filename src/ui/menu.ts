
import { BlockType, BLOCK_REGISTRY } from '@/world/block';
import { GameEngine } from '@/core/engine';

export interface MenuCallbacks {
    onResume: () => void;
    onSave: (name?: string) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    getSaves: () => Array<{ id: string; name: string; date: number }>;
    isItemAvailable: (type: BlockType) => boolean;
    toggleItemAvailability: (type: BlockType, available: boolean) => void;
}

export class Menu {
    private container: HTMLElement;
    private itemSelectionContainer: HTMLElement;
    private saveListContainer: HTMLElement;
    private callbacks: MenuCallbacks;
    private isVisible: boolean = false;

    constructor(callbacks: MenuCallbacks) {
        this.callbacks = callbacks;
        this.container = document.getElementById('settings-menu')!;
        this.itemSelectionContainer = document.getElementById('item-selection')!;

        // Create save list container if not exists (it will be added by HTML update, but let's grab it)
        // We need to update HTML first or inject it here. Let's assume HTML update happens or we inject.
        // Actually, let's inject the structure if missing or just expect it.
        // For now, let's assume we will update HTML next.
        this.saveListContainer = document.getElementById('save-list')!;
        if (!this.saveListContainer) {
            // Create it dynamically if missing to avoid crash before HTML update
            const section = this.container.querySelector('.menu-section');
            if (section) {
                this.saveListContainer = document.createElement('div');
                this.saveListContainer.id = 'save-list';
                section.appendChild(this.saveListContainer);
            }
        }

        this.setupEventListeners();
        this.renderItemSelection();
    }

    private setupEventListeners() {
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.hide();
            this.callbacks.onResume();
        });

        document.getElementById('btn-save')?.addEventListener('click', () => {
            this.callbacks.onSave();
            this.showStatus('游戏已保存！');
            this.renderSaveList(); // Refresh list
        });

        // Delete button is now per-save, remove global delete listener if it existed
        // But we might keep a "New Save" button instead of generic "Save"
    }

    private renderSaveList() {
        if (!this.saveListContainer) return;
        this.saveListContainer.innerHTML = '';

        const saves = this.callbacks.getSaves();

        if (saves.length === 0) {
            this.saveListContainer.innerHTML = '<div style="color: #aaa; padding: 10px;">暂无存档</div>';
            return;
        }

        saves.forEach(save => {
            const item = document.createElement('div');
            item.className = 'save-item';

            const info = document.createElement('div');
            info.className = 'save-info';
            info.innerHTML = `<div class="save-name">${save.name}</div><div class="save-date">${new Date(save.date).toLocaleString()}</div>`;

            const actions = document.createElement('div');
            actions.className = 'save-actions';

            const loadBtn = document.createElement('button');
            loadBtn.textContent = '读取';
            loadBtn.onclick = () => {
                this.callbacks.onLoad(save.id);
                this.hide();
                this.callbacks.onResume();
            };

            const delBtn = document.createElement('button');
            delBtn.textContent = '删除';
            delBtn.style.backgroundColor = '#8b0000';
            delBtn.onclick = () => {
                if (confirm('确定要删除这个存档吗？')) {
                    this.callbacks.onDelete(save.id);
                    this.renderSaveList();
                }
            };

            actions.appendChild(loadBtn);
            actions.appendChild(delBtn);

            item.appendChild(info);
            item.appendChild(actions);
            this.saveListContainer.appendChild(item);
        });
    }

    private showStatus(msg: string) {
        const status = document.getElementById('save-status');
        if (status) {
            status.textContent = msg;
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }
    }

    private renderItemSelection() {
        this.itemSelectionContainer.innerHTML = '';

        // Get all block types except AIR
        const blockTypes = Object.keys(BLOCK_REGISTRY)
            .map(Number)
            .filter(type => type !== BlockType.AIR);

        blockTypes.forEach(type => {
            const label = document.createElement('label');
            label.className = 'item-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = type.toString();
            checkbox.checked = this.callbacks.isItemAvailable(type as BlockType);

            checkbox.onchange = (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                this.callbacks.toggleItemAvailability(type as BlockType, checked);
            };

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(BLOCK_REGISTRY[type as BlockType].name));

            this.itemSelectionContainer.appendChild(label);
        });
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.renderItemSelection(); // Refresh state
        this.renderSaveList(); // Refresh saves
    }

    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
            this.callbacks.onResume();
        } else {
            this.show();
            // Pause is handled by the caller usually, but we can assume showing menu implies pause request
        }
    }

    isOpen(): boolean {
        return this.isVisible;
    }
}
