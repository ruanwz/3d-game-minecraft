import { BlockType } from '@/world/block';
import { generateBlockIcon } from './icons';

export class Hotbar {
    private selectedSlot: number = 0;
    private slots: BlockType[] = [];
    private container: HTMLElement;
    private onSelect: (blockType: BlockType) => void;

    constructor(onSelect: (blockType: BlockType) => void) {
        this.onSelect = onSelect;
        this.container = document.getElementById('hotbar')!;
        this.updateDisplay();
    }

    setItems(items: BlockType[]) {
        this.slots = items;
        // Ensure selected slot is valid
        if (this.selectedSlot >= this.slots.length) {
            this.selectedSlot = 0;
        }
        this.updateDisplay();
        this.triggerSelection();
    }

    selectSlot(index: number) {
        if (index >= 0 && index < this.slots.length) {
            this.selectedSlot = index;
            this.updateDisplay();
            this.triggerSelection();
        }
    }

    selectNext() {
        this.selectSlot((this.selectedSlot + 1) % this.slots.length);
    }

    selectPrevious() {
        this.selectSlot((this.selectedSlot - 1 + this.slots.length) % this.slots.length);
    }

    getSelectedBlock(): BlockType {
        return this.slots[this.selectedSlot] || BlockType.AIR;
    }

    private triggerSelection() {
        const block = this.getSelectedBlock();
        this.onSelect(block);
    }

    private updateDisplay() {
        this.container.innerHTML = '';

        this.slots.forEach((blockType, index) => {
            const slot = document.createElement('div');
            slot.className = `hotbar-slot ${index === this.selectedSlot ? 'active' : ''}`;
            slot.onclick = () => this.selectSlot(index);

            const number = document.createElement('span');
            number.textContent = (index + 1).toString();
            slot.appendChild(number);

            const iconSvg = generateBlockIcon(blockType);
            const iconContainer = document.createElement('div');
            iconContainer.className = 'block-icon';
            iconContainer.innerHTML = iconSvg;
            slot.appendChild(iconContainer);

            this.container.appendChild(slot);
        });
    }
}
