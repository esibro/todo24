import { Injectable } from '@angular/core';
import { Todo } from './todo';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TodoListService {
  public todos: Todo[] = [];
  private socket: Socket;

  constructor() { 
    this.socket = io('http://localhost:3000'); // Make sure this URL is correct
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id); // Log when socket connects
    });
  }

  // Method to set the todos after they are fetched
  setTodos(todos: any[]): void {
    this.todos = todos;
  }

  // Emit request to get todos
  fetchTodos(): void {
    this.socket.emit('fetchTodos');
  }

  // Listen for todos
  public onTodosFetched(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('todos', (data) => {
        observer.next(data);
      });
    });
  }

  public getTodos(done?: boolean): Todo[] {
    return this.todos
      .filter(t => done === undefined || (done && t.doneDate) || (!done && !t.doneDate));
  }


  public addTodo(description: string, difficulty: number, done: boolean): void {
    let newId = 1;
    if (this.todos.length) {
      newId = Math.max(...this.todos.map(t => t.taskId)) + 1;
    }

    this.todos.push({taskId: newId, description: description, difficulty: difficulty, done: done });
  }

  public deleteTodoById(taskId: number): void {
    const index = this.todos.findIndex(t => t.taskId === taskId);
    if (index >= 0) {
      this.todos.splice(index, 1);
    }
    this.socket.emit('deleteTodo', { taskId }); 
  }
  
  public updateTodoById(taskId: number, description: string, difficulty: number): void {
    const index = this.todos.findIndex(t => t.taskId === taskId);
    if (index >= 0) {
      this.todos[index].description = description;
      this.todos[index].difficulty = difficulty;
      this.todos[index].done = true;
    }
  }

  public toggleDoneStateById(taskId: number): void {
    const index = this.todos.findIndex(t => t.taskId === taskId);
    if (index >= 0) {
      if (this.todos[index].doneDate) {
        this.todos[index].doneDate = undefined;
      } else {
        this.todos[index].doneDate = new Date();
      }
      this.todos[index].done = true;
    }
  }

  public updateTodoStatus(taskId: number, done: boolean) {
    console.log('Sending update for ID:', taskId); // Add a log here
    this.socket.emit('updateTodoStatus', { taskId, done}); 
  }

  // Emit the todo data to the server
  public sendTodoData(data: any) {
    this.socket.emit('todoData', data);
  }

  // Listen for acknowledgment from the server (optional)
  public onDataReceived(callback: (response: any) => void) {
    this.socket.on('dataReceived', callback);
  }

  // Listen for deletion acknowledgment
  onDeleteConfirmed(callback: (response: any) => void) {
    this.socket.on('deleteConfirmed', callback);
  }

  // Listen for update confirmation from the server
  public onUpdateConfirmed(callback: (response: any) => void) {
    this.socket.on('updateConfirmed', callback);
  }
}