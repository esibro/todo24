import { Component, OnInit } from '@angular/core';
import { Todo } from '../shared/todo';
import { TodoListService } from '../shared/todolist.service';
import { MatDialog } from '@angular/material/dialog';
import { SamDialogComponent } from '../sam-dialog.component';
import { TaskSuggestionDialogComponent } from '../task-suggestion-dialog/task-suggestion-dialog.component';
import { Subscription, timer } from 'rxjs';



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
  public oscStreaming: boolean = false;  // Indicates if OSC data is streaming
  public noConnection: boolean = false;  // Indicates if there's no connection
  private oscStreamingSubscription: Subscription | undefined;
  private connectionTimeoutSubscription: Subscription | undefined;
  private dataReceivedSubscription: any;

   // Filter items only show without doneDate, order by dueDate
   constructor(public dialog: MatDialog, public todoListService: TodoListService) { }

   ngOnInit(): void {

    // Clean up previous subscriptions if they exist
    if (this.dataReceivedSubscription) {
      this.dataReceivedSubscription.unsubscribe();
    }

    // Listen for the OSC streaming status
    this.oscStreamingSubscription = this.todoListService.onOSCStreaming().subscribe((status: boolean) => {
      this.oscStreaming = status;
      this.noConnection = !status; // If streaming is false, set noConnection to true
      this.resetConnectionTimeout(); // Reset the connection timeout
      console.log('OSC Streaming status:', status); // Add logging to debug
    });

    // Fetch todos via socket
    this.todoListService.fetchTodos();
    
    // Subscribe to fetched todos
    this.todoListService.onTodosFetched().subscribe((todos) => {
      console.log('Todos fetched via socket:', todos);
      this.todos = todos;
      this.todoListService.setTodos(todos); // Update the service's todos array
  });
    
    this.todoListService.onTaskSuggestion().subscribe((suggestion) => {
      this.openTaskSuggestionDialog(suggestion);
    });
  }

   // Reset or start the connection timeout if no data is received
   private resetConnectionTimeout() {
    if (this.connectionTimeoutSubscription) {
      this.connectionTimeoutSubscription.unsubscribe();
    }
    this.connectionTimeoutSubscription = timer(5000).subscribe(() => {
      if (!this.oscStreaming) {
        this.noConnection = true;  // No data received for 5 seconds
      }
    });
  }

  ngOnDestroy() {
    // Cleanup all subscriptions when component is destroyed
    if (this.oscStreamingSubscription) {
      this.oscStreamingSubscription.unsubscribe();
    }
    if (this.connectionTimeoutSubscription) {
      this.connectionTimeoutSubscription.unsubscribe();
    }
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

  submitTodo() {
    const todoData = {
      difficulty: this.todoDifficulty,
      description: this.todoDescription,
      done: this.todoDone
    };

    this.todoListService.sendTodoData(todoData);

    // Set up single listener for the response
    this.todoListService.onDataReceived((response) => {
      if (response.success) {
        // Clear form fields
        this.todoDescription = '';
        this.todoDifficulty = 0;
        this.todoDone = false;
        this.showTaskForm = false;
      } else {
        console.error('Error saving todo:', response.error);
      }
    });
  }

}

