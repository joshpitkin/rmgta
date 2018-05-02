import { Component, OnInit } from '@angular/core';
import { InvService } from '../inv.service';
import { DataArrayOfObjects, GenericTableConfiguration } from '../classes/Interfaces'

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {

  constructor(private invService: InvService) { }
  tableData: DataArrayOfObjects|null;
  tableConfig: GenericTableConfiguration
  ngOnInit() {
    this.tableConfig = {
      showGlobalFilter: true,
      showPaginate: true,      
      pageSize: 20,
    };
    this.tableConfig.columnConfig = [
      { columnLabel: 'Images', columnProp: 'Images' },
      { columnLabel: 'Year', columnProp: 'Year' },
      { columnLabel: 'Make', columnProp: 'Make' },
      { columnLabel: 'Model', columnProp: 'Model' },
      { columnLabel: 'Mileage', columnProp: 'Mileage' },
      { columnLabel: 'Features', columnProp: 'Features' },
      { columnLabel: 'Options', columnProp: 'Options' },
      { columnLabel: 'Pricing', columnProp: 'Pricing' },
      { columnLabel: 'Comments', columnProp: 'Comments' },
    ];
    this.invService.getInventory().subscribe((res) =>{
      console.log('got data', res);
      this.tableData = res;
    });
  }
}
