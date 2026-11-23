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
		"com.nhpc.zsdtarifformss1.controller.Form18",
		{

			formatter: formatter,

			onInit: function () {

				this.oItemsProcessor = [];

				this.getRouter().getRoute("RouteForm18").attachPatternMatched(this._onRoutePatternMatched, this);
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
					this._loadInitialForm18Data();
				} else {
					this._loadSavedForm18Data();
				}
			},

			_loadInitialForm18Data: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");

				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, ""),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Flag", FilterOperator.EQ, ""),
					new Filter("Fisical_Year", FilterOperator.EQ, this._FiscalYear),
				];

				BusyIndicator.show(0);

				oModel.read("/Form18HeaderSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "Form18head_item"
					},

					success: function (oData) {
						BusyIndicator.hide();

						var aResults = oData.results || [];

						if (!aResults.length) {
							oViewModel.setProperty("/Form18", []);
							return;
						}
						var oHeader = aResults[0].Form18head_item.results;
						let oForm18Items = oHeader.map((line) => ({
							Sno: line.Sno,
							particulars: line.Particulars,
							year: line.Fisical_Year,
							unitRate: line.Unit_Rate,
							noOfUnits: line.No_of_Units,
							amountClaimed: line.Amount_Claimed
						}))
						oViewModel.setProperty("/Form18", oForm18Items);
						oViewModel.setProperty("/Form18/Remarks", "");
					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);
					}
				});
			},

			_loadSavedForm18Data: function () {
				var oModel = this.getModel();
				var oViewModel = this.getModel("viewModel");
				var aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, this._TariffID),
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, this._Plant),
					new Filter("Flag", FilterOperator.EQ, "X"),
					new Filter("Fisical_Year", FilterOperator.EQ, this._FiscalYear),
				];
				BusyIndicator.show(0);
				oModel.read("/Form18HeaderSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "Form18head_item"
					},
					success: function (oData) {
						BusyIndicator.hide();
						var aResults = oData.results || [];

						if (!aResults.length) {
							return;
						}
						var oHeader = aResults[0].Form18head_item.results;
						let oForm18Items = oHeader.map((line) => ({
							Sno: line.Sno,
							particulars: line.Particulars,
							year: line.Fisical_Year,
							unitRate: line.Unit_Rate,
							noOfUnits: line.No_of_Units,
							amountClaimed: line.Amount_Claimed
						}))
						oViewModel.setProperty("/Form18", oForm18Items);
						oViewModel.setProperty("/Form18/Remarks", aResults[0].Remarks);
					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();
						messenger.error(JSON.parse(oError.responseText).error.message.value);
					}
				});
			},

			handleSaveBtnPress: function () {

				const oModel = this.getModel();
				const oResourceBundle = this.getResourceBundle();
				// for draft
				const aPayload = this.getPayload("D");
				messenger.confirm(oResourceBundle.getText("CONFIRM_TITLE"), this.getText("CONFIRM_TEXT_DRAFT_REQUEST_18", this._FiscalYear), "Confirm", null, function () {

					BusyIndicator.show(0);

					oModel.create("/Form18HeaderSet", aPayload, {

						success: function () {
							this.fileUploadwithTable();

							BusyIndicator.hide();

							messenger.success(this.getText("form18DraftSuccess", this._FiscalYear), function () {

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
				// if (!this._validateForm18()) {
				// 	return;
				// }
				const oModel = this.getModel();
				const oResourceBundle = this.getResourceBundle();
				const aPayload = this.getPayload("Submitted");
				messenger.confirm(oResourceBundle.getText("CONFIRM_TITLE"), this.getText("CONFIRM_TEXT_FINAL_REQUEST_18", this._FiscalYear), "Confirm", null, function () {
					BusyIndicator.show(0);
					oModel.create("/Form18HeaderSet", aPayload, {
						success: function () {
							this.fileUploadwithTable();
							BusyIndicator.hide();
							messenger.success(this.getText("form18SubmitSuccess", this._FiscalYear), function () {

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
				var oForm18 = oViewModel.getProperty("/Form18") || {};
				let oHeader = oViewModel.getProperty("/Header");
				let oFisicalYear = this._FiscalYear;
				var aItems = oForm18 || [];

				var aForm18Items = aItems.map(function (oItem) {
					return {
						Tarrif_id: oHeader.Tariff_ID,
						Plant: oHeader.Plant,
						Form_id: "18",
						Fisical_Year: oFisicalYear,
						Sno: oItem.Sno,
						Particulars: oItem.particulars,
						Fisical_Year: oItem.year,
						Unit_Rate: oItem.unitRate,
						No_of_Units: oItem.noOfUnits,
						Amount_Claimed: oItem.amountClaimed,
						Status: sStatus
					};
				}.bind(this));

				return {
					Tarrif_id: this._TariffID,
					Plant: oHeader.Plant,
					Form_id: this._FormID,
					Company: oForm18.Company,
					Remarks: oForm18.Remarks,
					Generating_Station: oForm18.Generating_Station,
					Installed_Capacity: oForm18.Installed_Capacity,
					Fisical_Year: this._FiscalYear,
					Status: sStatus,
					Form18head_item: aForm18Items
				};
			},


			_validateForm18: function () {
				var oViewModel = this.getModel("viewModel");
				var oForm18 = oViewModel.getProperty("/Form18") || {};
				var bIsValid = true;
				return bIsValid;
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

			onNumberChange: function (oEvent) {
				let oInput = oEvent.getSource();
				let sValue = oEvent.getParameter("value");
				sValue = sValue.replace(/[^0-9.]/g, "");
				let aParts = sValue.split(".");
				if (aParts.length > 2) {
					sValue = aParts[0] + "." + aParts.slice(1).join("");
				}
				oInput.setValue(sValue);
			}

		}
	);
});