import "jquery";
import "jquery-ui";
import "draw2d";

/**
 * @class
 *
 * Connects two ports with a connection with Router.
 *
 * @inheritable
 * @author Wakuto Matsumi
 *
 * @extends draw2d.command.CommandConnect
 */
const CommandSplineConnect = draw2d.command.Command.extend(
    /** @lends CommandSplineConnect.prototype */
    {

        NAME: "CommandSplineConnect",

        /**
         * Create a new CommandSplineConnect objects which can be execute via the CommandStack.
         *
         * @param {draw2d.Port} source the source port for the connection to create
         * @param {draw2d.Port} target the target port for the connection to create
         * @param {draw2d.Port} [dropTarget] the port who has initiate the connection creation. mainly the drop target
         */
        init: function (source, target, dropTarget) {
            this._super(draw2d.Configuration.i18n.command.connectPorts)
            this.canvas = target.getCanvas()
            this.source = source
            this.target = target
            this.connection = null
            this.dropTarget = dropTarget // optional
        },

        /**
         *
         * set the connection to use. called by the ConnectionCreatePolicy
         */
        setConnection: function (connection) {
            this.connection = connection
        },


        /**
         *
         * Returns the fresh created connection if available. Used in the
         * ClickConnectionCreatePolicy to customize the router and vertices.
         *
         * @returns {null|draw2d.Connection}
         * @since 6.1.0
         */
        getConnection: function () {
            return this.connection
        },

        /**
         *
         * Execute the command the first time
         *
         **/
        execute: function () {
            let optionalCallback = conn => {
                this.connection = conn
                this.connection.setSource(this.source)
                this.connection.setTarget(this.target)
                this.connection.setRouter(new draw2d.layout.connection.SplineConnectionRouter())
                this.connection.setLabel("");
                this.canvas.add(this.connection)
            }

            // the createConnection must return either a connection or "undefined". If the method return "undefined"
            // the asynch callback must be called. Usefull if the createConnection shows a selection dialog
            //
            if (this.connection === null) {
                // deprecated call!!!!
                //
                // let result = draw2d.Configuration.factory.createConnection(this.source, this.target, optionalCallback, this.dropTarget)
                let result = new draw2d.shape.state.Connection();
                // will be handled by the optional callback
                if (typeof result === "undefined") {
                    return
                }

                this.connection = result
            }

            optionalCallback(this.connection)
        },

        /**
         *
         * Redo the command after the user has undo this command.
         *
         **/
        redo: function () {
            this.canvas.add(this.connection)
            this.connection.reconnect()
        },

        /**
         *
         * Undo the command.
         *
         **/
        undo: function () {
            this.canvas.remove(this.connection)
        }
    });

export { CommandSplineConnect };