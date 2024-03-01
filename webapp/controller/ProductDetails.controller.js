sap.ui.define([
        "sap/ui/core/library",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Fragment",
        "sap/ui/model/odata/v2/ODataModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/core/Core",
        "sap/ui/core/routing/History",
        "sap/ui/core/Messaging",
        "./BaseController",
        "sap/ui/core/library",
        "sap/m/MessagePopover",
        "sap/m/MessageItem",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/library",
        "sap/m/Text",
        "sap/ui/core/message/Message",
        "sap/ui/core/MessageType"
    ], function (coreLibrary, JSONModel, Fragment, ODataModel, Filter, FilterOperator, Sorter, MessageToast,
                 MessageBox, Core, History, Messaging,
                 BaseController, CoreLibrary, MessagePopover, MessageItem,
                 Dialog, Button, mobileLibrary, Text, Message, MessageType) {
        "use strict";

        const ButtonType = mobileLibrary.ButtonType;
        const DialogType = mobileLibrary.DialogType;
        const ValueState = coreLibrary.ValueState;

        return BaseController.extend("darya.zavaliuk.controller.ProductDetails", {

            /**
             * Lifecycle hook called during the initialization of the view/controller.
             * Initializes necessary components, models, and event handlers.
             *
             * @public
             */
            onInit: function () {
                const oComponent = this.getOwnerComponent();
                const oRouter = oComponent.getRouter();

                Messaging.registerObject(this.getView(), true);
                this.getView().setModel(Messaging.getMessageModel(), "messages");
                this.getView().setModel(new JSONModel(), "state");

                oRouter.getRoute("ProductDetailsUpdate").attachPatternMatched(this.onPatternMatchedProductUpdate, this);
                oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatchedProduct, this);
                oRouter.getRoute("ProductDetailsCreate").attachPatternMatched(this.onPatternMatchedProductCreate, this);
            },

            /**
             * Event handler for the cancel button press.
             * Sets the 'isCreatePage' property of the 'state' model to false and navigates back to the ProductsOverview page.
             *
             * @public
             */
            onPressCancel: function () {
                this.getView().getModel("state").setProperty("/isCreatePage", false);

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ProductsOverview", {}, true);
            },

            /**
             * Event handler for the edit product button press.
             * Sets the 'isCreatePage' property of the 'state' model to false, retrieves the ID of the product from the 'product' model,
             * and navigates to the ProductDetailsUpdate page with the product ID and edit flag.
             *
             * @public
             */
            onPressEditProduct: function () {
                this.getView().getModel("state").setProperty("/isCreatePage", false);
                const oProductViewModel = this.getView().getModel("product");

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ProductDetailsUpdate", {id: oProductViewModel.getProperty("/ID"), edit: true}, true);
            },

            /**
             * Updates the product details in the model and navigates to the ProductDetails page.
             *
             * @private
             */
            _updateProductDetails: function () {
                const oProductViewModel = this.getView().getModel("product");
                const oModel = this.getView().getModel();
                const oItems = oModel.getProperty("/Products");
                const iExistingElementIndex = oItems.findIndex(element => element.ID === oProductViewModel.getProperty("/ID"));

                if (iExistingElementIndex !== -1) {
                    oItems[iExistingElementIndex] = oProductViewModel.getData();
                } else {
                    oItems.push(oProductViewModel.getData());
                }
                oModel.setProperty("/Products", oItems);

                this.getOwnerComponent().getRouter().navTo("ProductDetails", {id: oProductViewModel.getProperty("/ID")}, true);
            },

            /**
             * Displays an error dialog with a predefined message.
             *
             * @private
             */
            _showErrorDialog: function () {
                if (!this.oErrorMessageDialog) {
                    this.oErrorMessageDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Error",
                        state: ValueState.Error,
                        content: new Text({text: this._getTextFromI18n("notAllValidInputs")}),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "OK",
                            press: function () {
                                this.oErrorMessageDialog.close();
                            }.bind(this)
                        })
                    });
                }

                this.oErrorMessageDialog.open();
            },

            /**
             * Event handler for the create product button press.
             *
             * @public
             */
            onPressCreateProduct: function () {
                if (!this.getView().getModel("messages").getProperty("/").length) {
                    this.getView().getModel("state").setProperty("/isCreatePage", false);
                    this._updateProductDetails.call(this);
                } else {
                    this._showErrorDialog.call(this);
                }
            },

            /**
             * Handles the deletion of a product.
             * Displays a confirmation dialog and deletes the selected product if confirmed.
             *
             * @public
             */
            onPressDeleteProduct: function () {
                const oProductViewModel = this.getView().getModel("product");

                const oModel = this.getView().getModel();
                let oItems = oModel.getProperty("/Products");
                let iExistingElementIndex = oItems.findIndex(element => element.ID === oProductViewModel.getProperty("/ID"));

                if (iExistingElementIndex !== -1) {
                    oItems.splice(iExistingElementIndex, 1);
                }

                oModel.setProperty("/Products", oItems);

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ProductsOverview");
            },

            /**
             * Event handler for the product pattern matched event.
             * @param {sap.ui.base.Event} oEvent - The event object.
             *
             * @public
             */
            onPatternMatchedProduct: function (oEvent) {
                this.getView().getModel("state").setProperty("/isCreatePage", false);
                this._resetForm();
                this._loadProductData();
                this._setProductModel(oEvent);
            },

            /**
             * Event handler for the product update pattern matched event.
             * @param {sap.ui.base.Event} oEvent - The event object.
             *
             * @public
             */
            onPatternMatchedProductUpdate: function (oEvent) {
                this.getView().getModel("state").setProperty("/isCreatePage", true);
                this._loadProductData();
                this._setProductModel(oEvent);
            },

            /**
             * Event handler for the create column button press.
             *
             * @public
             */
            onPressCreateColumn: function () {
                this.getView().getModel("product").getProperty("/Composition").push({
                    "Name": "",
                    "Percent": "0"
                });
                this.getView().getModel("product").refresh();
            },

            /**
             * Event handler for the "patternMatched" event on the product creation page.
             * Sets the state to indicate that the page is in create mode, resets the form,
             * loads product data, and sets up the default product model.
             *
             * @param {sap.ui.base.Event} oEvent - The event object.
             * @returns {void}
             *
             * @public
             */
            onPatternMatchedProductCreate: function (oEvent) {
                this.getView().getModel("state").setProperty("/isCreatePage", true);
                this._resetForm();
                this._loadProductData();

                const oProductModel = this.getView().getModel().getProperty("/Products");
                const oModel = this._getDefaultProductModel(oProductModel.length + 1);
                this.getView().setModel(oModel, "product");
            },

            /**
             * Resets the form by clearing the value states of specific input fields and removing all messages.
             *
             * @returns {void}
             * @private
             */
            _resetForm: function () {
                const oView = this.getView();

                oView.byId("CategoryName").setValueState(ValueState.None);
                oView.byId("StatusName").setValueState(ValueState.None);
                oView.byId("SupplierName").setValueState(ValueState.None);

                Messaging.removeAllMessages();
            },

            /**
             * Loads product-related data (categories, statuses, suppliers) from the model and sets up
             * a new JSON model for the product-related data in the view.
             *
             * @returns {void}
             * @private
             */
            _loadProductData: function () {
                const oDataProducts = this.getOwnerComponent().getModel();
                const oCategoryNames = oDataProducts.getProperty("/Categories");
                const oStatusNames = oDataProducts.getProperty("/Statuses");
                const oSupplierNames = oDataProducts.getProperty("/Suppliers");

                const oProductsModel = new JSONModel({
                    categoryNames: oCategoryNames,
                    statusNames: oStatusNames,
                    supplierNames: oSupplierNames
                });

                this.getView().setModel(oProductsModel, "products");
            },

            /**
             * Sets up a new JSON model for a specific product using data from the main model.
             *
             * @param {sap.ui.base.Event} oEvent - The event object containing route arguments.
             * @returns {void}
             * @private
             */
            _setProductModel: function (oEvent) {
                const mRouteArguments = oEvent.getParameter("arguments");
                const sStoreID = mRouteArguments.id;
                const oJSONModel = this.getView().getModel().getProperty("/Products");

                const oItem = oJSONModel.find(oItem => oItem.ID == sStoreID);
                const oModel = new JSONModel(JSON.parse(JSON.stringify(oItem)));

                this.getView().setModel(oModel, "product");
            },

            /**
             * Creates a new JSON model with default values for a product.
             *
             * @param {number} newID - The new ID for the product.
             * @returns {sap.ui.model.json.JSONModel} - The JSON model with default product values.
             * @private
             */
            _getDefaultProductModel: function (newID) {
                return new JSONModel({
                    "ID": newID,
                    "Name": "",
                    "Category": {"Name": ""},
                    "Supplier": {"Name": ""},
                    "Status": "",
                    "Price": "",
                    "Rating": "",
                    "Composition": []
                });
            },

            /**
             * Creates and initializes a Message Popover control by instantiating a fragment and setting it
             * as a dependent of the Message Popover button in the view.
             *
             * @returns {void}
             */
            _createMessagePopover: function () {
                this.oMP = sap.ui.xmlfragment("MessagePopover", "darya.zavaliuk.view.fragments.MessagePopover", this);
                this.getView().byId("messagePopoverBtn").addDependent(this.oMP);
            },

            /**
             * Event handler for the "press" event on an item in the Message Popover.
             * Extracts information from the item's binding context to determine the target control ID.
             * Closes the Message Popover and sets a timeout to focus on the identified control.
             *
             * @param {sap.ui.base.Event} oEvent - The event object.
             * @returns {void}
             */
            onPressItem: function (oEvent) {
                const sStr = oEvent.mParameters.item.getBindingContext("messages").oModel.oData[parseInt(oEvent.mParameters.item.getBindingContext("messages").sPath.substring(1))].aTargets[0];
                let iLastDashIndex = sStr.lastIndexOf("--");
                let iFirstSlashIndex = sStr.indexOf("/", iLastDashIndex);
                const oView = this.getView();

                let sResult;
                if (iFirstSlashIndex !== -1) {
                    sResult = sStr.substring(iLastDashIndex + 2, iFirstSlashIndex);
                } else {
                    sResult = sStr.substring(iLastDashIndex + 2);
                }

                this.oMP.close();

                setTimeout(() => {
                    oView.byId(sResult).focus();
                }, 300);
            },

            /**
             * Closes the Message Popover.
             *
             * @returns {void}
             */
            handleClose: function () {
                this.oMP.close();
            },

            /**
             * Event handler for the press event on the control triggering the Message Popover.
             * Creates the Message Popover if it does not exist and toggles its visibility.
             *
             * @param {sap.ui.base.Event} oEvent - The event object.
             * @returns {void}
             */
            handleMessagePopoverPress: function (oEvent) {
                if (!this.oMP) {
                    this._createMessagePopover();
                }
                this.oMP.toggle(oEvent.getSource());
            },

            /**
             * Event handler for the "change" event on a ComboBox. Validates the selected key and value,
             * removes existing error messages associated with the ComboBox, and adds a new error message
             * if the input is invalid. Adjusts the ComboBox's value state and value state text accordingly.
             *
             * @param {sap.ui.base.Event} oEvent - The event object.
             * @returns {void}
             */
            handleChange: function (oEvent) {
                const oValidatedComboBox = oEvent.getSource(),
                    sSelectedKey = oValidatedComboBox.getSelectedKey(),
                    sValue = oValidatedComboBox.getValue();

                const aMessages = Messaging.getMessageModel().oData;
                const aFilteredMessages = aMessages.filter(function (oMessage) {
                    return oMessage.target === oValidatedComboBox.getId();
                });

                aFilteredMessages.forEach(function (oMessage) {
                    Messaging.removeMessages(oMessage);
                });

                if (!sSelectedKey && sValue || sValue == "") {
                    Messaging.addMessages(
                        new Message({
                            message: this._getTextFromI18n("enterValue"),
                            type: MessageType.Error,
                            target: oValidatedComboBox.getId(),
                            id: oValidatedComboBox.getId(),
                            controlId: oValidatedComboBox.getId(),
                            processor: oValidatedComboBox.getModel()
                        })
                    );

                    oValidatedComboBox.setValueState(ValueState.Error);
                    oValidatedComboBox.setValueStateText(this._getTextFromI18n("enterValue"));
                } else {
                    oValidatedComboBox.setValueState(ValueState.None);
                }
            }

        });
    }
);
