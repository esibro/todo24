import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
 
export class AppComponent implements OnInit {
  private socket: any;
  public oscData: any;

   ngOnInit() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true, // Include credentials if necessary
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