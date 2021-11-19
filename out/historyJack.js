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
exports.HistoryJack = void 0;
const vscode = require("vscode");
const jack_1 = require("./jack");
const historyTree_1 = require("./historyTree");
const extensionVariables_1 = require("./extensionVariables");
class HistoryJack extends jack_1.JackBase {
    constructor() {
        super("History Jack", "extension.jenkins-jack.history");
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.history.delete", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyTree_1.HistoryTreeItem) {
                let jobs = !items
                    ? [item.job.name]
                    : items
                        .filter((item) => historyTree_1.HistoryTreeItemType.History === item.type)
                        .map((item) => item.job.name);
                this.delete(jobs);
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.history.open", (item, items) => __awaiter(this, void 0, void 0, function* () {
            let jobs = [];
            if (item instanceof historyTree_1.HistoryTreeItem) {
                jobs = items
                    ? items
                        .filter((item) => historyTree_1.HistoryTreeItemType.History === item.type)
                        .map((i) => i.job)
                    : [item.job];
            }
            else {
                jobs = yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow(undefined, true);
                if (undefined === jobs) {
                    return false;
                }
            }
            for (let job of jobs) {
                extensionVariables_1.ext.connectionsManager.host.openBrowserAt(job.url);
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.history.moveup", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyTree_1.HistoryTreeItem) {
                let job = item.job.fullName;
                this.moveProject(job, "up");
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.history.movedown", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyTree_1.HistoryTreeItem) {
                let job = item.job.fullName;
                this.moveProject(job, "down");
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.history.add", () => __awaiter(this, void 0, void 0, function* () {
            yield this.addProject();
        })));
        // 不需要 应该在分支上构建
        // ext.context.subscript ions.push(
        //   vscode.commands.registerCommand(
        //     "extension.jenkins-jack.history.build",
        //     async (item?: any | HistoryTreeItem, items?: HistoryTreeItem[]) => {
        //       let result: boolean | undefined = false;
        //       if (item instanceof HistoryTreeItem) {
        //         let jobs = !items
        //           ? [item.job]
        //           : items
        //               .filter(
        //                 (item: HistoryTreeItem) => HistoryTreeItemType.History === item.type
        //               )
        //               .map((item: any) => item.job);
        //         result = await this.build(jobs);
        //       } else {
        //         result = await this.build(item);
        //       }
        //       if (result) {
        //         ext.jobTree.refresh();
        //       }
        //     }
        //   )
        // );
    }
    get commands() {
        return [
            {
                label: "$(stop)  History: Disable",
                description: "Disables targeted jobs from the remote Jenkins.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.history.disable"),
            },
            {
                label: "$(check)  History: Enable",
                description: "Enables targeted jobs from the remote Jenkins.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.history.enable"),
            },
            {
                label: "$(circle-slash)  History: Delete",
                description: "Deletes targeted jobs from the remote Jenkins.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.history.delete"),
            },
            {
                label: "$(browser)  History: Open",
                description: "Opens the targeted jobs in the user's browser.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.history.open"),
            },
            {
                label: "$(add)  History: Add",
                description: "本地创建一个Jenkins 构建项目",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.history.add"),
            },
        ];
    }
    delete(jobs) {
        return __awaiter(this, void 0, void 0, function* () {
            let r = yield this.showInformationModal(`你确定要删除以下项目吗?\n\n${jobs === null || jobs === void 0 ? void 0 : jobs.join("\n")}`, {
                title: "确认",
            });
            if (undefined === r) {
                return;
            }
            let project = vscode.workspace.getConfiguration("jenkins-jack.project");
            const projectList = project.get("list") || [];
            const filterProject = projectList.filter((item) => !(jobs === null || jobs === void 0 ? void 0 : jobs.includes(item.name)));
            vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.project.list", filterProject, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand("extension.jenkins-jack.tree.history.refresh");
            vscode.window.showInformationMessage(`项目${jobs === null || jobs === void 0 ? void 0 : jobs.join("\n")} 删除成功`);
            // 更新
            extensionVariables_1.ext.historyTree.refresh();
            // ext.pipelineTree.refresh();
        });
    }
    /**
     * 添加一个jenkins 项目配置
     */
    addProject(projects) {
        return __awaiter(this, void 0, void 0, function* () {
            let projectConfig = vscode.workspace.getConfiguration("jenkins-jack.project");
            let projectName = (projects || []).join("\t\n");
            let projectList = [];
            if (Array.isArray(projects)) {
                projectList = projects.map(i => ({ name: i }));
            }
            else {
                projectName = yield this.getProjectName();
                if (undefined === projectName) {
                    return;
                }
                projectList = [
                    {
                        name: projectName,
                    },
                ];
            }
            projectList = [
                ...projectList,
                ...(projectConfig.get("list") || []),
            ];
            vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.project.list", projectList, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand("extension.jenkins-jack.tree.history.refresh");
            vscode.window.showInformationMessage(`项目 ${projectName} 添加成功`);
        });
    }
    /**
     * 获取一个jenkins 项目名称
     * @param string
     * @returns
     */
    getProjectName(projectName) {
        return __awaiter(this, void 0, void 0, function* () {
            let projectList = vscode.workspace.getConfiguration("jenkins-jack.project");
            let name = undefined;
            while (true) {
                name = yield vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: "请输入一个jenkins 项目名称(例如: test05-fore-hotel-h5)",
                    value: projectName,
                });
                if (undefined === name) {
                    return undefined;
                }
                if (!projectList.has(name) || projectName === name) {
                    break;
                }
                // if (
                //   !projectList.some((c: any) => c.name === name) ||
                //   projectName === name
                // ) {
                //   break;
                // }
                vscode.window.showWarningMessage(`已经存在一个为“${name}”的项目。请重新输入其他项目名称。`);
            }
            return name;
        });
    }
    moveProject(job, move) {
        if (!job || !move)
            return;
        let projectConfig = vscode.workspace.getConfiguration("jenkins-jack.project");
        const projectList = (projectConfig.get("list") || []);
        const targetIndex = projectList === null || projectList === void 0 ? void 0 : projectList.findIndex((item) => item.name === job);
        const targetItem = projectList[targetIndex];
        let tempItem;
        if (move === "up" && targetIndex > 0) {
            tempItem = Object.assign(projectList[targetIndex - 1]);
            projectList[targetIndex - 1] = targetItem;
            projectList[targetIndex] = tempItem;
        }
        if (move === "down" && projectList.length > targetIndex + 1) {
            tempItem = Object.assign(projectList[targetIndex + 1]);
            projectList[targetIndex + 1] = targetItem;
            projectList[targetIndex] = tempItem;
        }
        // 更新
        extensionVariables_1.ext.historyTree.refresh();
    }
}
exports.HistoryJack = HistoryJack;
//# sourceMappingURL=historyJack.js.map