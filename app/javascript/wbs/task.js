import "jquery";
import "jquery-ui";
import "draw2d";
import { deadlineValidator, startDateValidator } from "wbs/task_validation";
import { XYAbsPortLocatorFromBottom } from "wbs/XYAbsPortLocatorFromBottom";
import { XYAbsPortLocatorFromBottomRight } from "wbs/XYAbsPortLocatorFromBottomRight";

const normalStrokeColor = "#777777";
const boldStrokeColor = "#FFA732";

const Task = draw2d.shape.node.Between.extend(
    /** @lends Task.prototype */
    {

    NAME: "Task",

    /**
     *
     * @param {Object} [attr] the configuration of the shape
     */
    init: function (attr, setter, getter) {
        this._super(extend({
            bgColor: "#FFFFFF",
            color: this.DEFAULT_COLOR.darker(),
            radius: 10,
        }, attr), setter, getter);
        
        if (attr == null) {
            attr = { taskInfo: {} };
        }

        this.taskInfo = attr.taskInfo;
        let taskInfo = this.taskInfo;

        // 既定値の設定
        taskInfo.task ??= {};
        taskInfo.task.id ??= crypto.randomUUID();
        taskInfo.task.title ??= "新規タスク";
        taskInfo.task.description ??= "ここに説明を入力";
        taskInfo.task.status ??= "未着手";
        taskInfo.task.priority ??= "低";
        taskInfo.task.start_date ??= (() => {
            let now = new Date(Date.now());
            now.setHours(0, 0, 0, 0);
            return now.toISOString();
        })();
        taskInfo.task.deadline ??= (() => {
            let now = new Date(Date.now());
            now.setDate(now.getDate() + 7);
            now.setHours(0, 0, 0, 0);
            return now.toISOString();
        })();
        taskInfo.task.tags ??= [];
        taskInfo.task.work_output ??= "";
        taskInfo.task.manager ??= "";

        taskInfo.shape ??= {};
        taskInfo.shape.x ??= 100;
        taskInfo.shape.y ??= 100;
        taskInfo.shape.width ??= 150;
        taskInfo.shape.height ??= 100;

        this.width = this.taskInfo.shape.width;
        this.height = this.taskInfo.shape.height;
        this.x = this.taskInfo.shape.x;
        this.y = this.taskInfo.shape.y;

        // タスクのタイトル用ラベルの作成
        this.titleLabel = new draw2d.shape.basic.Label({
            text: this.taskInfo.task.title,
            stroke: 0,
            fontColor: "#0d0d0d",
            bgColor: "#FFFFFF"
        });
        this.add(this.titleLabel, new draw2d.layout.locator.XYAbsPortLocator({x: 5, y: 5}));

        // タスクの進捗状況用ラベルの作成
        this.statusLabel = new draw2d.shape.basic.Label({
            text: this.taskInfo.task.status,
            stroke: 0,
            fontColor: "#000000",
        });
        this.updateStatusColor();

        // ラベルの位置を調整
        const labelWidth = this.statusLabel.getWidth();
        const labelHeight = this.statusLabel.getHeight();
        const labelX = (this.width - labelWidth) / 2; // 図形の中央に配置
        const labelY = (this.height - labelHeight) / 2; // 図形の中央に配置
  
        this.add(this.statusLabel, new XYAbsPortLocatorFromBottomRight({x: 0, y: 0}));
        
        // 締め切り日用ラベルの作成
        this.deadlineLabel = new draw2d.shape.basic.Label({
            text: this.taskInfo.task.deadline.split('T')[0],
            stroke: 0,
            fontColor: "#000000",
            bgColor: "#FFFFFF"
        });
        
        this.add(this.deadlineLabel, new XYAbsPortLocatorFromBottom(0, 0));
        
        // 出力ポートからの接続を1つに制限
        this.getOutputPort(0).setMaxFanOut(1);
        
        // タスク締め切りの確認
        this.updateEmergency();

        // 自分が担当者なら図形の枠線を太くする
        let username = $('#user_name').val();
        if (username != null && username != "" && this.taskInfo.task.manager === username) {
            this.setColor(boldStrokeColor);
            this.setGlow(true);
        } else {
            this.setColor(normalStrokeColor);
            this.setGlow(false);
        }
    },
        
    updateEmergency() {
        let start_date = new Date(this.taskInfo.task.start_date);
        let deadline = new Date(this.taskInfo.task.deadline);
        let today = new Date(Date.now());

        // 全体作業時間の3割未満で isWarning
        // 最終日は isWarning
        // 全体作業時間を超えたら isEmergency
        
        let work_time = deadline.getTime() - start_date.getTime();
        let work_time_left = deadline.getTime() - today.getTime();

        this.isWarning = work_time_left < work_time * 0.3 || work_time_left < 60 * 60 * 24 * 1000;
        this.isEmergency = work_time_left < 0;
        
        if (this.taskInfo.task.status == "完了") {
            this.isWarning = false;
            this.isEmergency = false;
        }
        
        if (this.isEmergency) {
            this.setBackgroundColor("#ef4444"); // 赤
        } else if (this.isWarning) {
            this.setBackgroundColor("#FFC000"); // 黄
        } else {
            this.setBackgroundColor("#FFFFFF"); // 白
        }
    },
        

    updateStatusColor() {
        switch (this.taskInfo.task.status) {
            case "未着手":
                this.statusLabel.setBackgroundColor("#4CB9E7"); // 灰
                break;
            case "進行中":
                this.statusLabel.setBackgroundColor("#EEF296"); // 黃
                break;
            case "完了":
                this.statusLabel.setBackgroundColor("#9ADE7B"); // 緑
                break;
            default:
                // 未知の進捗の場合、デフォルトの色を設定
                this.statusLabel.setBackgroundColor("#CCCCCC"); // 灰
                break;
        }
    },

    setTaskDetail() {
        let taskInfo = this.taskInfo;
        $('#sidebarRight #title').val(taskInfo.task.title);
        $('#sidebarRight #description').val(taskInfo.task.description);
        document.querySelector('#sidebarRight #start_date').valueAsNumber = Date.parse(taskInfo.task.start_date);
        document.querySelector('#sidebarRight #deadline').valueAsNumber = Date.parse(taskInfo.task.deadline);
        $('#sidebarRight #work_output').val(taskInfo.task.work_output);
        $('#sidebarRight #status').val(taskInfo.task.status);

        // 親タスクのうち最も進みが遅い進捗を選択
        let isCompleted = true;
        this.getParents().forEach((parent) => {
            if (parent.taskInfo.task.status != '完了') {
                isCompleted = false;
            }
        });

        $('#sidebarRight #status option').each((i, option) => $(option).show());

        if (!isCompleted) {
            $('#sidebarRight #status option[value="進行中"]').hide();
            $('#sidebarRight #status option[value="完了"]').hide();
        }
        
        $('#sidebarRight #manager').val(taskInfo.task.manager);

        // タグの設定
        const tag_input = $('#sidebarRight #tag_dropdown input');
        const tag_label = $('#sidebarRight #tag_dropdown label');
        if (tag_label != null && tag_input != null) {
            tag_input.each((i, input) => {
                const btn_name = tag_label.filter('[for=' + $(input).attr('id') + ']').text();
                $(input).prop('checked', taskInfo.task.tags.includes(btn_name));
            });
        }
        this.getCanvas().setTagStatus(taskInfo.task.tags);
        
        // 親タスクの deadline よりも早い日付を startDate に設定できないようにする
        startDateValidator(this.getParents());
        deadlineValidator();
    },

    updateTaskDetail() {
        this.taskInfo.task.title = $('#sidebarRight #title').val();
        this.taskInfo.task.description = $('#sidebarRight #description').val();
        this.taskInfo.task.start_date = new Date(document.querySelector('#sidebarRight #start_date').valueAsNumber).toISOString();
        this.taskInfo.task.deadline = new Date(document.querySelector('#sidebarRight #deadline').valueAsNumber).toISOString();
        this.taskInfo.task.work_output = $('#sidebarRight #work_output').val();
        this.taskInfo.task.status = $('#sidebarRight #status').val();
        this.taskInfo.task.manager = $('#sidebarRight #manager').val();

        // タグの設定
        const tag_input = $('#sidebarRight #tag_dropdown input');
        const tag_label = $('#sidebarRight #tag_dropdown label');
        if (tag_label != null && tag_input != null) {
            this.taskInfo.task.tags = [];
            tag_input.each((i, input) => {
                if ($(input).prop('checked')) {
                    const btn_name = tag_label.filter('[for=' + $(input).attr('id') + ']').text();
                    this.taskInfo.task.tags.push(btn_name);
                }
            });
        }
        
        let output_connection = this.getOutputPort(0).getConnections().asArray()[0];
        console.log(output_connection);
        if (output_connection != null) {
            output_connection.setLabel(this.taskInfo.task.work_output);
        }
    },

    // WBS 図の再描画
    updateDisplay() {
        this.titleLabel.setText(this.taskInfo.task.title);
        this.statusLabel.setText(this.taskInfo.task.status);
        this.deadlineLabel.setText(this.taskInfo.task.deadline.split('T')[0]);
        let username = $('#user_name').val();
        if (username != null && username != "" && this.taskInfo.task.manager === username) {
            this.setColor(boldStrokeColor);
            this.setGlow(true);
        } else {
            this.setColor(normalStrokeColor);
            this.setGlow(false);
        }
        this.updateStatusColor();

        this.updateEmergency();
    },

    getParents() {
        return this.getInputPort(0).getConnections().asArray().map((connection) => {
            return connection.getSource().getParent();
        });
    }
});

export { Task };
