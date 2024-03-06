sap.ui.define([
    "sap/ui/core/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/Messaging",
    "./BaseController",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "../utils/formatter",
    "sap/ui/core/Element",
    "sap/ui/dom/isBehindOtherElement",
    "sap/m/MessageBox",
    "sap/m/Input",
    "sap/m/ComboBox"
], function (coreLibrary, JSONModel, Fragment, Messaging,
    BaseController, Message, MessageType, formatter, Element,
    isBehindOtherElement, MessageBox, Input, ComboBox) {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    return BaseController.extend("darya.zavaliuk.controller.ProductDetails", {
        formatter: formatter,

        /**
         * Lifecycle hook called during the initialization of the view/controller.
         * Initializes necessary components, models, and event handlers.
         *
         * @public
         */
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            this._formFragments = {};

            Messaging.registerObject(this.getView(), true);
            this._setupModels();

            oRouter.getRoute("ProductDetailsUpdate").attachPatternMatched(this._onPatternMatchedProductUpdate, this);
            oRouter.getRoute("ProductDetails").attachPatternMatched(this._onPatternMatchedProduct, this);
            oRouter.getRoute("ProductDetailsCreate").attachPatternMatched(this._onPatternMatchedProductCreate, this);
        },

        /**
         * Sets up the models for the view.
         * "messages" model is set using Messaging.getMessageModel().
         * "state" model is set using a new instance of JSONModel.
         *
         * @private
         */
        _setupModels: function () {
            this.getView().setModel(Messaging.getMessageModel(), "messages");
            this.getView().setModel(new JSONModel(), "state");
        },

        /**
         * Event handler for the cancel button press.
         * Sets the 'isEditPage' property of the 'state' model to false and navigates back to the ProductsOverview page.
         *
         * @public
         */
        onPressCancel: function () {
            const oThat = this;

            MessageBox.warning(this._getTextFromI18n("closePageConfirmMessage"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (action) {
                    if (action === MessageBox.Action.OK) {
                        oThat._onPressOkMessageBoxError();
                    }
                }
            });
        },

        /**
         * Toggles the edit mode for the page.
         *
         * @param {boolean} isEdit - Indicates whether the page is in edit mode or not.
         * @private
         */
        _toggleEditPage: function (isEdit) {
            this.getView().getModel("state").setProperty("/isEditPage", isEdit);
        },

        /**
         * Retrieves the array of product items from the model.
         *
         * @returns {Array} An array of product items.
         * @private
         */
        _getProductsItems: function () {
            const oModel = this.getView().getModel();
            return oModel.getProperty("/Products");
        },

        /**
         * Retrieves the "product" model for the view.
         *
         * @returns {sap.ui.model.Model} The "product" model.
         * @private
         */
        _getProductModel: function () {
            return this.getView().getModel("product");
        },

        /**
         * Clears all messages from the messaging model.
         *
         * @private
         */
        _clearAllMessagesFromMessaging: function () {
            Messaging.removeAllMessages();
        },

        /**
         * Event handler for the onPress event of the OK button in the error MessageBox.
         * Performs actions based on the user's selection in the MessageBox.
         *
         * @private
         */
        _onPressOkMessageBoxError: function () {
            this._toggleEditPage(false);

            const oItems = this._getProductsItems();
            const oProductViewModel = this._getProductModel();
            const iExistingElementIndex = oItems.findIndex(element => element.ID === oProductViewModel.getProperty("/ID"));

            if (iExistingElementIndex !== -1) {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ProductDetails", { id: oProductViewModel.getProperty("/ID") }, true);
                return;
            }

            this.getOwnerComponent()
                .getRouter()
                .navTo("ProductsOverview", {}, true);
        },

        /**
         * Toggles the buttons and view based on the edit mode.
         * Shows the corresponding form fragment.
         *
         * @private
         */
        _toggleButtonsAndView: function (bEdit) {
            this._showFormFragment(bEdit ? "Edit" : "Display");
        },

        /**
         * Shows the specified form fragment in the page.
         * Removes all existing form elements and inserts the form elements from the fragment.
         *
         * @param {string} sFragmentName - The name of the form fragment to show.
         * @private
         */
        _showFormFragment: function (sFragmentName) {
            const oPage = this.byId("formContainerForGeneralPart");

            oPage.removeAllFormElements();
            this._getFormFragment(sFragmentName).then(function (oFormElement) {
                oFormElement.reduceRight((oElement, oItem) => {
                    oPage.insertAggregation("formElements", oElement);
                    return oItem;
                });
            });
        },

        /**
         * Event handler for the input change event.
         * Calls the handleRequiredField function to handle required field validation.
         *
         * @param {sap.ui.base.Event} oEvent - The input change event object.
         * @public
         */
        onInputValueChange: function (oEvent) {
            this._handleRequiredField(oEvent.getSource());
        },

        /**
         * Retrieves the specified form fragment.
         * If the fragment has not been loaded before, it is loaded and stored in the _formFragments cache.
         *
         * @param {string} sFragmentName - The name of the form fragment to retrieve.
         * @returns {Promise} A promise that resolves to the form fragment.
         * @private
         */
        _getFormFragment: function (sFragmentName) {
            let pFormFragment = this._formFragments[sFragmentName],
                oView = this.getView();
            const oThat = this;

            if (!pFormFragment) {
                pFormFragment = Fragment.load({
                    id: oView.getId(),
                    name: "darya.zavaliuk.view.fragments." + sFragmentName + "FormProductDetails",
                    controller: oThat
                });
                this._formFragments[sFragmentName] = pFormFragment;
            }

            return pFormFragment;
        },

        /**
         * Event handler for the edit product button press.
         * Sets the 'isEditPage' property of the 'state' model to false, retrieves the ID of the product from the 'product' model,
         * and navigates to the ProductDetailsUpdate page with the product ID and edit flag.
         *
         * @public
         */
        onPressEditProduct: function () {
            this._toggleEditPage(false);
            const oProductViewModel = this._getProductModel();

            this.getOwnerComponent()
                .getRouter()
                .navTo("ProductDetailsUpdate", { id: oProductViewModel.getProperty("/ID"), edit: true }, true);
        },

        /**
         * Updates the product details in the model and navigates to the ProductDetails page.
         *
         * @private
         */
        _updateProductDetails: function () {
            const oProductViewModel = this._getProductModel();
            const oModel = this.getView().getModel();
            const oItems = oModel.getProperty("/Products");
            const iExistingElementIndex = oItems.findIndex(element => element.ID === oProductViewModel.getProperty("/ID"));

            if (iExistingElementIndex !== -1) {
                oItems[iExistingElementIndex] = oProductViewModel.getData();
            } else {
                oItems.push(oProductViewModel.getData());
            }
            oModel.setProperty("/Products", oItems);

            this.getOwnerComponent().getRouter().navTo("ProductDetails", { id: oProductViewModel.getProperty("/ID") }, true);
        },

        /**
         * Displays an error dialog with a predefined message.
         *
         * @private
         */
        _showErrorDialog: function () {
            MessageBox.error(this._getTextFromI18n("notAllValidInputs"), {
                actions: [MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.CLOSE
            });
        },

        /**
         * Removes messages from the messaging model that have a matching target.
         *
         * @param {string} sTarget - The target binding path of the control.
         * @private
         */

        _removeMessageFromTarget: function (sTarget) {
            Messaging.getMessageModel().getData().forEach(function (oMessage) {
                if (oMessage.target === sTarget) {
                    Messaging.removeMessages(oMessage);
                }
            }.bind(this));
        },

        /**
         * Handles the validation for a required input field.
         *
         * @param {sap.ui.core.Control} oInput - The input control.
         * @private
         */
        _handleRequiredField: function (oInput) {
            const sTarget = oInput.getBindingPath("value");

            this._removeMessageFromTarget(sTarget);
            if (!oInput.getValue()) {
                oInput.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForRequireField"), MessageType.Error,
                    oInput.getLabels()[0].getText(), sTarget, this.getView().getModel("product")
                )
            }
        },

        /**
         * Event handler for the create product button press.
         *
         * @public
         */
        onPressCreateProduct: function () {
            this.oView.byId("formContainerForGeneralPart").getFormElements().forEach((oElement) => {
                if (oElement.getFields()[0] instanceof Input) {
                    this._handleRequiredField(oElement.getFields()[0]);
                } else if (oElement.getFields()[0] instanceof ComboBox) {
                    this.handleChangeComboBox(oElement.getFields()[0]);
                } else {
                    this._handleRequiredField(oElement.getFields()[0]);
                }
            });

            if (!this.getView().getModel("messages").getProperty("/").length) {
                this._toggleEditPage(false);
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
            const oThat = this;

            MessageBox.error(this._getTextFromI18n(
                "deleteProductConfirmMessage",
                [
                    this._getProductModel()
                        .getProperty("/Name")
                ]
            ), {
                title: "Error",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (action) {
                    if (action === MessageBox.Action.DELETE) {
                        oThat._onPressDialogDelete();
                    }
                }
            });
        },

        /**
         * Event handler for the press event on the delete dialog button.
         * Deletes the selected product from the model and navigates to the ProductsOverview route.
         *
         * @private
         */
        _onPressDialogDelete: function () {
            const oProductViewModel = this._getProductModel();

            const oModel = this.getView().getModel();
            const oItems = oModel.getProperty("/Products");
            const iExistingElementIndex = oItems.findIndex(element => element.ID === oProductViewModel.getProperty("/ID"));

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
         * @private
         */
        _onPatternMatchedProduct: function (oEvent) {
            this._toggleEditPage(false);
            this._toggleButtonsAndView(false);
            this._loadProductData();
            this._setProductModel(oEvent);
            this._clearAllMessagesFromMessaging();
        },

        /**
         * Event handler for the product update pattern matched event.
         * @param {sap.ui.base.Event} oEvent - The event object.
         *
         * @private
         */
        _onPatternMatchedProductUpdate: function (oEvent) {
            this._toggleEditPage(true);
            this._toggleButtonsAndView(true);
            this._loadProductData();
            this._setProductModel(oEvent);
            this._clearAllMessagesFromMessaging();
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
        _onPatternMatchedProductCreate: function () {
            this._toggleEditPage(true);
            this._toggleButtonsAndView(true);
            this._loadProductData();
            const oProductModel = this._getProductsItems();
            const oModel = this._getDefaultProductModel(oProductModel.length + 1);
            this.getView().setModel(oModel, "product");
            this._clearAllMessagesFromMessaging();
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
            const oColorNames = oDataProducts.getProperty("/Colors");

            const oProductsModel = new JSONModel({
                categoryNames: oCategoryNames,
                statusNames: oStatusNames,
                supplierNames: oSupplierNames,
                colorNames: oColorNames
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
                "ID": newID
            });
        },

        /**
         * Creates and initializes a Message Popover control by instantiating a fragment and setting it
         * as a dependent of the Message Popover button in the view.
         *
         * @private
         */
        _createMessagePopover: function () {
            const oView = this.getView();

            Fragment.load({
                id: oView.getId(),
                name: "darya.zavaliuk.view.fragments.MessagePopover",
                controller: this
            }).then(function (oPopover) {
                this._oMessagePopover = oPopover;
                oView.byId("messagePopoverBtn").addDependent(this._oMessagePopover);
                this._oMessagePopover.openBy(oView.byId("messagePopoverBtn"));
            }.bind(this));
        },

        /**
         * Event handler for the "press" event on an item in the Message Popover.
         * Extracts information from the item's binding context to determine the target control ID.
         * Closes the Message Popover and sets a timeout to focus on the identified control.
         *
         * @param {sap.ui.base.Event} oEvent - The event object.
         * @public
         */
        onPressItemMessageItem: function (oEvent) {
            const oItem = oEvent.getParameter("item"),
                oMessage = oItem.getBindingContext("messages").getObject();
            const oControl = Element.registry.get(oMessage.getControlId());

            if (oControl) {
                setTimeout(function () {
                    const bIsBehindOtherElement = isBehindOtherElement(oControl.getDomRef());
                    if (bIsBehindOtherElement) {
                        this.close();
                    }
                    if (oControl.isFocusable()) {
                        oControl.focus();
                    }
                }.bind(this), 300);
            }
        },

        /**
         * Event handler for the press event on the control triggering the Message Popover.
         * Creates the Message Popover if it does not exist and toggles its visibility.
         *
         * @param {sap.ui.base.Event} oEvent - The event object.
         * @public
         */
        handleMessagePopoverPress: function (oEvent) {
            if (!this._oMessagePopover) {
                this._createMessagePopover();
                return;
            }

            this._oMessagePopover.toggle(oEvent.getSource());
        },

        /**
         * Adds a message to the messaging model.
         *
         * @param {string} message - The message text.
         * @param {sap.ui.core.ValueState} valueState - The value state of the control.
         * @param {string} additionalText - Additional text for the message.
         * @param {string} target - The target binding path of the control.
         * @param {sap.ui.model.Model} model - The model to which the message belongs.
         * @private
         */
        _addMessageToMessaging: function (message, valueState, additionalText, target, model) {
            Messaging.addMessages(
                new Message({
                    message: message,
                    type: MessageType.Error,
                    additionalText: additionalText,
                    target: target,
                    processor: model
                })
            );
        },

        /**
         * Event handler for the change event of a validated ComboBox control.
         * Handles validation and error messaging for mandatory fields.
         *
         * @param {sap.m.ComboBox} oValidatedComboBox - The validated ComboBox control.
         * @public
         */
        handleChangeComboBox: function (oValidatedComboBox) {
            const sSelectedKey = oValidatedComboBox.getSelectedKey();

            const sTarget = oValidatedComboBox.getBindingPath("value");

            this._removeMessageFromTarget(sTarget);

            if (!oValidatedComboBox.getValue()) {
                oValidatedComboBox.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForRequireField"), MessageType.Error,
                    oValidatedComboBox.getLabels()[0].getText(), sTarget, this.getView().getModel("product"))

                return;
            }

            if (!sSelectedKey) {
                oValidatedComboBox.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForValidSelectedKey"), MessageType.Error,
                    oValidatedComboBox.getLabels()[0].getText(), sTarget, this.getView().getModel("product")
                );
            }
        },

        /**
         * Event handler for the "change" event on a ComboBox. Validates the selected key and value,
         * removes existing error messages associated with the ComboBox, and adds a new error message
         * if the input is invalid. Adjusts the ComboBox's value state and value state text accordingly.
         *
         * @param {sap.ui.base.Event} oEvent - The event object.
         * @public
         */
        onChangeComboBoxValue: function (oEvent) {
            const oValidatedComboBox = oEvent.getSource();
            this.handleChangeComboBox(oValidatedComboBox);
        }
    });
}
);
