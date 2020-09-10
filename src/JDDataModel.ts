import { DataModel } from '@lumino/datagrid';
import { JDField, JDBus } from 'jacdac-ts';

export class JDDataModel extends DataModel {
    private _headers: string[] = [];
    private _units: string[] = [] = [];
    // first row is always timestamp
    private _rows: number[][] = [];
    private _fields: JDField[] = [];
    private _startTimestamp: number = 0;

    constructor(public readonly bus: JDBus) {
        super()
    }

    setFields(fields: JDField[]) {
        const changed = this._fields.length !== fields.length 
            || this._fields.some((field, index) => field !== fields[index]);
        this._fields = fields;
        if (changed)
            this.reset()
    }

    reset() {
        this._headers = this._fields.map(field => field.prettyName)
        this._headers.unshift("time") // always first column of timestamps
        this._units = this._fields.map(field => field.unit)
        this._units.unshift("ms") // first column of timestamp
        this._rows = [];
        this._startTimestamp = this.bus.timestamp;
        this.emitChanged(<DataModel.ModelResetArgs>{ type: 'model-reset' })
    }

    clearRows() {
        this._rows = []
        this._startTimestamp = this.bus.timestamp
    }

    toCSV(clear = false) {
        const sep = ','
        const r = [
            this._headers,
            this._units,
            ...this._rows.map(row => row.map(d => d === undefined ? "" : d.toString()))
        ].map(line => line.join(sep))
            .join('\n')
        if (clear)
            this.clearRows()
        return r;
    }

    addRow() {
        if (!this._fields?.length)
            return 0;
        const row = this._fields?.map(field => field.value) || [];
        row.unshift(this.bus.timestamp - this._startTimestamp)
        this._rows.push(row)
        this.emitChanged(<DataModel.RowsChangedArgs>{
            type: 'rows-inserted',
            region: 'body',
            index: this._rows.length - 1,
            span: 1
        })
        return this._rows.length
    }

    rowCount(region: DataModel.RowRegion): number {
        if (region == "column-header")
            return 2; // name, unit
        else
            return this._rows.length;
    }

    columnCount(region: DataModel.ColumnRegion): number {
        if (region == "row-header")
            return 0;
        return this._headers.length;
    }

    data(region: DataModel.CellRegion, row: number, column: number): any {
        if (region === 'row-header') {
            return 'NA';
        }
        else if (region === 'column-header') {
            if (row == 0) return this._headers[column]
            else if (row == 1) return this._units[column]
            return "NA"
        }
        else if (region === 'corner-header') {
            return `NA`;
        }
        return this._rows[row][column]
    }
}