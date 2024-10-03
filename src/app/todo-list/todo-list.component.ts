import { Component, OnInit } from '@angular/core';
import { Todo } from '../shared/todo';
import { TodoListService } from '../shared/todolist.service';

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

   // Filter items only show without doneDate, order by dueDate
   constructor(public todoListService: TodoListService) { }

   ngOnInit(): void {

    // Fetch todos via socket
  this.todoListService.fetchTodos();
  
  // Listen for todos
  this.todoListService.onTodosFetched().subscribe((todos) => {
    console.log('Todos fetched via socket:', todos);
    this.todos = todos;
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

