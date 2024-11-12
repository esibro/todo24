import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => {
      console.log('UserService socket connected');
    });
  }

  getUserName(): Observable<string> {
    return new Observable(observer => {
      console.log('Requesting user name...');
      this.socket.emit('getUserName');
      
      this.socket.off('userName');
      this.socket.on('userName', (data) => {
        console.log('Received user name:', data);
        observer.next(data.name);
      });
    });
  }
}