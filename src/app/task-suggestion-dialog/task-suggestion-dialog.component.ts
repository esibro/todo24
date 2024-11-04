import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-task-suggestion-dialog',
  templateUrl: './task-suggestion-dialog.component.html',
  styleUrl: './task-suggestion-dialog.component.scss'
})
export class TaskSuggestionDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
