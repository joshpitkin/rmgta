import { Params } from '@angular/router';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ElementRef,
  ViewChild,
  TemplateRef
} from '@angular/core';

import { Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/takeUntil';

import { IMultiSelectOption, IMultiSelectSettings } from '../multiselect';

import {
  GenericTableConfiguration,
  NameValue,
  TableColumnRules,
  DataTableValueInfo,
  TableButtonInfo,
  ColumnConfig,
  ColumnHeaderConfigs,
  CellInfo,
  DataSet,
  DataArrayOfObjects
} from '../classes/Interfaces';

import { DataSetFilter, FilterSpec } from '../classes/DataSetFilter';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, OnDestroy, OnChanges {

  @Output() RemoveFilter: EventEmitter<string> = new EventEmitter<string>();
  @Output() AddFilter: EventEmitter<NameValue> = new EventEmitter<NameValue>();
  @Output() NewSort: EventEmitter<NameValue> = new EventEmitter<NameValue>();
  @Output() ButtonClick: EventEmitter<Params> = new EventEmitter<Params>();
  @Output() ButtonInfoClick: EventEmitter<Params> = new EventEmitter<Params>();
  @Output() Hover: EventEmitter<Params> = new EventEmitter<Params>();
  @Output() ValueClick: EventEmitter<DataTableValueInfo> = new EventEmitter<DataTableValueInfo>();
  @Output() RowClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() RowSelect: EventEmitter<any> = new EventEmitter<any>();
  @Output() PageChange: EventEmitter<any> = new EventEmitter<any>();

  @Input() Config: GenericTableConfiguration;
  @Input() TableData: DataArrayOfObjects | null;
  @Input() Dataset: DataSet;
  @Input() SortAndfilterLocally = false;


  @Input() columnHeaderTemplate: TemplateRef<any>;
  @Input() columnFilterTemplate: TemplateRef<any>;
  @Input() cellBodyTemplate: TemplateRef<any>;

  @ViewChild('tableSelection') tableSelection: ElementRef;

  searchUpdated: Subject<NameValue> = new Subject<NameValue>();
  ngUnsubscribe: Subject<boolean> = new Subject();
  defaultPageSize = 20;
  currentPage = 0;
  currentRecordStart = 0;
  currentRecordEnd = 0;
  minPage = 0;
  maxPage = 0;
  columns: string[] = [];
  rows: string[][] = [];
  filterRows: string[][] = [];
  filter = '';
  filterlkp: Params = [];
  dropdowns: string[][] = [];
  dataSetCells: CellInfo[][] = [];
  paretoColumns: string[] = [];
  currentPageOfRows: string[][];
  selectedRow: number;
  selectedCol: number;
  multiSelectSettings: IMultiSelectSettings = {
    enableSearch: true,
    dynamicTitleMaxItems: 0,
    buttonClasses: 'btn btn-sm btn-secondary',
    displayAllSelectedText: false,
    showCheckAll: true,
    showUncheckAll: true,
  };
  localFilters: Params = [];

  filterRowVisible = true;
  dropdownRowVisible = false;

  defaultConfig: GenericTableConfiguration =
    {
      sortAndfilterLocally: true,
      showGlobalFilter: true,
      showPaginate: true,
      showFilterSortRow: true,
      showColumnDropdowns: false,
      pageSize: 20,
      tableColumnRules: [],
      columnConfig: [],
      columnHeaderConfigs: [],
      showPageSizeSelector: true,
      showPageRecordsCount: true,
      showFirstLastPageSelector: true,
      showPageInput: true,
      showFilterToggleButton: true,
      showGlobalFilterLabel: true,
      showExportToCsv: false,
      tableTitle: '',
      selectMode: undefined
    }

  constructor() { }

  MergeConfig() {

    if (this.Config) {
      if (!this.Config.buttonInfoList) {
        this.Config.buttonInfoList = this.defaultConfig.buttonInfoList;
      }
      if (!this.Config.buttonNames) {
        this.Config.buttonNames = this.defaultConfig.buttonNames;
      }

      if (this.Config.pageSize === undefined) {
        this.Config.pageSize = this.defaultConfig.pageSize;
      }

      if (this.Config.showGlobalFilter === undefined) {
        this.Config.showGlobalFilter = this.defaultConfig.showGlobalFilter;
      }

      if (this.Config.showPaginate === undefined) {
        this.Config.showPaginate = this.defaultConfig.showPaginate;
      }

      if (this.Config.showColumnDropdowns === undefined) {
        this.Config.showColumnDropdowns = this.defaultConfig.showColumnDropdowns;
      }

      if (this.Config.showFilterSortRow === undefined) {
        this.Config.showFilterSortRow = this.defaultConfig.showFilterSortRow;
      }

      if (this.Config.sortAndfilterLocally === undefined) {
        this.Config.sortAndfilterLocally = this.defaultConfig.sortAndfilterLocally;
      }

      if (this.Config.showExportToCsv === undefined) {
        this.Config.showExportToCsv = this.defaultConfig.showExportToCsv;
      }

      if (this.Config.showPageSizeSelector === undefined) {
        this.Config.showPageSizeSelector = this.defaultConfig.showPageSizeSelector;
      }

      if (this.Config.showPageRecordsCount === undefined) {
        this.Config.showPageRecordsCount = this.defaultConfig.showPageRecordsCount;
      }

      if (this.Config.showFirstLastPageSelector === undefined) {
        this.Config.showFirstLastPageSelector = this.defaultConfig.showFirstLastPageSelector;
      }

      if (this.Config.showPageInput === undefined) {
        this.Config.showPageInput = this.defaultConfig.showPageInput;
      }

      if (this.Config.showFilterToggleButton === undefined) {
        this.Config.showFilterToggleButton = this.defaultConfig.showFilterToggleButton;
      }

      if (this.Config.showGlobalFilterLabel === undefined) {
        this.Config.showGlobalFilterLabel = this.defaultConfig.showGlobalFilterLabel;
      }

      if (this.Config.tableTitle === undefined) {
        this.Config.tableTitle = this.defaultConfig.tableTitle;
      }

      if (this.Config.tableColumnRules === undefined) {
        this.Config.tableColumnRules = this.defaultConfig.tableColumnRules;
      }

      if (this.Config.columnConfig === undefined) {
        this.Config.columnConfig = this.defaultConfig.columnConfig;
      }

      if (this.Config.columnHeaderConfigs === undefined) {
        this.Config.columnHeaderConfigs = this.defaultConfig.columnHeaderConfigs;
      }

      if (this.Config.selectMode === undefined) {
        this.Config.selectMode = this.defaultConfig.selectMode;
      }
    }
  }

  NeedsButtonColumn(): boolean {
    const returnValue = this.HasButtons();
    return returnValue;
  }

  HasButtons(): boolean {
    const cfg = this.Config;
    return (cfg.buttonNames && cfg.buttonNames.length > 0) || (cfg.buttonInfoList && cfg.buttonInfoList.length > 0);
  }

  TotalColumnCount(): number {
    let colCount = this.columns.length;
    if (this.HasButtons()) {
      colCount++;
    }
    return colCount;
  }

  ToggleFilterSortRow() {

    if (this.filterRowVisible) {
      this.filterRowVisible = false;
      this.dropdownRowVisible = this.Config.showColumnDropdowns;
    } else if (this.dropdownRowVisible) {
      this.dropdownRowVisible = false;
      this.filterRowVisible = false;
    } else {
      this.filterRowVisible = true;
      if (!this.filterRowVisible) {
        this.dropdownRowVisible = this.Config.showColumnDropdowns;
      }
    }
  }

  RefreshFromDataSet(TableDataChanged: boolean = false) {
    // columns
    if (this.Dataset && this.Dataset.columns && this.Dataset.columns.length > 0 && !TableDataChanged) {
      this.columns = this.Dataset.columns;
    } else if (this.TableData && this.TableData.length && this.Config.columnConfig.length === 0) {
      let fr = this.TableData[0];
      let cols = [];
      for (let c in fr) {
        cols.push(c);
      }
      this.columns = cols;
    } else if (this.Config.columnConfig.length > 0) {
      // dataset wants columns to be the property names for the values
      this.columns = this.Config.columnConfig.map(c => { return c.columnProp })
    }
    // columnConfig
    if (this.Dataset && this.Dataset.columns && this.Dataset.columns.length > 0 && this.Config.columnConfig.length === 0 && !TableDataChanged) {
      // generate a base columnConfig for the dataset
      this.Config.columnConfig = this.columns.map(c => { return { columnProp: c, columnLabel: c } })
    } else if (this.TableData && this.TableData.length && this.Config.columnConfig.length === 0) {
      // generate a dummy column config
      this.Config.columnConfig = this.columns.map(c => { return { columnProp: c, columnLabel: c } })
    } else {
      // reuse the provided columnConfig
    }
    // rows, also Dataset if TableData input was provided and hasn't been transformed yet
    if (this.Dataset && this.Dataset.columns && this.Dataset.columns.length > 0 && !TableDataChanged) {
      this.rows = this.Dataset.data;
    } else if (this.TableData && this.TableData.length) {
      this.Dataset = this.TransformToDataSet();
      this.rows = this.Dataset.data;
    } else if (TableDataChanged) {
      // input for TableData changed, but it is now empty.  need to clear the rows and dataset.data
      this.rows = [];
      if (this.Dataset) {
        this.Dataset.data = [];
      }
      this.currentPage = 0;
      this.minPage = 0;
      this.maxPage = 0;
    }
    // set page and filters finally
    if ((this.TableData && this.TableData.length) || (this.Dataset && this.Dataset.columns && this.Dataset.columns.length > 0)) {
      this.minPage = 1;
      this.CalculateMaxPage();
      this.currentPage = (this.Config.currentPage && this.Config.currentPage <= this.maxPage) ? this.Config.currentPage : 1;
      if (this.Config.sortAndfilterLocally) {
        this.ApplyFilterParams();
      } else {
        this.ApplyGlobalFilter();
      }
    } else {
      this.columns = [];
      this.rows = [];
      this.currentPage = 0;
      this.minPage = 0;
      this.maxPage = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.MergeConfig();
    if (changes['TableData'] || changes['Dataset']) {
      const TableDataChanged = (typeof changes["TableData"] !== 'undefined');
      this.RefreshFromDataSet(TableDataChanged);
    }
  }

  ngOnInit() {
    this.MergeConfig();
    this.searchUpdated
      .debounceTime(380)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(e => { this.filterUpdate(e) });

    this.filterRowVisible = this.Config.showFilterSortRow;
    this.dropdownRowVisible = this.filterRowVisible ? false : this.Config.showColumnDropdowns;
  }

  filterUpdate(filterNV: NameValue, forceOnEmpty = false) {
    if (filterNV.value === undefined || filterNV.value === '') {
      if (this.Config.sortAndfilterLocally) {
        this.LocalRemoveFilter(filterNV.name);
      } else {
        this.RemoveFilter.emit(filterNV.name);
      }
    } else {
      //unless they specify =, !, < or > then default to contains filter type, not ncstartswith
      const formatted = (filterNV.value.startsWith('=') ||
        filterNV.value.startsWith('!') ||
        filterNV.value.startsWith('>') ||
        filterNV.value.startsWith('<') ||
        filterNV.value.startsWith('in[')) ? FilterSpec.UserExpressionToFormatted(filterNV.value) : 'nccontains|' + filterNV.value;
      if (formatted.endsWith('|') && !forceOnEmpty) {
        // do nothing - user has entered first part of an expression but no value
      } else {
        if (this.Config.sortAndfilterLocally) {
          this.LocalAddFilter(filterNV.name, formatted);
        } else {
          this.AddFilter.emit({ name: filterNV.name, value: formatted });
        }
      }
    }
  }

  ToggleAndSort(colName: string, e: any) {
    const asc: string = 'fa fa-sort-amount-desc';
    const desc: string = 'fa fa-sort-amount-asc';
    const target: string = 'fa';
    const p: Params[] = [];
    const colCfgIx = this.Config.columnConfig.map(c => c.columnProp).indexOf(colName);
    const curSortClass = this.Config.columnConfig[colCfgIx].sortClass;
    // reset all the other sort icons - only one sort at a time currently supported
    this.Config.columnConfig.forEach((cf, ix) => { if (ix !== colCfgIx) { cf.sortClass = null; } })
    // TODO: for now columnSortByProp only supported locally
    if (this.Config.columnConfig[colCfgIx].columnSortByProp && this.Config.sortAndfilterLocally) {
      const sortProp = this.Config.columnConfig[colCfgIx].columnSortByProp;
      // for now extended features only work if we started with a TableData input, where one of the properties = columnSortByProp
      // we stuck our real row object on the end of the rows array
      if (this.TableData && this.TableData.length) {
        this.Dataset.data = this.Dataset.data.sort((a, b) => {
          const a_obj: {} = a[b.length - 1];
          const b_obj: {} = b[b.length - 1];
          // should work for alpha and int sorting ok
          if (curSortClass === desc) {
            if (b_obj[sortProp] < a_obj[sortProp]) return -1
            if (b_obj[sortProp] > a_obj[sortProp]) return 1
            return 0
          } else {
            if (a_obj[sortProp] < b_obj[sortProp]) return -1
            if (a_obj[sortProp] > b_obj[sortProp]) return 1
            return 0
          }
        });
        if (curSortClass === asc) {
          this.Config.columnConfig[colCfgIx].sortClass = desc;
        } else {
          this.Config.columnConfig[colCfgIx].sortClass = asc;
        }
        this.RefreshFromDataSet();
        this.Config.columnConfig[colCfgIx].sortClass = desc;
      }
    } else if (this.Config.sortAndfilterLocally) {
      if (curSortClass === asc) {
        p[colName] = 'asc';
        // DataSetFilter.SortDataSet(this.Dataset, p, []);
        this.RefreshFromDataSet();
        this.Config.columnConfig[colCfgIx].sortClass = desc;
      } else {
        p[colName] = 'desc';
        // DataSetFilter.SortDataSet(this.Dataset, p, []);
        this.RefreshFromDataSet();
        this.Config.columnConfig[colCfgIx].sortClass = asc;
      }
    } else {
      if (curSortClass === asc) {
        this.NewSort.emit({ name: colName, value: 'asc' });
        this.Config.columnConfig[colCfgIx].sortClass = desc;
      } else {
        this.NewSort.emit({ name: colName, value: 'desc' });
        this.Config.columnConfig[colCfgIx].sortClass = asc;
      }
    }
  }

  ExportToCsv() {
    const exportCsvOptions = this.Config.csvExportOptions;
    const separator = exportCsvOptions && exportCsvOptions.separator ? exportCsvOptions.separator : ',';
    const filename = exportCsvOptions && exportCsvOptions.fileName ? exportCsvOptions.fileName : 'download';
    // TODO: Add this
    // const onlyExportVisibleColumns =
    // exportCsvOptions && exportCsvOptions.onlyExportVisibleColumns ? exportCsvOptions.onlyExportVisibleColumns : false;

    let csvContent = '';
    csvContent += this.columns.join(separator);
    csvContent += '\n';

    this.filterRows.forEach((infoArray, index) => {
      let dataString = infoArray.join(separator);
      if (typeof infoArray[infoArray.length-1] === 'object') {
        dataString = infoArray.splice(0,infoArray.length-1).join(separator);
      }
      
      csvContent += index < this.filterRows.length ? dataString + '\n' : dataString;
    });

    this.DownloadCsv(csvContent, filename + '.csv', 'text/csv;encoding:utf-8');
  }

  DownloadCsv(content, fileName, mimeType) {
    const a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
      navigator.msSaveBlob(new Blob([content], {
        type: mimeType
      }), fileName);
    } else if (URL && 'download' in a) { // html5 A[download]
      a.href = URL.createObjectURL(new Blob([content], {
        type: mimeType
      }));
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      location.href = 'data:application/octet-stream,' + encodeURIComponent(content);
    }
  }

  SetSort(colName: string, sortExpression: string) {
    if (this.Config.sortAndfilterLocally) {
      const p: Params = [];
      p[colName] = sortExpression;
      DataSetFilter.SortDataSet(this.Dataset, p, []);
      this.RefreshFromDataSet();
    } else {
      this.NewSort.emit({ name: colName, value: sortExpression });
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }

  private getColumnRule(col: string): TableColumnRules {
    let rule = this.Config.tableColumnRules.find(r => r.columnName === col);
    if (rule) { return rule; }
    rule = this.Config.tableColumnRules.find(r => r.columnName === '*');
    if (rule) { return rule; } else { return undefined; }
  }

  private rangeMap(inMin: number, inMax: number, outMin: number, outMax: number, inValue: number): number {
    return (inValue - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  private maxTextLength(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (rule && rule.maxTextLength) {
      const maxTextLength = rule.maxTextLength < 0 ? 0 : rule.maxTextLength;
      for (let row = 0; row < this.filterRows.length; row++) {
        tempInfo[row][colIdx].text =
          tempInfo[row][colIdx].text.length > maxTextLength ?
            tempInfo[row][colIdx].text.substr(0, maxTextLength) + '...' :
            tempInfo[row][colIdx].text;
      }

    }
  }

  private rowChange(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {

    let curColor: string = '';

    if (rule && rule.rowChangeBehavior) {
      for (let row = 0; row < this.filterRows.length; row++) {
        if (row === 0 || this.filterRows[row - 1][colIdx] !== this.filterRows[row][colIdx]) {

          tempInfo[row][colIdx].isBreak = true;

          if (rule.rowChangeBehavior.whiteGray) {
            curColor = curColor === '' || curColor === '#EEEEEE' ? '#FBFBFB' : '#EEEEEE';
            tempInfo[row][colIdx].backgroundColor = curColor;
            tempInfo[row][colIdx].color = 'black';
          } else if (rule.rowChangeBehavior.randomColor) {
            const r = Math.round(this.rangeMap(0, 1, 100, 255, Math.random())).toString(16);
            const g = Math.round(this.rangeMap(0, 1, 100, 255, Math.random())).toString(16);
            const b = Math.round(this.rangeMap(0, 1, 100, 255, Math.random())).toString(16);

            curColor = `#${r}${g}${b}`;
            tempInfo[row][colIdx].backgroundColor = curColor;
            tempInfo[row][colIdx].color = 'black';
          }
          if (rule.rowChangeBehavior.hideDuplicates) {
            tempInfo[row][colIdx].text = this.filterRows[row][colIdx];
          }
        } else {
          tempInfo[row][colIdx].text = rule.rowChangeBehavior.hideDuplicates ? '' : this.filterRows[row][colIdx];

          if (curColor.length > 0) {
            tempInfo[row][colIdx].backgroundColor = curColor;
            tempInfo[row][colIdx].color = 'black';
          }
        }
      }
    }
  }

  private dropdown(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (this.Config.showColumnDropdowns) {
      if (rule && rule.showDropdown) {
        this.dropdowns.push(Array.from(new Set(this.filterRows.map(row => row[colIdx]))));
      } else {
        this.dropdowns.push([]);
      }
    }
  }

  private paretoMap(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (rule && rule.showPareto) {
      this.paretoColumns.push(columnName);
      let min: number = undefined;
      let max: number = undefined;

      min = this.filterRows.reduce<number>((p, c) => {
        return p > Number(c[colIdx]) ? Number(c[colIdx]) : p;
      }, Number.MAX_VALUE);

      max = this.filterRows.reduce<number>((p, c) => {
        return p < Number(c[colIdx]) ? Number(c[colIdx]) : p;
      }, Number.MIN_VALUE);

      for (let row = 0; row < this.filterRows.length; row++) {
        tempInfo[row][colIdx].scaledValue = this.scaleParetoValueToPercentage(Number(tempInfo[row][colIdx].text), min, max);
      }
    }
  }

  private redMap(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (rule && rule.redmapRules !== undefined && rule.redmapRules.low && rule.redmapRules.high) {

      let min: number = undefined;
      let max: number = undefined;

      if (rule.redmapRules.low === 'min' || rule.redmapRules.high === 'min') {
        min = this.filterRows.reduce<number>((p, c) => {
          return p > Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MAX_VALUE);
      } else {
        min = Number(rule.redmapRules.low);
      }
      if (rule.redmapRules.low === 'max' || rule.redmapRules.high === 'max') {
        max = this.filterRows.reduce<number>((p, c) => {
          return p < Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MIN_VALUE);
      } else {
        max = Number(rule.redmapRules.high);
      }
      const reverse = max < min || rule.redmapRules.low === 'max' || rule.redmapRules.high === 'min';
      const range = Math.abs(max - min);

      min = max < min ? max : min;
      max = min + range;
      for (let row = 0; row < this.filterRows.length; row++) {
        let rank =
          (Number(this.filterRows[row][colIdx]) - min) /
          Math.abs(max - min);

        rank = isNaN(rank) ? 0 : rank;
        rank = rank < 0 ? 0 : rank > 1 ? 1 : rank;
        let category = Math.round(rank * 7);  // betwen 0 and 16
        if (!reverse) {
          category = 7 - category;
        }
        category += 7;
        const hex = category.toString(16);
        tempInfo[row][colIdx].backgroundColor = `#FF${hex}0${hex}0`;
        tempInfo[row][colIdx].color = 'black';

      }
    }
  }

  private greenMap(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (rule && rule.greenmapRules !== undefined && rule.greenmapRules.low && rule.greenmapRules.high) {

      let min: number = undefined;
      let max: number = undefined;

      if (rule.greenmapRules.low === 'min' || rule.greenmapRules.high === 'min') {
        min = this.filterRows.reduce<number>((p, c) => {
          return p > Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MAX_VALUE);
      } else {
        min = Number(rule.greenmapRules.low);
      }
      if (rule.greenmapRules.low === 'max' || rule.greenmapRules.high === 'max') {
        max = this.filterRows.reduce<number>((p, c) => {
          return p < Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MIN_VALUE);
      } else {
        max = Number(rule.greenmapRules.high);
      }
      const reverse = max < min || rule.greenmapRules.low === 'max' || rule.greenmapRules.high === 'min';
      const range = Math.abs(max - min);

      min = max < min ? max : min;
      max = min + range;
      for (let row = 0; row < this.filterRows.length; row++) {
        let rank =
          (Number(this.filterRows[row][colIdx]) - min) /
          Math.abs(max - min);

        rank = isNaN(rank) ? 0 : rank;
        rank = rank < 0 ? 0 : rank > 1 ? 1 : rank;
        let category = Math.round(rank * 7);  // betwen 0 and 16
        if (!reverse) {
          category = 7 - category;
        }
        category += 7;
        const hex = category.toString(16);
        tempInfo[row][colIdx].backgroundColor = `#${hex}0FF${hex}0`;
        tempInfo[row][colIdx].color = 'black';
      }
    }
  }

  private heatmap(columnName: string, colIdx: number, tempInfo: CellInfo[][], rule: TableColumnRules) {
    if (rule && rule.heatmapRules !== undefined && rule.heatmapRules.low && rule.heatmapRules.high) {

      let min: number = undefined;
      let max: number = undefined;

      if (rule.heatmapRules.low === 'min' || rule.heatmapRules.high === 'min') {
        min = this.filterRows.reduce<number>((p, c) => {
          return p > Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MAX_VALUE);
      } else {
        min = Number(rule.heatmapRules.low);
      }
      if (rule.heatmapRules.low === 'max' || rule.heatmapRules.high === 'max') {
        max = this.filterRows.reduce<number>((p, c) => {
          return p < Number(c[colIdx]) ? Number(c[colIdx]) : p;
        }, Number.MIN_VALUE);
      } else {
        max = Number(rule.heatmapRules.high);
      }
      const reverse = max < min || rule.heatmapRules.low === 'max' || rule.heatmapRules.high === 'min';
      const range = Math.abs(max - min);

      min = max < min ? max : min;
      max = min + range;
      for (let row = 0; row < this.filterRows.length; row++) {
        let rank =
          (Number(this.filterRows[row][colIdx]) - min) /
          Math.abs(max - min);

        rank = rank < 0 ? 0 : rank > 1 ? 1 : rank;
        let category = Math.round(rank * 15);  // betwen 0 and 16
        if (reverse) {
          category = 15 - category;
        }

        if (category > 3 && category < 12) {
          tempInfo[row][colIdx].backgroundColor = `#FFFFFF`;
          tempInfo[row][colIdx].color = 'black';
        } else if (category <= 3) {
          category += 12;
          const hex = category.toString(16);

          tempInfo[row][colIdx].backgroundColor = `#${hex}0FF${hex}0`;
          tempInfo[row][colIdx].color = 'black';
        } else { // > 12
          category = 27 - category;
          const hex = category.toString(16);
          tempInfo[row][colIdx].backgroundColor = `#FF${hex}0${hex}0`;
          tempInfo[row][colIdx].color = 'black';
        }
      }
    }
  }

  BuildDisplay() {
    this.dataSetCells = [];
    this.dropdowns = [];

    const tempCells: CellInfo[][] = this.filterRows.map(row => {
      // for now extended features only work if we started with a TableData input, where one of the properties = rowColorProp
      // we stuck our real row object on the end of the rows array

      let row_color = { backgroundColor: '', color: '' };
      if (this.TableData && this.TableData.length) {
        const row_obj: {} = row[row.length - 1];
        if (row_obj.hasOwnProperty(this.Config.rowColorProp)) {
          row_color = row_obj[this.Config.rowColorProp]
        }
      }
      return row.map(cell => {
        const nci = new CellInfo();
        nci.text = cell;
        nci.backgroundColor = row_color.backgroundColor;
        nci.color = row_color.color;
        return nci;
      });
    });
    let buildDropDowns = (this.Config.columnConfig.filter(c => {
      return ['dropdown', 'multiselect'].indexOf(c.columnHeaderFilterType) > -1;
    }).length > 0 && this.TableData);
    if (this.Config.tableColumnRules.length > 0 && this.columns && this.columns.length > 0) {

      this.columns.forEach((columnName, colIdx) => {
        // Drop downs
        const rule = this.getColumnRule(columnName);
        if (rule && rule.alternateColorOnValueChange) {
          if (!rule.rowChangeBehavior) {
            rule.rowChangeBehavior = { whiteGray: true }
          }
        }

        if (rule) {
          this.dropdown(columnName, colIdx, tempCells, rule);
          this.heatmap(columnName, colIdx, tempCells, rule);
          this.greenMap(columnName, colIdx, tempCells, rule);
          this.redMap(columnName, colIdx, tempCells, rule);
          this.paretoMap(columnName, colIdx, tempCells, rule);
        }
        this.rowChange(columnName, colIdx, tempCells, rule);
        this.maxTextLength(columnName, colIdx, tempCells, rule);
      });
      // this.aggregateStats = this.aggregateStats.sort((a, b) => { return b.index - a.index; });
      this.dropdowns = this.dropdowns.map(colList => { return colList.sort((a, b) => a.localeCompare(b)) });
    } else if (buildDropDowns) {
      // build our own dropdowns from the TableData object
      let filterCols = this.Config.columnConfig.filter(c => {
        return ['dropdown', 'multiselect'].indexOf(c.columnHeaderFilterType) > -1;
      });
      filterCols.forEach(colCfg => {
        let uniqueVals = this.TableData.reduce((prev: string[], cur) => {
          if (prev.indexOf(cur[colCfg.columnProp]) === -1) prev.push(cur[colCfg.columnProp]);
          return prev;
        }, []) as string[];
        colCfg.dropdownsVals = uniqueVals.sort();
        colCfg.selectedValues = uniqueVals.sort();
        colCfg.multiSelectVals = uniqueVals.sort().map(v => {
          return <IMultiSelectOption>{
            id: v,
            name: v
          };
        })
      });
    }
    this.dataSetCells = [...tempCells];
    this.setPageOfRows();
  }

  scaleParetoValueToPercentage(initialValue: number, minVal: number, maxVal: number) {
    const lowerBound = 0;
    const upperBound = 100;
    return (((initialValue - minVal) * (upperBound - lowerBound)) / (maxVal - minVal)) + lowerBound;
  }

  LocalRemoveFilter(name: string) {
    const tempFilters: Params = [];

    Object.keys(this.localFilters)
      .filter(k => k !== name)
      .forEach(k => {
        tempFilters[k] = this.localFilters[k];
      });

    this.localFilters = tempFilters;
    this.ApplyFilterParams();
  }

  LocalAddFilter(name: string, value: string) {
    this.localFilters[name] = value;
    this.ApplyFilterParams();
  }

  CellIsIcon(colIdx: number): boolean {
    if (this.Config.columnConfig) {
      if (this.Config.columnConfig[colIdx]) {
        return this.Config.columnConfig[colIdx].columnShowIcon;
      } else {
        return false;
      }
    }
    return false;
  }
  isValueClickLink(colIdx: number): boolean {
    if (this.Config.tableColumnRules) {
      const rule = this.getColumnRule(this.columns[colIdx]);
      if (rule && rule.valueLink) {
        return true;
      }
    }
    return false;
  }

  onRowClick(rowData: any, index: number) {
    this.selectedRow = index;
    if (this.Config.selectMode) {
      this.tableSelection.nativeElement.focus();
    }
    if (this.TableData && this.TableData.length) {
      let obj: any = rowData[rowData.length - 1] || null;
      this.RowClick.emit(obj);
    } else {
      this.RowClick.emit(rowData);
    }
    this.onRowSelect(rowData);
  }
  onRowSelect(rowData: any) {
    if (this.TableData && this.TableData.length) {
      let obj: any = rowData[rowData.length - 1] || null;
      this.RowSelect.emit(obj);
    } else {
      this.RowSelect.emit(rowData);
    }
  }
  changeSelection(drow, dcol) {
    let dontSelect: boolean;
    this.selectedRow += drow;
    this.selectedCol += dcol;
    if (this.selectedRow > this.Config.pageSize - 1 && this.currentPage < this.maxPage) {
      this.PageCrement(1)
      this.selectedRow = 0;
    }
    if (this.selectedRow < 0 && this.currentPage !== 1) {
      this.PageCrement(-1);
      this.selectedRow = this.Config.pageSize - 1;
    }
    if (this.selectedRow < 0) {
      this.selectedRow = 0;
      dontSelect = true;
    }
    if (this.selectedRow > this.Config.pageSize || this.selectedRow > this.currentPageOfRows.length) {
      this.selectedRow = (this.Config.pageSize > this.currentPageOfRows.length) ? this.currentPageOfRows.length : this.Config.pageSize;
      dontSelect = true;
    }
    if (this.currentPageOfRows[this.selectedRow] && !dontSelect) {
      this.onRowSelect(this.currentPageOfRows[this.selectedRow]);
    }
  }
  onValueClick(colIdx, rowIdx) {
    if (this.isValueClickLink(colIdx)) {
      const actualRowIdx = this.currentRecordStart + rowIdx;
      this.ValueClick.emit({ colIdx: colIdx, column: this.columns[colIdx], rowIdx: actualRowIdx, row: this.rows[actualRowIdx], value: this.rows[actualRowIdx][colIdx] });
    }
  }

  ApplyFilterParams() {
    if (this.localFilters) {
      const dataSet = DataSetFilter.FilterDataSet(this.Dataset, [], [], this.localFilters);
      this.columns = dataSet.columns;
      this.rows = dataSet.data;
      this.filterlkp = [];
      Object.keys(this.localFilters).forEach(k => {
        const userExp = (this.localFilters[k].startsWith('nccontains|')) ?
          { name: k, value: this.localFilters[k].replace('nccontains|', '') } :
          FilterSpec.FormattedExpressionToUser({ name: k, value: this.localFilters[k] });
        if (this.columns.indexOf(userExp.name) > -1) {
          this.filterlkp[userExp.name] = userExp.value;
        }
      });
    } else {
      this.columns = this.Dataset.columns;
      this.rows = this.Dataset.data;
    }

    this.ApplyGlobalFilter();
  }

  ApplyGlobalFilter() {
    if (this.rows) {
      if (this.filter) {

        const filters = this.filter.toLowerCase().split('|');
        this.filterRows = this.rows.filter(row => {
          let matchingCells = 0;
          filters.forEach(filter => {
            const cellMatchIdx = row.findIndex((cell) => {
              if (typeof cell === 'string') {
                return cell.toLowerCase().indexOf(filter) > -1
              } else {
                return false;
              }
            });
            if (cellMatchIdx > -1) {
              matchingCells++;
            }
          });

          return matchingCells === filters.length;
        });
      } else {
        this.filterRows = this.rows;
      }
    }
    this.CalculateMaxPage();
    this.BuildDisplay();
  }

  CalculateMaxPage() {
    this.maxPage = this.filterRows ? Math.ceil(this.filterRows.length / this.Config.pageSize) : 0;
  }

  ClientButtonInfoClick(tableButtonInfo: TableButtonInfo, rowidx) {
    if (this.ButtonInfoClick) {
      const p: Params = [];
      p['buttonInfo'] = tableButtonInfo;
      p['row'] = this.filterRows[this.currentRecordStart + rowidx];
      p['column'] = this.columns;
      this.ButtonInfoClick.emit(p);
    }
  }

  ClientHover(rowidx) {
    if (this.Hover) {
      const p: Params = [];
      p['row'] = this.filterRows[this.currentRecordStart + rowidx];
      p['column'] = this.columns;
      this.Hover.emit(p);
    }
  }

  ClientButtonClick(button, rowidx) {
    if (this.ButtonClick) {
      const p: Params = [];
      p['buttonName'] = button;
      p['row'] = this.filterRows[this.currentRecordStart + rowidx];
      p['column'] = this.columns;
      this.ButtonClick.emit(p);
    }
  }

  GetBgColorStyle(row: number, col: number): string {

    row += this.currentRecordStart;
    if (this.dataSetCells.length !== 0 && this.dataSetCells[row][col] && this.dataSetCells[row][col].backgroundColor.length > 0) {
      // console.log('.');
      return this.dataSetCells[row][col].backgroundColor
    } else {
      // console.log('!');
      return '';
    }
  }

  GetCellText(row: number, col: number): string {
    row += this.currentRecordStart;
    if (this.dataSetCells.length !== 0 && this.dataSetCells[row][col]) {
      // console.log('.');
      return this.dataSetCells[row][col].text
    } else {
      // console.log('!');
      return '';
    }
  }

  TruncateDecimalValue(row: number, col: number, precision: number): string {
    row += this.currentRecordStart;
    if (this.dataSetCells.length !== 0 && this.dataSetCells[row][col]) {
      // console.log('.');
      const cellValue = this.dataSetCells[row][col].text;
      return cellValue.substr(0, (cellValue.indexOf('.') + 1) + precision);
    } else {
      // console.log('!');
      return '';
    }
  }

  GetCellScaledValue(row: number, col: number): number {
    row += this.currentRecordStart;
    if (this.dataSetCells.length !== 0 && this.dataSetCells[row][col]) {
      return this.dataSetCells[row][col].scaledValue
    } else {
      return 0;
    }
  }

  GetFgColorStyle(row: number, col: number): string {

    row += this.currentRecordStart;
    if (this.dataSetCells.length !== 0 && this.dataSetCells[row][col] && this.dataSetCells[row][col].color.length > 0) {
      // console.log('.');
      return this.dataSetCells[row][col].color
    } else {
      // console.log('!');
      return '';
    }
  }

  onGlobalFilterChange(newValue: string) {
    this.filter = newValue;
    this.ApplyGlobalFilter();
  }

  onFilterChange(column, filterExpression) {
    this.searchUpdated.next({ name: column, value: filterExpression });
  }

  onDropdownChanged(column, filterExpression) {
    const filterValue = filterExpression === '(all)' ? '' : `=${filterExpression}`;
    this.filterUpdate({ name: column, value: filterValue }, true);
  }

  onMultiselectChanged(column) {
    const filterValue = (column.multiSelectVals.length === column.selectedValues.length) ? '' : `in[${column.selectedValues.join(',')}`
    this.filterUpdate({ name: column.columnProp, value: filterValue }, true);
  }

  PageCrement(amount: number) {
    if (this.columns) {
      this.currentPage += amount;
      if (this.currentPage < 1) {
        this.currentPage = 1;
      } else if (this.currentPage > this.maxPage) {
        this.currentPage = this.maxPage;
      }
      this.setPageOfRows();
      this.PageChange.emit(this.currentPage);
    }
  }

  onPageSizeChange(newValue: string) {
    this.CalculateMaxPage();
    if (this.currentPage > this.maxPage) {
      this.currentPage = this.maxPage;
    }
    this.setPageOfRows();
    this.PageChange.emit(this.currentPage);
  }

  OnPageNumberChange(newValue: string) {

    let num = Number(newValue);
    if (num > this.maxPage) {
      num = this.maxPage;
    }
    if (num < 1) {
      num = 1;
    }

    this.currentPage = num;
    this.setPageOfRows();
    this.PageChange.emit(this.currentPage);
  }

  setPageOfRows(): void {
    const lastIndex = this.filterRows.length - 1;
    this.currentRecordStart = (this.currentPage == 0)? 0 : (this.currentPage - 1) * this.Config.pageSize;
    this.currentRecordEnd = this.currentRecordStart + this.Config.pageSize - 1;

    if (lastIndex < this.Config.pageSize) {
      this.currentRecordStart = 0;
    } else if (this.currentRecordStart > lastIndex) {
      this.currentRecordStart = lastIndex - this.Config.pageSize;
    }

    this.CalculateMaxPage();
    if (this.currentPage < 1) {
      this.currentPage = 1;
    } else if (this.currentPage > this.maxPage) {
      this.currentPage = this.maxPage;
    }

    if (this.currentRecordEnd > lastIndex) {
      this.currentRecordEnd = lastIndex;
    }
    let rows = this.filterRows.slice(this.currentRecordStart, this.currentRecordEnd + 1);
    let dataArrs = [];
    if (this.Config.columnConfig.length) {
      rows.forEach(r => {
        let dataArr = [];
        this.Config.columnConfig.forEach((key: any) => {
          dataArr.push(r[key.columnProp]);
        });
        if (this.TableData && this.TableData.length) {
          dataArr.push(r[r.length - 1]);
        } else {
          dataArr.push('');
        }
        dataArrs.push(dataArr);
      });
    } else {
      rows.forEach(r => {
        let keyArr: any[] = Object.keys(rows),
          dataArr = [];
        keyArr.forEach((key: any) => {
          dataArr.push(r[key]);
        });
        dataArrs.push(dataArr);
      });
    }
    this.currentPageOfRows = dataArrs;
  }

  GetColumnStyle(column):{} {
    // changed this to an object we can conditionally populate and return. dpieksma
    let ch_styles:{[x: string]: any} = {};
    ch_styles['cursor'] = 'pointer';
    if (column && column.columnFixedWidth) {
      ch_styles['width'] = column.columnFixedWidth;
    } 
    if (column && column.columnLabelBgColor) {
      ch_styles['background-color'] = column.columnLabelBgColor;
    } 
    if (column && column.columnLabelColor) {
      ch_styles['color'] = column.columnLabelColor;
    } 
    return ch_styles;
  }

  GetHeaderStyle(header):{} { 
    // changed this to an object we can conditionally populate and return. dpieksma
    let header_styles:{[x: string]: any} = {};
    if (header && header.headercolumnFixedWidth) {
      header_styles['width'] = header.headercolumnFixedWidth;
    } 
    if (header && header.headercolumnLabelBgColor) {
      header_styles['background-color'] = header.headercolumnLabelBgColor;
    } 
    if (header &&  header.headercolumnLabelColor) {
      header_styles['color'] = header.headercolumnLabelColor;
    } 
    if (header && header.headercolumnLabelAlign) {
      header_styles['text-align'] = header.headercolumnLabelAlign;
    } 
    return header_styles;
  }

  TransformToDataSet(): DataSet {
    let tmpDataSet: DataSet = { columns: [], data: [] };
    if (this.Config.columnConfig.length) {
      tmpDataSet.columns = this.Config.columnConfig.map(c => c.columnProp);
      this.TableData.forEach(r => {
        let rowData = []
        this.Config.columnConfig.forEach(c => {
          // Dataset filters don't like nulls so set empty strings.
          if (r[c.columnProp] === null || r[c.columnProp] === undefined) {
            rowData.push("");
          } else {
            rowData.push(r[c.columnProp].toString());
          }
        });
        // push the actual object into the rowData as the last element of the array
        // This is a special trick to extend the functionality of a Dataset to support more custom properties and features.
        rowData.push(r);
        tmpDataSet.data.push(rowData);
      });
    }
    return tmpDataSet;
  }
}
