sap.ui.define([], function () {
    "use strict";

    const PRODUCT_STATUS = {
        "Product Damaged": "Error",
        "Product Shipped": "Success",
        "Product Missing": "Warning"
    };

    const PRODUCT_STATUS_ICON = {
        "Product Damaged": "sap-icon://error",
        "Product Shipped": "sap-icon://sys-enter-2",
        "Product Missing": "sap-icon://alert"
    };

    return {
        /**
         * Formatter function for displaying human-readable status labels based on a given product status.
         * @param {string} sStatusProduct - The product status code.
         * @returns {string} The human-readable status label.
         *
         * @public
         */
        statusFormatter: function (sStatusProduct) {
            return PRODUCT_STATUS[sStatusProduct];
        },

        /**
         * Formatter function for retrieving status icons based on a given product status.
         * @param {string} sStatusProduct - The product status code.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        statusIconFormatter: function (sStatusProduct) {
            return PRODUCT_STATUS_ICON[sStatusProduct];
        },

        /**
         * Converts an array of filters with values into a formatted text representation.
         *
         * @param {Array} aFiltersWithValues - The array of filters with values.
         * @returns {string} The formatted text representation of the filters.
         * @public
         */
        filterItemsToText: function (aFiltersWithValues) {
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
    };
});
