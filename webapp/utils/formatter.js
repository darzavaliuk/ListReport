sap.ui.define([], function () {
    "use strict";

    const PRODUCT_STATUS = {
        "Product Damaged": "Error",
        "Product Shipped": "Success",
        "Product Missing": "Warning",
    };

    const PRODUCT_STATUS_ICON = {
        "Product Damaged": "error",
        "Product Shipped": "sys-enter-2",
        "Product Missing": "alert",
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
