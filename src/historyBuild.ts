import * as vscode from "vscode";
import { JackBase } from "./jack";
import { HistoryBuildTreeItem, HistoryBuildTreeItemType } from "./historyBuildTree";
import { ext } from "./extensionVariables";

export class HistoryBuild extends JackBase {
  constructor() {
    super("HistoryBuild", "extension.jenkins-jack.historyBuild");

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.historyBuild.delete",
        async (item?: any[] | HistoryBuildTreeItem, items?: HistoryBuildTreeItem[]) => {
          if (item instanceof HistoryBuildTreeItem) {
            let jobs = !items
              ? [item.job]
              : items
                .filter(
                  (item: HistoryBuildTreeItem) =>
                    HistoryBuildTreeItemType.History === item.type
                ).map(j => j.job);

            this.delete(jobs);
          }
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.historyBuild.open",
        async (item?: any | HistoryBuildTreeItem, items?: HistoryBuildTreeItem[]) => {
          let jobs: any[] | undefined = [];

          if (item instanceof HistoryBuildTreeItem) {
            jobs = items
              ? items
                  .filter(
                    (item: HistoryBuildTreeItem) =>
                      HistoryBuildTreeItemType.History === item.type
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
        "extension.jenkins-jack.historyBuild.moveup",
        async (item?: any | HistoryBuildTreeItem, items?: HistoryBuildTreeItem[]) => {
          if (item instanceof HistoryBuildTreeItem) {
            let job = item.job.fullName;
            this.moveProject(job, "up");
          }
        }
      )
    );
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.historyBuild.movedown",
        async (item?: any | HistoryBuildTreeItem, items?: HistoryBuildTreeItem[]) => {
          if (item instanceof HistoryBuildTreeItem) {
            let job = item.job.fullName;
            this.moveProject(job, "down");
          }
        }
      )
    );
    // 不需要 应该在分支上构建
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.historyBuild.build",
        async (item?: any | HistoryBuildTreeItem, items?: HistoryBuildTreeItem[]) => {
          let result: boolean | undefined = false;
          if (item instanceof HistoryBuildTreeItem) {
            let jobs = !items
              ? [item.job]
              : items
                  .filter(
                    (item: HistoryBuildTreeItem) => HistoryBuildTreeItemType.History === item.type
                  )
                  .map((item: any) => item.job);
            result = await ext.buildJack.build(jobs)
          } else {
            result = await ext.buildJack.build(item)
          }
          if (result) {
            ext.historyTree.refresh();
          }
        }
      )
    );
  }

  public get commands(): any[] {
    return [
      {
        label: "$(circle-slash)  HistoryBuild: Delete",
        description: "删除最近构建项目",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.historyBuild.delete"
          ),
      },
      // {
      //   label: "$(browser)  HistoryBuild: Build",
      //   description: "构建默认分支",
      //   target: () =>
      //     vscode.commands.executeCommand("extension.jenkins-jack.historyBuild.build"),
      // },
      {
        label: "$(browser)  HistoryBuild: Open",
        description: "浏览器打开Jenkins 项目",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.historyBuild.open"),
      },
    ];
  }

  public async delete(jobs?: string[]) {
    let r = await this.showInformationModal(
      `你确定要删除以下项目吗?\n\n${jobs?.map((p:any)=>p.fullName)?.join("\n")}`,
      {
        title: "确认",
      }
    );
    if (undefined === r) {
      return;
    }

    let project = vscode.workspace.getConfiguration("jenkins-jack.historyProject");

    const projectList: [] = project.get("list") || [];

    const filterProject = projectList.filter(
      (item: any) => jobs?.findIndex((j:any)=>j.fullName===item.name&&j.branch===item.branch)===-1
    );
    vscode.workspace
      .getConfiguration()
      .update(
        "jenkins-jack.historyProject.list",
        filterProject,
        vscode.ConfigurationTarget.Global
      );
    vscode.commands.executeCommand(
      "extension.jenkins-jack.tree.historyBuild.refresh"
    );
    vscode.window.showInformationMessage(`项目${jobs?.map((p:any)=>p.fullName)?.join("\n")} 删除成功`);

    // 更新
    ext.historyBuildTree.refresh();
    // ext.pipelineTree.refresh();
  }

  /**
   * 获取一个jenkins 项目名称
   * @param string
   * @returns
   */
  public moveProject(job: string, move: "up" | "down") {
    if (!job || !move) return;

    let projectConfig = vscode.workspace.getConfiguration(
      "jenkins-jack.historyProject"
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
