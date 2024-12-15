# Pin npm packages by running ./bin/importmap

pin "application", preload: true
pin "@hotwired/turbo-rails", to: "turbo.min.js", preload: true
pin "@hotwired/stimulus", to: "stimulus.min.js", preload: true
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js", preload: true
pin_all_from "app/javascript/controllers", under: "controllers"
pin "jquery", to: "https://code.jquery.com/jquery-3.7.1.js", preload: true
pin "jquery-ui", to: "https://code.jquery.com/ui/1.13.2/jquery-ui.js", preload: true
pin "draw2d", to: "https://cdn.jsdelivr.net/npm/draw2d@1.0.38/dist/draw2d.min.js"
pin "wbs/index"
pin "wbs/task"
pin "wbs/CommandSplineConnect"
pin "wbs/task_validation"
pin "wbs/XYAbsPortLocatorFromBottom"
pin "wbs/XYAbsPortLocatorFromBottomRight"
