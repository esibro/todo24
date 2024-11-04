import { Component, OnInit } from '@angular/core';
import { Todo } from '../shared/todo';
import { TodoListService } from '../shared/todolist.service';
import { MatDialog } from '@angular/material/dialog';
import { SamDialogComponent } from '../sam-dialog.component';
import { TaskSuggestionDialogComponent } from '../task-suggestion-dialog/task-suggestion-dialog.component';



@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss'
})


export class TodoListComponent implements OnInit {
  public todos: any[] = [];
  public todoDescription = '';
  public todoDifficulty = 0;
  public showDone = false;
  public taskId = 1;
  public todoDone = false;
  public showTaskForm: boolean = false;

   // Filter items only show without doneDate, order by dueDate
   constructor(public dialog: MatDialog, public todoListService: TodoListService) { }

   ngOnInit(): void {

    // Fetch todos via socket
    this.todoListService.fetchTodos();
    
    // Listen for todos
    this.todoListService.onTodosFetched().subscribe((todos) => {
      console.log('Todos fetched via socket:', todos);
      this.todos = todos;
    });
    
    this.todoListService.onTaskSuggestion().subscribe((suggestion) => {
      this.openTaskSuggestionDialog(suggestion);
    });
  }

 // Toggle form visibility
 toggleTaskForm() {
  this.showTaskForm = !this.showTaskForm;
}

  openTaskSuggestionDialog(suggestion: any): void {
    // Open the dialog with the suggestion data
    this.dialog.open(TaskSuggestionDialogComponent, {
      data: suggestion,
    });
  }

  openSAMPopup(): void {
    const dialogRef = this.dialog.open(SamDialogComponent, {
      width: '600px',
      data: { arousal: null, valence: null },
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const samData = { arousal: result.arousal, valence: result.valence, timestamp: new Date() };
        this.todoListService.sendSAMData(samData);
  
        // Listen for the server response regarding todo existence
        this.todoListService.checkForTodos().subscribe(response => {
          if (response.message === 'Please create at least two tasks for task suggestions.') {
            // Display a message to the user to create todos
            alert(response.message);
          } else {
            console.log('Tasks exist, moving to the next part of the algorithm.');
            // Proceed to the next steps for task suggestions
          }
        });
      }
    });
  }

  // Call the delete function with the todo's ID
  deleteTodo(taskId: number) {
    console.log('Deleting todo with ID:', taskId);
    this.todoListService.deleteTodoById(taskId);

    // Listen for server confirmation
    this.todoListService.onDeleteConfirmed((response) => {
      console.log('Delete confirmation:', response);

      
    });
  }

  addTodo(): void {
    if (this.todoDescription && this.todoDifficulty) {
      this.todoListService.addTodo(this.todoDescription, this.todoDifficulty, this.todoDone);
      this.todoDescription = '';
      this.todoDifficulty = 0;
      this.todoDone = false;
      this.showTaskForm = false;
    }
  }

  doneTodo(taskId: number) {
    this.todoListService.toggleDoneStateById(taskId);
    this.todoDone = true;
    this.todoListService.updateTodoStatus(taskId, true);
    this.todoListService.onUpdateConfirmed((response) => {
      console.log('Update confirmation:', response) });
      console.log('Done clicked');
  }

  // Send todo data to the server
  submitTodo() {
    const todoData = {
      taskId : this.taskId++,
      difficulty: this.todoDifficulty,
      description: this.todoDescription,
      done: this.todoDone
    };

    this.todoListService.sendTodoData(todoData);

    // Listen for acknowledgment from the server
    this.todoListService.onDataReceived((response) => {
      console.log('Server response:', response);
    });

    this.addTodo();
  }

}

