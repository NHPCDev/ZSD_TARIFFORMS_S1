sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
	"com/nhpc/zsdtarifformss1/util/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Item",
], (BaseController, messenger, formatter, Filter, FilterOperator, BusyIndicator, Item) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9A", {
		formatter: formatter,
		onInit: function () {
			this.oItemsProcessor = [];
			// this.oUploadPluginInstance = null;

			this.getRouter().getRoute("RouteForm9A").attachPatternMatched(this._onRoutePatternMatched, this);
		},

		onAfterRendering: function () {
			this.getView().addStyleClass("sapUiSizeCompact");
		},

		_onRoutePatternMatched: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const oArgs = oEvent.getParameter("arguments");
			oViewModel.setProperty("/attachmentList", []);
			const sStatus = oArgs.Status;
			oViewModel.setProperty("/Status", sStatus);
			let sSelectedYear = oArgs.Fisical_Year;
			let sTariffID = oArgs.tariffId;
			let sFormID = oArgs.formId;

			this._FiscalYear = sSelectedYear;
			this._TariffID = sTariffID;
			this._FormID = sFormID;

			this.getAttachments();

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
						this.fileUploadwithTable();

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
			let isValid = this.validateItems();
			if (!isValid) {
				return;
			}
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
		},
		validateItems: function () {
			const oViewModel = this.getModel("viewModel");
			const aParents = oViewModel.getProperty("/catalog/Form9A") || [];
			let oResourceBundle = this.getResourceBundle();
			let bValid = true;
			aParents.forEach(function (oParent) {
				const aChildren = oParent.Form9Ahead_9AItem || [];
				aChildren.forEach(function (oChild) {

					// Don't validate subtotal rows
					if (oChild.IsSubTotal === "X") {
						return;
					}

					// Equipment
					if (!this._validateField(
						oChild,
						"Equipment",
						"_EquipmentState",
						"_EquipmentStateText",
						oResourceBundle.getText("headOfWorkMandatory")
					)) {
						bValid = false;
					}

					// Head Account
					if (!this._validateField(
						oChild,
						"Head_Account",
						"_HeadAccountState",
						"_HeadAccountStateText",
						oResourceBundle.getText("headOfAccountMandatory")
					)) {
						bValid = false;
					}

					// Accrual Basis
					if (!this._validateField(
						oChild,
						"Accural_Basis",
						"_AccuralBasisState",
						"_AccuralBasisStateText",
						oResourceBundle.getText("accuralBasisMandatory")
					)) {
						bValid = false;
					}

					// Regulation
					if (!this._validateField(
						oChild,
						"Regulation",
						"_RegulationState",
						"_RegulationStateText",
						oResourceBundle.getText("regulationMandatory")
					)) {
						bValid = false;
					}

					// Justification
					if (!this._validateField(
						oChild,
						"Justification",
						"_JustificationState",
						"_JustificationStateText",
						oResourceBundle.getText("justificationMandatory")
					)) {
						bValid = false;
					}
				}, this);
			}, this);
			oViewModel.refresh(true);
			if (!bValid) {
				messenger.error(oResourceBundle.getText("pleaseFillAllMandatoryFields"));
			}
			return bValid;
		},
		_validateField: function (
			oItem,
			sProperty,
			sStateProperty,
			sStateTextProperty,
			sErrorText
		) {
			const sValue = oItem[sProperty];
			if (
				sValue === null ||
				sValue === undefined ||
				String(sValue).trim() === ""
			) {
				oItem[sStateProperty] = "Error";
				oItem[sStateTextProperty] = sErrorText;
				return false;
			}
			oItem[sStateProperty] = "None";
			oItem[sStateTextProperty] = "";
			return true;
		},
		onDecimalNumberChange: function (oEvent) {
			var oControl = oEvent.getSource();
			var sValue = oEvent.getParameter("value") || "";
			oControl.setValueState("None");
			oControl.setValueStateText("");
			sValue = sValue.replace(/[^0-9.]/g, "");
			if (sValue.startsWith(".")) {
				sValue = "";
			}
			var iDotIndex = sValue.indexOf(".");
			if (iDotIndex !== -1) {
				var sIntegerPart = sValue.substring(0, iDotIndex);
				var sDecimalPart = sValue.substring(iDotIndex + 1);
				sDecimalPart = sDecimalPart.replace(/\./g, "");
				sDecimalPart = sDecimalPart.substring(0, 2);
				sValue = sIntegerPart + "." + sDecimalPart;
			}
			if (sValue.includes(".")) {
				var aParts = sValue.split(".");
				aParts[0] = aParts[0].replace(/^0+(?=\d)/, "");
				sValue = aParts[0] + "." + aParts[1];
			} else {
				sValue = sValue.replace(/^0+(?=\d)/, "");
			}
			oControl.setValue(sValue);
			var sBindingPath = oControl.getBindingPath("value");
			if (!sBindingPath) {
				return;
			}
			var oContext = oControl.getBindingContext("viewModel");
			if (oContext) {
				oContext.getModel().setProperty(
					oContext.getPath() + "/" + sBindingPath,
					sValue
				);
			}
			this._calculateForm9ATotals();
		},
		_calculateForm9ATotals: function () {
			const oViewModel = this.getModel("viewModel");
			const aForm9A = oViewModel.getProperty("/catalog/Form9A") || [];
			const aFields = ["Accural_Basis", "Discharge_Liabilty", "Idc", "Admitted_Cost"];
			aFields.forEach(function (sField) {
				const oSectionTotals = {};
				aForm9A.forEach(function (oSection) {
					const aChildren = oSection.Form9Ahead_9AItem || [];
					let fSubtotal = 0;
					aChildren.forEach(function (oChild) {
						if (oChild.IsSubTotal === "X" || oChild.IsTotal === "X") {
							return;
						}
						const fValue = parseFloat(oChild[sField]);
						if (!isNaN(fValue)) {
							fSubtotal += fValue;
						}
						if (sField === "Accural_Basis" || sField === "Discharge_Liabilty") {
							const fAccural = parseFloat(oChild.Accural_Basis) || 0;
							const fDischarge = parseFloat(oChild.Discharge_Liabilty) || 0;
							oChild.Cash_Basis = (fAccural - fDischarge).toFixed(2);
						}
					});
					oSectionTotals[oSection.Sno] = fSubtotal;
					const oSubtotal = aChildren.find(function (oChild) {
						return oChild.IsSubTotal === "X";
					});
					if (oSubtotal) {
						oSubtotal[sField] = fSubtotal.toFixed(2);
						if (sField === "Accural_Basis" || sField === "Discharge_Liabilty") {
							const fAccural = parseFloat(oSubtotal.Accural_Basis) || 0;
							const fDischarge = parseFloat(oSubtotal.Discharge_Liabilty) || 0;
							oSubtotal.Cash_Basis = (fAccural - fDischarge).toFixed(2);
						}
					}
				});
				const oTotalSection = aForm9A.find(function (oSection) {
					return oSection.IsTotal === "X";
				});
				if (oTotalSection) {
					(oTotalSection.Form9Ahead_9AItem || []).forEach(function (oTotalRow) {
						let fTotal = 0;
						if (oTotalRow.SubSno === "0001") {
							fTotal = Object.values(oSectionTotals).reduce(function (sum, value) {
								return sum + value;
							}, 0);
						} else if (oTotalRow.SubSno === "0002") {
							fTotal = (oSectionTotals["0001"] || 0) + (oSectionTotals["0002"] || 0);
						} else if (oTotalRow.SubSno === "0003") {
							fTotal = oSectionTotals["0003"] || 0;
						}
						oTotalRow[sField] = fTotal.toFixed(2);
					});
					(oTotalSection.Form9Ahead_9AItem || []).forEach(function (oTotalRow) {
						const fAccural = parseFloat(oTotalRow.Accural_Basis) || 0;
						const fDischarge = parseFloat(oTotalRow.Discharge_Liabilty) || 0;
						oTotalRow.Cash_Basis = (fAccural - fDischarge).toFixed(2);
					});
				}
			});
			oViewModel.setProperty("/catalog/Form9A", aForm9A);
		},

		// added for attachment handling
		fileUploadwithTable: function () {

			var oModel = this.getModel(),
				aAttachments = this.oItemsProcessor,
				sUrl = oModel.sServiceUrl;

			console.log("Attachments URL", sUrl);

			if (aAttachments && aAttachments.length > 0) {
				this.iNoOfAttachments = aAttachments.length;
				this.iUploadCount = 0;
				this.isAttachmentFail = false;
				this.sUploadMessage = "";

				for (var i = 0; i < aAttachments.length; i++) {

					var oAttachment = aAttachments[i].item;

					oAttachment.addHeaderField(
						new Item({
							key: "slug",
							text: this._TariffID + "/" +
								this._FormID + "/" +
								this._FiscalYear + "/" +
								oAttachment.getFileName()
						})
					);

					oAttachment.addHeaderField(
						new Item({
							key: "X-CSRF-Token",
							text: oModel.getSecurityToken()
						})
					);

					this.oUploadPluginInstance.setUploadUrl(
						sUrl + "/AttachmentSet"
					);

					aAttachments[i].resolve(oAttachment);
				}
			}
		},

		onPluginActivated: function (oEvent) {
			console.log("FORM 9A onPluginActivated CALLED");

			this.oItemsProcessor = [];
			this.iNoOfAttachments = 0;
			this.iUploadCount = 0;
			this.sUploadMessage = "";

			this.oUploadPluginInstance = oEvent.getParameter("oPlugin");

			var oUploadActionBtn = this.byId("uploadButton"),
				oUploadBtn = oUploadActionBtn.getAggregation("_actionButton");

			oUploadBtn.setIcon("sap-icon://upload");
			oUploadBtn.setStyle("Emphasized");
			oUploadBtn.setIconFirst(true);
		},

		itemValidationCallback: function (oItemInfo) {

			var oItemDetails = oItemInfo.oItem,
				oViewModel = this.getModel("viewModel"),
				aAttachmentList = oViewModel.getProperty("/attachmentList") || [];

			if (
				oItemDetails.getFileName() !== null &&
				oItemDetails.getFileName() !== undefined &&
				oItemDetails.getFileName().endsWith(".msg")
			) {
				let fileType = "application/vnd.ms-outlook";
				oItemDetails.setMediaType(fileType);
			}

			aAttachmentList.push({
				"Filename": oItemDetails.getFileName(),
				"Mimetype": oItemDetails.getMediaType(),
				"updatedby": sap.ushell.Container.getUser().getFullName(),
				"updatedon": this.formatDate(new Date())
			});

			oViewModel.setProperty("/attachmentList", aAttachmentList);

			const { oItem } = oItemInfo;

			var oItemPromise = new Promise((resolve, reject) => {

				this.oItemsProcessor.push({
					item: oItem,
					resolve: resolve,
					reject: reject
				});

			});


			this.checkMalwareValidation(oItemInfo);

			return oItemPromise;
		},
		checkMalwareValidation: function (oItemInfo) {

			var oResourceBundle = this.getResourceBundle(),
				oFileObject = oItemInfo.oItem.getFileObject();

			if (oFileObject) {

				var reader = new FileReader();

				reader.onload = function (event) {

					var aArrayBuffer = event.currentTarget.result;
					var sBinaryString = this.convertArratBufferToBinary(aArrayBuffer);

					var sUrl = this.getBaseURL() + "/malware_api/scan";

					BusyIndicator.show();

					jQuery.ajax({
						url: sUrl,
						type: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						data: sBinaryString,

						success: function (oResp) {

							if (oResp.malwareDetected) {

								this.removeMalwareFile();

								messenger.error(
									oResourceBundle.getText("malwareFileDetectedErrorMsg")
								);

							} else {
								BusyIndicator.hide();
							}

						}.bind(this),

						error: function () {

							BusyIndicator.hide();

							this.removeMalwareFile();

							messenger.error(
								oResourceBundle.getText("malwareScanFailedErrorMsg")
							);

						}.bind(this)
					});

				}.bind(this);

				reader.readAsArrayBuffer(oFileObject);
			}
		},
		convertArratBufferToBinary: function (aArrayBufferObject) {

			var binary = "";

			const bytes = new Uint8Array(aArrayBufferObject);
			const len = bytes.byteLength;

			for (let i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i]);
			}

			return binary;
		},
		removeMalwareFile: function () {

			var oViewModel = this.getModel("viewModel"),
				aAttachmentList = oViewModel.getProperty("/attachmentList");

			aAttachmentList.pop();
			this.oItemsProcessor.pop();

			oViewModel.setProperty("/attachmentList", aAttachmentList);
			oViewModel.refresh();

			BusyIndicator.hide();
		},
		onUploadComplete: function (oEvent) {
			var oResourceBundle = this.getResourceBundle(),
				sStatus = oEvent.getParameter("status");

			this.iUploadCount = this.iUploadCount + 1;

			if (sStatus === 500 || sStatus === 400 || sStatus === 415) {
				this.isAttachmentFail = true;

				var oParser = new DOMParser();
				var oResponse = oParser.parseFromString(
					oEvent.getParameter("response"),
					"text/xml"
				);

				var aMessages = oResponse.getElementsByTagName("message");

				if (aMessages && aMessages.length > 0) {
					var sMessage = aMessages[0].innerHTML;
					this.sUploadMessage = sMessage + "\n";
				}
			}

			if (this.iNoOfAttachments === this.iUploadCount) {
				BusyIndicator.hide();

				if (this.isAttachmentFail) {
					messenger.error(this.sUploadMessage);
				}
			}
		},

		getAttachments: function () {
			var oViewModel = this.getModel("viewModel"),
				oModel = this.getModel();

			var aFilters = [
				new Filter("reqno", FilterOperator.EQ, this._TariffID),
				new Filter("dateh", FilterOperator.EQ, this._FiscalYear),
				new Filter("Formid", FilterOperator.EQ, this._FormID)
			];

			oModel.read("/AttachmentSet", {
				filters: aFilters,

				success: function (oResp) {

					console.log("Form 9A Attachments:", oResp.results);

					var aAttachments = oResp.results || [];

					aAttachments.forEach(function (oAttachment) {

						oAttachment.previewable = true;
						oAttachment.trustedSource = true;

						oAttachment.Url = this.getDownloadUrl(
							oAttachment.reqno,
							"",
							this._FormID,
							oAttachment.srno ? oAttachment.srno.trim() : "",
							oAttachment.Filename
						);

					}.bind(this));

					oViewModel.setProperty("/attachmentList", aAttachments);

				}.bind(this),

				error: function (oError) {

					oViewModel.setProperty("/attachmentList", []);

					messenger.error(
						JSON.parse(oError.responseText).error.message.value
					);

				}.bind(this)
			});
		},
		getDownloadUrl: function (sTariffID, sFiscalYear, sFormID, sSrno, sFileName) {

			var oModel = this.getModel();

			var sUrl =
				oModel.sServiceUrl +
				"/AttachmentSet(" +
				"Formid='" + encodeURIComponent(sFormID) + "'," +
				"dateh=''," +
				"location=''," +
				"flagyn=''," +
				"date=''," +
				"srno='" + encodeURIComponent(sSrno) + "'," +
				"reqno='" + encodeURIComponent(sTariffID) + "'," +
				"Filename='" + encodeURIComponent(sFileName) + "'" +
				")/$value";

			return sUrl;
		},
		openPreview: function (oEvent) {

			const oSource = oEvent.getSource();
			const oBindingContext = oSource.getBindingContext("viewModel");

			if (oBindingContext && this.oUploadPluginInstance) {
				this.oUploadPluginInstance.openFilePreview(oBindingContext);
			}
		},
		onDeleteAttachment: function (oEvent) {

			var oSource = oEvent.getSource();
			const oContext = oSource.getBindingContext("viewModel");

			var oResourceBundle = this.getResourceBundle(),
				oViewModel = this.getModel("viewModel"),
				sPath = oContext.getPath(),
				objectAtt = oViewModel.getProperty(sPath),
				sFileName = oViewModel.getProperty(sPath + "/Filename"),
				sTitle = oResourceBundle.getText("CONFIRM_TITLE");

			var sMessage = oResourceBundle.getText("removeDocumentWarningMsg", sFileName);

			messenger.confirm(sTitle, sMessage, "Confirm", null, function () {
				this.deleteAttachment(objectAtt);
			}.bind(this));
		},
		deleteAttachment: function (objectAtt) {

			var oResourceBundle = this.getResourceBundle(),
				oModel = this.getModel();

			var sUrl = oModel.createKey("/AttachmentSet", {
				Formid: objectAtt.Formid,
				dateh: objectAtt.dateh,
				location: objectAtt.location,
				flagyn: objectAtt.flagyn,
				date: objectAtt.date,
				srno: objectAtt.srno,
				reqno: objectAtt.reqno,
				Filename: objectAtt.Filename
			});

			BusyIndicator.show();

			oModel.remove(sUrl, {

				success: function () {

					BusyIndicator.hide();

					this.getAttachments();

					messenger.success(
						oResourceBundle.getText("postAttDelSuccMessage")
					);

				}.bind(this),

				error: function (oError) {

					BusyIndicator.hide();

					messenger.error(
						JSON.parse(oError.responseText).error.message.value
					);

				}.bind(this)
			});
		},

		onRemoveAttachment: function (oEvent) {

			var oSource = oEvent.getSource();
			const oContext = oSource.getBindingContext("viewModel");

			this.removeItem(oContext);
		},
		removeItem: function (oContext) {

			var oResourceBundle = this.getResourceBundle(),
				oViewModel = this.getModel("viewModel"),
				sPath = oContext.getPath(),
				sFileName = oViewModel.getProperty(sPath + "/Filename"),
				sTitle = oResourceBundle.getText("CONFIRM_TITLE");

			var sMessage = oResourceBundle.getText("removeDocumentWarningMsg", sFileName);

			messenger.confirm(sTitle, sMessage, "Confirm", null, function () {

				if (sPath.split("/")[2]) {

					var index = sPath.split("/")[2];
					var data = oViewModel.getProperty("/attachmentList");

					this.oItemsProcessor.splice(index, 1);
					data.splice(index, 1);

					oViewModel.setProperty("/attachmentList", data);
					oViewModel.refresh(true);
				}

			}.bind(this));
		},
		onDownloadTemplate: function () {
			var oViewModel = this.getModel("viewModel");
			var aData = oViewModel.getProperty("/catalog/Form9A") || [];
			var aExcelData = [];

			var fnAddRows = function (aItems) {
				aItems.forEach(function (oItem) {
					if (oItem.IsTotal === "X") {
						return;
					}
					aExcelData.push({
						NodeType: "H",
						Text: oItem.Text || "",
						Equipment: oItem.Equipment || "",
						Head_Account: oItem.Head_Account || "",
						Accural_Basis: oItem.Accural_Basis || "",
						Discharge_Liabilty: oItem.Discharge_Liabilty || "",
						Cash_Basis: oItem.Cash_Basis || "",
						Idc: oItem.Idc || "",
						Regulation: oItem.Regulation || "",
						Justification: oItem.Justification || "",
						Admitted_Cost: oItem.Admitted_Cost || ""
					});

					if (oItem.Form9Ahead_9AItem && oItem.Form9Ahead_9AItem.length) {
						// oItem.Form9Ahead_9AItem.forEach(function (oChild) {
						// 	aExcelData.push({
						// 		NodeType: "I",
						// 		Text: oChild.Text || "",
						// 		Equipment: oChild.Equipment || "",
						// 		Head_Account: oChild.Head_Account || "",
						// 		Accural_Basis: oChild.Accural_Basis || "",
						// 		Discharge_Liabilty: oChild.Discharge_Liabilty || "",
						// 		Cash_Basis: oChild.Cash_Basis || "",
						// 		Idc: oChild.Idc || "",
						// 		Regulation: oChild.Regulation || "",
						// 		Justification: oChild.Justification || "",
						// 		Admitted_Cost: oChild.Admitted_Cost || ""
						// 	});
						// });
					}
				});
			};

			fnAddRows(aData);

			var aCols = [
				{
					label: "Node Type",
					property: "NodeType",
					type: "string"
				},
				{
					label: this.getResourceBundle().getText("title1"),
					property: "Text",
					type: "string"
				},
				{
					label: this.getResourceBundle().getText("headOfWork"),
					property: "Equipment",
					type: "string"
				},
				{
					label: this.getResourceBundle().getText("headOfAccount"),
					property: "Head_Account",
					type: "string"
				},
				{
					label: this.getResourceBundle().getText("accuralBasis"),
					property: "Accural_Basis",
					type: "string"
				},
				// {
				// 	label: this.getResourceBundle().getText("unDischargedLiability"),
				// 	property: "Discharge_Liabilty",
				// 	type: "string"
				// },
				// {
				// 	label: this.getResourceBundle().getText("cashBasis"),
				// 	property: "Cash_Basis",
				// 	type: "string"
				// },
				// {
				// 	label: this.getResourceBundle().getText("IDCIncluded"),
				// 	property: "Idc",
				// 	type: "string"
				// },
				{
					label: this.getResourceBundle().getText("regulationUnderWhichClaimed"),
					property: "Regulation",
					type: "string"
				},
				{
					label: this.getResourceBundle().getText("justification"),
					property: "Justification",
					type: "string"
				},
				// {
				// 	label: this.getResourceBundle().getText("admittedCostbyTheCommissionIfAny"),
				// 	property: "Admitted_Cost",
				// 	type: "string"
				// }
			];

			var oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aExcelData,
				fileName: "Form9A.xlsx"
			};

			var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);

			oSpreadsheet.build().finally(function () {
				oSpreadsheet.destroy();
			});
		},
		onFileChange: function (oEvent) {
			var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
			if (!oFile || !window.FileReader) {
				return;
			}
			var that = this;
			var oResourceBundle = this.getResourceBundle();
			var oReader = new FileReader();
			let oViewModel = this.getModel("viewModel");
			let oData = oViewModel.getProperty("/catalog/Form9A");
			let sTotalData = oData.find(i => i.IsTotal === "X");
			let aExistingSections = oData.filter(function (i) {
				return i.IsTotal !== "X";
			});
			var oHeaderMap = {
				Text: oResourceBundle.getText("title1"),
				Equipment: oResourceBundle.getText("headOfWork"),
				Head_Account: oResourceBundle.getText("headOfAccount"),
				Accural_Basis: oResourceBundle.getText("accuralBasis"),
				Discharge_Liabilty: oResourceBundle.getText("unDischargedLiability"),
				Cash_Basis: oResourceBundle.getText("cashBasis"),
				Idc: oResourceBundle.getText("IDCIncluded"),
				Regulation: oResourceBundle.getText("regulationUnderWhichClaimed"),
				Justification: oResourceBundle.getText("justification"),
				Admitted_Cost: oResourceBundle.getText("admittedCostbyTheCommissionIfAny")
			};
			var fnGetValue = function (oRow, sProperty) {
				var sExcelHeader = oHeaderMap[sProperty];
				var vValue;
				if (Object.prototype.hasOwnProperty.call(oRow, sExcelHeader)) {
					vValue = oRow[sExcelHeader];
				} else {
					vValue = oRow[sProperty];
				}
				return vValue === null || vValue === undefined ? "" : String(vValue);
			};
			var fnIsEmpty = function (vValue) {
				return vValue === null || vValue === undefined || String(vValue).trim() === "";
			};
			var fnGetFieldLabel = function (sField) {
				return oHeaderMap[sField] || sField;
			};
			oReader.onload = function (oEvent) {
				try {
					var sData = oEvent.target.result;
					var oWorkbook = XLSX.read(sData, {
						type: "binary"
					});
					var aExcelData = [];
					oWorkbook.SheetNames.forEach(function (sSheetName) {
						var oWorksheet = oWorkbook.Sheets[sSheetName];
						var aSheetData = XLSX.utils.sheet_to_row_object_array(oWorksheet, {
							defval: ""
						});
						aExcelData = aExcelData.concat(aSheetData);
					});
					if (!aExcelData.length) {
						messenger.warning(oResourceBundle.getText("noDataInExcel"));
						return;
					}
					var aForm9A = [];
					var oCurrentParent = null;
					var aErrors = [];
					var iSubSno = 1;
					aExcelData.forEach(function (oRow, iIndex) {
						var iExcelRow = iIndex + 2;
						var sNodeType = String(oRow["Node Type"] || oRow["NodeType"] || "").trim().toUpperCase();
						if (sNodeType !== "H" && sNodeType !== "I") {
							aErrors.push("Excel Row " + iExcelRow + ": Invalid Node Type");
							return;
						}
						var oItem = {
							Text: fnGetValue(oRow, "Text"),
							Equipment: fnGetValue(oRow, "Equipment"),
							Head_Account: fnGetValue(oRow, "Head_Account"),
							Accural_Basis: fnGetValue(oRow, "Accural_Basis"),
							Discharge_Liabilty: "0.00",
							Cash_Basis: "",
							Idc:"",
							Regulation: fnGetValue(oRow, "Regulation"),
							Justification: fnGetValue(oRow, "Justification"),
							Admitted_Cost: ""
						};
						if (sNodeType === "H") {
							if (fnIsEmpty(oItem.Text)) {
								aErrors.push("Excel Row " + iExcelRow + ": Title is mandatory for Header (H) node.");
							}
							oItem.Form9Ahead_9AItem = [];
							var oExistingSection = aExistingSections[aForm9A.length];
							if (oExistingSection) {
								oItem.Sno = oExistingSection.Sno;
							}
							aForm9A.push(oItem);
							oCurrentParent = oItem;
							iSubSno = 1;
						} else if (sNodeType === "I") {
							if (!oCurrentParent) {
								aErrors.push("Excel Row " + iExcelRow + ": Child (I) node found before a Header (H) node.");
								return;
							}
							var aMandatoryFields = [
								"Equipment",
								"Head_Account",
								"Accural_Basis",
								"Regulation",
								"Justification"
							];
							aMandatoryFields.forEach(function (sField) {
								if (fnIsEmpty(oItem[sField])) {
									aErrors.push("Excel Row " + iExcelRow + ": " + fnGetFieldLabel(sField) + " is mandatory.");
								}
							});
							oItem.SubSno = String(iSubSno).padStart(4, "0");
							iSubSno++;
							oCurrentParent.Form9Ahead_9AItem.push(oItem);
						}
					});
					if (aErrors.length > 0) {
						messenger.error("Please correct the following errors:\n\n" + aErrors.join("\n"), {
							title: "Excel Validation Errors"
						});
						return;
					}
					aForm9A.forEach(function (oParent) {
						oParent.Form9Ahead_9AItem.push({
							"Equipment": "SUB_TOTAL",
							"IsSubTotal": "X",
							"SubSno": String(oParent.Form9Ahead_9AItem.length + 1).padStart(4, "0")
						});
					});
					aForm9A.push(JSON.parse(JSON.stringify(sTotalData)));
					that.getModel("viewModel").setProperty("/catalog/Form9A", aForm9A);
					that._calculateForm9ATotals();
					that.getModel("viewModel").refresh(true);
					messenger.success(oResourceBundle.getText("excelUploadSuccess"));
				} catch (oError) {
					messenger.error(oResourceBundle.getText("excelUploadError"));
				}
			};
			oReader.onerror = function () {
				messenger.error(oResourceBundle.getText("excelUploadError"));
			};
			oReader.readAsBinaryString(oFile);
		},

	});
});