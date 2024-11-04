import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-sam-dialog',
  template: `
    <h1 mat-dialog-title>Self-Assessment</h1>
    <div mat-dialog-content>
    <p>How do you feel? To get a Task Suggestion, please enter your perceived arousal and valence:</p>
      <div class="input-group justify-content-center">
        <h6>Arousal</h6>
        <img src="arousal_sam.jpg" alt="Arousal Image" class="input-image">
        <mat-form-field>
          <mat-label>Arousal (1-9)</mat-label>
          <input matInput [(ngModel)]="data.arousal" type="number" min="1" max="9" required>
        </mat-form-field>
      </div>
      
      <div class="input-group justify-content-center">
      <h6>Valence</h6>  
        <img src="valence_sam.jpg" alt="Valence Image" class="input-image">
        <mat-form-field>
          <mat-label>Valence (1-9)</mat-label>
          <input matInput [(ngModel)]="data.valence" type="number" min="1" max="9" required>
        </mat-form-field>
      </div>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button (click)="onSubmit()">Continue</button>
    </div>
  `,
  styles: [`
    .input-group {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .input-image {
      margin-right: 10px;
      width: 100%;
      height: 100%;
      padding-bottom: 10px;
    }
  `]
})
export class SamDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { arousal: number, valence: number }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.data);
  }
}