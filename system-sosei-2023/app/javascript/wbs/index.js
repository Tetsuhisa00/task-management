// 1. jsonファイルを読み込む
// 2. jsonからshape情報を読み込む
// 3. draw2dのrectangleをshapeで示された位置に描画する
// http://10.69.126.170:8000/
import "jquery";
import "jquery-ui";
import "draw2d";
import { Task } from "wbs/task";
import { CommandSplineConnect } from "wbs/CommandSplineConnect";
import { deadlineValidator } from "wbs/task_validation";

let canvas = null;
let json = null;

function createConnection(args) {
    let con = (() => {
        if (args != null) {
            return new draw2d.shape.state.Connection(args);                                                                                
        } else {
            return new draw2d.shape.state.Connection();
        }
    })();
    con.setRouter(new draw2d.layout.connection.SplineConnectionRouter());                                                                                                                                                                  
    con.setLabel("");
    return con;                                                                                                       
}

function initCanvas() {
    canvas = new draw2d.Canvas("canvas", 8000, 2000);
    canvas.setScrollArea("#canvas");

    // Connectionを引く際の制約の設定（今回はドラッグのみでConnectionを引けるようにする）                               
    canvas.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({                                  
        createConnection: createConnection                                                                                                                                                                                                        
    }));
    // キャンバスの表示設定
    canvas.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy());
    canvas.installEditPolicy(new draw2d.policy.canvas.WheelZoomPolicy());
    canvas.setDimension(8000, 2000);
    // 確実にコンテナ内に収める
    $("#canvas*").removeAttr("style");

    // クリック時にタスクの詳細を表示
    canvas.on("click", (emitter, event) => {
        $('#sidebarRight #update').off('click');
        let figures = canvas.getSelection().getAll().asArray();
        if (figures.length == 1 && figures[0] instanceof Task) {
            figures[0].setTaskDetail();
            $('#sidebarRight #update').on('click', () => {
                figures[0].updateTaskDetail();
                figures[0].updateDisplay();
            });
        } else if (figures.length == 0) {
            $('#sidebarRight #title').val("");
            $('#sidebarRight #description').val("");
            $('#sidebarRight #start_date').val("");
            $('#sidebarRight #deadline').val("");
            $('#sidebarRight #work_output').val("");
            $('#sidebarRight #status').val("");
            $('#sidebarRight #tag_dropdown input').prop('checked', false);
            $('#sidebarRight #tag_container').empty();
            $('#sidebarRight #manager').val("");
        }
    });
    
    // Connection 追加時にラベルを設定
    canvas.on("figure:add", (emitter, event) => {
        if (event.figure instanceof draw2d.shape.state.Connection) {
            let work_output = event.figure.getSource().getParent().taskInfo.task.work_output;
            event.figure.setLabel(work_output);
        }
    });

    // タスク削除時に管理用配列からも削除
    canvas.on("figure:remove", (emitter, event) => {
        //taskShapesからevent.figureを削除
        if (event.figure instanceof Task) {
          taskShapes.splice(taskShapes.indexOf(event.figure), 1);
        }
    });

    // jsonを読み込んで図形を描画
    drawShapesAndConnectionsFromJSON();
}

document.addEventListener("turbo:load", function () {
    json = JSON.parse(document.getElementById("json_data").value);
    console.log(json);
  
    initCanvas();

    $("#add_task").on('click', addTask);
    $("#post_json_form").on('submit', postJson);
    $("#sidebarRight #start_date").on('change', deadlineValidator);
    $("#sidebarRight #deadline").on('change', deadlineValidator);
    $("#tag_dropdown input").on('change', () => {
        let tags = [];
        $("#tag_dropdown input:checked").each((i, tag) => {
            tags.push($("#tag_dropdown label").filter(`[for=${$(tag).attr('id')}]`).text());
        });
        setTagStatus(tags);
    });
    
    canvas.setTagStatus = setTagStatus;
    
    // タスク締め切りの確認
    let isEmergency = false;
    let isWarning = false;
    canvas.getFigures().each((i, figure) => {
        if (figure instanceof Task) {
            isEmergency = isEmergency || figure.isEmergency;
            isWarning = isWarning || figure.isWarning;
        }
    });
    
    setupEmergencyScreen(isWarning, isEmergency);
});

function setTagStatus(tags) {
    if (canvas.tag_list == null) { return; }
    let tag_colors = [
        "bg-red-100    text-red-800    dark:bg-red-900    dark:text-red-300",
        "bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-300",
        "bg-gray-100   text-gray-800   dark:bg-gray-700   dark:text-gray-300",
        "bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-300",
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        "bg-pink-100   text-pink-800   dark:bg-pink-900   dark:text-pink-300"
    ];

    $("#tag_container").empty();
    canvas.tag_list.forEach((tag, i) => {
        if (tags.includes(tag)) {
            $("#tag_container").append(
                $('<span></span>')
                    .addClass(`${tag_colors[i % tag_colors.length]} text-xs font-medium me-2 px-2.5 py-0.5 mt-1 mr-1 rounded-full whitespace-nowrap`)
                    .text(tag)
            );
        }
    });
};

function addTask() {
    let taskInfo = { };
    const shape = new Task({ taskInfo: taskInfo });
    let cmd = new draw2d.command.CommandAdd(canvas, shape,
        document.body.clientWidth / 2 - shape.taskInfo.shape.width / 2,
        document.documentElement.clientHeight / 2 - shape.taskInfo.shape.height / 2);

    if (cmd.canExecute()) {
        cmd.execute();
        taskShapes.push(shape);
    } else {
        console.logError("can't execute command: " + cmd);
    }
}

function postJson() {
    json = getShapesAndConnectionsInfo();
    
    document.getElementById("post_json_data").value = JSON.stringify(json);
}

let figures = null;

// タスク図形を保持する配列
const taskShapes = [];

function drawShapesAndConnectionsFromJSON() {
    if (!json || !json.task_list || !json.connection_list) {
        console.log("JSONデータが不完全です。");
        return;
    }

    // タスク図形を生成し、配列に追加
    for (const taskData of json.task_list) {
        const shapeData = taskData.shape;
        // タスクの形状を生成
        const shape = new Task({ taskInfo: taskData });
        let cmd = new draw2d.command.CommandAdd(canvas, shape, shapeData.x, shapeData.y);

        if (cmd.canExecute()) {
            cmd.execute();
            taskShapes.push(shape);
            console.log(taskShapes);
        } else {
            console.logError("can't execute command: " + cmd);
        }
    }
    // タスクに関連する接続を描画
    for (const connectionData of json.connection_list) {
        // console.log("接続情報：",connectionData);
        const startTaskId = connectionData.start_task_id;
        const endTaskId = connectionData.end_task_id;

        console.log("開始タスクID:", startTaskId); // 追加
        console.log("終了タスクID:", endTaskId); // 追加

        // 開始タスクと終了タスクに対応する図形を取得
        const startShape = getShapeByTaskId(startTaskId);
        const endShape = getShapeByTaskId(endTaskId);

        console.log("開始タスクの図形:", startShape); // 追加
        console.log("終了タスクの図形:", endShape); // 追加

        if (startShape && endShape) {
            // 接続を作成
            let cmd = new CommandSplineConnect(
                startShape.getOutputPort(0),
                endShape.getInputPort(0),
                startShape.getOutputPort(0)
            );
            
            if (cmd.canExecute()) {
                cmd.execute();
                cmd.getConnection().setLabel(startShape.taskInfo.task.work_output);
            }
        }
    }
    
    // tag 情報を canvas に保存
    canvas.tag_list = json.tag_list;
}

// タスクIDに対応する図形を取得する関数
function getShapeByTaskId(taskId) {
    for (const shape of taskShapes) {

        const taskData = shape.taskInfo;
        console.log("タスクデータ：",taskData);
        if (taskData && taskData.task.id === taskId) {
            return shape;
        }
    }
    return null; // 該当するShapeが見つからない場合
}


function getShapesAndConnectionsInfo() {
    const shapesAndConnectionsInfo = {
        task_list: [],
        connection_list: []
    };

    for (const shape of taskShapes) {
        const taskData = shape.taskInfo;

        const json = {
            task: {
                id: taskData.task.id,
                title: taskData.task.title,
                work_output: taskData.task.work_output,
                start_date: taskData.task.start_date,
                deadline: taskData.task.deadline,
                status: taskData.task.status,
                tags: taskData.task.tags || [],
                manager: taskData.task.manager
            },
            shape: {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height
            }
        };

        shapesAndConnectionsInfo.task_list.push(json);
    }

    const allFigures = canvas.getLines().asArray();
    for (const figure of allFigures) {
        if (figure instanceof draw2d.Connection) {
            const startShape = figure.getSource().getParent();
            const endShape = figure.getTarget().getParent();

            const connectionInfo = {
                start_task_id: startShape.taskInfo.task.id,
                end_task_id: endShape.taskInfo.task.id
            };

            shapesAndConnectionsInfo.connection_list.push(connectionInfo);
        }
    }

    console.log('Shapes and Connections Information:', shapesAndConnectionsInfo);
    return shapesAndConnectionsInfo;
}

// 音声を停止する関数
function stopSound() {
    var alertSound = document.getElementById('alert-sound');
    if (alertSound) {
        alertSound.pause(); // 音声を停止
        alertSound.currentTime = 0; // 再生位置をリセット
    }
}

// 非常事態の画面と画像を非表示にする関数
function hideEmergencyScreen() {
    var emergencySign = document.querySelector('.emergency-sign');
    var overlayImage = document.getElementById('overlay-image');
    if (emergencySign) {
        emergencySign.style.display = 'none';
    }
    if (overlayImage) {
        overlayImage.style.display = 'none';
    }
    stopSound(); // 音声も停止
    window.onclick = null;
}

// 画像を表示する関数
function showOverlayImage() {
    setTimeout(function () {
        var overlayImage = document.getElementById('overlay-image');
        if (overlayImage) {
            overlayImage.classList.remove('hidden');
            overlayImage.classList.add('visible');
        }
    }, 3000); // 3秒後に画像を表示
}

// 非常事態の画面と画像のクリックイベントハンドラ
function handleEmergencyContentClick() {
    hideEmergencyScreen();
}

// ページが読み込まれた時、非常事態の画面を表示し、音声を再生し、画像表示のタイミングを設定する
function setupEmergencyScreen(isWarning, isEmergency) {
    // 残り時間3割で注意
    // 期限切れで非常事態
    if (isEmergency || isWarning) {
        window.onclick = () => {
            var emergencySign = document.querySelector('.emergency-sign');
            var alertSound = document.getElementById('alert-sound');
            if (emergencySign && alertSound) {
                if (isEmergency) {
                    emergencySign.classList.add('red');
                    $(".text3").text("＊期限が切れています＊");
                } else if (isWarning){
                    emergencySign.classList.add('yellow');
                }
                emergencySign.classList.remove('hidden');
                emergencySign.classList.add('visible');
                alertSound.play().catch(error => {
                    console.error('Playback prevented', error);
                });

                // 非常事態の画面と画像にクリックイベントを設定
                emergencySign.addEventListener('click', handleEmergencyContentClick);
                var overlayImage = document.getElementById('overlay-image');
                if (overlayImage) {
                    overlayImage.addEventListener('click', handleEmergencyContentClick);
                }

                showOverlayImage();
            }
        }
    }
}
