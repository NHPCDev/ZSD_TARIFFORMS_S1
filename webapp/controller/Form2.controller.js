sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
	"com/nhpc/zsdtarifformss1/util/formatter",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Item",
	"sap/ui/core/ValueState",
], function (BaseController, messenger, formatter, BusyIndicator, Filter, FilterOperator, Item, ValueState) {
	"use strict";

	return BaseController.extend(
		"com.nhpc.zsdtarifformss1.controller.Form2",
		{

			formatter: formatter,

			onInit: function () {

				this.oItemsProcessor = [];

				this.getRouter().getRoute("RouteForm2").attachPatternMatched(this._onRoutePatternMatched, this);
			},

			onAfterRendering: function () {
				this.getView().addStyleClass("sapUiSizeCompact");
			},


			_onRoutePatternMatched: function (oEvent) {

				const oViewModel = this.getModel("viewModel");
				const oArgs = oEvent.getParameter("arguments");
				this._Plant = oViewModel.getProperty("/Header/Plant");

				oViewModel.setProperty("/attachmentList", []);

				const sStatus = oArgs.Status;
				const sSelectedYear = oArgs.Fisical_Year;
				const sTariffID = oArgs.tariffId;
				const sFormID = oArgs.formId;

				this._FiscalYear = sSelectedYear;
				this._TariffID = sTariffID;
				this._FormID = sFormID;

				oViewModel.setProperty("/Status", sStatus);

				this.getAttachments();

				oViewModel.setProperty("/canEdit", sStatus !== "Submitted");

				if (sStatus === "NEW") {
					this._loadInitialForm2Data();
				} else {
					this._loadSavedForm2Data();
				}
			},


			_loadInitialForm2Data: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");

				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, ""),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Fisical_Year", FilterOperator.EQ, this._FiscalYear),
					new Filter("Flag", FilterOperator.EQ, "")
				];

				BusyIndicator.show(0);

				oModel.read("/Form2_HeaderSet", {
					filters: aFilters,

					urlParameters: {
						"$expand": "Form2head_item/Form2item_subitem"
					},

					success: function (oData) {
						BusyIndicator.hide();

						var aResults = oData.results || [];

						if (!aResults.length) {
							oViewModel.setProperty("/Form2", {
								Items: []
							});
							return;
						}

						var oHeader = aResults[0];

						var aBackendItems = oHeader.Form2head_item && oHeader.Form2head_item.results ? oHeader.Form2head_item.results : [];

						// First backend row contains the dynamic column headers
						var oColumnHeader = aBackendItems.find(function (oItem) {
							return String(oItem.Sno || "").trim().toUpperCase() === "SNO";
						}) || {};

						oViewModel.setProperty("/Form2ColumnHeaders", {
							Existing_FY: oColumnHeader.Existing_FY || "Existing",
							Fisical_year1: oColumnHeader.Fisical_year1 || "",
							Fisical_year2: oColumnHeader.Fisical_year2 || "",
							Fisical_year3: oColumnHeader.Fisical_year3 || "",
							Fisical_year4: oColumnHeader.Fisical_year4 || "",
							Fisical_year5: oColumnHeader.Fisical_year5 || ""
						});

						var aItems = this._mapForm2Items(aBackendItems);

						oViewModel.setProperty("/Form2", {
							Tarrif_id: oHeader.Tarrif_id,
							Form_id: oHeader.Form_id,
							Sno: oHeader.Sno,
							Fisical_Year: oHeader.Fisical_Year,
							Company: oHeader.Company,
							Generating_Station: oHeader.Generating_Station,
							Plant: oHeader.Plant,
							Status: oHeader.Status,
							Text: oHeader.Text || "",
							Flag: oHeader.Flag,
							Items: aItems
						});

						console.log("Initial Form 2 header:", oHeader);

					}.bind(this),

					error: function (oError) {

						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);

					}.bind(this)
				});
			},

			_loadSavedForm2Data: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");

				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, this._TariffID),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Fisical_Year", FilterOperator.EQ, this._FiscalYear),
					new Filter("Flag", FilterOperator.EQ, "X")
				];

				BusyIndicator.show(0);

				oModel.read("/Form2_HeaderSet", {
					filters: aFilters,

					urlParameters: {
						"$expand": "Form2head_item/Form2item_subitem"
					},

					success: function (oData) {
						BusyIndicator.hide();

						var aResults = oData.results || [];

						if (!aResults.length) {
							oViewModel.setProperty("/Form2", {
								Items: []
							});
							return;
						}

						var oHeader = aResults[0];

						var aBackendItems = oHeader.Form2head_item && oHeader.Form2head_item.results ? oHeader.Form2head_item.results : [];

						// First backend row contains the dynamic column headers
						var oColumnHeader = aBackendItems.find(function (oItem) {
							return String(oItem.Sno || "").trim().toUpperCase() === "SNO";
						}) || {};

						oViewModel.setProperty("/Form2ColumnHeaders", {
							Existing_FY: oColumnHeader.Existing_FY || "Existing",
							Fisical_year1: oColumnHeader.Fisical_year1 || "",
							Fisical_year2: oColumnHeader.Fisical_year2 || "",
							Fisical_year3: oColumnHeader.Fisical_year3 || "",
							Fisical_year4: oColumnHeader.Fisical_year4 || "",
							Fisical_year5: oColumnHeader.Fisical_year5 || ""
						});

						var aItems = this._mapForm2Items(aBackendItems);

						oViewModel.setProperty("/Form2", {
							Tarrif_id: oHeader.Tarrif_id,
							Form_id: oHeader.Form_id,
							Sno: oHeader.Sno,
							Fisical_Year: oHeader.Fisical_Year,
							Company: oHeader.Company,
							Generating_Station: oHeader.Generating_Station,
							Plant: oHeader.Plant,
							Status: oHeader.Status,
							Text: oHeader.Text || "",
							Flag: oHeader.Flag,
							Items: aItems
						});

						console.log("Saved Form 2 header:", oHeader);
					}.bind(this),

					error: function (oError) {

						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);

					}.bind(this)
				});
			},

			_mapForm2Items: function (aBackendItems) {
				aBackendItems = aBackendItems || [];

				// Remove the template/header row returned by the backend.
				var aDataItems = aBackendItems.filter(function (oItem) {
					return String(oItem.Sno || "").trim().toUpperCase() !== "SNO";
				});

				return aDataItems.map(function (oParent) {
					var aBackendChildren =
						oParent.Form2item_subitem &&
							oParent.Form2item_subitem.results
							? oParent.Form2item_subitem.results
							: [];

					var aChildren = aBackendChildren.map(function (oChild) {
						return {
							Sno: oChild.Sno,
							Sub_Sno: oChild.Sub_Sno,
							Text: oChild.Text,
							Units: oChild.Units,
							Existing_FY: oChild.Existing_FY,
							Fisical_year1: oChild.Fisical_year1,
							Fisical_year2: oChild.Fisical_year2,
							Fisical_year3: oChild.Fisical_year3,
							Fisical_year4: oChild.Fisical_year4,
							Fisical_year5: oChild.Fisical_year5
						};
					});

					return {
						Sno: oParent.Sno,
						Text: oParent.Text,
						Units: oParent.Units,
						Existing_FY: oParent.Existing_FY,
						Fisical_year1: oParent.Fisical_year1,
						Fisical_year2: oParent.Fisical_year2,
						Fisical_year3: oParent.Fisical_year3,
						Fisical_year4: oParent.Fisical_year4,
						Fisical_year5: oParent.Fisical_year5,
						Form2item_subitem: aChildren
					};
				});
			},

			handleSaveBtnPress: function () {
				var oModel = this.getModel();
				var oResourceBundle = this.getResourceBundle();

				var aPayload = this.getPayload("Draft");

				messenger.confirm( oResourceBundle.getText("CONFIRM_TITLE"), this.getText("confirmationMsgDraftF2", this._FiscalYear), "Confirm", null, function () {

						BusyIndicator.show(0);
						console.log("Form 2 Draft Payload:", aPayload);

						oModel.create("/Form2_HeaderSet", aPayload, {
							success: function () {
								this.fileUploadwithTable();
								BusyIndicator.hide();

								messenger.success(this.getText("form2DraftSuccess", this._FiscalYear), function () {

									this.getRouter().navTo("RouteDetail", { tariffId: this._TariffID }, {}, true);

								}.bind(this));
							}.bind(this),

							error: function (oError) {

								BusyIndicator.hide();
								messenger.error(JSON.parse(oError.responseText).error.message.value);

							}.bind(this)
						});
					}.bind(this)
				);
			},

			handleSubmitBtnPress: function () {
				var oModel = this.getModel();
				var oResourceBundle = this.getResourceBundle();

				var aPayload = this.getPayload("Submitted");

				messenger.confirm(oResourceBundle.getText("CONFIRM_TITLE"), this.getText("confirmationMsgSubmitF2", this._FiscalYear), "Confirm", null, function () {
					BusyIndicator.show(0);

					console.log("Form 2 Submit Payload:", aPayload);

					oModel.create("/Form2_HeaderSet", aPayload, {
						success: function () {
							this.fileUploadwithTable();
							BusyIndicator.hide();

							messenger.success(this.getText("form2SubmitSuccess", this._FiscalYear), function () {

								this.getRouter().navTo("RouteDetail", { tariffId: this._TariffID }, {}, true);

							}.bind(this));
						}.bind(this),

						error: function (oError) {

							BusyIndicator.hide();
							messenger.error(JSON.parse(oError.responseText).error.message.value);

						}.bind(this)
					});
				}.bind(this)
				);
			},

			getPayload: function (sStatus) {
				var oViewModel = this.getModel("viewModel");
				var oForm2 = oViewModel.getProperty("/Form2") || {};
				var aItems = oForm2.Items || [];

				var aForm2Items = aItems.map(function (oItem) {
					var aChildren = oItem.Form2item_subitem || [];

					var aSubItems = aChildren.map(function (oChild) {
						return {
							Sub_Sno: oChild.Sub_Sno,
							Form_id: this._FormID,
							Text: oChild.Text,
							Units: oChild.Units,
							Fisical_Year: this._FiscalYear,
							Existing_FY: oChild.Existing_FY,
							Fisical_year1: oChild.Fisical_year1,
							Fisical_year2: oChild.Fisical_year2,
							Fisical_year3: oChild.Fisical_year3,
							Fisical_year4: oChild.Fisical_year4,
							Fisical_year5: oChild.Fisical_year5,
							Status: sStatus
						};
					}.bind(this));

					return {
						Tarrif_id: this._TariffID,
						Sno: oItem.Sno,
						Form_id: this._FormID,
						Text: oItem.Text,
						Units: oItem.Units,
						Fisical_Year: this._FiscalYear,
						Existing_FY: oItem.Existing_FY,
						Fisical_year1: oItem.Fisical_year1,
						Fisical_year2: oItem.Fisical_year2,
						Fisical_year3: oItem.Fisical_year3,
						Fisical_year4: oItem.Fisical_year4,
						Fisical_year5: oItem.Fisical_year5,
						Status: sStatus,
						Form2item_subitem: aSubItems
					};
				}.bind(this));

				return {
					Tarrif_id: this._TariffID,
					Form_id: this._FormID,
					Sno: oForm2.Sno || "",
					Fisical_Year: this._FiscalYear,
					Company: oForm2.Company,
					Generating_Station: oForm2.Generating_Station,
					Text: oForm2.Text,
					Plant: this._Plant,
					Status: sStatus,
					Flag: "",
					Form2head_item: aForm2Items
				};
			},


			// _validateForm15A: function () {
			// 	var oViewModel = this.getModel("viewModel");
			// 	var oForm15A = oViewModel.getProperty("/Form15A") || {};
			// 	var aItems = oForm15A.Items || [];
			// 	var bIsValid = true;

			// 	// Validate every MW Continuous row
			// 	aItems.forEach(function (oItem) {
			// 		var bMissing = !String(oItem.Mw_Continuos || "").trim();

			// 		oItem.Mw_ContinuosValueState = bMissing ? "Error" : "None";
			// 		oItem.Mw_ContinuosValueStateText = bMissing
			// 			? "MW Continuous is mandatory"
			// 			: "";

			// 		if (bMissing) {
			// 			bIsValid = false;
			// 		}
			// 	});

			// 	// Validate Remark
			// 	var bRemarkMissing = !String(oForm15A.Remarks || "").trim();

			// 	oForm15A.RemarksValueState = bRemarkMissing ? "Error" : "None";
			// 	oForm15A.RemarksValueStateText = bRemarkMissing
			// 		? "Remark is mandatory"
			// 		: "";

			// 	if (bRemarkMissing) {
			// 		bIsValid = false;
			// 	}

			// 	// Refresh the model with validation states
			// 	oViewModel.setProperty("/Form15A/Items", aItems);
			// 	oViewModel.setProperty("/Form15A/RemarksValueState", oForm15A.RemarksValueState);
			// 	oViewModel.setProperty("/Form15A/RemarksValueStateText", oForm15A.RemarksValueStateText);

			// 	if (!bIsValid) {
			// 		messenger.error(this.getText("form15AMandatoryFieldsError"));
			// 	}

			// 	return bIsValid;
			// },

			// _calculateTotalMwContinuous: function () {
			// 	var oViewModel = this.getModel("viewModel");
			// 	var aItems = oViewModel.getProperty("/Form15A/Items") || [];

			// 	var fTotal = aItems.reduce(function (fSum, oItem) {
			// 		var sValue = String(oItem.Mw_Continuos || "").trim();
			// 		var fValue = parseFloat(sValue);

			// 		return fSum + (isNaN(fValue) ? 0 : fValue);
			// 	}, 0);

			// 	oViewModel.setProperty("/Form15A/TotalMwContinuous", fTotal.toFixed(2));
			// },

			// onInputChangeMwContinuos: function (oEvent) {
			// 	var oSrc = oEvent.getSource();
			// 	var sValue = oEvent.getParameter("value");

			// 	if (sValue && sValue.trim()) {
			// 		oSrc.setValueState(ValueState.None);
			// 		oSrc.setValueStateText(null);
			// 	}

			// 	this._calculateTotalMwContinuous();
			// },







			// added for attachment handling
			fileUploadwithTable: function () {

				var oModel = this.getModel(),
					aAttachments = this.oItemsProcessor,
					sUrl = oModel.sServiceUrl;

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
								messenger.error(oResourceBundle.getText("malwareScanFailedErrorMsg"));

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

						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);

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

				var objectAtt = oContext.getObject();

				var oResourceBundle = this.getResourceBundle(),
					oViewModel = this.getModel("viewModel"),
					sPath = oContext.getPath(),
					objectAtt = oViewModel.getProperty(sPath),
					sFileName = oViewModel.getProperty(sPath + "/Filename"),
					sTitle = oResourceBundle.getText("CONFIRM_TITLE");

				var sMessage = oResourceBundle.getText("removeDocumentWarningMsg", [objectAtt.Filename]);

				messenger.confirm(sTitle, sMessage, "Confirm", null, function () {
					this.deleteAttachment(objectAtt);
				}.bind(this));
			},
			deleteAttachment: function (objectAtt) {
				console.log("Deleting attachment:", objectAtt);

				var oResourceBundle = this.getResourceBundle(),
					oModel = this.getModel();

				var sUrl = oModel.createKey("/AttachmentSet", {
					Formid: this._FormID,
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

						messenger.success(oResourceBundle.getText("postAttDelSuccMessage"));

					}.bind(this),

					error: function (oError) {

						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);

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

				var sMessage = oResourceBundle.getText("removeDocumentWarningMsg", [sFileName]);

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






		}
	);
});