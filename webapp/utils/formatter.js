sap.ui.define(["sap/ui/core/ValueState"], function (ValueState) {
    "use strict";

    const PRODUCT_STATUS_ICON = {
        ERROR: "sap-icon://error",
        SUCCESS: "sap-icon://sys-enter-2",
    };

    return {
        /**
         * Formatter function for retrieving text based on a given product discontinued status.
         * @param {string} sValue - The product status code.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityText: function (sValue) {
            return sValue ? this._getTextFromI18n("unavailableStatusText") : this._getTextFromI18n("availableStatusText")
        },

        /**
         * Formatter function for retrieving status on a given product discontinued status.
         * @param {string} sValue - The product status code.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityState: function (sValue) {
            return sValue ? ValueState.Error : ValueState.Success;
        },

        /**
         * Formatter function for retrieving status icons based on a given product discontinued status.
         * @param {string} sValue - The product status code.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityIcon: function (sValue) {
            return sValue ? PRODUCT_STATUS_ICON.ERROR : PRODUCT_STATUS_ICON.SUCCESS
        },

        /**
         * Formatter function for retrieving dates based on a given product discontinued status.
         * @param {string} sValue - The product status code.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatDiscontinuedDate: function (sValue) {
            return sValue ? new Date(sValue).getFullYear() : this._getTextFromI18n("discontinuedStatusText");
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
