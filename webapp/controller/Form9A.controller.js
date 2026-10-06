sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
	"com/nhpc/zsdtarifformss1/util/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
], (BaseController, messenger, formatter, Filter, FilterOperator, BusyIndicator) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9A", {
		formatter: formatter,
		onInit: function () {
			this.getRouter().getRoute("RouteForm9A").attachPatternMatched(this._onRoutePatternMatched, this);
		},

		onAfterRendering: function () {
			this.getView().addStyleClass("sapUiSizeCompact");
		},

		_onRoutePatternMatched: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const oArgs = oEvent.getParameter("arguments");
			const sStatus = oArgs.Status;
			oViewModel.setProperty("/Status", sStatus);
			let sSelectedYear = oArgs.Fisical_Year;
			let sTariffID = oArgs.tariffId;
			this._FiscalYear = sSelectedYear;
			this._TariffID = sTariffID;
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			let sTariffStage = oViewModel.getProperty("/Header/Tariff_Stage");
			let [sStartYear, sEndYear] = sTariffPeriod.split("-");
			let sPrevTariffPeriod = `${Number(sStartYear) - 5}-${sStartYear}`;
			this._prevTariffPeriod = sPrevTariffPeriod;
			if (sStatus === "NEW") {
				const oForm9AData = {
					catalog: {
						Form9A: []
					}
				};
				oViewModel.setProperty("/catalog/Form9A", oForm9AData.catalog.Form9A);
				this._loadForm9ABackendData(sSelectedYear, sTariffPeriod, sTariffStage);
				oViewModel.setProperty("/canEdit", true);
			}
			else {
				this._loadSavedForm9AData(sTariffStage, sSelectedYear);
				oViewModel.setProperty(
					"/canEdit",
					sStatus !== "Submitted"
				);
			}
		},

		_loadSavedForm9AData: function (sTariffStage, sSelectedYear) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			const sTariffID = this._TariffID;
			const sFiscalYear = this._FiscalYear;
			const aFilters = [
				new Filter(
					"Tarrif_id",
					FilterOperator.EQ,
					sTariffID
				),
				new Filter(
					"Fiscal_year",
					FilterOperator.EQ,
					sFiscalYear
				)
			];
			oModel.read("/Form9AheadSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "Form9Ahead_9AItem/Form9AItem_SubItem"
				},
				success: function (oData) {
					const aBackendHeaders = oData.results || [];
					if (!aBackendHeaders.length) {
						return;
					}
					const oBackendHeader = aBackendHeaders[0];
					const aBackendParents =
						oBackendHeader.Form9Ahead_9AItem &&
							oBackendHeader.Form9Ahead_9AItem.results
							? oBackendHeader.Form9Ahead_9AItem.results
							: [];
					const aForm9A = [];
					aBackendParents.forEach(function (oBackendParent) {
						const aBackendChildren =
							oBackendParent.Form9AItem_SubItem &&
								oBackendParent.Form9AItem_SubItem.results
								? oBackendParent.Form9AItem_SubItem.results
								: [];
						const aUIChildren =
							aBackendChildren.map(function (oChild) {
								return {
									Sno: oChild.Sno,
									SubSno: oChild.Sub_Sno,
									Equipment: oChild.Equipment,
									Head_Account: oChild.Head_Account,
									Accural_Basis: oChild.Accural_Basis,
									Discharge_Liabilty: oChild.Discharge_Liabilty,
									Cash_Basis: oChild.Cash_Basis,
									Idc: oChild.Idc,
									Regulation: oChild.Regulation,
									Justification: oChild.Justification,
									Admitted_Cost: oChild.Admitted_Cost,
									IsSubTotal: oChild.IsSubTotal
								};
							});
						aForm9A.push({
							Sno: oBackendParent.Sno,
							Text: oBackendParent.Text,
							Form9Ahead_9AItem: aUIChildren,
							isParent: true,
							IsTotal: oBackendParent.IsTotal
						});
					}.bind(this));
					oViewModel.setProperty("/catalog/Form9A", aForm9A);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		_loadForm9ABackendData: function (sSelectedYear, sTariffPeriod, sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			let aFilters = [
				new Filter("Fisical_Year", FilterOperator.EQ, sSelectedYear),
				new Filter("Form_id", FilterOperator.EQ, "9A"),
				new Filter("Tarrif_period", FilterOperator.EQ, sTariffPeriod),
				new Filter("Tarrif_stage", FilterOperator.EQ, sTariffStage)
			]
			oModel.read("/EquipmentSet", {
				filters: aFilters,
				urlParameters: "$expand=Equipment_h_item",
				success: function (oData) {
					const aEquipment = oData.results || [];
					const aForm9A = oViewModel.getProperty("/catalog/Form9A") || [];
					let sItems = [];
					aEquipment.forEach(function (oEquipment) {
						const aItems =
							oEquipment.Equipment_h_item &&
								oEquipment.Equipment_h_item.results
								? oEquipment.Equipment_h_item.results
								: [];
						sItems.push({
							Sno: oEquipment.Sno,
							Text: oEquipment.Head_work,
							IsTotal: oEquipment.IsTotal,
							Form9Ahead_9AItem: aItems.map(function (oItem) {
								return {
									SubSno: oItem.Sub_Sno,
									Head_Account: oItem.Head_Account,
									Equipment: oItem.Head_work,
									Discharge_Liabilty: "0.00",
									IsSubTotal: oItem.IsSubTotal
								};
							})
						});
					});
					oViewModel.setProperty("/catalog/Form9A", sItems);
				}.bind(this),
				error: function (oError) {
					console.error("Error loading EquipmentSet:", oError);
				}.bind(this)
			});
		},

		onCollapseAll: function () {
			const oTreeTable = this.byId("TreeTableBasic");
			oTreeTable.collapseAll();
		},

		onCollapseSelection: function () {
			const oTreeTable = this.byId("TreeTableBasic");
			oTreeTable.collapse(oTreeTable.getSelectedIndices());
		},

		onExpandFirstLevel: function () {
			const oTreeTable = this.byId("TreeTableBasic");
			oTreeTable.expandToLevel(1);
		},

		onExpandSelection: function () {
			const oTreeTable = this.byId("TreeTableBasic");
			oTreeTable.expand(oTreeTable.getSelectedIndices());
		},

		onForm9AAdd: function () {
			const oTable = this.byId("idForm9ATable");
			const oViewModel = this.getModel("viewModel");
			let oResourceBundle = this.getResourceBundle();
			const iSelectedIndex = oTable.getSelectedIndex();
			if (iSelectedIndex < 0) {
				messenger.error(oResourceBundle.getText("pleaseSelectChildRow"));
				return;
			}
			const oContext = oTable.getContextByIndex(iSelectedIndex);
			if (!oContext) {
				return;
			}
			let sParentPath = oContext.getPath();
			const bParentSelected = !sParentPath.includes("/Form9Ahead_9AItem/");
			if (!bParentSelected) {
				sParentPath = sParentPath.split("/Form9Ahead_9AItem/")[0];
			}
			const oParent = oViewModel.getProperty(sParentPath);
			if (oParent.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotAddChildUnderTotal"))
				return;
			}
			let aChildren = oViewModel.getProperty(sParentPath + "/Form9Ahead_9AItem") || [];
			const iChildCount = aChildren.filter(function (oChild) {
				return !oChild.IsSubTotal && !oChild.IsTotal;
			}).length;
			const oNewChild = {
				Sno: oParent.Sno,
				SubSno: String(iChildCount + 1).padStart(3, "0"),
				Equipment: "",
				Head_Account: "",
				Accural_Basis: "",
				Discharge_Liabilty: "",
				Cash_Basis: "",
				Idc: "",
				Regulation: "",
				Justification: "",
				Admitted_Cost: ""
			};
			const iSubtotalIndex = aChildren.findIndex(function (oChild) {
				return oChild.IsSubTotal;
			});
			let iNewChildIndex;
			if (iSubtotalIndex >= 0) {
				aChildren.splice(iSubtotalIndex, 0, oNewChild);
				iNewChildIndex = iSubtotalIndex;
			} else {
				aChildren.push(oNewChild);
				iNewChildIndex = aChildren.length - 1;
			}
			oViewModel.setProperty(
				sParentPath + "/Form9Ahead_9AItem",
				aChildren
			);
			oTable.clearSelection();
			if (bParentSelected) {
				oTable.expand(iSelectedIndex);
			}
			setTimeout(function () {
				let iNewRowIndex = -1;
				for (let i = 0; i < oTable.getBinding("rows").getLength(); i++) {
					const oRowContext = oTable.getContextByIndex(i);
					if (oRowContext &&
						oRowContext.getPath() ===
						sParentPath + "/Form9Ahead_9AItem/" + iNewChildIndex) {
						iNewRowIndex = i;
						break;
					}
				}
				if (iNewRowIndex < 0) {
					return;
				}
				oTable.setFirstVisibleRow(iNewRowIndex);
				setTimeout(function () {
					const aRows = oTable.getRows();
					aRows.forEach(function (oRow) {
						const oRowContext =
							oRow.getBindingContext("viewModel");
						if (oRowContext &&
							oRowContext.getPath() ===
							sParentPath + "/Form9Ahead_9AItem/" + iNewChildIndex) {
							const aCells = oRow.getCells();
							if (aCells[1]) {
								aCells[1].focus();
							}
							return;
						}
					});
				}, 100);
			}, 200);
		},

		onForm9ADelete: function () {
			const oTable = this.byId("idForm9ATable");
			const oViewModel = this.getModel("viewModel");
			const iSelectedIndex = oTable.getSelectedIndex();
			let oResourceBundle = this.getResourceBundle();
			if (iSelectedIndex < 0) {
				messenger.error(oResourceBundle.getText("pleaseSelectChildROw"));
				return;
			}
			const oContext = oTable.getContextByIndex(iSelectedIndex);
			if (!oContext) {
				return;
			}
			const sPath = oContext.getPath();
			const oSelectedObject = oContext.getObject();
			if (!sPath.includes("/Form9Ahead_9AItem/")) {
				messenger.error(oResourceBundle.getText("childRowsError"));
				return;
			}
			if (oSelectedObject.IsSubTotal || oSelectedObject.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotBeRelated"));
				return;
			}
			const aParts = sPath.split("/Form9Ahead_9AItem/");
			const sParentPath = aParts[0];
			const iChildIndex = parseInt(aParts[1], 10);
			let aChildren = oViewModel.getProperty(
				sParentPath + "/Form9Ahead_9AItem"
			);
			if (!aChildren || isNaN(iChildIndex)) {
				return;
			}
			aChildren.splice(iChildIndex, 1);
			let iSubSno = 1;
			aChildren.forEach(function (oChild) {
				if (!oChild.IsSubTotal && !oChild.IsTotal) {
					oChild.SubSno = String(iSubSno++).padStart(3, "0");
				}
			});
			oViewModel.setProperty(
				sParentPath + "/Form9Ahead_9AItem",
				aChildren
			);
			oTable.clearSelection();
		},

		handleSaveBtnPress: function () {
			let oModel = this.getModel();
			let sFiscalYear = this._FiscalYear;
			let sTariffID = this._TariffID;
			let oResourceBundle = this.getResourceBundle();
			let aPayload = this.getPayload("Draft");
			let sTitle = oResourceBundle.getText("CONFIRM_TITLE");
			let sText = oResourceBundle.getText("CONFIRM_TEXT_DRAFT_REQUEST_9A", sFiscalYear);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form9AheadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form9ADraftSuccess", sFiscalYear), () => {
							this.getRouter().navTo("RouteDetail", {
								tariffId: sTariffID
							}, {}, true);
						});
					}.bind(this),
					error: function (oError) {
						messenger.error(JSON.parse(oError.responseText).error.message.value)
					}
				});
			}.bind(this));
		},

		handleSubmitBtnPress: function () {
			let oModel = this.getModel();
			let sFiscalYear = this._FiscalYear;
			let sTariffID = this._TariffID;
			let oResourceBundle = this.getResourceBundle();
			let aPayload = this.getPayload("Submitted");
			let sTitle = oResourceBundle.getText("CONFIRM_TITLE");
			let sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST_9A", sFiscalYear);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form9AheadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form9ASubmitSuccess", sFiscalYear), () => {
							this.getRouter().navTo("RouteDetail", {
								tariffId: sTariffID
							}, {}, true);
						});
					}.bind(this),
					error: function (oError) {
						messenger.error(JSON.parse(oError.responseText).error.message.value)
					}
				});
			}.bind(this));
		},

		getPayload: function (sStatus) {
			const oViewModel = this.getModel("viewModel");
			const aForm9AData = oViewModel.getProperty("/catalog/Form9A") || [];
			const sFiscalYear = this._FiscalYear;
			const sTariffID = this._TariffID;
			const aParents = [];
			aForm9AData.forEach(function (oParent) {
				const aSubItems = [];
				const aChildren = oParent.Form9Ahead_9AItem || [];
				aChildren.forEach(function (oChild) {
					aSubItems.push({
						Sub_Sno: oChild.SubSno,
						Equipment: oChild.Equipment,
						Head_Account: oChild.Head_Account,
						Accural_Basis: oChild.Accural_Basis,
						Discharge_Liabilty: oChild.Discharge_Liabilty,
						Cash_Basis: oChild.Cash_Basis,
						Idc: oChild.Idc,
						Regulation: oChild.Regulation,
						Justification: oChild.Justification,
						Admitted_Cost: oChild.Admitted_Cost,
						IsSubTotal: oChild.IsSubTotal
					});
				});
				aParents.push({
					Sno: oParent.Sno,
					Text: oParent.Text,
					Tarrif_id: sTariffID,
					Form9AItem_SubItem: aSubItems,
					IsTotal: oParent.IsTotal
				});
			});
			return {
				Fiscal_year: sFiscalYear,
				Tarrif_id: sTariffID,
				Text: "",
				Status: sStatus,
				Form_id: "9A",
				Form9Ahead_9AItem: aParents
			};
		}
	});
});