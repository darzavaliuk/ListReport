sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("darya.zavaliuk.controller.BaseController", {
        /**
         * Retrieves the text from the internationalization model based on the provided key.
         *
         * @param {string} sKey - The key for retrieving the text from the internationalization model.
         * @private
         */
        _getTextFromI18n: function (sKey) {
            const oI18nModel = this.getView().getModel("i18n");
            const oResourceBundle = oI18nModel.getResourceBundle();
            return oResourceBundle.getText(sKey);
        },
    });
});
