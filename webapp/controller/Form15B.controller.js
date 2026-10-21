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
		"com.nhpc.zsdtarifformss1.controller.Form15B",
		{

			formatter: formatter,

			onInit: function () {

				this.oItemsProcessor = [];

				this.getRouter().getRoute("RouteForm15B").attachPatternMatched(this._onRoutePatternMatched, this);
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
					this._loadInitialForm15BData();
				} else {
					this._loadSavedForm15BData();
				}
			},

			_loadInitialForm15BData: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");

				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, ""),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Flag", FilterOperator.EQ, "")
				];

				BusyIndicator.show(0);

				oModel.read("/Form15BHeadSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "Form15Bheaditem"
					},

					success: function (oData) {
						BusyIndicator.hide();

						var aResults = oData.results || [];

						if (!aResults.length) {
							oViewModel.setProperty("/Form15B", {
								Items: []
							});
							return;
						}

						var oHeader = aResults[0];

						var aItems = oHeader.Form15Bheaditem &&
							oHeader.Form15Bheaditem.results
							? oHeader.Form15Bheaditem.results
							: [];


						oViewModel.setProperty("/Form15B", {
							Company: oHeader.Company,
							Generating_Station: oHeader.Generating_Station,
							Installed_Capacity: oHeader.Installed_Capacity,
							Status: oHeader.Status,
							Remarks: oHeader.Remarks,
							Items: aItems
						});
						this._calculateTotalMwContinuous();

					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);
					}
				});
			},

			_loadSavedForm15BData: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");

				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, this._TariffID),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Flag", FilterOperator.EQ, "X")
				];

				BusyIndicator.show(0);

				oModel.read("/Form15BHeadSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "Form15Bheaditem"
					},

					success: function (oData) {
						BusyIndicator.hide();
						var aResults = oData.results || [];

						if (!aResults.length) {
							return;
						}

						var oHeader = aResults[0];

						var aItems = oHeader.Form15Bheaditem &&
							oHeader.Form15Bheaditem.results
							? oHeader.Form15Bheaditem.results
							: [];


						oViewModel.setProperty("/Form15B", {
							Company: oHeader.Company,
							Generating_Station: oHeader.Generating_Station,
							Installed_Capacity: oHeader.Installed_Capacity,
							Status: oHeader.Status,
							Remarks: oHeader.Remarks,
							Items: aItems
						});
						this._calculateTotalMwContinuous();

					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);
					}
				});
			},

			// _sortForm15BItems: function (aItems) {
			// 	var aMonthOrder = [
			// 		"APRIL", "MAY", "JUNE", "JULY",
			// 		"AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER",
			// 		"DECEMBER", "JANUARY", "FEBRUARY", "MARCH"
			// 	];

			// 	return aItems.sort(function (a, b) {
			// 		var iMonthA = aMonthOrder.indexOf(
			// 			String(a.Month || "").toUpperCase()
			// 		);
			// 		var iMonthB = aMonthOrder.indexOf(
			// 			String(b.Month || "").toUpperCase()
			// 		);

			// 		if (iMonthA !== iMonthB) {
			// 			return iMonthA - iMonthB;
			// 		}

			// 		return Number(a.Sequence) - Number(b.Sequence);
			// 	});
			// },

			handleSaveBtnPress: function () {

				const oModel = this.getModel();
				const oResourceBundle = this.getResourceBundle();
				// for draft
				const aPayload = this.getPayload("D");
				messenger.confirm(oResourceBundle.getText("CONFIRM_TITLE"), this.getText("confirmationMsgDraft", this._FiscalYear), "Confirm", null, function () {

					BusyIndicator.show(0);

					oModel.create("/Form15BHeadSet", aPayload, {

						success: function () {
							this.fileUploadwithTable();

							BusyIndicator.hide();

							messenger.success(this.getText("form15BDraftSuccess", this._FiscalYear), function () {

								this.getRouter().navTo("RouteDetail", {
									tariffId: this._TariffID
								},
									{},
									true
								);

							}.bind(this)
							);

						}.bind(this),

						error: function (oError) {

							BusyIndicator.hide();
							messenger.error(JSON.parse(oError.responseText).error.message.value);
						}.bind(this)
					}
					);

				}.bind(this)
				);
			},


			handleSubmitBtnPress: function () {
				//validate mandatory fields before submit
				if (!this._validateForm15B()) {
					return;
				}

				const oModel = this.getModel();
				const oResourceBundle = this.getResourceBundle();
				// for submit
				const aPayload = this.getPayload("Submitted");

				messenger.confirm(oResourceBundle.getText("CONFIRM_TITLE"), this.getText("confirmationMsgSubmit", this._FiscalYear), "Confirm", null, function () {

					BusyIndicator.show(0);

					oModel.create("/Form15BHeadSet", aPayload, {

						success: function () {
							this.fileUploadwithTable();
							BusyIndicator.hide();

							messenger.success(this.getText("form15BSubmitSuccess", this._FiscalYear), function () {

								this.getRouter().navTo("RouteDetail", {
									tariffId: this._TariffID
								},
									{},
									true
								);

							}.bind(this)
							);

						}.bind(this),

						error: function (oError) {

							BusyIndicator.hide();
							messenger.error(JSON.parse(oError.responseText).error.message.value);
						}.bind(this)
					}
					);

				}.bind(this)
				);
			},

			getPayload: function (sStatus) {
				var oViewModel = this.getModel("viewModel");
				var oForm15B = oViewModel.getProperty("/Form15B") || {};
				var aItems = oForm15B.Items || [];

				var aForm15BItems = aItems.map(function (oItem) {
					return {
						Tarrif_id: this._TariffID,
						Month: oItem.Month,
						Sequence: oItem.Sequence,
						Design_Energy: oItem.Design_Energy,
						Mw_Continuos: oItem.Mw_Continuos
					};
				}.bind(this));

				return {
					Tarrif_id: this._TariffID,
					Plant: this._Plant,
					Form_id: this._FormID,
					Company: oForm15B.Company,
					Remarks: oForm15B.Remarks,
					Generating_Station: oForm15B.Generating_Station,
					Installed_Capacity: oForm15B.Installed_Capacity,
					Status: sStatus,
					Form15Bheaditem: aForm15BItems
				};
			},


			_validateForm15B: function () {
				var oViewModel = this.getModel("viewModel");
				var oForm15B = oViewModel.getProperty("/Form15B") || {};
				var aItems = oForm15B.Items || [];
				var bIsValid = true;

				// Validate every MW Continuous row
				aItems.forEach(function (oItem) {
					var bMissing = !String(oItem.Mw_Continuos || "").trim();

					oItem.Mw_ContinuosValueState = bMissing ? "Error" : "None";
					oItem.Mw_ContinuosValueStateText = bMissing
						? "MW Continuous is mandatory"
						: "";

					if (bMissing) {
						bIsValid = false;
					}
				});

				// Validate Remark
				var bRemarkMissing = !String(oForm15B.Remarks || "").trim();

				oForm15B.RemarksValueState = bRemarkMissing ? "Error" : "None";
				oForm15B.RemarksValueStateText = bRemarkMissing
					? "Remark is mandatory"
					: "";

				if (bRemarkMissing) {
					bIsValid = false;
				}

				// Refresh the model with validation states
				oViewModel.setProperty("/Form15B/Items", aItems);
				oViewModel.setProperty("/Form15B/RemarksValueState", oForm15B.RemarksValueState);
				oViewModel.setProperty("/Form15B/RemarksValueStateText", oForm15B.RemarksValueStateText);

				if (!bIsValid) {
					messenger.error(this.getText("form15BMandatoryFieldsError"));
				}

				return bIsValid;
			},

			_calculateTotalMwContinuous: function () {
				var oViewModel = this.getModel("viewModel");
				var aItems = oViewModel.getProperty("/Form15B/Items") || [];

				var fTotal = aItems.reduce(function (fSum, oItem) {
					var sValue = String(oItem.Mw_Continuos || "").trim();
					var fValue = parseFloat(sValue);

					return fSum + (isNaN(fValue) ? 0 : fValue);
				}, 0);

				oViewModel.setProperty("/Form15B/TotalMwContinuous", fTotal.toFixed(2));
			},

			onInputChangeMwContinuos: function (oEvent) {
				var oSrc = oEvent.getSource();
				var sValue = oEvent.getParameter("value");

				if (sValue && sValue.trim()) {
					oSrc.setValueState(ValueState.None);
					oSrc.setValueStateText(null);
				}

				this._calculateTotalMwContinuous();
			},







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

						messenger.success(
							oResourceBundle.getText("postAttDelSuccMessage")
						);

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