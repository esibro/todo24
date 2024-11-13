import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { UserService } from './shared/user.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
 
export class AppComponent implements OnInit {
  private socket: any;
  public oscData: any;
  userName: string = '';
  
  constructor(private userService: UserService) {}

   ngOnInit() {

    this.userService.getUserName().subscribe(
      name => {
        this.userName = name;
      },
      error => {
        console.error('Error fetching user name:', error);
        this.userName = 'User'; // Fallback name
      }
    );

    this.socket = io(environment.websocketUrl, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Log connection events
  this.socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  // Listen for the OSC data object containing means
  this.socket.on('oscData', (data: any) => {
    console.log('Received OSC data:', data);
    this.oscData = data;
  });

  this.socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });
  } 

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}