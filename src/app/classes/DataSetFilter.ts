import { Params } from '@angular/router';

import { FilterRule, NameValue, DataSet } from '../classes/Interfaces';

export class DataSetFilter {

    public static FilterOperationMap(): NameValue[] {
        return [
            { name: '=', value: '==' },
            { name: '!=', value: '!==' },
            { name: '>', value: 'gt' },
            { name: '>=', value: 'ge' },
            { name: '<', value: 'lt' },
            { name: '<=', value: 'le' },
            { name: 'included in', value: 'in' },
            { name: 'text (case sensitive) =', value: 'eq' },
            { name: 'text (case insensitive) =', value: 'nceq' },
            { name: 'text (case sensitive) !=', value: 'ne' },
            { name: 'text (case sensitive) starts with', value: 'startswith' },
            { name: 'text (case insensitive) starts with', value: 'ncstartswith' },
            { name: 'text (case sensitive) ends with', value: 'endswith' },
            { name: 'text (case insensitive) ends with', value: 'ncendswith' },
            { name: 'text (case sensitive) contains', value: 'contains' },
            { name: 'text (case insensitive) contains', value: 'nccontains' }];
    }

    public static NormalizePercent(dataSet: DataSet, columns: string[], fakeUpperPercentAdd = 0) {

        columns.forEach(npColumn => {
            const colIdx = dataSet.columns.indexOf(npColumn);
            const min = dataSet.data.reduce<number>((p, c) => {
                return p > Number(c[colIdx]) ? Number(c[colIdx]) : p;
            }, Number.MAX_VALUE);

            const max = dataSet.data.reduce<number>((p, c) => {
                return p < Number(c[colIdx]) ? Number(c[colIdx]) : p;
            }, Number.MIN_VALUE);

            let range = max - min;

            if (fakeUpperPercentAdd !== 0) {

                let multiplier = Math.random() * (fakeUpperPercentAdd / 100);
                multiplier += 1;
                const newMax = multiplier * range;
                range = newMax - min;
            }

            dataSet.data.forEach(row => {
                let newValue = Number(row[colIdx]) / range;
                newValue = Math.round(newValue * 100);
                row[colIdx] = newValue.toString();
            });
        });
    }

    public static PivotDataSet(
        dataSet: DataSet,
        groupColumns: string[],
        pivotColumn: string,
        targetColumn: string,
        statistic: string,
        pivotColumnOrder: string[] = []): DataSet {

        const aggregate: Params = [];
        const pivotIdx = dataSet.columns.indexOf(pivotColumn);
        const targetIdx = dataSet.columns.indexOf(targetColumn);
        dataSet.data.forEach(r => {
            const key = groupColumns.map(gc => { const idx = dataSet.columns.indexOf(gc); return r[idx]; }).join('|');
            if (aggregate[key] === undefined) {
                aggregate[key] = {};
                aggregate[key].sourceArray = [r];
            } else {
                aggregate[key].sourceArray.push(r);
            }
        });

        const pivotColumns: Params = [];

        Object.keys(aggregate).forEach(groupKey => {

            aggregate[groupKey].pivotAgg = [];
            aggregate[groupKey].sourceArray.forEach(row => {
                const pivotKey = row[pivotIdx];
                const pivotValue = row[pivotIdx];
                const targetValue = row[targetIdx];
                if (pivotColumns[pivotValue] === undefined) {
                    pivotColumns[pivotValue] = 1;
                }
                if (aggregate[groupKey].pivotAgg[pivotKey] === undefined) {
                    aggregate[groupKey].pivotAgg[pivotKey] = [targetValue];
                } else {
                    aggregate[groupKey].pivotAgg[pivotKey].push(targetValue);
                }
            });
        });

        const returnDS: DataSet = { columns: [], data: [] };

        let allPivotColumns = Object.keys(pivotColumns);
        if (pivotColumnOrder && pivotColumnOrder.length > 0) {
            allPivotColumns = allPivotColumns.sort((a, b) => {
                let aIdx = pivotColumnOrder.indexOf(a);
                let bIdx = pivotColumnOrder.indexOf(b);
                if (aIdx === -1) { aIdx = Number.MAX_VALUE; }
                if (bIdx === -1) { bIdx = Number.MAX_VALUE; }
                return aIdx - bIdx;
            });
        }

        returnDS.columns = groupColumns.concat(allPivotColumns);

        Object.keys(aggregate).forEach(groupKey => {
            const newRow: string[] = groupKey.split('|');
            allPivotColumns.forEach(pc => {
                if (aggregate[groupKey].pivotAgg[pc] === undefined) {
                    newRow.push('0');
                } else {
                    // TODO: ability to do stats on aggregate[groupKey].pivotAgg[pc] using statistic method param
                    const array = aggregate[groupKey].pivotAgg[pc];
                    if (statistic.toLowerCase() === 'sum') {
                        const values: string[] = aggregate[groupKey].pivotAgg[pc];
                        const sum = values.map(s => Number(s)).filter(n => !isNaN(n)).reduce((p, c, i) => { return p + c; })
                        newRow.push(sum.toString());
                    } else {
                        const length: number = aggregate[groupKey].pivotAgg[pc].length;
                        newRow.push(length.toString());
                    }
                }
            });

            returnDS.data.push(newRow);
        });

        return returnDS;

    }

    public static SortDataSet(dataSet: DataSet, sorts: Params, sortColumns: NameValue[], columnType?: string) {

        let localTable = [...dataSet.data];
        const localSorts: Params = [];

        if (Object.keys(sorts).length > 0) {
            Object.keys(sorts).forEach(k => { localSorts[k] = sorts[k]; });
        } else if (sortColumns) {
            sortColumns.forEach(x => { localSorts[x.name] = x.value; });
        }

        if (Object.keys(localSorts).length > 0) {
            const sortKeys = Object.keys(localSorts);

            localTable = localTable.sort((rowA, rowB) => {

                const pairs: NameValue[] = [];

                for (let keyI = 0; keyI < sortKeys.length; keyI++) {
                    const colIdx = dataSet.columns.indexOf(sortKeys[keyI]);
                    if (colIdx > -1) {
                        if (localSorts[sortKeys[keyI]] === 'asc') {
                            pairs.push({ name: rowA[colIdx], value: rowB[colIdx] });
                        } else {
                            pairs.push({ name: rowB[colIdx], value: rowA[colIdx] });
                        }
                    }

                    for (let i = 0; i < pairs.length; i++) {
                        const a = Number(pairs[i].name);
                        const b = Number(pairs[i].value);
                        if (columnType === 'Date') {
                            return new Date(pairs[i].name).getTime() - new Date(pairs[i].value).getTime();
                        } else if (!isNaN(a) && !isNaN(b)) {
                            const difference = a - b;
                            if (difference !== 0) { return difference; }
                        } else {
                            if (pairs[i].name.toLowerCase() < pairs[i].value.toLowerCase()) { return -1; }
                            if (pairs[i].name.toLowerCase() > pairs[i].value.toLowerCase()) { return 1; }
                        }
                    }
                }
                return 0;

            });

            dataSet.data = [];
            dataSet.data = [...localTable];
        }
    }

    public static ToNumeric(list: string[]): number[] {
        const nlist = list.map(v => Number(v)).filter(v => !isNaN(v));
        return nlist;
    }

    public static FilterDataSet(dataSet: DataSet, filterRules: FilterRule[], context: Params, filters: Params): DataSet {

        if ((filterRules === undefined || filterRules.length === 0) &&
            (filters === undefined || Object.keys(filters).length === 0)) {
            return dataSet;
        }

        const specs = this.GetFilterSpecs(dataSet, filterRules, context, filters);

        if (specs.length === 0) {
            return dataSet;
        }

        const newData: string[][] = [];
        const returnDataSet: DataSet = { columns: dataSet.columns, data: newData };

        this.GetFilteredIndexes(dataSet, specs).forEach(idx => {
            returnDataSet.data.push(dataSet.data[idx]);
        });

        return returnDataSet;
    }

    public static GetFilterSpecs(dataSet: DataSet, filterRules: FilterRule[], context: Params, filters: Params): FilterSpec[] {

        const specs: FilterSpec[] = [];

        if (filterRules !== undefined) {
            filterRules
                .filter(rule => rule.serverSide === false)
                .forEach(rule => {
                    specs.push(new FilterSpec(rule, undefined, undefined, context, dataSet.columns));
                });
        }

        if (filters !== undefined) {
            for (const key of Object.keys(filters)) {
                if (filters[key] instanceof Array) {
                    filters[key].forEach(whereClause => {
                        specs.push(new FilterSpec(undefined, key, whereClause, context, dataSet.columns));
                    });
                } else {
                    specs.push(new FilterSpec(undefined, key, filters[key], context, dataSet.columns));
                }

            }
        }

        return specs.filter(s => s.alwaysPass === false);
    }

    public static GetFilteredIndexes(dataSet: DataSet, specs: FilterSpec[]): number[] {
        const indexes: number[] = [];
        dataSet.data.forEach((record, idx) => {
            if (this.RecordPasses(record, specs)) {
                indexes.push(idx);
            }
        });

        return indexes;
    }

    public static RecordPasses(record: string[], specs: FilterSpec[]): boolean {

        for (let i = 0; i < specs.length; i++) {
            if (!specs[i].Passes(record[specs[i].columnIndex])) {
                return false;
            }
        }
        return true;
    }
}

interface GroupInfoDictionary {
    [index: string]: GroupInfo;
}


class GroupInfo {
    key: string;
    rows: string[][];

    constructor(key: string) {
        this.key = key;
        this.rows = [];
    }
}

export class FilterSpec {

    column: string;
    columnIndex: number;
    whereClause: string;
    whereCompare: number;
    formattedWhereClause: string;
    valid = true;
    predicate: string;
    userExpression: string;
    alwaysPass = false;
    filterMethod: (value: string) => boolean;


    public static UserExpressionToFormattedCS(userExpression: string, caseSensitive: boolean){
        let caseSensitivePrefix = caseSensitive ? '' : 'nc';
        if (userExpression.startsWith('=')) {
            const formatted = 'eq|' + userExpression.substring(1);
            return formatted;
        } else if (userExpression.endsWith('*') && userExpression.startsWith('*')) {
            if (userExpression.length === 1) {
                return caseSensitivePrefix + 'startswith|';
            } else if (userExpression.length === 2) {
                return caseSensitivePrefix + 'contains|';
            } else {
                return caseSensitivePrefix + 'contains|' + userExpression.substring(1, userExpression.length - 1);
            }
        } else if (userExpression.endsWith('*')) {
            return caseSensitivePrefix + 'startswith|' + userExpression.substring(0, userExpression.length - 1);
        } else if (userExpression.startsWith('*')) {
            return caseSensitivePrefix + 'endswith|' + userExpression.substring(1);
        } else if (userExpression.startsWith('!')) {
            return 'ne|' + userExpression.substring(1);
        } else if (userExpression.startsWith('>=') || userExpression.startsWith('=>')) {
            return 'ge|' + userExpression.substring(2);
        } else if (userExpression.startsWith('<=') || userExpression.startsWith('=<')) {
            return 'le|' + userExpression.substring(2);
        } else if (userExpression.startsWith('>')) {
            return 'gt|' + userExpression.substring(1);
        } else if (userExpression.startsWith('<')) {
            return 'lt|' + userExpression.substring(1);
        } else if (userExpression.startsWith('in[')) {
            return 'in|' + userExpression.substring(3);
        } else {
            return caseSensitivePrefix + 'startswith|' + userExpression;
        }
    }

    public static UserExpressionToFormatted(userExpression: string): string {
        return FilterSpec.UserExpressionToFormattedCS(userExpression, false);
    }

    public static FormattedExpressionToUser(filterParam: NameValue): NameValue {
        const r = new FilterSpec(undefined, filterParam.name, filterParam.value, undefined, []);
        return { name: filterParam.name, value: r.userExpression };
    }

    public static FromFilters(filters: Params): FilterSpec[] {
        const specs: FilterSpec[] = [];

        for (const key of Object.keys(filters)) {
            if (filters[key] instanceof Array) {
                filters[key].forEach(whereClause => {
                    specs.push(new FilterSpec(undefined, key, whereClause, undefined, []));
                });
            } else {
                specs.push(new FilterSpec(undefined, key, filters[key], undefined, []));
            }
        }

        return specs;
    }

    private SetAlwaysPass() {
        this.filterMethod = v => { return true; };
        this.alwaysPass = true;
    }

    public constructor(rule: FilterRule, existingName: string, existingWhereClause: string, context: Params, columns: string[]) {

        if (existingName !== undefined && existingName.length > 0 && existingWhereClause !== undefined && existingWhereClause.length > 0) {
            this.column = existingName;
            this.columnIndex = columns.indexOf(existingName);
            this.whereClause = existingWhereClause;
            this.CreateFilterMethod();

            if (this.columnIndex === -1) {
                this.SetAlwaysPass();
            }
        } else if (rule === undefined || rule.serverSide === true) {
            this.column = existingName;
            this.whereClause = existingWhereClause;
            // Using to create formatted where clause
            this.CreateFilterMethod();
            // Nothing specified - will just return true
            this.SetAlwaysPass();
        } else if (columns.indexOf(rule.column) === -1) {
            this.SetAlwaysPass();
        } else {
            this.filterMethod = v => { return true; };
            let valueToUse: string = undefined;
            if (rule.contextValueName !== undefined && rule.contextValueName in context) {
                valueToUse = context[rule.contextValueName];
            } else if (rule.value !== undefined && rule.value.length > 0) {
                valueToUse = rule.value;
            }
            if (valueToUse !== undefined && valueToUse.length > 0) {
                this.column = rule.column;
                this.columnIndex = columns.indexOf(rule.column);
                this.whereClause = rule.operator === undefined ? valueToUse : `${rule.operator}|${valueToUse}`;
                this.CreateFilterMethod();
            }
        }
    }

    Passes(v: string): boolean {
        return this.valid && this.filterMethod(v);
    }

    CreateFilterMethod() {

        this.filterMethod = v => { return true; };
        const dotIndex = this.whereClause.indexOf('|');
        if (dotIndex > -1) {
            this.predicate = this.whereClause.substr(dotIndex + 1);
        }

        if (this.whereClause.toLowerCase().startsWith('eq|')) {
            this.formattedWhereClause = `${this.column} = ${this.predicate}`;
            this.userExpression = `=${this.predicate}`;
            this.filterMethod = v => {
                return v === this.predicate;
            };
        } else if (this.whereClause.toLowerCase().startsWith('ne|')) {
            this.formattedWhereClause = `${this.column} != ${this.predicate}`;
            this.userExpression = `!${this.predicate}`;
            this.filterMethod = v => {
                return v !== this.predicate;
            };
        } else if (this.whereClause.toLowerCase().startsWith('in|')){
            this.formattedWhereClause = `${this.column} in [${this.predicate}]`;
            this.userExpression = `in [${this.predicate}]`;
            this.filterMethod = v => {
                return this.predicate.split(',').indexOf(v) > -1;
            };
        } else if (this.whereClause.toLowerCase().startsWith('startswith|')) {
            this.formattedWhereClause = `${this.column} starts with ${this.predicate}`;
            this.userExpression = `${this.predicate}`;
            this.filterMethod = v => {
                return v.startsWith(this.predicate);
            };
        } else if (this.whereClause.toLowerCase().startsWith('endswith|')) {
            this.formattedWhereClause = `${this.column} ends with ${this.predicate}`;
            this.userExpression = `*${this.predicate}`;
            this.filterMethod = v => {
                return v.endsWith(this.predicate);
            };
        } else if (this.whereClause.toLowerCase().startsWith('contains|')) {
            this.formattedWhereClause = `${this.column} contains ${this.predicate}`;
            this.userExpression = `*${this.predicate}*`;
            this.filterMethod = v => {
                return v.indexOf(this.predicate) > -1;
            };
        } else if (this.whereClause.toLowerCase().startsWith('nceq|')) {
            this.formattedWhereClause = `${this.column} = ${this.predicate}`;
            this.userExpression = `${this.predicate}`;
            this.filterMethod = v => {
                return v.toLowerCase() === this.predicate.toLowerCase();
            };
        } else if (this.whereClause.toLowerCase().startsWith('ncstartswith|')) {
            this.formattedWhereClause = `${this.column} starts with ${this.predicate}`;
            this.userExpression = `${this.predicate}`;
            this.filterMethod = v => {
                return v.toLowerCase().startsWith(this.predicate.toLowerCase());
            };
        } else if (this.whereClause.toLowerCase().startsWith('ncendswith|')) {
            this.formattedWhereClause = `${this.column} ends with ${this.predicate}`;
            this.userExpression = `*${this.predicate}`;
            this.filterMethod = v => {
                return v.toLowerCase().endsWith(this.predicate.toLowerCase());
            };
        } else if (this.whereClause.toLowerCase().startsWith('nccontains|')) {
            this.formattedWhereClause = `${this.column} contains ${this.predicate}`;
            this.userExpression = `*${this.predicate}*`;
            this.filterMethod = v => {
                return v.toLowerCase().indexOf(this.predicate.toLowerCase()) > -1;
            };
        } else if (this.whereClause.toLowerCase().startsWith('==|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.userExpression = `${this.predicate}`;
                this.formattedWhereClause = `${this.column} = ${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return false; } else { return this.whereCompare === asNumber; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('gt|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.formattedWhereClause = `${this.column} > ${this.predicate}`;
                this.userExpression = `>${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return false; } else { return asNumber > this.whereCompare; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('lt|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.formattedWhereClause = `${this.column} < ${this.predicate}`;
                this.userExpression = `<${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return false; } else { return asNumber < this.whereCompare; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('le|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.formattedWhereClause = `${this.column} <= ${this.predicate}`;
                this.userExpression = `<=${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return false; } else { return asNumber <= this.whereCompare; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('ge|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.formattedWhereClause = `${this.column} >= ${this.predicate}`;
                this.userExpression = `>=${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return false; } else { return asNumber >= this.whereCompare; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('!=|')) {
            if (this.trySetAsNumber(this.predicate)) {
                this.formattedWhereClause = `${this.column} != ${this.predicate}`;
                this.userExpression = `!${this.predicate}`;
                this.filterMethod = v => {
                    const asNumber = Number(v);
                    if (asNumber === NaN) { return true; } else { return asNumber !== this.whereCompare; }
                };
            }
        } else if (this.whereClause.toLowerCase().startsWith('custom|')) {
            // allow custom filter syntax (the breadcrumb text is the predicate)
            this.formattedWhereClause = `${this.predicate}`;
            this.userExpression = `=${this.predicate}`;
            this.filterMethod = v => {
                return true;
            };
        }
        else {
            this.formattedWhereClause = `${this.column} starts with ${this.whereClause}`;
            this.userExpression = `${this.whereClause}`;
            this.filterMethod = v => {
                return v.startsWith(this.whereClause);
            };
        }
    }

    trySetAsNumber(s: string): boolean {
        this.whereCompare = Number(s);

        if (this.whereCompare === NaN) {
            this.valid = false;
            return false;
        } else {
            return true;
        }
    }
}
