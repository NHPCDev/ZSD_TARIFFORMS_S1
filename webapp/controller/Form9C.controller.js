sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9C", {
		onInit: function () {
			var oModel = new JSONModel();
			oModel.attachRequestCompleted(function () {
				const oTable = this.byId("form9CTable");
				const oRowMode = oTable.getRowMode();
				const iCount = oModel.getData().catalog.Form9C.length;
				if (iCount > 0) {
					oRowMode.setRowCount(Math.min(iCount, 3));
				}
			}.bind(this));
			oModel.loadData("../model/Clothing.json");
			this.setModel(oModel);
		},
	});
});