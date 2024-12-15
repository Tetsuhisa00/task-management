function deadlineValidator() {
    const startDate = document.querySelector('#sidebarRight #start_date');
    const deadline = document.querySelector('#sidebarRight #deadline');
    
    deadline.min = startDate.value;
    let dl = new Date(startDate.valueAsNumber);
    dl.setDate(dl.getDate() + 7);
    deadline.max = dl.toISOString().split('T')[0];
    
    if (deadline.valueAsNumber > dl) {
        deadline.value = dl.toISOString().split('T')[0];
    }
    if (deadline.valueAsNumber < startDate.valueAsNumber) {
        deadline.value = startDate.value;
    }
}

function startDateValidator(parents) {
    const startDate = document.querySelector('#sidebarRight #start_date');
    const deadline = document.querySelector('#sidebarRight #deadline');

    // 親タスクの deadline よりも早い日付を startDate に設定できないようにする
    let minDate = null;
    parents.forEach((parent) => {
        if (parent.taskInfo.task.deadline != null) {
            let parentDeadline = new Date(parent.taskInfo.task.deadline);
            if (minDate == null || parentDeadline < minDate) {
                minDate = parentDeadline;
            }
        }
    });
    if (minDate != null) {
        startDate.min = minDate.toISOString().split('T')[0];
        if (startDate.valueAsNumber < minDate) {
            startDate.value = minDate.toISOString().split('T')[0];
        }
    }
}

export { deadlineValidator, startDateValidator };