import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { JobType } from "./jobType";
import { filepath } from "./utils";

export class HistoryBuildTree {
  private readonly _treeView: vscode.TreeView<HistoryBuildTreeItem>;
  private readonly _treeViewDataProvider: HistoryBuildTreeProvider;

  public constructor() {
    this._treeViewDataProvider = new HistoryBuildTreeProvider();
    this._treeView = vscode.window.createTreeView("historyBuildTree", {
      treeDataProvider: this._treeViewDataProvider,
      canSelectMany: true,
    });
    this._treeView.onDidChangeVisibility(
      (e: vscode.TreeViewVisibilityChangeEvent) => {
        if (e.visible) {
          this.refresh();
        }
      }
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.tree.historyBuild.refresh",
        (content: any) => {
          this.refresh();
        }
      )
    );
  }

  public refresh() {
    this._treeView.title = `最近构建列表 (${ext.connectionsManager.host.connection.name})`;
    this._treeViewDataProvider.refresh();
  }
}

export class HistoryBuildTreeProvider
  implements vscode.TreeDataProvider<HistoryBuildTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    HistoryBuildTreeItem | undefined
  > = new vscode.EventEmitter<HistoryBuildTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<HistoryBuildTreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private _cancelTokenSource: vscode.CancellationTokenSource;

  // private _config: any;

  public constructor() {
    this._cancelTokenSource = new vscode.CancellationTokenSource();

    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("jenkins-jack.historyProject")) {
        this.updateSettings();
      }
    });

    this.updateSettings();
  }

  private updateSettings() {
    // this._config = vscode.workspace.getConfiguration("jenkins-jack.historyProject");
    this.refresh();
  }

  refresh(): void {
    this._cancelTokenSource.cancel();
    this._cancelTokenSource.dispose();
    this._cancelTokenSource = new vscode.CancellationTokenSource();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryBuildTreeItem): HistoryBuildTreeItem {
    return element;
  }

  getChildren(
    element?: HistoryBuildTreeItem
  ): Thenable<HistoryBuildTreeItem[]> {
    return new Promise(async resolve => {
      let list = [];
      let projectList: any[] | undefined = vscode.workspace
        .getConfiguration("jenkins-jack.historyProject")
        .get("list");

      if (!projectList) {
        return false;
      }

      const connUri = ext.connectionsManager.activeConnection?.uri;

      for (let project of projectList) {
        let label = `${project.name}  (${project.branch.replace(
          "origin/",
          ""
        )})`;

        let historyBuildTreeItem = new HistoryBuildTreeItem(
          label,
          HistoryBuildTreeItemType.History,
          vscode.TreeItemCollapsibleState.None,
          {
            fullName: project.name,
            buildable: true,
            description: "",
            inQueue: false,
            type: "default",
            url: `${connUri}/job/${project.name}/`,
            branch: project.branch,
            ...project,
          }
        );
        list.push(historyBuildTreeItem);
      }
      resolve(list);
    });
  }
}

export enum HistoryBuildTreeItemType {
  History = "HistoryBuild",
  Build = "Build",
}

export class HistoryBuildTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: HistoryBuildTreeItemType,
    public readonly treeItemState: vscode.TreeItemCollapsibleState,
    public readonly job: any,
    public readonly build?: any
  ) {
    super(label, treeItemState);

    let iconPrefix = "history-job";
    if (HistoryBuildTreeItemType.History === type) {
      this.contextValue = "historyBuild";

      if (!job.buildable) {
        iconPrefix = this.contextValue = "job-disabled";
      }
    } else {
      iconPrefix = "connection-inactive";
      this.contextValue = [
        JobType.Multi,
        JobType.Org,
        JobType.Pipeline,
      ].includes(job.type)
        ? "build-pipeline"
        : "build";
    }
    this.iconPath = {
      light: filepath("images", `${iconPrefix}-light.svg`),
      dark: filepath("images", `${iconPrefix}-dark.svg`),
    };
  }

  // @ts-ignore
  get tooltip(): string {
    if (HistoryBuildTreeItemType.History === this.type) {
      if (undefined === this.job.description || "" === this.job.description) {
        return this.label;
      } else {
        return `${this.label} - ${this.job.description}`;
      }
    } else {
      return this.build.building
        ? `${this.label}: BUILDING`
        : `${this.label}: ${this.build.result}`;
    }
  }

  // @ts-ignore
  get description(): string {
    return HistoryBuildTreeItemType.History === this.type
      ? this.job.description
      : this.build.description;
  }
}
