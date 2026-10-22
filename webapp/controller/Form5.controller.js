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

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form5", {
		formatter: formatter,
		onInit: function () {
			this.oItemsProcessor = [];
			// this.oUploadPluginInstance = null;

			this.getRouter().getRoute("RouteForm5").attachPatternMatched(this._onRoutePatternMatched, this);
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
			let sTariffID = oArgs.tariffId;
			let sFormID = oArgs.formId;
			this._TariffID = sTariffID;
			this._FormID = sFormID;
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			let sTariffStage = oViewModel.getProperty("/Header/Tariff_Stage");
			// this.getAttachments();
			if (sStatus === "NEW") {
				const oForm5Data = {
					catalog: {
						Form5: []
					}
				};
				oViewModel.setProperty("/catalog/Form5", oForm5Data.catalog.Form5);
				this._loadForm5BackendData(sTariffStage);
				oViewModel.setProperty("/canEdit", true);
			}
			else {
				this._loadSavedForm5Data(sTariffStage);
				oViewModel.setProperty(
					"/canEdit",
					sStatus !== "Submitted"
				);
			}
		},

		_loadSavedForm5Data: function (sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			const sTariffID = this._TariffID;
			const sFormID = "5";
			const aFilters = [
				new Filter(
					"Tarrif_id",
					FilterOperator.EQ,
					sTariffID
				),
				new Filter(
					"Form_id",
					FilterOperator.EQ,
					"5"
				),
				new Filter(
					"Tarrif_period",
					FilterOperator.EQ,
					sTariffPeriod
				),
				new Filter(
					"Flag",
					FilterOperator.EQ,
					"X"
				)
			];
			oModel.read("/Form5HeadSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "Form5head_item/Form5item_subitem"
				},
				success: function (oData) {
					const aBackendHeaders = oData.results || [];
					if (!aBackendHeaders.length) {
						return;
					}
					const oBackendHeader = aBackendHeaders[0];
					const aBackendParents =
						oBackendHeader.Form5head_item &&
							oBackendHeader.Form5head_item.results
							? oBackendHeader.Form5head_item.results
							: [];
					const aForm5 = [];
					aBackendParents.forEach(function (oBackendParent) {
						const aBackendChildren =
							oBackendParent.Form5item_subitem &&
								oBackendParent.Form5item_subitem.results
								? oBackendParent.Form5item_subitem.results
								: [];
						const aUIChildren =
							aBackendChildren.map(function (oChild) {
								return {
									Sno: oChild.Sub_Sno,
									Particulars: oChild.Text,
									Value: oChild.Amount,
									RowType: "CHILD"
								};
							});
						aForm5.push({
							Sno: oBackendParent.Sno,
							Particulars: oBackendParent.Text,
							Value: oBackendParent.Amount,
							RowType: "PARENT",
							Form5head_item: aUIChildren
						});
						oViewModel.setProperty("/Form5Total", oData.results[0].Total)
					}.bind(this));
					oViewModel.setProperty("/catalog/Form5", aForm5);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		_loadForm5BackendData: function (sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			const sTariffID = this._TariffID;
			const sFormID = "5";
			const aFilters = [
				new Filter(
					"Tarrif_id",
					FilterOperator.EQ,
					sTariffID
				),
				new Filter(
					"Form_id",
					FilterOperator.EQ,
					"5"
				),
				new Filter(
					"Tarrif_period",
					FilterOperator.EQ,
					sTariffPeriod
				),
				new Filter(
					"Tarrif_stage",
					FilterOperator.EQ,
					sTariffStage
				),
				new Filter(
					"Flag",
					FilterOperator.EQ,
					""
				)
			];
			oModel.read("/Form5HeadSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "Form5head_item/Form5item_subitem"
				},
				success: function (oData) {
					const aBackendHeaders = oData.results || [];
					if (!aBackendHeaders.length) {
						return;
					}
					const oBackendHeader = aBackendHeaders[0];
					const aBackendParents =
						oBackendHeader.Form5head_item &&
							oBackendHeader.Form5head_item.results
							? oBackendHeader.Form5head_item.results
							: [];
					const aForm5 = [];
					aBackendParents.forEach(function (oBackendParent) {
						const aBackendChildren =
							oBackendParent.Form5item_subitem &&
								oBackendParent.Form5item_subitem.results
								? oBackendParent.Form5item_subitem.results
								: [];
						const aUIChildren =
							aBackendChildren.map(function (oChild) {
								return {
									Sno: oChild.Sub_Sno,
									Particulars: oChild.Text,
									Value: oChild.Value,
									RowType: "CHILD"
								};
							});
						aForm5.push({
							Sno: oBackendParent.Sno,
							Particulars: oBackendParent.Text,
							Form5head_item: aUIChildren,
							RowType: "PARENT",
							Amount: oBackendParent.Value
						});
					}.bind(this));
					oViewModel.setProperty("/catalog/Form5", aForm5);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		onCollapseAll: function () {
			const oTreeTable = this.byId("idForm5Table");
			oTreeTable.collapseAll();
		},

		onCollapseSelection: function () {
			const oTreeTable = this.byId("idForm5Table");
			oTreeTable.collapse(oTreeTable.getSelectedIndices());
		},

		onExpandFirstLevel: function () {
			const oTreeTable = this.byId("idForm5Table");
			oTreeTable.expandToLevel(1);
		},

		onExpandSelection: function () {
			const oTreeTable = this.byId("idForm5Table");
			oTreeTable.expand(oTreeTable.getSelectedIndices());
		},

		handleSaveBtnPress: function () {
			let oModel = this.getModel();
			let sTariffID = this._TariffID;
			let oViewModel = this.getModel("viewModel");
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			let oResourceBundle = this.getResourceBundle();
			let aPayload = this.getPayload("Draft");
			let sTitle = oResourceBundle.getText("CONFIRM_TITLE");
			let sText = oResourceBundle.getText("CONFIRM_TEXT_DRAFT_REQUEST_5", sTariffPeriod);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form5HeadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form5DraftSuccess", sTariffPeriod), () => {
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
			let oViewModel = this.getModel("viewModel");
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			let oResourceBundle = this.getResourceBundle();
			let isValid = this.validateItems();
			if (!isValid) {
				return;
			}
			let aPayload = this.getPayload("Submitted");
			let sTitle = oResourceBundle.getText("CONFIRM_TITLE");
			let sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST_5", sTariffPeriod);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form5HeadSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form5SubmitSuccess", sTariffPeriod), () => {
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
			const aForm5Data = oViewModel.getProperty("/catalog/Form5") || [];
			const sFiscalYear = this._FiscalYear;
			const sTariffID = this._TariffID;
			const aParents = [];
			aForm5Data.forEach(function (oParent) {
				const aSubItems = [];
				const aChildren = oParent.Form5head_item || [];
				aChildren.forEach(function (oChild) {
					aSubItems.push({
						Sub_Sno: oChild.Sno,
						Text: oChild.Particulars,
						Amount: oChild.Value
					});
				});
				aParents.push({
					Sno: oParent.Sno,
					Text: oParent.Particulars,
					Tarrif_id: sTariffID,
					Amount: oParent.Value,
					Form5item_subitem: aSubItems
				});
			});
			return {
				Tarrif_id: sTariffID,
				Status: sStatus,
				Form_id: "5",
				Form5head_item: aParents,
				Total: oViewModel.getProperty("/Form5Total")
			};
		},
		validateItems: function () {
			const oViewModel = this.getModel("viewModel");
			const aParents = oViewModel.getProperty("/catalog/Form5") || [];
			const oResourceBundle = this.getResourceBundle();

			let bValid = true;

			aParents.forEach(function (oParent, iParentIndex) {

				// First parent row: Value is mandatory
				if (iParentIndex === 0) {
					if (!String(oParent.Value ?? "").trim()) {
						oParent._ValueState = "Error";
						oParent._ValueStateText = oResourceBundle.getText("pleaseEnterValue");
						bValid = false;
					} else {
						oParent._ValueState = "None";
						oParent._ValueStateText = "";
					}
				}

				const aChildren = oParent.Form5head_item || [];

				aChildren.forEach(function (oChild, iChildIndex) {

					// First child of the first parent: Value is mandatory
					if (iParentIndex === 0 && iChildIndex === 0) {
						if (!String(oChild.Value ?? "").trim()) {
							oChild._ValueState = "Error";
							oChild._ValueStateText = oResourceBundle.getText("pleaseEnterValue");
							bValid = false;
						} else {
							oChild._ValueState = "None";
							oChild._ValueStateText = "";
						}
					}
				}, this);
			}, this);

			oViewModel.refresh(true);

			if (!bValid) {
				messenger.error(
					oResourceBundle.getText("pleaseFillAllMandatoryFields")
				);
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
			console.log("FORM 5 onPluginActivated CALLED");

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

					console.log("Form 5 Attachments:", oResp.results);

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
		calculateForm5Total: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const aForm5 = oViewModel.getProperty("/catalog/Form5") || [];
			const oInput = oEvent.getSource();
			const sValue = String(oInput.getValue()).trim();
			const oResourceBundle = this.getResourceBundle();
			const oRegex = /^\d+(\.\d{1,2})?$/;
			if (sValue !== "" && !oRegex.test(sValue)) {
				oInput.setValueState("Error");
				oInput.setValueStateText(oResourceBundle.getText("decimalError"));
				oInput.setValue("");
				return;
			}
			oInput.setValueState("None");
			oInput.setValueStateText("");
			let nTotal = 0;
			aForm5.forEach(function (oParent) {
				const nValue = String(oParent.Value ?? "").trim();
				if (nValue !== "" && oRegex.test(nValue)) {
					nTotal += Number(nValue);
				}
			});
			oViewModel.setProperty("/Form5Total", nTotal.toFixed(2));
		},
		removeValueState: function (oEvent) {
			const oInput = oEvent.getSource();
			const oContext = oInput.getBindingContext("viewModel");
			if (!oContext) {
				return;
			}
			const oViewModel = this.getModel("viewModel");
			const sPath = oContext.getPath();
			oViewModel.setProperty(sPath + "/_ValueState", "None");
			oViewModel.setProperty(sPath + "/_ValueStateText", "");
		},
	});
});                                                                                                                                                   