import { Component, OnInit } from '@angular/core';

import { TodoListService } from '../shared/todolist.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(public todoListService: TodoListService) { }

  ngOnInit(): void {
  }

  getTodoPercentage(): number {
    const allTodos = this.todoListService.getTodos();

    if (allTodos.length) {
      return this.todoListService.getTodos(false).length / allTodos.length * 100;
    } else {
      return 0;
    }
  }

  getDonePercentage(): number {
    const allTodos = this.todoListService.getTodos();

    if (allTodos.length) {
      return this.todoListService.getTodos(true).length / allTodos.length * 100;
    } else {
      return 0;
    }
  }
}