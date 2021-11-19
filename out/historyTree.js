"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryTreeItem = exports.HistoryTreeItemType = exports.HistoryTreeProvider = exports.HistoryTree = void 0;
const vscode = require("vscode");
const extensionVariables_1 = require("./extensionVariables");
const jobType_1 = require("./jobType");
const utils_1 = require("./utils");
class HistoryTree {
    constructor() {
        this._treeViewDataProvider = new HistoryTreeProvider();
        this._treeView = vscode.window.createTreeView("historyTree", {
            treeDataProvider: this._treeViewDataProvider,
            canSelectMany: true,
        });
        this._treeView.onDidChangeVisibility((e) => {
            if (e.visible) {
                this.refresh();
            }
        });
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.tree.history.refresh", (content) => {
            this.refresh();
        }));
    }
    refresh() {
        this._treeView.title = `常用构建列表 (${extensionVariables_1.ext.connectionsManager.host.connection.name})`;
        this._treeViewDataProvider.refresh();
    }
}
exports.HistoryTree = HistoryTree;
class HistoryTreeProvider {
    // private _config: any;
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._cancelTokenSource = new vscode.CancellationTokenSource();
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration("jenkins-jack.project")) {
                this.updateSettings();
            }
        });
        this.updateSettings();
    }
    updateSettings() {
        // this._config = vscode.workspace.getConfiguration("jenkins-jack.project");
        this.refresh();
    }
    refresh() {
        this._cancelTokenSource.cancel();
        this._cancelTokenSource.dispose();
        this._cancelTokenSource = new vscode.CancellationTokenSource();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let list = [];
            if (element) {
                const { fullName } = element.job;
                let banrchs = yield extensionVariables_1.ext.connectionsManager.host.getGitBranch(fullName, this._cancelTokenSource.token);
                // 未获取到分支
                if (!banrchs) {
                    resolve([]);
                    return;
                }
                for (let branch of banrchs) {
                    let label = `${branch.name}`;
                    list.push(new HistoryTreeItem(label, HistoryTreeItemType.Build, vscode.TreeItemCollapsibleState.None, element.job, branch));
                }
            }
            else {
                let projectList = vscode.workspace
                    .getConfiguration("jenkins-jack.project")
                    .get("list");
                // let jobs = await ext.connectionsManager.host.getJobs(null, {
                //   token: this._cancelTokenSource.token,
                // });
                // jobs = jobs.filter((job: any) => job.type !== JobType.Folder);
                if (!projectList)
                    return;
                const connUri = (_a = extensionVariables_1.ext.connectionsManager.activeConnection) === null || _a === void 0 ? void 0 : _a.uri;
                for (let project of projectList) {
                    let label = project.name;
                    let historyTreeItem = new HistoryTreeItem(label, HistoryTreeItemType.History, vscode.TreeItemCollapsibleState.Collapsed, Object.assign({ fullName: project.name, buildable: true, description: "", inQueue: false, type: "default", url: `${connUri}/job/${label}/` }, project));
                    list.push(historyTreeItem);
                }
            }
            resolve(list);
        }));
    }
}
exports.HistoryTreeProvider = HistoryTreeProvider;
var HistoryTreeItemType;
(function (HistoryTreeItemType) {
    HistoryTreeItemType["History"] = "History";
    HistoryTreeItemType["Build"] = "Build";
})(HistoryTreeItemType = exports.HistoryTreeItemType || (exports.HistoryTreeItemType = {}));
class HistoryTreeItem extends vscode.TreeItem {
    constructor(label, type, treeItemState, job, build) {
        super(label, treeItemState);
        this.label = label;
        this.type = type;
        this.treeItemState = treeItemState;
        this.job = job;
        this.build = build;
        let iconPrefix = "task";
        if (HistoryTreeItemType.History === type) {
            this.contextValue = "history";
            if (!job.buildable) {
                iconPrefix = this.contextValue = "job-disabled";
            }
        }
        else {
            iconPrefix = "connection-inactive";
            this.contextValue = [
                jobType_1.JobType.Multi,
                jobType_1.JobType.Org,
                jobType_1.JobType.Pipeline,
            ].includes(job.type)
                ? "build-pipeline"
                : "build";
        }
        this.iconPath = {
            light: utils_1.filepath("images", `${iconPrefix}-light.svg`),
            dark: utils_1.filepath("images", `${iconPrefix}-dark.svg`),
        };
    }
    // @ts-ignore
    get tooltip() {
        if (HistoryTreeItemType.History === this.type) {
            if (undefined === this.job.description || "" === this.job.description) {
                return this.label;
            }
            else {
                return `${this.label} - ${this.job.description}`;
            }
        }
        else {
            return this.build.building
                ? `${this.label}: BUILDING`
                : `${this.label}: ${this.build.result}`;
        }
    }
    // @ts-ignore
    get description() {
        return HistoryTreeItemType.History === this.type
            ? this.job.description
            : this.build.description;
    }
}
exports.HistoryTreeItem = HistoryTreeItem;
//# sourceMappingURL=historyTree.js.map