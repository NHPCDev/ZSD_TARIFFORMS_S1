sap.ui.define([
    "com/nhpc/zsdtarifformss1/controller/BaseController",
    "sap/m/MessageToast",
    "com/nhpc/zsdtarifformss1/util/messenger",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/export/Spreadsheet",
    "com/nhpc/zsdtarifformss1/util/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/SearchField",
    "sap/ui/export/library",
    "sap/ui/core/BusyIndicator",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/core/Item",
    "sap/m/MessageBox",
], function (
    BaseController,
    MessageToast,
    messenger,
    Fragment,
    ValueState,
    Spreadsheet,
    formatter,
    Filter,
    FilterOperator,
    JSONModel,
    SearchField,
    exportLibrary,
    BusyIndicator,
    Column,
    MColumn,
    ColumnListItem,
    Label,
    Text,
    Item,
    MessageBox
) {
    "use strict";

    const EdmType = exportLibrary.EdmType;

    return BaseController.extend(
        "com.nhpc.zsdtarifformss1.controller.Dashboard",
        {
            formatter: formatter,
            onInit: function () {
                this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
            },

            _onRoutePatternMatched: function () {
                this.getModel().refresh();
                this.getModel().read("/HeaderSet", {
                    urlParameters: "$expand=Head_itemnav,Head_itemnav/itemform9Nav,Head_itemnav/itemform9Nav/Form9Ahead_9AItem",
                    success: function (oData) {
                        console.log(oData)
                    },
                    error: function (oError) {
                        console.log(oError)
                    }
                })

                this.oProfitCenterModel = new JSONModel(sap.ui.require.toUrl("com/nhpc/zsdtarifformss1/model") + "/profitCenterVH.json");
                this.oPlantModel = new JSONModel(sap.ui.require.toUrl("com/nhpc/zsdtarifformss1/model") + "/plantVH.json");
            },

            onAfterRendering: function () {
                this.getView()
                    .addStyleClass("sapUiSizeCompact");
            },
            onManageTaskTableUpdateFinish(oEvent) {
                var oResourceBundle = this.getResourceBundle(),
                    iCount = oEvent.getParameter("total");
                var sTitle = oResourceBundle.getText("dashBoardTableTitle") + " (" + iCount + ")";
                this.byId("idDashboardTitle").setText(sTitle);
            },
            handleCreateNewBtnPress() {

                var oView = this.getView();
                if (!this.oCreateDialog) {
                    this.oCreateDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.nhpc.zsdtarifformss1.fragments.CreateTariffFormDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    })
                }
                this.oCreateDialog.then(function (oDialog) {
                    var oViewModel = this.getModel("viewModel");
                    oViewModel.setProperty("/createTariff/profitCenter", "");
                    oViewModel.setProperty("/createTariff/tariffPeriod", "");
                    oViewModel.setProperty("/createTariff/tariffStage", "");
                    oViewModel.setProperty("/createTariff/plantStage", "");
                    oDialog.open();

                }.bind(this));

            },

            handleCreateTariffConfirm: function () {

                if (!this._validateCreateTariff()) {
                    return;
                }

                var oViewModel = this.getModel("viewModel");
                var oCreateTariff = oViewModel.getProperty("/createTariff");

                var oPayload = {
                    Profit_Center: oCreateTariff.profitCenter,
                    Plant: oCreateTariff.plant,
                    Tariff_Period: oCreateTariff.tariffPeriod,
                    Tariff_Stage: oCreateTariff.tariffStage,
                    Plant_Stage: oCreateTariff.plantStage
                };
                console.log("Payload for creating tariff:", oPayload);
                BusyIndicator.show(0);

                this.getModel().create("/HeaderSet", oPayload, {

                    success: function (oData) {

                        BusyIndicator.hide();

                        var sTariffId = oData.Tariff_ID;

                        console.log("Tariff created successfully:", oData);

                        if (!sTariffId) {
                            messenger.error(this.getResourceBundle().getText("tariffIdNotReturned"));
                            return;
                        }

                        this.handleCreateTariffCancel();

                        MessageBox.success(this.getResourceBundle().getText("tariffCreateSuccess", [sTariffId]), {
                            title: this.getResourceBundle().getText("tariffCreatedTitle"),

                            onClose: function () {

                                this.getRouter().navTo("RouteDetail", {
                                    tariffId: sTariffId
                                });

                            }.bind(this)
                        }
                        );

                    }.bind(this),

                    error: function (oError) {

                        BusyIndicator.hide();
                        console.error("Error creating tariff:", oError);

                        messenger.error(this.getResourceBundle().getText("tariffCreateError"));

                    }.bind(this)

                });
            },


            // handleCreateTariffConfirm: function () {
            //     if (!this._validateCreateTariff()) {
            //         return;
            //     }

            //     this._setCreateTariffHeader();
            //     this.getModel("viewModel").setProperty("/mode", "Create");

            //     this.handleCreateTariffCancel();

            //     this.getRouter().navTo("RouteDetail", {
            //         tariffId: "NEW"
            //     });
            // },
            handleCreateTariffCancel: function () {
                this.byId("idCreateTariffFormDialog").close();
            },
            handleOnItemPress: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext();
                var sTariffId = oContext.getProperty("Tariff_ID");

                this.getRouter().navTo("RouteDetail", {
                    tariffId: sTariffId
                });
            },
            onDashboardFilterSearch() {
                var oTable = this.byId("idDashboardTable"),
                    oFilterData = this._getTableFilters();

                if (oFilterData.aFilters[0].aFilters.length) {
                    oTable.getBinding("items").filter(oFilterData.aFilters);
                } else {
                    oTable.getBinding("items").filter([]);
                }

            },
            _getTableFilters() {
                var oViewModel = this.getModel("viewModel"),
                    oFilterData = oViewModel.getProperty("/filterData"),
                    aSearchFilter = [];

                //Tariff ID
                if (oFilterData.TariffId) {
                    aSearchFilter.push(this.createFilter("tariffId", "Contains", oFilterData.TariffId));
                };
                // Profit Center
                if (oFilterData.ProfitCenter) {
                    aSearchFilter.push(this.createFilter("profitCenter", "EQ", oFilterData.ProfitCenter));
                };
                // Plant
                if (oFilterData.Plant) {
                    aSearchFilter.push(this.createFilter("Plant", "EQ", oFilterData.Plant));
                }
                // // Quarter
                // if (oFilterData.Quarter && oFilterData.Quarter !== "ALL") {
                //     aSearchFilter.push(this.createFilter("Period", "EQ", oFilterData.Quarter));
                // };

                // Status
                if (oFilterData.Status) {
                    aSearchFilter.push(this.createFilter("Status", "EQ", oFilterData.Status));
                }

                return {
                    aFilters: [
                        new Filter({
                            filters: aSearchFilter,
                            and: true
                        })
                    ]
                };
            },
            onFilterClear: function () {

                var oViewModel = this.getModel("viewModel");

                // Reset filter values
                oViewModel.setProperty("/filterData", {
                    TariffId: "",
                    ProfitCenter: "",
                    Plant: "",
                    Status: "",
                });

                // Clear table filters
                var oTable = this.byId("idDashboardTable");
                oTable.getBinding("items").filter([]);
            },

            _validateCreateTariff: function () {
                var oViewModel = this.getModel("viewModel");
                var oCreateTariff = oViewModel.getProperty("/createTariff");
                var bValid = true;

                // Profit Center
                if (!oCreateTariff.profitCenter) {
                    oViewModel.setProperty( "/createTariff/profitCenterValueState", ValueState.Error  );
                    oViewModel.setProperty( "/createTariff/profitCenterValueStateText",  this.getResourceBundle().getText("profitCenterRequired") );
                    bValid = false;
                }

                // Plant
                if (!oCreateTariff.plant) {
                    oViewModel.setProperty( "/createTariff/plantValueState", ValueState.Error );
                    oViewModel.setProperty( "/createTariff/plantValueStateText",  this.getResourceBundle().getText("plantRequired"));
                    bValid = false;
                }

                // Tariff Period
                if (!oCreateTariff.tariffPeriod) {
                    oViewModel.setProperty(  "/createTariff/tariffPeriodValueState", ValueState.Error );
                    oViewModel.setProperty( "/createTariff/tariffPeriodValueStateText", this.getResourceBundle().getText("tariffPeriodRequired") );
                    bValid = false;
                }

                // Tariff Stage
                if (!oCreateTariff.tariffStage) {
                    oViewModel.setProperty(  "/createTariff/tariffStageValueState",  ValueState.Error );
                    oViewModel.setProperty( "/createTariff/tariffStageValueStateText", this.getResourceBundle().getText("tariffStageRequired"));
                    bValid = false;
                }

                // Plant Stage
                if (!oCreateTariff.plantStage) {
                    oViewModel.setProperty( "/createTariff/plantStageValueState", ValueState.Error);
                    oViewModel.setProperty( "/createTariff/plantStageValueStateText", this.getResourceBundle().getText("plantStageRequired"));
                    bValid = false;
                }

                return bValid;
            },
            _setCreateTariffHeader: function () {
                var oViewModel = this.getModel("viewModel");
                var oCreateTariff = oViewModel.getProperty("/createTariff");

                oViewModel.setProperty("/Header", {
                    Profit_Center: oCreateTariff.profitCenter,
                    Tariff_Period: oCreateTariff.tariffPeriod,
                    Tariff_Stage: oCreateTariff.tariffStage,
                    Plant_Stage: oCreateTariff.plantStage
                });
            },


            //value help
            onValueHelpRequest: function (oEvent) {

                var oSource = oEvent.getSource();

                // Store the input from which Value Help was opened
                this._currSource = oSource;

                var oValueBinding = oSource.getBindingInfo("value");

                if (oValueBinding && oValueBinding.parts && oValueBinding.parts.length) {
                    this._valueHelpTargetPath = oValueBinding.parts[0].path;
                }

                // Get which Value Help was requested
                var sValueHelpName = oSource.data("valuehelp");

                var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);

                // Get columns from JSON file
                var aCols = oValueHelp.model.getData().cols;

                this._oBasicSearchField = new SearchField();

                Fragment.load({
                    id: this.getView().getId(),
                    name: oValueHelp.ValueHelpFragmentPath,
                    controller: this

                }).then(function (oDialog) {

                    this._oValueHelpDialog = oDialog;

                    this.getView().addDependent(this._oValueHelpDialog);

                    if (sValueHelpName === "profitCenterValueHelpRequest") {
                        this._configureProfitCenterVH(this._oValueHelpDialog);
                    } else if (sValueHelpName === "plantValueHelpRequest") {
                        this._configurePlantVH(this._oValueHelpDialog);
                    }

                    // Filter Bar
                    var oFilterBar = this._oValueHelpDialog.getFilterBar();

                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(this._oBasicSearchField);

                    this._oBasicSearchField.attachSearch(function () {
                        this.onFilterBarSearch();
                    }.bind(this));

                    this._oBasicSearchField.setMaxLength(oValueHelp.maxLength);

                    // Get Value Help table
                    this._oValueHelpDialog.getTableAsync().then(function (oTable) {

                        // Use actual OData model
                        oTable.setModel(this.getModel());

                        // sap.ui.table.Table
                        if (oTable.bindRows) {

                            oTable.bindAggregation("rows", {
                                path: oValueHelp.bindingpath,
                                events: {
                                    dataReceived: function () {
                                        this._oValueHelpDialog.update();
                                    }.bind(this)
                                }
                            });

                            aCols.forEach(function (oCol) {

                                var oColumn = new Column({
                                    label: new Label({
                                        text: oCol.label
                                    }),
                                    template: new Text({
                                        text: "{" + oCol.template + "}"
                                    })
                                });

                                oTable.addColumn(oColumn);
                            });
                        }

                        // sap.m.Table
                        if (oTable.bindItems) {

                            oTable.bindAggregation("items", {
                                path: oValueHelp.bindingpath,
                                template: new ColumnListItem({
                                    cells: aCols.map(function (oCol) {
                                        return new Label({
                                            text: "{" + oCol.template + "}"
                                        });
                                    })
                                })
                            });

                            aCols.forEach(function (oCol) {

                                oTable.addColumn(
                                    new MColumn({
                                        header: new Label({
                                            text: oCol.label
                                        })
                                    })
                                );
                            });
                        }

                        this._oValueHelpDialog.update();

                    }.bind(this));

                    this._oValueHelpDialog.open();

                }.bind(this));
            },
            fnGetValueHelpDetails: function (sValueHelp) {

                var oValueHelp = {};
                var sPath = "com.nhpc.zsdtarifformss1.";
                var sMultiInputValueHelpFragmentPath = "fragments.MultiInputValueHelp";

                if (sValueHelp === "profitCenterValueHelpRequest") {

                    oValueHelp = {
                        model: this.oProfitCenterModel,
                        ValueHelpFragmentPath: sPath + sMultiInputValueHelpFragmentPath,
                        bindingpath: "/FacFhPrctrShlpSet",
                        input: this._currSource,
                        maxLength: 20
                    };

                } else if (sValueHelp === "plantValueHelpRequest") {

                    oValueHelp = {
                        model: this.oPlantModel,
                        ValueHelpFragmentPath: sPath + sMultiInputValueHelpFragmentPath,
                        bindingpath: "/Plant_F4Set",
                        input: this._currSource,
                        maxLength: 20
                    };
                }

                return oValueHelp;
            },
            _configureProfitCenterVH: function (oDialog) {

                oDialog.setTitle(this.getText("profitCenterVHTitle"));
                oDialog.setKey("Prctr");
                oDialog.setDescriptionKey("Ktext");
                oDialog.setSupportMultiselect(false);
                oDialog.setSupportRanges(false);
            },

            _configurePlantVH: function (oDialog) {

                oDialog.setTitle(this.getText("plantVHTitle"));
                oDialog.setKey("Werks");  // need to change acc to property
                oDialog.setDescriptionKey("Name1"); // need to change acc to property
                oDialog.setSupportMultiselect(false);
                oDialog.setSupportRanges(false);
            },
            onFilterBarSearch: function () {

                var sSearch = this._oBasicSearchField.getValue();
                this._performVHSearch(sSearch);
            },

            _performVHSearch: function (sValue) {

                var sValueHelpName = this._currSource.data("valuehelp");
                var oFilter;

                if (sValueHelpName === "profitCenterValueHelpRequest") {

                    oFilter = new Filter({
                        filters: [
                            new Filter("Prctr", FilterOperator.Contains, sValue),
                            new Filter("Ktext", FilterOperator.Contains, sValue)
                        ],
                        and: false
                    });

                } else if (sValueHelpName === "plantValueHelpRequest") {

                    oFilter = new Filter({
                        filters: [
                            new Filter("Werks", FilterOperator.Contains, sValue),
                            new Filter("Name1", FilterOperator.Contains, sValue)
                        ],
                        and: false
                    });
                }

                if (oFilter) {
                    this._filterTable(oFilter);
                }
            },

            _filterTable: function (oFilter) {

                var oDialog = this._oValueHelpDialog;

                if (!oDialog) {
                    return;
                }

                oDialog.getTableAsync().then(function (oTable) {

                    // For sap.ui.table.Table
                    if (oTable.bindRows) {

                        var oBinding = oTable.getBinding("rows");

                        if (oBinding) {
                            oBinding.filter(oFilter);
                        }
                    }

                    // For sap.m.Table
                    if (oTable.bindItems) {

                        var oItemBinding = oTable.getBinding("items");

                        if (oItemBinding) {
                            oItemBinding.filter(oFilter);
                        }
                    }

                    oDialog.update();

                });
            },
            onValueHelpCancelPress: function () {
                this._oValueHelpDialog.close();
            },
            onValueHelpAfterClose: function () {

                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null;
            },
            // onValueHelpOkPress: function (oEvent) {

            //     var aTokens = oEvent.getParameter("tokens");

            //     if (aTokens && aTokens.length) {

            //         var oSelectedData = aTokens[0].getCustomData()[0].getValue();

            //         var sValueHelpName = this._currSource.data("valuehelp");

            //         if (sValueHelpName === "profitCenterValueHelpRequest") {

            //             this.getModel("viewModel").setProperty("/createTariff/profitCenter", oSelectedData.Prctr);

            //         } else if (sValueHelpName === "plantValueHelpRequest") {

            //             this.getModel("viewModel").setProperty("/createTariff/plant", oSelectedData.Werks);
            //         }
            //     }

            //     this._oValueHelpDialog.close();
            // },
            // onValueHelpChange: function (oEvent) {

            //     var sPctr = oEvent.getParameter("value");
            //     var oInput = oEvent.getSource();

            //     if (!sPctr) {
            //         this.getModel("viewModel").setProperty("/createTariff/profitCenter", "");
            //         return;
            //     }

            //     if (!/^\d+$/.test(sPctr)) {

            //         oInput.setValue("");
            //         this.getModel("viewModel").setProperty("/createTariff/profitCenter", "");
            //         return;
            //     }

            //     this.getModel().read("/FacFhPrctrShlpSet", {

            //         filters: [
            //             new Filter("Prctr", FilterOperator.EQ, sPctr)
            //         ],

            //         success: function (oData) {

            //             if (oData.results.length > 0) {
            //                 this.getModel("viewModel").setProperty("/createTariff/profitCenter", oData.results[0].Prctr);
            //             } else {
            //                 oInput.setValue("");
            //                 this.getModel("viewModel").setProperty("/createTariff/profitCenter", "");
            //             }

            //         }.bind(this),

            //         error: function () {
            //             oInput.setValue("");
            //             this.getModel("viewModel").setProperty("/createTariff/profitCenter", "");
            //         }.bind(this)
            //     });
            // },

            onValueHelpOkPress: function (oEvent) {

                var aTokens = oEvent.getParameter("tokens");

                if (aTokens && aTokens.length) {

                    var oSelectedData = aTokens[0].getCustomData()[0].getValue();
                    var sValueHelpName = this._currSource.data("valuehelp");

                    if (sValueHelpName === "profitCenterValueHelpRequest") {
                        this.getModel("viewModel").setProperty(this._valueHelpTargetPath, oSelectedData.Prctr);

                    } else if (sValueHelpName === "plantValueHelpRequest") {
                        this.getModel("viewModel").setProperty(this._valueHelpTargetPath, oSelectedData.Werks);
                    }
                }

                this._oValueHelpDialog.close();
            },
            // onValueHelpChange: function (oEvent) {

            //     var oInput = oEvent.getSource();
            //     var sValue = oEvent.getParameter("value");

            //     var sTargetPath = oInput.getBindingInfo("value").parts[0].path;

            //     if (!sValue) {
            //         this.getModel("viewModel").setProperty(sTargetPath, "");
            //         return;
            //     }

            //     if (!/^\d+$/.test(sValue)) {
            //         oInput.setValue("");
            //         this.getModel("viewModel").setProperty(sTargetPath, "");
            //         return;
            //     }

            //     this.getModel().read("/FacFhPrctrShlpSet", {

            //         filters: [
            //             new Filter("Prctr", FilterOperator.EQ, sValue)
            //         ],

            //         success: function (oData) {

            //             if (oData.results.length > 0) {
            //                 this.getModel("viewModel").setProperty( sTargetPath, oData.results[0].Prctr );
            //             } else {
            //                 oInput.setValue("");
            //                 this.getModel("viewModel").setProperty(sTargetPath, "");
            //             }

            //         }.bind(this),

            //         error: function () {

            //             oInput.setValue("");
            //             this.getModel("viewModel").setProperty(sTargetPath, "");

            //         }.bind(this)
            //     });
            // },
            onValueHelpChange: function (oEvent) {

                var oInput = oEvent.getSource();
                var sValue = oEvent.getParameter("value");
                var sValueHelpName = oInput.data("valuehelp");

                var oValueBinding = oInput.getBindingInfo("value");
                var sTargetPath = oValueBinding.parts[0].path;

                if (!sValue) {
                    this.getModel("viewModel").setProperty(sTargetPath, "");
                    return;
                }

                var sEntitySet;
                var sProperty;

                if (sValueHelpName === "profitCenterValueHelpRequest") {
                    sEntitySet = "/FacFhPrctrShlpSet";
                    sProperty = "Prctr";
                } else if (sValueHelpName === "plantValueHelpRequest") {
                    sEntitySet = "/Plant_F4Set";
                    sProperty = "Werks";
                }

                if (!sEntitySet) {
                    return;
                }

                this.getModel().read(sEntitySet, {

                    filters: [
                        new Filter(sProperty, FilterOperator.EQ, sValue)
                    ],

                    success: function (oData) {

                        if (oData.results.length > 0) {

                            this.getModel("viewModel").setProperty(sTargetPath, oData.results[0][sProperty]);

                        } else {

                            oInput.setValue("");
                            this.getModel("viewModel").setProperty(sTargetPath, "");
                        }

                    }.bind(this),

                    error: function () {

                        oInput.setValue("");
                        this.getModel("viewModel").setProperty(sTargetPath, "");

                    }.bind(this)
                });
            },







        });
});