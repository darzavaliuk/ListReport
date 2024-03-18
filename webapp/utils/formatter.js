sap.ui.define(["sap/ui/core/library"], function (coreLibrary) {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    const PRODUCT_STATUS_ICON = {
        ERROR: "sap-icon://error",
        SUCCESS: "sap-icon://sys-enter-2"
    };

    return {
        /**
         * Formats the product text based on the edit mode.
         * If the page is in edit mode, the edit description is returned. Otherwise, the display description is returned.
         *
         * @param {boolean} bIsEditPage - Indicates whether the page is in edit mode.
         * @param {string} sValueEdit - The description to be displayed in edit mode.
         * @param {string} sValueDisplay - The description to be displayed in non-edit mode.
         * @returns {string} The formatted product text.
         *
         * @public
         */
        formatProductText: function (sValueEdit, sValueDisplay, bIsEditPage = true) {
            return bIsEditPage ? sValueEdit : sValueDisplay;
        },

        /**
         * Formatter function for retrieving text based on a given product discontinued status.
         * @param {boolean} bIsEditPage - Indicates whether the page is in edit mode.
         * @param {string} sValueEdit - The description to be displayed in edit mode.
         * @param {string} sValueDisplay - The description to be displayed in non-edit mode.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityText: function (sValueEdit, sValueDisplay, bIsEditPage = true) {
            return bIsEditPage
                ? sValueEdit  ? this._getTextFromI18n("unavailableStatusText") : this._getTextFromI18n("availableStatusText")
                : sValueDisplay  ? this._getTextFromI18n("unavailableStatusText") : this._getTextFromI18n("availableStatusText");
        },

        /**
         * Formatter function for retrieving status on a given product discontinued status.
         * @param {boolean} bIsEditPage - Indicates whether the page is in edit mode.
         * @param {string} sValueEdit - The description to be displayed in edit mode.
         * @param {string} sValueDisplay - The description to be displayed in non-edit mode.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityState: function (sValueEdit, sValueDisplay, bIsEditPage = true) {
            return bIsEditPage
                ? sValueEdit ? ValueState.Error : ValueState.Success
                : sValueDisplay ? ValueState.Error : ValueState.Success;
        },

        /**
         * Formatter function for retrieving status icons based on a given product discontinued status.
         * @param {boolean} bIsEditPage - Indicates whether the page is in edit mode.
         * @param {string} sValueEdit - The description to be displayed in edit mode.
         * @param {string} sValueDisplay - The description to be displayed in non-edit mode.
         * @returns {string} The URL or class of the status icon.
         *
         * @public
         */
        formatAvailabilityIcon: function (sValueEdit, sValueDisplay, bIsEditPage = true) {
            return bIsEditPage
                ? sValueEdit ? PRODUCT_STATUS_ICON.ERROR : PRODUCT_STATUS_ICON.SUCCESS
                : sValueDisplay ? PRODUCT_STATUS_ICON.ERROR : PRODUCT_STATUS_ICON.SUCCESS;
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
        }
    };
});
