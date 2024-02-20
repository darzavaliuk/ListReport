sap.ui.define(["sap/ui/core/ComponentContainer"], function (ComponentContainer) {
    "use strict";

    const oContainer = new ComponentContainer({
        id: "container",
        name: "darya.zavaliuk",
        manifest: true,
        async: true,
        settings: {
            id: "darya.zavaliuk"
        }
    });
    oContainer.placeAt("content");

});
