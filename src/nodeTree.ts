import * as vscode from "vscode";
import { ext } from "./extensionVariables";
import { filepath } from "./utils";

export class NodeTree {
  private readonly _treeView: vscode.TreeView<NodeTreeItem>;
  private readonly _treeViewDataProvider: NodeTreeProvider;

  public constructor() {
    this._treeViewDataProvider = new NodeTreeProvider();
    this._treeView = vscode.window.createTreeView("nodeTree", {
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
        "extension.jenkins-jack.tree.node.refresh",
        () => {
          this.refresh();
        }
      )
    );
  }

  // @ts-ignore
  public refresh() {
    this._treeView.title = `Nodes (${ext.connectionsManager.host.connection.name})`;
    this._treeViewDataProvider.refresh();
  }
}

export class NodeTreeProvider implements vscode.TreeDataProvider<NodeTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<NodeTreeItem | undefined> =
    new vscode.EventEmitter<NodeTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<NodeTreeItem | undefined> =
    this._onDidChangeTreeData.event;
  private _cancelTokenSource: vscode.CancellationTokenSource;

  public constructor() {
    this._cancelTokenSource = new vscode.CancellationTokenSource();
    this.updateSettings();
  }

  private updateSettings() {}

  refresh(): void {
    this._cancelTokenSource.cancel();
    this._cancelTokenSource.dispose();
    this._cancelTokenSource = new vscode.CancellationTokenSource();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NodeTreeItem): NodeTreeItem {
    return element;
  }

  getChildren(element?: NodeTreeItem): Thenable<NodeTreeItem[]> {
    return new Promise(async resolve => {
      let list = [];
      let nodes = await ext.connectionsManager.host.getNodes(
        this._cancelTokenSource.token
      );
      if (undefined === nodes) {
        resolve([]);
      }
      nodes = nodes?.filter((n: any) => n.displayName !== "master");
      for (let n of nodes) {
        list.push(
          new NodeTreeItem(
            `${n.displayName}`,
            vscode.TreeItemCollapsibleState.None,
            n
          )
        );
      }
      resolve(list);
    });
  }
}

export class NodeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly treeItemState: vscode.TreeItemCollapsibleState,
    public readonly node: any
  ) {
    super(label, treeItemState);

    this.contextValue = "node";

    let iconPrefix = "node-enabled";
    if (node.offline && node.temporarilyOffline) {
      iconPrefix = "node-disabled";
      this.contextValue = "node-disabled";
    } else if (node.offline) {
      iconPrefix = "node-disconnected";
      this.contextValue = "node-disconnected";
    }

    this.iconPath = {
      light: filepath("images", `${iconPrefix}-light.svg`),
      dark: filepath("images", `${iconPrefix}-dark.svg`),
    };
  }

  // @ts-ignore
  get tooltip(): string {
    let tooltip = this.label;

    if (this.node.temporarilyOffline) {
      tooltip += " (OFFLINE)";
    } else if (this.node.offline) {
      tooltip += " (DISCONNECTED)";
    } else {
      tooltip += " (ONLINE)";
    }

    if (this.node.temporarilyOffline) {
      return `${tooltip}\n${this.node.offlineCauseReason}`;
    }
    return tooltip;
  }

  // @ts-ignore
  get description(): string {
    let description = this.node.description;
    if (this.node.temporarilyOffline) {
      description += ` (${this.node.offlineCauseReason})`;
    }
    return description;
  }
}
