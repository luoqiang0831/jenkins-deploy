import * as vscode from "vscode";
import { JackBase } from "./jack";
import { HistoryTreeItem, HistoryTreeItemType } from "./historyTree";
import { ext } from "./extensionVariables";

export class HistoryJack extends JackBase {
  constructor() {
    super("History Jack", "extension.jenkins-jack.history");

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.history.delete",
        async (item?: any[] | HistoryTreeItem, items?: HistoryTreeItem[]) => {
          if (item instanceof HistoryTreeItem) {
            let jobs = !items
              ? [item.job.name]
              : items
                  .filter(
                    (item: HistoryTreeItem) =>
                      HistoryTreeItemType.History === item.type
                  )
                  .map((item: any) => item.job.name);

            this.delete(jobs);
          }
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.history.open",
        async (item?: any | HistoryTreeItem, items?: HistoryTreeItem[]) => {
          let jobs: any[] | undefined = [];

          if (item instanceof HistoryTreeItem) {
            jobs = items
              ? items
                  .filter(
                    (item: HistoryTreeItem) =>
                      HistoryTreeItemType.History === item.type
                  )
                  .map((i: any) => i.job)
              : [item.job];
          } else {
            jobs = await ext.connectionsManager.host.jobSelectionFlow(
              undefined,
              true
            );
            if (undefined === jobs) {
              return false;
            }
          }
          for (let job of jobs) {
            ext.connectionsManager.host.openBrowserAt(job.url);
          }
        }
      )
    );
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.history.moveup",
        async (item?: any | HistoryTreeItem, items?: HistoryTreeItem[]) => {
          if (item instanceof HistoryTreeItem) {
            let job = item.job.fullName;
            this.moveProject(job, "up");
          }
        }
      )
    );
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.history.movedown",
        async (item?: any | HistoryTreeItem, items?: HistoryTreeItem[]) => {
          if (item instanceof HistoryTreeItem) {
            let job = item.job.fullName;
            this.moveProject(job, "down");
          }
        }
      )
    );
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.history.add",
        async () => {
          await this.addProject();
        }
      )
    );
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

  public get commands(): any[] {
    return [
      {
        label: "$(stop)  History: Disable",
        description: "Disables targeted jobs from the remote Jenkins.",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.history.disable"
          ),
      },
      {
        label: "$(check)  History: Enable",
        description: "Enables targeted jobs from the remote Jenkins.",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.history.enable"
          ),
      },
      {
        label: "$(circle-slash)  History: Delete",
        description: "Deletes targeted jobs from the remote Jenkins.",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.history.delete"
          ),
      },
      {
        label: "$(browser)  History: Open",
        description: "Opens the targeted jobs in the user's browser.",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.history.open"),
      },
      {
        label: "$(add)  History: Add",
        description: "本地创建一个Jenkins 构建项目",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.history.add"),
      },
    ];
  }

  public async delete(jobs?: string[]) {
    let r = await this.showInformationModal(
      `你确定要删除以下项目吗?\n\n${jobs?.join("\n")}`,
      {
        title: "确认",
      }
    );
    if (undefined === r) {
      return;
    }

    let project = vscode.workspace.getConfiguration("jenkins-jack.project");

    const projectList: [] = project.get("list") || [];

    const filterProject = projectList.filter(
      (item: any) => !jobs?.includes(item.name)
    );
    vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.project.list",
        filterProject,
        vscode.ConfigurationTarget.Global
      );
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.history.refresh"
    );
    vscode.window.showInformationMessage(`项目${jobs?.join("\n")} 删除成功`);

    // 更新
    ext.historyTree.refresh();
    // ext.pipelineTree.refresh();
  }

  /**
   * 添加一个jenkins 项目配置
   */
  public async addProject(projects?: Array<string>) {
    let projectConfig = vscode.workspace.getConfiguration(
      "jenkins-jack.project"
    );

    let projectName: string | undefined = (projects || []).join("\t\n");
    let projectList = [];

    if (Array.isArray(projects)) {
      projectList = projects.map(i => ({ name: i }));
    } else {
      projectName = await this.getProjectName();
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
      ...((projectConfig.get("list") || []) as Array<any>),
    ];

    vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.project.list",
        projectList,
        vscode.ConfigurationTarget.Global
      );
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.history.refresh"
    );
    vscode.window.showInformationMessage(`项目 ${projectName} 添加成功`);
  }
  /**
   * 获取一个jenkins 项目名称
   * @param string
   * @returns
   */
  private async getProjectName(
    projectName?: string
  ): Promise<string | undefined> {
    let projectList = vscode.workspace.getConfiguration("jenkins-jack.project");

    let name: string | undefined = undefined;
    while (true) {
      name = await vscode.window.showInputBox({
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

      vscode.window.showWarningMessage(
        `已经存在一个为“${name}”的项目。请重新输入其他项目名称。`
      );
    }

    return name;
  }
  moveProject(job: string, move: "up" | "down") {
    if (!job || !move) return;

    let projectConfig = vscode.workspace.getConfiguration(
      "jenkins-jack.project"
    );

    const projectList = (projectConfig.get("list") || []) as Array<{}>;

    const targetIndex = projectList?.findIndex(
      (item: any) => item.name === job
    );

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
    ext.historyTree.refresh();
  }
}
