import { DataModel } from '@lumino/datagrid';
import { JDField } from 'jacdac-ts';

export class RecordingDataModel extends DataModel {
    private _headers: string[] = [];
    private _units: string[] = [] = [];
    private _rows: number[][] = [];
    private _fields: JDField[] = [];

    constructor() {
        super()
    }

    setFields(fields: JDField[]) {
        this._fields = fields;
        this._headers = fields.map(field => field.prettyName)
        this._units = fields.map(field => field.unit)
        this._rows = [];
        this.emitChanged(<DataModel.ModelResetArgs>{ type: 'model-reset' })
    }

    addRow() {
        const row = this._fields?.map(field => field.value) || [];
        this._rows.push(row)
        this.emitChanged(<DataModel.RowsChangedArgs>{ 
            type: 'rows-inserted',
            region: 'body',
            index: this._rows.length - 1,
            span: 1
        })
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