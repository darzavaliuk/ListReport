sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "./BaseController",
    "sap/ui/model/json/JSONModel",
], function (MessageBox, Filter, FilterOperator, Fragment,
             BaseController, JSONModel) {
    "use strict";

    const FILTERS_FOR_PRODUCT_SEARCH = {
        NAME: "Name",
        CATEGORY: "Category/Name",
        SUPPLIER: "Supplier/Name",
        PRICE: "Price",
        RATING: "Rating"
    };

    const MESSAGES = {
        DELETE_PRODUCT_CONFIRM: "deleteProductConfirmMessage",
    };

    return BaseController.extend("darya.zavaliuk.controller.ProductsOverview", {

        /**
         * Initializes the view by setting up a model with unique category names.
         * This model is then associated with the "categories" model name for the view.
         *
         * @public
         */
        onInit: function () {
            const oComponent = this.getOwnerComponent();
            const oDataProducts = oComponent.getModel();
            const oCategoryNames = oDataProducts.getData().Products
                .map(product => product.Category.Name)
                .filter((value, index, self) => self.indexOf(value) === index);

            const oProductsModel = new JSONModel({
                categoryNames: oCategoryNames
            });

            this.getView().setModel(oProductsModel, "categories");
        },

        /**
         * Handles the event when the user requests a value help.
         * Opens a Value Help Dialog and applies a filter based on the input value.
         *
         * @param {sap.ui.base.Event} oEvent - The event triggered by the user's action.
         * @public
         */
        onValueHelpRequest: function (oEvent) {
            const sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();

            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "darya.zavaliuk.view.fragments.ValueHelpDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialog.then(function (oDialog) {
                oDialog.getBinding("items").filter([new Filter("Name", FilterOperator.Contains, sInputValue)]);
                oDialog.open(sInputValue);
            });
        },

        /**
         * Handles the event when the user performs a search in the Value Help Dialog.
         * Applies a filter to the items based on the search value.
         *
         * @param {sap.ui.base.Event} oEvent - The event triggered by the user's search action.
         * @public
         */
        onValueHelpSearch: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const oFilter = new Filter(FILTERS_FOR_PRODUCT_SEARCH.NAME, FilterOperator.Contains, sValue);

            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        /**
         * Handles the event when the Value Help Dialog is closed.
         * Clears the filter on the items and sets the selected item's title as the value in the input field.
         *
         * @param {sap.ui.base.Event} oEvent - The event triggered when the Value Help Dialog is closed.
         * @public
         */
        onValueHelpClose: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            oEvent.getSource().getBinding("items").filter([]);

            if (!oSelectedItem) {
                return;
            }

            this.byId("productsInput").setValue(oSelectedItem.getTitle());
        },

        /**
         * Handles the event when the user presses the button to create a new product.
         * Navigates to the "ProductDetailsNew" route using the application's router.
         *
         * @public
         */
        onPressCreateProduct: function () {
            this.getOwnerComponent().getRouter().navTo("ProductDetailsNew");
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
            const oTable = this.getView().byId("table");
            const oBinding = this.getView().getModel();
            const oSelectedItems = oTable.getSelectedItems();

            if (oSelectedItems.length > 0) {
                const oSelectedIndices = oSelectedItems.map(oItem => oItem.getBindingContext().getPath().split("/").pop());

                oSelectedIndices.forEach(iIndex => {
                    if (iIndex >= 0 && iIndex < oBinding.getData().Products.length) {
                        oBinding.getData().Products.splice(iIndex, 1);
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
            const sConfirmMessage = this._getTextFromI18n(MESSAGES.DELETE_PRODUCT_CONFIRM);

            MessageBox.confirm(sConfirmMessage, {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this._deleteSelectedProducts();
                    }
                }
            });
        },

        /**
         * Applies filters to the table based on category, search input, and general input filters.
         *
         * @public
         */
        onPressConfirmFilters: function () {
            const aFilters = [
                new Filter(this._getCategoryMultiComboboxFilters()) || new Filter([]),
                new Filter(this._getSearchInputFilters()) || new Filter([]),
                new Filter(this._getInputFilters()) || new Filter([])
            ];

            const oBinding = this.byId("table").getBinding("items");

            oBinding.filter(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        /**
         * Generates filters based on the selected values from the Category MultiComboBox.
         *
         * @private
         * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no values are selected.
         */
        _getCategoryMultiComboboxFilters: function () {
            const oMultiComboBox = this.byId("Category");
            const aSelectedValues = oMultiComboBox.getSelectedItems().map(oItem => oItem.getProperty("text"));

            if (aSelectedValues.length === 0) {
                const oBinding = this.byId("table").getBinding("items");
                oBinding.filter(new Filter(FILTERS_FOR_PRODUCT_SEARCH.CATEGORY, FilterOperator.Contains, ""));
                return;
            }

            return aSelectedValues.map(value => new Filter(FILTERS_FOR_PRODUCT_SEARCH.CATEGORY, FilterOperator.Contains, value));
        },

        /**
         * Generates filters based on the input value from the products input field.
         *
         * @private
         * @returns {sap.ui.model.Filter[]|undefined} An array of filters or undefined if no query is present.
         */
        _getInputFilters: function () {
            const sQuery = this.byId("productsInput").getValue();

            if (sQuery && sQuery.length > 0) {
                return [new Filter(FILTERS_FOR_PRODUCT_SEARCH.NAME, FilterOperator.Contains, sQuery)];
            }
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
                    new Filter(FILTERS_FOR_PRODUCT_SEARCH.NAME, FilterOperator.Contains, sQuery),
                    new Filter(FILTERS_FOR_PRODUCT_SEARCH.CATEGORY, FilterOperator.Contains, sQuery),
                    new Filter(FILTERS_FOR_PRODUCT_SEARCH.SUPPLIER, FilterOperator.Contains, sQuery)
                ];

                const aCommonFiltersForNumber = [
                    ...aCommonFiltersForString,
                    new Filter(FILTERS_FOR_PRODUCT_SEARCH.RATING, FilterOperator.EQ, sQuery),
                    new Filter(FILTERS_FOR_PRODUCT_SEARCH.PRICE, FilterOperator.EQ, sQuery),
                ];

                return parseInt(sQuery) ? aCommonFiltersForNumber : aCommonFiltersForString;
            }
        },

    });
});
