import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { JobType } from "./jobType";
import { filepath } from "./utils";

export class HistoryTree {
  private readonly _treeView: vscode.TreeView<HistoryTreeItem>;
  private readonly _treeViewDataProvider: HistoryTreeProvider;

  public constructor() {
    this._treeViewDataProvider = new HistoryTreeProvider();
    this._treeView = vscode.window.createTreeView("historyTree", {
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
        "extension.jenkins-jack.tree.history.refresh",
        (content: any) => {
          this.refresh();
        }
      )
    );
  }

  public refresh() {
    this._treeView.title = `常用构建列表 (${ext.connectionsManager.host.connection.name})`;
    this._treeViewDataProvider.refresh();
  }
}

export class HistoryTreeProvider
  implements vscode.TreeDataProvider<HistoryTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    HistoryTreeItem | undefined
  > = new vscode.EventEmitter<HistoryTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private _cancelTokenSource: vscode.CancellationTokenSource;

  // private _config: any;

  public constructor() {
    this._cancelTokenSource = new vscode.CancellationTokenSource();

    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("jenkins-jack.project")) {
        this.updateSettings();
      }
    });

    this.updateSettings();
  }

  private updateSettings() {
    // this._config = vscode.workspace.getConfiguration("jenkins-jack.project");
    this.refresh();
  }

  refresh(): void {
    this._cancelTokenSource.cancel();
    this._cancelTokenSource.dispose();
    this._cancelTokenSource = new vscode.CancellationTokenSource();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryTreeItem): HistoryTreeItem {
    return element;
  }

  getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
    return new Promise(async resolve => {
      let list = [];
      if (element) {
        const { fullName } = element.job;
        let banrchs = await ext.connectionsManager.host.getGitBranch(
          fullName,
          this._cancelTokenSource.token
        );
        // 未获取到分支
        if (!banrchs) {
          resolve([]);
          return;
        }
        for (let branch of banrchs) {
          let label = `${branch.name}`;
          list.push(
            new HistoryTreeItem(
              label,
              HistoryTreeItemType.Build,
              vscode.TreeItemCollapsibleState.None,
              element.job,
              branch
            )
          );
        }
      } else {
        let projectList: any[] | undefined = vscode.workspace
          .getConfiguration("jenkins-jack.project")
          .get("list");
        // let jobs = await ext.connectionsManager.host.getJobs(null, {
        //   token: this._cancelTokenSource.token,
        // });
        // jobs = jobs.filter((job: any) => job.type !== JobType.Folder);
        if (!projectList) return;

        const connUri = ext.connectionsManager.activeConnection?.uri;

        for (let project of projectList) {
          let label = project.name;

          let historyTreeItem = new HistoryTreeItem(
            label,
            HistoryTreeItemType.History,
            vscode.TreeItemCollapsibleState.Collapsed,
            {
              fullName: project.name,
              buildable: true,
              description: "",
              inQueue: false,
              type: "default",
              url: `${connUri}/job/${label}/`,
              ...project,
            }
          );
          list.push(historyTreeItem);
        }
      }
      resolve(list);
    });
  }
}

export enum HistoryTreeItemType {
  History = "History",
  Build = "Build",
}

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: HistoryTreeItemType,
    public readonly treeItemState: vscode.TreeItemCollapsibleState,
    public readonly job: any,
    public readonly build?: any
  ) {
    super(label, treeItemState);

    let iconPrefix = "task";
    if (HistoryTreeItemType.History === type) {
      this.contextValue = "history";

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
    if (HistoryTreeItemType.History === this.type) {
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
    return HistoryTreeItemType.History === this.type
      ? this.job.description
      : this.build.description;
  }
}
