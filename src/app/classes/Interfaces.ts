import { IMultiSelectOption } from '../multiselect';
import { TemplateRef } from '@angular/core';

export interface DataTableValueInfo {
    colIdx: number;
    rowIdx: number;
    column: string;
    row?: string[];
    value: string;
    event?: Event;
}

export interface TableButtonInfo {
    name: string;
    class: string;
    iconClass: string;
    text: string;
    toolTip?: string;
}

export interface GenericTableConfiguration {
    hideHeaderRow?: boolean;
    sortAndfilterLocally?: boolean;
    buttonNames?: string[];
    buttonConfig?: ActionButtonConfig;
    buttonInfoList?: TableButtonInfo[];
    showFilterSortRow?: boolean;
    showGlobalFilter?: boolean;
    showPaginate?: boolean;
    showColumnDropdowns?: boolean;
    selectMode?: string; // default none.  options: 'row'.  (will soon support 'row','column','cell')
    pageSize?: number;
    tableColumnRules?: TableColumnRules[];
    showExportToCsv?: boolean;
    csvExportOptions?: CsvExportOptions;
    columnConfig?: ColumnConfig[]; // Extendable class for providing additional configuration options for each column
    columnHeaderConfigs?: ColumnHeaderConfigs[][]; // Extendable class for providing additional table header information. Builds multi row headers above normal columnConfig header.
    rowColorProp?: string; // the property / column name that contains an object for background and forground color of the entire table row
    currentPage?: number;
    showPageSizeSelector?: boolean; // whether the drop-down for page size is visible or not (default=true)
    showPageRecordsCount?: boolean; // whether the "Records 1 -10 of 27" text is shown (default=true)
    showFirstLastPageSelector?: boolean;  // wether the buttons for selecting the first & last page are shown (default=true)
    showPageInput?: boolean; // default true (whether the current page # is an input)
    showFilterToggleButton?: boolean; // whether the column filter button next to the global filter is visible (default=true)
    showGlobalFilterLabel?: boolean;  // whether the label for the global filter input is visible or not
    tableTitle?: string; // optional title to show up at the top next to the global filter.
    tdClass?: string;
    trClass?: string;
    thClass?: string;
    outerTrClass?: string;
    TableClasses?: string[];
}

export type ActionButtonsPosition = 'start' | 'end';
export class ActionButtonConfig {
    buttonColumnName?: string;
    buttonPosition?: ActionButtonsPosition

}
export interface CsvExportOptions {
    separator?: string;
    fileName?: string;
}


export interface TableColumnRules {
    columnName: string; // Can be name or * for all columns
    hideColumn?: boolean;
    alternateColorOnValueChange?: boolean; // if true, as value changes going down column, bg color changes
    heatmapRules?: HeatmapRules;
    redmapRules?: HeatmapRules;
    greenmapRules?: HeatmapRules;
    showDropdown?: boolean;
    valueLink?: boolean;
    rowChangeBehavior?: RowChangeBehavior;
    maxTextLength?: number;
    showPareto?: boolean;
    paretoRules?: ParetoRules;
    isDate?: boolean;
    textAlign?: string; //left, center, right
}

export interface ParetoRules {
    min: number;
    max: number;
}

export interface HeatmapRules {
    low: string; // Can be 'min' or a number value as string. if min, uses min value of column
    high: string; // Can be 'max' or a number value as string. if max, uses max value of column
    columnsToInclude?: string[];
}

export interface ColumnConfig {
    columnLabel: string; // the label (text) to show in the column header (prettier than the columnProp)
    columnLabelBgColor?: string; // specify column label header back ground color.
    columnLabelColor?: string; // specify column label font color.
    columnProp: string; // the column property to use for the data, or if coming from a dataset it is the column name (columnLabel=columnProp for DataSet inputs)
    sortClass?: string; // for sorting this is the intial sort direction if provided, or the current sort direction when toggled
    columnShowIcon?: boolean; // to show an icon instead of text (if the value is a font-aweomse icon class name)
    columnFixedWidth?: string; // specify in px to force a column to a set width
    columnSortByProp?: string; // allows you to specify a different property than the value shown for sorting a column (useful for durations and datetimes)
    columnHeaderFilterType?: string; // one of input, dropdown, or none - allows you to selectively change the type of column filter header element used.  If null defaults to input
    dropdownsVals?: string[]; // internal array generated on load of the availalbe values for drop-down options in the column header (if columnHeaderFilterType is dropdown)
    multiSelectVals?: IMultiSelectOption[];
    selectedValues?: string[];
}

export interface ColumnHeaderConfigs {
    headercolumnLabel: string; // the label (text) to show in the column header
    headercolumnFixedWidth?: string; // specify in px to force a column to a set width. Use this or the below colspan, but not both.
    headercolumnColSpan?: string; // specify column span.
    headercolumnLabelAlign?: string;
    headercolumnLabelBgColor?: string; // specify column header background-color.
    headercolumnLabelColor?: string; // specify column label font color.
}

export interface RowChangeBehavior {
    hideDuplicates?: boolean;
    addDividor?: boolean;
    whiteGray?: boolean;
    randomColor?: boolean;
    colorStringPallete?: string[]; //If exists, row change colors will cycle through this palette.
}


export interface NameValue {
    name: string;
    value: string;
}

export class CellInfo {
  backgroundColor: string;
  color: string;
  text: string;
  isBreak: boolean;
  scaledValue: number; // Used for the pareto columns
  tooltip: string;
  templateRef: TemplateRef<any>;
  props: any;
  constructor() {
    this.backgroundColor = '';
    this.color = '';
    this.isBreak = false;
    this.text = '';
    this.scaledValue = undefined; // Used for the pareto columns
    this.tooltip = '';
    this.templateRef = undefined;
    this.props = undefined;
  }
}

export interface DataArrayOfObjects extends Array<object>{};

export interface DataSet {
    columns: string[];
    data: string [][];
}

export interface FilterRule {
    column: string;
    value?: string;
    contextValueName?: string;
    serverSide: boolean;
    // string operators: eq (default), startsWith, endsWith, contains,
    // case insensitive string operators ncEq, ncStartsWith, ncEndsWith, ncContains
    // number operators: ==, gt, lt, ge, le, ne
    operator?: string;
}