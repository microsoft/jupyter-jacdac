import { StackedPanel } from "@lumino/widgets";
import { RecordingDataModel } from "./RecordingDataModel";
import { DataGrid } from "@lumino/datagrid";

export class RecordingDataGridPanel extends StackedPanel {
    constructor(public readonly model: RecordingDataModel) {
      super();
      this.addClass('jd-recording-datagrid');
      this.id = 'jd-recording-datagrid';
      this.title.label = 'JACDAC Recorded data';
      this.title.closable = true;
  
      const grid = new DataGrid();
      grid.dataModel = model;
  
      this.addWidget(grid);
    }
  }