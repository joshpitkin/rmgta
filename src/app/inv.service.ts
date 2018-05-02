import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class InvService {

  constructor(private http: HttpClient) { }

  getInventory(): Observable<any> {
    return this.http.get('../api/');
    // return this.http.get('../assets/sample.json');
  }

}
