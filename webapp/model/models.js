sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            createViewModel: function () {

                var oData = {
                    filterData: {
                        "TariffId": "",
                        "ProfitCenter": "",
                        "Plant": "",
                        "Status": "",
                    },
                    mode: "",
                    editable: true,
                    Header: {},

                    createTariff: {
                        "profitCenter": "",
                        "tariffPeriod": "",
                        "tariffStage": "",
                        "plantStage": "",
                        "plant": "",
                    },
                    profitCenterList: [
                        {
                            "Key": "PC1001"
                        },
                        {
                            "Key": "PC1002"
                        }
                    ],
                    







                    valueState: {
                        FinancialYear: "None",
                        Quarter: "None"
                    },

                    valueStateText: {
                        FinancialYear: "",
                        Quarter: ""
                    },
                    catalog: {
                        Form9A: []
                    }
                }
                var oModel = new JSONModel(oData);
                return oModel;
            },

        };

    });