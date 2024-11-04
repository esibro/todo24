import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskSuggestionDialogComponent } from './task-suggestion-dialog.component';

describe('TaskSuggestionDialogComponent', () => {
  let component: TaskSuggestionDialogComponent;
  let fixture: ComponentFixture<TaskSuggestionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskSuggestionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskSuggestionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
