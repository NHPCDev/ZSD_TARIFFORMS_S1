sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
], (BaseController, messenger) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9A", {
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
			if (sStatus === "New") {
				const oForm9AData = {
					catalog: {
						Form9A: [
							{
								Sno: "0001",
								Text: "Left-Over Items already allowed by CERC in 2014-19",
								Form9Ahead_9AItem: [],
								isParent: true
							},
							{
								Sno: "0002",
								Text: "Replacement of Assets under the original scope after Cut-Off date (Clause 25 of CERC Regulation 2019-24)",
								Form9Ahead_9AItem: [],
								isParent: true
							},
							{
								Sno: "0003",
								Text: "Assets beyond original scope after Cut-Off date (Clause 26 of CERC Regulation 2019-24)",
								Form9Ahead_9AItem: [],
								isParent: true
							},
							{
								Sno: "0004",
								Text: "Total",
								isParent: true,
								isTotalParent: true,
								Form9Ahead_9AItem: [
									{
										Sno: "",
										SubSno: "",
										Equipment: "Total",
										isTotal: true,

										Head_Account: "",
										Accural_Basis: "",
										Discharge_Liabilty: "",
										Cash_Basis: "",
										Idc: "",
										Regulation: "",
										Justification: "",
										Admitted_Cost: ""
									}
								],
								isParent: true,
								isTotalParent: true
							}
						]
					}
				};
				oViewModel.setProperty("/catalog/Form9A", oForm9AData.catalog.Form9A);
				this._loadForm9ABackendData();
				oViewModel.setProperty("/canEdit", true);
			}
			if (Status === "Submitted") {
				oViewModel.setProperty("/canEdit", false);
			}
		},

		_loadForm9ABackendData: function () {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			oModel.read("/EquipmentSet", {
				success: function (oData) {
					const aEquipment = oData.results || [];
					const aForm9A = oViewModel.getProperty("/catalog/Form9A") || [];
					aForm9A.forEach(function (oSection) {
						if (oSection.Sno === "0004") {
							return;
						}
						const aMatchingEquipment = aEquipment.filter(function (oItem) {
							return oItem.Sno === oSection.Sno;
						});
						oSection.Form9Ahead_9AItem = aMatchingEquipment.map(function (oItem) {
							return {
								Sno: oItem.Sno,
								SubSno: oItem.SubSno,

								Equipment: `${oItem.Head_Work} - ${oItem.Text1}`,

								Head_Account: "",
								Accural_Basis: "",
								Discharge_Liabilty: "",
								Cash_Basis: "",
								Idc: "",
								Regulation: "",
								Justification: "",
								Admitted_Cost: "",
								isEquipment: true
							};
						});
						oSection.Form9Ahead_9AItem.push({
							Sno: "",
							SubSno: "",
							Equipment: "Sub-Total",

							Head_Account: "",
							Accural_Basis: "",
							Discharge_Liabilty: "",
							Cash_Basis: "",
							Idc: "",
							Regulation: "",
							Justification: "",
							Admitted_Cost: "",

							isSubtotal: true
						});
					});
					oViewModel.setProperty("/catalog/Form9A", aForm9A);
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
			const iSelectedIndex = oTable.getSelectedIndex();
			if (iSelectedIndex < 0) {
				sap.m.MessageToast.show("Please select a parent or child row.");
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
			if (oParent.Sno === "0004" || oParent.isTotalParent) {
				sap.m.MessageToast.show("Cannot add child under Total.");
				return;
			}
			let aChildren = oViewModel.getProperty(sParentPath + "/Form9Ahead_9AItem") || [];
			const iChildCount = aChildren.filter(function (oChild) {
				return !oChild.isSubtotal && !oChild.isTotal;
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
				return oChild.isSubtotal;
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
			if (oSelectedObject.isSubtotal || oSelectedObject.isTotal) {
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
				if (!oChild.isSubtotal && !oChild.isTotal) {
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
			let aPayload = this.getPayload();
			oModel.create("/HeaderSet", aPayload, {
				success: function (oData) {
					console.log(oData);
				},
				error: function (oError) {
					console.log(oError);
				}
			})
		},

		getPayload: function () {
			let oViewModel = this.getModel("viewModel");
			let aForm9AData = oViewModel.getProperty("/catalog/Form9A") || [];
			let oHeaderData = oViewModel.getProperty("/Header") || {};
			let aItemform9Nav = aForm9AData
				.filter(function (oParent) {
					return !oParent.isTotalParent;
				})
				.map(function (oParent) {
					return {
						Tarrif_id: oParent.Tarrif_id || "2026",
						Sno: oParent.Sno,
						Text: oParent.Text,
						Status: oParent.Status || "D",

						Form9Ahead_9AItem: (oParent.Form9Ahead_9AItem || [])
							.filter(function (oItem) {
								return oItem.Equipment !== "Sub-Total";
							})
							.map(function (oItem) {
								return {
									Tarrif_id: oItem.Tarrif_id ,
									Sno: oItem.Sno,
									Equipment: oItem.Equipment,
									Head_Account: oItem.Head_Account,
									Accural_Basis: oItem.Accural_Basis,
									Discharge_Liabilty: oItem.Discharge_Liabilty,
									Cash_Basis: oItem.Cash_Basis,
									Idc: oItem.Idc,
									Regulation: oItem.Regulation,
									Justification: oItem.Justification,
									Admitted_Cost: oItem.Admitted_Cost,
									Status: oItem.Status || "D"
								};

							})
					};
				});

			let aPayload = {
				Plant: oHeaderData.Plant,
				Tariff_ID: oHeaderData.Tariff_ID,
				Version: oHeaderData.Version,
				Profit_Center: oHeaderData.Profit_Center,
				Tariff_Period: oHeaderData.Tariff_Period,
				Tariff_Stage: oHeaderData.Tariff_Stage,
				Plant_Stage: oHeaderData.Plant_Stage,
				Status: oHeaderData.Status,
				Remark: oHeaderData.Remark,
				Created_By: oHeaderData.Created_By,
				Created_On: oHeaderData.Created_On,
				Head_itemnav: [
					{
						Tariff_ID: "",
						Version: "01",
						Form_id: "FORM9A",
						Form_desc: "Form 9A",
						Applicable: "X",
						Mandatory: "X",
						Fisical_Year: "2024-2025",
						itemform9Nav: aItemform9Nav
					}
				]
			};

			return aPayload;
		},
	});
});