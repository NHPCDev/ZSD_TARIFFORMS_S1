sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9B", {
		onInit: function () {
			this.getRouter().getRoute("RouteForm9B").attachPatternMatched(this._onRoutePatternMatched, this);
		},

		onAfterRendering: function () {
			this.getView().addStyleClass("sapUiSizeCompact");

		},

		_onRoutePatternMatched: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const oArgs = oEvent.getParameter("arguments");
			const sStatus = oArgs.Status;
			if (sStatus === "New") {
				const oForm9BData = {
					catalog: {
						Form9B: [

						]
					}
				};
				oViewModel.setProperty("/catalog/Form9B", oForm9BData.catalog.Form9A);
				this._loadForm9BBackendData();
				oViewModel.setProperty("/canEdit", true);
			}
			if (Status === "Submitted") {
				oViewModel.setProperty("/canEdit", false);
			}
		},

		_loadForm9BBackendData: function () {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");

			oModel.read("/EquipmentSet", {
				success: function (oData) {
					const aEquipment = oData.results || [];
					const aForm9B = aEquipment.map(function (oItem) {
						return {
							Equipment: oItem.Head_Work
						};
					});
					oViewModel.setProperty("/catalog/Form9B", aForm9B);
				}.bind(this),

				error: function (oError) {
					console.error("Error loading EquipmentSet:", oError);
				}.bind(this)
			});
		}

	});
});