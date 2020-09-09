import { StackedPanel, Widget } from "@lumino/widgets";
import { RecordingDataModel } from "./RecordingDataModel";
import { DataGrid } from "@lumino/datagrid";
import { Toolbar, ToolbarButton } from "@jupyterlab/apputils";
import { bugIcon } from "@jupyterlab/ui-components";
import { CommandRegistry } from "@lumino/commands"
import { COMMAND_CONNECT } from "./commands";

export class RecordingDataGridPanel extends StackedPanel {
  private readonly toolbar: Toolbar<Widget>;

  constructor(
    commands: CommandRegistry,
    public readonly model: RecordingDataModel
    ) {
    super();
    this.addClass('jd-recording-datagrid');
    this.id = 'jd-recording-datagrid';
    this.title.label = 'JACDAC Recorded data';
    this.title.closable = true;

    this.toolbar = new Toolbar<Widget>()
    this.toolbar.addItem('connect', new ToolbarButton({
      icon: bugIcon,
      onClick: () => commands.execute(COMMAND_CONNECT),
      tooltip: 'connect to JACDAC'
    }));
    this.addWidget(this.toolbar)

    // grid
    const grid = new DataGrid();
    grid.dataModel = model;
    this.addWidget(grid);
  }
}