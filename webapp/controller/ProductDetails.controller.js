sap.ui.define([
    "sap/ui/core/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/Messaging",
    "./BaseController",
    "sap/ui/core/message/Message",
    "../utils/formatter",
    "sap/ui/core/Element",
    "sap/ui/dom/isBehindOtherElement",
    "sap/m/MessageBox",
    "sap/m/Input",
    "sap/m/ComboBox"
], function (coreLibrary, JSONModel, Fragment, Messaging,
    BaseController, Message, formatter, Element,
    isBehindOtherElement, MessageBox, Input, ComboBox) {
    "use strict";

    const ValueState = coreLibrary.ValueState;
    const MessageType = coreLibrary.MessageType;

    const FRAGMENT_STATE = {
        EDIT: "Edit",
        DISPLAY: "Display"
    };

    const DEFAULT_VALUES = {
        NAME: "Default name",
        DESCRIPTION: "Default description"
    };

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

            this._registerMessaging();
            this._setupModels();

            oRouter.getRoute("ProductDetailsUpdate").attachPatternMatched(this._onPatternMatchedProductUpdate, this);
            oRouter.getRoute("ProductDetails").attachPatternMatched(this._onPatternMatchedProduct, this);
            oRouter.getRoute("ProductDetailsCreate").attachPatternMatched(this._onPatternMatchedProductCreate, this);
        },

        /**
         * Registers an object for messaging.
         *
         * @private
         */
        _registerMessaging: function () {
            Messaging.registerObject(this.getView(), true);
        },

        /**
         * Sets up the models for the view.
         * "messages" model is set using Messaging.getMessageModel().
         * "state" model is set using a new instance of JSONModel.
         *
         * @private
         */
        _setupModels: function () {
            this.getView().setModel(new JSONModel({
                "state": {
                    "isEditPage": false,
                    "isCreatePage": false
                },
                "product": {}
            }
            ), "appView");
            this.getView().setModel(Messaging.getMessageModel(), "messages");
        },

        /**
         * Event handler for the cancel button press.
         * Sets the 'isEditPage' property of the 'state' model to false and navigates back to the ProductsOverview page.
         *
         * @public
         */
        onPressCancel: function () {
            const oThat = this;

            MessageBox.warning(this._getTextFromI18n("messageForClosePage"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        oThat._onPressOkMessageBoxError();
                    }
                }
            });
        },

        /**
         * Toggles the edit mode for the page.
         * @param {boolean} bIsEdit - Indicates whether the page is in edit mode or not.
         *
         * @private
         */
        _toggleEditPage: function (bIsEdit) {
            this.getView().getModel("appView").setProperty("/state/isEditPage", bIsEdit);
        },

        /**
         * Toggles the create mode for the page.
         * @param {boolean} bIsEdit - Indicates whether the page is in create mode or not.
         *
         * @private
         */
        _toggleCreatePage: function (bIsEdit) {
            this.getView().getModel("appView").setProperty("/state/isCreatePage", bIsEdit);
        },

        /**
         * Retrieves the array of product items from the model.
         * @returns {Object[]} An array of product items.
         *
         * @private
         */
        _getProductsItems: function () {
            const oModel = this.getView().getModel();
            return oModel.getProperty("/Products");
        },

        /**
         * Retrieves the "product" model for the view.
         * @returns {sap.ui.model.JSONModel} The "product" model.
         *
         * @private
         */
        _getProductModel: function () {
            return this.getView().getModel("appView").getProperty("/product");
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

            if (this.getView().getModel("appView").getProperty("/state/isCreatePage")) {
                this.getOwnerComponent().getRouter()
                    .navTo("ProductsOverview", {}, true);
                this._toggleCreatePage(false);
                return;
            }

            this.getOwnerComponent().getRouter()
                .navTo("ProductDetails", { id: this.getView().getModel("appView").getProperty("/product/ID") }, true);
        },

        /**
         * Toggles the buttons and view based on the edit mode.
         * Shows the corresponding form fragment.
         * @param {boolean} bEdit - Indicates whether the page is in edit mode or not.
         *
         * @private
         */
        _toggleButtonsAndView: function (bEdit) {
            this._showFormFragment(bEdit ? FRAGMENT_STATE.EDIT : FRAGMENT_STATE.DISPLAY);
        },

        /**
         * Shows the specified form fragment in the page.
         * Removes all existing form elements and inserts the form elements from the fragment.
         * @param {string} sFragmentName - The name of the form fragment to show.
         *
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
         * @param {sap.ui.base.Event} oEvent - The input change event object.
         *
         * @public
         */
        onInputValueChange: function (oEvent) {
            this._handleRequiredField(oEvent.getSource());
        },

        /**
         * Retrieves the specified form fragment.
         * If the fragment has not been loaded before, it is loaded and stored in the _formFragments cache.
         * @param {string} sFragmentName - The name of the form fragment to retrieve.
         * @returns {Promise} A promise that resolves to the form fragment.
         *
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
         * Extracts the product ID from the binding context path.
         * @returns {string} The extracted product ID if found, otherwise undefined.
         *
         * @private
         */
        _getProductID: function (oEvent) {
            const sPath = oEvent.getSource().getBindingContext().getPath();
            const reProductID = /\/Products\((\d+)\)/;
            const oMatch = sPath.match(reProductID);

            if (oMatch) {
                return oMatch[1];
            }
        },

        /**
         * Event handler for the edit product button press.
         * Sets the 'isEditPage' property of the 'state' model to false, retrieves the ID of the product from the 'product' model,
         * and navigates to the ProductDetailsUpdate page with the product ID and edit flag.
         *
         * @public
         */
        onPressEditProduct: function (oEvent) {
            this._toggleEditPage(false);
            const sProductID = this._getProductID(oEvent);

            this.getOwnerComponent().getRouter()
                .navTo("ProductDetailsUpdate", { id: sProductID, edit: true }, true);
        },

        /**
         * Updates the product details in the model and navigates to the ProductDetails page.
         *
         * @private
         */
        _updateProductDetails: function (sID) {
            this._toggleEditPage(true);
            this.getOwnerComponent().getRouter().navTo("ProductDetails", { id: sID }, true);
        },

        /**
         * Displays an error dialog with a predefined message.
         *
         * @private
         */
        _showErrorDialog: function () {
            MessageBox.error(this._getTextFromI18n("messageForInvalidInputs"), {
                actions: [MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.CLOSE
            });
        },

        /**
         * Removes messages from the messaging model that have a matching target.
         * @param {string} sTarget - The target binding path of the control.
         *
         * @private
         */
        _removeMessageFromTarget: function (sTarget) {
            Messaging.getMessageModel().getData().forEach(function (oMessage) {
                if (oMessage.target == sTarget) {
                    Messaging.removeMessages(oMessage);
                }
            }.bind(this));
        },

        /**
         * Handles the validation for a required input field.
         * @param {sap.m.Input} oInput - The input control.
         *
         * @private
         */
        _handleRequiredField: function (oInput) {
            const sTarget = oInput.getBindingPath("value");

            this._removeMessageFromTarget(sTarget);
            if (!oInput.getValue()) {
                this._removeMessageFromTarget(oInput.sId + "/value");
                oInput.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForRequireField"), MessageType.Error,
                    oInput.getLabels()[0].getText(), sTarget, this.getView().getModel("appView")
                );
            }
        },

        /**
         * Saves product as new in the model.
         *
         * @private
         */
        _createProduct: function () {
            const oThat = this;
            const oODataModel = this.getView().getModel();
            const oAppViewModel = this.getView().getModel("appView");
            const oProductModel = JSON.parse(JSON.stringify(oAppViewModel.getProperty("/product")));
            delete oProductModel.Category;
            delete oProductModel.Supplier;

            oODataModel.create("/Products", { ...oProductModel },
                {
                    headers: {
                        "Content-ID": Number(Date.now().toString().slice(-4))
                    },
                    success: function () {
                        Promise.all([oODataModel.update(`/Products(${oAppViewModel.getProperty("/product/ID")})/$links/Supplier`, {
                            uri: `/Suppliers(${oAppViewModel.getProperty("/product/Supplier/ID")})`
                        }, {
                            headers: {
                                "Content-ID": Number(Date.now().toString().slice(-4)) + 1
                            }
                        }),

                        oODataModel.update(`/Products(${oAppViewModel.getProperty("/product/ID")})/$links/Category`, {
                            uri: `/Categories(${oAppViewModel.getProperty("/product/Category/ID")})`
                        }, {
                            headers: {
                                "Content-ID": Number(Date.now().toString().slice(-4)) + 2
                            }
                        }),

                        oODataModel.refresh()
                        ]).then(() => {
                            oThat._toggleEditPage(false);
                            oThat._updateProductDetails(oThat.getView().getModel("appView").getProperty("/product/ID"));
                        });
                    }
                }
            );

            this._toggleCreatePage(false);
        },

        /**
         * Update product in the model.
         *
         * @private
         */
        _updateProduct: function () {
            const oThat = this;
            const oODataModel = this.getView().getModel();
            const oAppViewModel = this.getView().getModel("appView");

            const oProductModel = JSON.parse(JSON.stringify(oAppViewModel.getProperty("/product")));
            delete oProductModel.Category;
            delete oProductModel.Supplier;

            oODataModel.update(`/Products(${oProductModel.ID})`, { ...oProductModel },
                {
                    headers: {
                        "Content-ID": Number(Date.now().toString().slice(-4))
                    },
                    success: function () {
                        Promise.all([
                            oODataModel.update(`/Products(${oAppViewModel.getProperty("/product/ID")})/$links/Supplier`, {
                                uri: `/Suppliers(${oAppViewModel.getProperty("/product/Supplier/ID")})`
                            }, {
                                headers: {
                                    "Content-ID": Number(Date.now().toString().slice(-4)) + 1
                                }
                            }),

                            oODataModel.update(`/Products(${oAppViewModel.getProperty("/product/ID")})/$links/Category`, {
                                uri: `/Categories(${oAppViewModel.getProperty("/product/Category/ID")})`
                            }, {
                                headers: {
                                    "Content-ID": Number(Date.now().toString().slice(-4)) + 2
                                }
                            }),

                            oODataModel.refresh()
                        ]).then(() => {
                            oThat._toggleEditPage(false);
                            oThat._updateProductDetails(oThat.getView().getModel("appView").getProperty("/product/ID"));
                        });
                    }
                }
            );
        },

        /**
         * Saves product in model
         *
         * @private
         */
        _saveProductInModel: function () {
            this.getView().getModel("appView").getProperty("/state/isCreatePage") ? this._createProduct() : this._updateProduct();
        },

        /**
         * Checks the values in the general form and handles required fields.
         * This function iterates over the form elements in the general form and performs the necessary checks
         * based on the type of field present in each form element.
         *
         * @private
         */
        _checkValuesInGeneralForm: function () {
            this.oView.byId("formContainerForGeneralPart").getFormElements().forEach((oElement) => {
                if (oElement.getFields()[0] instanceof Input) {
                    this._handleRequiredField(oElement.getFields()[0]);
                } else if (oElement.getFields()[0] instanceof ComboBox) {
                    this.handleChangeComboBox(oElement.getFields()[0]);
                } else {
                    if (oElement.getFields()[0].getRequired())
                        this._handleRequiredField(oElement.getFields()[0]);
                }
            });
        },

        /**
         * Event handler for the create product button press.
         *
         * @public
         */
        onPressCreateProduct: function (oEvent) {
            this._checkValuesInGeneralForm();

            if (!this.getView().getModel("messages").getProperty("/").length) {
                this._saveProductInModel();
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
        onPressDeleteProduct: function (oEvent) {
            const oThat = this;
            const oBindingContext = oEvent.getSource().getBindingContext();

            MessageBox.error(this._getTextFromI18n(
                "deleteProductConfirmMessage",
                [
                    oBindingContext.getObject().Name
                ]
            ), {
                title: this._getTextFromI18n("messageBoxTitleWithErrorState"),
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CLOSE],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.DELETE) {
                        oThat._onPressDialogDelete(oEvent);
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
        _onPressDialogDelete: function (oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            const oODataModel = oBindingContext.getModel();
            const sKey = oODataModel.createKey("/Products", oBindingContext.getObject());

            oODataModel.remove(sKey, {
                headers: {
                    "Content-ID": Number(Date.now().toString().slice(-4))
                },
                error: function () {
                    this._getTextFromI18n("messageForErrorWhileDeleting");
                }
            });

            this.getOwnerComponent().getRouter()
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
            this._toggleCreatePage(false);
            this._toggleButtonsAndView(false);
            this._setProductModel(oEvent);
            this._clearAllMessagesFromMessaging();
        },

        /**
         * Reads product data from the OData service.
         * @param {Object} mRouteArguments - The route arguments containing the product ID.
         *
         * @private
         */
        _readProductFromModel: function (mRouteArguments) {
            const oODataModel = this.getView().getModel();
            const pThis = this;
            const sProductID = mRouteArguments.id;

            oODataModel.read(`/Products(${sProductID})`, {
                urlParameters: {
                    "$expand": "Supplier,Category"
                },
                success: function (oData) {
                    pThis.getView().getModel("appView").setProperty("/product", oData);
                },
                error: function () {
                    this._getTextFromI18n("messageForErrorWhileReading");
                }
            });
        },

        /**
         * Event handler for the product update pattern matched event.
         * @param {sap.ui.base.Event} oEvent - The event object.
         *
         * @private
         */
        _onPatternMatchedProductUpdate: function (oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");

            this._toggleEditPage(true);
            this._toggleButtonsAndView(true);
            this._readProductFromModel(mRouteArguments);
            this._setProductModel(oEvent);
            this._clearAllMessagesFromMessaging();
        },

        /**
         * Event handler for the "patternMatched" event on the product creation page.
         * Sets the state to indicate that the page is in create mode, resets the form,
         * loads product data, and sets up the default product model.
         *
         * @private
         */
        _onPatternMatchedProductCreate: function () {
            this._toggleEditPage(true);
            this._toggleButtonsAndView(true);

            const oModel = this._getDefaultProductModel(Date.now().toString().slice(-4));
            this.getView().getModel("appView").setProperty("/product", oModel);

            this._toggleCreatePage(true);
            this._clearAllMessagesFromMessaging();
        },

        /**
         * Sets up a new OData model for a specific product using data from the main model.
         * @param {sap.ui.base.Event} oEvent - The event object containing route arguments.
         *
         * @private
         */
        _setProductModel: function (oEvent) {
            const pThis = this;
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductID = mRouteArguments.id;
            const oODataModel = this.getView().getModel();

            oODataModel.metadataLoaded().then(function () {
                const sKey = oODataModel.createKey("/Products", { ID: sProductID });

                pThis.getView().bindObject({
                    path: sKey,
                    parameters: {
                        expand: "Supplier,Category"
                    }
                });
            });
        },

        /**
         * Creates a new JSON model with default values for a product.
         * @param {integer} iNewID - The new ID for the product.
         * @returns {sap.ui.model.json.JSONModel} - The JSON model with default product values.
         *
         * @private
         */
        _getDefaultProductModel: function (iNewID) {
            return {
                "ID": iNewID,
                "Name": DEFAULT_VALUES.NAME,
                "Description": DEFAULT_VALUES.DESCRIPTION,
                "Category": {},
                "Supplier": {}
            };
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
         * @param {sap.ui.base.Event} oEvent - The event object.
         *
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
         * @param {sap.ui.base.Event} oEvent - The event object.
         *
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
         * @param {string} sMessage - The message text.
         * @param {sap.ui.core.ValueState} sValueState - The value state of the control.
         * @param {string} sAdditionalText - Additional text for the message.
         * @param {string} sTarget - The target binding path of the control.
         * @param {sap.ui.model.Model} oModel - The model to which the message belongs.
         *
         * @private
         */
        _addMessageToMessaging: function (sMessage, sValueState, sAdditionalText, sTarget, oModel) {
            Messaging.addMessages(
                new Message({
                    message: sMessage,
                    type: sValueState,
                    additionalText: sAdditionalText,
                    target: sTarget,
                    processor: oModel
                })
            );
        },

        /**
         * Event handler for the change event of a validated ComboBox control.
         * Handles validation and error messaging for mandatory fields.
         * @param {sap.m.ComboBox} oValidatedComboBox - The validated ComboBox control.
         *
         * @public
         */
        handleChangeComboBox: function (oValidatedComboBox) {
            const sSelectedKey = oValidatedComboBox.getSelectedKey();

            const sTarget = oValidatedComboBox.getBindingPath("value");

            this._removeMessageFromTarget(sTarget);

            if (!oValidatedComboBox.getValue()) {
                oValidatedComboBox.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForRequireField"), MessageType.Error,
                    oValidatedComboBox.getLabels()[0].getText(), sTarget, this.getView().getModel("appView"));

                return;
            }

            if (!sSelectedKey) {
                oValidatedComboBox.setValueState(ValueState.Error);
                this._addMessageToMessaging(this._getTextFromI18n("messageForValidSelectedKey"), MessageType.Error,
                    oValidatedComboBox.getLabels()[0].getText(), sTarget, this.getView().getModel("appView")
                );
            }
        },

        /**
         * Event handler for the "change" event on a ComboBox. Validates the selected key and value,
         * removes existing error messages associated with the ComboBox, and adds a new error message
         * if the input is invalid. Adjusts the ComboBox's value state and value state text accordingly.
         * @param {sap.ui.base.Event} oEvent - The event object.
         *
         * @public
         */
        onChangeComboBoxValue: function (oEvent) {
            const oValidatedComboBox = oEvent.getSource();
            this.handleChangeComboBox(oValidatedComboBox);
        }
    });
});
