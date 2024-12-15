import "jquery";
import "jquery-ui";
import "draw2d";

const XYAbsPortLocatorFromBottom = draw2d.layout.locator.XYAbsPortLocator.extend( {
    NAME: "XYAbsPortLocatorFromBottom",

    init: function (attr, setter, getter) {
        if (typeof attr === "number" && typeof setter === "number") {
            this.x = attr
            this.y = setter
            this._super()
        } else {
            this.x = 0
            this.y = 0

            this._super(attr,
            {
                x: this.setX,
                y: this.setY,
                ...setter
            },
            {
                x: this.getX,
                y: this.getY,
                ...getter
            })
        }
    },
    
    setX: function (x) {
        this.x = x
    },

    setY: function (y) {
        this.y = y
    },

    getX: function () {
        return this.x
    },

    getY: function () {
        return this.y
    },

    relocate: function (index, figure) {
        let parent = figure.getParent();
        this.applyConsiderRotation(figure, this.x + 5, parent.getHeight() - this.y - figure.getBoundingBox().h - 5);
    }
});

export { XYAbsPortLocatorFromBottom };