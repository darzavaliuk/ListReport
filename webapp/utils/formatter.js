sap.ui.define([], function () {
    "use strict";

    const PRODUCT_STATUS = {
        "Product Damaged": "Error",
        "Product Shipped": "Success",
        "Product Missing": "Warning",
    };

    const PRODUCT_STATUS_ICON = {
        "Product Damaged": "sap-icon://error",
        "Product Shipped": "sap-icon://sys-enter-2",
        "Product Missing": "sap-icon://alert",
    };

    return {
        statusFormatter: function (sStatusProduct) {
            return PRODUCT_STATUS[sStatusProduct];
        },

        statusIconFormatter: function (sStatusProduct) {
            return PRODUCT_STATUS_ICON[sStatusProduct];
        },
    };
});
