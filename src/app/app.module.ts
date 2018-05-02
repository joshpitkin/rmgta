import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CarouselModule } from 'ngx-bootstrap/carousel';
import { AppComponent } from './app.component';
import { InventoryComponent } from './inventory/inventory.component';
import { AppRoutingModule } from './/app-routing.module';
import { HomeComponent } from './home/home.component';
import { InvService } from './inv.service';
import { TableComponent } from './table/table.component';
export * from './table/table.component';

// platform-multiselect 
import { AutofocusDirective } from './multiselect/dropdown/autofocus.directive';
import { MultiselectDropdown } from './multiselect/dropdown/dropdown.component';
import { MultiSelectSearchFilter } from './multiselect/dropdown/search-filter.pipe';
export * from './multiselect/dropdown/types';
export * from './multiselect/dropdown/autofocus.directive';
export * from './multiselect/dropdown/dropdown.component';


@NgModule({
  declarations: [
    AppComponent,
    InventoryComponent,
    HomeComponent,
    TableComponent,
    MultiselectDropdown,
    MultiSelectSearchFilter,
    AutofocusDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CarouselModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [InvService],
  bootstrap: [AppComponent]
})
export class AppModule { }
