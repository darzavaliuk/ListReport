sap.ui.define(
    [
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/m/SearchField",
        "sap/m/MultiInput",
        "sap/m/MultiComboBox",
        "../utils/formatter",
        "sap/m/MessageBox",
        "./ValueHelpController"
    ],
    function (
        Filter,
        FilterOperator,
        BaseController,
        JSONModel,
        SearchField,
        MultiInput,
        MultiComboBox,
        formatter,
        MessageBox,
        ValueHelpController
    ) {
        "use strict";

        const PRODUCT_FIELDS_BINDING = {
            NAME: "Name",
            CATEGORY: "Category/Name",
            STATUS: "Status",
            SUPPLIER: "Supplier/Name",
            PRICE: "Price",
            RATING: "Rating",
            PRODUCTS: "/Products"
        };

        const MULTICOMBOBOX = {
            CATEGORY: "productCategory",
            STATUS: "productStatus",
            SUPPLIER: "productSupplier"
        };

        return BaseController.extend("darya.zavaliuk.controller.ProductsOverview", {
            formatter: formatter,
            ...ValueHelpController,

            /**
             * Lifecycle method called during the initialization of the view.
             * Retrieves necessary controls, registers event handlers, and initializes filter personalization and delete button tracking.
             *
             * @public
             */
            onInit: function () {
                this._oFilterBar = this.getView().byId("filterBarProductOverview");
                this._oTable = this.getView().byId("productsTable");
                this._oPriceInput = this.byId("productsInput");

                this._oFilterBar.registerGetFiltersWithValues(
                    this._getFiltersWithValues.bind(this)
                );
            },

            /**
             * Event handler for the onAfterRendering event of the view.
             * Sets the model for the appView and initializes its properties.
             *
             * @public
             */
            onBeforeRendering: function () {
                this.getView().setModel(new JSONModel({
                    "numberOfItemsToDelete": 0,
                    "filterItems": [],
                    "isVisibleOverlay": false,
                    "statuses": [this._getTextFromI18n("availableStatusText"), this._getTextFromI18n("unavailableStatusText")],
                    "productsCount": 0
                }), "appView");
            },

            /**
             * Handles the "dataReceived" event.
             * Updates the "productsCount" property in the "appView" model with the count value from the event data.
             * @param {sap.ui.base.Event} oEvent The event object
             *
             * @public
             */
            dataReceived: function (oEvent) {
                let sCount = oEvent.getParameter("data").__count;
                this.getView().getModel("appView").setProperty("/productsCount", sCount);
            },

            /**
             * Handles the selection change event of the table.
             * Updates the state model to enable or disable the delete button based on the selected items.
             * @param {sap.ui.base.Event} oControlEvent - The event object.
             *
             * @public
             */
            onSelectionChangeTable: function (oControlEvent) {
                const oStateModel = this.getView().getModel("appView");

                oStateModel.setProperty(
                    "/numberOfItemsToDelete", oControlEvent.getSource().getSelectedItems().length
                );
            },

            /**
             * Event handler for the selection change event.
             * Sets the current variant as modified in VariantManagement and fires the filter change event of the FilterBar.
             *
             * @public
             */
            onSelectionChange: function () {
                this._updateLabelsAndTable();
            },

            /**
             * Updates labels and table based on the current state.
             * Updates the text of expanded and snapped labels with formatted summary text.
             * Sets the overlay visibility of the table to true.
             *
             * @private
             */
            _updateLabelsAndTable: function () {
                this._getSelectedFilters();
                this.getView().getModel("appView").setProperty("/isVisibleOverlay", true);
            },

            /**
             * Retrieves filter group items with values from the FilterBar.
             * Returns an array of filter group items that have values set in their associated controls.
             * @returns {sap.ui.comp.filterbar.FilterGroupItem[]} - Array of filter group items with values.
             *
             * @private
             */
            _getFiltersWithValues: function () {
                return this._oFilterBar.getFilterGroupItems().reduce(
                    function (aResult, oFilterGroupItem) {
                        const oControl = oFilterGroupItem.getControl();

                        if (this._hasValues(oControl)) {
                            aResult.push(oFilterGroupItem);
                        }

                        return aResult;
                    }.bind(this),
                    []
                );
            },

            /**
             * Checks if the given control has values set.
             * Returns true if the control has values, otherwise returns false.
             * @param {sap.ui.core.Control} oControl - The control to check.
             * @returns {boolean} - True if the control has values, false otherwise.
             *
             * @private
             */
            _hasValues: function (oControl) {
                if (oControl instanceof MultiComboBox) {
                    return this._hasSelectedKeys(oControl);
                } else if (oControl instanceof MultiInput) {
                    return this._hasTokens(oControl);
                } else if (oControl instanceof SearchField) {
                    return oControl.getValue().length > 0;
                }

                return false;
            },

            /**
             * Checks if the given control has selected keys.
             * Returns true if the control has selected keys, otherwise returns false.
             * @param {sap.ui.core.Control} oControl - The control to check.
             * @returns {boolean} - True if the control has selected keys, false otherwise.
             *
             * @private
             */
            _hasSelectedKeys: function (oControl) {
                return (
                    oControl.getSelectedKeys &&
                    oControl.getSelectedKeys().length > 0
                );
            },

            /**
             * Checks if the given control has tokens.
             * Returns true if the control has tokens, otherwise returns false.
             * @param {sap.ui.core.Control} oControl - The control to check.
             * @returns {boolean} - True if the control has tokens, false otherwise.
             *
             * @private
             */
            _hasTokens: function (oControl) {
                return (
                    oControl.getTokens && oControl.getTokens().length > 0
                );
            },

            /**
             * Retrieves the names of active filters.
             *
             * @private
             */
            _getSelectedFilters: function () {
                const aFiltersWithValues =
                    this._oFilterBar.retrieveFiltersWithValues();

                this.getView().getModel("appView").setProperty(
                    "/filterItems", aFiltersWithValues
                );
            },

            /**
             * Handles the search event of the filter bar.
             * @param {sap.ui.base.Event} oEvent - The search event object.
             *
             * @public
             */
            onFilterBarSearch: function (oEvent) {
                const sSearchQuery = this._oBasicSearchField.getValue(),
                    aSelectionSet = oEvent.getParameter("selectionSet");

                const aFilters = aSelectionSet.reduce(function (
                    aResult,
                    oControl
                ) {
                    if (oControl.getValue()) {
                        aResult.push(
                            new Filter({
                                path: oControl.getName(),
                                operator: FilterOperator.Contains,
                                value1: oControl.getValue()
                            })
                        );
                    }

                    return aResult;
                }, []);

                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter({
                                path: PRODUCT_FIELDS_BINDING.PRICE,
                                operator: FilterOperator.EQ,
                                value1: sSearchQuery
                            }),
                            new Filter({
                                path: PRODUCT_FIELDS_BINDING.NAME,
                                operator: FilterOperator.Contains,
                                value1: sSearchQuery
                            })
                        ],
                        and: false
                    })
                );

                this._filterTableWithPriceValue(
                    new Filter({
                        filters: aFilters,
                        and: true
                    })
                );
            },

            /**
             * Handles the event when the user presses the button to create a new product.
             * Navigates to the "ProductDetailsNew" route using the application's router.
             *
             * @public
             */
            onPressCreateProduct: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ProductDetailsCreate");
            },

            /**
             * Handles the event when a list item is pressed.
             * Navigates to the "ProductDetails" route with the selected item's ID as a parameter.
             * @param {sap.ui.base.Event} oEvent - The event triggered when a list item is pressed.
             *
             * @public
             */
            onPressListItem: function (oEvent) {
                const oItem = oEvent.getSource();
                const oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("ProductDetails", {
                    id: oItem.getBindingContext().getProperty("ID")
                });
            },

            /**
             * Deletes the selected products from the model and refreshes the binding.
             *
             * @private
             */
            _deleteSelectedProducts: function () {
                const oTable = this._oTable;
                const oBinding = this.getView().getModel();
                const oSelectedItems = oTable.getSelectedItems();

                if (oSelectedItems.length > 0) {
                    const oSelectedIndices = oTable.getSelectedContexts().map((oItem) => oItem.getProperty("ID"));

                    oSelectedIndices.forEach((iSelectedIndex) => {
                        oBinding
                            .getProperty(
                                PRODUCT_FIELDS_BINDING.PRODUCTS
                            )
                            .forEach((oProduct, i) => {
                                if (oProduct.ID == iSelectedIndex) {
                                    oBinding
                                        .getProperty(
                                            PRODUCT_FIELDS_BINDING.PRODUCTS
                                        )
                                        .splice(i, 1);
                                }
                            });
                    });

                    oBinding.refresh();
                    oTable.removeSelections(true);
                }
            },

            /**
             * Initiates the product deletion process by displaying a confirmation dialog.
             * If the user confirms the deletion, the selected products are removed.
             *
             * @public
             */
            onPressDeleteProducts: function () {
                const oSelectedItems = this._oTable.getSelectedItems();
                const iItemsNumber = oSelectedItems.length;
                const sConfirmMessage = this._buildConfirmationText(oSelectedItems, iItemsNumber);

                const oThat = this;
                MessageBox.error(sConfirmMessage, {
                    title: this._getTextFromI18n("messageBoxTitleWithErrorState"),
                    actions: [MessageBox.Action.DELETE, MessageBox.Action.CLOSE],
                    emphasizedAction: MessageBox.Action.DELETE,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.DELETE) {
                            oThat._onPressDialogDelete();
                        }
                    }
                });
            },

            /**
             * Event handler for the onPress event of the delete button in the dialog.
             * Calls the _deleteSelectedProducts function to delete the selected products.
             *
             * @private
             */
            _onPressDialogDelete: function () {
                this._deleteSelectedProducts();
            },

            /**
             * Constructs the confirmation text based on the selected items and the number of items.
             * @param {Array} aSelectedItems - The array of selected items.
             * @param {number} iItemsNumber - The number of selected items.
             * @returns {string} The confirmation text.
             *
             * @private
             */
            _buildConfirmationText: function (aSelectedItems, iItemsNumber) {
                const sSingleDeleteText = this._getTextFromI18n(
                    "deleteProductConfirmMessage",
                    [
                        aSelectedItems[0]
                            .getBindingContext()
                            .getProperty("Name")
                    ]
                );
                const sMultiDeleteText = this._getTextFromI18n(
                    "deleteProductsConfirmMessage",
                    [iItemsNumber]
                );

                return iItemsNumber === 1 ? sSingleDeleteText : sMultiDeleteText;
            },

            /**
             * Applies filters to the table based on category, search input, and general input filters.
             *
             * @public
             */
            onPressConfirmFilters: function () {
                const oCategoryFilter =
                    this._getCategoryMultiComboboxFilters(
                        MULTICOMBOBOX.CATEGORY,
                        PRODUCT_FIELDS_BINDING.CATEGORY
                    );
                const oStatusFilter = this._getCategoryMultiComboboxFiltersStatus(
                    MULTICOMBOBOX.STATUS
                );
                const oSupplierFilter =
                    this._getCategoryMultiComboboxFilters(
                        MULTICOMBOBOX.SUPPLIER,
                        PRODUCT_FIELDS_BINDING.SUPPLIER
                    );
                const oSearchInputFilter = this._getSearchInputFilters();
                const oInputFilter = this._getInputFilters();

                const aFilters = [
                    oCategoryFilter,
                    oStatusFilter,
                    oSupplierFilter,
                    oSearchInputFilter,
                    oInputFilter
                ]
                    .filter((oFilter) => oFilter !== undefined)
                    .map((oFilter) => new Filter(oFilter));

                const oBinding = this._oTable.getBinding("items");

                oBinding.filter(
                    new Filter({
                        filters: aFilters,
                        and: true
                    })
                );

                this._updateLabelsAndTable();
                this.getView().getModel("appView").setProperty("/isVisibleOverlay", false);
            },

            /**
             * Generates filters based on the selected values from the Category MultiComboBox.
             * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no values are selected.
             *
             * @private
             */
            _getCategoryMultiComboboxFilters: function (
                sFieldId,
                sFieldBinding
            ) {
                const oMultiComboBox = this.byId(sFieldId);
                const aSelectedValues = oMultiComboBox
                    .getSelectedItems()
                    .map((oItem) => oItem.getProperty("text"));

                if (!aSelectedValues.length) {
                    return;
                }

                return aSelectedValues.map(
                    (sValue) =>
                        new Filter(
                            sFieldBinding,
                            FilterOperator.Contains,
                            sValue
                        )
                );
            },

            /**
             * Generates filters based on the selected values from the Status MultiComboBox.
             * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no values are selected.
             *
             * @private
             */
            _getCategoryMultiComboboxFiltersStatus: function (
                sFieldId
            ) {
                const oMultiComboBox = this.byId(sFieldId);
                const aSelectedValues = oMultiComboBox
                    .getSelectedItems()
                    .map((oItem) => oItem.getProperty("text"));

                if (!aSelectedValues.length) {
                    return;
                }

                return aSelectedValues.map(
                    (sValue) =>
                        (sValue === this._getTextFromI18n("availableStatusText")) ?
                            new Filter(
                                "DiscontinuedDate",
                                FilterOperator.EQ,
                                null
                            ) : new Filter(
                                "DiscontinuedDate",
                                FilterOperator.LE,
                                new Date().toISOString()
                            )
                );
            },

            /**
             * Generates filters based on the input value from the products input field.
             * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no query is present.
             *
             * @private
             */
            _getInputFilters: function () {
                const oMultiInput = this._oPriceInput;
                const aSelectedTokens = oMultiInput.getTokens();

                const aItemsWithOperator = [];
                const aItemsWithoutOperator = [];

                aSelectedTokens.forEach((oToken) => {
                    const oValue = oToken
                        .getCustomData()[0]
                        .getProperty("value");
                    if (oValue.operation !== undefined) {
                        aItemsWithOperator.push(oValue);
                    } else {
                        aItemsWithoutOperator.push(oToken.getText());
                    }
                });

                if (
                    !aItemsWithOperator.length &&
                    !aItemsWithoutOperator.length
                ) {
                    return;
                }

                const aFiltersForItemsWithOperator = aItemsWithOperator.map(
                    (sSelectedItem) => {
                        return new Filter(
                            PRODUCT_FIELDS_BINDING.PRICE,
                            FilterOperator[sSelectedItem.operation],
                            Number(sSelectedItem.value1),
                            Number(sSelectedItem.value2)
                        );
                    }
                );

                const aFiltersForItemsWithoutOperator =
                    aItemsWithoutOperator.map((sOtherItem) => {
                        return new Filter(
                            PRODUCT_FIELDS_BINDING.PRICE,
                            FilterOperator.EQ,
                            Number(sOtherItem)
                        );
                    });

                return new Filter({
                    filters: [
                        ...aFiltersForItemsWithOperator,
                        ...aFiltersForItemsWithoutOperator
                    ],
                    and: false
                });
            },

            /**
             * Generates filters based on the search value from the search input field.
             * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no query is present.
             *
             * @private
             */
            _getSearchInputFilters: function () {
                const sQuery = this.byId("searchField").getValue();

                if (sQuery && sQuery.length > 0) {
                    const aCommonFiltersForString = [
                        new Filter(
                            PRODUCT_FIELDS_BINDING.NAME,
                            FilterOperator.Contains,
                            sQuery
                        ),
                        new Filter(
                            PRODUCT_FIELDS_BINDING.CATEGORY,
                            FilterOperator.Contains,
                            sQuery
                        ),
                        new Filter(
                            PRODUCT_FIELDS_BINDING.SUPPLIER,
                            FilterOperator.Contains,
                            sQuery
                        )
                    ];

                    const aCommonFiltersForNumber = [
                        ...aCommonFiltersForString,
                        new Filter(
                            PRODUCT_FIELDS_BINDING.RATING,
                            FilterOperator.EQ,
                            sQuery
                        ),
                        new Filter(
                            PRODUCT_FIELDS_BINDING.PRICE,
                            FilterOperator.EQ,
                            sQuery
                        )
                    ];

                    return parseInt(sQuery)
                        ? aCommonFiltersForNumber
                        : aCommonFiltersForString;
                }
            }
        }
        );
    }
);
