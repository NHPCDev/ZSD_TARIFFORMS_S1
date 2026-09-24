sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9D", {
		onInit: function () {
			this.getRouter().getRoute("RouteForm9D").attachPatternMatched(this._onRoutePatternMatched, this);
		},

		onAfterRendering: function () {
			this.getView().addStyleClass("sapUiSizeCompact");

		},

		_onRoutePatternMatched: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const oArgs = oEvent.getParameter("arguments");
			const sStatus = oArgs.Status;
			if (sStatus === "New") {
				const oForm9DData = {
					catalog: {
						Form9D: [

						]
					}
				};
				oViewModel.setProperty("/catalog/Form9D", oForm9DData.catalog.Form9A);
				this._loadForm9DBackendData();
				oViewModel.setProperty("/canEdit", true);
			}
			if (Status === "Submitted") {
				oViewModel.setProperty("/canEdit", false);
			}
		},

		_loadForm9DBackendData: function () {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");

			oModel.read("/EquipmentSet", {
				success: function (oData) {
					const aEquipment = oData.results || [];
					const aForm9D = aEquipment.map(function (oItem) {
						return {
							Equipment: oItem.Head_Work
						};
					});
					oViewModel.setProperty("/catalog/Form9D", aForm9D);
				}.bind(this),

				error: function (oError) {
					console.error("Error loading EquipmentSet:", oError);
				}.bind(this)
			});
		}

	});
});