sap.ui.define([
    "com/nhpc/zsdtarifformss1/controller/BaseController",
    "com/nhpc/zsdtarifformss1/util/messenger",
    "com/nhpc/zsdtarifformss1/util/formatter",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"

], function (BaseController, messenger, formatter, BusyIndicator, Fragment, Sorter, Filter, FilterOperator, MessageToast) {
    "use strict";

    return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Detail", {

        formatter: formatter,
        onInit: function () {

            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },
        onAfterRendering: function () {
            this.getView().addStyleClass("sapUiSizeCompact");

        },
        // _onRoutePatternMatched: function (oEvent) {
        //     this.getModel().refresh();
        //     var oViewModel = this.getModel("viewModel");
        //     var oModel = this.getModel();

        //     var sTariffId = oEvent.getParameter("arguments").tariffId;

        //     if (sTariffId === "NEW") {
        //         oViewModel.setProperty("/mode", "Create");
        //         oViewModel.setProperty("/editable", true);

        //         this._loadCreateData();
        //     } else {
        //         oViewModel.setProperty("/mode", "Display");
        //         this._loadTariffData(sTariffId);
        //     }

        // },
        _onRoutePatternMatched: function (oEvent) {
            this.getModel().refresh();

            var oViewModel = this.getModel("viewModel");
            var sTariffId = oEvent.getParameter("arguments").tariffId;

            oViewModel.setProperty("/mode", "Display");
            oViewModel.setProperty("/editable", false);

            this._loadTariffData(sTariffId);
        },

        onTariffFormTableUpdateFinish(oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("ManageTfrTableTitle") + " (" + iCount + ")";
            this.byId("idTrfOvrFlwTableTitles").setText(sTitle);
        },
        onUploadTableFinished: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                icount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("uploadAttachmentTitle") + " (" + icount + ")";
            this.byId("idTrfUploadTitle").setText(sTitle);
        },

        onFormDetailsPress: function (oEvent) {
            var oViewModel = this.getModel("viewModel");
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("viewModel");
            var oData = oContext.getObject();
            var sTariffId = oContext.getProperty("tariffId");
            var sFormId = oContext.getProperty("Form_id");
            // oViewModel.setProperty("/Header", oData);
            // Set mode
            oViewModel.setProperty("/mode", "Display");
            this.getRouter().navTo(`RouteForm${sFormId}`, {
                tariffId: "New",
                formId: sFormId,
                Status: "New"
            });
            MessageToast.show("Form Details Pressed for Tariff ID: " + sTariffId + ", Form ID: " + sFormId);
        },

        //attachment
        onPluginActivated: function (oEvent) {
            this.oUploadPluginInstance = oEvent.getParameter("oPlugin");
            var oUploadActionBtn = this.byId("idUploadPlaceholder"),
                oUploadBtn = oUploadActionBtn.getAggregation("_actionButton");

            oUploadBtn.setIcon("sap-icon://upload");
            oUploadBtn.setStyle("Emphasized");
            oUploadBtn.setIconFirst(true);


        },

        // _loadCreateData: function () {

        //     var oModel = this.getModel();
        //     var oViewModel = this.getModel("viewModel");
        //     let aFilters = [
        //         new Filter("Fisical_Year", FilterOperator.EQ, oViewModel.getProperty("/Header/Tariff_Period"))
        //     ]

        //     BusyIndicator.show();

        //     oModel.read("/TarrifMasterSet", {
        //         filters: aFilters,
        //         success: function (oData) {
        //             console.log("TarrifMasterSet create data :", oData);

        //             BusyIndicator.hide();

        //             if (!oData.results || !oData.results.length) {
        //                 oViewModel.setProperty("/TarrifMasterSet", []);
        //                 return;
        //             }

        //             // all Forms here
        //             oViewModel.setProperty("/Header/Forms", oData.results);
        //             oViewModel.setProperty("/Header/Status", "New");

        //         }.bind(this),

        //         error: function (oError) {
        //             BusyIndicator.hide();
        //             messenger.error("Unable to load tariff form data");
        //         }.bind(this)
        //     });
        // },
        _loadTariffData: function (sTariffId) {
            var oModel = this.getModel();
            var oViewModel = this.getModel("viewModel");

            BusyIndicator.show();

            oModel.read("/HeaderSet", {
                filters: [
                    new Filter("Tariff_ID", FilterOperator.EQ, sTariffId)
                ],
                urlParameters: {
                    "$expand": "Head_itemnav"
                },
                success: function (oData) {
                    BusyIndicator.hide();

                    if (!oData.results.length) {
                        messenger.error("Tariff data not found");
                        return;
                    }

                    var oHeader = oData.results[0];
                    console.log("Tariff data loaded successfully:", oHeader);

                    oViewModel.setProperty("/Header", oHeader);
                    console.log("Header data set in viewModel:", oViewModel.getProperty("/Header"));

                    // Generated tariff items
                    var aForms = oHeader.Head_itemnav && oHeader.Head_itemnav.results ? oHeader.Head_itemnav.results : [];
                    oViewModel.setProperty("/Header/Forms", aForms);
                    console.log("Tariff Forms:", aForms);
                    
                }.bind(this),

                error: function () {
                    BusyIndicator.hide();
                    messenger.error("Unable to load tariff data");
                }.bind(this)
            });
        },



    });
});