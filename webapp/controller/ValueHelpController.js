sap.ui.define(
    [
        "sap/m/SearchField",
        "sap/m/Column",
        "sap/m/Label",
        "sap/m/Text",
        "sap/m/ColumnListItem",
        "sap/ui/model/type/String",
        "sap/ui/table/Column"
    ],
    function (
        SearchField,
        MColumn,
        Label,
        Text,
        ColumnListItem,
        TypeString,
        UIColumn) {
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

        return {
            /**
             * Filters the table in the value help dialog using the given filter.
             * @param {sap.ui.model.Filter} oFilter - The filter to apply to the table.
             *
             * @private
             */
            _filterTableWithPriceValue: function (oFilter) {
                const oValueHelpDialog = this._oPriceHelpValueDialog;

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
             * Configures the help value dialog.
             * @param {sap.m.Dialog} oHelpValueDialog - The help value dialog to configure.
             *
             * @private
             */
            _configureHelpValueDialog: function (oHelpValueDialog) {
                const oFilterBar = oHelpValueDialog.getFilterBar();

                this._oPriceHelpValueDialog = oHelpValueDialog;
                this.getView().addDependent(oHelpValueDialog);

                oHelpValueDialog.setRangeKeyFields([
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

                this._configureTableInHelpValueDialog(oHelpValueDialog);
            },

            /**
             * Configures the table in the help value dialog.
             * @param {sap.m.Dialog} oHelpValueDialog - The help value dialog containing the table.
             *
             * @private
             */
            _configureTableInHelpValueDialog: function (
                oHelpValueDialog
            ) {
                oHelpValueDialog.getTableAsync().then(
                    function (oTable) {
                        oTable.setModel(this.oModel);

                        if (oTable.bindRows) {
                            this._configureUIColumnsForTable(oTable);
                            oTable.bindAggregation("rows", {
                                path: PRODUCT_FIELDS_BINDING.PRODUCTS,
                                events: {
                                    dataReceived: function () {
                                        oHelpValueDialog.update();
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
                                        oHelpValueDialog.update();
                                    }
                                }
                            });
                        }

                        oHelpValueDialog.update();
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
                        this._oPriceHelpValueDialog.getFilterBar().search();
                    }.bind(this)
                });
            },

            /**
             * Configures UI columns for the table.
             * @param {sap.ui.table.Table} oTable - The table to configure the columns for.
             *
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
             * @param {sap.m.Table} oTable - The table to configure the columns for.
             *
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
             * Handles the press event of the cancel button in the help value dialog.
             * Closes the help value dialog.
             *
             * @public
             */
            onValueHelpDialogCancelPress: function () {
                this._oPriceHelpValueDialog.close();
            },

            /**
             * Handles the value help request event.
             * @param {sap.ui.base.Event} oEvent - The value help request event object.
             *
             * @public
             */
            onValueHelpRequest: function () {
                this._initializeBasicSearchField();

                this.pHelpValueDialog = this.loadFragment({
                    name: "darya.zavaliuk.view.fragments.ValueHelpDialog"
                }).then(
                    function (oHelpValueDialog) {
                        this._configureHelpValueDialog(oHelpValueDialog);

                        oHelpValueDialog.setTokens(
                            this._oPriceInput.getTokens()
                        );
                        oHelpValueDialog.open();
                    }.bind(this)
                );
            },

            /**
             * Event handler for the "OK" press of the dialog.
             * Closes the dialog.
             * @param {sap.ui.base.Event} oEvent - The event object.
             *
             * @public
             */
            onDialogOkPress: function (oEvent) {
                const aTokens = oEvent.getParameter("tokens");

                aTokens.forEach(
                    function (oToken) {
                        oToken.setText(
                            oToken.getText()
                        );
                    }.bind(this)
                );

                this._oPriceInput.setTokens(aTokens);
                this._oPriceHelpValueDialog.close();
                this._updateLabelsAndTable();
            }
        };
    });
