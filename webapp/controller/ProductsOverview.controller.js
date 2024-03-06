sap.ui.define(
    [
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/m/SearchField",
        "sap/ui/model/type/String",
        "sap/m/Column",
        "sap/m/Label",
        "sap/m/ColumnListItem",
        "sap/ui/table/Column",
        "sap/m/Text",
        "sap/m/MultiInput",
        "sap/m/MultiComboBox",
        "../utils/formatter",
        "sap/m/MessageBox"
    ],
    function (
        Filter,
        FilterOperator,
        BaseController,
        JSONModel,
        SearchField,
        TypeString,
        MColumn,
        Label,
        ColumnListItem,
        UIColumn,
        Text,
        MultiInput,
        MultiComboBox,
        formatter,
        MessageBox
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
            CATEGORY: "Category",
            STATUS: "Status",
            SUPPLIER: "Supplier"
        };

        return BaseController.extend(
            "darya.zavaliuk.controller.ProductsOverview",
            {
                formatter: formatter,

                /**
                 * Lifecycle method called during the initialization of the view.
                 * Retrieves necessary controls, registers event handlers, and initializes filter personalization and delete button tracking.
                 *
                 * @public
                 */
                onInit: function () {
                    this._oFilterBar = this.getView().byId("filterBarProductOverview");
                    this._oTable = this.getView().byId("productsTable");
                    this._oWhiteSpacesInput = this.byId("productsInput");

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
                onAfterRendering: function () {
                    this.getView().setModel(new JSONModel({
                        "numberOfItemsToDelete": 0,
                        "filterText": this._getTextFromI18n("zeroFilters"),
                        "filterItems": [],
                        "isVisibleOverlay": false
                    }), "appView");
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
                 * Event handler for the "OK" press of the dialog.
                 * Replaces whitespace tokens with corresponding characters and sets the tokens to the input control.
                 * Closes the whitespace dialog.
                 * @param {sap.ui.base.Event} oEvent - The event object.
                 *
                 * @public
                 */
                onDialogOkPress: function (oEvent) {
                    const aTokens = oEvent.getParameter("tokens");

                    aTokens.forEach(
                        function (oToken) {
                            oToken.setText(
                                this.formatter.replaceDoubleWhitespaceWithUnicodeSpace(
                                    oToken.getText()
                                )
                            );
                        }.bind(this)
                    );

                    this._oWhiteSpacesInput.setTokens(aTokens);
                    this.oWhitespaceDialog.close();
                    this._updateLabelsAndTable();
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
                 * Event handler called after a variant is loaded.
                 * Updates labels and table based on the loaded variant.
                 *
                 * @public
                 */
                onAfterVariantLoad: function () {
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
                    )
                },

                /**
                 * Filters the table in the value help dialog using the given filter.
                 * @param {sap.ui.model.Filter} oFilter - The filter to apply to the table.
                 *
                 * @private
                 */
                _filterTableWhitespace: function (oFilter) {
                    const oValueHelpDialog = this.oWhitespaceDialog;

                    oValueHelpDialog.getTableAsync().then(function (oTable) {
                        if (oTable.bindRows) {
                            oTable.getBinding("rows").filter(oFilter);
                        }
                        if (oTable.bindItems) {
                            oTable.getBinding("items").filter(oFilter);
                        }
                        oValueHelpDialog.update();
                    });
                },

                /**
                 * Handles the search event of the filter bar in the whitespaces.
                 * @param {sap.ui.base.Event} oEvent - The search event object.
                 *
                 * @public
                 */
                onFilterBarWhitespacesSearch: function (oEvent) {
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

                    this._filterTableWhitespace(
                        new Filter({
                            filters: aFilters,
                            and: true
                        })
                    );
                },

                /**
                 * Handles the value help request event.
                 * @param {sap.ui.base.Event} oEvent - The value help request event object.
                 *
                 * @public
                 */
                onValueHelpRequest: function () {
                    this._initializeBasicSearchField();

                    this.pWhitespaceDialog = this.loadFragment({
                        name: "darya.zavaliuk.view.fragments.ValueHelpDialog"
                    }).then(
                        function (oWhitespaceDialog) {
                            this._configureWhitespaceDialog(oWhitespaceDialog);

                            oWhitespaceDialog.setTokens(
                                this._oWhiteSpacesInput.getTokens()
                            );
                            oWhitespaceDialog.open();
                        }.bind(this)
                    );
                },

                /**
                 * Initializes the basic search field.
                 *
                 * @private
                 */
                _initializeBasicSearchField: function () {
                    this._oBasicSearchField = new SearchField({
                        search: function () {
                            this.oWhitespaceDialog.getFilterBar().search();
                        }.bind(this)
                    });
                },

                /**
                 * Configures the whitespace dialog.
                 * @param {sap.m.Dialog} oWhitespaceDialog - The whitespace dialog to configure.
                 *
                 * @private
                 */
                _configureWhitespaceDialog: function (oWhitespaceDialog) {
                    const oFilterBar = oWhitespaceDialog.getFilterBar();

                    this.oWhitespaceDialog = oWhitespaceDialog;
                    this.getView().addDependent(oWhitespaceDialog);

                    oWhitespaceDialog.setRangeKeyFields([
                        {
                            label: this._getTextFromI18n(
                                "productsOverviewInputPrice"
                            ),
                            key: "Price",
                            type: "string",
                            typeInstance: new TypeString(
                                {},
                                {
                                    maxLength: 7
                                }
                            )
                        }
                    ]);

                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(this._oBasicSearchField);

                    this._configureTableInWhitespaceDialog(oWhitespaceDialog);
                },

                /**
                 * Configures the table in the whitespace dialog.
                 * @param {sap.m.Dialog} oWhitespaceDialog - The whitespace dialog containing the table.
                 *
                 * @private
                 */
                _configureTableInWhitespaceDialog: function (
                    oWhitespaceDialog
                ) {
                    oWhitespaceDialog.getTableAsync().then(
                        function (oTable) {
                            oTable.setModel(this.oModel);

                            if (oTable.bindRows) {
                                this._configureUIColumnsForTable(oTable);
                                oTable.bindAggregation("rows", {
                                    path: PRODUCT_FIELDS_BINDING.PRODUCTS,
                                    events: {
                                        dataReceived: function () {
                                            oWhitespaceDialog.update();
                                        }
                                    }
                                });
                            }

                            if (oTable.bindItems) {
                                this._configureMColumnsForTable(oTable);
                                oTable.bindItems({
                                    path: PRODUCT_FIELDS_BINDING.PRODUCTS,
                                    template: new ColumnListItem({
                                        cells: [
                                            new Label({ text: "{Price}" }),
                                            new Label({ text: "{Name}" })
                                        ]
                                    }),
                                    events: {
                                        dataReceived: function () {
                                            oWhitespaceDialog.update();
                                        }
                                    }
                                });
                            }

                            oWhitespaceDialog.update();
                        }.bind(this)
                    );
                },

                /**
                 * Configures UI columns for the table.
                 *
                 * @param {sap.ui.table.Table} oTable - The table to configure the columns for.
                 * @private
                 */
                _configureUIColumnsForTable: function (oTable) {
                    const oColumnPrice = new UIColumn({
                        label: new Label({
                            text: this._getTextFromI18n(
                                "productsOverviewColumnPrice"
                            )
                        }),
                        template: new Text({
                            wrapping: false,
                            text: "{Price}"
                        })
                    });

                    oColumnPrice.data({ fieldName: "Price" });
                    oTable.addColumn(oColumnPrice);

                    const oColumnName = new UIColumn({
                        label: new Label({
                            text: this._getTextFromI18n(
                                "productsOverviewInputName"
                            )
                        }),
                        template: new Text({ wrapping: false, text: "{Name}" })
                    });

                    oColumnName.data({ fieldName: "Name" });
                    oTable.addColumn(oColumnName);
                },

                /**
                 * Configures columns for the table.
                 *
                 * @param {sap.m.Table} oTable - The table to configure the columns for.
                 * @private
                 */
                _configureMColumnsForTable: function (oTable) {
                    oTable.addColumn(
                        new MColumn({
                            header: new Label({
                                text: this._getTextFromI18n(
                                    "productsOverviewInputPrice"
                                )
                            })
                        })
                    );
                    oTable.addColumn(
                        new MColumn({
                            header: new Label({
                                text: this._getTextFromI18n(
                                    "productsOverviewInputName"
                                )
                            })
                        })
                    );
                },

                /**
                 * Handles the press event of the cancel button in the whitespace dialog.
                 * Closes the whitespace dialog.
                 *
                 * @public
                 */
                onWhitespaceCancelPress: function () {
                    this.oWhitespaceDialog.close();
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
                 *
                 * @param {sap.ui.base.Event} oEvent - The event triggered when a list item is pressed.
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
                        const oSelectedIndices = oSelectedItems.map((oItem) =>
                            oItem
                                .getBindingContext()
                                .getPath()
                                .split("/")
                                .pop()
                        );

                        oSelectedIndices.forEach((iIndex, i) => {
                            if (
                                iIndex >= 0 &&
                                iIndex <
                                oBinding.getProperty(
                                    PRODUCT_FIELDS_BINDING.PRODUCTS
                                ).length
                            ) {
                                oBinding
                                    .getProperty(
                                        PRODUCT_FIELDS_BINDING.PRODUCTS
                                    )
                                    .splice(iIndex - i, 1);
                            }
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
                 * @param {Array} oSelectedItems - The array of selected items.
                 * @param {number} iItemsNumber - The number of selected items.
                 * @returns {string} The confirmation text.
                 *
                 * @private
                 */
                _buildConfirmationText: function (oSelectedItems, iItemsNumber) {
                    const sSingleDeleteText = this._getTextFromI18n(
                        "deleteProductConfirmMessage",
                        [
                            oSelectedItems[0]
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
                    const oStatusFilter = this._getCategoryMultiComboboxFilters(
                        MULTICOMBOBOX.STATUS,
                        PRODUCT_FIELDS_BINDING.STATUS
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
                 *
                 * @private
                 * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no values are selected.
                 */
                _getCategoryMultiComboboxFilters: function (
                    sFieldId,
                    sFieldBinding
                ) {
                    const oMultiComboBox = this.byId(sFieldId);
                    const aSelectedValues = oMultiComboBox
                        .getSelectedItems()
                        .map((oItem) => oItem.getProperty("text"));

                    if (aSelectedValues.length === 0) {
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
                 * Generates filters based on the input value from the products input field.
                 *
                 * @private
                 * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no query is present.
                 */
                _getInputFilters: function () {
                    const oMultiInput = this._oWhiteSpacesInput;
                    const aSelectedTokens = oMultiInput.getTokens();

                    const aItemsWithOperator = [];
                    const aItemsWithoutOperator = [];

                    aSelectedTokens.forEach((oToken) => {
                        const value = oToken
                            .getCustomData()[0]
                            .getProperty("value");
                        if (value.operation !== undefined) {
                            aItemsWithOperator.push(value);
                        } else {
                            aItemsWithoutOperator.push(oToken.getText());
                        }
                    });

                    if (
                        aItemsWithOperator.length === 0 &&
                        aItemsWithoutOperator.length === 0
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
                 *
                 * @private
                 * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no query is present.
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
