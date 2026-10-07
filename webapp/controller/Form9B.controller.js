sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
	"com/nhpc/zsdtarifformss1/util/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator",
], (BaseController, messenger, formatter, Filter, FilterOperator, BusyIndicator) => {
	"use strict";

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form9B", {
		formatter: formatter,
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
				const oForm9BData = {
					catalog: {
						Form9B: []
					}
				};
				oViewModel.setProperty("/catalog/Form9B", oForm9BData.catalog.Form9B);
				this._loadForm9BBackendData(sSelectedYear, sTariffPeriod, sTariffStage);
				oViewModel.setProperty("/canEdit", true);
			}
			else {
				this._loadSavedForm9BData(sTariffStage, sSelectedYear);
				oViewModel.setProperty(
					"/canEdit",
					sStatus !== "Submitted"
				);
			}
		},

		_loadSavedForm9BData: function (sTariffStage, sSelectedYear) {
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
			oModel.read("/Form9BHeadSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "Form9bheaditem/Form9BItem_SubItem"
				},
				success: function (oData) {
					const aBackendHeaders = oData.results || [];
					if (!aBackendHeaders.length) {
						return;
					}
					const oBackendHeader = aBackendHeaders[0];
					const aBackendParents =
						oBackendHeader.Form9bheaditem &&
							oBackendHeader.Form9bheaditem.results
							? oBackendHeader.Form9bheaditem.results
							: [];
					const aForm9B = [];
					aBackendParents.forEach(function (oBackendParent) {
						const aBackendChildren =
							oBackendParent.Form9BItem_SubItem &&
								oBackendParent.Form9BItem_SubItem.results
								? oBackendParent.Form9BItem_SubItem.results
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
						aForm9B.push({
							Sno: oBackendParent.Sno,
							Text: oBackendParent.Text,
							Form9bheaditem: aUIChildren,
							isParent: true,
							IsTotal: oBackendParent.IsTotal
						});
					}.bind(this));
					oViewModel.setProperty("/catalog/Form9B", aForm9B);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		_loadForm9BBackendData: function (sSelectedYear, sTariffPeriod, sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			let aFilters = [
				new Filter("Fisical_Year", FilterOperator.EQ, sSelectedYear),
				new Filter("Form_id", FilterOperator.EQ, "9B"),
				new Filter("Tarrif_period", FilterOperator.EQ, sTariffPeriod),
				new Filter("Tarrif_stage", FilterOperator.EQ, sTariffStage)
			]
			oModel.read("/EquipmentSet", {
				filters: aFilters,
				urlParameters: "$expand=Equipment_h_item",
				success: function (oData) {
					const aEquipment = oData.results || [];
					const aForm9B = oViewModel.getProperty("/catalog/Form9B") || [];
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
							Form9bheaditem: aItems.map(function (oItem) {
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
					debugger;
					oViewModel.setProperty("/catalog/Form9B", sItems);
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

		onForm9BAdd: function () {
			const oTable = this.byId("idForm9BTable");
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
			const bParentSelected = !sParentPath.includes("/Form9bheaditem/");
			if (!bParentSelected) {
				sParentPath = sParentPath.split("/Form9bheaditem/")[0];
			}
			const oParent = oViewModel.getProperty(sParentPath);
			if (oParent.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotAddChildUnderTotal"))
				return;
			}
			let aChildren = oViewModel.getProperty(sParentPath + "/Form9bheaditem") || [];
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
				sParentPath + "/Form9bheaditem",
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
						sParentPath + "/Form9bheaditem/" + iNewChildIndex) {
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
							sParentPath + "/Form9bheaditem/" + iNewChildIndex) {
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

		onForm9BDelete: function () {
			const oTable = this.byId("idForm9BTable");
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
			if (!sPath.includes("/Form9bheaditem/")) {
				messenger.error(oResourceBundle.getText("childRowsError"));
				return;
			}
			if (oSelectedObject.IsSubTotal || oSelectedObject.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotBeRelated"));
				return;
			}
			const aParts = sPath.split("/Form9bheaditem/");
			const sParentPath = aParts[0];
			const iChildIndex = parseInt(aParts[1], 10);
			let aChildren = oViewModel.getProperty(
				sParentPath + "/Form9bheaditem"
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
				sParentPath + "/Form9bheaditem",
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
			let sText = oResourceBundle.getText("CONFIRM_TEXT_DRAFT_REQUEST_9B", sFiscalYear);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form9BHeadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form9BDraftSuccess", sFiscalYear), () => {
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
			let sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST_9B", sFiscalYear);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form9BHeadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form9BSubmitSuccess", sFiscalYear), () => {
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
			const aForm9BData = oViewModel.getProperty("/catalog/Form9B") || [];
			const sFiscalYear = this._FiscalYear;
			const sTariffID = this._TariffID;
			const aParents = [];
			aForm9BData.forEach(function (oParent) {
				const aSubItems = [];
				const aChildren = oParent.Form9bheaditem || [];
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
					Form9BItem_SubItem: aSubItems,
					IsTotal: oParent.IsTotal
				});
			});
			return {
				Fiscal_year: sFiscalYear,
				Tarrif_id: sTariffID,
				Text: "",
				Status: sStatus,
				Form_id: "9B",
				Form9bheaditem: aParents
			};
		},
		validateItems: function () {
			const oViewModel = this.getModel("viewModel");
			const aParents = oViewModel.getProperty("/catalog/Form9B") || [];
			let oResourceBundle = this.getResourceBundle();
			let bValid = true;
			aParents.forEach(function (oParent) {
				const aChildren = oParent.Form9bheaditem || [];
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
			this._calculateForm9BTotals();
		},
		_calculateForm9BTotals: function () {
			const oViewModel = this.getModel("viewModel");
			const aForm9B = oViewModel.getProperty("/catalog/Form9B") || [];
			const aFields = ["Accural_Basis", "Discharge_Liabilty", "Idc", "Admitted_Cost"];
			aFields.forEach(function (sField) {
				const oSectionTotals = {};
				aForm9B.forEach(function (oSection) {
					const aChildren = oSection.Form9bheaditem || [];
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
				const oTotalSection = aForm9B.find(function (oSection) {
					return oSection.IsTotal === "X";
				});
				if (oTotalSection) {
					(oTotalSection.Form9bheaditem || []).forEach(function (oTotalRow) {
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
					(oTotalSection.Form9bheaditem || []).forEach(function (oTotalRow) {
						const fAccural = parseFloat(oTotalRow.Accural_Basis) || 0;
						const fDischarge = parseFloat(oTotalRow.Discharge_Liabilty) || 0;
						oTotalRow.Cash_Basis = (fAccural - fDischarge).toFixed(2);
					});
				}
			});
			oViewModel.setProperty("/catalog/Form9B", aForm9B);
		},
		onFileChange: function (oEvent) {
			var sID = oEvent.getParameter("id");
			this.sFileUploaderID = sID;
			var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
			this.checkMalwareValidationUploadExcel(oFile);
		},

		checkMalwareValidationUploadExcel: function (oFileObject) {
			var oResourceBundle = this.getResourceBundle();
			if (oFileObject) {
				var reader = new FileReader();
				reader.onload = function (event) {
					BusyIndicator.show(0);
					var aArrayBuffer = event.currentTarget.result;
					var sBinaryString = this.convertArratBufferToBinary(aArrayBuffer);
					var sUrl = this.getBaseURL() + "/malware_api/scan";
					this.aArrayBuffer = aArrayBuffer;
					BusyIndicator.show(0);
					jQuery.ajax({
						url: sUrl,
						type: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						data: sBinaryString,
						success: function (oResp) {
							if (oResp.malwareDetected) {
								this.byId(this.sFileUploaderID).clear();
								BusyIndicator.hide();
								messenger.error(oResourceBundle.getText("malwareFileDetectedErrorMsg"));
							} else {
								BusyIndicator.hide();
								this.extractExcelData(this.aArrayBuffer);
							}
						}.bind(this),
						error: function (error) {
							BusyIndicator.hide();
							this.byId(this.sFileUploaderID).clear();
							messenger.error(oResourceBundle.getText("malwareScanFailedErrorMsg"));
						}.bind(this)
					});
				}.bind(this);
				reader.readAsArrayBuffer(oFileObject);
			}
		},

		getBaseURL: function () {
			var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id"),
				appPath = appId.replaceAll(".", "/"),
				appModulePath = jQuery.sap.getModulePath(appPath);
			return appModulePath;
		},

		convertArratBufferToBinary: function (aArrayBufferObject) {
			var binary = '';
			const bytes = new Uint8Array(aArrayBufferObject);
			const len = bytes.byteLength;
			for (let i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return binary;
		},

		extractExcelData: function (oData) {
			BusyIndicator.show(0);
			var workbook = XLSX.read(oData, {
				type: "binary",
			});
			workbook.SheetNames.forEach(
				function (sheetName) {
					if (sheetName !== "Provisional") {
						return;
					}
					var aExcelData = XLSX.utils.sheet_to_row_object_array(
						workbook.Sheets[sheetName]
					);
					BusyIndicator.hide();
					this.processUploadedData(aExcelData);
				}.bind(this)
			);
		},
		processUploadedData: function (aExcelData) {
			var oViewModel = this.getModel("viewModel");
			var aForm9B = oViewModel.getProperty("/catalog/Form9B") || [];
			let oResourceBundle = this.getResourceBundle();
			if (!aExcelData || !aExcelData.length) {
				messenger.error(oResourceBundle.getText("uploadExcelEmptyError"));
				return;
			}
			if (!aForm9B.length) {
				messenger.error(oResourceBundle.getText("form9BBackendError"));
				return;
			}
			var aSelectedRows = aExcelData.filter(function (oExcelRow) {
				var sSection = String(oExcelRow["Section"] || "").trim();
				return sSection !== "";
			});
			var aMandatoryFields = [
				"Section",
				"Head of Work",
				"Head of Account",
				"Accural Basis",
				"Regulation",
				"Justification"
			];
			var aErrors = [];
			for (var i = 0; i < aSelectedRows.length; i++) {
				var oExcelRow = aSelectedRows[i];
				for (var j = 0; j < aMandatoryFields.length; j++) {
					var sField = aMandatoryFields[j];
					var sValue = String(
						oExcelRow[sField] || ""
					).trim();
					if (!sValue) {
						aErrors.push(
							"Row " + (i + 2) +
							": " + sField + " is mandatory."
						);
					}
				}
			}
			if (aErrors.length) {
				messenger.error(aErrors.join("\n"));
				return;
			}
			var mExcelData = {};
			aExcelData.forEach(function (oExcelRow) {
				var sSection = String(oExcelRow["Section"] || "").trim();
				if (!sSection) {
					return;
				}
				mExcelData[sSection] = mExcelData[sSection] || [];
				mExcelData[sSection].push(oExcelRow);
			});
			aForm9B.forEach(function (oParent) {
				var sParentSno = String(oParent.Sno || "").trim();
				var aExcelRows = mExcelData[sParentSno];
				if (!aExcelRows) {
					return;
				}
				var aExistingChildren = oParent.Form9bheaditem || [];
				var aSubTotalRows = aExistingChildren.filter(function (oChild) {
					return oChild.IsSubTotal === "X";
				});
				var aNewChildren = aExcelRows.map(function (oExcelRow, index) {
					return {
						SubSno: String(oExcelRow["Section"] || "").trim(),
						Equipment: oExcelRow["Head of Work"] || "",
						Head_Account: oExcelRow["Head of Account"] || "",
						Accural_Basis: oExcelRow["Accural Basis"] || "",
						Regulation: oExcelRow["Regulation"] || "",
						Justification: oExcelRow["Justification"] || "",
						Discharge_Liabilty: "0.00",
						IsSubTotal: ""
					};
				});
				oParent.Form9bheaditem = aNewChildren.concat(aSubTotalRows);
			});
			oViewModel.setProperty("/catalog/Form9B", aForm9B);
			this._calculateForm9BTotals();
			messenger.success(oResourceBundle.getText("uploadSuccess9B"));
		}
	});
});