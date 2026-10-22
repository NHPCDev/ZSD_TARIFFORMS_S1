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

	return BaseController.extend("com.nhpc.zsdtarifformss1.controller.Form3", {
		formatter: formatter,
		onInit: function () {
			this.oItemsProcessor = [];
			// this.oUploadPluginInstance = null;

			this.getRouter().getRoute("RouteForm3").attachPatternMatched(this._onRoutePatternMatched, this);
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
				const oForm3Data = {
					catalog: {
						Form3: []
					}
				};
				oViewModel.setProperty("/catalog/Form3", oForm3Data.catalog.Form3);
				this._loadForm3BackendData(sTariffStage);
				oViewModel.setProperty("/canEdit", true);
			}
			else {
				this._loadSavedForm3Data(sTariffStage);
				oViewModel.setProperty(
					"/canEdit",
					sStatus !== "Submitted"
				);
			}
		},

		_loadSavedForm3Data: function (sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			const aFilters = [
				new Filter(
					"Tarrif_id",
					FilterOperator.EQ,
					oViewModel.getProperty("/Header/Tariff_ID")
				)
			];
			oModel.read("/Form3_HeaderSet", {
				filters: aFilters,
				success: function (oData) {
					oViewModel.setProperty("/formDetails", oData.results[0]);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		_loadForm3BackendData: function (sTariffStage) {
			const oModel = this.getModel();
			const oViewModel = this.getModel("viewModel");
			const aFilters = [
				new Filter(
					"Plant",
					FilterOperator.EQ,
					"1101"
				)
			];
			oModel.read("/Form3_HeaderSet", {
				filters: aFilters,
				success: function (oData) {
					oViewModel.setProperty("/formDetails", oData.results[0]);
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		onCollapseAll: function () {
			const oTreeTable = this.byId("idForm3Table");
			oTreeTable.collapseAll();
		},

		onCollapseSelection: function () {
			const oTreeTable = this.byId("idForm3Table");
			oTreeTable.collapse(oTreeTable.getSelectedIndices());
		},

		onExpandFirstLevel: function () {
			const oTreeTable = this.byId("idForm3Table");
			oTreeTable.expandToLevel(1);
		},

		onExpandSelection: function () {
			const oTreeTable = this.byId("idForm3Table");
			oTreeTable.expand(oTreeTable.getSelectedIndices());
		},

		onForm3Add: function () {
			const oTable = this.byId("idForm3Table");
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
			const bParentSelected = !sParentPath.includes("/Form3head_item/");
			if (!bParentSelected) {
				sParentPath = sParentPath.split("/Form3head_item/")[0];
			}
			const oParent = oViewModel.getProperty(sParentPath);
			if (oParent.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotAddChildUnderTotal"))
				return;
			}
			let aChildren = oViewModel.getProperty(sParentPath + "/Form3head_item") || [];
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
				sParentPath + "/Form3head_item",
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
						sParentPath + "/Form3head_item/" + iNewChildIndex) {
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
							sParentPath + "/Form3head_item/" + iNewChildIndex) {
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

		onForm3Delete: function () {
			const oTable = this.byId("idForm3Table");
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
			if (!sPath.includes("/Form3head_item/")) {
				messenger.error(oResourceBundle.getText("childRowsError"));
				return;
			}
			if (oSelectedObject.IsSubTotal || oSelectedObject.IsTotal) {
				messenger.error(oResourceBundle.getText("cannotBeRelated"));
				return;
			}
			const aParts = sPath.split("/Form3head_item/");
			const sParentPath = aParts[0];
			const iChildIndex = parseInt(aParts[1], 10);
			let aChildren = oViewModel.getProperty(
				sParentPath + "/Form3head_item"
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
				sParentPath + "/Form3head_item",
				aChildren
			);
			oTable.clearSelection();
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
			let sText = oResourceBundle.getText("CONFIRM_TEXT_DRAFT_REQUEST_3",sTariffPeriod);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form3_HeaderSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form3DraftSuccess", [sTariffPeriod]), () => {
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
			let oViewModel = this.getModel("viewModel");
			let sTariffPeriod = oViewModel.getProperty("/Header/Tariff_Period");
			sTariffPeriod = sTariffPeriod.replace("CERC_", "");
			let isValid = this.validateItems();
			if (!isValid) {
				messenger.error(oResourceBundle.getText("fillAllFieldsErrorMsg"));
				return;
			}
			let aPayload = this.getPayload("Submitted");
			let sTitle = oResourceBundle.getText("CONFIRM_TITLE");
			let sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST_3",sTariffPeriod);
			messenger.confirm(sTitle, sText, "Confirm", null, function () {
				BusyIndicator.show(0);
				oModel.create("/Form3_HeaderSet", aPayload, {
					success: function (oData) {
						messenger.success(oResourceBundle.getText("form3SubmitSuccess", [sTariffPeriod]), () => {
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
			const aFormDetails = oViewModel.getProperty("/formDetails") || [];
			aFormDetails.Tarrif_id = oViewModel.getProperty("/Header/Tariff_ID");
			aFormDetails.Status = sStatus;
			aFormDetails.Form_id = "3";
			delete aFormDetails.__metadata;
			return aFormDetails;
		},
		validateItems: function () {
			let oViewModel = this.getModel("viewModel");
			let oResourceBundle = this.getResourceBundle();
			let bValid = true;
			let oFormDetails = oViewModel.getProperty("/formDetails");
			if(!oFormDetails.River){
				bValid = false;
				oViewModel.setProperty("/valueState/River","Error");
				oViewModel.setProperty("/valueStateText/River",oResourceBundle.getText("riverErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/River","None");
				oViewModel.setProperty("/valueStateText/River","");
			}
			if(!oFormDetails.Size_Shape){
				bValid = false;
				oViewModel.setProperty("/valueState/Size_Shape","Error");
				oViewModel.setProperty("/valueStateText/Size_Shape",oResourceBundle.getText("sizeShapeErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Size_Shape","None");
				oViewModel.setProperty("/valueStateText/Size_Shape","");
			}
			if(!oFormDetails.Length){
				bValid = false;
				oViewModel.setProperty("/valueState/Length","Error");
				oViewModel.setProperty("/valueStateText/Length",oResourceBundle.getText("lengthErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Length","None");
				oViewModel.setProperty("/valueStateText/Length","");
			}
			if(!oFormDetails.Dam_Type){
				bValid = false;
				oViewModel.setProperty("/valueState/Dam_Type","Error");
				oViewModel.setProperty("/valueStateText/Dam_Type",oResourceBundle.getText("damTypeErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Dam_Type","None");
				oViewModel.setProperty("/valueStateText/Dam_Type","");
			}
			if(!oFormDetails.Maximum_Dam_Height){
				bValid = false;
				oViewModel.setProperty("/valueState/Maximum_Dam_Height","Error");
				oViewModel.setProperty("/valueStateText/Maximum_Dam_Height",oResourceBundle.getText("maximumDamHeightErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Maximum_Dam_Height","None");
				oViewModel.setProperty("/valueStateText/Maximum_Dam_Height","");
			}
			if(!oFormDetails.Turbine_Type){
				bValid = false;
				oViewModel.setProperty("/valueState/Turbine_Type","Error");
				oViewModel.setProperty("/valueStateText/Turbine_Type",oResourceBundle.getText("turbineTypeErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Turbine_Type","None");
				oViewModel.setProperty("/valueStateText/Turbine_Type","");
			}
			if(!oFormDetails.Rated_Head){
				bValid = false;
				oViewModel.setProperty("/valueState/Rated_Head","Error");
				oViewModel.setProperty("/valueStateText/Rated_Head",oResourceBundle.getText("ratedHeadErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Rated_Head","None");
				oViewModel.setProperty("/valueStateText/Rated_Head","");
			}
			if(!oFormDetails.Tail_Race_DiameterShape){
				bValid = false;
				oViewModel.setProperty("/valueState/Tail_Race_DiameterShape","Error");
				oViewModel.setProperty("/valueStateText/Tail_Race_DiameterShape",oResourceBundle.getText("tailRaceDiameterShapeErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Tail_Race_DiameterShape","None");
				oViewModel.setProperty("/valueStateText/Tail_Race_DiameterShape","");
			}
			if(!oFormDetails.Tail_Race_Length){
				bValid = false;
				oViewModel.setProperty("/valueState/Tail_Race_Length","Error");
				oViewModel.setProperty("/valueStateText/Tail_Race_Length",oResourceBundle.getText("tailRaceLengthErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Tail_Race_Length","None");
				oViewModel.setProperty("/valueStateText/Tail_Race_Length","");
			}
			if(!oFormDetails.Minimum_tail_waterlevel){
				bValid = false;
				oViewModel.setProperty("/valueState/Minimum_tail_waterlevel","Error");
				oViewModel.setProperty("/valueStateText/Minimum_tail_waterlevel",oResourceBundle.getText("minimumTailWaterLevelErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Minimum_tail_waterlevel","None");
				oViewModel.setProperty("/valueStateText/Minimum_tail_waterlevel","");
			}

			if(!oFormDetails.Switchyard_Type){
				bValid = false;
				oViewModel.setProperty("/valueState/Switchyard_Type","Error");
				oViewModel.setProperty("/valueStateText/Switchyard_Type",oResourceBundle.getText("switchyardTypeErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Switchyard_Type","None");
				oViewModel.setProperty("/valueStateText/Switchyard_Type","");
			}
			if(!oFormDetails.Line_Bays){
				bValid = false;
				oViewModel.setProperty("/valueState/Line_Bays","Error");
				oViewModel.setProperty("/valueStateText/Line_Bays",oResourceBundle.getText("lineBaysErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Line_Bays","None");
				oViewModel.setProperty("/valueStateText/Line_Bays","");
			}
			if(!oFormDetails.Turbine_Generator){
				bValid = false;
				oViewModel.setProperty("/valueState/Turbine_Generator","Error");
				oViewModel.setProperty("/valueStateText/Turbine_Generator",oResourceBundle.getText("turbineGeneratorErrorMsg"));
			} else {
				oViewModel.setProperty("/valueState/Turbine_Generator","None");
				oViewModel.setProperty("/valueStateText/Turbine_Generator","");
			}
			return bValid;
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
		onDownloadTemplate: function () {
			var oViewModel = this.getModel("viewModel");
			var aData = oViewModel.getProperty("/catalog/Form3") || [];
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

					if (oItem.Form3head_item && oItem.Form3head_item.length) {
						// oItem.Form3head_item.forEach(function (oChild) {
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
				fileName: "Form3.xlsx"
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
			let oData = oViewModel.getProperty("/catalog/Form3");
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
					var aForm3 = [];
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
							Idc: "",
							Regulation: fnGetValue(oRow, "Regulation"),
							Justification: fnGetValue(oRow, "Justification"),
							Admitted_Cost: ""
						};
						if (sNodeType === "H") {
							if (fnIsEmpty(oItem.Text)) {
								aErrors.push("Excel Row " + iExcelRow + ": Title is mandatory for Header (H) node.");
							}
							oItem.Form3head_item = [];
							var oExistingSection = aExistingSections[aForm3.length];
							if (oExistingSection) {
								oItem.Sno = oExistingSection.Sno;
							}
							aForm3.push(oItem);
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
							oCurrentParent.Form3head_item.push(oItem);
						}
					});
					if (aErrors.length > 0) {
						messenger.error("Please correct the following errors:\n\n" + aErrors.join("\n"), {
							title: "Excel Validation Errors"
						});
						return;
					}
					aForm3.forEach(function (oParent) {
						oParent.Form3head_item.push({
							"Equipment": "SUB_TOTAL",
							"IsSubTotal": "X",
							"SubSno": String(oParent.Form3head_item.length + 1).padStart(4, "0")
						});
					});
					aForm3.push(JSON.parse(JSON.stringify(sTotalData)));
					that.getModel("viewModel").setProperty("/catalog/Form3", aForm3);
					that._calculateForm3Totals();
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
		calculateForm3Total: function (oEvent) {
			const oViewModel = this.getModel("viewModel");
			const aForm3 = oViewModel.getProperty("/catalog/Form3") || [];
			const oInput = oEvent.getSource();
			const sValue = String(oInput.getValue()).trim();
			const oResourceBundle = this.getResourceBundle();

			// Allow whole numbers or decimals with up to 2 decimal places
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

			aForm3.forEach(function (oParent) {
				const nValue = String(oParent.Value ?? "").trim();

				if (nValue !== "" && oRegex.test(nValue)) {
					nTotal += Number(nValue);
				}
			});

			oViewModel.setProperty("/Form3Total", nTotal.toFixed(2));
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