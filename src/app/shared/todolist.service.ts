import { Injectable } from '@angular/core';
import { Todo } from './todo';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TodoListService {
  public todos: Todo[] = [];
  private socket: Socket;

  constructor() { 
    this.socket = io(environment.websocketUrl, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io'  // Make sure this matches your server configuration
    });
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id); // Log when socket connects
      this.fetchTodos();
    });
  }

  // Method to listen for OSC streaming status
  onOSCStreaming(): Observable<boolean> {
    return fromEvent<boolean>(this.socket, 'oscStreaming');
  }
  
  // Observable for task suggestions using fromEvent
  onTaskSuggestion(): Observable<any> {
    return fromEvent(this.socket, 'taskSuggestion');
  }
  
  sendSAMData(samData: { arousal: number; valence: number; timestamp: Date }): void {
    this.socket.emit('saveSAMData', samData);
  }

  checkForTodos(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('noTodos', (response) => {
        observer.next(response);
      });

      this.socket.on('todosExist', (response) => {
        observer.next(response);
      });
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

 public onTodosFetched(): Observable<any[]> {
  return new Observable((observer) => {
    // Remove existing listeners
    this.socket.off('todos');
    this.socket.on('todos', (data) => {
      this.todos = data;
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
    const { taskId, ...todoData } = data;
    this.socket.emit('todoData', data);
  }

   // Update the onDataReceived method to remove previous listeners
   public onDataReceived(callback: (response: any) => void) {
    // Remove any existing 'dataReceived' listeners
    this.socket.off('dataReceived');
    // Add new listener
    this.socket.on('dataReceived', (response) => {
      if (response.success && response.todo) {
        this.todos.push(response.todo);
      }
      callback(response);
    });
  }
 
  public onDeleteConfirmed(callback: (response: any) => void) {
    this.socket.off('deleteConfirmed');
    this.socket.on('deleteConfirmed', callback);
  }

  public onUpdateConfirmed(callback: (response: any) => void) {
    this.socket.off('updateConfirmed');
    this.socket.on('updateConfirmed', callback);
  }
}