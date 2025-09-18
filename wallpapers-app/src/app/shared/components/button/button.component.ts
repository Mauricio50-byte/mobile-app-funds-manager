import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: false
})
export class ButtonComponent {
  @Input() text: string = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() color: string = 'primary';
  @Input() fill: 'clear' | 'outline' | 'solid' = 'solid';
  @Input() expand: 'block' | 'full' = 'block';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() size: 'small' | 'default' | 'large' = 'default';
  
  @Output() buttonClick = new EventEmitter<void>();

  constructor() { }

  onClick() {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }
}
