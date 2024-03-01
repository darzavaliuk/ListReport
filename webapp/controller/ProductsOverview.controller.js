sap.ui.define(
    [
        "sap/m/MessageBox",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/core/Fragment",
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/ui/comp/smartvariants/PersonalizableInfo",
        "sap/m/SearchField",
        "sap/ui/model/type/String",
        "sap/m/Column",
        "sap/m/Label",
        "sap/m/ColumnListItem",
        "sap/ui/comp/library",
        "sap/m/Token",
        "sap/ui/table/Column",
        "sap/m/Text",
        "sap/m/MultiInput",
        "sap/m/MultiComboBox",
        "../utils/formatter"
    ],
    function (
        MessageBox,
        Filter,
        FilterOperator,
        Fragment,
        BaseController,
        JSONModel,
        PersonalizableInfo,
        SearchField,
        TypeString,
        MColumn,
        Label,
        ColumnListItem,
        compLibrary,
        Token,
        UIColumn,
        Text,
        MultiInput,
        MultiComboBox,
        formatter
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
                    this._oSmartVariantManagement = this.getView().byId(
                        "smartVariantProduct"
                    );
                    this._oFilterBar = this.getView().byId("filterbar");
                    this._oTable = this.getView().byId("productsTable");
                    this._oWhiteSpacesInput = this.byId("productsInput");
                    this._oVM = this.getView().byId("vm");
                    this.getView().setModel(new JSONModel({"deleteButton": false}), "state");

                    this._oFilterBar.registerApplyData(
                        this._applyData.bind(this)
                    );
                    this._oFilterBar.registerGetFiltersWithValues(
                        this._getFiltersWithValues.bind(this)
                    );

                    this._initializeFilterPersonalization();
                    this._hideLabelForFilterItem();
                },

                _hideLabelForFilterItem: function () {
                    this.getView().byId("productId").getLabelControl().removeStyleClass("sapUiCompFilterLabel");
                },

                /**
                 * Initializes filter personalization functionality.
                 * Sets up personalization for the filter bar using SmartVariantManagement.
                 *
                 * @private
                 */
                _initializeFilterPersonalization: function () {
                    const oPersonalInfo = new PersonalizableInfo({
                        type: "filterBar",
                        keyName: "persistencyKey",
                        dataSource: "",
                        control: this._oFilterBar
                    });

                    this._oSmartVariantManagement.addPersonalizableControl(
                        oPersonalInfo
                    );

                    this._oSmartVariantManagement.initialise(
                        function () {
                        },
                        this._oFilterBar
                    );
                },

                onSelectionChangeTable: function (oControlEvent) {
                    const oStateModel = this.getView().getModel("state");

                    oStateModel.setProperty(
                        "/deleteButton", oControlEvent.getSource().getSelectedItems().length > 0
                    );
                },

                _checkCurrentVariant: function () {
                    const sSelectedKey = this._oVM.getSelectedKey();
                    const oItem = this._oVM.getItemByKey(sSelectedKey);
                    if (!oItem) {
                        var sKey = this._oVM.getStandardVariantKey();
                        if (sKey) {
                            this._oVM.setSelectedKey(sKey);
                        }
                    }
                },
                _updateItems: function (mParams) {
                    if (mParams.deleted) {
                        mParams.deleted.forEach(function (sKey) {
                            const oItem = this._oVM.getItemByKey(sKey);
                            if (oItem) {
                                this._oVM.removeItem(oItem);
                                oItem.destroy();
                            }
                        }.bind(this));
                    }

                    if (mParams.hasOwnProperty("def")) {
                        this._oVM.setDefaultKey(mParams.def);
                    }

                    this._checkCurrentVariant();
                },
                _createNewItem: function (mParams) {
                    const sKey = "key_" + Date.now();

                    const oItem = new VariantItem({
                        key: sKey,
                        title: mParams.name,
                        executeOnSelect: mParams.execute,
                        author: "sample",
                        changeable: true,
                        remove: true
                    });

                    if (mParams.hasOwnProperty("public")) {
                        oItem.setSharing(mParams.public);
                    }
                    if (mParams.def) {
                        this._oVM.setDefaultKey(sKey);
                    }

                    this._oVM.addItem(oItem);

                },

                onPress: function (event) {
                    this._oVM.setModified(!this._oVM.getModified());
                },

                onManage: function (event) {
                    const params = event.getParameters();
                    this._updateItems(params);
                },

                onSelect: function () {
                    this._oVM.setModified(false);
                },

                onSave: function (event) {
                    const params = event.getParameters();
                    if (!params.overwrite) {
                        this._createNewItem(params);
                    }

                    this._oVM.setModified(false);
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
                                this.replaceDoubleWhitespaceWithUnicodeSpace(
                                    oToken.getText()
                                )
                            );
                        }.bind(this)
                    );

                    this._oWhiteSpacesInput.setTokens(aTokens);
                    this.oWhitespaceDialog.close();
                },

                /**
                 * Applies filter data to the SmartFilterBar.
                 * Sets the selected keys for the corresponding filter items based on the provided data.
                 * @param {object[]} aData - Array of filter items with group name, field name, and selected keys.
                 *
                 * @private
                 */
                _applyData: function (aData) {
                    aData.forEach(function (oDataObject) {
                        const oControl = this.oFilterBar.determineControlByName(
                            oDataObject.fieldName,
                            oDataObject.groupName
                        );
                        oControl.setSelectedKeys(oDataObject.fieldData);
                    }, this);
                },

                /**
                 * Event handler for the filter change event.
                 * Updates labels and table based on the filter changes.
                 *
                 * @public
                 */
                onFilterChange: function () {
                    this._updateLabelsAndTable();
                },

                /**
                 * Event handler for the selection change event.
                 * Sets the current variant as modified in VariantManagement and fires the filter change event of the FilterBar.
                 * @param {sap.ui.base.Event} oEvent - The event object.
                 *
                 * @public
                 */
                onSelectionChange: function (oEvent) {
                    this._oSmartVariantManagement.currentVariantSetModified(
                        true
                    );
                    this.onFilterChange(oEvent);
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
                    this.getView()
                        .byId("expandedLabel")
                        .setText(this._getFormattedSummaryText());
                    this.getView()
                        .byId("snappedLabel")
                        .setText(this._getFormattedSummaryText());
                    this._oTable.setShowOverlay(true);
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
                 * Retrieves the formatted summary text based on the active filters.
                 * Returns the formatted summary text indicating the number of active filters and their names.
                 * @returns {string} - The formatted summary text.
                 *
                 * @private
                 */
                _getFormattedSummaryText: function () {
                    const aFiltersWithValues =
                        this._oFilterBar.retrieveFiltersWithValues();

                    if (aFiltersWithValues.length === 0) {
                        return this._getTextFromI18n("zeroFilters");
                    }

                    if (aFiltersWithValues.length > 5) {
                        return (
                            this._getTextFromI18n("oneFilterActive", [
                                aFiltersWithValues.length
                            ]) + aFiltersWithValues.join(", ", 5) + "..."
                        );
                    }

                    return (
                        this._getTextFromI18n("multiFiltersActive", [
                            aFiltersWithValues.length
                        ]) + aFiltersWithValues.join(", ")
                    );
                },

                /**
                 * Retrieves the expanded formatted summary text based on the active filters.
                 * Returns the expanded formatted summary text indicating the number of active filters,
                 * the number of hidden filters, and their names.
                 * @returns {string} - The expanded formatted summary text.
                 *
                 * @private
                 */
                _getFormattedSummaryTextExpanded: function () {
                    const aFiltersWithValues =
                        this._oFilterBar.retrieveFiltersWithValues();

                    if (aFiltersWithValues.length === 0) {
                        return this._getTextFromI18n("zeroFilters");
                    }

                    let sText = this._getTextFromI18n("multiFiltersActive", [
                            aFiltersWithValues.length
                        ]),
                        aNonVisibleFiltersWithValues =
                            this._oFilterBar.retrieveNonVisibleFiltersWithValues();

                    if (aFiltersWithValues.length === 1) {
                        sText = this._getTextFromI18n("oneFilterActive", [
                            aFiltersWithValues.length
                        ]);
                    }

                    if (
                        aNonVisibleFiltersWithValues &&
                        aNonVisibleFiltersWithValues.length > 0
                    ) {
                        sText += this._getTextFromI18n("filtersHidden", [
                            aNonVisibleFiltersWithValues.length
                        ]);
                    }

                    return sText;
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
                                            new Label({text: "{Price}"}),
                                            new Label({text: "{Name}"})
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

                    oColumnPrice.data({fieldName: "Price"});
                    oTable.addColumn(oColumnPrice);

                    const oColumnName = new UIColumn({
                        label: new Label({
                            text: this._getTextFromI18n(
                                "productsOverviewInputName"
                            )
                        }),
                        template: new Text({wrapping: false, text: "{Name}"})
                    });

                    oColumnName.data({fieldName: "Name"});
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
                 * Replaces occurrences of double whitespace in the original text with a Unicode whitespace character.
                 * @param {string} sOriginalText - The original text to perform the replacement on.
                 * @returns {string} - The text with double whitespace replaced with a Unicode whitespace character.
                 *
                 * @private
                 */
                replaceDoubleWhitespaceWithUnicodeSpace: function (
                    sOriginalText
                ) {
                    const sWhitespace = " ",
                        sUnicodeWhitespaceCharacter = "\u00A0";

                    if (typeof sOriginalText !== "string") {
                        return sOriginalText;
                    }

                    return sOriginalText.replaceAll(
                        sWhitespace + sWhitespace,
                        sWhitespace + sUnicodeWhitespaceCharacter
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

                        oSelectedIndices.forEach((iIndex) => {
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
                                    .splice(iIndex, 1);
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
                    const selectedItems = this._oTable.getSelectedItems();
                    const itemsNumber = selectedItems.length;
                    const sConfirmMessage = this._buildConfirmationText(selectedItems, itemsNumber);

                    if (!this.pDialog) {
                        this.pDialog = this.loadFragment({
                            name: "darya.zavaliuk.view.fragments.DeleteModal"
                        });
                    }
                    let view = this.getView();

                    this.pDialog.then(function (oDialog) {
                        view.setModel(new JSONModel({"text": sConfirmMessage}), "modalMessage");
                        view.addDependent(oDialog);
                        oDialog.open();
                    });
                },

                onPressDialogClose: function () {
                    this.byId("deleteDialog").close();
                },

                onPressDialogDelete: function () {
                    this._deleteSelectedProducts();
                    this.byId("deleteDialog").close();
                },

                /**
                 * Constructs the confirmation text based on the selected items and the number of items.
                 * @param {Array} selectedItems - The array of selected items.
                 * @param {number} itemsNumber - The number of selected items.
                 * @returns {string} The confirmation text.
                 *
                 * @private
                 */
                _buildConfirmationText: function (selectedItems, itemsNumber) {
                    const singleDeleteText = this._getTextFromI18n(
                        "deleteProductConfirmMessage",
                        [
                            selectedItems[0]
                                .getBindingContext()
                                .getProperty("Name")
                        ]
                    );
                    const multiDeleteText = this._getTextFromI18n(
                        "deleteProductsConfirmMessage",
                        [itemsNumber]
                    );

                    return itemsNumber === 1 ? singleDeleteText : multiDeleteText;
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
                        .filter((filter) => filter !== undefined)
                        .map((filter) => new Filter(filter));

                    const oBinding = this._oTable.getBinding("items");

                    oBinding.filter(
                        new Filter({
                            filters: aFilters,
                            and: true
                        })
                    );

                    this._oTable.setShowOverlay(false);
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
                        (value) =>
                            new Filter(
                                sFieldBinding,
                                FilterOperator.Contains,
                                value
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
